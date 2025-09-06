import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, CheckCircle, XCircle, Activity, FileText, RefreshCw, Database } from 'lucide-react';

const SecurityComplianceMonitor = () => {
  const [securityScore, setSecurityScore] = useState(0);
  const [vulnerabilities, setVulnerabilities] = useState([]);
  const [complianceStatus, setComplianceStatus] = useState({});
  const [penetrationTests, setPenetrationTests] = useState([]);
  const [securityPolicies, setSecurityPolicies] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);

  // Load security and compliance data
  useEffect(() => {
    loadSecurityData();
  }, []);

  const loadSecurityData = async () => {
    setLoading(true);
    try {
      // Simulate API calls for security data
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock security score
      setSecurityScore(94.2);

      // Mock vulnerabilities
      setVulnerabilities([
        {
          id: 'vuln-001',
          title: 'Outdated SSL Certificate',
          severity: 'medium',
          category: 'encryption',
          status: 'open',
          discoveredAt: new Date(Date.now() - 259200000)?.toISOString(),
          description: 'SSL certificate for staging.nova-hr.company.com expires in 7 days',
          recommendation: 'Renew SSL certificate before expiration',
          affectedAssets: ['staging.nova-hr.company.com'],
          cvss: 5.3
        },
        {
          id: 'vuln-002',
          title: 'Missing Security Headers',
          severity: 'low',
          category: 'configuration',
          status: 'resolved',
          discoveredAt: new Date(Date.now() - 432000000)?.toISOString(),
          resolvedAt: new Date(Date.now() - 86400000)?.toISOString(),
          description: 'Content Security Policy header not configured properly',
          recommendation: 'Implement proper CSP headers in Nginx configuration',
          affectedAssets: ['api.nova-hr.company.com'],
          cvss: 3.1
        },
        {
          id: 'vuln-003',
          title: 'Exposed Database Port',
          severity: 'high',
          category: 'network',
          status: 'open',
          discoveredAt: new Date(Date.now() - 172800000)?.toISOString(),
          description: 'PostgreSQL port 5432 is exposed to public internet',
          recommendation: 'Restrict database access to application servers only',
          affectedAssets: ['db-primary.nova-hr.internal'],
          cvss: 7.8
        }
      ]);

      // Mock compliance status
      setComplianceStatus({
        overall: 'compliant',
        frameworks: [
          {
            name: 'SOC 2 Type II',
            status: 'compliant',
            score: 98,
            lastAudit: new Date(Date.now() - 7776000000)?.toISOString(),
            nextAudit: new Date(Date.now() + 7776000000)?.toISOString(),
            issues: 2
          },
          {
            name: 'ISO 27001',
            status: 'partial',
            score: 87,
            lastAudit: new Date(Date.now() - 15552000000)?.toISOString(),
            nextAudit: new Date(Date.now() + 2592000000)?.toISOString(),
            issues: 8
          },
          {
            name: 'PCI DSS',
            status: 'non_compliant',
            score: 72,
            lastAudit: new Date(Date.now() - 5184000000)?.toISOString(),
            nextAudit: new Date(Date.now() + 1296000000)?.toISOString(),
            issues: 15
          }
        ]
      });

      // Mock penetration test results
      setPenetrationTests([
        {
          id: 'pentest-001',
          name: 'Quarterly Security Assessment',
          type: 'external',
          status: 'completed',
          startDate: new Date(Date.now() - 604800000)?.toISOString(),
          endDate: new Date(Date.now() - 518400000)?.toISOString(),
          findings: {
            critical: 0,
            high: 1,
            medium: 3,
            low: 7,
            info: 12
          },
          scope: ['nova-hr.company.com', 'api.nova-hr.company.com'],
          tester: 'CyberSec Solutions',
          reportUrl: '#'
        },
        {
          id: 'pentest-002',
          name: 'Internal Network Scan',
          type: 'internal',
          status: 'in_progress',
          startDate: new Date(Date.now() - 86400000)?.toISOString(),
          endDate: null,
          findings: {
            critical: 0,
            high: 0,
            medium: 2,
            low: 4,
            info: 8
          },
          scope: ['10.0.0.0/16'],
          tester: 'Internal Security Team',
          reportUrl: null
        }
      ]);

      // Mock security policies
      setSecurityPolicies([
        {
          id: 'policy-001',
          name: 'Password Policy',
          category: 'authentication',
          status: 'active',
          compliance: 100,
          lastReview: new Date(Date.now() - 2592000000)?.toISOString(),
          nextReview: new Date(Date.now() + 10368000000)?.toISOString()
        },
        {
          id: 'policy-002',
          name: 'Data Encryption Standard',
          category: 'encryption',
          status: 'active',
          compliance: 95,
          lastReview: new Date(Date.now() - 5184000000)?.toISOString(),
          nextReview: new Date(Date.now() + 7776000000)?.toISOString()
        },
        {
          id: 'policy-003',
          name: 'Access Control Policy',
          category: 'authorization',
          status: 'under_review',
          compliance: 82,
          lastReview: new Date(Date.now() - 7776000000)?.toISOString(),
          nextReview: new Date(Date.now() + 1296000000)?.toISOString()
        }
      ]);

      // Mock audit logs
      setAuditLogs([
        {
          id: 'audit-001',
          timestamp: new Date(Date.now() - 3600000)?.toISOString(),
          event: 'Security scan initiated',
          severity: 'info',
          user: 'security.bot',
          category: 'scanning',
          details: 'Automated vulnerability scan started'
        },
        {
          id: 'audit-002',
          timestamp: new Date(Date.now() - 7200000)?.toISOString(),
          event: 'Failed login attempt detected',
          severity: 'warning',
          user: 'unknown',
          category: 'authentication',
          details: 'Multiple failed login attempts from IP 192.168.1.100'
        },
        {
          id: 'audit-003',
          timestamp: new Date(Date.now() - 10800000)?.toISOString(),
          event: 'SSL certificate renewed',
          severity: 'info',
          user: 'system',
          category: 'encryption',
          details: 'SSL certificate for nova-hr.company.com renewed successfully'
        }
      ]);

    } catch (error) {
      console.error('Failed to load security data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSecurityScan = async () => {
    setScanning(true);
    try {
      console.log('Starting security scan...');
      // Simulate security scan
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Refresh data after scan
      await loadSecurityData();
      
    } catch (error) {
      console.error('Failed to run security scan:', error);
    } finally {
      setScanning(false);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'text-red-800 bg-red-100 border-red-200';
      case 'high':
        return 'text-red-700 bg-red-50 border-red-200';
      case 'medium':
        return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-blue-700 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const getComplianceColor = (status) => {
    switch (status) {
      case 'compliant':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'partial':
        return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'non_compliant':
        return 'text-red-700 bg-red-50 border-red-200';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const getSecurityScoreColor = (score) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Shield className="h-8 w-8 animate-pulse text-blue-600" />
        <span className="ml-2 text-gray-600">Loading security compliance data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Security Score Overview */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Security Compliance Overview</h3>
            <p className="text-sm text-gray-600">Current security posture and compliance status</p>
          </div>
          <button
            onClick={handleSecurityScan}
            disabled={scanning}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
          >
            {scanning ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Shield className="h-4 w-4" />
            )}
            <span>{scanning ? 'Scanning...' : 'Run Security Scan'}</span>
          </button>
        </div>

        <div className="text-center mb-6">
          <div className={`text-6xl font-bold mb-2 ${getSecurityScoreColor(securityScore)}`}>
            {securityScore}
          </div>
          <div className="text-lg text-gray-700">Overall Security Score</div>
          <div className="text-sm text-gray-500">Based on vulnerabilities, compliance, and policies</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-900">
              {vulnerabilities?.filter(v => v?.status === 'resolved')?.length}
            </div>
            <div className="text-sm text-green-700">Resolved Issues</div>
          </div>
          
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <XCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-red-900">
              {vulnerabilities?.filter(v => v?.status === 'open')?.length}
            </div>
            <div className="text-sm text-red-700">Open Vulnerabilities</div>
          </div>
          
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <Activity className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-blue-900">
              {penetrationTests?.filter(t => t?.status === 'completed')?.length}
            </div>
            <div className="text-sm text-blue-700">Penetration Tests</div>
          </div>
        </div>
      </div>
      {/* Vulnerabilities */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Security Vulnerabilities</h3>
          <p className="text-sm text-gray-600 mt-1">Identified security issues and remediation status</p>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            {vulnerabilities?.map((vuln) => (
              <div key={vuln?.id} className={`border rounded-lg p-4 ${
                vuln?.status === 'resolved' ? 'opacity-75' : ''
              }`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded ${
                      vuln?.severity === 'high' ? 'bg-red-100' :
                      vuln?.severity === 'medium'? 'bg-yellow-100' : 'bg-blue-100'
                    }`}>
                      <AlertTriangle className={`h-5 w-5 ${
                        vuln?.severity === 'high' ? 'text-red-600' :
                        vuln?.severity === 'medium'? 'text-yellow-600' : 'text-blue-600'
                      }`} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{vuln?.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{vuln?.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(vuln?.severity)}`}>
                      {vuln?.severity}
                    </span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      vuln?.status === 'resolved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {vuln?.status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">CVSS Score: </span>
                    <span className="font-medium">{vuln?.cvss}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Category: </span>
                    <span className="font-medium capitalize">{vuln?.category}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Discovered: </span>
                    <span className="font-medium">{new Date(vuln?.discoveredAt)?.toLocaleDateString()}</span>
                  </div>
                  {vuln?.resolvedAt && (
                    <div>
                      <span className="text-gray-600">Resolved: </span>
                      <span className="font-medium">{new Date(vuln?.resolvedAt)?.toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                <div className="mt-3 p-3 bg-blue-50 rounded-md">
                  <div className="text-sm">
                    <strong>Recommendation: </strong>
                    {vuln?.recommendation}
                  </div>
                  {vuln?.affectedAssets?.length > 0 && (
                    <div className="text-sm mt-2">
                      <strong>Affected Assets: </strong>
                      {vuln?.affectedAssets?.join(', ')}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Compliance Status */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Compliance Frameworks</h3>
          <p className="text-sm text-gray-600 mt-1">Regulatory compliance status and audit results</p>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {complianceStatus?.frameworks?.map((framework) => (
              <div key={framework?.name} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900">{framework?.name}</h4>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getComplianceColor(framework?.status)}`}>
                    {framework?.status?.replace('_', ' ')}
                  </span>
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Compliance Score</span>
                    <span className={`font-semibold ${getSecurityScoreColor(framework?.score)}`}>
                      {framework?.score}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        framework?.score >= 90 ? 'bg-green-500' :
                        framework?.score >= 70 ? 'bg-yellow-500': 'bg-red-500'
                      }`}
                      style={{ width: `${framework?.score}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Open Issues:</span>
                    <span className="font-medium">{framework?.issues}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Audit:</span>
                    <span className="font-medium">{new Date(framework?.lastAudit)?.toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Next Audit:</span>
                    <span className="font-medium">{new Date(framework?.nextAudit)?.toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Security Audit Logs */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Security Audit Trail</h3>
          <p className="text-sm text-gray-600 mt-1">Recent security events and system activities</p>
        </div>

        <div className="p-6">
          <div className="space-y-3">
            {auditLogs?.map((log) => (
              <div key={log?.id} className={`flex items-center space-x-3 p-3 rounded-lg border ${
                log?.severity === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                log?.severity === 'error'? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'
              }`}>
                <div className={`p-2 rounded-full ${
                  log?.severity === 'warning' ? 'bg-yellow-100' :
                  log?.severity === 'error'? 'bg-red-100' : 'bg-blue-100'
                }`}>
                  <FileText className={`h-4 w-4 ${
                    log?.severity === 'warning' ? 'text-yellow-600' :
                    log?.severity === 'error'? 'text-red-600' : 'text-blue-600'
                  }`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">{log?.event}</span>
                    <span className="text-sm text-gray-500">
                      {new Date(log?.timestamp)?.toLocaleString()}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">{log?.details}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    User: {log?.user} • Category: {log?.category}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityComplianceMonitor;