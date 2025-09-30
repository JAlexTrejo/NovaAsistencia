import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { User, Shield, Database, AlertTriangle, CheckCircle, XCircle, Settings, RefreshCw, Eye, EyeOff, Save } from 'lucide-react';
import BrandedHeader from '../../components/ui/BrandedHeader';
import BrandedFooter from '../../components/ui/BrandedFooter';
import NavigationHeader from '../../components/ui/NavigationHeader';
import { supabase } from '../../lib/supabase';

export default function UserProfileManagementAndAuthenticationCenter() {
  const { user, userProfile, loading, authError, signOut, fetchUserProfile, getConnectionStatus } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    role: ''
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [authStatus, setAuthStatus] = useState({
    database: 'checking',
    profile: 'checking',
    role: 'checking'
  });
  const [diagnostics, setDiagnostics] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    if (userProfile) {
      setProfileForm({
        full_name: userProfile?.full_name || '',
        email: userProfile?.email || user?.email || '',
        phone: userProfile?.phone || '',
        role: userProfile?.role || ''
      });
    }
    runDiagnostics();
  }, [user, userProfile]);

  const runDiagnostics = async () => {
    const newDiagnostics = [];
    const newStatus = { database: 'checking', profile: 'checking', role: 'checking' };

    try {
      // Test database connection using AuthContext (no extra queries)
      const connStatus = await getConnectionStatus();
      if (!connStatus?.success) {
        newStatus.database = 'error';
        newDiagnostics?.push({
          type: 'error',
          category: 'Base de Datos',
          message: 'Error al conectar con la base de datos',
          solution: 'Verificar el estado del proyecto Supabase y la conexión'
        });
      } else {
        newStatus.database = 'success';
        newDiagnostics?.push({
          type: 'success',
          category: 'Base de Datos',
          message: 'Conexión a base de datos exitosa'
        });
      }

      // Use existing userProfile from AuthContext (already loaded, no extra query)
      if (user?.id) {
        if (!userProfile) {
          newStatus.profile = 'error';
          newDiagnostics?.push({
            type: 'error',
            category: 'Perfil',
            message: 'Perfil de usuario no encontrado en la base de datos',
            solution: 'El perfil se creará automáticamente o redirigir a completar perfil'
          });
        } else {
          newStatus.profile = 'success';
          newDiagnostics?.push({
            type: 'success',
            category: 'Perfil',
            message: 'Perfil de usuario cargado exitosamente'
          });

          // Test role validation using existing userProfile
          const validRoles = ['user', 'supervisor', 'admin', 'superadmin'];
          if (validRoles?.includes(userProfile?.role)) {
            newStatus.role = 'success';
            newDiagnostics?.push({
              type: 'success',
              category: 'Rol',
              message: `Rol válido asignado: ${userProfile?.role}`
            });
          } else {
            newStatus.role = 'warning';
            newDiagnostics?.push({
              type: 'warning',
              category: 'Rol',
              message: `Rol inválido o faltante: ${userProfile?.role || 'ninguno'}`,
              solution: 'Actualizar rol de usuario a: user, supervisor, admin, o superadmin'
            });
          }
        }
      }

      // Test role permissions
      if (userProfile?.role) {
        const permissions = getRolePermissions(userProfile?.role);
        newDiagnostics?.push({
          type: 'info',
          category: 'Permisos',
          message: `El rol "${userProfile?.role}" tiene ${permissions?.length} permisos`,
          details: permissions?.join(', ')
        });
      }

    } catch (error) {
      newDiagnostics?.push({
        type: 'error',
        category: 'Diagnósticos',
        message: `Error en diagnóstico: ${error?.message}`,
        solution: 'Revisar consola para información detallada del error'
      });
    }

    setAuthStatus(newStatus);
    setDiagnostics(newDiagnostics);
  };

  const getRolePermissions = (role) => {
    const permissions = {
      user: ['Ver Perfil', 'Ver Historial', 'Ver Notificaciones'],
      supervisor: ['Gestionar Equipo', 'Registrar Asistencia', 'Ver Reportes'],
      admin: ['Acceso Nómina', 'Gestionar Incidentes', 'Generar Reportes', 'Gestión de Usuarios'],
      superadmin: ['Acceso Completo al Sistema', 'Configuración Visual', 'Logs del Sistema', 'Gestión de Roles']
    };
    return permissions?.[role] || [];
  };

  const handleProfileUpdate = async (e) => {
    e?.preventDefault();
    setIsSaving(true);
    setSaveMessage('');

    try {
      // Log activity
      await logActivity('profile_update', 'Perfil de Usuario', 'Información de perfil actualizada');

      const { error } = await supabase
        ?.from('user_profiles')
        ?.update({
          full_name: profileForm?.full_name,
          phone: profileForm?.phone
        })
        ?.eq('id', user?.id);

      if (error) {
        setSaveMessage(`Error: ${error?.message}`);
      } else {
        setSaveMessage('¡Perfil actualizado exitosamente!');
        // Refresh user profile (uses cache, won't make extra request if recent)
        await fetchUserProfile?.(user?.id, { useCache: false });
      }
    } catch (error) {
      setSaveMessage(`Error: ${error?.message}`);
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  const handlePasswordChange = async (e) => {
    e?.preventDefault();
    setIsSaving(true);
    setSaveMessage('');

    if (passwordForm?.newPassword !== passwordForm?.confirmPassword) {
      setSaveMessage('Las nuevas contraseñas no coinciden');
      setIsSaving(false);
      return;
    }

    try {
      // Log activity
      await logActivity('password_change', 'Seguridad', 'Contraseña de cuenta cambiada');

      const { error } = await supabase?.auth?.updateUser({
        password: passwordForm?.newPassword
      });

      if (error) {
        setSaveMessage(`Error: ${error?.message}`);
      } else {
        setSaveMessage('¡Contraseña actualizada exitosamente!');
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      }
    } catch (error) {
      setSaveMessage(`Error: ${error?.message}`);
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  const logActivity = async (action, module, description) => {
    try {
      await supabase?.from('logs_actividad')?.insert({
        usuario_id: user?.id,
        rol: userProfile?.role,
        accion: action,
        modulo: module,
        descripcion: description
      });
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default: return <RefreshCw className="w-5 h-5 text-gray-400 animate-spin" />;
    }
  };

  const getDiagnosticIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default: return <Settings className="w-4 h-4 text-blue-500" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando centro de autenticación...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <BrandedHeader />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Header */}
        <NavigationHeader 
          title="Centro de Gestión de Perfil y Autenticación"
          subtitle="Gestiona tu perfil, monitorea el estado de autenticación y resuelve problemas de cuenta"
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel - Profile Form (60%) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tab Navigation */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6">
                  <button
                    onClick={() => setActiveTab('profile')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'profile' ?'border-blue-500 text-blue-600' :'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <User className="w-4 h-4 inline mr-2" />
                    Información de Perfil
                  </button>
                  <button
                    onClick={() => setActiveTab('security')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'security' ?'border-blue-500 text-blue-600' :'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Shield className="w-4 h-4 inline mr-2" />
                    Configuración de Seguridad
                  </button>
                </nav>
              </div>

              <div className="p-6">
                {activeTab === 'profile' && (
                  <form onSubmit={handleProfileUpdate} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nombre Completo *
                        </label>
                        <input
                          type="text"
                          value={profileForm?.full_name}
                          onChange={(e) => setProfileForm({ ...profileForm, full_name: e?.target?.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Correo Electrónico
                        </label>
                        <input
                          type="email"
                          value={profileForm?.email}
                          className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-500"
                          disabled
                        />
                        <p className="text-xs text-gray-500 mt-1">El correo electrónico no se puede cambiar desde este panel</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Número de Teléfono
                        </label>
                        <input
                          type="tel"
                          value={profileForm?.phone}
                          onChange={(e) => setProfileForm({ ...profileForm, phone: e?.target?.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Rol Actual
                        </label>
                        <div className="flex items-center space-x-2">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            profileForm?.role === 'superadmin' ? 'bg-purple-100 text-purple-800' :
                            profileForm?.role === 'admin' ? 'bg-red-100 text-red-800' :
                            profileForm?.role === 'supervisor'? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {profileForm?.role || 'Sin Asignar'}
                          </span>
                          <p className="text-xs text-gray-500">El rol solo puede ser cambiado por administradores</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div className="text-sm text-gray-600">
                        Completación del perfil: {
                          [profileForm?.full_name, profileForm?.email, profileForm?.phone]?.filter(Boolean)?.length
                        }/3 campos completados
                      </div>
                      
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                      >
                        {isSaving ? (
                          <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <Save className="w-4 h-4 mr-2" />
                        )}
                        Actualizar Perfil
                      </button>
                    </div>

                    {saveMessage && (
                      <div className={`p-3 rounded-md text-sm ${
                        saveMessage?.includes('Error') 
                          ? 'bg-red-50 text-red-700 border border-red-200' :'bg-green-50 text-green-700 border border-green-200'
                      }`}>
                        {saveMessage}
                      </div>
                    )}
                  </form>
                )}

                {activeTab === 'security' && (
                  <form onSubmit={handlePasswordChange} className="space-y-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Contraseña Actual
                        </label>
                        <div className="relative">
                          <input
                            type={showPasswords?.current ? 'text' : 'password'}
                            value={passwordForm?.currentPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e?.target?.value })}
                            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords?.current })}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          >
                            {showPasswords?.current ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nueva Contraseña
                        </label>
                        <div className="relative">
                          <input
                            type={showPasswords?.new ? 'text' : 'password'}
                            value={passwordForm?.newPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e?.target?.value })}
                            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                            minLength={6}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords?.new })}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          >
                            {showPasswords?.new ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Confirmar Nueva Contraseña
                        </label>
                        <div className="relative">
                          <input
                            type={showPasswords?.confirm ? 'text' : 'password'}
                            value={passwordForm?.confirmPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e?.target?.value })}
                            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                            minLength={6}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords?.confirm })}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          >
                            {showPasswords?.confirm ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div className="text-sm text-gray-600">
                        La contraseña debe tener al menos 6 caracteres
                      </div>
                      
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                      >
                        {isSaving ? (
                          <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <Shield className="w-4 h-4 mr-2" />
                        )}
                        Cambiar Contraseña
                      </button>
                    </div>

                    {saveMessage && (
                      <div className={`p-3 rounded-md text-sm ${
                        saveMessage?.includes('Error') 
                          ? 'bg-red-50 text-red-700 border border-red-200' :'bg-green-50 text-green-700 border border-green-200'
                      }`}>
                        {saveMessage}
                      </div>
                    )}
                  </form>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel - Authentication Status (40%) */}
          <div className="space-y-6">
            {/* Connection Status */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Database className="w-5 h-5 mr-2 text-blue-600" />
                Estado de Autenticación
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Conexión a Base de Datos</span>
                  {getStatusIcon(authStatus?.database)}
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Carga de Perfil</span>
                  {getStatusIcon(authStatus?.profile)}
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Asignación de Rol</span>
                  {getStatusIcon(authStatus?.role)}
                </div>

                <button
                  onClick={runDiagnostics}
                  className="w-full mt-4 px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <RefreshCw className="w-4 h-4 inline mr-2" />
                  Ejecutar Diagnósticos
                </button>
              </div>
            </div>

            {/* Role & Permissions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Shield className="w-5 h-5 mr-2 text-green-600" />
                Rol y Permisos
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Rol Actual</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    userProfile?.role === 'superadmin' ? 'bg-purple-100 text-purple-800' :
                    userProfile?.role === 'admin' ? 'bg-red-100 text-red-800' :
                    userProfile?.role === 'supervisor'? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {userProfile?.role || 'Sin Asignar'}
                  </span>
                </div>

                <div className="border-t border-gray-200 pt-3">
                  <span className="text-sm font-medium text-gray-700">Permisos:</span>
                  <ul className="mt-2 space-y-1">
                    {getRolePermissions(userProfile?.role)?.map((permission, index) => (
                      <li key={index} className="text-xs text-gray-600 flex items-center">
                        <CheckCircle className="w-3 h-3 text-green-500 mr-2" />
                        {permission}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Diagnostics Panel */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Settings className="w-5 h-5 mr-2 text-gray-600" />
                Diagnósticos
              </h3>
              
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {diagnostics?.map((diagnostic, index) => (
                  <div key={index} className="border border-gray-100 rounded-md p-3">
                    <div className="flex items-start space-x-2">
                      {getDiagnosticIcon(diagnostic?.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-medium text-gray-500">
                            {diagnostic?.category}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mt-1">
                          {diagnostic?.message}
                        </p>
                        {diagnostic?.solution && (
                          <p className="text-xs text-gray-500 mt-1">
                            Solución: {diagnostic?.solution}
                          </p>
                        )}
                        {diagnostic?.details && (
                          <p className="text-xs text-gray-400 mt-1">
                            {diagnostic?.details}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {diagnostics?.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Haz clic en "Ejecutar Diagnósticos" para verificar el estado del sistema
                  </p>
                )}
              </div>
            </div>

            {/* Emergency Actions */}
            {authError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-red-800 mb-2 flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  Error de Autenticación
                </h3>
                <p className="text-sm text-red-700 mb-4">{authError}</p>
                <button
                  onClick={() => signOut?.()}
                  className="w-full px-3 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  Cerrar Sesión e Intentar de Nuevo
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <BrandedFooter />
    </div>
  );
}