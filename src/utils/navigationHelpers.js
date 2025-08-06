import { useNavigate } from 'react-router-dom';

// Helper function to get appropriate dashboard route based on user role
export const getDashboardRoute = (userRole) => {
  switch (userRole?.toLowerCase()) {
    case 'superadmin':
      return '/admin/system';
    case 'admin':
      return '/admin/employees';
    case 'supervisor':
      return '/supervisor/sites';
    default:
      return '/dashboard';
  }
};

// Helper function to get dashboard label based on user role
export const getDashboardLabel = (userRole) => {
  switch (userRole?.toLowerCase()) {
    case 'superadmin':
      return 'Panel de Sistema';
    case 'admin':
      return 'Consola de Empleados';
    case 'supervisor':
      return 'Gestión de Sitios';
    default:
      return 'Dashboard';
  }
};

// Helper function to check if user has access to a route
export const hasRouteAccess = (userRole, requiredRoles) => {
  if (!requiredRoles || requiredRoles?.length === 0) return true;
  return requiredRoles?.includes(userRole?.toLowerCase());
};

// Helper function to get all available routes for a user role
export const getAvailableRoutes = (userRole) => {
  const routes = [
    {
      path: '/dashboard',
      label: 'Dashboard',
      requiredRoles: ['user', 'supervisor', 'admin', 'superadmin']
    },
    {
      path: '/profile-center',
      label: 'Centro de Perfil',
      requiredRoles: ['user', 'supervisor', 'admin', 'superadmin']
    },
    {
      path: '/supervisor/sites',
      label: 'Gestión de Sitios',
      requiredRoles: ['supervisor', 'admin', 'superadmin']
    },
    {
      path: '/admin/employees',
      label: 'Gestión de Empleados',
      requiredRoles: ['admin', 'superadmin']
    },
    {
      path: '/admin/attendance',
      label: 'Historial de Asistencia',
      requiredRoles: ['admin', 'superadmin']
    },
    {
      path: '/admin/payroll',
      label: 'Gestión de Nómina',
      requiredRoles: ['admin', 'superadmin']
    },
    {
      path: '/admin/incidents',
      label: 'Registro de Incidentes',
      requiredRoles: ['admin', 'superadmin']
    },
    {
      path: '/admin/reports',
      label: 'Centro de Reportes',
      requiredRoles: ['admin', 'superadmin']
    },
    {
      path: '/activity-logging-and-security-monitoring-dashboard',
      label: 'Monitoreo de Seguridad',
      requiredRoles: ['admin', 'superadmin']
    },
    {
      path: '/admin/system',
      label: 'Panel de Sistema',
      requiredRoles: ['superadmin']
    },
    {
      path: '/admin/roles',
      label: 'Control de Roles',
      requiredRoles: ['superadmin']
    }
  ];

  return routes?.filter(route => hasRouteAccess(userRole, route?.requiredRoles));
};

// Custom hook for navigation with role awareness
export const useRoleBasedNavigation = () => {
  const navigate = useNavigate();

  const navigateToRoute = (path, userRole) => {
    const availableRoutes = getAvailableRoutes(userRole);
    const hasAccess = availableRoutes?.some(route => route?.path === path);
    
    if (hasAccess) {
      navigate(path);
    } else {
      // Redirect to appropriate dashboard if no access
      const fallbackRoute = getDashboardRoute(userRole);
      navigate(fallbackRoute);
    }
  };

  const navigateToDashboard = (userRole) => {
    const dashboardRoute = getDashboardRoute(userRole);
    navigate(dashboardRoute);
  };

  return {
    navigateToRoute,
    navigateToDashboard,
    getDashboardRoute,
    getDashboardLabel,
    hasRouteAccess,
    getAvailableRoutes
  };
};

export default {
  getDashboardRoute,
  getDashboardLabel,
  hasRouteAccess,
  getAvailableRoutes,
  useRoleBasedNavigation
};