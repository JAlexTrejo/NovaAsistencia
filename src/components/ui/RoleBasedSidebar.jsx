import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Icon from '../AppIcon';

const RoleBasedSidebar = ({ isCollapsed = false, userRole = 'user', onToggleCollapse }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navigationItems = [
    {
      section: 'Mi Asistencia',
      items: [
        {
          label: 'Dashboard',
          path: '/dashboard',
          icon: 'Clock',
          requiredRole: ['user', 'supervisor', 'admin', 'superadmin'],
          tooltip: 'Dashboard personal de asistencia'
        },
        {
          label: 'Centro de Perfil',
          path: '/profile-center',
          icon: 'User',
          requiredRole: ['user', 'supervisor', 'admin', 'superadmin'],
          tooltip: 'Gestión de perfil personal'
        }
      ]
    },
    {
      section: 'Supervisión',
      items: [
        {
          label: 'Gestión de Sitios',
          path: '/supervisor/sites',
          icon: 'Building2',
          requiredRole: ['supervisor', 'admin', 'superadmin'],
          tooltip: 'Administración de sitios de construcción'
        }
      ]
    },
    {
      section: 'Administración',
      items: [
        {
          label: 'Gestión de Empleados',
          path: '/admin/employees',
          icon: 'Users',
          requiredRole: ['admin', 'superadmin'],
          tooltip: 'Administración de empleados'
        },
        {
          label: 'Historial de Asistencia',
          path: '/admin/attendance',
          icon: 'BarChart3',
          requiredRole: ['admin', 'superadmin'],
          tooltip: 'Análisis de asistencia y productividad'
        },
        {
          label: 'Gestión de Nómina',
          path: '/admin/payroll',
          icon: 'Calculator',
          requiredRole: ['admin', 'superadmin'],
          tooltip: 'Cálculo y procesamiento de nómina'
        },
        {
          label: 'Registro de Incidentes',
          path: '/admin/incidents',
          icon: 'AlertTriangle',
          requiredRole: ['admin', 'superadmin'],
          tooltip: 'Gestión de incidentes de seguridad'
        },
        {
          label: 'Centro de Reportes',
          path: '/admin/reports',
          icon: 'FileText',
          requiredRole: ['admin', 'superadmin'],
          tooltip: 'Generación y exportación de reportes'
        },
        {
          label: 'Monitoreo de Seguridad',
          path: '/activity-logging-and-security-monitoring-dashboard',
          icon: 'Shield',
          requiredRole: ['admin', 'superadmin'],
          tooltip: 'Monitoreo de actividad y seguridad'
        }
      ]
    },
    {
      section: 'SuperAdmin',
      items: [
        {
          label: 'Panel de Sistema',
          path: '/admin/system',
          icon: 'Settings',
          requiredRole: ['superadmin'],
          tooltip: 'Configuración avanzada del sistema'
        },
        {
          label: 'Control de Roles',
          path: '/admin/roles',
          icon: 'Lock',
          requiredRole: ['superadmin'],
          tooltip: 'Gestión de roles y permisos'
        }
      ]
    }
  ];

  const filteredNavigation = navigationItems?.map(section => ({
      ...section,
      items: section?.items?.filter(item => item?.requiredRole?.includes(userRole))
    }))?.filter(section => section?.items?.length > 0);

  const handleNavigation = (path) => {
    navigate(path);
    setIsMobileOpen(false);
  };

  const handleLogoClick = () => {
    // Navigate to appropriate dashboard based on user role
    switch (userRole) {
      case 'superadmin': navigate('/admin/system');
        break;
      case 'admin': navigate('/admin/employees');
        break;
      case 'supervisor': navigate('/supervisor/sites');
        break;
      default:
        navigate('/dashboard');
    }
    setIsMobileOpen(false);
  };

  const handleToggle = () => {
    onToggleCollapse?.();
  };

  const isActivePath = (path) => {
    return location.pathname === path;
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-primary text-primary-foreground rounded-md shadow-md transition-transform duration-150 ease-out-cubic hover:scale-98"
      >
        <Icon name={isMobileOpen ? 'X' : 'Menu'} size={24} />
      </button>
      
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-200 ease-out-cubic"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 h-full bg-card border-r border-border z-40
          transition-all duration-300 ease-out-cubic
          ${isCollapsed ? 'w-16' : 'w-64'}
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Logo Section */}
        <div className="flex items-center h-16 px-4 border-b border-border">
          <div 
            className="flex items-center cursor-pointer transition-transform duration-150 ease-out-cubic hover:scale-98"
            onClick={handleLogoClick}
          >
            <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-md flex-shrink-0">
              <Icon name="HardHat" size={20} color="white" />
            </div>
            {!isCollapsed && (
              <div className="ml-3">
                <h1 className="text-lg font-semibold text-foreground">AsistenciaPro</h1>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          {filteredNavigation?.map((section, sectionIndex) => (
            <div key={sectionIndex} className="mb-6">
              {!isCollapsed && (
                <h3 className="px-4 mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {section?.section}
                </h3>
              )}
              <ul className="space-y-1 px-2">
                {section?.items?.map((item, itemIndex) => (
                  <li key={itemIndex}>
                    <button
                      onClick={() => handleNavigation(item?.path)}
                      title={isCollapsed ? item?.tooltip : ''}
                      className={`
                        w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-md
                        transition-all duration-150 ease-out-cubic
                        hover:bg-muted hover:scale-[0.98]
                        ${isActivePath(item?.path)
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'text-foreground hover:text-foreground'
                        }
                      `}
                    >
                      <Icon 
                        name={item?.icon} 
                        size={20} 
                        className={`
                          ${isCollapsed ? 'mx-auto' : 'mr-3'}
                          ${isActivePath(item?.path) ? 'text-primary-foreground' : 'text-muted-foreground'}
                          flex-shrink-0
                        `}
                      />
                      {!isCollapsed && (
                        <span className="truncate">{item?.label}</span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* Collapse Toggle (Desktop Only) */}
        {!isMobileOpen && (
          <div className="hidden md:block p-4 border-t border-border">
            <button
              onClick={handleToggle}
              className="w-full flex items-center justify-center p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-all duration-150 ease-out-cubic hover:scale-98"
              title={isCollapsed ? 'Expandir sidebar' : 'Contraer sidebar'}
            >
              <Icon 
                name={isCollapsed ? 'ChevronRight' : 'ChevronLeft'} 
                size={20} 
              />
            </button>
          </div>
        )}
      </aside>
      
      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-30">
        <div className="flex items-center justify-around py-2">
          {filteredNavigation?.slice(0, 4)?.map((section) => 
            section?.items?.slice(0, 1)?.map((item, index) => (
              <button
                key={index}
                onClick={() => handleNavigation(item?.path)}
                className={`
                  flex flex-col items-center p-2 min-w-0 flex-1
                  transition-all duration-150 ease-out-cubic
                  ${isActivePath(item?.path)
                    ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                  }
                `}
              >
                <Icon name={item?.icon} size={20} />
                <span className="text-xs mt-1 truncate">{item?.label?.split(' ')?.[0]}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </>
  );
};

export default RoleBasedSidebar;