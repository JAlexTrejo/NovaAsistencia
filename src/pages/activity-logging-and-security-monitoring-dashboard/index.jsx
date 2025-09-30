// src/modules/activity-logging-and-security-monitoring-dashboard/index.jsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
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

import { activityLogService } from '@/services/activityLogService';

// Columnas explícitas para traer usuario embebido (join) SIN usar *
const LOG_COLUMNS = `
  id,
  usuario_id,
  rol,
  accion,
  modulo,
  descripcion,
  ip_address,
  user_agent,
  metadata,
  fecha,
  usuarios:usuario_id (
    nombre,
    correo
  )
`;

export default function ActivityLoggingAndSecurityMonitoringDashboard() {
  const { hasRole } = useAuth();
  const hasAdminAccess = hasRole?.('admin') || hasRole?.('superadmin');

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // búsqueda con debounce
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 350);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const [filters, setFilters] = useState({
    dateRange: 'today', // today | week | month | all
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

  // ---------- NUEVO: opciones dinámicas para filtros ----------
  const [moduleOptions, setModuleOptions] = useState([]);
  const [actionOptions, setActionOptions] = useState([]);
  const [roleOptions, setRoleOptions] = useState([]);
  const severityOptions = [
    { value: 'critical', label: 'Crítica' },
    { value: 'high', label: 'Alta' },
    { value: 'medium', label: 'Media' },
    { value: 'low', label: 'Baja' },
    { value: 'info', label: 'Información' }
  ];

  useEffect(() => {
    if (!hasAdminAccess) return;
    loadFilterOptions();
  }, [hasAdminAccess]);

  const loadFilterOptions = async () => {
    // Traemos columnas y deduplicamos en cliente
    const { data, error } = await supabase
      .from('logs_actividad')
      .select('modulo, accion, rol')
      .not('modulo', 'is', null)
      .not('accion', 'is', null)
      .not('rol', 'is', null)
      .limit(5000); // ajusta si es necesario

    if (error) {
      console.error('Error loading filter options:', error);
      return;
    }

    const uniq = (arr) => [...new Set(arr.filter(Boolean))].sort((a, b) => `${a}`.localeCompare(`${b}`));

    const modules = uniq(data.map(d => d.modulo)).map(v => ({ value: v, label: v }));
    const actions = uniq(data.map(d => d.accion)).map(v => ({ value: v, label: v.replace(/_/g, ' ') }));
    const roles = uniq(data.map(d => d.rol)).map(v => ({ value: v, label: v }));

    setModuleOptions(modules);
    setActionOptions(actions);
    setRoleOptions(roles);
  };
  // ---------- FIN NUEVO ----------

  // paginación
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);

  // Mantener referencia a la suscripción para limpiarla
  const realtimeRef = useRef(null);

  // Calcula rango de fechas según filtro
  const { startDateISO, endDateISO } = useMemo(() => {
    if (filters.dateRange === 'all') return { startDateISO: null, endDateISO: null };
    const now = new Date();
    let start;
    if (filters.dateRange === 'today') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (filters.dateRange === 'week') {
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (filters.dateRange === 'month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    return { startDateISO: start?.toISOString() ?? null, endDateISO: null };
  }, [filters.dateRange]);

  // Carga de logs (vía service) con filtros + paginación
  const loadActivityLogs = async () => {
    try {
      setLoading(true);

      // Mapear filtros del UI a service
      const serviceFilters = {
        page,
        pageSize,
        userId: null,
        module: filters.module !== 'all' ? filters.module : null,
        action: filters.action !== 'all' ? filters.action : null,
        startDate: startDateISO,
        endDate: endDateISO
      };

      const result = await activityLogService.listLogs(serviceFilters);
      if (!result?.success) {
        console.error('Error loading logs:', result?.error);
        setLogs([]);
        setTotalPages(1);
        return;
      }

      const ids = (result?.data?.data || []).map(l => l.id);
      if (ids.length === 0) {
        setLogs([]);
        setTotalPages(result?.data?.totalPages || 1);
        return;
      }

      const { data: joined, error } = await supabase
        .from('logs_actividad')
        .select(LOG_COLUMNS)
        .in('id', ids)
        .order('fecha', { ascending: false });

      if (error) {
        console.error('Join error:', error);
        setLogs(result?.data?.data || []);
      } else {
        setLogs(joined || []);
      }

      setTotalPages(result?.data?.totalPages || 1);
    } catch (e) {
      console.error('Error in loadActivityLogs:', e);
      setLogs([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  // Carga estadísticas (con selects explícitos)
  const loadStatistics = async () => {
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();

      // total
      const { count: totalCount } = await supabase
        .from('logs_actividad')
        .select('id', { count: 'exact', head: true });

      // hoy
      const { count: todayCount } = await supabase
        .from('logs_actividad')
        .select('id', { count: 'exact', head: true })
        .gte('fecha', startOfDay);

      // alertas
      const { count: alertsCount } = await supabase
        .from('logs_actividad')
        .select('id', { count: 'exact', head: true })
        .in('accion', ['failed_login', 'unauthorized_access', 'security_violation'])
        .gte('fecha', startOfDay);

      // usuarios activos hoy
      const { data: activeUsersData } = await supabase
        .from('logs_actividad')
        .select('usuario_id')
        .gte('fecha', startOfDay)
        .not('usuario_id', 'is', null);

      const uniqueUsers = new Set((activeUsersData || []).map(l => l.usuario_id)).size;

      setStatistics({
        totalLogs: totalCount || 0,
        todayLogs: todayCount || 0,
        securityAlerts: alertsCount || 0,
        activeUsers: uniqueUsers || 0
      });
    } catch (e) {
      console.error('Error loading statistics:', e);
    }
  };

  // Tiempo real (INSERT) — solo si enabled
  useEffect(() => {
    if (!hasAdminAccess) return;

    // Carga inicial
    loadActivityLogs();
    loadStatistics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasAdminAccess, page, pageSize, filters.dateRange, filters.module, filters.action]);

  // Separate effect for RT subscription (doesn't depend on filters)
  useEffect(() => {
    if (!hasAdminAccess || !realTimeEnabled) {
      // Si estaba suscrito, limpiar
      if (realtimeRef.current) {
        supabase.removeChannel(realtimeRef.current);
        realtimeRef.current = null;
      }
      return;
    }

    // Only subscribe if not already subscribed
    if (realtimeRef.current) return;

    // Suscripción a inserts
    const sub = supabase
      .channel('logs_actividad_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'logs_actividad' }, async (payload) => {
        const newLog = payload?.new;
        if (!newLog) return;

        // Traerlo con relación de usuario usando columnas explícitas
        const { data: fullLog } = await supabase
          .from('logs_actividad')
          .select(LOG_COLUMNS)
          .eq('id', newLog.id)
          .single();

        setLogs(prev => [fullLog || newLog, ...prev]);
        updateStatistics(newLog);
      })
      .subscribe();

    realtimeRef.current = sub;

    return () => {
      if (realtimeRef.current) {
        supabase.removeChannel(realtimeRef.current);
        realtimeRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasAdminAccess, realTimeEnabled]);

  // Re-cargar al cambiar filtros “sin tiempo real” y al cambiar búsqueda (debounced)
  useEffect(() => {
    if (!hasAdminAccess) return;
    loadActivityLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, filters.role, filters.severity]);

  const updateStatistics = (newLog) => {
    setStatistics(prev => ({
      ...prev,
      totalLogs: (prev.totalLogs || 0) + 1,
      todayLogs: (prev.todayLogs || 0) + 1,
      securityAlerts: ['failed_login', 'unauthorized_access', 'security_violation'].includes(newLog?.accion)
        ? (prev.securityAlerts || 0) + 1
        : prev.securityAlerts
    }));
  };

  const handleSearch = (term) => setSearchTerm(term);
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setPage(1);
  };
  const refreshLogs = () => { loadActivityLogs(); loadStatistics(); };

  // Guard: sin permisos
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
          {/* Header */}
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
                  onClick={() => setRealTimeEnabled(v => !v)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    realTimeEnabled
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <div className="flex items-center">
                    <div className={`h-2 w-2 rounded-full mr-2 ${realTimeEnabled ? 'bg-green-500' : 'bg-gray-400'}`} />
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

            <StatisticsCards statistics={statistics} />
          </div>

          {/* Controles */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar en actividades..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowFilters(v => !v)}
                  className={`px-4 py-2 rounded-lg border transition-colors flex items-center ${
                    showFilters ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filtros
                </button>

                <button
                  onClick={() => setShowExport(v => !v)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </button>
              </div>
            </div>

            {showFilters && (
              <div className="mt-6 pt-6 border-t">
                {/* Pasamos opciones aunque el panel actual no las use aún, por compatibilidad futura */}
                <FilterPanel
                  filters={filters}
                  onFilterChange={handleFilterChange}
                  moduleOptions={moduleOptions}
                  actionOptions={actionOptions}
                  roleOptions={roleOptions}
                  severityOptions={severityOptions}
                />
              </div>
            )}

            {showExport && (
              <div className="mt-6 pt-6 border-t">
                <ExportPanel logs={logs} filters={filters} />
              </div>
            )}
          </div>

          {/* Grid principal */}
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            <div className="xl:col-span-1">
              <SecurityAlertPanel logs={logs} />
            </div>

            <div className="xl:col-span-3">
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                    <Eye className="h-5 w-5 text-blue-600 mr-2" />
                    Registro de Actividades
                    {loading && (
                      <div className="ml-3 animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                    )}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {logs?.length || 0} registros encontrados
                  </p>
                </div>

                <ActivityGrid logs={logs} loading={loading} searchTerm={debouncedSearch} />

                {/* Paginación simple */}
                <div className="px-6 py-4 border-t flex items-center justify-between">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-2 border rounded disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <span className="text-sm text-gray-600">
                    Página {page} de {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => (p < totalPages ? p + 1 : p))}
                    disabled={page >= totalPages}
                    className="px-3 py-2 border rounded disabled:opacity-50"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      <BrandedFooter />
    </div>
  );
}
