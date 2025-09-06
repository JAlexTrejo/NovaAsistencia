import React from 'react';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Lock,
  Eye,
  Download,
  RefreshCw
} from 'lucide-react';

const SecurityScanResults = () => {
  const vulnerabilities = [
    {
      id: 'npm-audit-001',
      severity: 'moderate',
      package: 'axios',
      version: '1.8.4',
      title: 'Potential ReDoS vulnerability',
      description: 'Regular expression denial of service vulnerability in axios request parsing',
      fixedIn: '1.9.0',
      status: 'pending',
      cve: 'CVE-2024-12345'
    },
    {
      id: 'npm-audit-002',
      severity: 'low',
      package: 'vite',
      version: '5.2.0',
      title: 'Development server exposure',
      description: 'Development server may expose sensitive information in production builds',
      fixedIn: '5.2.1',
      status: 'acknowledged',
      cve: null
    }
  ];

  const securityChecks = [
    {
      name: 'Dependency Vulnerabilities',
      status: 'warning',
      issues: 2,
      description: 'Found 2 moderate/low vulnerabilities in dependencies',
      lastScan: '2025-01-11 19:30:00'
    },
    {
      name: 'Environment Variables',
      status: 'good',
      issues: 0,
      description: 'No sensitive data exposed in client-side environment',
      lastScan: '2025-01-11 19:30:00'
    },
    {
      name: 'Code Secrets Detection',
      status: 'good',
      issues: 0,
      description: 'No hardcoded secrets or API keys detected',
      lastScan: '2025-01-11 19:30:00'
    },
    {
      name: 'HTTPS Configuration',
      status: 'good',
      issues: 0,
      description: 'All external requests use HTTPS',
      lastScan: '2025-01-11 19:30:00'
    },
    {
      name: 'Content Security Policy',
      status: 'warning',
      issues: 1,
      description: 'CSP headers not configured in production',
      lastScan: '2025-01-11 19:30:00'
    }
  ];

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'good':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Shield className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Análisis de Seguridad
          </h3>
          <p className="text-gray-600 mt-1">
            Escaneo de vulnerabilidades y revisión de seguridad
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Escanear
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 flex items-center gap-2">
            <Download className="w-4 h-4" />
            Exportar
          </button>
        </div>
      </div>
      {/* Security Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Vulnerabilidades</p>
              <p className="text-2xl font-semibold text-yellow-600">2</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-yellow-600" />
          </div>
          <div className="text-sm text-gray-500 mt-1">
            1 moderada, 1 baja
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Dependencias</p>
              <p className="text-2xl font-semibold text-green-600">45</p>
            </div>
            <Shield className="w-8 h-8 text-green-600" />
          </div>
          <div className="text-sm text-gray-500 mt-1">
            43 seguras, 2 con issues
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Exposición</p>
              <p className="text-2xl font-semibold text-green-600">Baja</p>
            </div>
            <Lock className="w-8 h-8 text-green-600" />
          </div>
          <div className="text-sm text-gray-500 mt-1">
            Sin secretos expuestos
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Último Escaneo</p>
              <p className="text-2xl font-semibold text-gray-900">Hoy</p>
            </div>
            <RefreshCw className="w-8 h-8 text-gray-600" />
          </div>
          <div className="text-sm text-gray-500 mt-1">
            19:30 GMT-6
          </div>
        </div>
      </div>
      {/* Security Checks */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h4 className="font-medium text-gray-900">Verificaciones de Seguridad</h4>
        </div>
        <div className="divide-y divide-gray-200">
          {securityChecks?.map((check, index) => (
            <div key={index} className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                {getStatusIcon(check?.status)}
                <div>
                  <h5 className="font-medium text-gray-900">{check?.name}</h5>
                  <p className="text-sm text-gray-600">{check?.description}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Último escaneo: {check?.lastScan}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {check?.issues > 0 && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    {check?.issues} issue{check?.issues > 1 ? 's' : ''}
                  </span>
                )}
                <button className="text-gray-400 hover:text-gray-600">
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Vulnerabilities List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h4 className="font-medium text-gray-900">Vulnerabilidades Detectadas</h4>
        </div>
        <div className="divide-y divide-gray-200">
          {vulnerabilities?.map((vuln, index) => (
            <div key={index} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getSeverityColor(vuln?.severity)}`}>
                      {vuln?.severity?.toUpperCase()}
                    </span>
                    {vuln?.cve && (
                      <span className="text-xs text-gray-500 font-mono">{vuln?.cve}</span>
                    )}
                    <span className="text-xs text-gray-500">#{vuln?.id}</span>
                  </div>
                  <h5 className="font-medium text-gray-900 mb-1">{vuln?.title}</h5>
                  <p className="text-sm text-gray-600 mb-2">{vuln?.description}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>Package: <span className="font-mono">{vuln?.package}@{vuln?.version}</span></span>
                    {vuln?.fixedIn && (
                      <span>Fixed in: <span className="font-mono text-green-600">{vuln?.fixedIn}</span></span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    vuln?.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    vuln?.status === 'acknowledged'? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {vuln?.status}
                  </span>
                </div>
              </div>
              
              {/* Remediation */}
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <h6 className="font-medium text-blue-900 mb-1">Remediación Recomendada:</h6>
                <p className="text-sm text-blue-800">
                  {vuln?.fixedIn ? 
                    `Actualizar ${vuln?.package} de la versión ${vuln?.version} a ${vuln?.fixedIn}` :
                    'Revisar la documentación del paquete para obtener actualizaciones de seguridad'
                  }
                </p>
                {vuln?.fixedIn && (
                  <div className="mt-2">
                    <code className="text-xs bg-blue-100 px-2 py-1 rounded text-blue-900">
                      npm update {vuln?.package}
                    </code>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Security Recommendations */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h4 className="font-medium text-gray-900">Recomendaciones de Seguridad</h4>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                <span className="text-blue-600 text-sm font-medium">1</span>
              </div>
              <div>
                <h5 className="font-medium text-gray-900">Implementar Content Security Policy (CSP)</h5>
                <p className="text-sm text-gray-600 mt-1">
                  Configurar headers CSP en el servidor web para prevenir ataques XSS y injection.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                <span className="text-blue-600 text-sm font-medium">2</span>
              </div>
              <div>
                <h5 className="font-medium text-gray-900">Automatizar escaneos de dependencias</h5>
                <p className="text-sm text-gray-600 mt-1">
                  Configurar GitHub Dependabot o herramientas similares para detectar vulnerabilidades automáticamente.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                <span className="text-blue-600 text-sm font-medium">3</span>
              </div>
              <div>
                <h5 className="font-medium text-gray-900">Revisar permisos de RLS en Supabase</h5>
                <p className="text-sm text-gray-600 mt-1">
                  Asegurar que todas las políticas de Row Level Security estén correctamente configuradas.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityScanResults;