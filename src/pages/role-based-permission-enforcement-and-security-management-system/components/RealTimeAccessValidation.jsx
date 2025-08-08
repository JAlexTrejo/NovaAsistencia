import React, { useState } from 'react';
import { Eye, AlertTriangle, CheckCircle2, XCircle, Clock, User } from 'lucide-react';

export default function RealTimeAccessValidation({
  validationQueue,
  roleHierarchy,
  users,
  onValidateAccess,
  onEmergencyOverride
}) {
  const [testUserId, setTestUserId] = useState('');
  const [testFeature, setTestFeature] = useState('');
  const [overrideReason, setOverrideReason] = useState('');

  const features = [
    'dashboard',
    'employee_management',
    'payroll_calculation',
    'reports',
    'system_settings',
    'role_management',
    'security_monitoring',
    'attendance_approval',
    'site_management'
  ];

  const handleTestValidation = () => {
    if (testUserId && testFeature) {
      onValidateAccess(testUserId, testFeature);
      setTestFeature('');
    }
  };

  const handleEmergencyOverride = (validation) => {
    if (overrideReason?.trim()) {
      onEmergencyOverride(validation?.userId, validation?.feature, overrideReason);
      setOverrideReason('');
    }
  };

  const getFeatureDescription = (feature) => {
    const descriptions = {
      'dashboard': 'Panel Principal',
      'employee_management': 'Gestión de Empleados',
      'payroll_calculation': 'Cálculo de Nóminas',
      'reports': 'Reportes',
      'system_settings': 'Configuración Sistema',
      'role_management': 'Gestión de Roles',
      'security_monitoring': 'Monitoreo Seguridad',
      'attendance_approval': 'Aprobación Asistencias',
      'site_management': 'Gestión de Sitios'
    };
    return descriptions?.[feature] || feature;
  };

  const getValidationIcon = (hasAccess) => {
    if (hasAccess) {
      return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    } else {
      return <XCircle className="h-5 w-5 text-red-600" />;
    }
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const diff = Math.floor((now - timestamp) / 1000); // seconds

    if (diff < 60) return `hace ${diff}s`;
    if (diff < 3600) return `hace ${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `hace ${Math.floor(diff / 3600)}h`;
    return `hace ${Math.floor(diff / 86400)}d`;
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          <Eye className="h-6 w-6 inline mr-2 text-blue-600" />
          Validación de Acceso en Tiempo Real
        </h2>

        {/* Test Access Panel */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Probar Validación de Acceso</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Usuario
              </label>
              <select
                value={testUserId}
                onChange={(e) => setTestUserId(e?.target?.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Seleccionar usuario...</option>
                {users?.map(user => (
                  <option key={user?.id} value={user?.id}>
                    {user?.full_name} ({roleHierarchy?.[user?.role]?.label || user?.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Funcionalidad
              </label>
              <select
                value={testFeature}
                onChange={(e) => setTestFeature(e?.target?.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Seleccionar funcionalidad...</option>
                {features?.map(feature => (
                  <option key={feature} value={feature}>
                    {getFeatureDescription(feature)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={handleTestValidation}
                disabled={!testUserId || !testFeature}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Probar Acceso
              </button>
            </div>
          </div>
        </div>

        {/* Real-time Validation Queue */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              <Clock className="h-5 w-5 inline mr-2" />
              Validaciones Recientes
            </h3>
            <span className="text-sm text-gray-600">
              {validationQueue?.length || 0} validaciones en cola
            </span>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {validationQueue?.map((validation) => (
              <div key={validation?.id} className={`border rounded-lg p-4 ${
                validation?.hasAccess ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
              }`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="flex-shrink-0 mt-1">
                      {getValidationIcon(validation?.hasAccess)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="font-medium text-gray-900">
                          {validation?.userName}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          roleHierarchy?.[validation?.userRole]?.color || 'bg-gray-100 text-gray-800'
                        }`}>
                          {roleHierarchy?.[validation?.userRole]?.label || validation?.userRole}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-gray-600">Función solicitada:</p>
                          <p className="font-medium text-gray-900">
                            {getFeatureDescription(validation?.feature)}
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-gray-600">Roles requeridos:</p>
                          <div className="flex flex-wrap gap-1">
                            {validation?.requiredRoles?.map(role => (
                              <span key={role} className={`px-1 py-0.5 rounded text-xs font-medium ${
                                roleHierarchy?.[role]?.color || 'bg-gray-100 text-gray-800'
                              }`}>
                                {roleHierarchy?.[role]?.label || role}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center text-xs text-gray-500">
                          <Clock className="h-3 w-3 mr-1" />
                          {getTimeAgo(validation?.timestamp)}
                        </div>
                        
                        <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                          validation?.hasAccess 
                            ? 'bg-green-100 text-green-800' :'bg-red-100 text-red-800'
                        }`}>
                          {validation?.hasAccess ? 'ACCESO PERMITIDO' : 'ACCESO DENEGADO'}
                        </div>
                      </div>
                      
                      {/* Emergency Override for Denied Access */}
                      {!validation?.hasAccess && (
                        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                          <div className="flex items-center mb-2">
                            <AlertTriangle className="h-4 w-4 text-yellow-600 mr-2" />
                            <span className="text-sm font-medium text-yellow-800">
                              Override de Emergencia
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={overrideReason}
                              onChange={(e) => setOverrideReason(e?.target?.value)}
                              placeholder="Razón del override..."
                              className="flex-1 px-2 py-1 text-sm border border-yellow-300 rounded focus:ring-yellow-500 focus:border-yellow-500"
                            />
                            <button
                              onClick={() => handleEmergencyOverride(validation)}
                              disabled={!overrideReason?.trim()}
                              className="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 disabled:opacity-50"
                            >
                              Override
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {validationQueue?.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No hay validaciones recientes</p>
              <p className="text-sm">
                Use el panel de prueba arriba para simular validaciones de acceso
              </p>
            </div>
          )}
        </div>

        {/* Validation Statistics */}
        {validationQueue?.length > 0 && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-3">Estadísticas de Validación</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {validationQueue?.length}
                </p>
                <p className="text-gray-600">Total Validaciones</p>
              </div>
              
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {validationQueue?.filter(v => v?.hasAccess)?.length}
                </p>
                <p className="text-gray-600">Accesos Permitidos</p>
              </div>
              
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">
                  {validationQueue?.filter(v => !v?.hasAccess)?.length}
                </p>
                <p className="text-gray-600">Accesos Denegados</p>
              </div>
              
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">
                  {Math.round((validationQueue?.filter(v => v?.hasAccess)?.length / validationQueue?.length) * 100)}%
                </p>
                <p className="text-gray-600">Tasa de Éxito</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}