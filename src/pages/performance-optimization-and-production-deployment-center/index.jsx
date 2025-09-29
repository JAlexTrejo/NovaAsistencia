import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Server, Container, Activity, Shield, AlertTriangle, Settings, Monitor, RefreshCw, GitBranch, Zap, Globe, Gauge, CheckCircle, XCircle, RotateCcw, Upload } from 'lucide-react';
import { qualityService } from '../../services/qualityService';



// Import components
import DeploymentPipelineControls from './components/DeploymentPipelineControls';
import PerformanceMetricsDashboard from './components/PerformanceMetricsDashboard';
import DockerContainerStatus from './components/DockerContainerStatus';
import NginxConfigurationStatus from './components/NginxConfigurationStatus';
import SecurityHeadersValidation from './components/SecurityHeadersValidation';
import FeatureFlagManagement from './components/FeatureFlagManagement';
import StagingEnvironmentControls from './components/StagingEnvironmentControls';
import RealtimeStabilityMonitor from './components/RealtimeStabilityMonitor';
import VirtualizationControls from './components/VirtualizationControls';
import Icon from '@/components/AppIcon';


const PerformanceOptimizationAndProductionDeploymentCenter = () => {
  const { user, userProfile, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('pipeline');
  const [performanceData, setPerformanceData] = useState(null);
  const [deploymentStats, setDeploymentStats] = useState({
    environment: 'staging',
    lastDeploy: null,
    buildStatus: 'idle',
    containers: { active: 0, total: 0 },
    performance: { score: 0, issues: 0 },
    security: { score: 0, warnings: 0 },
    realtime: { connections: 0, status: 'idle' }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [alerts, setAlerts] = useState([]);

  // Load deployment and performance data
  const loadDeploymentData = useCallback(async () => {
    if (!user || !userProfile) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Load quality metrics
      const qualityRes = await qualityService();
      if (qualityRes?.ok) {
        setPerformanceData(qualityRes?.data);
      }

      // Mock deployment stats - in production this would come from actual deployment APIs
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      setDeploymentStats({
        environment: process.env?.NODE_ENV || 'development',
        lastDeploy: new Date(Date.now() - 1800000)?.toISOString(),
        buildStatus: 'success',
        containers: { active: 8, total: 12 },
        performance: { score: 91, issues: 3 },
        security: { score: 96, warnings: 2 },
        realtime: { connections: 45, status: 'active' }
      });

      // Generate performance alerts
      const performanceAlerts = [];
      
      if (performanceData?.performance?.bundleAnalysis?.duplicates) {
        const duplicateSize = parseInt(performanceData?.performance?.bundleAnalysis?.duplicates) || 0;
        if (duplicateSize > 30) {
          performanceAlerts?.push({
            id: 'bundle-duplicates',
            type: 'warning',
            severity: 'medium',
            title: 'Bundle Optimization',
            message: `${duplicateSize}KB of duplicate code detected in bundle`,
            timestamp: new Date()?.toISOString(),
            category: 'performance'
          });
        }
      }

      if (performanceData?.securityScan?.vulnerabilities?.high > 0) {
        performanceAlerts?.push({
          id: 'security-high',
          type: 'error',
          severity: 'high',
          title: 'Security Alert',
          message: `${performanceData?.securityScan?.vulnerabilities?.high} high severity vulnerabilities found`,
          timestamp: new Date()?.toISOString(),
          category: 'security'
        });
      }

      if (performanceData?.performance?.lighthouse?.performance < 90) {
        performanceAlerts?.push({
          id: 'lighthouse-performance',
          type: 'warning',
          severity: 'medium',
          title: 'Performance Score',
          message: `Lighthouse performance score is ${performanceData?.performance?.lighthouse?.performance}/100`,
          timestamp: new Date()?.toISOString(),
          category: 'performance'
        });
      }

      setAlerts(performanceAlerts);
      
    } catch (err) {
      setError('Failed to load deployment data: ' + (err?.message || 'Unknown error'));
      console.error('Deployment data loading error:', err);
    } finally {
      setLoading(false);
    }
  }, [user, userProfile, performanceData?.performance?.bundleAnalysis?.duplicates, performanceData?.securityScan?.vulnerabilities?.high, performanceData?.performance?.lighthouse?.performance]);

  useEffect(() => {
    loadDeploymentData();
  }, [loadDeploymentData]);

  // Tab configuration
  const tabs = useMemo(() => [
    { id: 'pipeline', name: 'Deployment Pipeline', icon: GitBranch },
    { id: 'performance', name: 'Performance Metrics', icon: Gauge },
    { id: 'docker', name: 'Container Status', icon: Container },
    { id: 'nginx', name: 'Nginx Config', icon: Server },
    { id: 'security', name: 'Security Validation', icon: Shield },
    { id: 'flags', name: 'Feature Flags', icon: Settings },
    { id: 'staging', name: 'Staging Control', icon: Globe },
    { id: 'realtime', name: 'Realtime Monitor', icon: Activity },
    { id: 'virtualization', name: 'Virtualization', icon: Monitor }
  ], []);

  // Quick action handlers
  const handleQuickAction = useCallback(async (action) => {
    try {
      switch (action) {
        case 'deploy-staging':
          setDeploymentStats(prev => ({ ...prev, buildStatus: 'building' }));
          await new Promise(resolve => setTimeout(resolve, 3000));
          setDeploymentStats(prev => ({ 
            ...prev, 
            buildStatus: 'success',
            lastDeploy: new Date()?.toISOString()
          }));
          break;
        case 'run-tests':
          setDeploymentStats(prev => ({ ...prev, buildStatus: 'testing' }));
          await new Promise(resolve => setTimeout(resolve, 2000));
          setDeploymentStats(prev => ({ ...prev, buildStatus: 'success' }));
          break;
        case 'restart-containers':
          setDeploymentStats(prev => ({ 
            ...prev, 
            containers: { ...prev?.containers, active: 0 }
          }));
          await new Promise(resolve => setTimeout(resolve, 2000));
          setDeploymentStats(prev => ({ 
            ...prev, 
            containers: { ...prev?.containers, active: prev?.containers?.total }
          }));
          break;
        case 'optimize-bundles':
          await loadDeploymentData();
          break;
        default:
          console.log(`Action ${action} not implemented`);
      }
    } catch (err) {
      setError(`Failed to execute ${action}: ${err?.message}`);
    }
  }, [loadDeploymentData]);

  // Render tab content
  const renderTabContent = () => {
    const commonProps = { 
      performanceData, 
      deploymentStats, 
      loading, 
      onRefresh: loadDeploymentData 
    };

    switch (activeTab) {
      case 'pipeline':
        return <DeploymentPipelineControls {...commonProps} onAction={handleQuickAction} />;
      case 'performance':
        return <PerformanceMetricsDashboard {...commonProps} />;
      case 'docker':
        return <DockerContainerStatus {...commonProps} />;
      case 'nginx':
        return <NginxConfigurationStatus {...commonProps} />;
      case 'security':
        return <SecurityHeadersValidation {...commonProps} />;
      case 'flags':
        return <FeatureFlagManagement {...commonProps} />;
      case 'staging':
        return <StagingEnvironmentControls {...commonProps} onAction={handleQuickAction} />;
      case 'realtime':
        return <RealtimeStabilityMonitor {...commonProps} />;
      case 'virtualization':
        return <VirtualizationControls {...commonProps} />;
      default:
        return <DeploymentPipelineControls {...commonProps} onAction={handleQuickAction} />;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading Performance Center...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header Section */}
      <div className="mb-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Performance Optimization & Production Deployment Center
              </h1>
              <p className="text-gray-600">
                Enterprise-grade application delivery with automated scaling, performance monitoring, and zero-downtime deployments
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {userProfile?.role === 'superadmin' && (
                <div className="bg-purple-50 px-3 py-1 rounded-full">
                  <span className="text-purple-600 text-sm font-medium">Production Access</span>
                </div>
              )}
              <div className="text-sm text-gray-500">
                Environment: <span className="font-medium capitalize">{deploymentStats?.environment}</span>
              </div>
            </div>
          </div>

          {/* Performance Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium">Performance Score</p>
                  <p className="text-2xl font-bold text-green-900">
                    {performanceData?.performance?.lighthouse?.performance || deploymentStats?.performance?.score}/100
                  </p>
                </div>
                <Gauge className="h-8 w-8 text-green-600" />
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium">Active Containers</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {deploymentStats?.containers?.active}/{deploymentStats?.containers?.total}
                  </p>
                </div>
                <Container className="h-8 w-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 text-sm font-medium">Security Score</p>
                  <p className="text-2xl font-bold text-purple-900">{deploymentStats?.security?.score}%</p>
                </div>
                <Shield className="h-8 w-8 text-purple-600" />
              </div>
            </div>

            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-600 text-sm font-medium">Realtime Connections</p>
                  <p className="text-2xl font-bold text-yellow-900">{deploymentStats?.realtime?.connections}</p>
                </div>
                <Activity className="h-8 w-8 text-yellow-600" />
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleQuickAction('deploy-staging')}
              disabled={deploymentStats?.buildStatus === 'building'}
              className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
            >
              {deploymentStats?.buildStatus === 'building' ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              <span>Deploy Staging</span>
            </button>
            <button
              onClick={() => handleQuickAction('run-tests')}
              disabled={deploymentStats?.buildStatus === 'testing'}
              className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
            >
              {deploymentStats?.buildStatus === 'testing' ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              <span>Run Tests</span>
            </button>
            <button
              onClick={() => handleQuickAction('restart-containers')}
              className="bg-orange-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-orange-700 transition-colors flex items-center space-x-2"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Restart Containers</span>
            </button>
            <button
              onClick={() => handleQuickAction('optimize-bundles')}
              className="bg-purple-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-purple-700 transition-colors flex items-center space-x-2"
            >
              <Zap className="h-4 w-4" />
              <span>Optimize Bundles</span>
            </button>
            <button
              onClick={loadDeploymentData}
              className="bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700 transition-colors flex items-center space-x-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh Data</span>
            </button>
          </div>
        </div>

        {/* Alerts Section */}
        {alerts?.length > 0 && (
          <div className="mt-4 bg-white rounded-lg shadow-sm border p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
              <AlertTriangle className="h-4 w-4 text-yellow-500 mr-2" />
              Performance & Security Alerts ({alerts?.length})
            </h3>
            <div className="space-y-2">
              {alerts?.slice(0, 5)?.map((alert) => (
                <div key={alert?.id} className={`flex items-center justify-between p-3 rounded-md text-sm ${
                  alert?.type === 'error' ? 'bg-red-50 text-red-800' :
                  alert?.type === 'warning' ? 'bg-yellow-50 text-yellow-800' : 'bg-blue-50 text-blue-800'
                }`}>
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${
                      alert?.severity === 'high' ? 'bg-red-500' :
                      alert?.severity === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                    }`} />
                    <span className="font-medium">{alert?.title}</span>
                    <span>{alert?.message}</span>
                    <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                      {alert?.category}
                    </span>
                  </div>
                  <span className="text-xs opacity-75">
                    {new Date(alert?.timestamp)?.toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <XCircle className="h-5 w-5 text-red-500 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-500 hover:text-red-700"
              >
                <XCircle className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm border mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6 overflow-x-auto">
            {tabs?.map((tab) => {
              const Icon = tab?.icon;
              return (
                <button
                  key={tab?.id}
                  onClick={() => setActiveTab(tab?.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                    activeTab === tab?.id
                      ? 'border-blue-500 text-blue-600' :'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab?.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default PerformanceOptimizationAndProductionDeploymentCenter;