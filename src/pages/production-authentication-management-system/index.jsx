import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useBranding } from '../../components/BrandingProvider';
import BrandedHeader from '../../components/ui/BrandedHeader';
import BrandedFooter from '../../components/ui/BrandedFooter';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import NavigationBreadcrumb from '../../components/ui/NavigationBreadcrumb';
import UserContextHeader from '../../components/ui/UserContextHeader';
import NotificationCenter from '../../components/ui/NotificationCenter';
import { supabase } from '../../lib/supabase';
import { Shield, Users, Key, Activity, Clock, AlertTriangle, Check, X, RefreshCw, Eye, EyeOff } from 'lucide-react';

export default function ProductionAuthenticationManagementSystem() {
  const { user, userProfile, signIn, signUp, signOut, isAdmin, isSuperAdmin } = useAuth();
  const { branding } = useBranding();
  const [activeUsers, setActiveUsers] = useState([]);
  const [sessionStats, setSessionStats] = useState({
    totalSessions: 0,
    activeSessions: 0,
    failedAttempts: 0,
    averageSessionDuration: 0
  });
  const [authLogs, setAuthLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  // Authentication form state
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [authMode, setAuthMode] = useState('signin'); // 'signin' or 'signup'
  const [authForm, setAuthForm] = useState({
    email: '',
    password: '',
    fullName: '',
    role: 'user',
    confirmPassword: ''
  });
  const [authLoading, setAuthLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // User management state
  const [selectedUser, setSelectedUser] = useState(null);
  const [userManagementMode, setUserManagementMode] = useState('view'); // 'view', 'edit', 'create'

  const breadcrumbItems = [
    { label: 'Sistema', href: '/admin/system' },
    { label: 'Gestión de Autenticación', href: '/production-authentication-management-system' }
  ];

  useEffect(() => {
    if (isAdmin() || isSuperAdmin()) {
      loadAuthenticationData();
      setupRealtimeSubscription();
    }
  }, [user]);

  const loadAuthenticationData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadActiveUsers(),
        loadSessionStats(),
        loadAuthLogs()
      ]);
    } catch (error) {
      setNotification({
        type: 'error',
        message: `Error al cargar datos: ${error?.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  const loadActiveUsers = async () => {
    try {
      const { data, error } = await supabase?.from('user_profiles')?.select(`
          id,
          email,
          full_name,
          role,
          created_at,
          last_sign_in_at,
          is_super_admin,
          is_sso_user,
          confirmed_at,
          banned_until
        `)?.order('last_sign_in_at', { ascending: false, nullsFirst: false });

      if (error) throw error;
      setActiveUsers(data || []);
    } catch (error) {
      console.error('Error loading active users:', error);
      setNotification({
        type: 'error',
        message: 'Error al cargar usuarios activos'
      });
    }
  };

  const loadSessionStats = async () => {
    try {
      // Get session statistics from activity logs
      const { data: logs, error } = await supabase?.from('logs_actividad')?.select('accion, created_at')?.in('accion', ['login', 'logout', 'failed_login'])?.gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000)?.toISOString());

      if (error) throw error;

      const totalSessions = logs?.filter(log => log?.accion === 'login')?.length || 0;
      const failedAttempts = logs?.filter(log => log?.accion === 'failed_login')?.length || 0;
      const activeSessions = activeUsers?.filter(user => 
        user?.last_sign_in_at && 
        new Date(user?.last_sign_in_at) > new Date(Date.now() - 8 * 60 * 60 * 1000)
      )?.length || 0;

      setSessionStats({
        totalSessions,
        activeSessions,
        failedAttempts,
        averageSessionDuration: totalSessions > 0 ? 4.2 : 0 // Mock average in hours
      });
    } catch (error) {
      console.error('Error loading session stats:', error);
    }
  };

  const loadAuthLogs = async () => {
    try {
      const { data, error } = await supabase?.from('logs_actividad')?.select(`
          id,
          accion,
          descripcion,
          created_at,
          usuario_id,
          user_profiles:usuario_id (
            full_name,
            email
          )
        `)?.in('modulo', ['Authentication', 'Security'])?.order('created_at', { ascending: false })?.limit(50);

      if (error) throw error;
      setAuthLogs(data || []);
    } catch (error) {
      console.error('Error loading auth logs:', error);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase?.channel('auth_monitoring')?.on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'logs_actividad' },
        (payload) => {
          if (['Authentication', 'Security']?.includes(payload?.new?.modulo)) {
            loadAuthLogs();
            loadSessionStats();
          }
        }
      )?.on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_profiles' },
        () => {
          loadActiveUsers();
        }
      )?.subscribe();

    return () => supabase?.removeChannel(channel);
  };

  const handleAuthSubmit = async (e) => {
    e?.preventDefault();
    if (!authForm?.email || !authForm?.password) {
      setNotification({
        type: 'error',
        message: 'Por favor completa todos los campos requeridos'
      });
      return;
    }

    if (authMode === 'signup' && authForm?.password !== authForm?.confirmPassword) {
      setNotification({
        type: 'error',
        message: 'Las contraseñas no coinciden'
      });
      return;
    }

    try {
      setAuthLoading(true);
      let result;

      if (authMode === 'signin') {
        result = await signIn(authForm?.email, authForm?.password);
      } else {
        result = await signUp(authForm?.email, authForm?.password, authForm?.fullName, authForm?.role);
      }

      if (result?.success) {
        setNotification({
          type: 'success',
          message: authMode === 'signin' ? 'Inicio de sesión exitoso' : 'Usuario registrado exitosamente'
        });
        setShowAuthForm(false);
        setAuthForm({
          email: '',
          password: '',
          fullName: '',
          role: 'user',
          confirmPassword: ''
        });
        await loadAuthenticationData();
      } else {
        setNotification({
          type: 'error',
          message: result?.error || 'Error en la autenticación'
        });
      }
    } catch (error) {
      setNotification({
        type: 'error',
        message: error?.message || 'Error inesperado'
      });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleUserAction = async (userId, action) => {
    try {
      const userToUpdate = activeUsers?.find(u => u?.id === userId);
      if (!userToUpdate) return;

      let updateData = {};
      let successMessage = '';

      switch (action) {
        case 'ban':
          updateData = { banned_until: new Date(Date.now() + 24 * 60 * 60 * 1000)?.toISOString() };
          successMessage = 'Usuario bloqueado por 24 horas';
          break;
        case 'unban':
          updateData = { banned_until: null };
          successMessage = 'Usuario desbloqueado';
          break;
        case 'activate':
          updateData = { confirmed_at: new Date()?.toISOString() };
          successMessage = 'Usuario activado';
          break;
        case 'deactivate':
          updateData = { confirmed_at: null };
          successMessage = 'Usuario desactivado';
          break;
        default:
          return;
      }

      const { error } = await supabase?.from('user_profiles')?.update(updateData)?.eq('id', userId);

      if (error) throw error;

      setNotification({
        type: 'success',
        message: successMessage
      });

      await loadActiveUsers();
    } catch (error) {
      setNotification({
        type: 'error',
        message: `Error al actualizar usuario: ${error?.message}`
      });
    }
  };

  const getStatusBadge = (user) => {
    if (user?.banned_until && new Date(user?.banned_until) > new Date()) {
      return <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">Bloqueado</span>;
    }
    if (!user?.confirmed_at) {
      return <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">Pendiente</span>;
    }
    if (user?.last_sign_in_at && new Date(user?.last_sign_in_at) > new Date(Date.now() - 30 * 60 * 1000)) {
      return <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">En línea</span>;
    }
    return <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">Inactivo</span>;
  };

  const getRoleBadge = (role, isSuperAdmin) => {
    if (isSuperAdmin) {
      return <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full font-medium">SuperAdmin</span>;
    }
    const roleColors = {
      admin: 'bg-blue-100 text-blue-800',
      supervisor: 'bg-orange-100 text-orange-800',
      user: 'bg-gray-100 text-gray-800'
    };
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${roleColors?.[role] || roleColors?.user}`}>
        {role?.charAt(0)?.toUpperCase() + role?.slice(1)}
      </span>
    );
  };

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return 'Nunca';
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Ahora';
    if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`;
    if (diffInMinutes < 1440) return `Hace ${Math.floor(diffInMinutes / 60)} h`;
    return `Hace ${Math.floor(diffInMinutes / 1440)} días`;
  };

  if (!isAdmin() && !isSuperAdmin()) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h1>
          <p className="text-gray-600">No tienes permisos para acceder a esta sección.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <BrandedHeader />
      <UserContextHeader />
      <NavigationBreadcrumb items={breadcrumbItems} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Shield className="h-8 w-8" style={{ color: branding?.color_primario }} />
                Sistema de Gestión de Autenticación
              </h1>
              <p className="text-gray-600 mt-2">
                Control de acceso, monitoreo de sesiones y gestión de seguridad
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowAuthForm(true)}
                className="flex items-center gap-2"
                style={{ backgroundColor: branding?.color_primario }}
              >
                <Users className="h-4 w-4" />
                Nuevo Usuario
              </Button>
              <Button
                variant="outline"
                onClick={loadAuthenticationData}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Sesiones Activas</p>
                <p className="text-2xl font-bold text-gray-900">{sessionStats?.activeSessions}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <Activity className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Usuarios conectados en las últimas 8h</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Usuarios</p>
                <p className="text-2xl font-bold text-gray-900">{activeUsers?.length}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Usuarios registrados en el sistema</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Intentos Fallidos</p>
                <p className="text-2xl font-bold text-gray-900">{sessionStats?.failedAttempts}</p>
              </div>
              <div className="bg-red-100 p-3 rounded-full">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Últimas 24 horas</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Duración Promedio</p>
                <p className="text-2xl font-bold text-gray-900">{sessionStats?.averageSessionDuration?.toFixed(1)}h</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Duración de sesión promedio</p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User Management Panel */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b">
              <h2 className="text-xl font-bold text-gray-900">Usuarios Activos</h2>
              <p className="text-sm text-gray-600">Monitoreo y gestión de usuarios</p>
            </div>
            <div className="p-6">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
                  <span className="ml-2 text-gray-600">Cargando usuarios...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeUsers?.map((user) => (
                    <div key={user?.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700">
                              {user?.full_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900">{user?.full_name || 'Sin nombre'}</p>
                          <p className="text-sm text-gray-500">{user?.email}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            {getStatusBadge(user)}
                            {getRoleBadge(user?.role, user?.is_super_admin)}
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">
                          <p>Último acceso:</p>
                          <p>{formatTimeAgo(user?.last_sign_in_at)}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {user?.banned_until && new Date(user?.banned_until) > new Date() ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUserAction(user?.id, 'unban')}
                            className="text-green-600 border-green-600 hover:bg-green-50"
                          >
                            <Check className="h-4 w-4" />
                            Desbloquear
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUserAction(user?.id, 'ban')}
                            className="text-red-600 border-red-600 hover:bg-red-50"
                          >
                            <X className="h-4 w-4" />
                            Bloquear
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  {activeUsers?.length === 0 && (
                    <div className="text-center py-8">
                      <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-gray-600">No hay usuarios registrados</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Activity Log Panel */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b">
              <h2 className="text-xl font-bold text-gray-900">Registro de Actividad</h2>
              <p className="text-sm text-gray-600">Eventos de seguridad recientes</p>
            </div>
            <div className="p-6">
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {authLogs?.map((log) => (
                  <div key={log?.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                    <div className="flex-shrink-0">
                      {log?.accion === 'login' && <Check className="h-5 w-5 text-green-600" />}
                      {log?.accion === 'logout' && <X className="h-5 w-5 text-gray-600" />}
                      {log?.accion === 'failed_login' && <AlertTriangle className="h-5 w-5 text-red-600" />}
                      {!['login', 'logout', 'failed_login']?.includes(log?.accion) && <Key className="h-5 w-5 text-blue-600" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {log?.user_profiles?.full_name || 'Usuario desconocido'}
                      </p>
                      <p className="text-sm text-gray-600">{log?.descripcion}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatTimeAgo(log?.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
                {authLogs?.length === 0 && (
                  <div className="text-center py-8">
                    <Activity className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-600">No hay registros de actividad</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      {/* Authentication Form Modal */}
      {showAuthForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  {authMode === 'signin' ? 'Iniciar Sesión' : 'Registrar Usuario'}
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAuthForm(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <form onSubmit={handleAuthSubmit} className="p-6 space-y-4">
              <div className="flex border-b">
                <button
                  type="button"
                  onClick={() => setAuthMode('signin')}
                  className={`px-4 py-2 text-sm font-medium ${
                    authMode === 'signin' ?'text-blue-600 border-b-2 border-blue-600' :'text-gray-600'
                  }`}
                >
                  Iniciar Sesión
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('signup')}
                  className={`px-4 py-2 text-sm font-medium ${
                    authMode === 'signup' ?'text-blue-600 border-b-2 border-blue-600' :'text-gray-600'
                  }`}
                >
                  Registrar
                </button>
              </div>

              {authMode === 'signup' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre Completo
                  </label>
                  <Input
                    type="text"
                    value={authForm?.fullName}
                    onChange={(e) => setAuthForm({...authForm, fullName: e?.target?.value})}
                    placeholder="Nombre completo"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Correo Electrónico
                </label>
                <Input
                  type="email"
                  value={authForm?.email}
                  onChange={(e) => setAuthForm({...authForm, email: e?.target?.value})}
                  placeholder="usuario@ejemplo.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={authForm?.password}
                    onChange={(e) => setAuthForm({...authForm, password: e?.target?.value})}
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                  </button>
                </div>
              </div>

              {authMode === 'signup' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirmar Contraseña
                    </label>
                    <Input
                      type="password"
                      value={authForm?.confirmPassword}
                      onChange={(e) => setAuthForm({...authForm, confirmPassword: e?.target?.value})}
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rol
                    </label>
                    <Select
                      value={authForm?.role}
                      onChange={(e) => setAuthForm({...authForm, role: e?.target?.value})}
                      options={[
                        { value: 'user', label: 'Usuario' },
                        { value: 'supervisor', label: 'Supervisor' },
                        { value: 'admin', label: 'Administrador' }
                      ]}
                    />
                  </div>
                </>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAuthForm(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={authLoading}
                  style={{ backgroundColor: branding?.color_primario }}
                >
                  {authLoading && <RefreshCw className="h-4 w-4 animate-spin mr-2" />}
                  {authMode === 'signin' ? 'Iniciar Sesión' : 'Registrar'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Notification */}
      <NotificationCenter
        notification={notification}
        onClose={() => setNotification(null)}
      />
      <BrandedFooter />
    </div>
  );
}