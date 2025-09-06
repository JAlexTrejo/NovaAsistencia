import React from 'react';
import { Calendar, Clock, DollarSign, Users, TrendingUp, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import brandingService from '../../../services/brandingService';

export default function PayrollCalculationDashboard({ 
  currentWeek, 
  nextCutoff, 
  lastProcessing, 
  processingSummary, 
  automationStatus,
  onTriggerCalculation,
  loading 
}) {
  
  const formatTimeUntilCutoff = () => {
    if (!nextCutoff) return 'N/A';
    
    const now = new Date();
    const diffMs = nextCutoff?.getTime() - now?.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (diffDays > 0) {
      return `${diffDays}d ${diffHours}h`;
    } else if (diffHours > 0) {
      return `${diffHours}h`;
    } else {
      return 'Próximo corte';
    }
  };

  const getProcessingStatus = () => {
    if (loading) return { text: 'Procesando...', color: 'yellow', icon: RefreshCw };
    if (processingSummary?.processedCount === processingSummary?.totalEmployees && processingSummary?.totalEmployees > 0) {
      return { text: 'Completado', color: 'green', icon: CheckCircle };
    }
    if (processingSummary?.processedCount > 0) {
      return { text: 'Parcial', color: 'yellow', icon: AlertTriangle };
    }
    return { text: 'Pendiente', color: 'gray', icon: Clock };
  };

  const processingStatus = getProcessingStatus();
  const StatusIcon = processingStatus?.icon;

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center">
          <TrendingUp className="h-6 w-6 text-blue-600 mr-2" />
          Dashboard de Cálculos
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Monitoreo en tiempo real del procesamiento de nómina
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Current Week Info */}
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-blue-900">Semana Actual</h3>
              <p className="text-lg font-bold text-blue-700">
                {currentWeek?.start && currentWeek?.end 
                  ? `${new Date(currentWeek?.start)?.toLocaleDateString('es-MX')} - ${new Date(currentWeek?.end)?.toLocaleDateString('es-MX')}`
                  : 'Cargando...'
                }
              </p>
            </div>
            <Calendar className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        {/* Processing Status */}
        <div className="grid grid-cols-2 gap-4">
          <div className={`rounded-lg p-4 ${
            processingStatus?.color === 'green' ? 'bg-green-50' :
            processingStatus?.color === 'yellow' ? 'bg-yellow-50' :
            processingStatus?.color === 'gray' ? 'bg-gray-50' : 'bg-gray-50'
          }`}>
            <div className="flex items-center">
              <StatusIcon className={`h-5 w-5 mr-2 ${
                processingStatus?.color === 'green' ? 'text-green-600' :
                processingStatus?.color === 'yellow'? 'text-yellow-600' : 'text-gray-600'
              } ${loading ? 'animate-spin' : ''}`} />
              <div>
                <p className="text-sm font-medium text-gray-900">Estado</p>
                <p className={`text-sm ${
                  processingStatus?.color === 'green' ? 'text-green-700' :
                  processingStatus?.color === 'yellow'? 'text-yellow-700' : 'text-gray-700'
                }`}>
                  {processingStatus?.text}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center">
              <Clock className="h-5 w-5 text-purple-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-gray-900">Próximo Corte</p>
                <p className="text-sm text-purple-700">{formatTimeUntilCutoff()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-gray-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {processingSummary?.processedCount || 0}
                </p>
                <p className="text-sm text-gray-600">
                  de {processingSummary?.totalEmployees || 0} empleados
                </p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-xl font-bold text-green-900">
                  {brandingService?.formatCurrency(processingSummary?.totalPayroll || 0)}
                </p>
                <p className="text-sm text-green-600">Total Nómina</p>
              </div>
            </div>
          </div>
        </div>

        {/* Last Processing Info */}
        {lastProcessing && (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Último Procesamiento</p>
                <p className="text-sm text-gray-600">
                  {lastProcessing?.toLocaleString('es-MX', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
          </div>
        )}

        {/* Automation Settings */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Configuración de Automatización</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">Corte Automático</p>
                <p className="text-xs text-gray-600">Domingos 23:59</p>
              </div>
              <div className="text-green-600">
                <CheckCircle className="h-5 w-5" />
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">Cálculo en Tiempo Real</p>
                <p className="text-xs text-gray-600">Al registrar asistencia</p>
              </div>
              <div className={automationStatus === 'active' ? 'text-green-600' : 'text-red-600'}>
                {automationStatus === 'active' ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <AlertTriangle className="h-5 w-5" />
                )}
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">Validación de Conflictos</p>
                <p className="text-xs text-gray-600">Detección automática</p>
              </div>
              <div className="text-green-600">
                <CheckCircle className="h-5 w-5" />
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        {processingSummary?.totalEmployees > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Progreso de Procesamiento</span>
              <span className="text-sm text-gray-500">
                {Math.round((processingSummary?.processedCount / processingSummary?.totalEmployees) * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${(processingSummary?.processedCount / processingSummary?.totalEmployees) * 100}%` 
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}