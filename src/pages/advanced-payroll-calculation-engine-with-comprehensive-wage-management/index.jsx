import React, { useState, useEffect } from 'react';
import { Calculator, DollarSign, Clock, TrendingUp, Users, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { payrollService } from '../../services/payrollService';
import { employeeService } from '../../services/employeeService';
import BrandedHeader from '../../components/ui/BrandedHeader';
import PayrollCalculationDashboard from './components/PayrollCalculationDashboard';
import EmployeePayrollGrid from './components/EmployeePayrollGrid';
import BulkProcessingTools from './components/BulkProcessingTools';
import PayrollAuditTrail from './components/PayrollAuditTrail';
import CurrencyDisplay from '../../components/ui/CurrencyDisplay';

export default function AdvancedPayrollCalculationEngineWithComprehensiveWageManagement() {
  const { user, userProfile } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [payrollData, setPayrollData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [activeView, setActiveView] = useState('dashboard');
  const [auditEntries, setAuditEntries] = useState([]);
  const [weekRange, setWeekRange] = useState({
    start: new Date(),
    end: new Date()
  });

  // Initialize week range to current week
  useEffect(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek?.setDate(now?.getDate() - now?.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek?.setDate(startOfWeek?.getDate() + 6);
    
    setWeekRange({
      start: startOfWeek,
      end: endOfWeek
    });
  }, []);

  // Load employees with payroll data
  useEffect(() => {
    if (!user) return;

    const loadEmployeesAndPayroll = async () => {
      try {
        setLoading(true);
        const employeeData = await employeeService?.getAllEmployees();
        setEmployees(employeeData || []);

        // Load existing payroll data for current week
        const startDate = weekRange?.start?.toISOString()?.split('T')?.[0];
        const payrollSummary = await payrollService?.getPayrollSummary(startDate, startDate);
        setPayrollData(payrollSummary || []);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadEmployeesAndPayroll();
  }, [user, weekRange]);

  // Calculate payroll for single employee
  const calculateSinglePayroll = async (employeeId) => {
    try {
      setProcessing(true);
      const startDate = weekRange?.start?.toISOString()?.split('T')?.[0];
      
      const calculation = await payrollService?.calculateWeeklyPayroll(
        employeeId, 
        startDate, 
        weekRange?.end?.toISOString()?.split('T')?.[0]
      );

      // Update payroll data
      setPayrollData(prev => {
        const updated = prev?.filter(p => p?.employeeId !== employeeId);
        return [...updated, calculation];
      });

      // Add audit entry
      const employee = employees?.find(e => e?.id === employeeId);
      setAuditEntries(prev => [...prev, {
        id: Date.now(),
        action: 'calculate_payroll',
        employee: employee?.full_name || 'Unknown',
        amount: calculation?.grossPay || 0,
        timestamp: new Date(),
        user: userProfile?.full_name || 'System'
      }]);

    } catch (error) {
      console.error('Error calculating payroll:', error);
    } finally {
      setProcessing(false);
    }
  };

  // Bulk calculate payroll for selected employees
  const calculateBulkPayroll = async () => {
    if (selectedEmployees?.length === 0) return;

    try {
      setProcessing(true);
      const calculations = [];
      
      for (const employeeId of selectedEmployees) {
        const startDate = weekRange?.start?.toISOString()?.split('T')?.[0];
        const calculation = await payrollService?.calculateWeeklyPayroll(
          employeeId,
          startDate,
          weekRange?.end?.toISOString()?.split('T')?.[0]
        );
        calculations?.push(calculation);
      }

      // Update payroll data
      setPayrollData(prev => {
        const filtered = prev?.filter(p => !selectedEmployees?.includes(p?.employeeId));
        return [...filtered, ...calculations];
      });

      // Add bulk audit entry
      setAuditEntries(prev => [...prev, {
        id: Date.now(),
        action: 'bulk_calculate',
        employee: `${selectedEmployees?.length} employees`,
        amount: calculations?.reduce((sum, calc) => sum + (calc?.grossPay || 0), 0),
        timestamp: new Date(),
        user: userProfile?.full_name || 'System'
      }]);

    } catch (error) {
      console.error('Error in bulk calculation:', error);
    } finally {
      setProcessing(false);
    }
  };

  // Calculate Christmas bonus (Aguinaldo)
  const calculateAguinaldo = async (employeeId, daysWorked = 365) => {
    try {
      const employee = employees?.find(e => e?.id === employeeId);
      if (!employee) return;

      // 15-day minimum requirement based on daily salary
      const dailySalary = employee?.daily_salary || 0;
      const aguinaldo = (dailySalary * 15 * daysWorked) / 365;

      setAuditEntries(prev => [...prev, {
        id: Date.now(),
        action: 'calculate_aguinaldo',
        employee: employee?.full_name,
        amount: aguinaldo,
        timestamp: new Date(),
        user: userProfile?.full_name || 'System',
        details: `${daysWorked} days worked`
      }]);

      return aguinaldo;
    } catch (error) {
      console.error('Error calculating aguinaldo:', error);
    }
  };

  // Calculate severance payment (Finiquito)
  const calculateSeverance = async (employeeId, terminationReason = 'voluntary') => {
    try {
      const employee = employees?.find(e => e?.id === employeeId);
      if (!employee) return;

      const dailySalary = employee?.daily_salary || 0;
      let severanceAmount = 0;

      // Different calculations based on termination type
      switch (terminationReason) {
        case 'without_cause':
          severanceAmount = dailySalary * 90; // 90-day salary
          break;
        case 'voluntary':
          severanceAmount = dailySalary * 20; // 20-day vacation premium
          break;
        default:
          severanceAmount = dailySalary * 30;
      }

      setAuditEntries(prev => [...prev, {
        id: Date.now(),
        action: 'calculate_severance',
        employee: employee?.full_name,
        amount: severanceAmount,
        timestamp: new Date(),
        user: userProfile?.full_name || 'System',
        details: `Reason: ${terminationReason}`
      }]);

      return severanceAmount;
    } catch (error) {
      console.error('Error calculating severance:', error);
    }
  };

  // Process payroll (mark as approved)
  const processPayroll = async (payrollId) => {
    try {
      await payrollService?.processPayroll(payrollId, user?.id);
      
      // Update local state
      setPayrollData(prev => 
        prev?.map(p => 
          p?.id === payrollId 
            ? { ...p, processed: true, processedBy: user?.id, processedAt: new Date() }
            : p
        )
      );
    } catch (error) {
      console.error('Error processing payroll:', error);
    }
  };

  const stats = {
    totalEmployees: employees?.length,
    processedPayroll: payrollData?.filter(p => p?.processed)?.length,
    totalGrossPay: payrollData?.reduce((sum, p) => sum + (p?.grossPay || 0), 0),
    totalNetPay: payrollData?.reduce((sum, p) => sum + (p?.netPay || 0), 0)
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Cargando motor de nóminas...</span>
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
      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Empleados</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalEmployees}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Nóminas Procesadas</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.processedPayroll}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-emerald-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Salario Bruto</p>
                <p className="text-2xl font-bold text-gray-900">
                  <CurrencyDisplay amount={stats?.totalGrossPay} />
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
                  <CurrencyDisplay amount={stats?.totalNetPay} />
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
                className={`px-6 py-3 font-medium text-sm border-b-2 ${
                  activeView === 'dashboard' ?'border-blue-500 text-blue-600' :'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Calculator className="h-4 w-4 inline mr-2" />
                Panel de Cálculo
              </button>

              <button
                onClick={() => setActiveView('employees')}
                className={`px-6 py-3 font-medium text-sm border-b-2 ${
                  activeView === 'employees' ?'border-blue-500 text-blue-600' :'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Users className="h-4 w-4 inline mr-2" />
                Lista de Empleados
              </button>

              <button
                onClick={() => setActiveView('bulk')}
                className={`px-6 py-3 font-medium text-sm border-b-2 ${
                  activeView === 'bulk' ?'border-blue-500 text-blue-600' :'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <FileText className="h-4 w-4 inline mr-2" />
                Procesamiento Masivo
              </button>

              <button
                onClick={() => setActiveView('audit')}
                className={`px-6 py-3 font-medium text-sm border-b-2 ${
                  activeView === 'audit' ?'border-blue-500 text-blue-600' :'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <AlertCircle className="h-4 w-4 inline mr-2" />
                Auditoría
              </button>
            </nav>
          </div>
        </div>

        {/* Content Area */}
        <div className="grid grid-cols-12 gap-8">
          {/* Main Content (60%) */}
          <div className="col-span-12 lg:col-span-7">
            {activeView === 'dashboard' && (
              <PayrollCalculationDashboard
                weekRange={weekRange}
                onWeekRangeChange={setWeekRange}
                payrollData={payrollData}
                onCalculatePayroll={calculateSinglePayroll}
                onCalculateAguinaldo={calculateAguinaldo}
                onCalculateSeverance={calculateSeverance}
                processing={processing}
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
                processing={processing}
              />
            )}

            {activeView === 'bulk' && (
              <BulkProcessingTools
                selectedEmployees={selectedEmployees}
                employees={employees}
                onBulkCalculate={calculateBulkPayroll}
                processing={processing}
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

          {/* Sidebar (40%) */}
          <div className="col-span-12 lg:col-span-5">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  <Clock className="h-5 w-5 inline mr-2" />
                  Actualizaciones en Tiempo Real
                </h3>
                
                <div className="space-y-4">
                  {payrollData?.slice(0, 5)?.map((payroll, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium text-sm">{payroll?.employeeName || 'Empleado'}</p>
                        <p className="text-xs text-gray-500">
                          {payroll?.regularHours || 0}h normales, {payroll?.overtimeHours || 0}h extra
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm">
                          <CurrencyDisplay amount={payroll?.grossPay || 0} />
                        </p>
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          payroll?.processed 
                            ? 'bg-green-100 text-green-800' :'bg-yellow-100 text-yellow-800'
                        }`}>
                          {payroll?.processed ? 'Procesada' : 'Pendiente'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {payrollData?.length === 0 && (
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
                    disabled={selectedEmployees?.length === 0 || processing}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Calcular Nómina Semanal
                  </button>

                  <button
                    onClick={() => calculateBulkPayroll()}
                    disabled={processing}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    Generar Aguinaldos
                  </button>

                  <button
                    onClick={() => calculateBulkPayroll()}
                    disabled={processing}
                    className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
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