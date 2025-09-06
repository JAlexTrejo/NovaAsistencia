import React from 'react';
import { Shield, Home, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getDashboardRoute } from '../../utils/navigationHelpers';

const NotAuthorized = ({ requiredRole = 'Admin', currentRole = 'User' }) => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoHome = () => {
    const dashboardRoute = getDashboardRoute(userProfile?.role);
    navigate(dashboardRoute);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <Shield className="w-8 h-8 text-red-600" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Acceso No Autorizado
        </h1>

        {/* Message */}
        <div className="space-y-3 mb-8">
          <p className="text-gray-600">
            No tienes permisos para acceder a esta sección.
          </p>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-800">
              <span className="font-medium">Requerido:</span> {requiredRole}
            </p>
            <p className="text-sm text-red-800">
              <span className="font-medium">Tu rol:</span> {currentRole}
            </p>
          </div>
          <p className="text-sm text-gray-500">
            Contacta a tu administrador si necesitas acceso a esta funcionalidad.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleGoHome}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            Ir al Dashboard
          </button>
          
          <button
            onClick={handleGoBack}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Regresar
          </button>
        </div>

        {/* Support Info */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-400">
            Nova HR - Sistema de Gestión de Recursos Humanos
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotAuthorized;