import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../../contexts/AuthContext';
import RoleBasedSidebar from '../../components/ui/RoleBasedSidebar';
import NavigationBreadcrumb from '../../components/ui/NavigationBreadcrumb';
import UserContextHeader from '../../components/ui/UserContextHeader';
import NotificationCenter from '../../components/ui/NotificationCenter';

import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import PayrollEstimationCards from './components/PayrollEstimationCards';
import WeeklyTimeline from './components/WeeklyTimeline';
import PayrollSummaryTable from './components/PayrollSummaryTable';
import ZeroStateDisplay from './components/ZeroStateDisplay';
import { getCurrentWeekPayroll, calculateWeeklyPayroll, bulkCalculatePayroll } from '../../services/payrollService';
import { getEmployeesWithFilters } from '../../services/employeeService';

const RealTimePayrollEstimationDashboardWithZeroStateHandling = () => {
  const { user, userProfile, signOut, hasRole } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [payrollData, setPayrollData] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState('');
  const [notification, setNotification] = useState('');
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [weekSummary, setWeekSummary] = useState({
    totalEmployees: 0,
    totalRegularHours: 0,
    totalOvertimeHours: 0,
    totalGrossPay: 0,
    totalNetPay: 0,
    averageDailyPay: 0
  });

  // Get current week dates
  const getCurrentWeekDates = () => {
    const today = new Date();
    const dayOfWeek = today?.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    
    const weekStart = new Date(today);
    weekStart?.setDate(today?.getDate() - daysToMonday);
    weekStart?.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd?.setDate(weekStart?.getDate() + 6);
    weekEnd?.setHours(23, 59, 59, 999);
    
    return { weekStart, weekEnd };
  };

  const { weekStart, weekEnd } = getCurrentWeekDates();

  // Load payroll data
  const loadPayrollData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const data = await getCurrentWeekPayroll();
      setPayrollData(data);
      
      // Calculate summary
      const summary = data?.reduce((acc, record) => {
        acc.totalEmployees += 1;
        acc.totalRegularHours += parseFloat(record?.regular_hours || 0);
        acc.totalOvertimeHours += parseFloat(record?.overtime_hours || 0);
        acc.totalGrossPay += parseFloat(record?.gross_total || 0);
        acc.totalNetPay += parseFloat(record?.net_total || 0);
        return acc;
      }, {
        totalEmployees: 0,
        totalRegularHours: 0,
        totalOvertimeHours: 0,
        totalGrossPay: 0,
        totalNetPay: 0
      });

      summary.averageDailyPay = summary?.totalEmployees > 0 
        ? summary?.totalGrossPay / summary?.totalEmployees / 7 
        : 0;

      setWeekSummary(summary);
    } catch (err) {
      setError(`Error al cargar datos de nómina: ${err?.message || 'Error desconocido'}`);
      setPayrollData([]);
      setWeekSummary({
        totalEmployees: 0,
        totalRegularHours: 0,
        totalOvertimeHours: 0,
        totalGrossPay: 0,
        totalNetPay: 0,
        averageDailyPay: 0
      });
    } finally {
      setLoading(false);
    }
  };

  // Load active employees
  const loadEmployees = async () => {
    try {
      const employeeData = await getEmployeesWithFilters({
        status: ['active']
      });
      setEmployees(employeeData || []);
    } catch (err) {
      console.error('Error loading employees:', err);
    }
  };

  useEffect(() => {
    loadPayrollData();
    loadEmployees();
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading && !calculating) {
        loadPayrollData();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [loading, calculating]);

  const handleCalculateAll = async () => {
    if (employees?.length === 0) {
      setNotification('No hay empleados activos para calcular');
      setTimeout(() => setNotification(''), 3000);
      return;
    }

    try {
      setCalculating(true);
      setError('');
      
      const employeeIds = employees?.map(emp => emp?.id);
      const weekStartStr = weekStart?.toISOString()?.split('T')?.[0];
      
      const results = await bulkCalculatePayroll(employeeIds, weekStartStr);
      
      const successful = results?.filter(r => r?.success)?.length;
      const failed = results?.filter(r => !r?.success)?.length;
      
      if (failed > 0) {
        setNotification(`Cálculo completado: ${successful} exitosos, ${failed} fallidos`);
      } else {
        setNotification(`Nómina calculada para ${successful} empleados`);
      }
      
      setTimeout(() => setNotification(''), 5000);
      
      // Refresh data
      await loadPayrollData();
    } catch (err) {
      setError(`Error al calcular nómina: ${err?.message}`);
      setTimeout(() => setError(''), 5000);
    } finally {
      setCalculating(false);
    }
  };

  const handleCalculateEmployee = async (employeeId) => {
    try {
      setCalculating(true);
      const weekStartStr = weekStart?.toISOString()?.split('T')?.[0];
      
      await calculateWeeklyPayroll(employeeId, weekStartStr);
      
      setNotification('Nómina recalculada');
      setTimeout(() => setNotification(''), 3000);
      
      await loadPayrollData();
    } catch (err) {
      setError(`Error al recalcular: ${err?.message}`);
      setTimeout(() => setError(''), 5000);
    } finally {
      setCalculating(false);
    }
  };

  const handleExportPayroll = () => {
    const dataToExport = selectedEmployees?.length > 0
      ? payrollData?.filter(record => selectedEmployees?.includes(record?.employee_id))
      : payrollData;

    console.log('Exporting payroll data:', dataToExport);
    
    setNotification('Exportación de nómina iniciada');
    setTimeout(() => setNotification(''), 3000);
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (err) {
      setError(`Error al cerrar sesión: ${err?.message}`);
    }
  };

  const formatDateRange = (start, end) => {
    const options = { day: 'numeric', month: 'short' };
    return `${start?.toLocaleDateString('es-ES', options)} - ${end?.toLocaleDateString('es-ES', options)}`;
  };

  const hasPayrollData = payrollData?.length > 0;
  const hasActiveEmployees = employees?.length > 0;

  return (
    <>
      <Helmet>
        <title>Estimación de Nómina en Tiempo Real - AsistenciaPro</title>
        <meta name="description" content="Dashboard de estimaciones de nómina con actualizaciones en tiempo real y manejo de estados vacíos" />
      </Helmet>
      <div className="min-h-screen bg-background">
        {/* Notifications */}
        {notification && (
          <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg">
            {notification}
          </div>
        )}

        {error && (
          <div className="fixed top-4 right-4 z-50 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg">
            {error}
            <button 
              onClick={() => setError('')}
              className="ml-2 text-white hover:text-gray-200"
            >
              ×
            </button>
          </div>
        )}

        {/* Sidebar */}
        <RoleBasedSidebar 
          isCollapsed={sidebarCollapsed}
          userRole={userProfile?.role?.toLowerCase()}
        />

        {/* Main Content */}
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
                  <h1 className="text-xl font-semibold text-foreground">
                    Estimación de Nómina
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Semana del {formatDateRange(weekStart, weekEnd)}
                  </p>
                </div>
                
                {/* Real-time indicator */}
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-xs text-muted-foreground">Tiempo Real</span>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadPayrollData()}
                  disabled={loading}
                  iconName={loading ? 'Loader2' : 'RefreshCw'}
                  className={loading ? 'animate-spin' : ''}
                >
                  Actualizar
                </Button>

                <NotificationCenter />
                <UserContextHeader
                  user={{
                    name: userProfile?.full_name || 'Usuario',
                    role: userProfile?.role === 'superadmin' ? 'SuperAdmin' : 
                          userProfile?.role === 'admin' ? 'Admin' : 
                          userProfile?.role?.charAt(0)?.toUpperCase() + userProfile?.role?.slice(1),
                    site: 'Sistema Central'
                  }}
                  onLogout={handleLogout}
                />
              </div>
            </div>
          </header>

          {/* Content */}
          <main className="p-6">
            <NavigationBreadcrumb />

            {/* Quick Actions Bar */}
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-sm text-muted-foreground">
                  {hasPayrollData ? (
                    <>Mostrando estimaciones para {payrollData?.length} empleados</>
                  ) : hasActiveEmployees ? (
                    <>No hay datos de nómina para esta semana</>
                  ) : (
                    <>No hay empleados activos</>
                  )}
                </div>
                
                {calculating && (
                  <div className="flex items-center space-x-2 text-blue-600">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm">Calculando...</span>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportPayroll}
                  disabled={!hasPayrollData || calculating}
                  iconName="Download"
                >
                  Exportar
                </Button>

                <Button
                  size="sm"
                  onClick={handleCalculateAll}
                  disabled={!hasActiveEmployees || calculating}
                  iconName="Calculator"
                >
                  {calculating ? 'Calculando...' : 'Calcular Todo'}
                </Button>
              </div>
            </div>

            {/* Main Content Area */}
            {!hasActiveEmployees ? (
              <ZeroStateDisplay 
                type="no-employees"
                title="No hay empleados activos"
                description="Primero debe registrar empleados activos en el sistema para poder calcular estimaciones de nómina."
                actionLabel="Gestionar Empleados"
                onAction={() => window.location.href = '/admin/employees'}
              />
            ) : !hasPayrollData ? (
              <ZeroStateDisplay 
                type="no-data"
                title="No hay datos de asistencia esta semana"
                description="Las estimaciones aparecerán automáticamente cuando los empleados registren su asistencia. Mientras tanto, todos los valores se muestran en $0.00 MXN."
                actionLabel="Calcular Estimaciones"
                onAction={handleCalculateAll}
                loading={calculating}
              />
            ) : (
              <div className="space-y-6">
                {/* Estimation Cards */}
                <PayrollEstimationCards 
                  summary={weekSummary}
                  weekStart={weekStart}
                  weekEnd={weekEnd}
                  loading={loading}
                />

                {/* Weekly Timeline */}
                <WeeklyTimeline 
                  weekStart={weekStart}
                  payrollData={payrollData}
                  loading={loading}
                />

                {/* Payroll Summary Table */}
                <PayrollSummaryTable 
                  payrollData={payrollData}
                  selectedEmployees={selectedEmployees}
                  onSelectionChange={setSelectedEmployees}
                  onCalculateEmployee={handleCalculateEmployee}
                  onExportEmployee={(employee) => {
                    setSelectedEmployees([employee?.employee_id]);
                    handleExportPayroll();
                  }}
                  calculating={calculating}
                  loading={loading}
                />
              </div>
            )}

            {/* Currency Format Notice */}
            <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <Icon name="Info" className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-blue-800">
                    <strong>Formato de Moneda:</strong> Todos los valores se muestran en Pesos Mexicanos (MXN) con formato local mexicano.
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Las estimaciones se actualizan automáticamente cada 30 segundos basadas en los registros de asistencia más recientes.
                  </p>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default RealTimePayrollEstimationDashboardWithZeroStateHandling;