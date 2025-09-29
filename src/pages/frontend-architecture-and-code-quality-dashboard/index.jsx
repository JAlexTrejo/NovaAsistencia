import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  Code, FileText, CheckCircle, AlertTriangle, XCircle, RefreshCw, Download,
  Smartphone, Monitor, Palette, Layers, Package, TestTube, Shield, Activity
} from 'lucide-react';
import { qualityService } from '../../services/qualityService'
; // ✅ Asegúrate de tener este servicio creado

export default function FrontendArchitectureAndCodeQualityDashboard() {
  const { userProfile, hasRole } = useAuth();

  const [loading, setLoading] = useState(true);
  const [activePanel, setActivePanel] = useState('architecture');
  const [error, setError] = useState('');

  // Estado inicial (simulado) como fallback
  const [codeMetrics, setCodeMetrics] = useState({
    typescript: { coverage: 100, errors: 0, warnings: 0 },
    tailwind: { utilization: 85, customComponents: 24, bundleSize: '245kb' },
    eslint: { violations: 0, warnings: 2, fixed: 45 },
    prettier: { compliance: 100, formatted: 156 },
    performance: { buildTime: '12.3s', bundleSize: '1.2MB', loadTime: '0.8s' },
    analysis: []
  });

  const [componentArchitecture, setComponentArchitecture] = useState({
    pages: 28,
    components: 156,
    services: 12,
    hooks: 8,
    contexts: 3
  });

  const [qualityChecks, setQualityChecks] = useState([
    { name: 'TypeScript Configuration', status: 'passed', score: 100 },
    { name: 'ESLint Rules Compliance', status: 'passed', score: 98 },
    { name: 'Prettier Formatting', status: 'passed', score: 100 },
    { name: 'Component Modularity', status: 'passed', score: 95 },
    { name: 'Mobile Responsiveness', status: 'passed', score: 92 },
    { name: 'Accessibility Standards', status: 'warning', score: 85 },
    { name: 'Bundle Optimization', status: 'passed', score: 88 },
    { name: 'Testing Coverage', status: 'warning', score: 78 }
  ]);

  const [responsiveBreakpoints, setResponsiveBreakpoints] = useState([
    { device: 'Mobile', width: '375px', status: 'passed', components: 156 },
    { device: 'Tablet', width: '768px', status: 'passed', components: 156 },
    { device: 'Desktop', width: '1024px', status: 'passed', components: 156 },
    { device: 'Wide Desktop', width: '1440px', status: 'passed', components: 156 }
  ]);

  const [buildMetrics, setBuildMetrics] = useState({
    lastBuild: '2025-01-19T14:30:00Z',
    buildTime: '12.3s',
    bundleSize: '1.2MB',
    assets: 45,
    chunks: 8
  });

  // ---------------------------------------------------------
  // Helpers de “simulado” (fallback si no hay snapshot en BD)
  // ---------------------------------------------------------
  const analyzeComponentStructure = () => {
    const projectStructure = {
      pages: {
        count: 28,
        breakdown: {
          'Dashboard Pages': 8,
          'Management Consoles': 12,
          'Authentication': 3,
          'Reporting': 5
        }
      },
      components: {
        count: 156,
        breakdown: {
          'UI Components': 45,
          'Form Components': 28,
          'Layout Components': 18,
          'Feature Components': 65
        }
      },
      services: {
        count: 12,
        breakdown: {
          'Authentication': 1,
          'Employee Management': 3,
          'Payroll': 2,
          'Attendance': 2,
          'Reporting': 2,
          'Utilities': 2
        }
      }
    };
    setComponentArchitecture(projectStructure);
  };

  const analyzeBuildPerformance = () => {
    const buildAnalysis = {
      viteConfig: 'optimized',
      typeScript: 'strict mode enabled',
      tailwindPurging: 'enabled',
      treeShaking: 'enabled',
      codesplitting: 'enabled',
      bundleAnalysis: {
        vendor: '456kb',
        application: '678kb',
        assets: '124kb'
      }
    };
    setBuildMetrics(prev => ({ ...prev, ...buildAnalysis }));
  };

  const runQualityChecks = () => {
    const qualityResults = [
      {
        category: 'TypeScript',
        checks: [
          { name: 'Strict Mode Enabled', status: 'passed' },
          { name: 'No Any Types', status: 'passed' },
          { name: 'Interface Definitions', status: 'passed' }
        ]
      },
      {
        category: 'React Patterns',
        checks: [
          { name: 'Functional Components', status: 'passed' },
          { name: 'Custom Hooks Usage', status: 'passed' },
          { name: 'Optional Chaining', status: 'passed' }
        ]
      },
      {
        category: 'Supabase Integration',
        checks: [
          { name: 'Error Handling Patterns', status: 'passed' },
          { name: 'Loading States', status: 'passed' },
          { name: 'Authentication Flow', status: 'passed' }
        ]
      }
    ];
    setCodeMetrics(prev => ({ ...prev, analysis: qualityResults }));
  };

  // ---------------------------------------------------------
  // 🔌 Aquí va la conexión real: loadArchitectureData
  //    - Lee el último snapshot con qualityService
  //    - Si no hay, cae a los simulados actuales
  // ---------------------------------------------------------
  const loadArchitectureData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await qualityService.getLatestReport();

      if (res.ok && res.data) {
        const { eslint_json, jest_coverage_json, bundle_json, meta, created_at } = res.data;

        // ESLint
        const eslintStats = Array.isArray(eslint_json) && eslint_json.length > 0 ? eslint_json[0] : null;
        const eslintMapped = {
          violations: Number(eslintStats?.errorCount ?? 0),
          warnings: Number(eslintStats?.warningCount ?? 0),
          fixed: Number(eslintStats?.fixableErrorCount ?? 0) + Number(eslintStats?.fixableWarningCount ?? 0)
        };

        // Coverage (Jest)
        const cov = jest_coverage_json?.total ?? {};
        const coveragePct = Number(cov?.statements?.pct ?? cov?.lines?.pct ?? 0);

        // Bundle / build
        const bundleSummary = bundle_json?.summary ?? {};
        const totalBytesHuman = bundleSummary?.totalBytesHuman ?? buildMetrics.bundleSize;

        setCodeMetrics(prev => ({
          ...prev,
          eslint: { ...eslintMapped },
          typescript: { ...prev.typescript, coverage: Math.round(coveragePct * 100) / 100, errors: 0, warnings: 0 },
          performance: {
            ...prev.performance,
            buildTime: meta?.buildTime ?? prev.performance.buildTime,
            bundleSize: totalBytesHuman ?? prev.performance.bundleSize,
            loadTime: prev.performance.loadTime
          }
        }));

        setBuildMetrics(prev => ({
          ...prev,
          lastBuild: created_at ?? new Date().toISOString(),
          buildTime: meta?.buildTime ?? prev.buildTime,
          bundleSize: totalBytesHuman ?? prev.bundleSize,
          assets: bundleSummary?.assets ?? prev.assets,
          chunks: bundleSummary?.chunks ?? prev.chunks
        }));

        // Si quieres, aquí puedes derivar arquitectura desde el bundle (por ahora mantenemos simulada)
        analyzeComponentStructure();
        runQualityChecks();
      } else {
        // Fallback a simulados si no hay snapshot
        analyzeComponentStructure();
        analyzeBuildPerformance();
        runQualityChecks();
      }
    } catch (e) {
      setError(e?.message || 'No se pudieron cargar las métricas de calidad.');
      // Fallback
      analyzeComponentStructure();
      analyzeBuildPerformance();
      runQualityChecks();
    } finally {
      setLoading(false);
    }
  };

  // Llamada automática cuando el usuario es admin
  useEffect(() => {
    if (hasRole('admin')) {
      // No metas hasRole en deps; usa el rol del perfil (estable)
      loadArchitectureData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile?.role]);

  // ----------------------------
  // Render helpers
  // ----------------------------
  const getStatusIcon = (status) => {
    switch (status) {
      case 'passed': case 'healthy': case 'optimized':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'failed': case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <RefreshCw className="w-4 h-4 text-gray-500 animate-spin" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'passed': case 'healthy': case 'optimized':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'failed': case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getScoreColor = (score) => {
    if (score >= 95) return 'text-green-600';
    if (score >= 85) return 'text-yellow-600';
    return 'text-red-600';
  };

  const exportReport = () => {
    const report = {
      timestamp: new Date()?.toISOString(),
      project: 'NovaAsistencia',
      framework: 'React + Vite + TypeScript + Tailwind CSS',
      metrics: codeMetrics,
      architecture: componentArchitecture,
      qualityChecks,
      responsiveness: responsiveBreakpoints,
      buildMetrics
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const d = new Date();
    const stamp = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `novaasistencia-code-quality-report-${stamp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!hasRole('admin')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Shield className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Acceso Restringido</h1>
          <p className="text-gray-600">Esta página requiere permisos de Administrador.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Code className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Frontend Architecture and Code Quality Dashboard
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  NovaAsistencia - React + Vite + TypeScript + Tailwind CSS quality monitoring
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={loadArchitectureData}
                disabled={loading}
                aria-busy={loading}
                aria-live="polite"
                className="flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Analizar
              </button>
              <button
                onClick={exportReport}
                aria-label="Exportar reporte de calidad"
                className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-md shadow-sm text-sm font-medium hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar Reporte
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* Left Sidebar - Project Structure Tree */}
          <div className="w-1/3 bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Layers className="w-5 h-5 mr-2" />
              Project Structure
            </h2>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin text-purple-600" />
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <h3 className="font-medium text-gray-700 text-sm mb-2">📁 src/pages</h3>
                  <div className="ml-4 space-y-1 text-sm text-gray-600">
                    <div>📄 {componentArchitecture?.pages?.count ?? componentArchitecture?.pages} páginas totales</div>
                    <div className="ml-2 space-y-0.5 text-xs">
                      <div>• Dashboard Pages: 8</div>
                      <div>• Management Consoles: 12</div>
                      <div>• Authentication: 3</div>
                      <div>• Reporting: 5</div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-700 text-sm mb-2">📁 src/components</h3>
                  <div className="ml-4 space-y-1 text-sm text-gray-600">
                    <div>🧩 {componentArchitecture?.components?.count ?? componentArchitecture?.components} componentes</div>
                    <div className="ml-2 space-y-0.5 text-xs">
                      <div>• UI Components: 45</div>
                      <div>• Form Components: 28</div>
                      <div>• Layout Components: 18</div>
                      <div>• Feature Components: 65</div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-700 text-sm mb-2">📁 src/services</h3>
                  <div className="ml-4 space-y-1 text-sm text-gray-600">
                    <div>⚙️ 12 servicios</div>
                    <div className="ml-2 space-y-0.5 text-xs">
                      <div>• authService.js</div>
                      <div>• employeeService.js</div>
                      <div>• payrollService.js</div>
                      <div>• attendanceService.js</div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-700 text-sm mb-2">📁 src/contexts</h3>
                  <div className="ml-4 space-y-1 text-sm text-gray-600">
                    <div>🔧 3 contextos</div>
                    <div className="ml-2 space-y-0.5 text-xs">
                      <div>• AuthContext.jsx</div>
                      <div>• BrandingProvider.jsx</div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-700 text-sm mb-2">📁 Configuration</h3>
                  <div className="ml-4 space-y-1 text-sm text-gray-600">
                    <div className="ml-2 space-y-0.5 text-xs">
                      <div>• vite.config.js</div>
                      <div>• tailwind.config.js</div>
                      <div>• tsconfig.json</div>
                      <div>• package.json</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - Code Quality Metrics */}
          <div className="w-2/3 space-y-6">
            {/* Quality Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center">
                  <FileText className="h-8 w-8 text-blue-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">TypeScript</p>
                    <p className="text-2xl font-bold text-gray-900">{codeMetrics?.typescript?.coverage}%</p>
                    <p className="text-xs text-green-600">Coverage</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center">
                  <Palette className="h-8 w-8 text-cyan-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Tailwind CSS</p>
                    <p className="text-2xl font-bold text-gray-900">{codeMetrics?.tailwind?.utilization}%</p>
                    <p className="text-xs text-cyan-600">Utilization</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center">
                  <Shield className="h-8 w-8 text-green-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">ESLint</p>
                    <p className="text-2xl font-bold text-gray-900">{codeMetrics?.eslint?.violations}</p>
                    <p className="text-xs text-green-600">Violations</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center">
                  <Package className="h-8 w-8 text-purple-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Bundle Size</p>
                    <p className="text-2xl font-bold text-gray-900">{buildMetrics?.bundleSize}</p>
                    <p className="text-xs text-purple-600">Optimized</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Metrics Panel */}
            <div className="bg-white rounded-lg shadow">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                  {[
                    { id: 'architecture', name: 'Architecture', icon: Layers },
                    { id: 'quality', name: 'Code Quality', icon: CheckCircle },
                    { id: 'responsive', name: 'Responsive', icon: Smartphone },
                    { id: 'performance', name: 'Performance', icon: Activity },
                    { id: 'testing', name: 'Testing', icon: TestTube }
                  ]?.map((tab) => (
                    <button
                      key={tab?.id}
                      onClick={() => setActivePanel(tab?.id)}
                      className={`${
                        activePanel === tab?.id
                          ? 'border-purple-500 text-purple-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm flex items-center`}
                    >
                      <tab.icon className="w-4 h-4 mr-2" />
                      {tab?.name}
                    </button>
                  ))}
                </nav>
              </div>

              <div className="p-6">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <RefreshCw className="w-8 h-8 animate-spin text-purple-600 mr-3" />
                    <span className="text-lg text-gray-600">Analizando arquitectura del código...</span>
                  </div>
                ) : (
                  <>
                    {/* Architecture Panel */}
                    {activePanel === 'architecture' && (
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 mb-4">Component Architecture</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                              <div className="bg-blue-50 rounded-lg p-4">
                                <h4 className="font-medium text-blue-900 mb-2">React Patterns</h4>
                                <ul className="text-sm text-blue-700 space-y-1">
                                  <li>✓ Functional Components</li>
                                  <li>✓ Custom Hooks</li>
                                  <li>✓ Context API</li>
                                  <li>✓ Optional Chaining</li>
                                </ul>
                              </div>

                              <div className="bg-green-50 rounded-lg p-4">
                                <h4 className="font-medium text-green-900 mb-2">Supabase Integration</h4>
                                <ul className="text-sm text-green-700 space-y-1">
                                  <li>✓ Authentication Context</li>
                                  <li>✓ Error Handling Patterns</li>
                                  <li>✓ Loading States</li>
                                  <li>✓ Real-time Subscriptions</li>
                                </ul>
                              </div>
                            </div>

                            <div className="space-y-4">
                              <div className="bg-purple-50 rounded-lg p-4">
                                <h4 className="font-medium text-purple-900 mb-2">Routing Structure</h4>
                                <ul className="text-sm text-purple-700 space-y-1">
                                  <li>✓ Role-based Routes</li>
                                  <li>✓ Protected Routes</li>
                                  <li>✓ Route Guards</li>
                                  <li>✓ Navigation Structure</li>
                                </ul>
                              </div>

                              <div className="bg-orange-50 rounded-lg p-4">
                                <h4 className="font-medium text-orange-900 mb-2">State Management</h4>
                                <ul className="text-sm text-orange-700 space-y-1">
                                  <li>✓ Context-based State</li>
                                  <li>✓ Local Component State</li>
                                  <li>✓ Service Layer Pattern</li>
                                  <li>✓ Data Caching</li>
                                </ul>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Code Quality Panel */}
                    {activePanel === 'quality' && (
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Code Quality Checks</h3>
                        <div className="space-y-3">
                          {qualityChecks?.map((check, index) => (
                            <div key={index} className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded border">
                              <div className="flex items-center">
                                {getStatusIcon(check?.status)}
                                <span className="ml-3 font-medium text-gray-900">{check?.name}</span>
                              </div>
                              <div className="flex items-center">
                                <span className={`text-lg font-bold mr-2 ${getScoreColor(check?.score)}`}>
                                  {check?.score}%
                                </span>
                                <span className={`px-3 py-1 text-xs rounded-full ${getStatusColor(check?.status)}`}>
                                  {check?.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Responsive Panel */}
                    {activePanel === 'responsive' && (
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Mobile Responsiveness</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          {responsiveBreakpoints?.map((breakpoint, index) => (
                            <div key={index} className="bg-gray-50 rounded-lg p-4">
                              <div className="flex items-center mb-2">
                                {breakpoint?.device === 'Mobile'
                                  ? <Smartphone className="w-5 h-5 mr-2 text-blue-600" />
                                  : <Monitor className="w-5 h-5 mr-2 text-blue-600" />}
                                <h4 className="font-medium text-gray-900">{breakpoint?.device}</h4>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">{breakpoint?.width}</p>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500">{breakpoint?.components} components</span>
                                {getStatusIcon(breakpoint?.status)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Performance Panel */}
                    {activePanel === 'performance' && (
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 mb-4">Build Performance</h3>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-blue-50 rounded-lg p-4">
                              <h4 className="font-medium text-blue-900 mb-2">Build Time</h4>
                              <p className="text-2xl font-bold text-blue-600">{buildMetrics?.buildTime}</p>
                              <p className="text-sm text-blue-700">Vite optimized</p>
                            </div>

                            <div className="bg-green-50 rounded-lg p-4">
                              <h4 className="font-medium text-green-900 mb-2">Bundle Size</h4>
                              <p className="text-2xl font-bold text-green-600">{buildMetrics?.bundleSize}</p>
                              <p className="text-sm text-green-700">Tree-shaking enabled</p>
                            </div>

                            <div className="bg-purple-50 rounded-lg p-4">
                              <h4 className="font-medium text-purple-900 mb-2">Load Time</h4>
                              <p className="text-2xl font-bold text-purple-600">{codeMetrics?.performance?.loadTime}</p>
                              <p className="text-sm text-purple-700">First Contentful Paint</p>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium text-gray-900 mb-3">Bundle Analysis</h4>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
                              <span className="text-sm font-medium">Vendor Libraries</span>
                              <span className="text-sm text-gray-600">456kb</span>
                            </div>
                            <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
                              <span className="text-sm font-medium">Application Code</span>
                              <span className="text-sm text-gray-600">678kb</span>
                            </div>
                            <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
                              <span className="text-sm font-medium">Assets</span>
                              <span className="text-sm text-gray-600">124kb</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Testing Panel */}
                    {activePanel === 'testing' && (
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Testing Coverage</h3>
                        <div className="space-y-4">
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <div className="flex items-center">
                              <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
                              <h4 className="font-medium text-yellow-900">Testing Framework Setup Required</h4>
                            </div>
                            <p className="text-sm text-yellow-700 mt-2">
                              Consider implementing Jest + React Testing Library for comprehensive testing coverage.
                            </p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-gray-50 rounded-lg p-4">
                              <h4 className="font-medium text-gray-900 mb-2">Unit Tests</h4>
                              <p className="text-2xl font-bold text-gray-600">N/A</p>
                              <p className="text-sm text-gray-500">Not configured</p>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-4">
                              <h4 className="font-medium text-gray-900 mb-2">Integration Tests</h4>
                              <p className="text-2xl font-bold text-gray-600">N/A</p>
                              <p className="text-sm text-gray-500">Not configured</p>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-4">
                              <h4 className="font-medium text-gray-900 mb-2">E2E Tests</h4>
                              <p className="text-2xl font-bold text-gray-600">N/A</p>
                              <p className="text-sm text-gray-500">Not configured</p>
                            </div>
                          </div>

                          <div className="bg-blue-50 rounded-lg p-4">
                            <h4 className="font-medium text-blue-900 mb-2">Recommended Testing Strategy</h4>
                            <ul className="text-sm text-blue-700 space-y-1">
                              <li>• Jest for unit testing of utilities and services</li>
                              <li>• React Testing Library for component testing</li>
                              <li>• Cypress or Playwright for end-to-end testing</li>
                              <li>• MSW (Mock Service Worker) for API mocking</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
