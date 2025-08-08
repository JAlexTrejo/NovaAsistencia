import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import CurrencyDisplay from '../../../components/ui/CurrencyDisplay';

const DeleteConfirmationModal = ({ isOpen, employee, onClose, onConfirm, loading = false }) => {
  const [confirmText, setConfirmText] = useState('');
  const expectedText = employee?.employee_id || '';

  if (!isOpen || !employee) return null;

  const handleConfirm = () => {
    if (confirmText === expectedText) {
      onConfirm();
    }
  };

  const impactAnalysis = {
    activeAttendance: 12, // Mock data - would be calculated
    pendingPayroll: 1,
    activeIncidents: 2,
    totalRecords: 87
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-6 pt-6 pb-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <Icon name="AlertTriangle" className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Eliminar Empleado
                  </h3>
                  <p className="text-sm text-gray-500">
                    Esta acción no se puede deshacer
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
                disabled={loading}
              >
                <Icon name="X" size={24} />
              </button>
            </div>

            {/* Employee Info */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  {employee?.avatar ? (
                    <img 
                      src={employee?.avatar} 
                      alt={employee?.full_name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                      <Icon name="User" size={20} className="text-gray-600" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-lg font-medium text-gray-900 truncate">
                    {employee?.full_name}
                  </h4>
                  <p className="text-sm text-gray-500">
                    ID: {employee?.employee_id} • {employee?.construction_sites?.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    Salario: <CurrencyDisplay amount={employee?.daily_salary} /> diario
                  </p>
                </div>
              </div>
            </div>

            {/* Impact Analysis */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-900 mb-3">
                Análisis de Impacto
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Registros de asistencia activos</span>
                  <span className="font-medium text-gray-900">{impactAnalysis?.activeAttendance}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Cálculos de nómina pendientes</span>
                  <span className="font-medium text-gray-900">{impactAnalysis?.pendingPayroll}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Incidencias activas</span>
                  <span className="font-medium text-gray-900">{impactAnalysis?.activeIncidents}</span>
                </div>
                <div className="border-t pt-2 flex items-center justify-between text-sm">
                  <span className="text-gray-900 font-medium">Total de registros afectados</span>
                  <span className="font-bold text-gray-900">{impactAnalysis?.totalRecords}</span>
                </div>
              </div>
            </div>

            {/* Cascade Options */}
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <Icon name="Info" className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-yellow-800">
                    Eliminación Suave Activada
                  </h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    El empleado será marcado como eliminado pero los datos históricos se mantendrán por 30 días para auditoría. Durante este período, puede restaurar el empleado.
                  </p>
                </div>
              </div>
            </div>

            {/* Confirmation Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Para confirmar, escriba el ID del empleado: <span className="font-mono bg-gray-100 px-1 rounded">{expectedText}</span>
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e?.target?.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder={`Escriba "${expectedText}" para confirmar`}
                disabled={loading}
              />
            </div>

            {/* Recovery Notice */}
            <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <Icon name="Clock" className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-800">
                  Periodo de recuperación: 30 días
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-gray-50 px-6 py-4 flex items-center justify-end space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirm}
              disabled={loading || confirmText !== expectedText}
              iconName={loading ? 'Loader2' : 'Trash2'}
              className={loading ? 'animate-spin' : ''}
            >
              {loading ? 'Eliminando...' : 'Eliminar Empleado'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;