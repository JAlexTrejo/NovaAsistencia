import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import RoleBasedSidebar from '../../components/ui/RoleBasedSidebar';
import NavigationBreadcrumb from '../../components/ui/NavigationBreadcrumb';
import UserContextHeader from '../../components/ui/UserContextHeader';
import NotificationCenter from '../../components/ui/NotificationCenter';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';

import KPICard from './components/KPICard';
import FilterPanel from './components/FilterPanel';
import AttendanceGrid from './components/AttendanceGrid';
import AttendanceChart from './components/AttendanceChart';
import ExportPanel from './components/ExportPanel';

import { useQuery } from '@/hooks/useQuery';
import { listAttendance } from '@/services/attendanceListService';
import Loading from '@/components/ui/Loading';
import ErrorState from '@/components/ui/ErrorState';
import { showToast } from '@/components/ui/ToastHub';
import { fmtNumber } from '@/utils/numberFormat';

const AttendanceHistoryAndAnalyticsDashboard = () => {
  const navigate = useNavigate();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [filterPanelCollapsed, setFilterPanelCollapsed] = useState(false);
  const [chartType, setChartType] = useState('bar');

  // selección en grid
  const [selectedRecords, setSelectedRecords] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
  const [isExporting, setIsExporting] = useState(false);

  // Usuario (sustituir por useAuth si lo tienes)
  const currentUser = {
    name: 'Ana Rodríguez',
    role: 'Supervisor',
    site: 'Obra Central',
    avatar: null,
  };

  // Filtros del panel
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    site: 'all',
    supervisor: 'all',
    status: 'all',
    employee: '',
    includeIncidents: false,
    includeOvertime: true,
    savedView: '',
  });

  // Paginación real
  const [page, setPage] = useState(0);

  // Mapeo de filtros → parámetros del servicio
  const queryParams = useMemo(() => {
    const isUUID = /^[0-9a-f-]{36}$/i.test(filters.employee || '');
    return {
      page,
      startDate: filters.dateFrom || undefined,
      endDate: filters.dateTo || undefined,
      siteId: filters.site !== 'all' ? filters.site : undefined,
      employeeId: isUUID ? filters.employee : undefined,
      search: !isUUID && filters.employee ? filters.employee : undefined,
      status: filters.status && filters.status !== 'all' ? filters.status : undefined,
    };
  }, [page, filters]);

  // Datos desde Supabase
  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery(listAttendance, {
    params: queryParams,
    deps: [JSON.stringify(queryParams)], // dispara al cambiar filtros/página
    keepPreviousData: true,
    retry: 1,
    onError: (e) =>
      showToast({
        title: 'Error al cargar asistencias',
        message: e.message,
        type: 'error',
      }),
  });

  const rows = data?.rows ?? [];
  const count = data?.count ?? 0;
  const pageSize = data?.pageSize ?? 50;
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(count / pageSize)),
    [count, pageSize]
  );

  // Al cambiar filtros (no página), volvemos a la página 0
  useEffect(() => {
    setPage(0);
  }, [
    filters.dateFrom,
    filters.dateTo,
    filters.site,
    filters.employee,
    filters.status,
    filters.includeIncidents,
    filters.includeOvertime,
    filters.savedView,
  ]);

  // KPI con datos REALES
  const kpiData = useMemo(() => {
    const total = rows.length;
    const completed = rows.filter(
      (r) => r.status === 'complete' || r.status === 'overtime' || r.status === 'late'
    ).length;
    const attendanceRate = total ? (completed / total) * 100 : 0;

    const tardies = rows.filter((r) => r.status === 'late').length;
    const tardinessPct = total ? (tardies / total) * 100 : 0;

    const overtimeHours = rows.reduce(
      (sum, r) => sum + (Number(r.overtime_hours) || 0),
      0
    );
    const incompleteDays = rows.filter((r) => r.status === 'incomplete').length;

    return [
      {
        title: 'Asistencia General',
        value: attendanceRate.toFixed(1),
        unit: '%',
        trend: 'up',
        trendValue: '+0.0%',
        icon: 'Users',
        color: 'success',
        description: 'Periodo visible',
      },
      {
        title: 'Tardanzas',
        value: tardinessPct.toFixed(1),
        unit: '%',
        trend: 'neutral',
        trendValue: '—',
        icon: 'Clock',
        color: 'warning',
        description: 'Sobre el total mostrado',
      },
      {
        title: 'Horas Extra',
        value: fmtNumber(overtimeHours),
        unit: 'hrs',
        trend: 'neutral',
        trendValue: '—',
        icon: 'Zap',
        color: 'primary',
        description: 'Acumulado periodo',
      },
      {
        title: 'Días Incompletos',
        value: String(incompleteDays),
        unit: '',
        trend: 'neutral',
        trendValue: '—',
        icon: 'AlertTriangle',
        color: 'error',
        description: 'Registros sin salida',
      },
    ];
  }, [rows]);

  // Handlers de filtros
  const handleFiltersChange = (newFilters) => setFilters(newFilters);
  const handleApplyFilters = (appliedFilters) => setFilters(appliedFilters);
  const handleResetFilters = () =>
    setFilters({
      dateFrom: '',
      dateTo: '',
      site: 'all',
      supervisor: 'all',
      status: 'all',
      employee: '',
      includeIncidents: false,
      includeOvertime: true,
      savedView: '',
    });

  // Orden local (si la grilla no lo maneja internamente)
  const handleSort = (key) =>
    setSortConfig((prev) => ({
      key,
      direction: prev?.key === key && prev?.direction === 'asc' ? 'desc' : 'asc',
    }));

  const handleBulkAction = (action) => {
    // Extiende si necesitas (exportar seleccionados, etc.)
    // console.log(`Bulk action: ${action} on`, selectedRecords);
  };

  const handleRecordEdit = (record) => {
    // Redirigir o abrir modal
    // console.log('Editing record:', record);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Implementa CSV/XLSX según tu preferencia
      showToast({
        title: 'Exportación iniciada',
        message: 'Tu archivo se generará en segundo plano.',
        type: 'success',
      });
    } catch (e) {
      showToast({ title: 'Error al exportar', message: e.message, type: 'error' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleLogout = () => navigate('/employee-login-portal');
  const handleSiteChange = (site) => {
    if (site?.id) setFilters((f) => ({ ...f, site: site.id }));
  };

  // Atajos de teclado
  useEffect(() => {
    const onKey = (e) => {
      if (e?.ctrlKey || e?.metaKey) {
        if (e.key === 'f') {
          e.preventDefault();
          setFilterPanelCollapsed((v) => !v);
        } else if (e.key === 'e') {
          e.preventDefault();
          handleExport();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Adaptación de filas a la UI
  const attendanceData = useMemo(
    () =>
      rows.map((r) => ({
        id: r.id,
        // OJO: el nombre viene anidado en employee_profiles → user_profiles
        employee:
          r.employee_profiles?.user_profiles?.full_name ||
          r.employee_profiles?.full_name ||
          r.employee_id,
        site: r.construction_sites?.name || r.site_id || '—',
        date: r.date,
        clockIn: r.clock_in
          ? new Date(r.clock_in).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
          : null,
        lunchStart: r.lunch_start
          ? new Date(r.lunch_start).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
          : null,
        lunchEnd: r.lunch_end
          ? new Date(r.lunch_end).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
          : null,
        clockOut: r.clock_out
          ? new Date(r.clock_out).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
          : null,
        totalHours: Number(r.total_hours || 0),
        overtime: Number(r.overtime_hours || 0),
        status: r.status || '—',
        incidents: [],
        _raw: r,
      })),
    [rows]
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <RoleBasedSidebar
        isCollapsed={sidebarCollapsed}
        userRole={currentUser?.role?.toLowerCase()}
      />

      {/* Main Content */}
      <div
        className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-60'} pb-16 md:pb-0`}
      >
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="hidden md:flex"
              >
                <Icon name={sidebarCollapsed ? 'ChevronRight' : 'ChevronLeft'} size={20} />
              </Button>

              <div>
                <h1 className="text-xl font-semibold text-foreground">
                  Historial y Análisis de Asistencia
                </h1>
                <p className="text-sm text-muted-foreground">
                  Análisis detallado y tendencias de asistencia laboral
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <NotificationCenter />
              <UserContextHeader
                user={currentUser}
                onLogout={handleLogout}
                onSiteChange={handleSiteChange}
              />
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-6">
          <NavigationBreadcrumb />

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {kpiData.map((kpi, index) => (
              <KPICard
                key={index}
                title={kpi.title}
                value={kpi.value}
                unit={kpi.unit}
                trend={kpi.trend}
                trendValue={kpi.trendValue}
                icon={kpi.icon}
                color={kpi.color}
                description={kpi.description}
              />
            ))}
          </div>

          {/* Main Dashboard Layout */}
          <div className="flex gap-6">
            {/* Filter Panel */}
            <FilterPanel
              isCollapsed={filterPanelCollapsed}
              onToggleCollapse={() => setFilterPanelCollapsed(!filterPanelCollapsed)}
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onApplyFilters={handleApplyFilters}
              onResetFilters={handleResetFilters}
            />

            {/* Analytics Area */}
            <div className="flex-1 space-y-6">
              {isLoading ? (
                <Loading label="Cargando asistencias…" />
              ) : error ? (
                <ErrorState message={error.message} onRetry={refetch} />
              ) : (
                <>
                  {/* Charts */}
                  <AttendanceChart
                    data={attendanceData}
                    chartType={chartType}
                    onChartTypeChange={setChartType}
                  />

                  {/* Data Grid */}
                  <AttendanceGrid
                    data={attendanceData}
                    onSort={handleSort}
                    sortConfig={sortConfig}
                    onBulkAction={handleBulkAction}
                    selectedRecords={selectedRecords}
                    onRecordSelect={setSelectedRecords}
                    onRecordEdit={handleRecordEdit}
                    isFetching={isFetching}
                  />

                  {/* Pagination */}
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-slate-500">
                      {isFetching ? 'Actualizando… ' : ''}
                      Total: {count} · Página {page + 1} de {totalPages}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPage((p) => Math.max(0, p - 1))}
                        disabled={page === 0}
                        className="px-3 py-1.5 rounded border disabled:opacity-50"
                      >
                        Anterior
                      </button>
                      <button
                        onClick={() =>
                          setPage((p) => (p + 1 < totalPages ? p + 1 : p))
                        }
                        disabled={page + 1 >= totalPages}
                        className="px-3 py-1.5 rounded border disabled:opacity-50"
                      >
                        Siguiente
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Export Panel - Desktop Only */}
            <div className="hidden xl:block w-80">
              <ExportPanel onExport={handleExport} isExporting={isExporting} />
            </div>
          </div>

          {/* Mobile Export Button */}
          <div className="xl:hidden mt-6">
            <Button
              variant="default"
              fullWidth
              iconName="Download"
              iconPosition="left"
              onClick={handleExport}
              loading={isExporting}
            >
              Exportar Datos
            </Button>
          </div>

          {/* Keyboard Shortcuts Help */}
          <div className="hidden md:block fixed bottom-4 right-4">
            <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
              <div className="text-xs text-muted-foreground space-y-1">
                <div>
                  <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Ctrl+F</kbd> Filtros
                </div>
                <div>
                  <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Ctrl+E</kbd> Exportar
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AttendanceHistoryAndAnalyticsDashboard;
