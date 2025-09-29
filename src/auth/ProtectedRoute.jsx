import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { hasRole } from '../constants/roles.ts';
import Loading from '../components/ui/Loading';
import NotAuthorized from '../components/ui/NotAuthorized';

/**
 * Production-ready ProtectedRoute component with consistent RBAC
 */
export function ProtectedRoute({ 
  children, 
  requiredRole = null, 
  requiredPermission = null,
  fallbackPath = '/employee-login-portal'
}) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Show loading while auth state is being determined
  if (loading) {
    return <Loading />;
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate 
      to={fallbackPath} 
      state={{ from: location }} 
      replace 
    />;
  }

  // Check role-based access
  if (requiredRole && !hasRole(user?.role, requiredRole)) {
    return <NotAuthorized requiredRole={requiredRole} userRole={user?.role} />;
  }

  // Check permission-based access
  if (requiredPermission && !hasPermission(user?.role, requiredPermission)) {
    return <NotAuthorized requiredPermission={requiredPermission} userRole={user?.role} />;
  }

  // User is authenticated and authorized
  return <>{children}</>;
}

export default ProtectedRoute;