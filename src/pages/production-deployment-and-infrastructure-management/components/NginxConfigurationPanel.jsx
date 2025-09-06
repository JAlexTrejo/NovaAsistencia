import React, { useState, useEffect } from 'react';
import { Server, Globe, CheckCircle, AlertTriangle, RefreshCw, Edit3, Save, Eye, Lock } from 'lucide-react';

const NginxConfigurationPanel = () => {
  const [nginxStatus, setNginxStatus] = useState({});
  const [configurations, setConfigurations] = useState([]);
  const [sslCertificates, setSslCertificates] = useState([]);
  const [loadBalancing, setLoadBalancing] = useState({});
  const [cacheSettings, setCacheSettings] = useState({});
  const [securityHeaders, setSecurityHeaders] = useState({});
  const [loading, setLoading] = useState(true);
  const [editingConfig, setEditingConfig] = useState(null);
  const [configContent, setConfigContent] = useState('');

  // Load Nginx configuration data
  useEffect(() => {
    loadNginxData();
  }, []);

  const loadNginxData = async () => {
    setLoading(true);
    try {
      // Simulate API calls for Nginx configuration
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock Nginx status
      setNginxStatus({
        status: 'running',
        version: '1.24.0',
        uptime: '15d 4h 23m',
        connections: 1847,
        requests: 2847293,
        requestsPerSecond: 127.3,
        loadTime: 0.034
      });

      // Mock configurations
      setConfigurations([
        {
          id: 'nova-hr-prod',
          name: 'Nova HR Production',
          domain: 'nova-hr.company.com',
          type: 'production',
          status: 'active',
          ssl: true,
          lastModified: new Date(Date.now() - 86400000)?.toISOString(),
          upstream: 'nova-hr-backend'
        },
        {
          id: 'nova-hr-staging',
          name: 'Nova HR Staging',
          domain: 'staging.nova-hr.company.com',
          type: 'staging',
          status: 'active',
          ssl: true,
          lastModified: new Date(Date.now() - 172800000)?.toISOString(),
          upstream: 'nova-hr-staging-backend'
        },
        {
          id: 'nova-hr-api',
          name: 'Nova HR API Gateway',
          domain: 'api.nova-hr.company.com',
          type: 'api',
          status: 'active',
          ssl: true,
          lastModified: new Date(Date.now() - 259200000)?.toISOString(),
          upstream: 'nova-hr-api-backend'
        }
      ]);

      // Mock SSL certificates
      setSslCertificates([
        {
          id: 'nova-hr-ssl',
          domain: 'nova-hr.company.com',
          issuer: 'Let\'s Encrypt',
          validFrom: new Date(Date.now() - 7776000000)?.toISOString(),
          validTo: new Date(Date.now() + 7776000000)?.toISOString(),
          status: 'valid',
          autoRenewal: true
        },
        {
          id: 'staging-ssl',
          domain: '*.staging.nova-hr.company.com',
          issuer: 'Let\'s Encrypt',
          validFrom: new Date(Date.now() - 7776000000)?.toISOString(),
          validTo: new Date(Date.now() + 604800000)?.toISOString(),
          status: 'expires_soon',
          autoRenewal: true
        }
      ]);

      // Mock load balancing configuration
      setLoadBalancing({
        enabled: true,
        algorithm: 'round_robin',
        healthChecks: true,
        failoverTimeout: 30,
        backends: [
          { id: 'backend-1', address: '10.0.1.10:3000', status: 'healthy', weight: 1 },
          { id: 'backend-2', address: '10.0.1.11:3000', status: 'healthy', weight: 1 },
          { id: 'backend-3', address: '10.0.1.12:3000', status: 'maintenance', weight: 0 }
        ]
      });

      // Mock cache settings
      setCacheSettings({
        enabled: true,
        staticCache: '1d',
        apiCache: '5m',
        gzipEnabled: true,
        brotliEnabled: true,
        cacheHitRate: 87.3,
        purgedToday: 23
      });

      // Mock security headers
      setSecurityHeaders({
        hsts: { enabled: true, maxAge: 31536000 },
        csp: { enabled: true, policy: 'default-src \'self\'; script-src \'self\' \'unsafe-inline\'' },
        xFrameOptions: 'DENY',
        xContentTypeOptions: 'nosniff',
        referrerPolicy: 'strict-origin-when-cross-origin',
        permissionsPolicy: 'geolocation=(), microphone=(), camera=()'
      });

    } catch (error) {
      console.error('Failed to load Nginx data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfigEdit = (configId) => {
    setEditingConfig(configId);
    // Mock config content
    setConfigContent(`
server {
    listen 443 ssl http2;
    server_name nova-hr.company.com;

    ssl_certificate /etc/ssl/certs/nova-hr.crt;
    ssl_certificate_key /etc/ssl/private/nova-hr.key;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    
    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript;
    
    # Cache static assets
    location ~* \\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Proxy to backend
    location / {
        proxy_pass http://nova-hr-backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
    `);
  };

  const handleConfigSave = async () => {
    try {
      // Simulate saving configuration
      console.log('Saving Nginx configuration...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update last modified timestamp
      setConfigurations(prev => prev?.map(config => 
        config?.id === editingConfig 
          ? { ...config, lastModified: new Date()?.toISOString() }
          : config
      ));
      
      setEditingConfig(null);
      setConfigContent('');
    } catch (error) {
      console.error('Failed to save configuration:', error);
    }
  };

  const handleNginxAction = async (action) => {
    try {
      console.log(`Executing Nginx action: ${action}`);
      switch (action) {
        case 'reload': console.log('Reloading Nginx configuration...');
          break;
        case 'restart': console.log('Restarting Nginx service...');
          break;
        case 'test': console.log('Testing Nginx configuration...');
          break;
        default:
          console.log(`Unknown action: ${action}`);
      }
    } catch (error) {
      console.error(`Failed to execute ${action}:`, error);
    }
  };

  const getCertificateStatus = (cert) => {
    const daysUntilExpiry = Math.floor((new Date(cert?.validTo)?.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysUntilExpiry < 7) return 'expires_soon';
    if (daysUntilExpiry < 30) return 'warning';
    return 'valid';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Server className="h-8 w-8 animate-pulse text-blue-600" />
        <span className="ml-2 text-gray-600">Loading Nginx configuration...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Nginx Status Overview */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Nginx Status</h3>
            <p className="text-sm text-gray-600">Web server and reverse proxy status</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              nginxStatus?.status === 'running' ? 'bg-green-500' : 'bg-red-500'
            }`} />
            <span className={`font-medium ${
              nginxStatus?.status === 'running' ? 'text-green-600' : 'text-red-600'
            }`}>
              {nginxStatus?.status}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{nginxStatus?.connections?.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Active Connections</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{nginxStatus?.requests?.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Total Requests</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{nginxStatus?.requestsPerSecond}</div>
            <div className="text-sm text-gray-600">Requests/Second</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{nginxStatus?.uptime}</div>
            <div className="text-sm text-gray-600">Uptime</div>
          </div>
        </div>

        <div className="mt-6 flex space-x-2">
          <button
            onClick={() => handleNginxAction('reload')}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Reload Config</span>
          </button>
          <button
            onClick={() => handleNginxAction('restart')}
            className="bg-orange-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-orange-700 transition-colors flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Restart Service</span>
          </button>
          <button
            onClick={() => handleNginxAction('test')}
            className="bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700 transition-colors flex items-center space-x-2"
          >
            <CheckCircle className="h-4 w-4" />
            <span>Test Config</span>
          </button>
        </div>
      </div>
      {/* Server Configurations */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Server Configurations</h3>
          <p className="text-sm text-gray-600 mt-1">Virtual host configurations and settings</p>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {configurations?.map((config) => (
              <div key={config?.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Globe className="h-5 w-5 text-blue-500" />
                    <span className="font-medium text-gray-900">{config?.name}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    {config?.ssl && <Lock className="h-4 w-4 text-green-500" />}
                    <div className={`w-2 h-2 rounded-full ${
                      config?.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                    }`} />
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="text-sm">
                    <span className="text-gray-600">Domain: </span>
                    <span className="font-mono text-gray-900">{config?.domain}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-600">Type: </span>
                    <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                      config?.type === 'production' ? 'bg-green-100 text-green-800' :
                      config?.type === 'staging'? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {config?.type}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-600">Upstream: </span>
                    <span className="font-mono text-gray-900">{config?.upstream}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    Modified: {new Date(config?.lastModified)?.toLocaleDateString()}
                  </span>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleConfigEdit(config?.id)}
                      className="text-blue-600 hover:text-blue-800"
                      title="Edit Configuration"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      className="text-gray-600 hover:text-gray-800"
                      title="View Configuration"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* SSL Certificates */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">SSL Certificates</h3>
          <p className="text-sm text-gray-600 mt-1">SSL certificate management and status</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Domain
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Issuer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valid Until
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Auto-Renewal
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sslCertificates?.map((cert) => {
                const status = getCertificateStatus(cert);
                const daysUntilExpiry = Math.floor((new Date(cert?.validTo)?.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                
                return (
                  <tr key={cert?.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Lock className="h-4 w-4 text-green-500 mr-2" />
                        <span className="font-mono text-sm text-gray-900">{cert?.domain}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {cert?.issuer}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(cert?.validTo)?.toLocaleDateString()}
                      <div className="text-xs text-gray-500">
                        ({daysUntilExpiry} days remaining)
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        status === 'valid' ? 'bg-green-100 text-green-800' :
                        status === 'warning'? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {status === 'valid' ? 'Valid' :
                         status === 'warning'? 'Expires Soon' : 'Critical'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {cert?.autoRenewal ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      {/* Performance & Caching */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Load Balancing */}
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Load Balancing</h3>
          </div>
          <div className="p-6">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Algorithm</span>
                <span className="font-mono text-sm text-gray-900">{loadBalancing?.algorithm}</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Health Checks</span>
                <span className={`text-sm ${loadBalancing?.healthChecks ? 'text-green-600' : 'text-red-600'}`}>
                  {loadBalancing?.healthChecks ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Backend Servers</h4>
              {loadBalancing?.backends?.map((backend) => (
                <div key={backend?.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="font-mono text-sm">{backend?.address}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Weight: {backend?.weight}</span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      backend?.status === 'healthy' ? 'bg-green-100 text-green-800' :
                      backend?.status === 'maintenance'? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {backend?.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Caching */}
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Caching & Compression</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Cache Hit Rate</span>
                <span className="text-xl font-bold text-green-600">{cacheSettings?.cacheHitRate}%</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Static Cache:</span>
                  <span className="ml-2 font-mono">{cacheSettings?.staticCache}</span>
                </div>
                <div>
                  <span className="text-gray-600">API Cache:</span>
                  <span className="ml-2 font-mono">{cacheSettings?.apiCache}</span>
                </div>
                <div>
                  <span className="text-gray-600">Gzip:</span>
                  <span className={`ml-2 ${cacheSettings?.gzipEnabled ? 'text-green-600' : 'text-red-600'}`}>
                    {cacheSettings?.gzipEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Brotli:</span>
                  <span className={`ml-2 ${cacheSettings?.brotliEnabled ? 'text-green-600' : 'text-red-600'}`}>
                    {cacheSettings?.brotliEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="text-sm text-gray-600">Cache purged today: {cacheSettings?.purgedToday}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Configuration Editor Modal */}
      {editingConfig && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Edit Configuration: {configurations?.find(c => c?.id === editingConfig)?.name}
              </h3>
              <button
                onClick={() => setEditingConfig(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-4">
              <textarea
                value={configContent}
                onChange={(e) => setConfigContent(e?.target?.value)}
                className="w-full h-96 p-4 border border-gray-300 rounded-md font-mono text-sm bg-gray-50 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Nginx configuration content..."
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setEditingConfig(null)}
                className="bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfigSave}
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>Save Configuration</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NginxConfigurationPanel;