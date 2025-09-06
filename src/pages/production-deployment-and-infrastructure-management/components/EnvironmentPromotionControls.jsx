import React, { useState, useEffect } from 'react';
import { ArrowRight, CheckCircle, XCircle, Clock, RefreshCw, AlertTriangle, Settings, GitBranch, Database, Globe, Activity, Eye, RotateCcw, Zap } from 'lucide-react';

const EnvironmentPromotionControls = () => {
  const [environments, setEnvironments] = useState([]);
  const [promotionQueue, setPromotionQueue] = useState([]);
  const [validationRules, setValidationRules] = useState([]);
  const [approvalWorkflow, setApprovalWorkflow] = useState({});
  const [loading, setLoading] = useState(true);
  const [promotingId, setPromotingId] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(null);

  // Load environment promotion data
  useEffect(() => {
    loadEnvironmentData();
  }, []);

  const loadEnvironmentData = async () => {
    setLoading(true);
    try {
      // Simulate API calls for environment data
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock environments
      setEnvironments([
        {
          id: 'development',
          name: 'Development',
          type: 'development',
          status: 'healthy',
          currentVersion: 'v2.4.3-dev',
          lastDeployment: new Date(Date.now() - 3600000)?.toISOString(),
          branch: 'feature/infrastructure-management',
          url: 'https://dev.nova-hr.company.com',
          healthChecks: 8,
          healthStatus: 'passing',
          resources: {
            cpu: 15,
            memory: 45,
            storage: 23
          }
        },
        {
          id: 'staging',
          name: 'Staging',
          type: 'staging',
          status: 'healthy',
          currentVersion: 'v2.4.2',
          lastDeployment: new Date(Date.now() - 86400000)?.toISOString(),
          branch: 'main',
          url: 'https://staging.nova-hr.company.com',
          healthChecks: 12,
          healthStatus: 'passing',
          resources: {
            cpu: 28,
            memory: 67,
            storage: 41
          }
        },
        {
          id: 'production',
          name: 'Production',
          type: 'production',
          status: 'healthy',
          currentVersion: 'v2.4.1',
          lastDeployment: new Date(Date.now() - 172800000)?.toISOString(),
          branch: 'main',
          url: 'https://nova-hr.company.com',
          healthChecks: 15,
          healthStatus: 'passing',
          resources: {
            cpu: 42,
            memory: 78,
            storage: 65
          }
        }
      ]);

      // Mock promotion queue
      setPromotionQueue([
        {
          id: 'promo-001',
          fromEnvironment: 'development',
          toEnvironment: 'staging',
          version: 'v2.4.3-dev',
          status: 'pending_validation',
          createdAt: new Date(Date.now() - 1800000)?.toISOString(),
          createdBy: 'jane.developer',
          validationsPassed: 6,
          validationsTotal: 8,
          approvals: []
        },
        {
          id: 'promo-002',
          fromEnvironment: 'staging',
          toEnvironment: 'production',
          version: 'v2.4.2',
          status: 'pending_approval',
          createdAt: new Date(Date.now() - 7200000)?.toISOString(),
          createdBy: 'mike.devops',
          validationsPassed: 12,
          validationsTotal: 12,
          approvals: [
            { user: 'tech.lead', status: 'approved', timestamp: new Date(Date.now() - 3600000)?.toISOString() }
          ]
        }
      ]);

      // Mock validation rules
      setValidationRules([
        {
          id: 'rule-001',
          name: 'Unit Tests Pass',
          type: 'automated',
          required: true,
          status: 'enabled',
          lastRun: new Date(Date.now() - 900000)?.toISOString(),
          success: true
        },
        {
          id: 'rule-002',
          name: 'Integration Tests Pass',
          type: 'automated',
          required: true,
          status: 'enabled',
          lastRun: new Date(Date.now() - 1200000)?.toISOString(),
          success: true
        },
        {
          id: 'rule-003',
          name: 'Security Scan Clean',
          type: 'automated',
          required: true,
          status: 'enabled',
          lastRun: new Date(Date.now() - 1800000)?.toISOString(),
          success: false,
          error: 'High severity vulnerability found'
        },
        {
          id: 'rule-004',
          name: 'Performance Benchmark',
          type: 'automated',
          required: false,
          status: 'enabled',
          lastRun: new Date(Date.now() - 2400000)?.toISOString(),
          success: true
        },
        {
          id: 'rule-005',
          name: 'Database Migration Check',
          type: 'automated',
          required: true,
          status: 'enabled',
          lastRun: new Date(Date.now() - 600000)?.toISOString(),
          success: true
        },
        {
          id: 'rule-006',
          name: 'Tech Lead Approval',
          type: 'manual',
          required: true,
          status: 'enabled',
          environments: ['production']
        },
        {
          id: 'rule-007',
          name: 'Product Owner Approval',
          type: 'manual',
          required: false,
          status: 'enabled',
          environments: ['production']
        }
      ]);

      // Mock approval workflow
      setApprovalWorkflow({
        staging: {
          required: false,
          approvers: []
        },
        production: {
          required: true,
          approvers: [
            { role: 'tech_lead', required: true, name: 'Technical Lead' },
            { role: 'product_owner', required: false, name: 'Product Owner' },
            { role: 'devops_manager', required: true, name: 'DevOps Manager' }
          ]
        }
      });

    } catch (error) {
      console.error('Failed to load environment data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePromotion = async (fromEnv, toEnv) => {
    try {
      setPromotingId(`${fromEnv}-${toEnv}`);
      console.log(`Starting promotion from ${fromEnv} to ${toEnv}`);
      
      // Simulate promotion process
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Create new promotion queue item
      const newPromotion = {
        id: `promo-${Date.now()}`,
        fromEnvironment: fromEnv,
        toEnvironment: toEnv,
        version: environments?.find(e => e?.id === fromEnv)?.currentVersion || 'unknown',
        status: 'validation_running',
        createdAt: new Date()?.toISOString(),
        createdBy: 'current.user',
        validationsPassed: 0,
        validationsTotal: validationRules?.filter(r => r?.required)?.length || 0,
        approvals: []
      };

      setPromotionQueue(prev => [newPromotion, ...prev]);
      
      // Start validation process simulation
      setTimeout(() => {
        setPromotionQueue(prev => prev?.map(p => 
          p?.id === newPromotion?.id 
            ? { ...p, status: 'pending_approval', validationsPassed: p?.validationsTotal }
            : p
        ));
      }, 2000);
      
    } catch (error) {
      console.error('Failed to promote environment:', error);
    } finally {
      setPromotingId(null);
    }
  };

  const handleApproval = async (promotionId, action) => {
    try {
      console.log(`${action} promotion ${promotionId}`);
      
      // Update promotion status
      setPromotionQueue(prev => prev?.map(p => 
        p?.id === promotionId 
          ? { 
              ...p, 
              status: action === 'approve' ? 'approved' : 'rejected',
              approvals: [...(p?.approvals || []), {
                user: 'current.user',
                status: action === 'approve' ? 'approved' : 'rejected',
                timestamp: new Date()?.toISOString()
              }]
            }
          : p
      ));
      
      if (action === 'approve') {
        // Simulate deployment
        setTimeout(() => {
          setPromotionQueue(prev => prev?.map(p => 
            p?.id === promotionId 
              ? { ...p, status: 'deploying' }
              : p
          ));
        }, 1000);
        
        setTimeout(() => {
          setPromotionQueue(prev => prev?.map(p => 
            p?.id === promotionId 
              ? { ...p, status: 'completed' }
              : p
          ));
        }, 3000);
      }
      
    } catch (error) {
      console.error(`Failed to ${action} promotion:`, error);
    } finally {
      setShowApprovalModal(null);
    }
  };

  const getEnvironmentIcon = (type) => {
    switch (type) {
      case 'development':
        return <Settings className="h-5 w-5 text-blue-500" />;
      case 'staging':
        return <Eye className="h-5 w-5 text-yellow-500" />;
      case 'production':
        return <Globe className="h-5 w-5 text-green-500" />;
      default:
        return <Database className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': case'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'deploying': case'validation_running':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'pending_approval':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'failed': case'rejected':
        return 'text-red-700 bg-red-50 border-red-200';
      case 'deploying': case'validation_running':
        return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'pending_approval':
        return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Activity className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading environment data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Environment Overview */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Environment Status</h3>
          <p className="text-sm text-gray-600 mt-1">Current status of all deployment environments</p>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {environments?.map((env) => (
              <div key={env?.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {getEnvironmentIcon(env?.type)}
                    <div>
                      <h4 className="font-semibold text-gray-900">{env?.name}</h4>
                      <div className="text-sm text-gray-500">{env?.url}</div>
                    </div>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${
                    env?.status === 'healthy' ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-gray-600">Current Version</div>
                    <div className="font-mono text-sm text-gray-900">{env?.currentVersion}</div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-600">Branch</div>
                    <div className="flex items-center space-x-1">
                      <GitBranch className="h-3 w-3 text-gray-500" />
                      <span className="font-mono text-sm text-gray-900">{env?.branch}</span>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-600">Health Checks</div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">{env?.healthChecks} passing</span>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-600 mb-2">Resource Usage</div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>CPU: {env?.resources?.cpu}%</span>
                        <span>Memory: {env?.resources?.memory}%</span>
                        <span>Storage: {env?.resources?.storage}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-gray-500">
                    Last deployed: {new Date(env?.lastDeployment)?.toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Promotion Controls */}
          <div className="mt-8 flex justify-center">
            <div className="flex items-center space-x-8">
              {/* Dev to Staging */}
              <button
                onClick={() => handlePromotion('development', 'staging')}
                disabled={promotingId === 'development-staging'}
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
              >
                {promotingId === 'development-staging' ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="h-4 w-4" />
                )}
                <span>Promote to Staging</span>
              </button>

              {/* Staging to Production */}
              <button
                onClick={() => handlePromotion('staging', 'production')}
                disabled={promotingId === 'staging-production'}
                className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
              >
                {promotingId === 'staging-production' ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="h-4 w-4" />
                )}
                <span>Promote to Production</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Promotion Queue */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Promotion Queue</h3>
          <p className="text-sm text-gray-600 mt-1">Active and pending environment promotions</p>
        </div>

        <div className="p-6">
          {promotionQueue?.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">No Active Promotions</h4>
              <p className="text-gray-600">All environments are up to date</p>
            </div>
          ) : (
            <div className="space-y-4">
              {promotionQueue?.map((promotion) => (
                <div key={promotion?.id} className={`border rounded-lg p-4 ${getStatusColor(promotion?.status)}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(promotion?.status)}
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {promotion?.fromEnvironment} → {promotion?.toEnvironment}
                        </h4>
                        <div className="text-sm text-gray-600">
                          Version: {promotion?.version} • By: {promotion?.createdBy}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(promotion?.status)}`}>
                        {promotion?.status?.replace('_', ' ')}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(promotion?.createdAt)?.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Validation Progress */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Validations</span>
                      <span className="text-sm font-medium">
                        {promotion?.validationsPassed}/{promotion?.validationsTotal} passed
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          promotion?.validationsPassed === promotion?.validationsTotal ? 'bg-green-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${(promotion?.validationsPassed / promotion?.validationsTotal) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Approval Status */}
                  {promotion?.toEnvironment === 'production' && (
                    <div className="mb-3">
                      <div className="text-sm text-gray-600 mb-2">Approvals</div>
                      <div className="flex items-center space-x-2">
                        {promotion?.approvals?.map((approval, index) => (
                          <div key={index} className="flex items-center space-x-1">
                            {approval?.status === 'approved' ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                            <span className="text-xs text-gray-600">{approval?.user}</span>
                          </div>
                        ))}
                        {promotion?.status === 'pending_approval' && promotion?.approvals?.length === 0 && (
                          <button
                            onClick={() => setShowApprovalModal(promotion?.id)}
                            className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-medium hover:bg-yellow-200 transition-colors"
                          >
                            Pending Approval
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-end space-x-2">
                    {promotion?.status === 'pending_approval' && (
                      <button
                        onClick={() => setShowApprovalModal(promotion?.id)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Review & Approve
                      </button>
                    )}
                    {(promotion?.status === 'failed' || promotion?.status === 'rejected') && (
                      <button
                        onClick={() => handlePromotion(promotion?.fromEnvironment, promotion?.toEnvironment)}
                        className="text-green-600 hover:text-green-800 text-sm font-medium flex items-center space-x-1"
                      >
                        <RotateCcw className="h-3 w-3" />
                        <span>Retry</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {/* Validation Rules */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Validation Rules</h3>
          <p className="text-sm text-gray-600 mt-1">Automated checks required for environment promotions</p>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {validationRules?.map((rule) => (
              <div key={rule?.id} className={`border rounded-lg p-3 ${
                rule?.success === false ? 'border-red-200 bg-red-50' : 'border-gray-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {rule?.type === 'automated' ? (
                      <Zap className="h-4 w-4 text-blue-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-purple-500" />
                    )}
                    <span className="font-medium text-gray-900">{rule?.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {rule?.required && (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                        Required
                      </span>
                    )}
                    {rule?.type === 'automated' && (
                      rule?.success ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : rule?.success === false ? (
                        <XCircle className="h-4 w-4 text-red-500" />
                      ) : (
                        <Clock className="h-4 w-4 text-gray-400" />
                      )
                    )}
                  </div>
                </div>
                
                {rule?.type === 'automated' && (
                  <div className="text-xs text-gray-500">
                    Last run: {new Date(rule?.lastRun)?.toLocaleString()}
                    {rule?.error && (
                      <div className="text-red-600 mt-1">{rule?.error}</div>
                    )}
                  </div>
                )}

                {rule?.environments && (
                  <div className="text-xs text-gray-500 mt-1">
                    Applies to: {rule?.environments?.join(', ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Approval Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex items-center mb-4">
              <AlertTriangle className="h-6 w-6 text-yellow-500 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Approve Promotion</h3>
            </div>
            
            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-4">
                Review the promotion request and provide approval for deployment to production environment.
              </p>
              
              {/* Promotion Details */}
              {promotionQueue?.find(p => p?.id === showApprovalModal) && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-sm space-y-1">
                    <div><strong>Version:</strong> {promotionQueue?.find(p => p?.id === showApprovalModal)?.version}</div>
                    <div><strong>From:</strong> {promotionQueue?.find(p => p?.id === showApprovalModal)?.fromEnvironment}</div>
                    <div><strong>To:</strong> {promotionQueue?.find(p => p?.id === showApprovalModal)?.toEnvironment}</div>
                    <div><strong>Created by:</strong> {promotionQueue?.find(p => p?.id === showApprovalModal)?.createdBy}</div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowApprovalModal(null)}
                className="bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleApproval(showApprovalModal, 'reject')}
                className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Reject
              </button>
              <button
                onClick={() => handleApproval(showApprovalModal, 'approve')}
                className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnvironmentPromotionControls;