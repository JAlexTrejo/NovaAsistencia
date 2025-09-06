import React, { useState, useEffect } from 'react';
import { Container, Play, Square, RefreshCw, Monitor, HardDrive, Cpu, Activity, CheckCircle, XCircle, Clock, Eye } from 'lucide-react';

const DockerContainerManagement = () => {
  const [containers, setContainers] = useState([]);
  const [images, setImages] = useState([]);
  const [networks, setNetworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedContainer, setSelectedContainer] = useState(null);
  const [showLogs, setShowLogs] = useState(false);
  const [containerLogs, setContainerLogs] = useState('');

  // Load Docker data
  useEffect(() => {
    loadDockerData();
  }, []);

  const loadDockerData = async () => {
    setLoading(true);
    try {
      // Simulate Docker API calls
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Mock container data
      setContainers([
        {
          id: 'nova-hr-web-1',
          name: 'nova-hr-web',
          image: 'nova-hr:latest',
          status: 'running',
          state: 'Up 2 hours',
          ports: ['3000:3000', '443:443'],
          cpu: 15.2,
          memory: 256,
          memoryLimit: 512,
          network: 'nova-hr-network',
          created: new Date(Date.now() - 7200000)?.toISOString(),
          restartPolicy: 'always',
          healthcheck: 'healthy'
        },
        {
          id: 'nova-hr-nginx-1',
          name: 'nova-hr-nginx',
          image: 'nginx:alpine',
          status: 'running',
          state: 'Up 2 hours',
          ports: ['80:80', '443:443'],
          cpu: 2.1,
          memory: 32,
          memoryLimit: 128,
          network: 'nova-hr-network',
          created: new Date(Date.now() - 7200000)?.toISOString(),
          restartPolicy: 'always',
          healthcheck: 'healthy'
        },
        {
          id: 'nova-hr-redis-1',
          name: 'nova-hr-redis',
          image: 'redis:alpine',
          status: 'running',
          state: 'Up 2 hours',
          ports: ['6379:6379'],
          cpu: 0.8,
          memory: 64,
          memoryLimit: 256,
          network: 'nova-hr-network',
          created: new Date(Date.now() - 7200000)?.toISOString(),
          restartPolicy: 'always',
          healthcheck: 'healthy'
        },
        {
          id: 'nova-hr-worker-1',
          name: 'nova-hr-worker',
          image: 'nova-hr:latest',
          status: 'stopped',
          state: 'Exited (0) 30 minutes ago',
          ports: [],
          cpu: 0,
          memory: 0,
          memoryLimit: 512,
          network: 'nova-hr-network',
          created: new Date(Date.now() - 10800000)?.toISOString(),
          restartPolicy: 'on-failure',
          healthcheck: 'none'
        }
      ]);

      // Mock images data
      setImages([
        {
          id: 'nova-hr:latest',
          repository: 'nova-hr',
          tag: 'latest',
          size: '245 MB',
          created: new Date(Date.now() - 86400000)?.toISOString()
        },
        {
          id: 'nginx:alpine',
          repository: 'nginx',
          tag: 'alpine',
          size: '23 MB',
          created: new Date(Date.now() - 172800000)?.toISOString()
        },
        {
          id: 'redis:alpine',
          repository: 'redis',
          tag: 'alpine',
          size: '32 MB',
          created: new Date(Date.now() - 259200000)?.toISOString()
        }
      ]);

      // Mock networks data
      setNetworks([
        {
          id: 'nova-hr-network',
          name: 'nova-hr-network',
          driver: 'bridge',
          scope: 'local',
          containers: 4,
          created: new Date(Date.now() - 259200000)?.toISOString()
        }
      ]);

    } catch (error) {
      console.error('Failed to load Docker data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContainerAction = async (containerId, action) => {
    try {
      console.log(`Executing ${action} on container ${containerId}`);
      
      // Update container status optimistically
      setContainers(prev => prev?.map(container => 
        container?.id === containerId 
          ? { 
              ...container, 
              status: action === 'start' ? 'running' : 
                     action === 'stop' ? 'stopped' : 
                     action === 'restart' ? 'restarting' : container?.status 
            }
          : container
      ));

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Refresh data after action
      await loadDockerData();
      
    } catch (error) {
      console.error(`Failed to ${action} container:`, error);
    }
  };

  const handleViewLogs = async (containerId) => {
    setSelectedContainer(containerId);
    setShowLogs(true);
    
    // Mock container logs
    setContainerLogs(`
[2025-01-11 19:55:23] INFO: Nova HR application starting...
[2025-01-11 19:55:24] INFO: Database connection established
[2025-01-11 19:55:24] INFO: Redis connection established
[2025-01-11 19:55:25] INFO: Server listening on port 3000
[2025-01-11 19:56:12] INFO: User authentication successful - user@example.com
[2025-01-11 19:57:45] INFO: Processing payroll calculation for employee ID: EMP-001
[2025-01-11 19:58:20] INFO: Background job completed - attendance sync
[2025-01-11 19:59:01] INFO: Health check passed
[2025-01-11 20:00:00] INFO: Automated backup initiated
[2025-01-11 20:00:15] INFO: Backup completed successfully
    `);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'running':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'stopped':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'restarting':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'running':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'stopped':
        return 'text-red-700 bg-red-50 border-red-200';
      case 'restarting':
        return 'text-blue-700 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Container className="h-8 w-8 animate-pulse text-blue-600" />
        <span className="ml-2 text-gray-600">Loading Docker containers...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Container Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700">Total Containers</h3>
            <Container className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{containers?.length}</div>
          <div className="text-sm text-blue-600">
            {containers?.filter(c => c?.status === 'running')?.length} running
          </div>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700">Images</h3>
            <HardDrive className="h-4 w-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{images?.length}</div>
          <div className="text-sm text-purple-600">Total size: 300 MB</div>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700">Networks</h3>
            <Activity className="h-4 w-4 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{networks?.length}</div>
          <div className="text-sm text-green-600">All networks healthy</div>
        </div>
      </div>
      {/* Container Management */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Container Management</h3>
            <p className="text-sm text-gray-600 mt-1">Manage Docker containers for Nova HR</p>
          </div>
          <button
            onClick={loadDockerData}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Container
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Resource Usage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ports
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Health
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {containers?.map((container) => (
                <tr key={container?.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Container className="h-5 w-5 text-blue-500 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {container?.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {container?.image}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(container?.status)}
                      <div>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          container?.status === 'running' ? 'bg-green-100 text-green-800' :
                          container?.status === 'stopped' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {container?.status}
                        </span>
                        <div className="text-xs text-gray-500 mt-1">
                          {container?.state}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm space-y-1">
                      <div className="flex items-center space-x-2">
                        <Cpu className="h-3 w-3 text-blue-500" />
                        <span>CPU: {container?.cpu}%</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Monitor className="h-3 w-3 text-purple-500" />
                        <span>RAM: {container?.memory}/{container?.memoryLimit}MB</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {container?.ports?.length > 0 ? (
                        container?.ports?.map((port, index) => (
                          <div key={index} className="text-xs text-gray-600">
                            {port}
                          </div>
                        ))
                      ) : (
                        <span className="text-gray-400">No ports exposed</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {container?.healthcheck === 'healthy' ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : container?.healthcheck === 'unhealthy' ? (
                      <XCircle className="h-4 w-4 text-red-500" />
                    ) : (
                      <span className="text-xs text-gray-500">No health check</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      {container?.status === 'running' ? (
                        <>
                          <button
                            onClick={() => handleContainerAction(container?.id, 'restart')}
                            className="text-blue-600 hover:text-blue-900"
                            title="Restart"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleContainerAction(container?.id, 'stop')}
                            className="text-red-600 hover:text-red-900"
                            title="Stop"
                          >
                            <Square className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleContainerAction(container?.id, 'start')}
                          className="text-green-600 hover:text-green-900"
                          title="Start"
                        >
                          <Play className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleViewLogs(container?.id)}
                        className="text-gray-600 hover:text-gray-900"
                        title="View Logs"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* Images and Networks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Docker Images */}
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Docker Images</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {images?.map((image) => (
                <div key={image?.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <HardDrive className="h-5 w-5 text-purple-500" />
                    <div>
                      <div className="font-medium text-gray-900">
                        {image?.repository}:{image?.tag}
                      </div>
                      <div className="text-sm text-gray-500">
                        Size: {image?.size}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(image?.created)?.toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Networks */}
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Docker Networks</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {networks?.map((network) => (
                <div key={network?.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Activity className="h-5 w-5 text-green-500" />
                    <div>
                      <div className="font-medium text-gray-900">
                        {network?.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        Driver: {network?.driver} • {network?.containers} containers
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {network?.scope}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* Container Logs Modal */}
      {showLogs && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Container Logs: {selectedContainer}
              </h3>
              <button
                onClick={() => setShowLogs(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            
            <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
              <pre>{containerLogs}</pre>
            </div>
            
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowLogs(false)}
                className="bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DockerContainerManagement;