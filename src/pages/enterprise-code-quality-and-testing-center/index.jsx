import React, { useState, useEffect } from 'react';
import { Code, TestTube, Bug, Shield, Zap, FileCheck, GitBranch, AlertCircle, CheckCircle, XCircle, Clock, TrendingUp, TrendingDown, RefreshCw, Play, Download } from 'lucide-react';
import RequireRole from '../../auth/RequireRole';
import TestResultsGrid from './components/TestResultsGrid';
import CodeMetricsPanel from './components/CodeMetricsPanel';
import SecurityScanResults from './components/SecurityScanResults';
import Icon from '../../components/AppIcon';


const EnterpriseCodeQualityAndTestingCenter = () => {
  const [loading, setLoading] = useState(false);
  const [activeView, setActiveView] = useState('overview');
  const [testResults, setTestResults] = useState(null);
  const [codeMetrics, setCodeMetrics] = useState(null);
  const [buildStatus, setBuildStatus] = useState('success');
  const [deploymentStatus, setDeploymentStatus] = useState('ready');

  // Load initial data
  useEffect(() => {
    loadQualityData();
  }, []);

  const loadQualityData = async () => {
    setLoading(true);
    try {
      // Simulate loading quality metrics
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setTestResults({
        total: 47,
        passed: 45,
        failed: 2,
        coverage: 85.4,
        duration: 12.3,
        lastRun: new Date()?.toISOString()
      });

      setCodeMetrics({
        eslint: {
          errors: 0,
          warnings: 3,
          status: 'good',
          files: 127
        },
        prettier: {
          formatted: 100,
          unformatted: 0,
          status: 'excellent'
        },
        typescript: {
          errors: 0,
          warnings: 1,
          status: 'good'
        },
        complexity: {
          average: 3.2,
          max: 8,
          status: 'good'
        },
        duplicates: {
          percentage: 2.1,
          lines: 156,
          status: 'good'
        },
        maintainability: {
          index: 74,
          status: 'good'
        }
      });
    } catch (error) {
      console.error('Error loading quality data:', error);
    } finally {
      setLoading(false);
    }
  };

  const runTests = async () => {
    setLoading(true);
    try {
      // Simulate test execution
      await new Promise(resolve => setTimeout(resolve, 3000));
      await loadQualityData();
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'excellent': case'good': case'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'error': case'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'excellent': case'good': case'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'error': case'failed':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Test Coverage</p>
              <p className="text-2xl font-semibold text-gray-900">
                {testResults?.coverage}%
              </p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <TestTube className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-2 flex items-center">
            <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
            <span className="text-sm text-green-600">+2.4% desde la última semana</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">ESLint Errors</p>
              <p className="text-2xl font-semibold text-gray-900">
                {codeMetrics?.eslint?.errors}
              </p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Bug className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-2 flex items-center">
            <CheckCircle className="w-4 h-4 text-green-600 mr-1" />
            <span className="text-sm text-green-600">Sin errores críticos</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Build Status</p>
              <p className="text-2xl font-semibold text-gray-900 capitalize">
                {buildStatus}
              </p>
            </div>
            <div className={`p-2 rounded-lg ${buildStatus === 'success' ? 'bg-green-100' : 'bg-red-100'}`}>
              {getStatusIcon(buildStatus)}
            </div>
          </div>
          <div className="mt-2 flex items-center">
            <Clock className="w-4 h-4 text-gray-500 mr-1" />
            <span className="text-sm text-gray-500">Último build: hace 2 horas</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Bundle Size</p>
              <p className="text-2xl font-semibold text-gray-900">1.2MB</p>
            </div>
            <div className="p-2 bg-purple-100 rounded-lg">
              <Zap className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-2 flex items-center">
            <TrendingDown className="w-4 h-4 text-green-600 mr-1" />
            <span className="text-sm text-green-600">-15KB optimización</span>
          </div>
        </div>
      </div>

      {/* Test Results Summary */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Resumen de Pruebas
            </h3>
            <div className="flex items-center gap-3">
              <button
                onClick={runTests}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                {loading ? 'Ejecutando...' : 'Ejecutar Pruebas'}
              </button>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {testResults?.passed}
              </div>
              <div className="text-sm text-gray-600">Pruebas Exitosas</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600 mb-2">
                {testResults?.failed}
              </div>
              <div className="text-sm text-gray-600">Pruebas Fallidas</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {testResults?.duration}s
              </div>
              <div className="text-sm text-gray-600">Duración Total</div>
            </div>
          </div>

          {/* Test Categories */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <div className="font-medium text-gray-900">Payroll Utils Tests</div>
                  <div className="text-sm text-gray-500">Cálculos de nómina y utilidades</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-green-600">25/25 pasando</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <XCircle className="w-5 h-5 text-red-600" />
                <div>
                  <div className="font-medium text-gray-900">Component Tests</div>
                  <div className="text-sm text-gray-500">Pruebas de componentes React</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-red-600">18/20 pasando</span>
                <button className="text-sm text-blue-600 hover:underline">Ver fallos</button>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <div className="font-medium text-gray-900">Integration Tests</div>
                  <div className="text-sm text-gray-500">Pruebas de integración API</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-green-600">2/2 pasando</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Code Quality Metrics */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Métricas de Calidad del Código
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className={`p-4 rounded-lg border ${getStatusColor(codeMetrics?.eslint?.status)}`}>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold">ESLint</h4>
                {getStatusIcon(codeMetrics?.eslint?.status)}
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Errores:</span>
                  <span className="font-medium">{codeMetrics?.eslint?.errors}</span>
                </div>
                <div className="flex justify-between">
                  <span>Advertencias:</span>
                  <span className="font-medium">{codeMetrics?.eslint?.warnings}</span>
                </div>
                <div className="flex justify-between">
                  <span>Archivos:</span>
                  <span className="font-medium">{codeMetrics?.eslint?.files}</span>
                </div>
              </div>
            </div>

            <div className={`p-4 rounded-lg border ${getStatusColor(codeMetrics?.prettier?.status)}`}>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold">Prettier</h4>
                {getStatusIcon(codeMetrics?.prettier?.status)}
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Formateado:</span>
                  <span className="font-medium">{codeMetrics?.prettier?.formatted}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Sin formatear:</span>
                  <span className="font-medium">{codeMetrics?.prettier?.unformatted}</span>
                </div>
              </div>
            </div>

            <div className={`p-4 rounded-lg border ${getStatusColor(codeMetrics?.typescript?.status)}`}>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold">TypeScript</h4>
                {getStatusIcon(codeMetrics?.typescript?.status)}
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Errores:</span>
                  <span className="font-medium">{codeMetrics?.typescript?.errors}</span>
                </div>
                <div className="flex justify-between">
                  <span>Advertencias:</span>
                  <span className="font-medium">{codeMetrics?.typescript?.warnings}</span>
                </div>
              </div>
            </div>

            <div className={`p-4 rounded-lg border ${getStatusColor(codeMetrics?.complexity?.status)}`}>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold">Complejidad</h4>
                {getStatusIcon(codeMetrics?.complexity?.status)}
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Promedio:</span>
                  <span className="font-medium">{codeMetrics?.complexity?.average}</span>
                </div>
                <div className="flex justify-between">
                  <span>Máximo:</span>
                  <span className="font-medium">{codeMetrics?.complexity?.max}</span>
                </div>
              </div>
            </div>

            <div className={`p-4 rounded-lg border ${getStatusColor(codeMetrics?.duplicates?.status)}`}>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold">Duplicados</h4>
                {getStatusIcon(codeMetrics?.duplicates?.status)}
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Porcentaje:</span>
                  <span className="font-medium">{codeMetrics?.duplicates?.percentage}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Líneas:</span>
                  <span className="font-medium">{codeMetrics?.duplicates?.lines}</span>
                </div>
              </div>
            </div>

            <div className={`p-4 rounded-lg border ${getStatusColor(codeMetrics?.maintainability?.status)}`}>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold">Mantenibilidad</h4>
                {getStatusIcon(codeMetrics?.maintainability?.status)}
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Índice:</span>
                  <span className="font-medium">{codeMetrics?.maintainability?.index}/100</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTestDetails = () => (
    <TestResultsGrid testResults={testResults} onRunTests={runTests} loading={loading} />
  );

  const renderCodeMetrics = () => (
    <CodeMetricsPanel metrics={codeMetrics} onRefresh={loadQualityData} loading={loading} />
  );

  const renderSecurity = () => (
    <SecurityScanResults />
  );

  const renderDeploymentReadiness = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Lista de Verificación de Despliegue
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <div className="font-medium text-gray-900">Variables de entorno configuradas</div>
                <div className="text-sm text-gray-500">VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY</div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <div className="font-medium text-gray-900">Todas las pruebas pasan</div>
                <div className="text-sm text-gray-500">45/47 pruebas exitosas (96% success rate)</div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <div className="font-medium text-gray-900">Build optimizado</div>
                <div className="text-sm text-gray-500">Bundle size: 1.2MB con vendor chunks</div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <div className="font-medium text-gray-900">Dockerfile configurado</div>
                <div className="text-sm text-gray-500">Multi-stage build con Nginx</div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <div>
                <div className="font-medium text-gray-900">Migración de base de datos</div>
                <div className="text-sm text-gray-500">Verificar que las migraciones estén aplicadas</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Estado de Despliegue</h4>
              <p className="text-sm text-gray-500">
                Sistema listo para producción con advertencias menores
              </p>
            </div>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor('warning')}`}>
              {getStatusIcon('warning')}
              <span className="ml-1">Listo con Advertencias</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  const views = [
    { id: 'overview', label: 'Resumen', icon: FileCheck },
    { id: 'tests', label: 'Pruebas Detalladas', icon: TestTube },
    { id: 'metrics', label: 'Métricas de Código', icon: Code },
    { id: 'security', label: 'Seguridad', icon: Shield },
    { id: 'deployment', label: 'Preparación Deploy', icon: GitBranch }
  ];

  const renderContent = () => {
    switch (activeView) {
      case 'overview': return renderOverview();
      case 'tests': return renderTestDetails();
      case 'metrics': return renderCodeMetrics();
      case 'security': return renderSecurity();
      case 'deployment': return renderDeploymentReadiness();
      default: return renderOverview();
    }
  };

  return (
    <RequireRole allowedRoles={['Admin', 'SuperAdmin']}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Centro de Calidad de Código y Pruebas
                </h1>
                <p className="text-gray-600 mt-1">
                  Supervisión integral de la salud del código Nova HR
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={loadQualityData}
                  disabled={loading}
                  className="px-4 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  Actualizar
                </button>
                <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Exportar Reporte
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="border-b border-gray-200 bg-white">
            <nav className="flex space-x-8" aria-label="Tabs">
              {views?.map((view) => {
                const Icon = view?.icon;
                return (
                  <button
                    key={view?.id}
                    onClick={() => setActiveView(view?.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                      activeView === view?.id
                        ? 'border-blue-500 text-blue-600' :'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {view?.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {renderContent()}
        </div>
      </div>
    </RequireRole>
  );
};

export default EnterpriseCodeQualityAndTestingCenter;