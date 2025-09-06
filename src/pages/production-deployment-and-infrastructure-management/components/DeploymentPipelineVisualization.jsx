import React, { useState, useEffect } from 'react';
import { GitBranch, CheckCircle, Clock, XCircle, RotateCcw, GitCommit, TestTube, Upload, Globe, Activity } from 'lucide-react';
import Icon from '../../../components/AppIcon';


const DeploymentPipelineVisualization = () => {
  const [pipelineStages, setPipelineStages] = useState([]);
  const [deploymentHistory, setDeploymentHistory] = useState([]);
  const [currentDeployment, setCurrentDeployment] = useState(null);
  const [loading, setLoading] = useState(true);

  // Pipeline stages configuration
  const stages = [
    { id: 'commit', name: 'Code Commit', icon: GitCommit, color: 'blue' },
    { id: 'test', name: 'Automated Testing', icon: TestTube, color: 'yellow' },
    { id: 'staging', name: 'Staging Deploy', icon: Upload, color: 'purple' },
    { id: 'approval', name: 'Production Approval', icon: CheckCircle, color: 'orange' },
    { id: 'production', name: 'Live Deployment', icon: Globe, color: 'green' }
  ];

  // Load pipeline data
  useEffect(() => {
    const loadPipelineData = async () => {
      setLoading(true);
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Mock pipeline data
        setPipelineStages([
          { 
            id: 'commit', 
            status: 'completed', 
            duration: '00:02:15',
            timestamp: new Date(Date.now() - 3600000)?.toISOString(),
            details: 'Latest commit: feat/user-management-improvements'
          },
          { 
            id: 'test', 
            status: 'completed', 
            duration: '00:12:45',
            timestamp: new Date(Date.now() - 3000000)?.toISOString(),
            details: '247 tests passed, 0 failed'
          },
          { 
            id: 'staging', 
            status: 'running', 
            duration: '00:05:32',
            timestamp: new Date(Date.now() - 300000)?.toISOString(),
            details: 'Deploying to staging environment...'
          },
          { 
            id: 'approval', 
            status: 'pending', 
            duration: null,
            timestamp: null,
            details: 'Awaiting manual approval for production'
          },
          { 
            id: 'production', 
            status: 'pending', 
            duration: null,
            timestamp: null,
            details: 'Ready for production deployment'
          }
        ]);

        setDeploymentHistory([
          {
            id: 1,
            version: 'v2.4.1',
            branch: 'main',
            status: 'success',
            environment: 'production',
            timestamp: new Date(Date.now() - 86400000)?.toISOString(),
            duration: '00:08:32',
            deployedBy: 'DevOps Team'
          },
          {
            id: 2,
            version: 'v2.4.0',
            branch: 'main',
            status: 'success',
            environment: 'production',
            timestamp: new Date(Date.now() - 172800000)?.toISOString(),
            duration: '00:07:18',
            deployedBy: 'DevOps Team'
          },
          {
            id: 3,
            version: 'v2.3.9',
            branch: 'main',
            status: 'failed',
            environment: 'production',
            timestamp: new Date(Date.now() - 259200000)?.toISOString(),
            duration: '00:12:45',
            deployedBy: 'DevOps Team'
          }
        ]);

        setCurrentDeployment({
          version: 'v2.4.2',
          branch: 'feature/infrastructure-management',
          startedAt: new Date(Date.now() - 900000)?.toISOString(),
          currentStage: 'staging'
        });

      } catch (error) {
        console.error('Failed to load pipeline data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPipelineData();
  }, []);

  const getStageStatus = (stageId) => {
    const stage = pipelineStages?.find(s => s?.id === stageId);
    return stage?.status || 'pending';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'running':
        return <Clock className="h-5 w-5 text-blue-500 animate-pulse" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'pending':
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const handleStageAction = async (stageId, action) => {
    try {
      console.log(`Executing ${action} on stage ${stageId}`);
      // Simulate API call for stage actions
      switch (action) {
        case 'approve':
          // Update stage status to approved
          setPipelineStages(prev => prev?.map(stage => 
            stage?.id === stageId 
              ? { ...stage, status: 'completed', timestamp: new Date()?.toISOString() }
              : stage
          ));
          break;
        case 'rollback': console.log('Initiating rollback...');
          break;
        case 'retry': console.log('Retrying stage...');
          break;
        default:
          console.log(`Unknown action: ${action}`);
      }
    } catch (error) {
      console.error(`Failed to execute ${action}:`, error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Activity className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading deployment pipeline...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Deployment Status */}
      {currentDeployment && (
        <div className="bg-blue-50 rounded-lg p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-blue-900">
              Current Deployment: {currentDeployment?.version}
            </h3>
            <div className="flex items-center space-x-2 text-blue-700">
              <Activity className="h-4 w-4 animate-pulse" />
              <span className="text-sm">
                Running for {Math.floor((Date.now() - new Date(currentDeployment?.startedAt)?.getTime()) / 60000)} minutes
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-4 text-sm text-blue-800">
            <div className="flex items-center space-x-2">
              <GitBranch className="h-4 w-4" />
              <span>{currentDeployment?.branch}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span>Current Stage:</span>
              <span className="font-semibold capitalize">{currentDeployment?.currentStage}</span>
            </div>
          </div>
        </div>
      )}
      {/* Pipeline Visualization */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Deployment Pipeline</h3>
          <p className="text-sm text-gray-600 mt-1">Automated CI/CD pipeline for Nova HR</p>
        </div>

        <div className="p-6">
          <div className="relative">
            {/* Pipeline Flow */}
            <div className="flex items-center justify-between">
              {stages?.map((stage, index) => {
                const stageData = pipelineStages?.find(s => s?.id === stage?.id);
                const status = stageData?.status || 'pending';
                const Icon = stage?.icon;

                return (
                  <div key={stage?.id} className="flex flex-col items-center flex-1">
                    {/* Stage Icon and Status */}
                    <div className={`relative p-4 rounded-full border-2 ${
                      status === 'completed' ? 'bg-green-50 border-green-200' :
                      status === 'running' ? 'bg-blue-50 border-blue-200' :
                      status === 'failed'? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'
                    }`}>
                      <Icon className={`h-6 w-6 ${
                        status === 'completed' ? 'text-green-600' :
                        status === 'running' ? 'text-blue-600' :
                        status === 'failed'? 'text-red-600' : 'text-gray-400'
                      }`} />
                      
                      {/* Status indicator */}
                      <div className="absolute -top-1 -right-1">
                        {getStatusIcon(status)}
                      </div>
                    </div>
                    {/* Stage Info */}
                    <div className="mt-4 text-center">
                      <h4 className="font-medium text-gray-900">{stage?.name}</h4>
                      {stageData && (
                        <div className="mt-2 space-y-1">
                          {stageData?.duration && (
                            <p className="text-xs text-gray-500">Duration: {stageData?.duration}</p>
                          )}
                          {stageData?.timestamp && (
                            <p className="text-xs text-gray-500">
                              {new Date(stageData?.timestamp)?.toLocaleTimeString()}
                            </p>
                          )}
                          <p className="text-xs text-gray-600">{stageData?.details}</p>
                        </div>
                      )}
                    </div>
                    {/* Stage Actions */}
                    {status === 'pending' && stage?.id === 'approval' && (
                      <div className="mt-3 flex space-x-2">
                        <button
                          onClick={() => handleStageAction(stage?.id, 'approve')}
                          className="bg-green-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-green-700 transition-colors"
                        >
                          Approve
                        </button>
                      </div>
                    )}
                    {status === 'failed' && (
                      <div className="mt-3 flex space-x-2">
                        <button
                          onClick={() => handleStageAction(stage?.id, 'retry')}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-blue-700 transition-colors"
                        >
                          Retry
                        </button>
                      </div>
                    )}
                    {/* Connection Line */}
                    {index < stages?.length - 1 && (
                      <div className={`absolute top-8 w-full h-0.5 ${
                        status === 'completed' ? 'bg-green-300' : 'bg-gray-300'
                      }`} 
                      style={{ 
                        left: '50%', 
                        right: '-50%', 
                        transform: 'translateY(-50%)' 
                      }} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      {/* Deployment History */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Deployment History</h3>
          <p className="text-sm text-gray-600 mt-1">Recent deployment activities</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Version
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Environment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Deployed By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {deploymentHistory?.map((deployment) => (
                <tr key={deployment?.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <GitBranch className="h-4 w-4 text-gray-400 mr-2" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {deployment?.version}
                        </div>
                        <div className="text-sm text-gray-500">
                          {deployment?.branch}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      deployment?.environment === 'production' ?'bg-green-100 text-green-800' :'bg-yellow-100 text-yellow-800'
                    }`}>
                      {deployment?.environment}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {deployment?.status === 'success' ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className={`ml-2 text-sm ${
                        deployment?.status === 'success' ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {deployment?.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {deployment?.duration}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {deployment?.deployedBy}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(deployment?.timestamp)?.toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleStageAction('production', 'rollback')}
                      className="text-red-600 hover:text-red-900 flex items-center space-x-1"
                    >
                      <RotateCcw className="h-4 w-4" />
                      <span>Rollback</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DeploymentPipelineVisualization;