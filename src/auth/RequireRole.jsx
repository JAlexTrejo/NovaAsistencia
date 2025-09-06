import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getDashboardRoute } from '../utils/navigationHelpers';

const RequireRole = ({ children, allowedRoles = [] }) => {
  const { userProfile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Cargando...</span>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return <Navigate to="/login" replace />;
  }

  const userRole = userProfile?.role;
  
  // Check if user has required role
  const hasAccess = 
    allowedRoles?.includes(userRole) ||
    allowedRoles?.includes('SuperAdmin') && userRole === 'superadmin' ||
    allowedRoles?.includes('Admin') && ['admin', 'superadmin']?.includes(userRole) ||
    allowedRoles?.includes('User') && ['user', 'supervisor', 'admin', 'superadmin']?.includes(userRole) ||
    userRole === 'superadmin'; // SuperAdmin always has access

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <h3 className="font-semibold">Acceso No Autorizado</h3>
            <p className="mt-2 text-sm">
              No tienes permisos para acceder a esta sección.
            </p>
          </div>
          <button
            onClick={() => window.location.href = getDashboardRoute(userRole)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Volver al Dashboard
          </button>
        </div>
      </div>
    );
  }

  return children;
};

export default RequireRole;