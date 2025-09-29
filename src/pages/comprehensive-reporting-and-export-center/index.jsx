// src/pages/comprehensive-reporting-and-export-center/index.jsx
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import RoleBasedSidebar from '@/components/ui/RoleBasedSidebar';
import NavigationBreadcrumb from '@/components/ui/NavigationBreadcrumb';
import UserContextHeader from '@/components/ui/UserContextHeader';
import NotificationCenter from '@/components/ui/NotificationCenter';
import Icon from '@/components/AppIcon';
import Button from '@/components/ui/Button';
import Loading from '@/components/ui/Loading';
import ErrorState from '@/components/ui/ErrorState';
import { showToast } from '@/components/ui/ToastHub';

import ReportTemplateLibrary from './components/ReportTemplateLibrary';
import ReportBuilder from './components/ReportBuilder';
import ReportPreview from './components/ReportPreview';
import ScheduledReports from './components/ScheduledReports';
import ReportHistory from './components/ReportHistory';

import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@/hooks/useQuery';
import reportingService from '../../services/reportingService';

const TABS = [
  { id: 'builder', name: 'Constructor', icon: 'Settings', description: 'Crear y personalizar reportes' },
  { id: 'templates', name: 'Plantillas', icon: 'FileText', description: 'Plantillas predefinidas' },
  { id: 'scheduled', name: 'Programados', icon: 'Calendar', description: 'Reportes automáticos' },
  { id: 'history', name: 'Historial', icon: 'Clock', description: 'Reportes generados' },
];

const ComprehensiveReportingAndExportCenter = () => {
  const navigate = useNavigate();
  const { getCurrentUserContext } = useAuth();
  const currentUser = getCurrentUserContext();

  // UI state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('builder');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [reportConfig, setReportConfig] = useState(null);

  // Query: Stats (para los “Quick Stats”)
  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useQuery(reportingService.getReportingStats, {
    deps: [], // se carga al entrar
    retry: 1,
    onError: (e) => showToast({ title: 'Error al cargar estadísticas', message: e.message, type: 'error' }),
  });

  // Query: Plantillas
  const {
    data: templates,
    isLoading: templatesLoading,
    error: templatesError,
    refetch: refetchTemplates,
  } = useQuery(reportingService.getTemplates, {
    deps: [],
    retry: 1,
    onError: (e) => showToast({ title: 'Error al cargar plantillas', message: e.message, type: 'error' }),
  });

  // Query: Programaciones
  const {
    data: scheduled,
    isLoading: scheduledLoading,
    error: scheduledError,
    refetch: refetchScheduled,
  } = useQuery(reportingService.getScheduledReports, {
    deps: [],
    retry: 1,
    onError: (e) => showToast({ title: 'Error al cargar programaciones', message: e.message, type: 'error' }),
  });

  // Query: Historial (paginado)
  const [historyPage, setHistoryPage] = useState(0);
  const {
    data: historyData,
    isLoading: historyLoading,
    error: historyError,
    refetch: refetchHistory,
  } = useQuery(reportingService.getReportHistory, {
    params: { page: historyPage, pageSize: 25 },
    deps: [historyPage],
    keepPreviousData: true,
    retry: 1,
    onError: (e) => showToast({ title: 'Error al cargar historial', message: e.message, type: 'error' }),
  });

  const historyRows = historyData?.rows ?? [];
  const historyCount = historyData?.count ?? 0;
  const historyPageSize = historyData?.pageSize ?? 25;
  const historyTotalPages = useMemo(
    () => Math.max(1, Math.ceil(historyCount / historyPageSize)),
    [historyCount, historyPageSize]
  );

  const anyError = statsError || templatesError || scheduledError || historyError;
  const loading =
    statsLoading || templatesLoading || scheduledLoading || historyLoading;

  const refreshAll = async () => {
    await Promise.all([refetchStats(), refetchTemplates(), refetchScheduled(), refetchHistory()]);
    showToast({ title: 'Actualizado', message: 'Datos de reportes actualizados', type: 'success' });
  };

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    setActiveTab('builder');
  };

  const handleReportConfigChange = (config) => setReportConfig(config);

  const handleLogout = () => navigate('/employee-login-portal');
  const handleProfileClick = () => navigate('/profile');
  const handleSiteChange = (site) => {
    // Si tu header permite cambiar sitio, podrías re-filtrar plantillas o programaciones por site.id
    // Por ahora, sólo mostramos un toast.
    showToast({ title: 'Sitio cambiado', message: site?.name || '—', type: 'info' });
  };

  // Quick stats derivados
  const quickStats = {
    templates: stats?.templates ?? 0,
    scheduled: stats?.scheduled ?? 0,
    generatedThisMonth: stats?.generatedThisMonth ?? 0,
    successRate: stats?.successRate ?? 0, // porcentaje ya calculado en el service
  };

  // Loading / Error global (UI simple)
  if (loading && !historyRows.length && !templates?.length) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loading label="Cargando centro de reportes…" />
      </div>
    );
  }

  if (anyError && !historyRows.length && !templates?.length) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <ErrorState message="No se pudieron cargar los datos del centro de reportes." onRetry={refreshAll} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <RoleBasedSidebar
        isCollapsed={sidebarCollapsed}
        userRole={currentUser?.role?.toLowerCase()}
      />

      {/* Main Content */}
      <div className={`transition-all duration-300 ease-out-cubic ${sidebarCollapsed ? 'ml-16' : 'ml-60'} pb-16 md:pb-0`}>
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                iconName={sidebarCollapsed ? 'ChevronRight' : 'ChevronLeft'}
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="hidden md:flex"
              />
              <div>
                <h1 className="text-xl font-semibold text-foreground">Centro de Reportes</h1>
                <p className="text-sm text-muted-foreground">Generación y exportación de reportes empresariales</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Button variant="outline" iconName="RefreshCw" onClick={refreshAll}>
                Actualizar
              </Button>
              <NotificationCenter />
              <UserContextHeader
                user={currentUser}
                onLogout={handleLogout}
                onProfileClick={handleProfileClick}
                onSiteChange={handleSiteChange}
              />
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-6">
          <NavigationBreadcrumb />

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-card rounded-lg border border-border p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Icon name="FileText" size={24} className="text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{quickStats.templates}</p>
                  <p className="text-sm text-muted-foreground">Plantillas Disponibles</p>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-lg border border-border p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-success/10 rounded-lg">
                  <Icon name="Calendar" size={24} className="text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{quickStats.scheduled}</p>
                  <p className="text-sm text-muted-foreground">Reportes Programados</p>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-lg border border-border p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-warning/10 rounded-lg">
                  <Icon name="Download" size={24} className="text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{quickStats.generatedThisMonth}</p>
                  <p className="text-sm text-muted-foreground">Reportes Este Mes</p>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-lg border border-border p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-accent/10 rounded-lg">
                  <Icon name="TrendingUp" size={24} className="text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {Number(quickStats.successRate).toFixed(1)}%
                  </p>
                  <p className="text-sm text-muted-foreground">Tasa de Éxito</p>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="bg-card rounded-lg border border-border mb-6">
            <div className="border-b border-border">
              <nav className="flex space-x-8 px-6">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-150 ease-out-cubic ${
                      activeTab === tab.id
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
                    }`}
                  >
                    <Icon name={tab.icon} size={16} />
                    <span>{tab.name}</span>
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-6">
              <div className="mb-2">
                <h2 className="text-lg font-semibold text-foreground">
                  {TABS.find((t) => t.id === activeTab)?.name}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {TABS.find((t) => t.id === activeTab)?.description}
                </p>
              </div>
            </div>
          </div>

          {/* Tab Content */}
          <div className="space-y-6">
            {activeTab === 'builder' && (
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-2">
                  <ReportBuilder
                    selectedTemplate={selectedTemplate}
                    onReportChange={setReportConfig}
                    onGenerate={async (config) => {
                      try {
                        const res = await reportingService.previewReport(config);
                        showToast({ title: 'Vista previa', message: 'Reporte generado en vista previa', type: 'success' });
                        setReportConfig({ ...(config || {}), previewUrl: res?.previewUrl });
                      } catch (e) {
                        showToast({ title: 'Error', message: e.message, type: 'error' });
                      }
                    }}
                  />
                </div>
                <div className="lg:col-span-3">
                  <ReportPreview reportConfig={reportConfig} />
                </div>
              </div>
            )}

            {activeTab === 'templates' && (
              <ReportTemplateLibrary
                templates={templates || []}
                loading={templatesLoading}
                onSelectTemplate={handleTemplateSelect}
                selectedTemplate={selectedTemplate}
                onRefresh={refetchTemplates}
              />
            )}

            {activeTab === 'scheduled' && (
              <ScheduledReports
                items={scheduled || []}
                loading={scheduledLoading}
                onRefresh={refetchScheduled}
                onCreate={async (payload) => {
                  try {
                    await reportingService.createScheduledReport(payload);
                    showToast({ title: 'Programado', message: 'Reporte programado con éxito', type: 'success' });
                    await refetchScheduled();
                    await refetchStats();
                  } catch (e) {
                    showToast({ title: 'Error', message: e.message, type: 'error' });
                  }
                }}
                onToggleActive={async (id, nextActive) => {
                  try {
                    await reportingService.updateScheduledReport(id, { active: nextActive });
                    await refetchScheduled();
                  } catch (e) {
                    showToast({ title: 'Error', message: e.message, type: 'error' });
                  }
                }}
                onDelete={async (id) => {
                  try {
                    await reportingService.deleteScheduledReport(id);
                    await refetchScheduled();
                    await refetchStats();
                  } catch (e) {
                    showToast({ title: 'Error', message: e.message, type: 'error' });
                  }
                }}
              />
            )}

            {activeTab === 'history' && (
              <ReportHistory
                rows={historyRows}
                loading={historyLoading}
                page={historyPage}
                totalPages={historyTotalPages}
                onPrev={() => setHistoryPage((p) => Math.max(0, p - 1))}
                onNext={() => setHistoryPage((p) => (p + 1 < historyTotalPages ? p + 1 : p))}
                onRefresh={refetchHistory}
                onDownload={async (row) => {
                  try {
                    const url = await reportingService.getReportDownloadUrl(row.id);
                    if (url) window.open(url, '_blank', 'noopener,noreferrer');
                  } catch (e) {
                    showToast({ title: 'Error', message: e.message, type: 'error' });
                  }
                }}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ComprehensiveReportingAndExportCenter;
