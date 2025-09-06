import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Server, Container, Activity, Shield, AlertTriangle, Settings, HardDrive, Monitor, RefreshCw, GitBranch, Zap } from 'lucide-react';

// Import components
import DeploymentPipelineVisualization from './components/DeploymentPipelineVisualization';
import InfrastructureMonitoringPanel from './components/InfrastructureMonitoringPanel';
import DockerContainerManagement from './components/DockerContainerManagement';
import NginxConfigurationPanel from './components/NginxConfigurationPanel';
import BackupDisasterRecovery from './components/BackupDisasterRecovery';
import SecurityComplianceMonitor from './components/SecurityComplianceMonitor';
import EnvironmentPromotionControls from './components/EnvironmentPromotionControls';
import Icon from '../../components/AppIcon';

const ProductionDeploymentAndInfrastructureManagement = () => {
  const { user, userProfile, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('pipeline');
  const [infrastructureStats, setInfrastructureStats] = useState({
    totalServers: 0,
    activeContainers: 0,
    systemHealth: 'loading',
    deploymentStatus: 'idle',
    lastBackup: null,
    securityScore: 0
  });
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState([]);

  // Simulated infrastructure monitoring
  const loadInfrastructureData = useCallback(async () => {
    setLoading(true);
    try {
      // Simulate API call for infrastructure stats
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setInfrastructureStats({
        totalServers: 12,
        activeContainers: 45,
        systemHealth: 'healthy',
        deploymentStatus: 'success',
        lastBackup: new Date(Date.now() - 86400000)?.toISOString(),
        securityScore: 98
      });

      setAlerts([
        {
          id: 1,
          type: 'warning',
          title: 'High Memory Usage',
          message: 'Production server memory usage at 85%',
          timestamp: new Date()?.toISOString(),
          severity: 'medium'
        },
        {
          id: 2,
          type: 'info',
          title: 'Deployment Completed',
          message: 'Version 2.4.1 successfully deployed to staging',
          timestamp: new Date(Date.now() - 300000)?.toISOString(),
          severity: 'low'
        }
      ]);
    } catch (error) {
      console.error('Failed to load infrastructure data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user && userProfile) {
      loadInfrastructureData();
    }
  }, [user, userProfile, loadInfrastructureData]);

  // Tab navigation options
  const tabs = [
    { id: 'pipeline', name: 'Deployment Pipeline', icon: GitBranch },
    { id: 'infrastructure', name: 'Infrastructure Monitor', icon: Monitor },
    { id: 'docker', name: 'Docker Management', icon: Container },
    { id: 'nginx', name: 'Nginx Configuration', icon: Server },
    { id: 'environments', name: 'Environment Control', icon: Settings },
    { id: 'backup', name: 'Backup & Recovery', icon: HardDrive },
    { id: 'security', name: 'Security Compliance', icon: Shield }
  ];

  // Quick action handlers
  const handleQuickAction = useCallback(async (action) => {
    try {
      switch (action) {
        case 'restart-services':
          // Simulate service restart
          console.log('Restarting services...');
          break;
        case 'emergency-rollback':
          // Simulate rollback
          console.log('Initiating emergency rollback...');
          break;
        case 'scale-up':
          // Simulate scaling
          console.log('Scaling up infrastructure...');
          break;
        default:
          console.log(`Action ${action} not implemented`);
      }
    } catch (error) {
      console.error(`Failed to execute ${action}:`, error);
    }
  }, []);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'pipeline':
        return <DeploymentPipelineVisualization />;
      case 'infrastructure':
        return <InfrastructureMonitoringPanel />;
      case 'docker':
        return <DockerContainerManagement />;
      case 'nginx':
        return <NginxConfigurationPanel />;
      case 'environments':
        return <EnvironmentPromotionControls />;
      case 'backup':
        return <BackupDisasterRecovery />;
      case 'security':
        return <SecurityComplianceMonitor />;
      default:
        return <DeploymentPipelineVisualization />;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading Infrastructure Dashboard...</p>
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
                Production Infrastructure Management
              </h1>
              <p className="text-gray-600">
                Comprehensive DevOps control center for Nova HR deployment and infrastructure
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {userProfile?.role === 'superadmin' && (
                <div className="bg-red-50 px-3 py-1 rounded-full">
                  <span className="text-red-600 text-sm font-medium">SuperAdmin Access</span>
                </div>
              )}
              <div className="text-sm text-gray-500">
                Last updated: {new Date()?.toLocaleTimeString('en-US', { 
                  timeZone: 'America/Monterrey',
                  hour12: true 
                })}
              </div>
            </div>
          </div>

          {/* Infrastructure Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium">Active Servers</p>
                  <p className="text-2xl font-bold text-blue-900">{infrastructureStats?.totalServers}</p>
                </div>
                <Server className="h-8 w-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium">Docker Containers</p>
                  <p className="text-2xl font-bold text-green-900">{infrastructureStats?.activeContainers}</p>
                </div>
                <Container className="h-8 w-8 text-green-600" />
              </div>
            </div>

            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-600 text-sm font-medium">System Health</p>
                  <p className="text-2xl font-bold text-yellow-900 capitalize">
                    {infrastructureStats?.systemHealth}
                  </p>
                </div>
                <Activity className="h-8 w-8 text-yellow-600" />
              </div>
            </div>

            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 text-sm font-medium">Security Score</p>
                  <p className="text-2xl font-bold text-purple-900">{infrastructureStats?.securityScore}%</p>
                </div>
                <Shield className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleQuickAction('restart-services')}
              className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Restart Services</span>
            </button>
            <button
              onClick={() => handleQuickAction('emergency-rollback')}
              className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition-colors flex items-center space-x-2"
            >
              <AlertTriangle className="h-4 w-4" />
              <span>Emergency Rollback</span>
            </button>
            <button
              onClick={() => handleQuickAction('scale-up')}
              className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <Zap className="h-4 w-4" />
              <span>Scale Infrastructure</span>
            </button>
            <button
              onClick={loadInfrastructureData}
              className="bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700 transition-colors flex items-center space-x-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh Data</span>
            </button>
          </div>
        </div>

        {/* Alerts Bar */}
        {alerts?.length > 0 && (
          <div className="mt-4 bg-white rounded-lg shadow-sm border p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
              <AlertTriangle className="h-4 w-4 text-yellow-500 mr-2" />
              System Alerts ({alerts?.length})
            </h3>
            <div className="space-y-2">
              {alerts?.slice(0, 3)?.map((alert) => (
                <div key={alert?.id} className={`flex items-center justify-between p-3 rounded-md text-sm ${
                  alert?.type === 'warning' ? 'bg-yellow-50 text-yellow-800' :
                  alert?.type === 'error'? 'bg-red-50 text-red-800' : 'bg-blue-50 text-blue-800'
                }`}>
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${
                      alert?.severity === 'high' ? 'bg-red-500' :
                      alert?.severity === 'medium'? 'bg-yellow-500' : 'bg-blue-500'
                    }`} />
                    <span className="font-medium">{alert?.title}</span>
                    <span>{alert?.message}</span>
                  </div>
                  <span className="text-xs opacity-75">
                    {new Date(alert?.timestamp)?.toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm border mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs?.map((tab) => {
              const Icon = tab?.icon;
              return (
                <button
                  key={tab?.id}
                  onClick={() => setActiveTab(tab?.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
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

export default ProductionDeploymentAndInfrastructureManagement;