import React, { useState, useEffect } from 'react';
import { Shield, Users, Key, Lock, Eye, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import * as employeeService from '../../services/employeeService';
import BrandedHeader from '../../components/ui/BrandedHeader';
import PermissionMatrix from './components/PermissionMatrix';
import RealTimeAccessValidation from './components/RealTimeAccessValidation';
import SecurityAuditPanel from './components/SecurityAuditPanel';
import RoleManagementTools from './components/RoleManagementTools';

export default function RoleBasedPermissionEnforcementAndSecurityManagementSystem() {
  const { user, userProfile } = useAuth();
  const [users, setUsers] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [securityEvents, setSecurityEvents] = useState([]);
  const [activeView, setActiveView] = useState('matrix');
  const [loading, setLoading] = useState(true);
  const [validationQueue, setValidationQueue] = useState([]);

  // Security roles hierarchy
  const roleHierarchy = {
    'user': {
      level: 1,
      label: 'Empleado',
      permissions: ['view_own_data', 'update_own_profile', 'clock_in_out'],
      color: 'bg-blue-100 text-blue-800'
    },
    'supervisor': {
      level: 2,
      label: 'Supervisor',
      permissions: ['view_own_data', 'update_own_profile', 'clock_in_out', 'view_team_data', 'approve_attendance'],
      color: 'bg-green-100 text-green-800'
    },
    'admin': {
      level: 3,
      label: 'Administrador',
      permissions: [
        'view_own_data', 'update_own_profile', 'clock_in_out', 'view_team_data', 'approve_attendance',
        'manage_employees', 'view_all_data', 'generate_reports', 'manage_sites'
      ],
      color: 'bg-purple-100 text-purple-800'
    },
    'superadmin': {
      level: 4,
      label: 'Super Administrador',
      permissions: ['*'], // All permissions
      color: 'bg-red-100 text-red-800'
    }
  };

  // Feature permissions mapping
  const featurePermissions = {
    'dashboard': ['user', 'supervisor', 'admin', 'superadmin'],
    'employee_management': ['admin', 'superadmin'],
    'payroll_calculation': ['admin', 'superadmin'],
    'reports': ['admin', 'superadmin'],
    'system_settings': ['superadmin'],
    'role_management': ['superadmin'],
    'security_monitoring': ['admin', 'superadmin'],
    'attendance_approval': ['supervisor', 'admin', 'superadmin'],
    'site_management': ['admin', 'superadmin']
  };

  useEffect(() => {
    if (!user) return;
    loadSecurityData();
  }, [user]);

  const loadSecurityData = async () => {
    try {
      setLoading(true);
      
      // Load users/employees
      const userData = await employeeService?.getAllEmployees();
      setUsers(userData || []);

      // Simulate loading permissions and security events
      const mockPermissions = Object.entries(featurePermissions)?.map(([feature, roles], index) => ({
        id: index + 1,
        feature,
        roles,
        description: getFeatureDescription(feature),
        lastModified: new Date(),
        modifiedBy: 'System'
      }));
      setPermissions(mockPermissions);

      // Mock security events
      const mockEvents = [
        {
          id: 1,
          type: 'permission_check',
          user: userProfile?.full_name || 'Usuario',
          action: 'access_payroll_module',
          result: 'granted',
          timestamp: new Date(Date.now() - 300000),
          details: 'Acceso autorizado a módulo de nóminas'
        },
        {
          id: 2,
          type: 'role_change',
          user: 'Admin',
          action: 'promote_user_to_supervisor',
          result: 'completed',
          timestamp: new Date(Date.now() - 600000),
          details: 'Usuario promovido a supervisor'
        }
      ];
      setSecurityEvents(mockEvents);

    } catch (error) {
      console.error('Error loading security data:', error);
    } finally {
      setLoading(false);
    }
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

  // Validate user access to feature
  const validateAccess = (userId, feature) => {
    const targetUser = users?.find(u => u?.id === userId);
    if (!targetUser) return false;

    const userRole = targetUser?.role || 'user';
    const requiredRoles = featurePermissions?.[feature] || [];
    
    const hasAccess = requiredRoles?.includes(userRole) || userRole === 'superadmin';
    
    // Add to validation queue for real-time display
    const validationEvent = {
      id: Date.now(),
      userId,
      userName: targetUser?.full_name,
      feature,
      userRole,
      requiredRoles,
      hasAccess,
      timestamp: new Date()
    };
    
    setValidationQueue(prev => [validationEvent, ...prev?.slice(0, 9)]);

    // Add to security events
    setSecurityEvents(prev => [{
      id: Date.now(),
      type: 'permission_check',
      user: targetUser?.full_name,
      action: `access_${feature}`,
      result: hasAccess ? 'granted' : 'denied',
      timestamp: new Date(),
      details: `Intento de acceso a ${getFeatureDescription(feature)}`
    }, ...prev?.slice(0, 49)]);

    return hasAccess;
  };

  // Update user role
  const updateUserRole = async (userId, newRole) => {
    try {
      // In a real implementation, this would call an API
      const updatedUsers = users?.map(user => 
        user?.id === userId ? { ...user, role: newRole } : user
      );
      setUsers(updatedUsers);

      // Add security event
      const targetUser = users?.find(u => u?.id === userId);
      setSecurityEvents(prev => [{
        id: Date.now(),
        type: 'role_change',
        user: userProfile?.full_name || 'Admin',
        action: `change_role_${targetUser?.full_name}`,
        result: 'completed',
        timestamp: new Date(),
        details: `Rol cambiado a ${roleHierarchy?.[newRole]?.label || newRole}`
      }, ...prev?.slice(0, 49)]);

    } catch (error) {
      console.error('Error updating user role:', error);
    }
  };

  // Emergency override for critical operations
  const emergencyOverride = (userId, feature, reason) => {
    const targetUser = users?.find(u => u?.id === userId);
    
    setSecurityEvents(prev => [{
      id: Date.now(),
      type: 'emergency_override',
      user: userProfile?.full_name || 'SuperAdmin',
      action: `emergency_access_${feature}`,
      result: 'granted',
      timestamp: new Date(),
      details: `Override de emergencia para ${targetUser?.full_name}: ${reason}`
    }, ...prev?.slice(0, 49)]);

    return true;
  };

  const stats = {
    totalUsers: users?.length,
    activeUsers: users?.filter(u => u?.status === 'active')?.length,
    securityEvents: securityEvents?.length,
    permissionChecks: securityEvents?.filter(e => e?.type === 'permission_check')?.length
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Cargando sistema de seguridad...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <BrandedHeader 
        title="Sistema de Seguridad y Control de Acceso"
        subtitle="Gestión integral de roles y permisos con validación en tiempo real"
        icon={Shield}
        user={userProfile}
      />
      {/* Security Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Usuarios Totales</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Usuarios Activos</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.activeUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <Eye className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Eventos de Seguridad</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.securityEvents}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <Lock className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Validaciones Permisos</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.permissionChecks}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              <button
                onClick={() => setActiveView('matrix')}
                className={`px-6 py-3 font-medium text-sm border-b-2 ${
                  activeView === 'matrix' ?'border-blue-500 text-blue-600' :'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Key className="h-4 w-4 inline mr-2" />
                Matriz de Permisos
              </button>

              <button
                onClick={() => setActiveView('validation')}
                className={`px-6 py-3 font-medium text-sm border-b-2 ${
                  activeView === 'validation' ?'border-blue-500 text-blue-600' :'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Eye className="h-4 w-4 inline mr-2" />
                Validación en Tiempo Real
              </button>

              <button
                onClick={() => setActiveView('roles')}
                className={`px-6 py-3 font-medium text-sm border-b-2 ${
                  activeView === 'roles' ?'border-blue-500 text-blue-600' :'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Users className="h-4 w-4 inline mr-2" />
                Gestión de Roles
              </button>

              <button
                onClick={() => setActiveView('audit')}
                className={`px-6 py-3 font-medium text-sm border-b-2 ${
                  activeView === 'audit' ?'border-blue-500 text-blue-600' :'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <AlertTriangle className="h-4 w-4 inline mr-2" />
                Auditoría de Seguridad
              </button>
            </nav>
          </div>
        </div>

        {/* Content Area */}
        <div className="grid grid-cols-12 gap-8">
          {/* Main Content (50%) */}
          <div className="col-span-12 lg:col-span-6">
            {activeView === 'matrix' && (
              <PermissionMatrix
                permissions={permissions}
                roleHierarchy={roleHierarchy}
                featurePermissions={featurePermissions}
                onValidateAccess={validateAccess}
              />
            )}

            {activeView === 'validation' && (
              <RealTimeAccessValidation
                validationQueue={validationQueue}
                roleHierarchy={roleHierarchy}
                users={users}
                onValidateAccess={validateAccess}
                onEmergencyOverride={emergencyOverride}
              />
            )}

            {activeView === 'roles' && (
              <RoleManagementTools
                users={users}
                roleHierarchy={roleHierarchy}
                onUpdateUserRole={updateUserRole}
                currentUser={userProfile}
              />
            )}

            {activeView === 'audit' && (
              <SecurityAuditPanel
                securityEvents={securityEvents}
                onClearEvents={() => setSecurityEvents([])}
              />
            )}
          </div>

          {/* Sidebar (50%) */}
          <div className="col-span-12 lg:col-span-6">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  <Lock className="h-5 w-5 inline mr-2" />
                  Verificación de Acceso en Tiempo Real
                </h3>
                
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {validationQueue?.slice(0, 6)?.map((validation, index) => (
                    <div key={validation?.id} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{validation?.userName}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          validation?.hasAccess 
                            ? 'bg-green-100 text-green-800' :'bg-red-100 text-red-800'
                        }`}>
                          {validation?.hasAccess ? 'PERMITIDO' : 'DENEGADO'}
                        </span>
                      </div>
                      
                      <div className="text-xs text-gray-600">
                        <p>Función: {getFeatureDescription(validation?.feature)}</p>
                        <p>Rol: {roleHierarchy?.[validation?.userRole]?.label || validation?.userRole}</p>
                        <p>Requeridos: {validation?.requiredRoles?.map(r => roleHierarchy?.[r]?.label || r)?.join(', ')}</p>
                        <p className="text-gray-400">{validation?.timestamp?.toLocaleTimeString()}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {validationQueue?.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No hay validaciones recientes</p>
                    <p className="text-sm">Las verificaciones aparecerán aquí en tiempo real</p>
                  </div>
                )}
              </div>
            </div>

            {/* Role Hierarchy Info */}
            <div className="bg-white rounded-lg shadow mt-6">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  <Shield className="h-5 w-5 inline mr-2" />
                  Jerarquía de Roles
                </h3>
                
                <div className="space-y-3">
                  {Object.entries(roleHierarchy)?.sort(([,a], [,b]) => b?.level - a?.level)?.map(([role, config]) => (
                    <div key={role} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${config?.color}`}>
                          Nivel {config?.level}
                        </span>
                        <p className="font-medium text-sm mt-1">{config?.label}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">
                          {config?.permissions?.length === 1 && config?.permissions?.[0] === '*' ?'Todos los permisos' 
                            : `${config?.permissions?.length} permisos`}
                        </p>
                        <p className="text-xs text-gray-500">
                          {users?.filter(u => u?.role === role)?.length} usuarios
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow mt-6">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Acciones de Seguridad</h3>
                
                <div className="space-y-3">
                  <button
                    onClick={() => validateAccess(user?.id, 'payroll_calculation')}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Verificar Mi Acceso a Nóminas
                  </button>

                  <button
                    onClick={() => validateAccess(user?.id, 'employee_management')}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Verificar Gestión de Empleados
                  </button>

                  <button
                    onClick={() => validateAccess(user?.id, 'system_settings')}
                    className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    Verificar Configuración Sistema
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