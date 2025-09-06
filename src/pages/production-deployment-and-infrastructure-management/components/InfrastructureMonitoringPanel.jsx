import React, { useState, useEffect } from 'react';
import { 
  Server, 
  Database, 
  Activity, 
  Cpu, 
  HardDrive, 
  Wifi, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw,
  Globe,
  Cloud,
  Monitor,
  Zap
} from 'lucide-react';

const InfrastructureMonitoringPanel = () => {
  const [serverMetrics, setServerMetrics] = useState([]);
  const [systemHealth, setSystemHealth] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load infrastructure monitoring data
  useEffect(() => {
    loadMonitoringData();
  }, []);

  const loadMonitoringData = async () => {
    setLoading(true);
    try {
      // Simulate API call for real monitoring data
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Mock server metrics
      setServerMetrics([
        {
          id: 'web-01',
          name: 'Production Web Server 1',
          type: 'web',
          status: 'healthy',
          cpu: 42,
          memory: 78,
          disk: 65,
          network: 'stable',
          uptime: '15d 4h 23m',
          location: 'US East',
          lastUpdate: new Date()?.toISOString()
        },
        {
          id: 'web-02',
          name: 'Production Web Server 2',
          type: 'web',
          status: 'warning',
          cpu: 85,
          memory: 92,
          disk: 45,
          network: 'stable',
          uptime: '15d 4h 23m',
          location: 'US East',
          lastUpdate: new Date()?.toISOString()
        },
        {
          id: 'db-01',
          name: 'Primary Database Server',
          type: 'database',
          status: 'healthy',
          cpu: 28,
          memory: 55,
          disk: 73,
          network: 'stable',
          uptime: '32d 12h 45m',
          location: 'US East',
          lastUpdate: new Date()?.toISOString()
        },
        {
          id: 'lb-01',
          name: 'Load Balancer',
          type: 'loadbalancer',
          status: 'healthy',
          cpu: 15,
          memory: 32,
          disk: 25,
          network: 'stable',
          uptime: '45d 8h 12m',
          location: 'US East',
          lastUpdate: new Date()?.toISOString()
        }
      ]);

      // System health overview
      setSystemHealth({
        overallStatus: 'healthy',
        totalRequests: 1247892,
        avgResponseTime: 245,
        errorRate: 0.012,
        bandwidth: 2.4,
        activeConnections: 1847,
        queuedJobs: 23,
        cacheHitRate: 96.7
      });

      // System alerts
      setAlerts([
        {
          id: 1,
          severity: 'warning',
          server: 'web-02',
          message: 'High memory usage detected (92%)',
          timestamp: new Date(Date.now() - 600000)?.toISOString(),
          resolved: false
        },
        {
          id: 2,
          severity: 'info',
          server: 'db-01',
          message: 'Automatic backup completed successfully',
          timestamp: new Date(Date.now() - 3600000)?.toISOString(),
          resolved: true
        },
        {
          id: 3,
          severity: 'critical',
          server: 'web-01',
          message: 'SSL certificate expires in 7 days',
          timestamp: new Date(Date.now() - 7200000)?.toISOString(),
          resolved: false
        }
      ]);

    } catch (error) {
      console.error('Failed to load monitoring data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadMonitoringData();
    setRefreshing(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getServerIcon = (type) => {
    switch (type) {
      case 'web':
        return Globe;
      case 'database':
        return Database;
      case 'loadbalancer':
        return Cloud;
      default:
        return Server;
    }
  };

  const getMetricColor = (value) => {
    if (value >= 90) return 'text-red-600';
    if (value >= 70) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Activity className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading infrastructure metrics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700">Total Requests</h3>
            <Activity className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {systemHealth?.totalRequests?.toLocaleString()}
          </div>
          <div className="text-sm text-green-600">+2.1% from last hour</div>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700">Response Time</h3>
            <Zap className="h-4 w-4 text-yellow-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {systemHealth?.avgResponseTime}ms
          </div>
          <div className="text-sm text-green-600">-15ms from average</div>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700">Error Rate</h3>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {(systemHealth?.errorRate * 100)?.toFixed(3)}%
          </div>
          <div className="text-sm text-green-600">Within normal range</div>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700">Cache Hit Rate</h3>
            <Database className="h-4 w-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {systemHealth?.cacheHitRate}%
          </div>
          <div className="text-sm text-green-600">Excellent performance</div>
        </div>
      </div>
      {/* Server Status Grid */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Server Status</h3>
            <p className="text-sm text-gray-600 mt-1">Real-time server monitoring and health metrics</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {serverMetrics?.map((server) => {
              const ServerIcon = getServerIcon(server?.type);
              return (
                <div key={server?.id} className={`border-2 rounded-lg p-4 ${getStatusColor(server?.status)}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${
                        server?.status === 'healthy' ? 'bg-green-100' :
                        server?.status === 'warning'? 'bg-yellow-100' : 'bg-red-100'
                      }`}>
                        <ServerIcon className={`h-5 w-5 ${
                          server?.status === 'healthy' ? 'text-green-600' :
                          server?.status === 'warning'? 'text-yellow-600' : 'text-red-600'
                        }`} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{server?.name}</h4>
                        <p className="text-sm text-gray-600">{server?.id} • {server?.location}</p>
                      </div>
                    </div>
                    {server?.status === 'healthy' ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    )}
                  </div>
                  {/* Metrics */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center space-x-2">
                      <Cpu className="h-4 w-4 text-blue-500" />
                      <div>
                        <div className="text-sm text-gray-600">CPU</div>
                        <div className={`font-semibold ${getMetricColor(server?.cpu)}`}>
                          {server?.cpu}%
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Monitor className="h-4 w-4 text-purple-500" />
                      <div>
                        <div className="text-sm text-gray-600">Memory</div>
                        <div className={`font-semibold ${getMetricColor(server?.memory)}`}>
                          {server?.memory}%
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <HardDrive className="h-4 w-4 text-orange-500" />
                      <div>
                        <div className="text-sm text-gray-600">Disk</div>
                        <div className={`font-semibold ${getMetricColor(server?.disk)}`}>
                          {server?.disk}%
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Wifi className="h-4 w-4 text-green-500" />
                      <div>
                        <div className="text-sm text-gray-600">Network</div>
                        <div className="font-semibold text-green-600">
                          {server?.network}
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Additional Info */}
                  <div className="flex items-center justify-between text-sm text-gray-600 pt-4 border-t">
                    <span>Uptime: {server?.uptime}</span>
                    <span>Last updated: {new Date(server?.lastUpdate)?.toLocaleTimeString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {/* System Alerts */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">System Alerts</h3>
          <p className="text-sm text-gray-600 mt-1">Recent system notifications and alerts</p>
        </div>

        <div className="p-6">
          {alerts?.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">All Systems Normal</h4>
              <p className="text-gray-600">No active alerts or issues detected</p>
            </div>
          ) : (
            <div className="space-y-4">
              {alerts?.map((alert) => (
                <div key={alert?.id} className={`border rounded-lg p-4 ${
                  alert?.severity === 'critical' ? 'border-red-200 bg-red-50' :
                  alert?.severity === 'warning'? 'border-yellow-200 bg-yellow-50' : 'border-blue-200 bg-blue-50'
                } ${alert?.resolved ? 'opacity-60' : ''}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {alert?.severity === 'critical' ? (
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                      ) : alert?.severity === 'warning' ? (
                        <AlertTriangle className="h-5 w-5 text-yellow-500" />
                      ) : (
                        <CheckCircle className="h-5 w-5 text-blue-500" />
                      )}
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                            alert?.severity === 'critical' ? 'bg-red-100 text-red-800' :
                            alert?.severity === 'warning'? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {alert?.severity}
                          </span>
                          <span className="font-medium text-gray-900">{alert?.server}</span>
                          {alert?.resolved && (
                            <span className="px-2 py-1 text-xs rounded-full font-medium bg-green-100 text-green-800">
                              Resolved
                            </span>
                          )}
                        </div>
                        <p className="text-gray-700 mt-1">{alert?.message}</p>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(alert?.timestamp)?.toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InfrastructureMonitoringPanel;