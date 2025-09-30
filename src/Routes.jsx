// src/Routes.jsx
import React, { Suspense } from "react";
import {
  BrowserRouter,
  Routes as RouterRoutes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";
import ScrollToTop from "./components/ScrollToTop";
import { useAuth } from "./contexts/AuthContext";

// Page imports
import NotFound from "./pages/NotFound";
import LandingPage from "./pages/landing-page";
import EmployeeLoginPortal from "./pages/employee-login-portal";
import EmployeeAttendanceDashboard from "./pages/employee-attendance-dashboard";
import AdministratorEmployeeManagementConsole from "./pages/administrator-employee-management-console";
import AttendanceHistoryAndAnalyticsDashboard from "./pages/attendance-history-and-analytics-dashboard";
import PayrollCalculationAndManagementInterface from "./pages/payroll-calculation-and-management-interface";
import EnhancedEmployeePayrollManagementWithDetailedCalculations from "./pages/enhanced-employee-payroll-management-with-detailed-calculations";
import ConstructionSiteAndSupervisorManagementHub from "./pages/construction-site-and-supervisor-management-hub";
import IncidentRegistrationAndManagementSystem from "./pages/incident-registration-and-management-system";
import ComprehensiveReportingAndExportCenter from "./pages/comprehensive-reporting-and-export-center";
import SystemAdministrationAndConfigurationPanel from "./pages/system-administration-and-configuration-panel";
import UserProfileManagementAndAuthenticationCenter from "./pages/user-profile-management-and-authentication-center";
import RoleBasedAccessControlManagementSystem from "./pages/role-based-access-control-management-system";
import ActivityLoggingAndSecurityMonitoringDashboard from "./pages/activity-logging-and-security-monitoring-dashboard";
import EnhancedEmployeeManagementConsoleWithDeletionControls from "./pages/enhanced-employee-management-console-with-deletion-controls";
import RealTimePayrollEstimationDashboardWithZeroStateHandling from "./pages/real-time-payroll-estimation-dashboard-with-zero-state-handling";
import AdvancedPayrollCalculationEngineWithComprehensiveWageManagement from "./pages/advanced-payroll-calculation-engine-with-comprehensive-wage-management";
import RoleBasedPermissionEnforcementAndSecurityManagementSystem from "./pages/role-based-permission-enforcement-and-security-management-system";
import PersonalizedWorkerDashboardWithSiteIntegrationAndTeamCollaboration from "./pages/personalized-worker-dashboard-with-site-integration-and-team-collaboration";
import ProductionDeploymentAndInfrastructureManagement from "./pages/production-deployment-and-infrastructure-management";
import ProductionDatabaseSchemaManagementConsole from "./pages/production-database-schema-management-console";
import FrontendArchitectureAndCodeQualityDashboard from "./pages/frontend-architecture-and-code-quality-dashboard";
import ObrasFinancialControlManagement from "./pages/obras-financial-control-management";

// New page imports
import ProductionAuthenticationManagementSystem from "./pages/production-authentication-management-system";
import ComprehensiveEmployeeRegistrationAndProfileManagement from "./pages/comprehensive-employee-registration-and-profile-management";
import ProductionEnvironmentConfigurationDashboard from "./pages/production-environment-configuration-dashboard";
import EnterpriseCodeQualityAndTestingCenter from "./pages/enterprise-code-quality-and-testing-center";

// Production Hardening Pages
import ProductionDataServicesAndErrorHandlingManagementConsole from "./pages/production-data-services-and-error-handling-management-console";
import EnterpriseSecurityAndRbacImplementationCenter from "./pages/enterprise-security-and-rbac-implementation-center";

// NEW IMPORT - Performance Optimization and Production Deployment Center
import PerformanceOptimizationAndProductionDeploymentCenter from "./pages/performance-optimization-and-production-deployment-center";

// Password reset page — RUTA EXACTA A TU ARCHIVO
import AuthReset from "./auth/Reset.jsx";

// --- ProtectedRoute con soporte de `next` ---
function ProtectedRoute({ children, requiredRole = null }) {
  const { user, userProfile, loading } = useAuth();
  const location = useLocation();

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
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }

  if (!userProfile) {
    return <Navigate to="/profile-center" replace />;
  }

  if (requiredRole) {
    const userRole = userProfile?.role;
    const hasAccess =
      userRole === requiredRole ||
      (requiredRole === "admin" && ["admin", "superadmin"].includes(userRole)) ||
      (requiredRole === "supervisor" && ["supervisor", "admin", "superadmin"].includes(userRole)) ||
      userRole === "superadmin";

    if (!hasAccess) {
      switch (userRole) {
        case "superadmin":
          return <Navigate to="/admin/system" replace />;
        case "admin":
          return <Navigate to="/admin/employees" replace />;
        case "supervisor":
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
    <Suspense fallback={<div className="p-6">Cargando…</div>}>
      <RouterRoutes>
        {/* Public Routes */}
        <Route path="/login" element={<EmployeeLoginPortal />} />
        <Route path="/employee-login-portal" element={<EmployeeLoginPortal />} />

        {/* Password reset callback (Supabase) */}
        <Route path="/auth/reset" element={<AuthReset />} />

        {/* Profile Management - Accessible to all authenticated users */}
        <Route
          path="/profile-center"
          element={
            <ProtectedRoute>
              <UserProfileManagementAndAuthenticationCenter />
            </ProtectedRoute>
          }
        />

        {/* Employee Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <EmployeeAttendanceDashboard />
            </ProtectedRoute>
          }
        />

        {/* Personalized Worker Dashboard */}
        <Route
          path="/personalized-worker-dashboard-with-site-integration-and-team-collaboration"
          element={
            <ProtectedRoute requiredRole="user">
              <PersonalizedWorkerDashboardWithSiteIntegrationAndTeamCollaboration />
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

        {/* Enhanced Employee Management with Deletion Controls */}
        <Route
          path="/enhanced-employee-management-console-with-deletion-controls"
          element={
            <ProtectedRoute requiredRole="admin">
              <EnhancedEmployeeManagementConsoleWithDeletionControls />
            </ProtectedRoute>
          }
        />

        {/* Real-Time Payroll Estimation Dashboard */}
        <Route
          path="/real-time-payroll-estimation-dashboard-with-zero-state-handling"
          element={
            <ProtectedRoute requiredRole="admin">
              <RealTimePayrollEstimationDashboardWithZeroStateHandling />
            </ProtectedRoute>
          }
        />

        {/* Enhanced Employee Payroll Management */}
        <Route
          path="/enhanced-employee-payroll-management-with-detailed-calculations"
          element={
            <ProtectedRoute requiredRole="admin">
              <EnhancedEmployeePayrollManagementWithDetailedCalculations />
            </ProtectedRoute>
          }
        />

        {/* Advanced Payroll Calculation Engine */}
        <Route
          path="/advanced-payroll-calculation-engine-with-comprehensive-wage-management"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdvancedPayrollCalculationEngineWithComprehensiveWageManagement />
            </ProtectedRoute>
          }
        />

        {/* Role-Based Permission Enforcement System */}
        <Route
          path="/role-based-permission-enforcement-and-security-management-system"
          element={
            <ProtectedRoute requiredRole="superadmin">
              <RoleBasedPermissionEnforcementAndSecurityManagementSystem />
            </ProtectedRoute>
          }
        />

        {/* Obras Financial Control Management */}
        <Route
          path="/admin/obras-financiero"
          element={
            <ProtectedRoute requiredRole="admin">
              <ObrasFinancialControlManagement />
            </ProtectedRoute>
          }
        />

        {/* Production Deployment and Infrastructure Management */}
        <Route
          path="/production-deployment-and-infrastructure-management"
          element={
            <ProtectedRoute requiredRole="superadmin">
              <ProductionDeploymentAndInfrastructureManagement />
            </ProtectedRoute>
          }
        />

        {/* Performance Optimization and Production Deployment Center */}
        <Route
          path="/performance-optimization-and-production-deployment-center"
          element={
            <ProtectedRoute requiredRole="superadmin">
              <PerformanceOptimizationAndProductionDeploymentCenter />
            </ProtectedRoute>
          }
        />

        {/* Production Authentication and Employee Registration */}
        <Route
          path="/production-authentication-management-system"
          element={
            <ProtectedRoute requiredRole="admin">
              <ProductionAuthenticationManagementSystem />
            </ProtectedRoute>
          }
        />
        <Route
          path="/comprehensive-employee-registration-and-profile-management"
          element={
            <ProtectedRoute requiredRole="admin">
              <ComprehensiveEmployeeRegistrationAndProfileManagement />
            </ProtectedRoute>
          }
        />

        {/* Production Database and Code Quality Management */}
        <Route
          path="/production-database-schema-management-console"
          element={
            <ProtectedRoute requiredRole="superadmin">
              <ProductionDatabaseSchemaManagementConsole />
            </ProtectedRoute>
          }
        />
        <Route
          path="/frontend-architecture-and-code-quality-dashboard"
          element={
            <ProtectedRoute requiredRole="admin">
              <FrontendArchitectureAndCodeQualityDashboard />
            </ProtectedRoute>
          }
        />

        {/* Production Environment and Code Quality */}
        <Route
          path="/production-environment-configuration-dashboard"
          element={
            <ProtectedRoute requiredRole="superadmin">
              <ProductionEnvironmentConfigurationDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/enterprise-code-quality-and-testing-center"
          element={
            <ProtectedRoute requiredRole="admin">
              <EnterpriseCodeQualityAndTestingCenter />
            </ProtectedRoute>
          }
        />

        {/* Production Hardening */}
        <Route
          path="/production-data-services-and-error-handling-management-console"
          element={
            <ProtectedRoute requiredRole="superadmin">
              <ProductionDataServicesAndErrorHandlingManagementConsole />
            </ProtectedRoute>
          }
        />
        <Route
          path="/enterprise-security-and-rbac-implementation-center"
          element={
            <ProtectedRoute requiredRole="superadmin">
              <EnterpriseSecurityAndRbacImplementationCenter />
            </ProtectedRoute>
          }
        />

        {/* Admin */}
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

        {/* SuperAdmin */}
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

        {/* Landing Page */}
        <Route path="/" element={<LandingPage />} />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </RouterRoutes>
    </Suspense>
  );
}

export default function Routes() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <ScrollToTop />
        <AppRoutes />
      </ErrorBoundary>
    </BrowserRouter>
  );
}
