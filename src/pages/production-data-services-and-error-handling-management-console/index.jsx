import React, { useState, useEffect, useCallback } from 'react';
import { Database, Activity, TrendingUp, AlertTriangle, RefreshCw, CheckCircle, XCircle, Clock, BarChart3, Server } from 'lucide-react';

// Import existing components
import { useBranding } from '@/hooks/useBranding';
import BrandedHeader from '@/components/ui/BrandedHeader';
import Loading from '@/components/ui/Loading';
import ErrorState from '@/components/ui/ErrorState';
import Button from '@/components/ui/Button';

// Import services for monitoring
import { authService } from '@/services/authService';
import { employeeService } from '@/services/employeeService';
import { attendanceService } from '@/services/attendanceService';
import { payrollService } from '@/services/payrollService';
import { incidentService } from '@/services/incidentService';
import { constructionSiteService } from '@/services/constructionSiteService';

const ProductionDataServicesManagementConsole = () => {
  const { branding, loading: brandingLoading } = useBranding();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);

  // State for service monitoring
  const [serviceHealth, setServiceHealth] = useState({});
  const [errorLogs, setErrorLogs] = useState([]);
  const [performanceMetrics, setPerformanceMetrics] = useState({});
  const [connectionStatus, setConnectionStatus] = useState({});
  const [mockDataStatus, setMockDataStatus] = useState({});

  // Real-time monitoring intervals
  const [monitoringInterval, setMonitoringInterval] = useState(null);

  // Service health check function
  const checkServiceHealth = useCallback(async () => {
    const services = [
      { name: 'Authentication', service: authService, method: 'testConnection' },
      { name: 'Employees', service: employeeService, method: 'listEmployees' },
      { name: 'Attendance', service: attendanceService, method: 'getTodayAttendance' },
      { name: 'Payroll', service: payrollService, method: 'getPayrollSummary' },
      { name: 'Incidents', service: incidentService, method: 'listIncidents' },
      { name: 'Sites', service: constructionSiteService, method: 'listSites' }
    ];

    const healthStatus = {};
    const metrics = {};
    const connections = {};

    for (const { name, service, method } of services) {
      const startTime = Date.now();
      try {
        let result;
        if (method === 'testConnection') {
          result = await service?.[method]();
        } else if (method === 'listEmployees') {
          result = await service?.[method]({ page: 1, pageSize: 1 });
        } else if (method === 'getTodayAttendance') {
          result = await service?.[method]('test-id');
        } else if (method === 'getPayrollSummary') {
          result = await service?.[method]({ startDate: new Date(), endDate: new Date() });
        } else if (method === 'listIncidents') {
          result = await service?.[method]({ page: 1, pageSize: 1 });
        } else if (method === 'listSites') {
          result = await service?.[method]({ activeOnly: true });
        }

        const responseTime = Date.now() - startTime;
        
        healthStatus[name] = {
          status: result?.ok ? 'healthy' : 'error',
          responseTime,
          error: result?.error || null,
          lastCheck: new Date()?.toISOString()
        };

        metrics[name] = {
          responseTime,
          successRate: result?.ok ? 100 : 0,
          errorCount: result?.ok ? 0 : 1
        };

        connections[name] = {
          connected: !!result?.ok,
          latency: responseTime
        };

      } catch (err) {
        const responseTime = Date.now() - startTime;
        
        healthStatus[name] = {
          status: 'critical',
          responseTime,
          error: err?.message || 'Service unavailable',
          lastCheck: new Date()?.toISOString()
        };

        metrics[name] = {
          responseTime,
          successRate: 0,
          errorCount: 1
        };

        connections[name] = {
          connected: false,
          latency: responseTime
        };
      }
    }

    setServiceHealth(healthStatus);
    setPerformanceMetrics(metrics);
    setConnectionStatus(connections);
  }, []);

  // Mock data detection function
  const checkMockDataStatus = useCallback(async () => {
    const mockPatterns = [
      'MOCK', 'FAKE', 'DUMMY', 'TODO', 'static.rocket.new', 
      'rocket.new', 'localhost', 'test-data', 'sample-data'
    ];

    const mockStatus = {
      detected: false,
      locations: [],
      severity: 'low',
      recommendations: []
    };

    // In a real implementation, this would scan service responses for mock data patterns
    // For now, we'll simulate the check
    try {
      const employeeResult = await employeeService?.listEmployees({ page: 1, pageSize: 10 });
      if (employeeResult?.ok && employeeResult?.data) {
        const employees = employeeResult?.data;
        const mockEmployees = employees?.filter(emp => 
          mockPatterns?.some(pattern => 
            JSON.stringify(emp)?.toLowerCase()?.includes(pattern?.toLowerCase())
          )
        );
        
        if (mockEmployees?.length > 0) {
          mockStatus.detected = true;
          mockStatus?.locations?.push('Employees Service');
          mockStatus.severity = 'high';
          mockStatus?.recommendations?.push('Remove mock employee data from production');
        }
      }

      setMockDataStatus(mockStatus);
    } catch (err) {
      console.warn('Mock data check failed:', err?.message);
    }
  }, []);

  // Initialize monitoring
  useEffect(() => {
    const initializeMonitoring = async () => {
      setLoading(true);
      try {
        await Promise.all([
          checkServiceHealth(),
          checkMockDataStatus()
        ]);
      } catch (err) {
        setError(err?.message || 'Failed to initialize monitoring');
      } finally {
        setLoading(false);
      }
    };

    initializeMonitoring();

    // Set up real-time monitoring
    const interval = setInterval(() => {
      checkServiceHealth();
      checkMockDataStatus();
    }, 30000); // Every 30 seconds

    setMonitoringInterval(interval);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [checkServiceHealth, checkMockDataStatus]);

  // Manual refresh function
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        checkServiceHealth(),
        checkMockDataStatus()
      ]);
    } catch (err) {
      setError(err?.message || 'Refresh failed');
    } finally {
      setRefreshing(false);
    }
  };

  // Service overview component
  const ServiceOverview = () => {
    const totalServices = Object.keys(serviceHealth)?.length;
    const healthyServices = Object.values(serviceHealth)?.filter(s => s?.status === 'healthy')?.length;
    const errorServices = Object.values(serviceHealth)?.filter(s => s?.status === 'error')?.length;
    const criticalServices = Object.values(serviceHealth)?.filter(s => s?.status === 'critical')?.length;

    return (
      <div className="space-y-6">
        {/* Health Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Services</p>
                <p className="text-2xl font-bold text-gray-900">{totalServices}</p>
              </div>
              <Server className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Healthy</p>
                <p className="text-2xl font-bold text-green-600">{healthyServices}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Errors</p>
                <p className="text-2xl font-bold text-yellow-600">{errorServices}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Critical</p>
                <p className="text-2xl font-bold text-red-600">{criticalServices}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </div>
        </div>

        {/* Service Status List */}
        <div className="bg-white rounded-lg border">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Service Status</h3>
          </div>
          <div className="divide-y">
            {Object.entries(serviceHealth)?.map(([serviceName, health]) => (
              <div key={serviceName} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`h-3 w-3 rounded-full ${
                    health?.status === 'healthy' ? 'bg-green-500' :
                    health?.status === 'error' ? 'bg-yellow-500' : 'bg-red-500'
                  }`} />
                  <div>
                    <p className="font-medium text-gray-900">{serviceName}</p>
                    <p className="text-sm text-gray-500">
                      Response: {health?.responseTime}ms
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-medium ${
                    health?.status === 'healthy' ? 'text-green-600' :
                    health?.status === 'error' ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {health?.status?.toUpperCase()}
                  </p>
                  {health?.error && (
                    <p className="text-xs text-gray-500 max-w-xs truncate">
                      {health?.error}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Error tracking component
  const ErrorTracking = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Error Monitoring</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-red-50 rounded-lg p-4">
              <div className="flex items-center">
                <XCircle className="h-8 w-8 text-red-600 mr-3" />
                <div>
                  <p className="text-sm text-red-600 font-medium">Critical Errors</p>
                  <p className="text-2xl font-bold text-red-900">
                    {Object.values(serviceHealth)?.filter(s => s?.status === 'critical')?.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-yellow-600 mr-3" />
                <div>
                  <p className="text-sm text-yellow-600 font-medium">Warnings</p>
                  <p className="text-2xl font-bold text-yellow-900">
                    {Object.values(serviceHealth)?.filter(s => s?.status === 'error')?.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm text-blue-600 font-medium">Avg Response</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {Object.values(serviceHealth)?.length ? 
                      Math.round(Object.values(serviceHealth)?.reduce((sum, s) => sum + (s?.responseTime || 0), 0) / Object.values(serviceHealth)?.length) 
                      : 0}ms
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Mock Data Status */}
          {mockDataStatus?.detected && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center mb-2">
                <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                <h4 className="text-red-800 font-medium">Mock Data Detected</h4>
              </div>
              <p className="text-red-700 text-sm mb-2">
                Production environment contains mock data that should be removed.
              </p>
              <div className="space-y-1">
                {mockDataStatus?.locations?.map((location, index) => (
                  <p key={index} className="text-red-600 text-xs">• {location}</p>
                ))}
              </div>
            </div>
          )}

          {/* Service Errors */}
          <div className="space-y-3">
            {Object.entries(serviceHealth)?.filter(([_, health]) => health?.error)?.map(([serviceName, health]) => (
              <div key={serviceName} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{serviceName} Service</h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    health?.status === 'critical' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {health?.status?.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-gray-700 mb-1">{health?.error}</p>
                <p className="text-xs text-gray-500">
                  Last checked: {new Date(health?.lastCheck)?.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // Performance monitoring component
  const PerformanceMonitoring = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Performance Metrics</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(performanceMetrics)?.map(([serviceName, metrics]) => (
              <div key={serviceName} className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">{serviceName}</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Response Time</span>
                    <span className="text-sm font-medium">{metrics?.responseTime}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Success Rate</span>
                    <span className="text-sm font-medium">{metrics?.successRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Error Count</span>
                    <span className="text-sm font-medium">{metrics?.errorCount}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  if (brandingLoading || loading) {
    return <Loading />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => window.location?.reload()} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <BrandedHeader 
        title="Production Data Services Management Console"
        subtitle="Enterprise-grade data layer architecture with standardized service patterns and robust error handling"
        icon={<Database className="h-8 w-8" />}
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
            <span>Auto-refresh: 30s</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', label: 'Service Overview', icon: Activity },
              { id: 'errors', label: 'Error Tracking', icon: AlertTriangle },
              { id: 'performance', label: 'Performance', icon: BarChart3 }
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
          {activeTab === 'overview' && <ServiceOverview />}
          {activeTab === 'errors' && <ErrorTracking />}
          {activeTab === 'performance' && <PerformanceMonitoring />}
        </div>
      </div>
    </div>
  );
};

export default ProductionDataServicesManagementConsole;