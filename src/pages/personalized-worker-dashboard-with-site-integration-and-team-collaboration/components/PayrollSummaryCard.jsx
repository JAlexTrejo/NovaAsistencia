import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Calculator, Calendar } from 'lucide-react';

export default function PayrollSummaryCard({ payrollEstimation, weeklyTimecard, workerProfile }) {
  const [estimatedPayroll, setEstimatedPayroll] = useState(null);

  useEffect(() => {
    if (weeklyTimecard && workerProfile) {
      calculateEstimatedPayroll();
    }
  }, [weeklyTimecard, workerProfile]);

  const calculateEstimatedPayroll = () => {
    const regularHours = parseFloat(weeklyTimecard?.totalRegularHours || 0);
    const overtimeHours = parseFloat(weeklyTimecard?.totalOvertimeHours || 0);
    
    let baseRate = 0;
    if (workerProfile?.salary_type === 'hourly') {
      baseRate = parseFloat(workerProfile?.hourly_rate || 0);
    } else {
      // Convert daily salary to hourly (8 hours per day)
      baseRate = parseFloat(workerProfile?.daily_salary || 0) / 8;
    }

    const basePay = baseRate * regularHours;
    const overtimePay = baseRate * overtimeHours * 1.5; // 1.5x for overtime
    const grossTotal = basePay + overtimePay;
    const netTotal = grossTotal * 0.85; // Simplified deductions (15%)

    setEstimatedPayroll({
      regularHours,
      overtimeHours,
      basePay,
      overtimePay,
      grossTotal,
      netTotal,
      baseRate
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    })?.format(amount || 0);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <DollarSign className="h-5 w-5 mr-2" />
          Resumen de Nómina
        </h3>
        <div className="text-sm text-gray-600">
          Semana actual
        </div>
      </div>
      {/* Current Week Estimation */}
      {estimatedPayroll ? (
        <div className="space-y-4">
          {/* Main amount display */}
          <div className="text-center bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border border-green-200">
            <div className="text-3xl font-bold text-green-600 mb-1">
              {formatCurrency(estimatedPayroll?.netTotal)}
            </div>
            <div className="text-sm text-gray-600">
              Estimación Neta Semanal
            </div>
            <div className="text-xs text-gray-500 mt-1">
              (Después de deducciones estimadas)
            </div>
          </div>

          {/* Breakdown */}
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">
                Horas regulares ({estimatedPayroll?.regularHours?.toFixed(1)}h × {formatCurrency(estimatedPayroll?.baseRate)})
              </span>
              <span className="text-sm font-medium text-gray-900">
                {formatCurrency(estimatedPayroll?.basePay)}
              </span>
            </div>

            {estimatedPayroll?.overtimeHours > 0 && (
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">
                  Horas extra ({estimatedPayroll?.overtimeHours?.toFixed(1)}h × {formatCurrency(estimatedPayroll?.baseRate * 1.5)})
                </span>
                <span className="text-sm font-medium text-orange-600">
                  {formatCurrency(estimatedPayroll?.overtimePay)}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm font-semibold text-gray-700">
                Total Bruto
              </span>
              <span className="text-sm font-semibold text-blue-600">
                {formatCurrency(estimatedPayroll?.grossTotal)}
              </span>
            </div>

            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-600">
                Deducciones estimadas (15%)
              </span>
              <span className="text-sm text-red-600">
                -{formatCurrency(estimatedPayroll?.grossTotal * 0.15)}
              </span>
            </div>
          </div>

          {/* Rate information */}
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-800">
                {workerProfile?.salary_type === 'hourly' ? 'Tarifa por Hora' : 'Salario Diario'}
              </span>
              <span className="text-sm font-medium text-blue-900">
                {workerProfile?.salary_type === 'hourly' 
                  ? formatCurrency(workerProfile?.hourly_rate)
                  : formatCurrency(workerProfile?.daily_salary)
                }
              </span>
            </div>
            {workerProfile?.salary_type !== 'hourly' && (
              <div className="text-xs text-blue-700 mt-1">
                Equivale a {formatCurrency(estimatedPayroll?.baseRate)}/hora
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <Calculator className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">
            No hay datos suficientes para calcular nómina
          </p>
          <p className="text-gray-400 text-xs mt-1">
            Complete las horas de trabajo para ver la estimación
          </p>
        </div>
      )}
      {/* Last official payroll (if available) */}
      {payrollEstimation && (
        <div className="border-t border-gray-100 pt-4 mt-4">
          <h5 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
            <Calendar className="h-4 w-4 mr-1" />
            Último Pago Oficial
          </h5>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Semana:</span>
              <span className="text-gray-900">
                {new Date(payrollEstimation?.week_start)?.toLocaleDateString('es-ES')} - {' '}
                {new Date(payrollEstimation?.week_end)?.toLocaleDateString('es-ES')}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Horas trabajadas:</span>
              <span className="text-gray-900">
                {parseFloat(payrollEstimation?.regular_hours || 0)?.toFixed(1)}h regular, {' '}
                {parseFloat(payrollEstimation?.overtime_hours || 0)?.toFixed(1)}h extra
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Monto neto:</span>
              <span className="font-medium text-green-600">
                {formatCurrency(payrollEstimation?.net_total)}
              </span>
            </div>
          </div>
        </div>
      )}
      {/* Performance indicators */}
      {estimatedPayroll && (
        <div className="border-t border-gray-100 pt-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium text-gray-700">
                  Promedio/Día
                </span>
              </div>
              <div className="text-lg font-bold text-green-600">
                {weeklyTimecard?.dailyRecords?.filter(r => r?.total_hours > 0)?.length > 0 
                  ? formatCurrency(estimatedPayroll?.netTotal / weeklyTimecard?.dailyRecords?.filter(r => r?.total_hours > 0)?.length)
                  : formatCurrency(0)
                }
              </div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1">
                <DollarSign className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium text-gray-700">
                  Extra/Mes*
                </span>
              </div>
              <div className="text-lg font-bold text-blue-600">
                {formatCurrency((estimatedPayroll?.overtimePay || 0) * 4)}
              </div>
              <div className="text-xs text-gray-500">*Estimado</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}