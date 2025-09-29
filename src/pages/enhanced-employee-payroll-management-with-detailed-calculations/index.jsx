// src/pages/enhanced-employee-payroll-management-with-detailed-calculations/index.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import { useAuth } from '@/contexts/AuthContext';
import RoleBasedSidebar from '@/components/ui/RoleBasedSidebar';
import NavigationHeader from '@/components/ui/NavigationHeader';
import UserContextHeader from '@/components/ui/UserContextHeader';
import NotificationCenter from '@/components/ui/NotificationCenter';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Icon from '@/components/AppIcon';
import { useQuery } from '@/hooks/useQuery';
import { showToast } from '@/components/ui/ToastHub';

import enhancedEmployeeService from '@/services/enhancedEmployeeService';
import { payrollService } from '@/services/payrollService';

// Components
import EmployeeSelectionGrid from './components/EmployeeSelectionGrid';
import PayrollCalculationView from './components/PayrollCalculationView';
import PayrollSummaryCards from './components/PayrollSummaryCards';
import AuditTrailPanel from './components/AuditTrailPanel';

// ---------- Helpers de fechas ----------
const toISODate = (d) => (d instanceof Date ? d : new Date(d)).toISOString().split('T')[0];
function getCurrentWeekStart() {
  const t = new Date();
  const day = t.getDay(); // 0..6 (0=Dom)
  const monday = new Date(t);
  monday.setDate(t.getDate() - ((day + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  return toISODate(monday);
}
function getCurrentWeekEnd() {
  const start = new Date(getCurrentWeekStart());
  const sunday = new Date(start);
  sunday.setDate(start.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return toISODate(sunday);
}

const EnhancedEmployeePayrollManagementWithDetailedCalculations = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, userProfile, hasRole } = useAuth();

  // UI state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [calculations, setCalculations] = useState(null);
  const [adjustments, setAdjustments] = useState([]);

  // Filtros
  const [filters, setFilters] = useState({ search: '', obra: 'all', status: 'all' });

  // Rango semanal
  const [weekRange, setWeekRange] = useState({
    start: getCurrentWeekStart(),
    end: getCurrentWeekEnd(),
  });

  // Config de moneda (si tienes BrandingProvider, podrías leer de ahí)
  const [currencyConfig] = useState({ symbol: '$', currency: 'MXN' });

  // --------- Guards de acceso ----------
  useEffect(() => {
    if (!user || !userProfile) {
      navigate('/employee-login-portal', { replace: true });
      return;
    }
    if (!hasRole?.('admin')) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, userProfile, hasRole, navigate]);

  // --------- Empleados (service) ----------
  const employeeParams = useMemo(
    () => ({
      search: filters.search || '',
      site: 'all',
      supervisor: 'all',
      status: filters.status === 'all' ? [] : [filters.status],
      position: 'all',
      hireDateFrom: '',
      hireDateTo: '',
      limit: 1000,
    }),
    [filters.search, filters.status]
  );

  const {
    data: employeesRaw = [],
    isLoading: loadingEmployees,
    error: employeesError,
    refetch: refetchEmployees,
  } = useQuery(enhancedEmployeeService.getEmployees.bind(enhancedEmployeeService), employeeParams, {
    deps: [JSON.stringify(employeeParams)],
    keepPreviousData: true,
    retry: 1,
    onError: (e) => showToast({ title: 'Error al cargar empleados', message: e.message, type: 'error' }),
  });

  // Adaptamos empleados al grid (employeeSelection)
  const employees = useMemo(
    () =>
      (employeesRaw || []).map((emp) => ({
        id: emp.id,
        employeeCode: emp.employeeId,
        name: emp.name || '—',
        email: emp.email,
        phone: emp.phone,
        dailySalary: Number(emp.dailySalary || 0),
        status: emp.status || 'active',
        site: emp.site || 'Sin asignar',
        supervisor: emp.supervisor || '—',
        // campos que el grid usa para mostrar totales (se llenan luego con cálculo por empleado)
        workedDays: 0,
        regularHours: 0,
        overtimeHours: 0,
        basePay: 0,
        overtimePay: 0,
        grossPay: 0,
      })),
    [employeesRaw]
  );

  // Enlace profundo por employeeId (desde navigate state)
  useEffect(() => {
    const deepId = location?.state?.employeeId;
    if (deepId && employees.length) {
      const found = employees.find((e) => e.id === deepId);
      if (found) setSelectedEmployee(found);
    }
  }, [location?.state?.employeeId, employees]);

  // --------- Auditoría (service) ----------
  const {
    data: auditLogs = [],
    isLoading: loadingAudit,
    error: auditError,
    refetch: refetchAudit,
  } = useQuery(payrollService.getAuditLogs, {
    params: { module: 'Payroll', limit: 50 },
    deps: [weekRange.start, weekRange.end],
    retry: 1,
  });

  // --------- Handlers ----------
  const handleEmployeeSelect = async (employee) => {
    setSelectedEmployee(employee);
    setProcessing(true);
    setError('');
    try {
      // Cálculo detallado por empleado y semana
      const calc = await payrollService.calculateWeeklyPayroll(
        employee.id,
        weekRange.start,
        weekRange.end
      );
      const normalized = {
        workedDays: Number(calc?.workedDays || calc?.diasTrabajados || 0),
        regularHours: Number(calc?.regularHours || calc?.horasRegulares || 0),
        overtimeHours: Number(calc?.overtimeHours || calc?.horasExtra || 0),
        basePay: Number(calc?.basePay || calc?.salarioBase || 0),
        overtimePay: Number(calc?.overtimePay || calc?.pagoHorasExtra || 0),
        grossPay: Number(calc?.grossPay || calc?.salarioBruto || 0),
        bonuses: Number(calc?.bonuses || 0),
        deductions: Number(calc?.deductions || 0),
        netPay: Number(calc?.netPay || calc?.salarioNeto || calc?.salarioBruto || 0),
      };
      setCalculations(normalized);

      // Ajustes existentes
      const adjs = await payrollService.getAdjustments(employee.id, weekRange.start, weekRange.end);
      setAdjustments(
        (adjs || []).map((a) => ({
          id: a.id,
          type: a.type,
          category: a.category,
          amount: Number(a.amount || 0),
          description: a.description,
          timestamp: a.created_at || a.timestamp,
        }))
      );
    } catch (e) {
      setError(`Error al cargar detalles: ${e?.message || e}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleSaveAdjustment = async (adjustment) => {
    if (!selectedEmployee) return;
    try {
      await payrollService.addAdjustment({
        employeeId: selectedEmployee.id,
        startDate: weekRange.start,
        endDate: weekRange.end,
        type: adjustment?.type,
        category: adjustment?.category,
        amount: Number(adjustment?.amount || 0),
        description: adjustment?.description,
        authorizedBy: user?.id,
      });

      // Re-cargar datos del empleado seleccionado
      await handleEmployeeSelect(selectedEmployee);
      await payrollService.logActivity({
        userId: user?.id,
        role: userProfile?.role || 'user',
        action: 'adjustment_added',
        module: 'Payroll',
        description: `Ajuste: ${adjustment?.description}`,
      });
      showToast({ title: 'Ajuste guardado', type: 'success' });
    } catch (e) {
      setError(`Error al guardar ajuste: ${e?.message || e}`);
    }
  };

  const handleBulkCalculation = async () => {
    if (!employees.length) return;
    setProcessing(true);
    setError('');
    try {
      let processed = 0;
      // (Si tu backend soporta bulk, crea payrollService.calculateWeeklyPayrollBulk)
      for (const emp of employees) {
        await payrollService.calculateWeeklyPayroll(emp.id, weekRange.start, weekRange.end);
        processed++;
      }
      await payrollService.logActivity({
        userId: user?.id,
        role: userProfile?.role || 'user',
        action: 'bulk_calculation',
        module: 'Payroll',
        description: `Cálculo masivo completado para ${processed} empleados`,
      });
      showToast({ title: 'Cálculo masivo completado', type: 'success' });
      await refetchEmployees();
      await refetchAudit();
    } catch (e) {
      setError(`Error en cálculo masivo: ${e?.message || e}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleExport = async (format = 'csv') => {
    try {
      const subset = selectedEmployee ? [selectedEmployee] : employees;
      if (!subset.length) {
        showToast({ title: 'Sin datos', message: 'No hay empleados para exportar', type: 'info' });
        return;
      }
      const header = [
        'Código',
        'Nombre',
        'Sitio',
        'Días Trabajados',
        'Horas Regulares',
        'Horas Extra',
        'Salario Base',
        'Pago Horas Extra',
        'Salario Bruto',
      ].join(',');
      const lines = subset.map((emp) => {
        const c = emp.id === selectedEmployee?.id ? calculations : null;
        const workedDays = c?.workedDays ?? emp?.workedDays ?? 0;
        const regularHours = c?.regularHours ?? emp?.regularHours ?? 0;
        const overtimeHours = c?.overtimeHours ?? emp?.overtimeHours ?? 0;
        const basePay = c?.basePay ?? emp?.basePay ?? 0;
        const overtimePay = c?.overtimePay ?? emp?.overtimePay ?? 0;
        const grossPay = c?.grossPay ?? emp?.grossPay ?? 0;

        return [
          emp.employeeCode || '',
          `"${(emp.name || '').replace(/"/g, '""')}"`,
          `"${(emp.site || '').replace(/"/g, '""')}"`,
          workedDays,
          regularHours,
          overtimeHours,
          basePay,
          overtimePay,
          grossPay,
        ].join(',');
      });
      const csv = [header, ...lines].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `nomina_${weekRange.start}_${weekRange.end}.csv`;
      a.click();
      URL.revokeObjectURL(a.href);

      await payrollService.logActivity({
        userId: user?.id,
        role: userProfile?.role || 'user',
        action: 'export',
        module: 'Payroll',
        description: `Datos exportados en formato ${format}`,
      });
      showToast({ title: 'Exportación lista', type: 'success' });
    } catch (e) {
      setError(`Error al exportar: ${e?.message || e}`);
    }
  };

  // Filtrado cliente adicional (obra/status por etiquetas de texto)
  const filteredEmployees = useMemo(() => {
    return (employees || []).filter((employee) => {
      const matchesSearch =
        !filters.search ||
        employee.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
        employee.employeeCode?.toLowerCase().includes(filters.search.toLowerCase());
      const matchesObra = filters.obra === 'all' || employee.site === filters.obra;
      const matchesStatus = filters.status === 'all' || employee.status === filters.status;
      return matchesSearch && matchesObra && matchesStatus;
    });
  }, [employees, filters]);

  // Loading inicial
  if (loadingEmployees) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          <span className="text-muted-foreground">Cargando sistema de nómina...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <RoleBasedSidebar
        isCollapsed={sidebarCollapsed}
        userRole={userProfile?.role?.toLowerCase()}
      />

      {/* Main Content */}
      <div className={`transition-all duration-300 ease-out-cubic ${sidebarCollapsed ? 'ml-16' : 'ml-60'} pb-16 md:pb-0`}>
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="hidden md:flex"
                iconName={sidebarCollapsed ? 'PanelLeftOpen' : 'PanelLeftClose'}
                iconSize={20}
              />
              <div>
                <h1 className="text-2xl font-bold text-foreground">Gestión de Nómina Detallada</h1>
                <p className="text-muted-foreground">Cálculos detallados y gestión integral de nómina</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <NotificationCenter />
              <UserContextHeader
                user={{
                  name: userProfile?.full_name || 'Usuario',
                  role: userProfile?.role || 'user',
                  site: 'Oficina Central',
                }}
                onLogout={() => navigate('/employee-login-portal')}
              />
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-6">
          <NavigationHeader showBackButton={false} />

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <div className="flex items-center space-x-2">
                <Icon name="AlertCircle" size={20} className="text-destructive" />
                <span className="text-destructive font-medium">Error</span>
              </div>
              <p className="text-destructive mt-1">{error}</p>
            </div>
          )}
          {employeesError && (
            <div className="mb-6 p-3 text-sm rounded bg-red-50 border border-red-200 text-red-700">
              {String(employeesError)}
            </div>
          )}
          {auditError && (
            <div className="mb-6 p-3 text-sm rounded bg-yellow-50 border border-yellow-200 text-yellow-800">
              {String(auditError)}
            </div>
          )}

          {/* Controls Bar */}
          <div className="mb-6 bg-card border border-border rounded-lg p-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
                {/* Week Range */}
                <div className="flex items-center space-x-2">
                  <Icon name="Calendar" size={16} className="text-muted-foreground" />
                  <Input
                    type="date"
                    label="Inicio"
                    value={weekRange.start}
                    onChange={(e) => setWeekRange((p) => ({ ...p, start: e.target.value }))}
                    className="w-auto"
                  />
                  <span className="text-muted-foreground">-</span>
                  <Input
                    type="date"
                    label="Fin"
                    value={weekRange.end}
                    onChange={(e) => setWeekRange((p) => ({ ...p, end: e.target.value }))}
                    className="w-auto"
                  />
                </div>

                {/* Search */}
                <Input
                  type="search"
                  placeholder="Buscar empleado..."
                  value={filters.search}
                  onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                  className="w-64"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Button variant="outline" iconName="Download" onClick={() => handleExport('csv')}>
                  Exportar
                </Button>
                <Button variant="default" iconName="Calculator" onClick={handleBulkCalculation} disabled={processing}>
                  {processing ? 'Procesando...' : 'Calcular Todo'}
                </Button>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <PayrollSummaryCards employees={filteredEmployees} currencyConfig={currencyConfig} weekRange={weekRange} />

          {/* Main */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mt-6">
            {/* Employee Selection */}
            <div className="lg:col-span-2">
              <EmployeeSelectionGrid
                employees={filteredEmployees}
                selectedEmployee={selectedEmployee}
                onEmployeeSelect={handleEmployeeSelect}
                processing={processing}
                currencyConfig={currencyConfig}
              />
            </div>

            {/* Calculation View */}
            <div className="lg:col-span-3">
              {selectedEmployee ? (
                <PayrollCalculationView
                  employee={selectedEmployee}
                  calculations={calculations}
                  adjustments={adjustments}
                  onSaveAdjustment={handleSaveAdjustment}
                  processing={processing}
                  currencyConfig={currencyConfig}
                  weekRange={weekRange}
                />
              ) : (
                <div className="bg-card border border-border rounded-lg p-8 text-center">
                  <Icon name="Calculator" size={48} className="mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Selecciona un Empleado</h3>
                  <p className="text-muted-foreground">Elige un empleado de la lista para ver los cálculos detallados de nómina</p>
                </div>
              )}
            </div>
          </div>

          {/* Audit Trail */}
          {selectedEmployee && (
            <div className="mt-6">
              <AuditTrailPanel logs={auditLogs} employeeId={selectedEmployee?.id} isLoading={loadingAudit} />
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default EnhancedEmployeePayrollManagementWithDetailedCalculations;
