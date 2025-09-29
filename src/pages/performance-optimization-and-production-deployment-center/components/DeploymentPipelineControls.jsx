import React, { useState, useCallback } from 'react';
import { Play, CheckCircle, XCircle, Clock, RefreshCw, ArrowRight, GitCommit, Upload, Target } from 'lucide-react';

const DeploymentPipelineControls = ({ deploymentStats, onAction, onRefresh }) => {
  const [pipelineStages] = useState([
    { 
      id: 'build', 
      name: 'Build', 
      status: 'completed', 
      duration: '2m 15s',
      description: 'Compile and bundle application'
    },
    { 
      id: 'test', 
      name: 'Test', 
      status: 'completed', 
      duration: '1m 45s',
      description: 'Run unit and integration tests'
    },
    { 
      id: 'security', 
      name: 'Security Scan', 
      status: 'completed', 
      duration: '45s',
      description: 'Vulnerability and dependency scanning'
    },
    { 
      id: 'deploy', 
      name: 'Deploy to Staging', 
      status: deploymentStats?.buildStatus === 'building' ? 'running' : 'completed', 
      duration: '1m 30s',
      description: 'Deploy to staging environment'
    },
    { 
      id: 'validate', 
      name: 'Validation', 
      status: 'pending', 
      duration: '30s',
      description: 'Health checks and smoke tests'
    },
    { 
      id: 'production', 
      name: 'Production Deploy', 
      status: 'pending', 
      duration: '2m 00s',
      description: 'Zero-downtime production deployment'
    }
  ]);

  const [deploymentHistory] = useState([
    {
      id: 1,
      version: 'v2.4.1',
      environment: 'production',
      status: 'success',
      timestamp: new Date(Date.now() - 7200000)?.toISOString(),
      duration: '5m 12s',
      commit: 'a1b2c3d'
    },
    {
      id: 2,
      version: 'v2.4.0',
      environment: 'staging',
      status: 'success',
      timestamp: deploymentStats?.lastDeploy,
      duration: '4m 45s',
      commit: 'x7y8z9a'
    },
    {
      id: 3,
      version: 'v2.3.9',
      environment: 'staging',
      status: 'failed',
      timestamp: new Date(Date.now() - 14400000)?.toISOString(),
      duration: '2m 18s',
      commit: 'm4n5o6p'
    }
  ]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'running':
        return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-gray-400" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
      case 'success':
        return 'text-green-600 bg-green-50';
      case 'running':
        return 'text-blue-600 bg-blue-50';
      case 'failed':
        return 'text-red-600 bg-red-50';
      case 'pending':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const handlePipelineAction = useCallback((action, stage) => {
    if (onAction) {
      onAction(action, { stage });
    }
  }, [onAction]);

  return (
    <div className="space-y-6">
      {/* Pipeline Overview */}
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Deployment Pipeline</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePipelineAction('trigger-pipeline')}
              className="bg-green-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <Play className="h-4 w-4" />
              <span>Trigger Deploy</span>
            </button>
            <button
              onClick={onRefresh}
              className="bg-gray-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Pipeline Stages */}
        <div className="space-y-4">
          {pipelineStages?.map((stage, index) => (
            <div key={stage?.id} className="flex items-center space-x-4">
              <div className="flex items-center space-x-3 flex-1">
                {getStatusIcon(stage?.status)}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">{stage?.name}</h4>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(stage?.status)}`}>
                      {stage?.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{stage?.description}</p>
                  {stage?.duration && (
                    <p className="text-xs text-gray-500 mt-1">Duration: {stage?.duration}</p>
                  )}
                </div>
              </div>
              {index < pipelineStages?.length - 1 && (
                <ArrowRight className="h-4 w-4 text-gray-400" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Deployment Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button
              onClick={() => handlePipelineAction('deploy-staging')}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
            >
              <Upload className="h-4 w-4" />
              <span>Deploy to Staging</span>
            </button>
            <button
              onClick={() => handlePipelineAction('promote-production')}
              className="w-full bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
            >
              <Target className="h-4 w-4" />
              <span>Promote to Production</span>
            </button>
            <button
              onClick={() => handlePipelineAction('rollback')}
              className="w-full bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Emergency Rollback</span>
            </button>
          </div>
        </div>

        {/* Environment Status */}
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Environment Status</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-gray-200">
              <div>
                <p className="font-medium text-gray-900">Staging</p>
                <p className="text-sm text-gray-600">Last deployed: {
                  deploymentStats?.lastDeploy 
                    ? new Date(deploymentStats?.lastDeploy)?.toLocaleString()
                    : 'Never'
                }</p>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                deploymentStats?.buildStatus === 'success' ? 'text-green-600 bg-green-50' :
                deploymentStats?.buildStatus === 'building' ? 'text-blue-600 bg-blue-50' : 'text-gray-600 bg-gray-50'
              }`}>
                {deploymentStats?.buildStatus || 'idle'}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-200">
              <div>
                <p className="font-medium text-gray-900">Production</p>
                <p className="text-sm text-gray-600">Version: v2.4.1 (stable)</p>
              </div>
              <span className="px-2 py-1 rounded text-xs font-medium text-green-600 bg-green-50">
                healthy
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium text-gray-900">Development</p>
                <p className="text-sm text-gray-600">Active branches: 3</p>
              </div>
              <span className="px-2 py-1 rounded text-xs font-medium text-blue-600 bg-blue-50">
                active
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Deployments */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Deployments</h3>
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
                  Deployed
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
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
                      <GitCommit className="h-4 w-4 text-gray-400 mr-2" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {deployment?.version}
                        </div>
                        <div className="text-xs text-gray-500">
                          {deployment?.commit}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900 capitalize">
                      {deployment?.environment}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(deployment?.status)}`}>
                      {deployment?.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {deployment?.timestamp ? new Date(deployment?.timestamp)?.toLocaleString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {deployment?.duration}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button 
                      className="text-blue-600 hover:text-blue-900 mr-3"
                      onClick={() => handlePipelineAction('view-logs', deployment)}
                    >
                      View Logs
                    </button>
                    {deployment?.status === 'success' && deployment?.environment !== 'production' && (
                      <button 
                        className="text-green-600 hover:text-green-900"
                        onClick={() => handlePipelineAction('promote', deployment)}
                      >
                        Promote
                      </button>
                    )}
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

export default DeploymentPipelineControls;