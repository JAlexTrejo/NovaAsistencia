// src/modules/attendance-history-and-analytics-dashboard/index.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import RoleBasedSidebar from '../../components/ui/RoleBasedSidebar';
import NavigationBreadcrumb from '../../components/ui/NavigationBreadcrumb';
import UserContextHeader from '../../components/ui/UserContextHeader';
import NotificationCenter from '../../components/ui/NotificationCenter';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';

// Page components
import KPICard from './components/KPICard';
import FilterPanel from './components/FilterPanel';
import AttendanceGrid from './components/AttendanceGrid';
import AttendanceChart from './components/AttendanceChart';
import ExportPanel from './components/ExportPanel';

// Service (con listAttendancePaginated)
import attendanceService from '@/services/attendanceService';

// ---------- Helpers ----------
const sortKeyMap = {
  // mapeo de claves del grid -> service
  employee: 'employee',
  date: 'date',
  clockIn: 'clockIn',
  clockOut: 'clockOut',
  totalHours: 'totalHours',
  overtime: 'overtime',
  status: 'status',
};

// Mapea filtros de UI -> parámetros del servicio
const mapUiFiltersToService = (f) => {
  const norm = (s) => (s && String(s).trim().length ? s : null);
  return {
    startDate: norm(f?.dateFrom) || null,
    endDate: norm(f?.dateTo) || null,
    siteId: f?.site && f?.site !== 'all' ? f?.site : null,
    // Si en tu UI tienes un selector de empleado por id, úsalo aquí.
    employeeId: f?.employeeId || null,
    status: f?.status && f?.status !== 'all' ? f?.status : null,
    search: norm(f?.employee) || null, // búsqueda por nombre de empleado (string libre)
  };
};

// ---------- Dashboard ----------
const AttendanceHistoryAndAnalyticsDashboard = () => {
  const navigate = useNavigate();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [filterPanelCollapsed, setFilterPanelCollapsed] = useState(false);

  // Chart selector (el componente usa datos mock internos, así que esto es visual)
  const [chartType, setChartType] = useState('bar');

  // Grid selection + sort
  const [selectedRecords, setSelectedRecords] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });

  // Export
  const [isExporting, setIsExporting] = useState(false);

  // Usuario actual (mock)
  const currentUser = {
    name: 'Ana Rodríguez',
    role: 'Supervisor',
    site: 'Obra Central',
    avatar: null,
  };

  // Filtros UI
  const [filters, setFilters] = useState({
    dateFrom: '2025-01-01',
    dateTo: '2025-01-04',
    site: 'all',
    supervisor: 'all',
    status: 'all',
    employee: '',
    includeIncidents: false,
    includeOvertime: true,
    savedView: '',
  });

  // Datos del grid (desde servicio)
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // KPI data (mock visual)
  const kpiData = [
    {
      title: 'Asistencia General',
      value: '94.2',
      unit: '%',
      trend: 'up',
      trendValue: '+2.1%',
      icon: 'Users',
      color: 'success',
      description: 'vs. mes anterior',
    },
    {
      title: 'Tardanzas',
      value: '6.8',
      unit: '%',
      trend: 'down',
      trendValue: '-1.2%',
      icon: 'Clock',
      color: 'warning',
      description: 'Reducción significativa',
    },
    {
      title: 'Horas Extra',
      value: '142.5',
      unit: 'hrs',
      trend: 'up',
      trendValue: '+8.3%',
      icon: 'Zap',
      color: 'primary',
      description: 'Esta semana',
    },
    {
      title: 'Días Incompletos',
      value: '12',
      unit: '',
      trend: 'down',
      trendValue: '-3',
      icon: 'AlertTriangle',
      color: 'error',
      description: 'Pendientes de validación',
    },
  ];

  // --------- Handlers de filtros / orden ----------
  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleApplyFilters = (appliedFilters) => {
    setFilters(appliedFilters);
    setPage(1);
  };

  const handleResetFilters = () => {
    const resetFilters = {
      dateFrom: '',
      dateTo: '',
      site: 'all',
      supervisor: 'all',
      status: 'all',
      employee: '',
      includeIncidents: false,
      includeOvertime: true,
      savedView: '',
    };
    setFilters(resetFilters);
    setPage(1);
  };

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev?.key === key && prev?.direction === 'asc' ? 'desc' : 'asc',
    }));
    setPage(1);
  };

  // --------- Bulk / Edición / Export ----------
  const handleBulkAction = (action) => {
    // Aquí puedes enviar a un endpoint o abrir modal de confirmación
    console.log(`Bulk action: ${action} on records:`, selectedRecords);
  };

  const handleRecordEdit = (record) => {
    console.log('Editing record:', record);
    // Aquí puedes navegar a un formulario o abrir modal
  };

  const handleExport = async (exportConfig) => {
    setIsExporting(true);
    console.log('Exporting with config:', exportConfig);
    setTimeout(() => {
      setIsExporting(false);
      // Notificación de éxito
    }, 2000);
  };

  // --------- Sesión / sitio ----------
  const handleLogout = () => {
    navigate('/employee-login-portal');
  };

  const handleSiteChange = (site) => {
    console.log('Site changed to:', site);
  };

  // --------- Carga de datos ----------
  const serviceParams = useMemo(() => {
    const base = mapUiFiltersToService(filters);
    return {
      ...base,
      page,
      pageSize,
      sortKey: sortKeyMap[sortConfig?.key] || 'date',
      sortDir: sortConfig?.direction || 'desc',
    };
  }, [filters, page, pageSize, sortConfig]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { ok, data, error } = await attendanceService.listAttendancePaginated(serviceParams);
      if (cancelled) return;
      setLoading(false);

      if (!ok) {
        console.error('Error loading attendance:', error);
        setRecords([]);
        setTotalCount(0);
        setTotalPages(1);
        return;
      }

      setRecords(data?.data || []);
      setTotalCount(data?.totalCount || 0);
      setTotalPages(data?.totalPages || 1);
    })();
    return () => {
      cancelled = true;
    };
  }, [serviceParams]);

  // --------- Atajos de teclado ----------
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e?.ctrlKey || e?.metaKey) {
        switch (e?.key) {
          case 'f':
            e?.preventDefault();
            setFilterPanelCollapsed((v) => !v);
            break;
          case 'e':
            e?.preventDefault();
            handleExport({ format: 'excel', dateRange: 'current' });
            break;
          default:
            break;
        }
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [filterPanelCollapsed]);

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <RoleBasedSidebar
        isCollapsed={sidebarCollapsed}
        userRole={currentUser?.role?.toLowerCase()}
      />

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-60'} pb-16 md:pb-0`}>
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
                <h1 className="text-xl font-semibold text-foreground">Historial y Análisis de Asistencia</h1>
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
            {kpiData?.map((kpi, index) => (
              <KPICard
                key={index}
                title={kpi?.title}
                value={kpi?.value}
                unit={kpi?.unit}
                trend={kpi?.trend}
                trendValue={kpi?.trendValue}
                icon={kpi?.icon}
                color={kpi?.color}
                description={kpi?.description}
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
              {/* Charts Section (visual; usa datos internos del componente) */}
              <AttendanceChart
                data={records} // el componente usa mocks internos; mantenemos la prop para futura integración
                chartType={chartType}
                onChartTypeChange={setChartType}
              />

              {/* Data Grid */}
              <AttendanceGrid
                data={records}
                onSort={handleSort}
                sortConfig={sortConfig}
                onBulkAction={handleBulkAction}
                selectedRecords={selectedRecords}
                onRecordSelect={setSelectedRecords}
                onRecordEdit={handleRecordEdit}
              />

              {/* Paginación (nivel dashboard, porque el grid actual muestra una barra estática) */}
              <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-card">
                <div className="text-sm text-muted-foreground">
                  Mostrando {records?.length} de {totalCount} registros
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1 || loading}
                  >
                    <Icon name="ChevronLeft" size={16} />
                  </Button>
                  <span className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded">
                    {page}
                  </span>
                  <span className="px-3 py-1 text-sm text-muted-foreground">
                    / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => (p < totalPages ? p + 1 : p))}
                    disabled={page >= totalPages || loading}
                  >
                    <Icon name="ChevronRight" size={16} />
                  </Button>
                </div>
              </div>
            </div>

            {/* Export Panel - Desktop Only */}
            <div className="hidden xl:block w-80">
              <ExportPanel
                onExport={handleExport}
                isExporting={isExporting}
              />
            </div>
          </div>

          {/* Mobile Export Button */}
          <div className="xl:hidden mt-6">
            <Button
              variant="default"
              fullWidth
              iconName="Download"
              iconPosition="left"
              onClick={() => handleExport({ format: 'excel', dateRange: 'current' })}
              loading={isExporting}
            >
              Exportar Datos
            </Button>
          </div>

          {/* Keyboard Shortcuts Help */}
          <div className="hidden md:block fixed bottom-4 right-4">
            <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
              <div className="text-xs text-muted-foreground space-y-1">
                <div><kbd className="px-1 py-0.5 bg-muted rounded text-xs">Ctrl+F</kbd> Filtros</div>
                <div><kbd className="px-1 py-0.5 bg-muted rounded text-xs">Ctrl+E</kbd> Exportar</div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AttendanceHistoryAndAnalyticsDashboard;
