import React, { useState, useEffect } from 'react';
import { TrendingUp, Play, AlertCircle, Download, Filter } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import brandingService from '../../services/brandingService';
import { supabase } from '../../lib/supabase';
import PayrollCalculationDashboard from './components/PayrollCalculationDashboard';
import EmployeePayrollGrid from './components/EmployeePayrollGrid';

export default function RealTimePayrollAutomationEngine() {
  const { user, userProfile, isAdmin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [payrollData, setPayrollData] = useState([]);
  const [currentWeek, setCurrentWeek] = useState({
    start: null,
    end: null
  });
  const [automationStatus, setAutomationStatus] = useState('active');
  const [lastProcessing, setLastProcessing] = useState(null);
  const [nextCutoff, setNextCutoff] = useState(null);
  const [processingSummary, setProcessingSummary] = useState({
    totalEmployees: 0,
    processedCount: 0,
    totalPayroll: 0,
    pendingApprovals: 0
  });
  const [filters, setFilters] = useState({
    site: '',
    status: 'all',
    department: ''
  });
  const [sites, setSites] = useState([]);
  const [error, setError] = useState('');

  // Get current week dates (Sunday to Saturday)
  const getCurrentWeekDates = () => {
    const now = new Date();
    const currentDay = now?.getDay();
    const startOfWeek = new Date(now);
    startOfWeek?.setDate(now?.getDate() - currentDay);
    startOfWeek?.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek?.setDate(startOfWeek?.getDate() + 6);
    endOfWeek?.setHours(23, 59, 59, 999);

    return {
      start: startOfWeek?.toISOString()?.split('T')?.[0],
      end: endOfWeek?.toISOString()?.split('T')?.[0]
    };
  };

  // Calculate next Sunday cutoff
  const getNextCutoff = () => {
    const now = new Date();
    const currentDay = now?.getDay();
    const nextSunday = new Date(now);
    nextSunday?.setDate(now?.getDate() + (7 - currentDay));
    nextSunday?.setHours(23, 59, 0, 0);
    return nextSunday;
  };

  // Load construction sites for filtering
  const loadSites = async () => {
    try {
      const { data, error } = await supabase
        ?.from('construction_sites')
        ?.select('id, name')
        ?.eq('is_active', true)
        ?.order('name');

      if (error) throw error;
      setSites(data || []);
    } catch (error) {
      console.error('Error loading sites:', error);
    }
  };

  // Load real-time payroll data
  const loadPayrollData = async () => {
    if (!currentWeek?.start) return;
    
    setLoading(true);
    setError('');

    try {
      let query = supabase
        ?.from('employee_profiles')
        ?.select(`
          id,
          employee_id,
          full_name,
          position,
          hourly_rate,
          daily_salary,
          salary_type,
          status,
          site_id,
          construction_sites:site_id (
            id,
            name
          ),
          payroll_estimations!inner (
            week_start,
            week_end,
            regular_hours,
            overtime_hours,
            base_pay,
            overtime_pay,
            bonuses,
            deductions,
            gross_total,
            net_total,
            updated_at
          )
        `)
        ?.eq('status', 'active')
        ?.eq('payroll_estimations.week_start', currentWeek?.start);

      // Apply filters
      if (filters?.site) {
        query = query?.eq('site_id', filters?.site);
      }

      const { data, error } = await query?.order('full_name');

      if (error) throw error;

      const processedData = data?.map(emp => ({
        id: emp?.id,
        employeeId: emp?.employee_id,
        name: emp?.full_name,
        position: emp?.position,
        site: emp?.construction_sites?.name || 'Sin asignar',
        siteId: emp?.site_id,
        salaryType: emp?.salary_type,
        hourlyRate: parseFloat(emp?.hourly_rate || 0),
        dailySalary: parseFloat(emp?.daily_salary || 0),
        payroll: emp?.payroll_estimations?.[0] ? {
          weekStart: emp?.payroll_estimations?.[0]?.week_start,
          weekEnd: emp?.payroll_estimations?.[0]?.week_end,
          regularHours: parseFloat(emp?.payroll_estimations?.[0]?.regular_hours || 0),
          overtimeHours: parseFloat(emp?.payroll_estimations?.[0]?.overtime_hours || 0),
          basePay: parseFloat(emp?.payroll_estimations?.[0]?.base_pay || 0),
          overtimePay: parseFloat(emp?.payroll_estimations?.[0]?.overtime_pay || 0),
          bonuses: parseFloat(emp?.payroll_estimations?.[0]?.bonuses || 0),
          deductions: parseFloat(emp?.payroll_estimations?.[0]?.deductions || 0),
          grossTotal: parseFloat(emp?.payroll_estimations?.[0]?.gross_total || 0),
          netTotal: parseFloat(emp?.payroll_estimations?.[0]?.net_total || 0),
          lastUpdated: emp?.payroll_estimations?.[0]?.updated_at
        } : null
      })) || [];

      setPayrollData(processedData);

      // Update summary
      const summary = {
        totalEmployees: processedData?.length,
        processedCount: processedData?.filter(emp => emp?.payroll)?.length,
        totalPayroll: processedData?.reduce((sum, emp) => sum + (emp?.payroll?.grossTotal || 0), 0),
        pendingApprovals: processedData?.filter(emp => emp?.payroll && emp?.payroll?.grossTotal > 0)?.length
      };

      setProcessingSummary(summary);

    } catch (error) {
      setError(`Error cargando datos de nómina: ${error?.message}`);
      console.error('Error loading payroll data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Trigger payroll calculation for all employees
  const triggerAutomaticCalculation = async () => {
    if (!currentWeek?.start) return;

    setLoading(true);
    setError('');

    try {
      // Get all active employees
      const { data: employees, error: empError } = await supabase
        ?.from('employee_profiles')
        ?.select('id')
        ?.eq('status', 'active');

      if (empError) throw empError;

      // Calculate payroll for each employee using the database function
      let processedCount = 0;
      const calculationPromises = employees?.map(async (emp) => {
        try {
          const { error: calcError } = await supabase
            ?.rpc('calculate_weekly_payroll', {
              p_employee_id: emp?.id,
              p_week_start: currentWeek?.start
            });

          if (!calcError) {
            processedCount++;
          }
        } catch (error) {
          console.error(`Error calculating payroll for employee ${emp?.id}:`, error);
        }
      });

      await Promise.all(calculationPromises || []);

      // Log the bulk processing activity
      await supabase?.from('logs_actividad')?.insert({
        usuario_id: user?.id,
        rol: userProfile?.role,
        accion: 'bulk_payroll_calculation',
        modulo: 'Payroll Automation',
        descripcion: `Cálculo automático de nómina para ${processedCount} empleados - Semana ${currentWeek?.start}`
      });

      setLastProcessing(new Date());
      
      // Reload data to show updated calculations
      await loadPayrollData();

    } catch (error) {
      setError(`Error en procesamiento automático: ${error?.message}`);
      console.error('Error in automatic calculation:', error);
    } finally {
      setLoading(false);
    }
  };

  // Export payroll data
  const exportPayrollData = async () => {
    try {
      const csvContent = [
        ['Empleado', 'Sitio', 'Horas Regulares', 'Horas Extra', 'Pago Base', 'Pago Extra', 'Bonos', 'Deducciones', 'Total Bruto', 'Total Neto'],
        ...payrollData?.map(emp => [
          emp?.name,
          emp?.site,
          emp?.payroll?.regularHours || 0,
          emp?.payroll?.overtimeHours || 0,
          brandingService?.formatCurrency(emp?.payroll?.basePay || 0),
          brandingService?.formatCurrency(emp?.payroll?.overtimePay || 0),
          brandingService?.formatCurrency(emp?.payroll?.bonuses || 0),
          brandingService?.formatCurrency(emp?.payroll?.deductions || 0),
          brandingService?.formatCurrency(emp?.payroll?.grossTotal || 0),
          brandingService?.formatCurrency(emp?.payroll?.netTotal || 0)
        ])
      ]?.map(row => row?.join(','))?.join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL?.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nomina_${currentWeek?.start}.csv`;
      document.body?.appendChild(a);
      a?.click();
      document.body?.removeChild(a);
      window.URL?.revokeObjectURL(url);
    } catch (error) {
      setError('Error al exportar datos');
    }
  };

  // Real-time subscription to payroll changes
  useEffect(() => {
    if (!currentWeek?.start) return;

    const channel = supabase
      ?.channel('payroll_estimations_changes')
      ?.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payroll_estimations',
          filter: `week_start=eq.${currentWeek?.start}`
        },
        (payload) => {
          console.log('Payroll estimation updated:', payload);
          // Reload data when estimations change
          loadPayrollData();
        }
      )
      ?.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attendance_records'
        },
        (payload) => {
          console.log('Attendance updated:', payload);
          // Recalculate payroll when attendance changes
          if (automationStatus === 'active') {
            setTimeout(() => {
              triggerAutomaticCalculation();
            }, 2000); // Delay to allow attendance processing to complete
          }
        }
      )
      ?.subscribe();

    return () => {
      supabase?.removeChannel(channel);
    };
  }, [currentWeek?.start, automationStatus]);

  useEffect(() => {
    const week = getCurrentWeekDates();
    setCurrentWeek(week);
    setNextCutoff(getNextCutoff());
  }, []);

  useEffect(() => {
    if (currentWeek?.start) {
      loadPayrollData();
      loadSites();
    }
  }, [currentWeek?.start, filters?.site]);

  if (!isAdmin()) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h1>
          <p className="text-gray-600">No tienes permisos para acceder al motor de nómina.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <TrendingUp className="h-8 w-8 text-blue-600 mr-3" />
                Motor de Nómina en Tiempo Real
              </h1>
              <p className="mt-2 text-gray-600">
                Procesamiento automático semanal con cortes los domingos a medianoche
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                automationStatus === 'active' ?'bg-green-100 text-green-800' :'bg-red-100 text-red-800'
              }`}>
                {automationStatus === 'active' ? 'Automatización Activa' : 'Automatización Pausada'}
              </div>
              <button
                onClick={() => setAutomationStatus(automationStatus === 'active' ? 'paused' : 'active')}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                {automationStatus === 'active' ? 'Pausar' : 'Activar'}
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Error Alert */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        </div>
      )}
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Panel: Calculation Dashboard */}
          <div className="space-y-6">
            <PayrollCalculationDashboard
              currentWeek={currentWeek}
              nextCutoff={nextCutoff}
              lastProcessing={lastProcessing}
              processingSummary={processingSummary}
              automationStatus={automationStatus}
              onTriggerCalculation={triggerAutomaticCalculation}
              loading={loading}
            />

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Play className="h-5 w-5 text-blue-600 mr-2" />
                Acciones Rápidas
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={triggerAutomaticCalculation}
                  disabled={loading}
                  className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  {loading ? 'Procesando...' : 'Calcular Ahora'}
                </button>
                <button
                  onClick={exportPayrollData}
                  className="flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exportar CSV
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Filter className="h-5 w-5 text-gray-600 mr-2" />
                Filtros
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sitio de Construcción
                  </label>
                  <select
                    value={filters?.site}
                    onChange={(e) => setFilters({...filters, site: e?.target?.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Todos los sitios</option>
                    {sites?.map(site => (
                      <option key={site?.id} value={site?.id}>
                        {site?.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel: Employee Payroll Grid */}
          <div className="space-y-6">
            <EmployeePayrollGrid
              payrollData={payrollData}
              loading={loading}
              currentWeek={currentWeek}
              onEmployeeUpdate={loadPayrollData}
            />
          </div>
        </div>
      </div>
    </div>
  );
}