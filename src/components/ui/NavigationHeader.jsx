import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Icon from '../AppIcon';
import Button from './Button';

const NavigationHeader = ({ 
  title, 
  subtitle, 
  showHomeButton = true, 
  showBackButton = true,
  customHomeRoute = null,
  className = '' 
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userProfile } = useAuth();

  // Get role-appropriate dashboard route
  const getDashboardRoute = () => {
    if (customHomeRoute) return customHomeRoute;
    
    switch (userProfile?.role) {
      case 'superadmin': return '/admin/system';
      case 'admin': return '/admin/employees';
      case 'supervisor': return '/supervisor/sites';
      default: return '/dashboard';
    }
  };

  const handleHomeClick = () => {
    const homeRoute = getDashboardRoute();
    if (location.pathname !== homeRoute) {
      navigate(homeRoute);
    }
  };

  const handleBackClick = () => {
    navigate(-1);
  };

  // Don't show back button if we're at dashboard/home
  const isAtDashboard = location.pathname === getDashboardRoute() || 
                       location.pathname === '/dashboard' ||
                       location.pathname === '/admin/system' ||
                       location.pathname === '/admin/employees' ||
                       location.pathname === '/supervisor/sites';

  return (
    <div className={`flex items-center justify-between mb-6 ${className}`}>
      <div className="flex items-center space-x-4">
        {/* Navigation Buttons */}
        <div className="flex items-center space-x-2">
          {showHomeButton && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleHomeClick}
              title={`Ir a ${userProfile?.role === 'superadmin' ? 'Panel de Sistema' : 
                      userProfile?.role === 'admin' ? 'Consola de Empleados' :
                      userProfile?.role === 'supervisor' ? 'Gestión de Sitios' : 'Dashboard'}`}
              className="flex items-center space-x-2"
            >
              <Icon name="Home" size={16} />
              <span className="hidden sm:inline">Inicio</span>
            </Button>
          )}
          
          {showBackButton && !isAtDashboard && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleBackClick}
              title="Regresar a la página anterior"
              className="flex items-center space-x-2"
            >
              <Icon name="ArrowLeft" size={16} />
              <span className="hidden sm:inline">Atrás</span>
            </Button>
          )}
        </div>

        {/* Page Title */}
        {(title || subtitle) && (
          <div className="border-l border-border pl-4">
            {title && (
              <h1 className="text-xl font-semibold text-foreground">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-1">
                {subtitle}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Current Path Indicator - Mobile friendly */}
      <div className="hidden md:flex items-center text-xs text-muted-foreground">
        <Icon name="MapPin" size={12} className="mr-1" />
        <span>{location.pathname}</span>
      </div>
    </div>
  );
};

export default NavigationHeader;