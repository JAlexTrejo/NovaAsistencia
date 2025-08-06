import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, Shield, Eye, Activity, RefreshCw } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import BrandedHeader from '../../components/ui/BrandedHeader';
import BrandedFooter from '../../components/ui/BrandedFooter';
import RoleBasedSidebar from '../../components/ui/RoleBasedSidebar';
import ActivityGrid from './components/ActivityGrid';
import SecurityAlertPanel from './components/SecurityAlertPanel';
import FilterPanel from './components/FilterPanel';
import ExportPanel from './components/ExportPanel';
import StatisticsCards from './components/StatisticsCards';

export default function ActivityLoggingAndSecurityMonitoringDashboard() {
  const { user, userProfile, hasRole } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    dateRange: 'today',
    module: 'all',
    action: 'all',
    role: 'all',
    severity: 'all'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);
  const [statistics, setStatistics] = useState({
    totalLogs: 0,
    todayLogs: 0,
    securityAlerts: 0,
    activeUsers: 0
  });

  // Check if user has admin access
  const hasAdminAccess = hasRole?.('admin') || hasRole?.('superadmin');

  useEffect(() => {
    if (!hasAdminAccess) {
      return;
    }

    loadActivityLogs();
    loadStatistics();

    // Set up real-time subscription for new logs
    let subscription;
    if (realTimeEnabled) {
      subscription = supabase
        ?.channel('logs_actividad_changes')
        ?.on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'logs_actividad' },
          (payload) => {
            const newLog = payload?.new;
            if (newLog) {
              setLogs(prevLogs => [newLog, ...prevLogs]);
              updateStatistics(newLog);
            }
          }
        )
        ?.subscribe();
    }

    return () => {
      if (subscription) {
        supabase?.removeChannel(subscription);
      }
    };
  }, [hasAdminAccess, filters, realTimeEnabled]);

  const loadActivityLogs = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        ?.from('logs_actividad')
        ?.select(`
          *,
          usuarios:usuario_id (
            nombre,
            correo
          )
        `)
        ?.order('fecha', { ascending: false });

      // Apply date range filter
      if (filters?.dateRange !== 'all') {
        const now = new Date();
        let startDate;
        
        switch (filters?.dateRange) {
          case 'today':
            startDate = new Date(now?.getFullYear(), now?.getMonth(), now?.getDate());
            break;
          case 'week':
            startDate = new Date(now?.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'month':
            startDate = new Date(now?.getFullYear(), now?.getMonth(), 1);
            break;
          default:
            startDate = null;
        }
        
        if (startDate) {
          query = query?.gte('fecha', startDate?.toISOString());
        }
      }

      // Apply other filters
      if (filters?.module !== 'all') {
        query = query?.eq('modulo', filters?.module);
      }
      
      if (filters?.action !== 'all') {
        query = query?.eq('accion', filters?.action);
      }
      
      if (filters?.role !== 'all') {
        query = query?.eq('rol', filters?.role);
      }

      // Apply search term
      if (searchTerm?.trim()) {
        query = query?.or(`descripcion.ilike.%${searchTerm}%,accion.ilike.%${searchTerm}%,modulo.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query?.limit(1000);
      
      if (error) {
        console.error('Error loading activity logs:', error);
        return;
      }
      
      setLogs(data || []);
    } catch (error) {
      console.error('Error in loadActivityLogs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const today = new Date();
      const startOfDay = new Date(today?.getFullYear(), today?.getMonth(), today?.getDate());

      // Get total logs count
      const { count: totalCount } = await supabase
        ?.from('logs_actividad')
        ?.select('*', { count: 'exact', head: true });

      // Get today's logs count
      const { count: todayCount } = await supabase
        ?.from('logs_actividad')
        ?.select('*', { count: 'exact', head: true })
        ?.gte('fecha', startOfDay?.toISOString());

      // Get security alerts (failed logins, unauthorized access)
      const { count: alertsCount } = await supabase
        ?.from('logs_actividad')
        ?.select('*', { count: 'exact', head: true })
        ?.in('accion', ['failed_login', 'unauthorized_access', 'security_violation'])
        ?.gte('fecha', startOfDay?.toISOString());

      // Get active users today
      const { data: activeUsersData } = await supabase
        ?.from('logs_actividad')
        ?.select('usuario_id')
        ?.gte('fecha', startOfDay?.toISOString())
        ?.not('usuario_id', 'is', null);

      const uniqueUsers = new Set(activeUsersData?.map(log => log?.usuario_id))?.size || 0;

      setStatistics({
        totalLogs: totalCount || 0,
        todayLogs: todayCount || 0,
        securityAlerts: alertsCount || 0,
        activeUsers: uniqueUsers
      });
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  const updateStatistics = (newLog) => {
    setStatistics(prev => ({
      ...prev,
      totalLogs: prev?.totalLogs + 1,
      todayLogs: prev?.todayLogs + 1,
      securityAlerts: ['failed_login', 'unauthorized_access', 'security_violation']?.includes(newLog?.accion) 
        ? prev?.securityAlerts + 1 
        : prev?.securityAlerts
    }));
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const refreshLogs = () => {
    loadActivityLogs();
    loadStatistics();
  };

  // Redirect non-admin users
  if (!hasAdminAccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h1>
          <p className="text-gray-600">No tienes permisos para acceder a esta sección.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <BrandedHeader />
      
      <div className="flex">
        <RoleBasedSidebar />
        
        <main className="flex-1 p-6">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                  <Activity className="h-8 w-8 text-blue-600 mr-3" />
                  Monitoreo de Actividad y Seguridad
                </h1>
                <p className="text-gray-600 mt-1">
                  Seguimiento completo de actividades del sistema y alertas de seguridad
                </p>
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setRealTimeEnabled(!realTimeEnabled)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    realTimeEnabled
                      ? 'bg-green-100 text-green-700 hover:bg-green-200' :'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <div className="flex items-center">
                    <div className={`h-2 w-2 rounded-full mr-2 ${
                      realTimeEnabled ? 'bg-green-500' : 'bg-gray-400'
                    }`} />
                    Tiempo Real
                  </div>
                </button>
                
                <button
                  onClick={refreshLogs}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Actualizar
                </button>
              </div>
            </div>

            {/* Statistics Cards */}
            <StatisticsCards statistics={statistics} />
          </div>

          {/* Controls Section */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar en actividades..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e?.target?.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-4 py-2 rounded-lg border transition-colors flex items-center ${
                    showFilters
                      ? 'bg-blue-50 border-blue-300 text-blue-700' :'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filtros
                </button>
                
                <button
                  onClick={() => setShowExport(!showExport)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </button>
              </div>
            </div>

            {/* Collapsible Filter Panel */}
            {showFilters && (
              <div className="mt-6 pt-6 border-t">
                <FilterPanel filters={filters} onFilterChange={handleFilterChange} />
              </div>
            )}

            {/* Collapsible Export Panel */}
            {showExport && (
              <div className="mt-6 pt-6 border-t">
                <ExportPanel logs={logs} filters={filters} />
              </div>
            )}
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            {/* Security Alerts Panel */}
            <div className="xl:col-span-1">
              <SecurityAlertPanel logs={logs} />
            </div>

            {/* Activity Timeline */}
            <div className="xl:col-span-3">
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                    <Eye className="h-5 w-5 text-blue-600 mr-2" />
                    Registro de Actividades
                    {loading && (
                      <div className="ml-3 animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    )}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {logs?.length || 0} registros encontrados
                  </p>
                </div>
                
                <ActivityGrid 
                  logs={logs} 
                  loading={loading} 
                  searchTerm={searchTerm}
                />
              </div>
            </div>
          </div>
        </main>
      </div>
      
      <BrandedFooter />
    </div>
  );
}