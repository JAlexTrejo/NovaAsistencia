import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import RoleBasedSidebar from '../../components/ui/RoleBasedSidebar';
import NavigationHeader from '../../components/ui/NavigationHeader';
import UserContextHeader from '../../components/ui/UserContextHeader';
import NotificationCenter from '../../components/ui/NotificationCenter';

import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

import Icon from '../../components/AppIcon';
import { supabase } from '../../lib/supabase';

// Import components
import EmployeeSelectionGrid from './components/EmployeeSelectionGrid';
import PayrollCalculationView from './components/PayrollCalculationView';
import PayrollSummaryCards from './components/PayrollSummaryCards';
import AuditTrailPanel from './components/AuditTrailPanel';

const EnhancedEmployeePayrollManagementWithDetailedCalculations = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, userProfile, isAdmin, hasRole } = useAuth();
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [payrollData, setPayrollData] = useState({});
  const [weekRange, setWeekRange] = useState({
    start: getCurrentWeekStart(),
    end: getCurrentWeekEnd()
  });
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [calculations, setCalculations] = useState(null);
  const [adjustments, setAdjustments] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    obra: 'all',
    status: 'all'
  });

  const [obras, setObras] = useState([]);
  const [currencyConfig, setCurrencyConfig] = useState({
    symbol: '$',
    currency: 'MXN'
  });

  // Get current week start (Monday)
  function getCurrentWeekStart() {
    const today = new Date();
    const currentDay = today?.getDay();
    const monday = new Date(today);
    monday?.setDate(today?.getDate() - currentDay + (currentDay === 0 ? -6 : 1));
    return monday?.toISOString()?.split('T')?.[0];
  }

  // Get current week end (Sunday)
  function getCurrentWeekEnd() {
    const today = new Date();
    const currentDay = today?.getDay();
    const sunday = new Date(today);
    sunday?.setDate(today?.getDate() - currentDay + 7);
    return sunday?.toISOString()?.split('T')?.[0];
  }

  useEffect(() => {
    if (!user || !userProfile) {
      navigate('/login');
      return;
    }

    if (!hasRole?.('admin')) {
      navigate('/dashboard');
      return;
    }

    initializeData();
  }, [user, userProfile, weekRange]);

  // Handle URL employee parameter
  useEffect(() => {
    const employeeId = location?.state?.employeeId;
    if (employeeId && employees?.length > 0) {
      const employee = employees?.find(emp => emp?.id === employeeId);
      if (employee) {
        setSelectedEmployee(employee);
      }
    }
  }, [location?.state?.employeeId, employees]);

  const initializeData = async () => {
    try {
      setLoading(true);
      setError('');

      await Promise.all([
        loadEmployees(),
        loadObras(),
        loadCurrencyConfig(),
        loadAuditLogs()
      ]);

    } catch (error) {
      console.error('Error initializing data:', error);
      setError('Error al cargar los datos del sistema');
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const { data: empleadosData, error: empleadosError } = await supabase
        ?.from('empleados')
        ?.select(`
          id,
          codigo_empleado,
          salario_diario,
          status,
          user_profiles:user_id (
            id,
            full_name,
            email,
            phone
          ),
          obras:obra_id (
            id,
            nombre
          ),
          supervisor:supervisor_id (
            full_name
          )
        `)
        ?.eq('status', 'active')
        ?.order('user_profiles(full_name)', { ascending: true });

      if (empleadosError) throw empleadosError;

      const employeesWithPayroll = await Promise.all(
        empleadosData?.map(async (emp) => {
          const payrollData = await calculateEmployeePayroll(emp?.id);
          return {
            id: emp?.id,
            employeeCode: emp?.codigo_empleado,
            name: emp?.user_profiles?.full_name || 'Sin nombre',
            email: emp?.user_profiles?.email,
            phone: emp?.user_profiles?.phone,
            dailySalary: emp?.salario_diario || 0,
            status: emp?.status,
            site: emp?.obras?.nombre || 'Sin asignar',
            supervisor: emp?.supervisor?.full_name || 'Sin supervisor',
            ...payrollData
          };
        }) || []
      );

      setEmployees(employeesWithPayroll);
    } catch (error) {
      if (error?.message?.includes('Failed to fetch')) {
        setError('No se puede conectar a la base de datos. Verifica tu conexión.');
      } else {
        setError(`Error al cargar empleados: ${error?.message}`);
      }
    }
  };

  const loadObras = async () => {
    try {
      const { data, error } = await supabase
        ?.from('obras')
        ?.select('id, nombre')
        ?.eq('activa', true)
        ?.order('nombre');

      if (error) throw error;

      setObras(data || []);
    } catch (error) {
      console.error('Error loading obras:', error);
    }
  };

  const loadCurrencyConfig = async () => {
    try {
      const { data, error } = await supabase
        ?.from('configuracion_aplicacion')
        ?.select('simbolo_moneda, moneda')
        ?.single();

      if (error && error?.code !== 'PGRST116') throw error;

      if (data) {
        setCurrencyConfig({
          symbol: data?.simbolo_moneda || '$',
          currency: data?.moneda || 'MXN'
        });
      }
    } catch (error) {
      console.error('Error loading currency config:', error);
    }
  };

  const loadAuditLogs = async () => {
    try {
      const { data, error } = await supabase
        ?.from('logs_actividad')
        ?.select(`
          id,
          accion,
          descripcion,
          fecha,
          user_profiles:usuario_id (full_name)
        `)
        ?.eq('modulo', 'Payroll')
        ?.order('fecha', { ascending: false })
        ?.limit(50);

      if (error) throw error;

      setAuditLogs(data?.map(log => ({
        id: log?.id,
        action: log?.accion,
        description: log?.descripcion,
        timestamp: log?.fecha,
        user: log?.user_profiles?.full_name || 'Usuario desconocido'
      })) || []);
    } catch (error) {
      console.error('Error loading audit logs:', error);
    }
  };

  const calculateEmployeePayroll = async (employeeId) => {
    try {
      const { data, error } = await supabase
        ?.rpc('calculate_weekly_payroll', {
          p_employee_id: employeeId,
          p_start_date: weekRange?.start,
          p_end_date: weekRange?.end
        });

      if (error) {
        console.error('Error calculating payroll:', error);
        return {
          workedDays: 0,
          regularHours: 0,
          overtimeHours: 0,
          basePay: 0,
          overtimePay: 0,
          grossPay: 0,
          bonuses: 0,
          deductions: 0,
          netPay: 0
        };
      }

      const result = data?.[0] || {};
      return {
        workedDays: result?.dias_trabajados || 0,
        regularHours: parseFloat(result?.horas_regulares || 0),
        overtimeHours: parseFloat(result?.horas_extra || 0),
        basePay: parseFloat(result?.salario_base || 0),
        overtimePay: parseFloat(result?.pago_horas_extra || 0),
        grossPay: parseFloat(result?.salario_bruto || 0),
        bonuses: 0,
        deductions: 0,
        netPay: parseFloat(result?.salario_bruto || 0)
      };
    } catch (error) {
      console.error('Error in calculateEmployeePayroll:', error);
      return {
        workedDays: 0,
        regularHours: 0,
        overtimeHours: 0,
        basePay: 0,
        overtimePay: 0,
        grossPay: 0,
        bonuses: 0,
        deductions: 0,
        netPay: 0
      };
    }
  };

  const handleEmployeeSelect = async (employee) => {
    setSelectedEmployee(employee);
    setProcessing(true);
    setError('');

    try {
      // Load detailed payroll calculations
      const detailedCalculations = await calculateEmployeePayroll(employee?.id);
      setCalculations(detailedCalculations);

      // Load existing adjustments
      const { data: adjustmentsData, error: adjustmentsError } = await supabase
        ?.from('ajustes_nomina')
        ?.select('*')
        ?.eq('empleado_id', employee?.id)
        ?.gte('created_at', weekRange?.start)
        ?.lte('created_at', weekRange?.end + 'T23:59:59');

      if (adjustmentsError) throw adjustmentsError;

      setAdjustments(adjustmentsData?.map(adj => ({
        id: adj?.id,
        type: adj?.tipo,
        category: adj?.categoria,
        amount: parseFloat(adj?.monto),
        description: adj?.descripcion,
        timestamp: adj?.created_at
      })) || []);

    } catch (error) {
      setError(`Error al cargar detalles del empleado: ${error?.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleSaveAdjustment = async (adjustment) => {
    try {
      const { error } = await supabase
        ?.from('ajustes_nomina')
        ?.insert({
          empleado_id: selectedEmployee?.id,
          nomina_id: null, // Will be set when payroll is processed
          tipo: adjustment?.type,
          categoria: adjustment?.category,
          monto: adjustment?.amount,
          descripcion: adjustment?.description,
          autorizado_por: user?.id
        });

      if (error) throw error;

      // Reload employee data
      await handleEmployeeSelect(selectedEmployee);

      // Log activity
      await logActivity('adjustment_added', `Ajuste agregado: ${adjustment?.description}`);

    } catch (error) {
      setError(`Error al guardar ajuste: ${error?.message}`);
    }
  };

  const handleBulkCalculation = async () => {
    setProcessing(true);
    
    try {
      let processed = 0;
      for (const employee of employees) {
        await calculateEmployeePayroll(employee?.id);
        processed++;
      }

      await logActivity('bulk_calculation', `Cálculo masivo completado para ${processed} empleados`);
      await loadEmployees(); // Refresh data

    } catch (error) {
      setError(`Error en cálculo masivo: ${error?.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const logActivity = async (action, description) => {
    try {
      await supabase?.from('logs_actividad')?.insert({
        usuario_id: user?.id,
        rol: userProfile?.role || 'user',
        accion: action,
        modulo: 'Payroll',
        descripcion: description
      });
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  };

  const handleExport = async (format = 'excel') => {
    try {
      const dataToExport = selectedEmployee ? [selectedEmployee] : employees;
      
      // Create CSV content
      const csvContent = [
        ['Código', 'Nombre', 'Sitio', 'Días Trabajados', 'Horas Regulares', 'Horas Extra', 'Salario Base', 'Pago Horas Extra', 'Salario Bruto']?.join(','),
        ...dataToExport?.map(emp => [
          emp?.employeeCode || '',
          emp?.name || '',
          emp?.site || '',
          emp?.workedDays || 0,
          emp?.regularHours || 0,
          emp?.overtimeHours || 0,
          emp?.basePay || 0,
          emp?.overtimePay || 0,
          emp?.grossPay || 0
        ]?.join(','))
      ]?.join('\n');

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `nomina_${weekRange?.start}_${weekRange?.end}.csv`;
      link?.click();

      await logActivity('export', `Datos exportados en formato ${format}`);

    } catch (error) {
      setError(`Error al exportar: ${error?.message}`);
    }
  };

  // Filter employees
  const filteredEmployees = employees?.filter(employee => {
    const matchesSearch = !filters?.search || 
      employee?.name?.toLowerCase()?.includes(filters?.search?.toLowerCase()) ||
      employee?.employeeCode?.toLowerCase()?.includes(filters?.search?.toLowerCase());
    
    const matchesObra = filters?.obra === 'all' || employee?.site === filters?.obra;
    const matchesStatus = filters?.status === 'all' || employee?.status === filters?.status;
    
    return matchesSearch && matchesObra && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
                  site: 'Oficina Central'
                }}
                onLogout={() => navigate('/login')}
              />
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-6">
          <NavigationHeader showBackButton={false} />

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <div className="flex items-center space-x-2">
                <Icon name="AlertCircle" size={20} className="text-destructive" />
                <span className="text-destructive font-medium">Error</span>
              </div>
              <p className="text-destructive mt-1">{error}</p>
            </div>
          )}

          {/* Controls Bar */}
          <div className="mb-6 bg-card border border-border rounded-lg p-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
                {/* Week Range Selector */}
                <div className="flex items-center space-x-2">
                  <Icon name="Calendar" size={16} className="text-muted-foreground" />
                  <Input
                    type="date"
                    label="Inicio"
                    value={weekRange?.start}
                    onChange={(e) => setWeekRange(prev => ({ ...prev, start: e?.target?.value }))}
                    className="w-auto"
                  />
                  <span className="text-muted-foreground">-</span>
                  <Input
                    type="date"
                    label="Fin"
                    value={weekRange?.end}
                    onChange={(e) => setWeekRange(prev => ({ ...prev, end: e?.target?.value }))}
                    className="w-auto"
                  />
                </div>

                {/* Search */}
                <Input
                  type="search"
                  placeholder="Buscar empleado..."
                  value={filters?.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e?.target?.value }))}
                  className="w-64"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  iconName="Download"
                  onClick={() => handleExport('excel')}
                >
                  Exportar
                </Button>
                
                <Button
                  variant="default"
                  iconName="Calculator"
                  onClick={handleBulkCalculation}
                  disabled={processing}
                >
                  {processing ? 'Procesando...' : 'Calcular Todo'}
                </Button>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <PayrollSummaryCards 
            employees={filteredEmployees}
            currencyConfig={currencyConfig}
            weekRange={weekRange}
          />

          {/* Main Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mt-6">
            {/* Employee Selection Grid (40%) */}
            <div className="lg:col-span-2">
              <EmployeeSelectionGrid
                employees={filteredEmployees}
                selectedEmployee={selectedEmployee}
                onEmployeeSelect={handleEmployeeSelect}
                processing={processing}
                currencyConfig={currencyConfig}
              />
            </div>

            {/* Payroll Calculation View (60%) */}
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
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Selecciona un Empleado
                  </h3>
                  <p className="text-muted-foreground">
                    Elige un empleado de la lista para ver los cálculos detallados de nómina
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Audit Trail */}
          {selectedEmployee && (
            <div className="mt-6">
              <AuditTrailPanel
                logs={auditLogs}
                employeeId={selectedEmployee?.id}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default EnhancedEmployeePayrollManagementWithDetailedCalculations;