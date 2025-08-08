import React, { useState } from 'react';
import { Key, Check, X, Eye, Settings, Lock } from 'lucide-react';

export default function PermissionMatrix({
  permissions,
  roleHierarchy,
  featurePermissions,
  onValidateAccess
}) {
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [filterRole, setFilterRole] = useState('all');

  // Get all unique roles
  const roles = Object.keys(roleHierarchy);
  const features = Object.keys(featurePermissions);

  // Filter features based on selected role
  const filteredFeatures = filterRole === 'all' 
    ? features 
    : features?.filter(feature => featurePermissions?.[feature]?.includes(filterRole));

  const hasPermission = (feature, role) => {
    const requiredRoles = featurePermissions?.[feature] || [];
    return requiredRoles?.includes(role) || role === 'superadmin';
  };

  const getFeatureDescription = (feature) => {
    const descriptions = {
      'dashboard': 'Panel principal de asistencia y datos personales',
      'employee_management': 'Gestión completa de empleados y perfiles',
      'payroll_calculation': 'Cálculo y procesamiento de nóminas',
      'reports': 'Generación de reportes y exportación de datos',
      'system_settings': 'Configuración del sistema y parametros',
      'role_management': 'Gestión de roles y permisos de usuarios',
      'security_monitoring': 'Monitoreo de seguridad y auditoría',
      'attendance_approval': 'Aprobación de asistencias e incidencias',
      'site_management': 'Gestión de obras y sitios de construcción'
    };
    return descriptions?.[feature] || feature;
  };

  const getPermissionCount = (role) => {
    if (role === 'superadmin') return features?.length;
    return features?.filter(feature => hasPermission(feature, role))?.length;
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            <Key className="h-6 w-6 inline mr-2 text-blue-600" />
            Matriz de Permisos por Rol
          </h2>
          
          <div className="flex items-center space-x-4">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e?.target?.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Todos los Roles</option>
              {roles?.map(role => (
                <option key={role} value={role}>
                  {roleHierarchy?.[role]?.label || role}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Role Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {roles?.map(role => (
            <div key={role} className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleHierarchy?.[role]?.color}`}>
                  {roleHierarchy?.[role]?.label || role}
                </span>
                <span className="text-sm font-bold text-gray-700">
                  Nivel {roleHierarchy?.[role]?.level}
                </span>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {getPermissionCount(role)}
                </div>
                <div className="text-sm text-gray-600">
                  de {features?.length} permisos
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Permission Matrix Table */}
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  Funcionalidad
                </th>
                {roles?.map(role => (
                  <th key={role} className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                    <div className="flex flex-col items-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleHierarchy?.[role]?.color} mb-1`}>
                        {roleHierarchy?.[role]?.label || role}
                      </span>
                      <span className="text-xs text-gray-500">
                        Nivel {roleHierarchy?.[role]?.level}
                      </span>
                    </div>
                  </th>
                ))}
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                  Acciones
                </th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-gray-200">
              {filteredFeatures?.map((feature) => (
                <tr key={feature} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900 capitalize">
                        {feature?.replace(/_/g, ' ')}
                      </p>
                      <p className="text-sm text-gray-500">
                        {getFeatureDescription(feature)}
                      </p>
                    </div>
                  </td>
                  
                  {roles?.map(role => (
                    <td key={`${feature}-${role}`} className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center">
                        {hasPermission(feature, role) ? (
                          <div className="flex items-center text-green-600">
                            <Check className="h-5 w-5" />
                            <span className="sr-only">Permitido</span>
                          </div>
                        ) : (
                          <div className="flex items-center text-red-600">
                            <X className="h-5 w-5" />
                            <span className="sr-only">Denegado</span>
                          </div>
                        )}
                      </div>
                    </td>
                  ))}
                  
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <button
                        onClick={() => setSelectedFeature(selectedFeature === feature ? null : feature)}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-full"
                        title="Ver detalles"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      
                      <button
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-full"
                        title="Configurar permisos"
                      >
                        <Settings className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Feature Details Panel */}
        {selectedFeature && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="text-lg font-semibold text-blue-900 capitalize">
                  {selectedFeature?.replace(/_/g, ' ')}
                </h4>
                <p className="text-blue-700">{getFeatureDescription(selectedFeature)}</p>
              </div>
              
              <button
                onClick={() => setSelectedFeature(null)}
                className="text-blue-600 hover:text-blue-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h5 className="font-medium text-blue-900 mb-2">Roles con Acceso:</h5>
                <div className="space-y-2">
                  {featurePermissions?.[selectedFeature]?.map(role => (
                    <div key={role} className="flex items-center space-x-2">
                      <Check className="h-4 w-4 text-green-600" />
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleHierarchy?.[role]?.color}`}>
                        {roleHierarchy?.[role]?.label || role}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h5 className="font-medium text-blue-900 mb-2">Roles sin Acceso:</h5>
                <div className="space-y-2">
                  {roles?.filter(role => !hasPermission(selectedFeature, role) && role !== 'superadmin')?.map(role => (
                    <div key={role} className="flex items-center space-x-2">
                      <X className="h-4 w-4 text-red-600" />
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleHierarchy?.[role]?.color}`}>
                        {roleHierarchy?.[role]?.label || role}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <div className="flex items-center">
                <Lock className="h-4 w-4 text-yellow-600 mr-2" />
                <span className="text-sm text-yellow-800">
                  <strong>Nota:</strong> Los Super Administradores tienen acceso completo a todas las funcionalidades del sistema.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Matrix Summary */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-3">Resumen de la Matriz</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{features?.length}</p>
              <p className="text-gray-600">Funcionalidades Totales</p>
            </div>
            
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{roles?.length}</p>
              <p className="text-gray-600">Roles Definidos</p>
            </div>
            
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                {features?.length * roles?.length}
              </p>
              <p className="text-gray-600">Relaciones Permiso-Rol</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}