import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useAuth } from '../../contexts/AuthContext';
import { LoginForm } from './components/LoginForm';
import SafetyReminders from './components/SafetyReminders';
import SystemStatus from './components/SystemStatus';

const EmployeeLoginPortal = () => {
  const navigate = useNavigate();
  const { user, userProfile, loading } = useAuth();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!loading && user && userProfile) {
      // Role-based redirect logic
      switch (userProfile?.role) {
        case 'superadmin': navigate('/admin/system', { replace: true });
          break;
        case 'admin': navigate('/admin/employees', { replace: true });
          break;
        case 'supervisor': navigate('/supervisor/sites', { replace: true });
          break;
        default:
          navigate('/dashboard', { replace: true });
          break;
      }
    }
  }, [user, userProfile, loading, navigate]);

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Cargando...</span>
        </div>
      </div>
    );
  }

  // Don't render login form if user is already authenticated 
  if (user && userProfile) {
    return null;
  }

  return (
    <>
      <Helmet>
        <title>Portal de Empleados - AsistenciaPro</title>
        <meta name="description" content="Portal de acceso seguro para empleados de construcción. Inicie sesión para acceder a su dashboard de asistencia y gestión de tiempo." />
        <meta name="keywords" content="login, empleados, construcción, asistencia, portal, seguridad" />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Main Content */}
        <div className="flex min-h-screen">
          {/* Left Sidebar - Safety Reminders */}
          <div className="hidden lg:flex lg:w-80 xl:w-96 bg-muted/30 p-6 overflow-y-auto">
            <SafetyReminders />
          </div>

          {/* Center Content - Login Form */}
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="w-full max-w-md">
              <LoginForm />
            </div>
          </div>

          {/* Right Sidebar - System Status */}
          <div className="hidden lg:flex lg:w-80 xl:w-96 bg-muted/30 p-6 overflow-y-auto">
            <SystemStatus />
          </div>
        </div>

        {/* Mobile Bottom Sections */}
        <div className="lg:hidden">
          {/* Mobile Safety Reminders */}
          <div className="bg-muted/30 p-6">
            <SafetyReminders />
          </div>

          {/* Mobile System Status */}
          <div className="bg-background p-6">
            <SystemStatus />
          </div>
        </div>
      </div>
    </>
  );
};

export default EmployeeLoginPortal;