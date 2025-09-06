import React, { useState } from 'react';
import { User, MapPin, Clock, DollarSign, TrendingUp, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import brandingService from '../../../services/brandingService';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';

export default function EmployeePayrollGrid({ payrollData, loading, currentWeek, onEmployeeUpdate }) {
  const { user, userProfile } = useAuth();
  const [updatingEmployees, setUpdatingEmployees] = useState(new Set());
  const [error, setError] = useState('');

  const recalculateEmployeePayroll = async (employeeId) => {
    if (!currentWeek?.start || updatingEmployees?.has(employeeId)) return;

    setUpdatingEmployees(prev => new Set([...prev, employeeId]));
    setError('');

    try {
      const { error: calcError } = await supabase
        ?.rpc('calculate_weekly_payroll', {
          p_employee_id: employeeId,
          p_week_start: currentWeek?.start
        });

      if (calcError) throw calcError;

      // Log the recalculation activity
      await supabase?.from('logs_actividad')?.insert({
        usuario_id: user?.id,
        rol: userProfile?.role,
        accion: 'payroll_recalculation',
        modulo: 'Payroll Automation',
        descripcion: `Nómina recalculada para empleado: ${employeeId}`
      });

      // Trigger parent component update
      if (onEmployeeUpdate) {
        onEmployeeUpdate();
      }

    } catch (error) {
      setError(`Error recalculando nómina: ${error?.message}`);
    } finally {
      setUpdatingEmployees(prev => {
        const newSet = new Set(prev);
        newSet?.delete(employeeId);
        return newSet;
      });
    }
  };

  const getPayrollStatus = (employee) => {
    if (updatingEmployees?.has(employee?.id)) {
      return { text: 'Calculando...', color: 'yellow', icon: RefreshCw, spin: true };
    }
    
    if (!employee?.payroll) {
      return { text: 'Sin datos', color: 'gray', icon: AlertCircle };
    }
    
    if (employee?.payroll?.grossTotal > 0) {
      return { text: 'Calculado', color: 'green', icon: CheckCircle };
    }
    
    return { text: 'En proceso', color: 'yellow', icon: Clock };
  };

  const formatHours = (hours) => {
    return `${parseFloat(hours || 0)?.toFixed(1)}h`;
  };

  const formatLastUpdate = (timestamp) => {
    if (!timestamp) return 'Nunca';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now?.getTime() - date?.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Ahora mismo';
    if (diffMins < 60) return `${diffMins}m`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h`;
    
    return date?.toLocaleDateString('es-MX');
  };

  if (loading && payrollData?.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <User className="h-6 w-6 text-blue-600 mr-2" />
            Nómina de Empleados
          </h2>
        </div>
        <div className="p-8 text-center">
          <RefreshCw className="h-12 w-12 text-gray-400 mx-auto animate-spin mb-4" />
          <p className="text-gray-500">Cargando datos de nómina...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <User className="h-6 w-6 text-blue-600 mr-2" />
              Nómina de Empleados
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {payrollData?.length} empleados • Actualización en tiempo real
            </p>
          </div>
          {loading && (
            <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />
          )}
        </div>
      </div>
      {/* Error Alert */}
      {error && (
        <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <span className="text-red-700 text-sm">{error}</span>
          </div>
        </div>
      )}
      {/* Employee Grid */}
      <div className="p-6">
        {payrollData?.length === 0 ? (
          <div className="text-center py-12">
            <User className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Sin empleados encontrados</h3>
            <p className="text-gray-500">No hay empleados con datos para la semana seleccionada.</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {payrollData?.map((employee) => {
              const status = getPayrollStatus(employee);
              const StatusIcon = status?.icon;
              
              return (
                <div key={employee?.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <div className="bg-blue-100 rounded-full p-2 mr-3">
                        <User className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{employee?.name}</h3>
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <span className="bg-gray-100 px-2 py-1 rounded text-xs mr-2">
                            {employee?.position || 'Sin puesto'}
                          </span>
                          {employee?.site && (
                            <div className="flex items-center">
                              <MapPin className="h-3 w-3 mr-1" />
                              <span>{employee?.site}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        status?.color === 'green' ? 'bg-green-100 text-green-800' :
                        status?.color === 'yellow'? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        <StatusIcon className={`h-3 w-3 mr-1 ${status?.spin ? 'animate-spin' : ''}`} />
                        {status?.text}
                      </div>
                      
                      <button
                        onClick={() => recalculateEmployeePayroll(employee?.id)}
                        disabled={updatingEmployees?.has(employee?.id)}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors disabled:opacity-50"
                        title="Recalcular nómina"
                      >
                        <RefreshCw className={`h-4 w-4 ${updatingEmployees?.has(employee?.id) ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                  </div>
                  {employee?.payroll ? (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Hours */}
                      <div className="bg-blue-50 rounded-lg p-3">
                        <div className="flex items-center mb-1">
                          <Clock className="h-4 w-4 text-blue-600 mr-1" />
                          <span className="text-xs text-blue-600 font-medium">Horas</span>
                        </div>
                        <p className="text-sm text-gray-900">
                          <span className="font-medium">{formatHours(employee?.payroll?.regularHours)}</span>
                          {employee?.payroll?.overtimeHours > 0 && (
                            <span className="text-orange-600 ml-1">
                              +{formatHours(employee?.payroll?.overtimeHours)} extra
                            </span>
                          )}
                        </p>
                      </div>

                      {/* Base Pay */}
                      <div className="bg-green-50 rounded-lg p-3">
                        <div className="flex items-center mb-1">
                          <DollarSign className="h-4 w-4 text-green-600 mr-1" />
                          <span className="text-xs text-green-600 font-medium">Pago Base</span>
                        </div>
                        <p className="text-sm font-medium text-gray-900">
                          {brandingService?.formatCurrency(employee?.payroll?.basePay || 0)}
                        </p>
                      </div>

                      {/* Overtime Pay */}
                      <div className="bg-orange-50 rounded-lg p-3">
                        <div className="flex items-center mb-1">
                          <TrendingUp className="h-4 w-4 text-orange-600 mr-1" />
                          <span className="text-xs text-orange-600 font-medium">Extra</span>
                        </div>
                        <p className="text-sm font-medium text-gray-900">
                          {brandingService?.formatCurrency(employee?.payroll?.overtimePay || 0)}
                        </p>
                      </div>

                      {/* Total */}
                      <div className="bg-purple-50 rounded-lg p-3">
                        <div className="flex items-center mb-1">
                          <DollarSign className="h-4 w-4 text-purple-600 mr-1" />
                          <span className="text-xs text-purple-600 font-medium">Total</span>
                        </div>
                        <p className="text-sm font-bold text-purple-900">
                          {brandingService?.formatCurrency(employee?.payroll?.grossTotal || 0)}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-6 text-center">
                      <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Sin registros de asistencia esta semana</p>
                      <button
                        onClick={() => recalculateEmployeePayroll(employee?.id)}
                        disabled={updatingEmployees?.has(employee?.id)}
                        className="mt-2 text-sm text-blue-600 hover:text-blue-800 transition-colors disabled:opacity-50"
                      >
                        Calcular nómina
                      </button>
                    </div>
                  )}
                  {/* Last Update */}
                  <div className="mt-3 text-xs text-gray-500 text-right">
                    Actualizado: {formatLastUpdate(employee?.payroll?.lastUpdated)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}