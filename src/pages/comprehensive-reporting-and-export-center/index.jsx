import React, { useState } from 'react';
import RoleBasedSidebar from '../../components/ui/RoleBasedSidebar';
import NavigationBreadcrumb from '../../components/ui/NavigationBreadcrumb';
import UserContextHeader from '../../components/ui/UserContextHeader';
import NotificationCenter from '../../components/ui/NotificationCenter';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';

// Import components
import ReportTemplateLibrary from './components/ReportTemplateLibrary';
import ReportBuilder from './components/ReportBuilder';
import ReportPreview from './components/ReportPreview';
import ScheduledReports from './components/ScheduledReports';
import ReportHistory from './components/ReportHistory';

const ComprehensiveReportingAndExportCenter = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('builder');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [reportConfig, setReportConfig] = useState(null);

  const user = {
    name: 'María González',
    role: 'Admin',
    site: 'Oficina Central',
    avatar: null
  };

  const tabs = [
    { id: 'builder', name: 'Constructor', icon: 'Settings', description: 'Crear y personalizar reportes' },
    { id: 'templates', name: 'Plantillas', icon: 'FileText', description: 'Plantillas predefinidas' },
    { id: 'scheduled', name: 'Programados', icon: 'Calendar', description: 'Reportes automáticos' },
    { id: 'history', name: 'Historial', icon: 'Clock', description: 'Reportes generados' }
  ];

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    setActiveTab('builder');
  };

  const handleReportConfigChange = (config) => {
    setReportConfig(config);
  };

  const handleLogout = () => {
    console.log('Logging out...');
  };

  const handleProfileClick = () => {
    console.log('Opening profile...');
  };

  const handleSiteChange = (site) => {
    console.log('Changing site to:', site?.name);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <RoleBasedSidebar 
        isCollapsed={sidebarCollapsed}
        userRole={user?.role?.toLowerCase()}
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
              <NotificationCenter />
              <UserContextHeader
                user={user}
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
                  <p className="text-2xl font-bold text-foreground">24</p>
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
                  <p className="text-2xl font-bold text-foreground">8</p>
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
                  <p className="text-2xl font-bold text-foreground">156</p>
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
                  <p className="text-2xl font-bold text-foreground">98.5%</p>
                  <p className="text-sm text-muted-foreground">Tasa de Éxito</p>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="bg-card rounded-lg border border-border mb-6">
            <div className="border-b border-border">
              <nav className="flex space-x-8 px-6">
                {tabs?.map((tab) => (
                  <button
                    key={tab?.id}
                    onClick={() => setActiveTab(tab?.id)}
                    className={`
                      flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm
                      transition-colors duration-150 ease-out-cubic
                      ${activeTab === tab?.id
                        ? 'border-primary text-primary' :'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
                      }
                    `}
                  >
                    <Icon name={tab?.icon} size={16} />
                    <span>{tab?.name}</span>
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-foreground">
                  {tabs?.find(tab => tab?.id === activeTab)?.name}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {tabs?.find(tab => tab?.id === activeTab)?.description}
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
                    onReportChange={handleReportConfigChange}
                  />
                </div>
                <div className="lg:col-span-3">
                  <ReportPreview reportConfig={reportConfig} />
                </div>
              </div>
            )}

            {activeTab === 'templates' && (
              <ReportTemplateLibrary
                onSelectTemplate={handleTemplateSelect}
                selectedTemplate={selectedTemplate}
              />
            )}

            {activeTab === 'scheduled' && (
              <ScheduledReports />
            )}

            {activeTab === 'history' && (
              <ReportHistory />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ComprehensiveReportingAndExportCenter;