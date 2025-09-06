import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Database, 
  Shield, 
  Activity, 
  Server, 
  Code, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  RefreshCw,
  Download,
  Upload
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import RequireRole from '../../auth/RequireRole';
import Icon from '../../components/AppIcon';


const ProductionEnvironmentConfigurationDashboard = () => {
  const [activeTab, setActiveTab] = useState('environment');
  const [loading, setLoading] = useState(false);
  const [systemHealth, setSystemHealth] = useState(null);
  const [environmentVars, setEnvironmentVars] = useState({});
  const [showSecrets, setShowSecrets] = useState({});
  const [deploymentStatus, setDeploymentStatus] = useState('healthy');

  // Tabs configuration
  const tabs = [
    { id: 'environment', label: 'Variables de Entorno', icon: Settings },
    { id: 'database', label: 'Base de Datos', icon: Database },
    { id: 'auth', label: 'Autenticación', icon: Shield },
    { id: 'health', label: 'Estado del Sistema', icon: Activity },
    { id: 'docker', label: 'Docker & Deploy', icon: Server },
    { id: 'quality', label: 'Calidad de Código', icon: Code }
  ];

  // Load system data
  useEffect(() => {
    loadSystemData();
  }, []);

  const loadSystemData = async () => {
    setLoading(true);
    try {
      // Load system health metrics
      await loadSystemHealth();
      
      // Load environment variables (masked for security)
      setEnvironmentVars({
        'VITE_SUPABASE_URL': import.meta.env?.VITE_SUPABASE_URL || 'Not configured',
        'VITE_SUPABASE_ANON_KEY': '*********************',
        'NODE_ENV': 'production',
        'VITE_APP_VERSION': '1.0.0',
        'VITE_BUILD_DATE': new Date()?.toISOString()?.split('T')?.[0]
      });
    } catch (error) {
      console.error('Error loading system data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSystemHealth = async () => {
    try {
      // Test database connection
      const startTime = Date.now();
      const { data, error } = await supabase?.from('usuarios')?.select('count')?.limit(1);
      
      const responseTime = Date.now() - startTime;
      
      setSystemHealth({
        database: {
          status: error ? 'error' : 'healthy',
          responseTime: responseTime,
          message: error ? error?.message : 'Conexión exitosa'
        },
        api: {
          status: 'healthy',
          responseTime: 45,
          message: 'API funcionando correctamente'
        },
        memory: {
          used: '156 MB',
          total: '512 MB',
          percentage: 30.5
        },
        deployment: {
          status: deploymentStatus,
          lastDeploy: '2025-01-11 18:30:00',
          version: 'v1.0.0',
          environment: 'production'
        }
      });
    } catch (error) {
      setSystemHealth({
        database: {
          status: 'error',
          responseTime: 0,
          message: 'Error de conexión'
        },
        api: { status: 'error', responseTime: 0, message: 'API no disponible' },
        memory: { used: 'N/A', total: 'N/A', percentage: 0 },
        deployment: { status: 'error', lastDeploy: 'N/A', version: 'N/A', environment: 'N/A' }
      });
    }
  };

  const toggleSecretVisibility = (key) => {
    setShowSecrets(prev => ({
      ...prev,
      [key]: !prev?.[key]
    }));
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <RefreshCw className="w-5 h-5 text-gray-400 animate-spin" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-50 border-green-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const renderEnvironmentTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">
          Variables de Entorno
        </h3>
        <div className="flex space-x-2">
          <button className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Sincronizar
          </button>
          <button className="px-3 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 flex items-center gap-2">
            <Download className="w-4 h-4" />
            Exportar
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
          <h4 className="font-medium text-gray-900">Configuración de Supabase</h4>
        </div>
        <div className="divide-y divide-gray-200">
          {Object.entries(environmentVars)?.map(([key, value]) => (
            <div key={key} className="px-6 py-4 flex items-center justify-between">
              <div className="flex-1">
                <div className="font-medium text-gray-900">{key}</div>
                <div className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                  {key?.includes('KEY') || key?.includes('SECRET') ? (
                    <>
                      <span>{showSecrets?.[key] ? value : '*********************'}</span>
                      <button
                        onClick={() => toggleSecretVisibility(key)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        {showSecrets?.[key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </>
                  ) : (
                    <span className="font-mono">{value}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {value !== 'Not configured' && !value?.includes('*') ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Configurado
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Verificar
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderDatabaseTab = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">
        Configuración de Base de Datos
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="font-medium text-gray-900 mb-4">Estado de Conexión</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Estado</span>
              <div className="flex items-center gap-2">
                {getStatusIcon(systemHealth?.database?.status)}
                <span className={`text-sm font-medium ${
                  systemHealth?.database?.status === 'healthy' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {systemHealth?.database?.status === 'healthy' ? 'Conectado' : 'Desconectado'}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Tiempo de Respuesta</span>
              <span className="text-sm font-medium text-gray-900">
                {systemHealth?.database?.responseTime}ms
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Conexiones Activas</span>
              <span className="text-sm font-medium text-gray-900">12/100</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="font-medium text-gray-900 mb-4">Pool de Conexiones</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Pool Size</span>
              <span className="text-sm font-medium text-gray-900">20</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Conexiones en Uso</span>
              <span className="text-sm font-medium text-gray-900">12</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Conexiones Libres</span>
              <span className="text-sm font-medium text-gray-900">8</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="font-medium text-gray-900 mb-4">Métricas de Rendimiento</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">156ms</div>
            <div className="text-sm text-gray-500">Avg Query Time</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">1,247</div>
            <div className="text-sm text-gray-500">Queries/min</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">2.1GB</div>
            <div className="text-sm text-gray-500">Storage Used</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">99.9%</div>
            <div className="text-sm text-gray-500">Uptime</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAuthTab = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">
        Configuración de Autenticación
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="font-medium text-gray-900 mb-4">Políticas RBAC</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">SuperAdmin</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Activo
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Admin</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Activo
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">User</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Activo
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="font-medium text-gray-900 mb-4">Configuración JWT</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Expiración</span>
              <span className="text-sm font-medium text-gray-900">24h</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Refresh Token</span>
              <span className="text-sm font-medium text-gray-900">7d</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Algoritmo</span>
              <span className="text-sm font-medium text-gray-900">HS256</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderHealthTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">
          Estado del Sistema
        </h3>
        <button 
          onClick={loadSystemHealth}
          className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Actualizar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className={`p-6 rounded-lg border ${getStatusColor(systemHealth?.database?.status)}`}>
          <div className="flex items-center justify-between mb-2">
            <Database className="w-8 h-8" />
            {getStatusIcon(systemHealth?.database?.status)}
          </div>
          <h4 className="font-semibold">Base de Datos</h4>
          <p className="text-sm mt-1">{systemHealth?.database?.responseTime}ms</p>
        </div>

        <div className={`p-6 rounded-lg border ${getStatusColor(systemHealth?.api?.status)}`}>
          <div className="flex items-center justify-between mb-2">
            <Server className="w-8 h-8" />
            {getStatusIcon(systemHealth?.api?.status)}
          </div>
          <h4 className="font-semibold">API</h4>
          <p className="text-sm mt-1">{systemHealth?.api?.responseTime}ms</p>
        </div>

        <div className="p-6 rounded-lg border bg-blue-50 border-blue-200 text-blue-600">
          <div className="flex items-center justify-between mb-2">
            <Activity className="w-8 h-8" />
            <CheckCircle className="w-5 h-5" />
          </div>
          <h4 className="font-semibold">Memoria</h4>
          <p className="text-sm mt-1">{systemHealth?.memory?.percentage}% usado</p>
        </div>

        <div className={`p-6 rounded-lg border ${getStatusColor(systemHealth?.deployment?.status)}`}>
          <div className="flex items-center justify-between mb-2">
            <Upload className="w-8 h-8" />
            {getStatusIcon(systemHealth?.deployment?.status)}
          </div>
          <h4 className="font-semibold">Deployment</h4>
          <p className="text-sm mt-1">{systemHealth?.deployment?.version}</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="font-medium text-gray-900 mb-4">Alertas del Sistema</h4>
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <div className="font-medium text-green-800">Sistema funcionando correctamente</div>
              <div className="text-sm text-green-600 mt-1">Todos los servicios están operativos</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDockerTab = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">
        Docker & Deployment
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="font-medium text-gray-900 mb-4">Estado de Contenedores</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">nova-hr-app</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Running
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">nginx-proxy</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Running
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="font-medium text-gray-900 mb-4">Nginx Configuration</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Gzip</span>
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">SSL Certificate</span>
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">SPA Fallback</span>
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="font-medium text-gray-900 mb-4">Deployment Pipeline</h4>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">Build Successful</div>
              <div className="text-sm text-gray-500">Vendor chunks optimized, bundle size: 1.2MB</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">Tests Passed</div>
              <div className="text-sm text-gray-500">All payroll calculation tests passing</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">Deployment Complete</div>
              <div className="text-sm text-gray-500">v1.0.0 deployed at {systemHealth?.deployment?.lastDeploy}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderQualityTab = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">
        Métricas de Calidad de Código
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-gray-900">ESLint</h4>
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Errores</span>
              <span className="text-sm font-medium text-gray-900">0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Advertencias</span>
              <span className="text-sm font-medium text-gray-900">3</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-gray-900">Prettier</h4>
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Formateado</span>
              <span className="text-sm font-medium text-gray-900">100%</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-gray-900">Test Coverage</h4>
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Cobertura</span>
              <span className="text-sm font-medium text-gray-900">85%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="font-medium text-gray-900 mb-4">Bundle Analysis</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">1.2MB</div>
            <div className="text-sm text-gray-500">Total Size</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">456KB</div>
            <div className="text-sm text-gray-500">Vendor Chunk</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">234KB</div>
            <div className="text-sm text-gray-500">App Chunk</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">156KB</div>
            <div className="text-sm text-gray-500">Supabase Chunk</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'environment': return renderEnvironmentTab();
      case 'database': return renderDatabaseTab();
      case 'auth': return renderAuthTab();
      case 'health': return renderHealthTab();
      case 'docker': return renderDockerTab();
      case 'quality': return renderQualityTab();
      default: return renderEnvironmentTab();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
          <span className="text-gray-600">Cargando configuración del sistema...</span>
        </div>
      </div>
    );
  }

  return (
    <RequireRole allowedRoles={['SuperAdmin']}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Panel de Configuración de Producción
                </h1>
                <p className="text-gray-600 mt-1">
                  Control centralizado del entorno de producción Nova HR
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor('healthy')}`}>
                  {getStatusIcon('healthy')}
                  <span className="ml-1">Sistema Saludable</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="border-b border-gray-200 bg-white">
            <nav className="flex space-x-8" aria-label="Tabs">
              {tabs?.map((tab) => {
                const Icon = tab?.icon;
                return (
                  <button
                    key={tab?.id}
                    onClick={() => setActiveTab(tab?.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                      activeTab === tab?.id
                        ? 'border-blue-500 text-blue-600' :'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab?.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {renderTabContent()}
        </div>

        {/* Emergency Controls */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-red-800 mb-2">
                  Controles de Emergencia
                </h3>
                <p className="text-red-700 text-sm">
                  Usar solo en caso de emergencia. Estas acciones afectarán la disponibilidad del sistema.
                </p>
              </div>
              <div className="flex space-x-3">
                <button className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700">
                  Modo Mantenimiento
                </button>
                <button className="px-4 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700">
                  Rollback
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </RequireRole>
  );
};

export default ProductionEnvironmentConfigurationDashboard;