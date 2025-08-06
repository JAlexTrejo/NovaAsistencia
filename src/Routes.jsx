import React from "react";
import { BrowserRouter, Routes as RouterRoutes, Route, Navigate } from "react-router-dom";
import ErrorBoundary from './components/ErrorBoundary';
import ScrollToTop from './components/ScrollToTop';
import { AuthProvider } from "./contexts/AuthContext";
import { useAuth } from "./contexts/AuthContext";

// Page imports
import NotFound from "./pages/NotFound";
import EmployeeLoginPortal from "./pages/employee-login-portal";
import EmployeeAttendanceDashboard from "./pages/employee-attendance-dashboard";
import AdministratorEmployeeManagementConsole from "./pages/administrator-employee-management-console";
import AttendanceHistoryAndAnalyticsDashboard from "./pages/attendance-history-and-analytics-dashboard";
import PayrollCalculationAndManagementInterface from "./pages/payroll-calculation-and-management-interface";
import ConstructionSiteAndSupervisorManagementHub from "./pages/construction-site-and-supervisor-management-hub";
import IncidentRegistrationAndManagementSystem from "./pages/incident-registration-and-management-system";
import ComprehensiveReportingAndExportCenter from "./pages/comprehensive-reporting-and-export-center";
import SystemAdministrationAndConfigurationPanel from "./pages/system-administration-and-configuration-panel";
import UserProfileManagementAndAuthenticationCenter from "./pages/user-profile-management-and-authentication-center";
import RoleBasedAccessControlManagementSystem from "./pages/role-based-access-control-management-system";
import ActivityLoggingAndSecurityMonitoringDashboard from "./pages/activity-logging-and-security-monitoring-dashboard";

// Route Protection Component
function ProtectedRoute({ children, requiredRole = null }) {
  const { user, userProfile, loading } = useAuth();

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

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user profile exists and is complete
  if (!userProfile) {
    return <Navigate to="/profile-center" replace />;
  }

  // Role-based access control
  if (requiredRole) {
    const userRole = userProfile?.role;
    const hasAccess = 
      userRole === requiredRole || 
      (requiredRole === 'admin' && ['admin', 'superadmin']?.includes(userRole)) ||
      (requiredRole === 'supervisor' && ['supervisor', 'admin', 'superadmin']?.includes(userRole)) ||
      userRole === 'superadmin'; // SuperAdmin has access to everything

    if (!hasAccess) {
      // Redirect to appropriate default page based on user role
      switch (userRole) {
        case 'superadmin':
          return <Navigate to="/admin/system" replace />;
        case 'admin':
          return <Navigate to="/admin/employees" replace />;
        case 'supervisor':
          return <Navigate to="/supervisor/sites" replace />;
        default:
          return <Navigate to="/dashboard" replace />;
      }
    }
  }

  return children;
}

// Main routing component
function AppRoutes() {
  return (
    <RouterRoutes>
      {/* Public Routes */}
      <Route path="/login" element={<EmployeeLoginPortal />} />
      
      {/* Profile Management - Accessible to all authenticated users */}
      <Route 
        path="/profile-center" 
        element={
          <ProtectedRoute>
            <UserProfileManagementAndAuthenticationCenter />
          </ProtectedRoute>
        } 
      />
      
      {/* Employee Routes - Basic user access */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <EmployeeAttendanceDashboard />
          </ProtectedRoute>
        } 
      />
      
      {/* Supervisor Routes */}
      <Route 
        path="/supervisor/sites" 
        element={
          <ProtectedRoute requiredRole="supervisor">
            <ConstructionSiteAndSupervisorManagementHub />
          </ProtectedRoute>
        } 
      />
      
      {/* Administrator Routes */}
      <Route 
        path="/admin/employees" 
        element={
          <ProtectedRoute requiredRole="admin">
            <AdministratorEmployeeManagementConsole />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/admin/attendance" 
        element={
          <ProtectedRoute requiredRole="admin">
            <AttendanceHistoryAndAnalyticsDashboard />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/admin/payroll" 
        element={
          <ProtectedRoute requiredRole="admin">
            <PayrollCalculationAndManagementInterface />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/admin/incidents" 
        element={
          <ProtectedRoute requiredRole="admin">
            <IncidentRegistrationAndManagementSystem />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/admin/reports" 
        element={
          <ProtectedRoute requiredRole="admin">
            <ComprehensiveReportingAndExportCenter />
          </ProtectedRoute>
        } 
      />

      {/* Activity Logging - Admin and SuperAdmin access */}
      <Route 
        path="/activity-logging-and-security-monitoring-dashboard" 
        element={
          <ProtectedRoute requiredRole="admin">
            <ActivityLoggingAndSecurityMonitoringDashboard />
          </ProtectedRoute>
        } 
      />
      
      {/* SuperAdmin Routes */}
      <Route 
        path="/admin/system" 
        element={
          <ProtectedRoute requiredRole="superadmin">
            <SystemAdministrationAndConfigurationPanel />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/admin/roles" 
        element={
          <ProtectedRoute requiredRole="superadmin">
            <RoleBasedAccessControlManagementSystem />
          </ProtectedRoute>
        } 
      />
      
      {/* Default Redirects */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      
      {/* 404 Route */}
      <Route path="*" element={<NotFound />} />
    </RouterRoutes>
  );
}

export default function Routes() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <ScrollToTop />
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ErrorBoundary>
    </BrowserRouter>
  );
}