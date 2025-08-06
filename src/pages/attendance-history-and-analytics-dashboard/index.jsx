import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import RoleBasedSidebar from '../../components/ui/RoleBasedSidebar';
import NavigationBreadcrumb from '../../components/ui/NavigationBreadcrumb';
import UserContextHeader from '../../components/ui/UserContextHeader';
import NotificationCenter from '../../components/ui/NotificationCenter';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';

// Import page components
import KPICard from './components/KPICard';
import FilterPanel from './components/FilterPanel';
import AttendanceGrid from './components/AttendanceGrid';
import AttendanceChart from './components/AttendanceChart';
import ExportPanel from './components/ExportPanel';

const AttendanceHistoryAndAnalyticsDashboard = () => {
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [filterPanelCollapsed, setFilterPanelCollapsed] = useState(false);
  const [chartType, setChartType] = useState('bar');
  const [selectedRecords, setSelectedRecords] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
  const [isExporting, setIsExporting] = useState(false);

  // Mock user data
  const currentUser = {
    name: 'Ana Rodríguez',
    role: 'Supervisor',
    site: 'Obra Central',
    avatar: null
  };

  // Mock filters state
  const [filters, setFilters] = useState({
    dateFrom: '2025-01-01',
    dateTo: '2025-01-04',
    site: 'all',
    supervisor: 'all',
    status: 'all',
    employee: '',
    includeIncidents: false,
    includeOvertime: true,
    savedView: ''
  });

  // Mock attendance data
  const attendanceData = [
    {
      id: 1,
      employee: 'Carlos Martínez',
      site: 'Obra Central',
      date: '2025-01-04',
      clockIn: '08:00',
      lunchStart: '12:00',
      lunchEnd: '13:00',
      clockOut: '17:30',
      totalHours: 8.5,
      overtime: 0.5,
      status: 'complete',
      incidents: []
    },
    {
      id: 2,
      employee: 'María González',
      site: 'Proyecto Norte',
      date: '2025-01-04',
      clockIn: '08:15',
      lunchStart: '12:30',
      lunchEnd: '13:30',
      clockOut: '18:00',
      totalHours: 8.75,
      overtime: 0.75,
      status: 'late',
      incidents: [{ type: 'tardiness', reason: 'Tráfico' }]
    },
    {
      id: 3,
      employee: 'Luis García',
      site: 'Edificio Sur',
      date: '2025-01-04',
      clockIn: '07:45',
      lunchStart: '12:00',
      lunchEnd: '13:00',
      clockOut: null,
      totalHours: 0,
      overtime: 0,
      status: 'incomplete',
      incidents: [{ type: 'incomplete', reason: 'No registró salida' }]
    },
    {
      id: 4,
      employee: 'Pedro Ruiz',
      site: 'Obra Central',
      date: '2025-01-04',
      clockIn: '08:00',
      lunchStart: '12:00',
      lunchEnd: '13:00',
      clockOut: '19:30',
      totalHours: 10.5,
      overtime: 2.5,
      status: 'overtime',
      incidents: []
    },
    {
      id: 5,
      employee: 'Ana López',
      site: 'Complejo Oeste',
      date: '2025-01-04',
      clockIn: '08:05',
      lunchStart: '12:15',
      lunchEnd: '13:15',
      clockOut: '17:00',
      totalHours: 7.75,
      overtime: 0,
      status: 'complete',
      incidents: []
    }
  ];

  // KPI data
  const kpiData = [
    {
      title: 'Asistencia General',
      value: '94.2',
      unit: '%',
      trend: 'up',
      trendValue: '+2.1%',
      icon: 'Users',
      color: 'success',
      description: 'vs. mes anterior'
    },
    {
      title: 'Tardanzas',
      value: '6.8',
      unit: '%',
      trend: 'down',
      trendValue: '-1.2%',
      icon: 'Clock',
      color: 'warning',
      description: 'Reducción significativa'
    },
    {
      title: 'Horas Extra',
      value: '142.5',
      unit: 'hrs',
      trend: 'up',
      trendValue: '+8.3%',
      icon: 'Zap',
      color: 'primary',
      description: 'Esta semana'
    },
    {
      title: 'Días Incompletos',
      value: '12',
      unit: '',
      trend: 'down',
      trendValue: '-3',
      icon: 'AlertTriangle',
      color: 'error',
      description: 'Pendientes de validación'
    }
  ];

  // Event handlers
  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleApplyFilters = (appliedFilters) => {
    console.log('Applying filters:', appliedFilters);
    // Here you would typically fetch new data based on filters
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
      savedView: ''
    };
    setFilters(resetFilters);
  };

  const handleSort = (key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig?.key === key && prevConfig?.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleBulkAction = (action) => {
    console.log(`Bulk action: ${action} on records:`, selectedRecords);
    // Implement bulk actions logic
  };

  const handleRecordEdit = (record) => {
    console.log('Editing record:', record);
    // Navigate to edit form or open modal
  };

  const handleExport = async (exportConfig) => {
    setIsExporting(true);
    console.log('Exporting with config:', exportConfig);
    
    // Simulate export process
    setTimeout(() => {
      setIsExporting(false);
      // Show success notification
    }, 2000);
  };

  const handleLogout = () => {
    navigate('/employee-login-portal');
  };

  const handleSiteChange = (site) => {
    console.log('Site changed to:', site);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e?.ctrlKey || e?.metaKey) {
        switch (e?.key) {
          case 'f':
            e?.preventDefault();
            setFilterPanelCollapsed(!filterPanelCollapsed);
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
              {/* Charts Section */}
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
              />
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