import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import RoleBasedSidebar from '@/components/ui/RoleBasedSidebar';
import NavigationBreadcrumb from '@/components/ui/NavigationBreadcrumb';
import UserContextHeader from '@/components/ui/UserContextHeader';
import NotificationCenter from '@/components/ui/NotificationCenter';
import Icon from '@/components/AppIcon';
import Button from '@/components/ui/Button';

// Subcomponentes (ya existentes en tu proyecto)
import PayrollCalculationEngine from './components/PayrollCalculationEngine';
import EmployeePayrollGrid from './components/EmployeePayrollGrid';
import PayrollAuditTrail from './components/PayrollAuditTrail';
import BulkProcessingTools from './components/BulkProcessingTools';
import IntegrationStatusPanel from './components/IntegrationStatusPanel';

// Servicios
import { payrollService } from '@/services/payrollService';
import { getEmployeesWithFilters } from '@/services/employeeService';

// Helpers UI mínimos
const LoadingSpinner = () => (
  <div className="min-h-[200px] flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
);

const ErrorBanner = ({ message, onRetry }) => (
  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
    <div className="flex items-center justify-between">
      <div className="flex items-center">
        <Icon name="AlertTriangle" className="text-red-600" size={18} />
        <span className="text-red-700 ml-2">{message}</span>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Reintentar
        </Button>
      )}
    </div>
  </div>
);

const PayrollCalculationAndManagementInterface = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Datos principales
  const [employees, setEmployees] = useState([]);               // [{ id, employeeId, name, ... }]
  const [employeesLoading, setEmployeesLoading] = useState(true);
  const [employeesError, setEmployeesError] = useState('');

  // Selecciones y vista
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);
  const [activeView, setActiveView] = useState('calculation');  // calculation | bulk | audit | integration

  // Estado de procesamiento masivo
  const [processingStatus, setProcessingStatus] = useState(null);

  // Snapshot mínimo de asistencia/nómina del empleado seleccionado (semana actual)
  const [currentAttendance, setCurrentAttendance] = useState(null);
  const [calcLoading, setCalcLoading] = useState(false);
  const [calcError, setCalcError] = useState('');

  // --------- CARGA DE EMPLEADOS (activos) ----------
  const loadEmployees = async () => {
    try {
      setEmployeesLoading(true);
      setEmployeesError('');

      // Usa tu service real. Este método ya lo citaste en otra página:
      // getEmployeesWithFilters({ status: 'active' })
      const res = await getEmployeesWithFilters?.({ status: 'active' });

      if (!res?.ok) {
        setEmployees([]);
        setEmployeesError(res?.error || 'No fue posible cargar empleados.');
        return;
      }

      // Normaliza a lo que requiere EmployeePayrollGrid
      const rows = (res?.data || []).map((e) => ({
        id: e?.id,                               // uuid interno
        employeeId: e?.employee_id || e?.id,     // id visible o legajo
        name: e?.full_name || 'Sin nombre',
        position: e?.position || e?.job_title || '—',
        site: e?.construction_sites?.name || e?.site?.name || '—',
        dailyWage: Number(e?.daily_salary ?? 0),
        supervisor: e?.supervisor?.full_name || '—',
        status: (e?.status || 'active')?.toString(),
      }));

      setEmployees(rows);

      // Selección inicial (opcional)
      if (!selectedEmployee && rows?.length) {
        setSelectedEmployee(rows[0]);
      }
    } catch (err) {
      console.error(err);
      setEmployeesError('Error inesperado al cargar empleados.');
    } finally {
      setEmployeesLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --------- ASISTENCIA / ESTIMACIÓN PARA EMPLEADO SELECCIONADO (SEMANA ACTUAL) ----------
  const getWeekRange = () => {
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const toISO = (d) => d.toISOString().slice(0, 10);
    return { start: toISO(monday), end: toISO(sunday) };
  };

  const loadSelectedAttendance = async () => {
    if (!selectedEmployee?.id) {
      setCurrentAttendance(null);
      return;
    }

    const { start, end } = getWeekRange();
    setCalcLoading(true);
    setCalcError('');

    try {
      // Intentamos obtener la estimación semanal persistida
      // (Tu payrollService ya tiene métodos de estimación)
      const snap =
        (await payrollService?.getWeeklyEstimation?.(selectedEmployee.id, start, end)) ||
        { ok: false };

      if (snap?.ok && snap?.data) {
        setCurrentAttendance(snap.data);
        return;
      }

      // Si no existe, calculamos y persistimos:
      const calc = await payrollService?.calculateFromAttendance?.(selectedEmployee.id, start, end);
      if (!calc?.ok) {
        setCalcError(calc?.error || 'No se pudo calcular la nómina del empleado.');
        setCurrentAttendance(null);
        return;
      }

      const saved = await payrollService?.upsertWeeklyEstimation?.(calc.data);
      if (!saved?.ok) {
        // Si no se pudo persistir, al menos mostramos cálculo
        setCurrentAttendance(calc.data);
        return;
      }
      setCurrentAttendance(saved.data);
    } catch (err) {
      console.error(err);
      setCalcError('Error inesperado al obtener/cacular la nómina del empleado.');
      setCurrentAttendance(null);
    } finally {
      setCalcLoading(false);
    }
  };

  useEffect(() => {
    loadSelectedAttendance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEmployee?.id]);

  // --------- HANDLERS UI ----------
  const handleEmployeeSelect = (employee) => {
    setSelectedEmployee(employee);
    setActiveView('calculation');
  };

  const handleCalculationUpdate = (calculations) => {
    // Si tu PayrollCalculationEngine devuelve ajustes temporales,
    // aquí podrías llamar a un método payrollService.upsertAdjustments(...)
    // o guardar en un estado local y luego "Guardar todo".
    console.log('Calculation updated:', calculations);
  };

  const handleSaveAdjustments = async (data) => {
    // Persistir ajustes manuales (si tu motor los genera)
    // Ejemplo: await payrollService?.upsertManualAdjustments?.(selectedEmployee?.id, data)
    console.log('Saving adjustments:', data);
  };

  const handleBulkAction = async (action, employeeIds) => {
    if (!Array.isArray(employeeIds) || employeeIds.length === 0) return;
    setProcessingStatus({
      action: `Procesando: ${action}`,
      processed: 0,
      total: employeeIds.length,
      status: 'processing',
    });

    const { start, end } = getWeekRange();

    try {
      // Si existe un método masivo real:
      if (action === 'calculate' && typeof payrollService?.bulkCalculateWeekly === 'function') {
        const resp = await payrollService.bulkCalculateWeekly(employeeIds, start, end, {
          persist: true,
        });
        if (!resp?.ok) throw new Error(resp?.error || 'Error en procesamiento masivo');

        // Marcar como completado
        setProcessingStatus((prev) => ({ ...prev, processed: prev.total, status: 'completed' }));
      } else {
        // Fallback: iterar 1x1
        for (let i = 0; i < employeeIds.length; i++) {
          const id = employeeIds[i];
          const calc = await payrollService?.calculateFromAttendance?.(id, start, end);
          if (calc?.ok) {
            await payrollService?.upsertWeeklyEstimation?.(calc.data);
          }
          setProcessingStatus((prev) => ({
            ...prev,
            processed: i + 1,
            status: i + 1 === prev.total ? 'completed' : 'processing',
          }));
        }
      }
    } catch (err) {
      console.error(err);
      setProcessingStatus((prev) => ({ ...prev, status: 'error' }));
    } finally {
      // Limpieza visual
      setTimeout(() => setProcessingStatus(null), 2500);
    }
  };

  const handleExport = async (format, employeeIds) => {
    if (!Array.isArray(employeeIds) || employeeIds.length === 0) return;
    const { start, end } = getWeekRange();

    // Si el service tiene export real:
    if (typeof payrollService?.exportWeeklyPayroll === 'function') {
      const res = await payrollService.exportWeeklyPayroll(employeeIds, { start, end, format });
      if (res?.ok && res?.data?.blob) {
        const url = URL.createObjectURL(res.data.blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `payroll_${start}_${end}.${format === 'excel' ? 'xlsx' : 'csv'}`;
        a.click();
        URL.revokeObjectURL(url);
        return;
      }
      // fallback a CSV local
    }

    try {
      // Fallback: generar CSV con lo que tengamos (employees + currentAttendance si aplica)
      const header = [
        'employee_id',
        'name',
        'site',
        'daily_wage',
        'period_start',
        'period_end',
        'regular_hours',
        'overtime_hours',
        'gross_total',
        'net_total',
      ].join(',');

      const rows = [];
      for (const id of employeeIds) {
        const emp = employees.find((e) => e.id === id);
        if (!emp) continue;

        // Intentar traer snapshot rápido (no bloqueante)
        let snap = null;
        try {
          const r = await payrollService?.getWeeklyEstimation?.(id, start, end);
          if (r?.ok) snap = r?.data;
        } catch {}

        rows.push(
          [
            emp.employeeId,
            JSON.stringify(emp.name || ''),
            JSON.stringify(emp.site || ''),
            emp.dailyWage ?? 0,
            start,
            end,
            snap?.regular_hours ?? '',
            snap?.overtime_hours ?? '',
            snap?.gross_total ?? '',
            snap?.net_total ?? '',
          ].join(',')
        );
      }

      const csv = `${header}\n${rows.join('\n')}`;
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payroll_${start}_${end}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Export error:', e);
    }
  };

  const handleSaveAll = async () => {
    // Si guardas ajustes o confirmas períodos, hazlo aquí
    // Ej: await payrollService?.commitWeek?.(getWeekRange())
    console.log('Saving all changes...');
  };

  const viewOptions = [
    { id: 'calculation', label: 'Motor de Cálculo', icon: 'Calculator' },
    { id: 'bulk', label: 'Procesamiento Masivo', icon: 'Users' },
    { id: 'audit', label: 'Registro de Auditoría', icon: 'FileText' },
    { id: 'integration', label: 'Estado de Integraciones', icon: 'Link' },
  ];

  const handleLogout = () => {};
  const handleProfileClick = () => {};
  const handleSiteChange = () => {};

  return (
    <>
      <Helmet>
        <title>Gestión de Nómina - AsistenciaPro</title>
        <meta
          name="description"
          content="Interfaz de cálculo y gestión de nómina para empleados de construcción"
        />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Sidebar */}
        <RoleBasedSidebar isCollapsed={sidebarCollapsed} userRole="admin" />

        {/* Main */}
        <div className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-60'} pb-16 md:pb-0`}>
          {/* Header */}
          <header className="bg-card border-b border-border px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  iconName={sidebarCollapsed ? 'ChevronRight' : 'ChevronLeft'}
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="hidden md:flex"
                />
                <div>
                  <h1 className="text-xl font-semibold text-foreground">Gestión de Nómina</h1>
                  <p className="text-sm text-muted-foreground">Cálculo y procesamiento de nómina semanal</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <NotificationCenter />
                <UserContextHeader
                  user={{
                    name: 'Administración',
                    role: 'Admin',
                    site: 'Oficina Central',
                    avatar: null,
                  }}
                  onLogout={handleLogout}
                  onProfileClick={handleProfileClick}
                  onSiteChange={handleSiteChange}
                />
              </div>
            </div>
          </header>

          {/* Content */}
          <main className="p-6">
            <NavigationBreadcrumb />

            {/* Selector de vista */}
            <div className="mb-6">
              <div className="flex items-center space-x-2 bg-muted p-1 rounded-lg w-fit">
                {viewOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setActiveView(option.id)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-150 ${
                      activeView === option.id
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                    }`}
                  >
                    <Icon name={option.icon} size={16} />
                    <span className="hidden md:inline">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Carga/errores de empleados */}
            {employeesLoading ? <LoadingSpinner /> : null}
            {!employeesLoading && employeesError ? (
              <ErrorBanner message={employeesError} onRetry={loadEmployees} />
            ) : null}

            {/* Layout principal */}
            {!employeesLoading && !employeesError && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Panel Izquierdo */}
                <div className="space-y-6">
                  {activeView === 'calculation' && (
                    <>
                      {calcLoading && <LoadingSpinner />}
                      {!calcLoading && calcError && (
                        <ErrorBanner message={calcError} onRetry={loadSelectedAttendance} />
                      )}
                      {!calcLoading && !calcError && (
                        <PayrollCalculationEngine
                          selectedEmployee={selectedEmployee}
                          onCalculationUpdate={handleCalculationUpdate}
                          attendanceData={
                            currentAttendance
                              ? {
                                  workedDays: currentAttendance?.worked_days ?? null,
                                  overtimeHours: currentAttendance?.overtime_hours ?? null,
                                  regularHours: currentAttendance?.regular_hours ?? null,
                                  grossTotal: currentAttendance?.gross_total ?? null,
                                  netTotal: currentAttendance?.net_total ?? null,
                                }
                              : {}
                          }
                          onSaveAdjustments={handleSaveAdjustments}
                        />
                      )}
                    </>
                  )}

                  {activeView === 'bulk' && (
                    <BulkProcessingTools
                      selectedEmployees={selectedEmployeeIds}
                      onBulkProcess={handleBulkAction}
                      onExport={handleExport}
                      processingStatus={processingStatus}
                    />
                  )}

                  {activeView === 'audit' && <PayrollAuditTrail />}

                  {activeView === 'integration' && (
                    <IntegrationStatusPanel
                      onRefreshStatus={() => console.log('Refreshing status...')}
                      onTestConnection={(id) => console.log('Testing connection:', id)}
                      onSyncData={(id) => console.log('Syncing data:', id)}
                    />
                  )}
                </div>

                {/* Panel Derecho - Grid de Empleados */}
                <div>
                  <EmployeePayrollGrid
                    employees={employees}
                    onEmployeeSelect={handleEmployeeSelect}
                    selectedEmployeeId={selectedEmployee?.id}
                    onBulkAction={(action, ids) => {
                      setSelectedEmployeeIds(ids);
                      if (action !== 'select') {
                        handleBulkAction(action, ids);
                      }
                    }}
                    payrollData={{}} // si tu grid muestra totales, puedes enlazar currentAttendance según id
                  />
                </div>
              </div>
            )}

            {/* Barra de acciones rápidas */}
            <div className="fixed bottom-4 right-4 md:relative md:bottom-auto md:right-auto md:mt-6">
              <div className="flex items-center space-x-2 bg-card border border-border rounded-lg p-2 shadow-lg">
                <Button variant="outline" size="sm" iconName="Save" onClick={handleSaveAll}>
                  <span className="hidden md:inline">Guardar Todo</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  iconName="Download"
                  onClick={() => handleExport('excel', selectedEmployeeIds?.length ? selectedEmployeeIds : employees.map(e => e.id))}
                >
                  <span className="hidden md:inline">Exportar</span>
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  iconName="Calculator"
                  onClick={() => handleBulkAction('calculate', employees.map((e) => e.id))}
                >
                  <span className="hidden md:inline">Calcular Todo</span>
                </Button>
              </div>
            </div>

            {/* Ayuda de atajos */}
            <div className="mt-8 p-4 bg-muted rounded-lg">
              <h4 className="text-sm font-semibold text-foreground mb-2">Atajos de Teclado</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-muted-foreground">
                <div>
                  <kbd className="px-1 py-0.5 bg-background rounded">Ctrl+1</kbd> Motor de Cálculo
                </div>
                <div>
                  <kbd className="px-1 py-0.5 bg-background rounded">Ctrl+2</kbd> Procesamiento Masivo
                </div>
                <div>
                  <kbd className="px-1 py-0.5 bg-background rounded">Ctrl+3</kbd> Auditoría
                </div>
                <div>
                  <kbd className="px-1 py-0.5 bg-background rounded">Ctrl+S</kbd> Guardar Todo
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default PayrollCalculationAndManagementInterface;
