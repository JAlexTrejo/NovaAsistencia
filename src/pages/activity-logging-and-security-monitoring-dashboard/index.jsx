// src/pages/activity-logging-andscurity-monitoring-dashboard/index.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, Filter, Download, Shield, Eye, Activity, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import BrandedHeader from '@/components/ui/BrandedHeader';
import BrandedFooter from '@/components/ui/BrandedFooter';
import RoleBasedSidebar from '@/components/ui/RoleBasedSidebar';
import ActivityGrid from './components/ActivityGrid';
import SecurityAlertPanel from './components/SecurityAlertPanel';
import FilterPanel from './components/FilterPanel';
import ExportPanel from './components/ExportPanel';
import StatisticsCards from './components/StatisticsCards';
import { useQuery } from '@/hooks/useQuery';
import {
  fetchActivityLogs,
  fetchActivityStats,
  subscribeActivityLogs,
  unsubscribe,
} from '@/services/activityLogService';

export default function ActivityLoggingAndSecurityMonitoringDashboard() {
  const { hasRole } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);
  const hasAdminAccess = hasRole?.('admin') || hasRole?.('superadmin');

  // Filtros controlados
  const [filters, setFilters] = useState({
    dateRange: 'today',
    module: 'all',
    action: 'all',
    role: 'all',
    severity: 'all',
  });

  // Parámetros memorizados para el servicio
  const serviceParams = useMemo(
    () => ({ ...filters, searchTerm }),
    [filters, searchTerm]
  );

  // Carga de logs con useQuery
  const {
    data: logs = [],
    isLoading: logsLoading,
    error: logsError,
    refetch: refetchLogs,
    setData: setLogsData, // agregado en nuestro hook para poder inyectar nuevos datos
  } = useQuery(fetchActivityLogs, serviceParams);

  // Carga de estadísticas con useQuery
  const {
    data: statistics,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats,
    setData: setStatsData,
  } = useQuery(fetchActivityStats);

  // Suscripción en tiempo real
  const channelRef = useRef(null);
  useEffect(() => {
    if (!hasAdminAccess) return;

    if (realTimeEnabled) {
      // suscribir
      channelRef.current = subscribeActivityLogs((newLog) => {
        // prepend al grid
        setLogsData((prev) => [newLog, ...(prev || [])]);
        // actualizar métricas si aplica
        setStatsData((prev) => {
          if (!prev) return prev;
          const isSecurity = ['failed_login', 'unauthorized_access', 'security_violation'].includes(newLog?.accion);
          return {
            ...prev,
            totalLogs: (prev.totalLogs || 0) + 1,
            todayLogs: (prev.todayLogs || 0) + 1,
            securityAlerts: (prev.securityAlerts || 0) + (isSecurity ? 1 : 0),
          };
        });
      });
    }

    return () => {
      if (channelRef.current) {
        unsubscribe(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [hasAdminAccess, realTimeEnabled, setLogsData, setStatsData]);

  const refreshAll = () => {
    refetchLogs();
    refetchStats();
  };

  // Redirección visual si no es admin
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
                  onClick={() => setRealTimeEnabled((v) => !v)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    realTimeEnabled
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <div className="flex items-center">
                    <div
                      className={`h-2 w-2 rounded-full mr-2 ${
                        realTimeEnabled ? 'bg-green-500' : 'bg-gray-400'
                      }`}
                    />
                    Tiempo Real
                  </div>
                </button>

                <button
                  onClick={refreshAll}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Actualizar
                </button>
              </div>
            </div>

            {/* Statistics Cards */}
            <StatisticsCards
              statistics={{
                totalLogs: statistics?.totalLogs || 0,
                todayLogs: statistics?.todayLogs || 0,
                securityAlerts: statistics?.securityAlerts || 0,
                activeUsers: statistics?.activeUsers || 0,
              }}
            />
          </div>

          {/* Controls Section */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar en actividades..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowFilters((v) => !v)}
                  className={`px-4 py-2 rounded-lg border transition-colors flex items-center ${
                    showFilters
                      ? 'bg-blue-50 border-blue-300 text-blue-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filtros
                </button>

                <button
                  onClick={() => setShowExport((v) => !v)}
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
                <FilterPanel
                  filters={filters}
                  onFilterChange={setFilters}
                />
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
                    {(logsLoading) && (
                      <div className="ml-3 animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                    )}
                    {(logsError || statsError) && (
                      <span className="ml-3 text-sm text-red-600">Error cargando datos</span>
                    )}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {(logs?.length || 0)} registros encontrados
                  </p>
                </div>

                <ActivityGrid
                  logs={logs}
                  loading={logsLoading}
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
