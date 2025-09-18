// src/pages/advanced-payroll-calculation-engine-with-comprehensive-wage-management/index.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { Calculator, DollarSign, Clock, TrendingUp, Users, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { payrollService } from '@/services/payrollService';
import enhancedEmployeeService from '@/services/enhancedEmployeeService';
import BrandedHeader from '@/components/ui/BrandedHeader';
import PayrollCalculationDashboard from './components/PayrollCalculationDashboard';
import EmployeePayrollGrid from './components/EmployeePayrollGrid';
import BulkProcessingTools from './components/BulkProcessingTools';
import PayrollAuditTrail from './components/PayrollAuditTrail';
import CurrencyDisplay from '@/components/ui/CurrencyDisplay';
import { useQuery } from '@/hooks/useQuery';

function getMondayRange(base = new Date()) {
  const d = new Date(base);
  const day = d.getDay(); // 0=Sun .. 6=Sat
  const monday = new Date(d);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(d.getDate() - ((day + 6) % 7)); // lunes
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { start: monday, end: sunday };
}

const toISODate = (dt) => dt.toISOString().split('T')[0];

export default function AdvancedPayrollCalculationEngineWithComprehensiveWageManagement() {
  const { user, userProfile } = useAuth();

  const [activeView, setActiveView] = useState('dashboard');
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [auditEntries, setAuditEntries] = useState([]);
  const [weekRange, setWeekRange] = useState(getMondayRange());

  // --- Data: Employees ---
  const {
    data: employees = [],
    isLoading: employeesLoading,
    error: employeesError,
    refetch: refetchEmployees,
  } = useQuery(enhancedEmployeeService.getEmployees.bind(enhancedEmployeeService), {});

  // --- Data: Payroll summary (para la semana seleccionada) ---
  const startISO = useMemo(() => toISODate(weekRange.start), [weekRange.start]);
  const endISO = useMemo(() => toISODate(weekRange.end), [weekRange.end]);

  const {
    data: payrollData = [],
    isLoading: payrollLoading,
    error: payrollError,
    refetch: refetchPayroll,
  } = useQuery(payrollService.getPayrollSummary, startISO);

  // Refetch cuando cambie la semana
  useEffect(() => {
    refetchPayroll();
  }, [startISO, refetchPayroll]);

  const processing = false; // usaremos estados por acción para no bloquear toda la pantalla

  // --- Single calculation ---
  const calculateSinglePayroll = async (employeeId) => {
    const startDate = startISO;
    const endDate = endISO;

    const calculation = await payrollService.calculateWeeklyPayroll(
      employeeId,
      startDate,
      endDate
    );

    // refrescar listado/summary para mantener consistencia
    await refetchPayroll();

    // audit
    const employee = employees.find(e => e.id === employeeId);
    setAuditEntries(prev => [
      ...prev,
      {
        id: Date.now(),
        action: 'calculate_payroll',
        employee: employee?.name || 'Desconocido',
        amount: calculation?.grossPay || 0,
        timestamp: new Date(),
        user: userProfile?.full_name || 'System',
      },
    ]);

    return calculation;
  };

  // --- Bulk calculation (paralelo) ---
  const calculateBulkPayroll = async () => {
    if (!selectedEmployees.length) return;
    const startDate = startISO;
    const endDate = endISO;

    const calculations = await Promise.all(
      selectedEmployees.map((employeeId) =>
        payrollService.calculateWeeklyPayroll(employeeId, startDate, endDate)
      )
    );

    await refetchPayroll();

    setAuditEntries(prev => [
      ...prev,
      {
        id: Date.now(),
        action: 'bulk_calculate',
        employee: `${selectedEmployees.length} empleados`,
        amount: calculations.reduce((s, c) => s + (c?.grossPay || 0), 0),
        timestamp: new Date(),
        user: userProfile?.full_name || 'System',
      },
    ]);
  };

  // --- Aguinaldo individual ---
  const calculateAguinaldo = async (employeeId, daysWorked = 365) => {
    const employee = employees.find(e => e.id === employeeId);
    if (!employee) return 0;
    const dailySalary = Number(employee?.dailySalary || 0);
    const aguinaldo = (dailySalary * 15 * daysWorked) / 365;

    setAuditEntries(prev => [
      ...prev,
      {
        id: Date.now(),
        action: 'calculate_aguinaldo',
        employee: employee?.name,
        amount: aguinaldo,
        timestamp: new Date(),
        user: userProfile?.full_name || 'System',
        details: `${daysWorked} días laborados`,
      },
    ]);
    return aguinaldo;
  };

  // --- Finiquito individual ---
  const calculateSeverance = async (employeeId, terminationReason = 'voluntary') => {
    const employee = employees.find(e => e.id === employeeId);
    if (!employee) return 0;
    const dailySalary = Number(employee?.dailySalary || 0);
    let severanceAmount = 0;

    switch (terminationReason) {
      case 'without_cause':
        severanceAmount = dailySalary * 90;
        break;
      case 'voluntary':
        severanceAmount = dailySalary * 20;
        break;
      default:
        severanceAmount = dailySalary * 30;
    }

    setAuditEntries(prev => [
      ...prev,
      {
        id: Date.now(),
        action: 'calculate_severance',
        employee: employee?.name,
        amount: severanceAmount,
        timestamp: new Date(),
        user: userProfile?.full_name || 'System',
        details: `Reason: ${terminationReason}`,
      },
    ]);
    return severanceAmount;
  };

  // --- Procesar nómina (aprobar/marcar) ---
  const processPayroll = async (payrollId) => {
    await payrollService.processPayroll(payrollId, user?.id);
    await refetchPayroll();
  };

  const stats = useMemo(() => ({
    totalEmployees: employees?.length || 0,
    processedPayroll: payrollData?.filter(p => p?.processed)?.length || 0,
    totalGrossPay: payrollData?.reduce((sum, p) => sum + (p?.grossPay || 0), 0),
    totalNetPay: payrollData?.reduce((sum, p) => sum + (p?.netPay || 0), 0),
  }), [employees, payrollData]);

  // Loading / Error
  if (employeesLoading || payrollLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Cargando motor de nóminas...</span>
        </div>
      </div>
    );
  }

  if (employeesError || payrollError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error al cargar datos</h2>
          <p className="text-gray-600">
            {String(employeesError || payrollError)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <BrandedHeader
        title="Motor Avanzado de Cálculo de Nóminas"
        subtitle="Gestión integral de salarios con cálculos automatizados"
        icon={Calculator}
        user={userProfile}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Empleados</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalEmployees}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Nóminas Procesadas</p>
                <p className="text-2xl font-bold text-gray-900">{stats.processedPayroll}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-emerald-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Salario Bruto</p>
                <p className="text-2xl font-bold text-gray-900">
                  <CurrencyDisplay amount={stats.totalGrossPay} />
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Salario Neto</p>
                <p className="text-2xl font-bold text-gray-900">
                  <CurrencyDisplay amount={stats.totalNetPay} />
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              <button
                onClick={() => setActiveView('dashboard')}
                className={`px-6 py-3 font-medium text-sm border-b-2 ${activeView === 'dashboard' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                <Calculator className="h-4 w-4 inline mr-2" />
                Panel de Cálculo
              </button>

              <button
                onClick={() => setActiveView('employees')}
                className={`px-6 py-3 font-medium text-sm border-b-2 ${activeView === 'employees' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                <Users className="h-4 w-4 inline mr-2" />
                Lista de Empleados
              </button>

              <button
                onClick={() => setActiveView('bulk')}
                className={`px-6 py-3 font-medium text-sm border-b-2 ${activeView === 'bulk' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                <FileText className="h-4 w-4 inline mr-2" />
                Procesamiento Masivo
              </button>

              <button
                onClick={() => setActiveView('audit')}
                className={`px-6 py-3 font-medium text-sm border-b-2 ${activeView === 'audit' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                <AlertCircle className="h-4 w-4 inline mr-2" />
                Auditoría
              </button>
            </nav>
          </div>
        </div>

        {/* Content Area */}
        <div className="grid grid-cols-12 gap-8">
          {/* Main Content */}
          <div className="col-span-12 lg:col-span-7">
            {activeView === 'dashboard' && (
              <PayrollCalculationDashboard
                weekRange={weekRange}
                onWeekRangeChange={(r) => setWeekRange(getMondayRange(r.start || new Date()))}
                payrollData={payrollData}
                onCalculatePayroll={calculateSinglePayroll}
                onCalculateAguinaldo={calculateAguinaldo}
                onCalculateSeverance={calculateSeverance}
                processing={false}
              />
            )}

            {activeView === 'employees' && (
              <EmployeePayrollGrid
                employees={employees}
                payrollData={payrollData}
                selectedEmployees={selectedEmployees}
                onSelectionChange={setSelectedEmployees}
                onCalculatePayroll={calculateSinglePayroll}
                onProcessPayroll={processPayroll}
                processing={false}
              />
            )}

            {activeView === 'bulk' && (
              <BulkProcessingTools
                selectedEmployees={selectedEmployees}
                employees={employees}
                onBulkCalculate={calculateBulkPayroll}
                processing={false}
                weekRange={weekRange}
              />
            )}

            {activeView === 'audit' && (
              <PayrollAuditTrail
                auditEntries={auditEntries}
                onClearAudit={() => setAuditEntries([])}
              />
            )}
          </div>

          {/* Sidebar */}
          <div className="col-span-12 lg:col-span-5">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  <Clock className="h-5 w-5 inline mr-2" />
                  Actualizaciones en Tiempo Real
                </h3>

                <div className="space-y-4">
                  {payrollData.slice(0, 5).map((payroll, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium text-sm">{payroll?.employeeName || 'Empleado'}</p>
                        <p className="text-xs text-gray-500">
                          {(payroll?.regularHours || 0)}h normales, {(payroll?.overtimeHours || 0)}h extra
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm">
                          <CurrencyDisplay amount={payroll?.grossPay || 0} />
                        </p>
                        <span
                          className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                            payroll?.processed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {payroll?.processed ? 'Procesada' : 'Pendiente'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {payrollData.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No hay cálculos de nómina disponibles</p>
                    <p className="text-sm">Selecciona empleados para comenzar</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow mt-6">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h3>

                <div className="space-y-3">
                  <button
                    onClick={calculateBulkPayroll}
                    disabled={!selectedEmployees.length}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Calcular Nómina Semanal
                  </button>

                  <button
                    onClick={async () => {
                      await Promise.all(selectedEmployees.map(id => calculateAguinaldo(id)));
                    }}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    disabled={!selectedEmployees.length}
                  >
                    Generar Aguinaldos
                  </button>

                  <button
                    onClick={async () => {
                      await Promise.all(selectedEmployees.map(id => calculateSeverance(id)));
                    }}
                    className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
                    disabled={!selectedEmployees.length}
                  >
                    Calcular Finiquitos
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>      
    </div>
  );
}
