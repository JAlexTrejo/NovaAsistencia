import React, { useState } from 'react';
import { Calculator, Clock, DollarSign, Percent, Calendar, TrendingUp } from 'lucide-react';
import CurrencyDisplay from '../../../components/ui/CurrencyDisplay';

export default function PayrollCalculationDashboard({
  weekRange,
  onWeekRangeChange,
  payrollData,
  onCalculatePayroll,
  onCalculateAguinaldo,
  onCalculateSeverance,
  processing
}) {
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [customRates, setCustomRates] = useState({
    regularRate: 0,
    overtimeMultiplier: 1.5,
    nightDifferential: 1.25,
    holidayPremium: 2.0
  });

  const handleWeekChange = (field, value) => {
    onWeekRangeChange({
      ...weekRange,
      [field]: new Date(value)
    });
  };

  const calculatePayroll = async () => {
    if (!selectedEmployee) return;
    await onCalculatePayroll(selectedEmployee);
  };

  const calculateSpecialPayment = async (type) => {
    if (!selectedEmployee) return;
    
    switch (type) {
      case 'aguinaldo':
        await onCalculateAguinaldo(selectedEmployee);
        break;
      case 'severance': await onCalculateSeverance(selectedEmployee,'without_cause');
        break;
      default:
        break;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            <Calculator className="h-6 w-6 inline mr-2 text-blue-600" />
            Panel de Cálculo de Nóminas
          </h2>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 text-gray-400 mr-2" />
              <span className="text-sm text-gray-600">Período de Nómina</span>
            </div>
          </div>
        </div>

        {/* Week Range Selector */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha de Inicio
            </label>
            <input
              type="date"
              value={weekRange?.start?.toISOString()?.split('T')?.[0] || ''}
              onChange={(e) => handleWeekChange('start', e?.target?.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha de Fin
            </label>
            <input
              type="date"
              value={weekRange?.end?.toISOString()?.split('T')?.[0] || ''}
              onChange={(e) => handleWeekChange('end', e?.target?.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Calculation Rates Configuration */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuración de Tarifas</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="h-4 w-4 inline mr-1" />
                Tarifa Regular
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  value={customRates?.regularRate}
                  onChange={(e) => setCustomRates(prev => ({
                    ...prev,
                    regularRate: parseFloat(e?.target?.value) || 0
                  }))}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <TrendingUp className="h-4 w-4 inline mr-1" />
                Multiplicador Horas Extra
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={customRates?.overtimeMultiplier}
                  onChange={(e) => setCustomRates(prev => ({
                    ...prev,
                    overtimeMultiplier: parseFloat(e?.target?.value) || 1.5
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="1.5"
                  step="0.1"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">x</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Percent className="h-4 w-4 inline mr-1" />
                Diferencial Nocturno
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={customRates?.nightDifferential}
                  onChange={(e) => setCustomRates(prev => ({
                    ...prev,
                    nightDifferential: parseFloat(e?.target?.value) || 1.25
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="1.25"
                  step="0.1"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">x</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="h-4 w-4 inline mr-1" />
                Prima Dominical
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={customRates?.holidayPremium}
                  onChange={(e) => setCustomRates(prev => ({
                    ...prev,
                    holidayPremium: parseFloat(e?.target?.value) || 2.0
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="2.0"
                  step="0.1"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">x</span>
              </div>
            </div>
          </div>
        </div>

        {/* Employee Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Seleccionar Empleado
          </label>
          <select
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e?.target?.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Selecciona un empleado...</option>
            {payrollData?.map((employee) => (
              <option key={employee?.employeeId || employee?.id} value={employee?.employeeId || employee?.id}>
                {employee?.employeeName || employee?.name || 'Empleado sin nombre'}
              </option>
            ))}
          </select>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={calculatePayroll}
            disabled={!selectedEmployee || processing}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <Calculator className="h-5 w-5 mr-2" />
            {processing ? 'Calculando...' : 'Calcular Nómina Semanal'}
          </button>

          <button
            onClick={() => calculateSpecialPayment('aguinaldo')}
            disabled={!selectedEmployee || processing}
            className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <DollarSign className="h-5 w-5 mr-2" />
            Calcular Aguinaldo
          </button>

          <button
            onClick={() => calculateSpecialPayment('severance')}
            disabled={!selectedEmployee || processing}
            className="w-full px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <TrendingUp className="h-5 w-5 mr-2" />
            Calcular Finiquito
          </button>
        </div>

        {/* Calculation Results Preview */}
        {selectedEmployee && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-3">Vista Previa de Cálculos</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Horas Regulares:</span>
                <span className="font-medium">40.0h × <CurrencyDisplay amount={customRates?.regularRate} /></span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Horas Extra:</span>
                <span className="font-medium">8.0h × <CurrencyDisplay amount={customRates?.regularRate * customRates?.overtimeMultiplier} /></span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Prima Dominical:</span>
                <span className="font-medium">8.0h × <CurrencyDisplay amount={customRates?.regularRate * customRates?.holidayPremium} /></span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}