import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import RoleBasedSidebar from '../../components/ui/RoleBasedSidebar';
import NavigationBreadcrumb from '../../components/ui/NavigationBreadcrumb';
import UserContextHeader from '../../components/ui/UserContextHeader';
import NotificationCenter from '../../components/ui/NotificationCenter';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';

// Import tab components
import UserManagementTab from './components/UserManagementTab';
import SystemSettingsTab from './components/SystemSettingsTab';
import SecurityPoliciesTab from './components/SecurityPoliciesTab';
import IntegrationManagementTab from './components/IntegrationManagementTab';
import AuditLogViewer from './components/AuditLogViewer';
import SystemHealthDashboard from './components/SystemHealthDashboard';
import BrandingCustomizationTab from './components/BrandingCustomizationTab';

const SystemAdministrationPanel = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user, userProfile, signOut } = useAuth();

  const currentUser = {
    name: userProfile?.full_name || user?.email?.split('@')?.[0] || 'Usuario',
    role: userProfile?.role || 'admin',
    site: userProfile?.site || 'Oficina Central',
    avatar: null
  };

  const tabs = [
    {
      id: 'users',
      label: 'Gestión de Usuarios',
      icon: 'Users',
      component: UserManagementTab,
      description: 'Administrar usuarios, roles y permisos'
    },
    {
      id: 'settings',
      label: 'Configuración del Sistema',
      icon: 'Settings',
      component: SystemSettingsTab,
      description: 'Configurar parámetros operacionales'
    },
    {
      id: 'branding',
      label: 'Personalización de Marca',
      icon: 'Palette',
      component: BrandingCustomizationTab,
      description: 'Personalizar nombre, colores, logos y marca para clientes'
    },
    {
      id: 'security',
      label: 'Políticas de Seguridad',
      icon: 'Shield',
      component: SecurityPoliciesTab,
      description: 'Gestionar políticas de seguridad'
    },
    {
      id: 'integrations',
      label: 'Integraciones',
      icon: 'Plug',
      component: IntegrationManagementTab,
      description: 'Configurar conexiones externas'
    },
    {
      id: 'audit',
      label: 'Registro de Auditoría',
      icon: 'FileText',
      component: AuditLogViewer,
      description: 'Revisar logs de actividad del sistema'
    },
    {
      id: 'health',
      label: 'Estado del Sistema',
      icon: 'Activity',
      component: SystemHealthDashboard,
      description: 'Monitorear rendimiento y salud'
    }
  ];

  const activeTabData = tabs?.find(tab => tab?.id === activeTab);
  const ActiveComponent = activeTabData?.component;

  const handleNotificationClick = (notification) => {
    console.log('Notification clicked:', notification);
  };

  const handleMarkAsRead = (notificationId) => {
    console.log('Marking as read:', notificationId);
  };

  const handleMarkAllAsRead = () => {
    console.log('Marking all as read');
  };

  const handleSidebarToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <RoleBasedSidebar 
        isCollapsed={sidebarCollapsed}
        userRole={currentUser?.role?.toLowerCase()}
        onToggleCollapse={handleSidebarToggle}
      />
      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'md:ml-16' : 'md:ml-64'}`}>
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                iconName="Menu"
                onClick={handleSidebarToggle}
                className="hidden md:flex"
              />
              <div>
                <h1 className="text-xl font-semibold text-foreground">Panel de Administración del Sistema</h1>
                <p className="text-sm text-muted-foreground">
                  Configuración avanzada y gestión del sistema AsistenciaPro
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <NotificationCenter
                onNotificationClick={handleNotificationClick}
                onMarkAsRead={handleMarkAsRead}
                onMarkAllAsRead={handleMarkAllAsRead}
              />
              <UserContextHeader user={currentUser} />
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-6 pb-20 md:pb-6">
          <NavigationBreadcrumb />
          
          {/* Tab Navigation */}
          <div className="bg-card rounded-lg border border-border mb-6">
            <div className="border-b border-border">
              <nav className="flex overflow-x-auto">
                {tabs?.map((tab) => (
                  <button
                    key={tab?.id}
                    onClick={() => setActiveTab(tab?.id)}
                    className={`
                      flex items-center space-x-2 px-6 py-4 text-sm font-medium whitespace-nowrap
                      border-b-2 transition-all duration-150 ease-out-cubic
                      ${activeTab === tab?.id
                        ? 'border-primary text-primary bg-primary/5' :'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
                      }
                    `}
                  >
                    <Icon name={tab?.icon} size={18} />
                    <span>{tab?.label}</span>
                  </button>
                ))}
              </nav>
            </div>
            
            {/* Tab Description */}
            <div className="px-6 py-3 bg-muted/30">
              <p className="text-sm text-muted-foreground">
                {activeTabData?.description}
              </p>
            </div>
          </div>

          {/* Tab Content */}
          <div className="bg-card rounded-lg border border-border p-6">
            {ActiveComponent && <ActiveComponent />}
          </div>
        </main>
      </div>
    </div>
  );
};

export default SystemAdministrationPanel;