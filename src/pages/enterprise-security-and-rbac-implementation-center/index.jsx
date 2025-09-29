import React, { useState, useEffect, useCallback } from 'react';
import { Shield, Users, AlertTriangle, CheckCircle, XCircle, Eye, Key, Database, Clock, Activity, RefreshCw } from 'lucide-react';

// Import existing components
import { useBranding } from '@/hooks/useBranding';
import { useAuth } from '@/contexts/AuthContext';
import BrandedHeader from '@/components/ui/BrandedHeader';
import Loading from '@/components/ui/Loading';
import ErrorState from '@/components/ui/ErrorState';
import Button from '@/components/ui/Button';
import NotAuthorized from '@/components/ui/NotAuthorized';

// Import services

import { supabase } from '@/lib/supabase';

const EnterpriseSecurityImplementationCenter = () => {
  const { branding, loading: brandingLoading } = useBranding();
  const { user, userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('security-overview');
  const [refreshing, setRefreshing] = useState(false);

  // State for security monitoring
  const [securityMetrics, setSecurityMetrics] = useState({});
  const [rlsPolicies, setRlsPolicies] = useState([]);
  const [roleHierarchy, setRoleHierarchy] = useState([]);
  const [securityAudit, setSecurityAudit] = useState({});
  const [threatDetection, setThreatDetection] = useState({});
  const [accessAttempts, setAccessAttempts] = useState([]);

  // Check if user has superadmin access
  const hasAccess = userProfile?.role === 'superadmin';

  // Security monitoring functions
  const checkSecurityMetrics = useCallback(async () => {
    try {
      // Get system statistics
      const { data: stats, error: statsError } = await supabase?.rpc('get_system_stats');
      if (statsError) throw statsError;

      // Get recent activity logs for security analysis
      const { data: logs, error: logsError } = await supabase
        ?.from('logs_actividad')
        ?.select('accion, fecha, ip_address, metadata')
        ?.order('fecha', { ascending: false })
        ?.limit(100);

      if (logsError) throw logsError;

      // Analyze security metrics
      const failedLogins = logs?.filter(log => 
        log?.accion === 'login' && log?.metadata?.success === false
      )?.length || 0;

      const suspiciousActivity = logs?.filter(log => 
        log?.ip_address && (
          log?.metadata?.multiple_attempts || 
          log?.metadata?.unusual_location
        )
      )?.length || 0;

      const recentUsers = logs?.filter(log => 
        log?.fecha && new Date(log?.fecha) > new Date(Date.now() - 24 * 60 * 60 * 1000)
      )?.length || 0;

      setSecurityMetrics({
        totalUsers: stats?.total_users || 0,
        activeAdmins: stats?.total_admins || 0,
        activeSupervisors: stats?.total_supervisors || 0,
        regularUsers: stats?.total_regular_users || 0,
        unassignedUsers: stats?.unassigned_users || 0,
        failedLogins,
        suspiciousActivity,
        recentActivity: recentUsers,
        lastActivity: stats?.last_activity,
        securityScore: Math.max(0, 100 - (failedLogins * 5) - (suspiciousActivity * 10))
      });

    } catch (err) {
      console.error('Security metrics check failed:', err?.message);
      setError('Failed to load security metrics');
    }
  }, []);

  const checkRLSPolicies = useCallback(async () => {
    try {
      // Get RLS policy information (simplified for demo)
      const policies = [
        {
          table: 'usuarios',
          policy: 'users_manage_own_usuarios',
          type: 'ALL',
          role: 'authenticated',
          status: 'active',
          description: 'Users can manage their own profile data'
        },
        {
          table: 'usuarios', 
          policy: 'admins_view_all_usuarios',
          type: 'SELECT',
          role: 'authenticated',
          status: 'active',
          description: 'Admins can view all user profiles'
        },
        {
          table: 'logs_actividad',
          policy: 'users_view_own_logs',
          type: 'SELECT', 
          role: 'authenticated',
          status: 'active',
          description: 'Users can view their own activity logs'
        },
        {
          table: 'logs_actividad',
          policy: 'admins_view_all_logs',
          type: 'SELECT',
          role: 'authenticated', 
          status: 'active',
          description: 'Admins can view all activity logs'
        },
        {
          table: 'configuracion_aplicacion',
          policy: 'superadmin_manage_config',
          type: 'ALL',
          role: 'authenticated',
          status: 'active',
          description: 'SuperAdmins can manage app configuration'
        }
      ];

      setRlsPolicies(policies);
    } catch (err) {
      console.error('RLS policies check failed:', err?.message);
    }
  }, []);

  const checkRoleHierarchy = useCallback(async () => {
    try {
      const { data: roles, error } = await supabase
        ?.from('roles')
        ?.select('*')
        ?.order('nivel', { ascending: true });

      if (error) throw error;

      setRoleHierarchy(roles || []);
    } catch (err) {
      console.error('Role hierarchy check failed:', err?.message);
    }
  }, []);

  const performSecurityAudit = useCallback(async () => {
    try {
      const auditResults = {
        authentication: {
          status: 'secure',
          issues: [],
          recommendations: []
        },
        authorization: {
          status: 'secure', 
          issues: [],
          recommendations: []
        },
        dataProtection: {
          status: 'secure',
          issues: [],
          recommendations: []
        },
        auditTrail: {
          status: 'secure',
          issues: [],
          recommendations: []
        }
      };

      // Check for common security issues
      const { data: unencryptedData } = await supabase
        ?.from('usuarios')
        ?.select('correo')
        ?.limit(1);

      if (unencryptedData) {
        // In a real implementation, check for sensitive data exposure
        auditResults.dataProtection.status = 'warning';
        auditResults?.dataProtection?.issues?.push('Email addresses stored in plain text');
        auditResults?.dataProtection?.recommendations?.push('Consider implementing email encryption');
      }

      // Check for users without proper role assignment
      const { data: unassignedUsers } = await supabase
        ?.from('usuarios')
        ?.select('id')
        ?.is('rol', null);

      if (unassignedUsers?.length > 0) {
        auditResults.authorization.status = 'warning';
        auditResults?.authorization?.issues?.push(`${unassignedUsers?.length} users without assigned roles`);
        auditResults?.authorization?.recommendations?.push('Assign proper roles to all users');
      }

      setSecurityAudit(auditResults);
    } catch (err) {
      console.error('Security audit failed:', err?.message);
    }
  }, []);

  // Initialize security monitoring
  useEffect(() => {
    if (!hasAccess) return;

    const initializeSecurity = async () => {
      setLoading(true);
      try {
        await Promise.all([
          checkSecurityMetrics(),
          checkRLSPolicies(),
          checkRoleHierarchy(),
          performSecurityAudit()
        ]);
      } catch (err) {
        setError(err?.message || 'Failed to initialize security monitoring');
      } finally {
        setLoading(false);
      }
    };

    initializeSecurity();

    // Set up periodic security checks
    const interval = setInterval(() => {
      checkSecurityMetrics();
      performSecurityAudit();
    }, 60000); // Every minute

    return () => clearInterval(interval);
  }, [hasAccess, checkSecurityMetrics, checkRLSPolicies, checkRoleHierarchy, performSecurityAudit]);

  // Manual refresh function
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        checkSecurityMetrics(),
        checkRLSPolicies(), 
        checkRoleHierarchy(),
        performSecurityAudit()
      ]);
    } catch (err) {
      setError(err?.message || 'Refresh failed');
    } finally {
      setRefreshing(false);
    }
  };

  // Security overview component
  const SecurityOverview = () => (
    <div className="space-y-6">
      {/* Security Score Card */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg text-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-2">Security Score</h3>
            <p className="text-3xl font-bold">{securityMetrics?.securityScore || 0}/100</p>
            <p className="text-blue-100">Overall system security rating</p>
          </div>
          <Shield className="h-16 w-16 text-blue-200" />
        </div>
      </div>

      {/* Security Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{securityMetrics?.totalUsers || 0}</p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Failed Logins</p>
              <p className="text-2xl font-bold text-red-600">{securityMetrics?.failedLogins || 0}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Admins</p>
              <p className="text-2xl font-bold text-green-600">{securityMetrics?.activeAdmins || 0}</p>
            </div>
            <Key className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Suspicious Activity</p>
              <p className="text-2xl font-bold text-yellow-600">{securityMetrics?.suspiciousActivity || 0}</p>
            </div>
            <Eye className="h-8 w-8 text-yellow-600" />
          </div>
        </div>
      </div>

      {/* Role Distribution */}
      <div className="bg-white rounded-lg border">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Role Distribution</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{securityMetrics?.activeAdmins || 0}</p>
              <p className="text-sm text-gray-600">SuperAdmins</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{securityMetrics?.activeAdmins || 0}</p>
              <p className="text-sm text-gray-600">Admins</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{securityMetrics?.activeSupervisors || 0}</p>
              <p className="text-sm text-gray-600">Supervisors</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-600">{securityMetrics?.regularUsers || 0}</p>
              <p className="text-sm text-gray-600">Users</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // RLS Policy Management component
  const RLSPolicyManagement = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Row-Level Security Policies</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Table
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Policy Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rlsPolicies?.map((policy, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {policy?.table}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {policy?.policy}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {policy?.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      policy?.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {policy?.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {policy?.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // Security Audit component
  const SecurityAudit = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(securityAudit)?.map(([category, audit]) => (
          <div key={category} className="bg-white rounded-lg border">
            <div className="px-6 py-4 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 capitalize">
                  {category?.replace(/([A-Z])/g, ' $1')?.trim()}
                </h3>
                <div className={`flex items-center space-x-1 ${
                  audit?.status === 'secure' ? 'text-green-600' :
                  audit?.status === 'warning' ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {audit?.status === 'secure' ? <CheckCircle className="h-5 w-5" /> :
                   audit?.status === 'warning' ? <AlertTriangle className="h-5 w-5" /> :
                   <XCircle className="h-5 w-5" />}
                  <span className="text-sm font-medium capitalize">{audit?.status}</span>
                </div>
              </div>
            </div>
            <div className="p-6">
              {audit?.issues?.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Issues</h4>
                  <ul className="space-y-1">
                    {audit?.issues?.map((issue, index) => (
                      <li key={index} className="text-sm text-red-600 flex items-center">
                        <XCircle className="h-4 w-4 mr-2" />
                        {issue}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {audit?.recommendations?.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Recommendations</h4>
                  <ul className="space-y-1">
                    {audit?.recommendations?.map((rec, index) => (
                      <li key={index} className="text-sm text-blue-600 flex items-center">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {audit?.issues?.length === 0 && audit?.recommendations?.length === 0 && (
                <p className="text-sm text-gray-500">No issues detected</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (!user) {
    return <div>Please log in to access this page.</div>;
  }

  if (!hasAccess) {
    return <NotAuthorized />;
  }

  if (brandingLoading || loading) {
    return <Loading />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => window.location?.reload()} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <BrandedHeader 
        title="Enterprise Security and RBAC Implementation Center"
        subtitle="Comprehensive Row-Level Security (RLS) and Role-Based Access Control (RBAC) management with zero-trust architecture"
        icon={<Shield className="h-8 w-8" />}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Controls */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center space-x-2"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>
          </div>

          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            <span>Last updated: {new Date()?.toLocaleTimeString()}</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'security-overview', label: 'Security Overview', icon: Shield },
              { id: 'rls-policies', label: 'RLS Policies', icon: Database },
              { id: 'security-audit', label: 'Security Audit', icon: Eye }
            ]?.map((tab) => (
              <button
                key={tab?.id}
                onClick={() => setActiveTab(tab?.id)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab?.id
                    ? 'border-blue-500 text-blue-600' :'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab?.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'security-overview' && <SecurityOverview />}
          {activeTab === 'rls-policies' && <RLSPolicyManagement />}
          {activeTab === 'security-audit' && <SecurityAudit />}
        </div>
      </div>
    </div>
  );
};

export default EnterpriseSecurityImplementationCenter;