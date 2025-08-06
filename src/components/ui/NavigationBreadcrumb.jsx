import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Icon from '../AppIcon';

const NavigationBreadcrumb = ({ showBackButton = true, className = '' }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userProfile } = useAuth();

  const routeMap = {
    '/login': { label: 'Iniciar Sesión', parent: null },
    '/employee-login-portal': { label: 'Portal de Empleado', parent: null },
    '/dashboard': { label: 'Dashboard de Asistencia', parent: null },
    '/employee-attendance-dashboard': { label: 'Dashboard de Asistencia', parent: null },
    '/profile-center': { label: 'Centro de Perfil', parent: '/dashboard' },
    '/administrator-employee-management-console': { label: 'Consola de Empleados', parent: null },
    '/admin/employees': { label: 'Consola de Empleados', parent: null },
    '/attendance-history-and-analytics-dashboard': { label: 'Historial de Asistencia', parent: '/admin/employees' },
    '/admin/attendance': { label: 'Historial de Asistencia', parent: '/admin/employees' },
    '/incident-registration-and-management-system': { label: 'Registro de Incidentes', parent: '/dashboard' },
    '/admin/incidents': { label: 'Registro de Incidentes', parent: '/admin/employees' },
    '/payroll-calculation-and-management-interface': { label: 'Gestión de Nómina', parent: '/admin/employees' },
    '/admin/payroll': { label: 'Gestión de Nómina', parent: '/admin/employees' },
    '/construction-site-and-supervisor-management-hub': { label: 'Gestión de Sitios', parent: null },
    '/supervisor/sites': { label: 'Gestión de Sitios', parent: null },
    '/comprehensive-reporting-and-export-center': { label: 'Centro de Reportes', parent: '/admin/employees' },
    '/admin/reports': { label: 'Centro de Reportes', parent: '/admin/employees' },
    '/system-administration-and-configuration-panel': { label: 'Panel de Sistema', parent: null },
    '/admin/system': { label: 'Panel de Sistema', parent: null },
    '/role-based-access-control-management-system': { label: 'Control de Acceso', parent: '/admin/system' },
    '/admin/roles': { label: 'Control de Acceso', parent: '/admin/system' },
    '/activity-logging-and-security-monitoring-dashboard': { label: 'Monitoreo de Seguridad', parent: '/admin/system' },
    '/user-profile-management-and-authentication-center': { label: 'Centro de Perfil', parent: null }
  };

  // Get role-appropriate dashboard route
  const getDashboardRoute = () => {
    switch (userProfile?.role) {
      case 'superadmin': return '/admin/system';
      case 'admin': return '/admin/employees';
      case 'supervisor': return '/supervisor/sites';
      default: return '/dashboard';
    }
  };

  const getDashboardLabel = () => {
    switch (userProfile?.role) {
      case 'superadmin': return 'Panel de Sistema';
      case 'admin': return 'Consola de Empleados';
      case 'supervisor': return 'Gestión de Sitios';
      default: return 'Dashboard';
    }
  };

  const currentRoute = routeMap?.[location.pathname];
  const dashboardRoute = getDashboardRoute();
  const isAtDashboard = location.pathname === dashboardRoute;
  
  if (!currentRoute && location.pathname !== dashboardRoute) {
    return null;
  }

  const breadcrumbItems = [];
  
  // Add home/dashboard as root if not already there
  if (!isAtDashboard) {
    breadcrumbItems?.push({
      label: getDashboardLabel(),
      path: dashboardRoute,
      isHome: true
    });
  }

  // Add parent if exists and different from home
  if (currentRoute?.parent && currentRoute?.parent !== dashboardRoute) {
    const parentRoute = routeMap?.[currentRoute?.parent];
    if (parentRoute) {
      breadcrumbItems?.push({
        label: parentRoute?.label,
        path: currentRoute?.parent
      });
    }
  }

  // Add current page if it's not the dashboard
  if (!isAtDashboard && currentRoute) {
    breadcrumbItems?.push({
      label: currentRoute?.label,
      path: location.pathname,
      isCurrent: true
    });
  }

  const handleNavigation = (path) => {
    if (path !== location.pathname) {
      navigate(path);
    }
  };

  const handleBackClick = () => {
    navigate(-1);
  };

  // Don't render if only home item and we're at home
  if (breadcrumbItems?.length === 0 || (breadcrumbItems?.length === 1 && breadcrumbItems?.[0]?.isHome)) {
    return showBackButton && !isAtDashboard ? (
      <div className={`flex items-center space-x-2 mb-6 ${className}`}>
        <button
          onClick={handleBackClick}
          className="flex items-center space-x-2 text-sm text-muted-foreground hover:text-foreground transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm px-2 py-1"
          title="Regresar a la página anterior"
        >
          <Icon name="ArrowLeft" size={16} />
          <span>Atrás</span>
        </button>
      </div>
    ) : null;
  }

  return (
    <div className={`flex items-center justify-between mb-6 ${className}`}>
      <nav className="flex items-center space-x-2 text-sm text-muted-foreground" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-2">
          {breadcrumbItems?.map((item, index) => (
            <li key={index} className="flex items-center">
              {index > 0 && (
                <Icon 
                  name="ChevronRight" 
                  size={16} 
                  className="mx-2 text-muted-foreground" 
                />
              )}
              
              {item?.isHome && (
                <Icon 
                  name="Home" 
                  size={16} 
                  className="mr-2 text-muted-foreground" 
                />
              )}
              
              {item?.isCurrent ? (
                <span 
                  className="font-medium text-foreground"
                  aria-current="page"
                >
                  {item?.label}
                </span>
              ) : (
                <button
                  onClick={() => handleNavigation(item?.path)}
                  className="hover:text-foreground transition-colors duration-150 ease-out-cubic focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm px-1 py-0.5"
                >
                  {item?.label}
                </button>
              )}
            </li>
          ))}
        </ol>
      </nav>

      {showBackButton && !isAtDashboard && (
        <button
          onClick={handleBackClick}
          className="flex items-center space-x-2 text-sm text-muted-foreground hover:text-foreground transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm px-2 py-1"
          title="Regresar a la página anterior"
        >
          <Icon name="ArrowLeft" size={16} />
          <span className="hidden sm:inline">Atrás</span>
        </button>
      )}
    </div>
  );
};

export default NavigationBreadcrumb;