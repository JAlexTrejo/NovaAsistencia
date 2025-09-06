import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle,
  Code,
  FileText,
  Zap
} from 'lucide-react';

const CodeMetricsPanel = ({ metrics, onRefresh, loading }) => {
  const complexityData = [
    { file: 'src/pages/payroll/PayrollCalculationEngine.jsx', complexity: 8, status: 'warning' },
    { file: 'src/components/AuthContext.jsx', complexity: 6, status: 'good' },
    { file: 'src/services/employeeService.js', complexity: 5, status: 'good' },
    { file: 'src/utils/payroll.js', complexity: 4, status: 'good' },
    { file: 'src/pages/dashboard/index.jsx', complexity: 7, status: 'warning' }
  ];

  const duplicateCode = [
    {
      pattern: 'Loading spinner component',
      occurrences: 8,
      lines: 45,
      files: ['Dashboard.jsx', 'EmployeeList.jsx', 'PayrollView.jsx'],
      suggestion: 'Extract to shared LoadingSpinner component'
    },
    {
      pattern: 'Error handling pattern',
      occurrences: 12,
      lines: 67,
      files: ['authService.js', 'employeeService.js', 'payrollService.js'],
      suggestion: 'Create centralized error handling utility'
    },
    {
      pattern: 'Form validation logic',
      occurrences: 6,
      lines: 89,
      files: ['LoginForm.jsx', 'EmployeeForm.jsx', 'ProfileForm.jsx'],
      suggestion: 'Use react-hook-form consistently'
    }
  ];

  const getComplexityColor = (complexity) => {
    if (complexity <= 5) return 'text-green-600 bg-green-100';
    if (complexity <= 7) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'excellent': case'good':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Métricas Detalladas del Código
          </h3>
          <p className="text-gray-600 mt-1">
            Análisis completo de calidad y mantenibilidad
          </p>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Analizar
        </button>
      </div>
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Líneas de Código</p>
              <p className="text-2xl font-semibold text-gray-900">12,847</p>
            </div>
            <Code className="w-8 h-8 text-blue-600" />
          </div>
          <div className="mt-2 flex items-center">
            <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
            <span className="text-sm text-green-600">+8% esta semana</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Archivos</p>
              <p className="text-2xl font-semibold text-gray-900">127</p>
            </div>
            <FileText className="w-8 h-8 text-green-600" />
          </div>
          <div className="mt-2 flex items-center">
            <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
            <span className="text-sm text-green-600">+5 nuevos archivos</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Deuda Técnica</p>
              <p className="text-2xl font-semibold text-gray-900">2.3h</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-yellow-600" />
          </div>
          <div className="mt-2 flex items-center">
            <TrendingDown className="w-4 h-4 text-green-600 mr-1" />
            <span className="text-sm text-green-600">-0.5h esta semana</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Performance</p>
              <p className="text-2xl font-semibold text-gray-900">A+</p>
            </div>
            <Zap className="w-8 h-8 text-green-600" />
          </div>
          <div className="mt-2 flex items-center">
            <CheckCircle className="w-4 h-4 text-green-600 mr-1" />
            <span className="text-sm text-green-600">Optimizado</span>
          </div>
        </div>
      </div>
      {/* Complexity Analysis */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h4 className="font-medium text-gray-900">Análisis de Complejidad Ciclomática</h4>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {complexityData?.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium text-gray-900 text-sm">{item?.file}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {item?.complexity <= 5 ? 'Baja complejidad' : 
                     item?.complexity <= 7 ? 'Complejidad moderada' : 'Alta complejidad'}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getComplexityColor(item?.complexity)}`}>
                    {item?.complexity}
                  </span>
                  {getStatusIcon(item?.status)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Duplicate Code Analysis */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h4 className="font-medium text-gray-900">Código Duplicado</h4>
        </div>
        <div className="p-6">
          <div className="space-y-6">
            {duplicateCode?.map((duplicate, index) => (
              <div key={index} className="border-l-4 border-yellow-400 pl-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h5 className="font-medium text-gray-900">{duplicate?.pattern}</h5>
                    <div className="text-sm text-gray-600 mt-1">
                      {duplicate?.occurrences} ocurrencias • {duplicate?.lines} líneas duplicadas
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Archivos: {duplicate?.files?.join(', ')}
                    </div>
                    <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
                      <strong>Sugerencia:</strong> {duplicate?.suggestion}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-yellow-600">
                      -{duplicate?.lines} líneas
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Code Quality Trends */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h4 className="font-medium text-gray-900">Tendencias de Calidad</h4>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h5 className="font-medium text-gray-900 mb-3">Mejoras Esta Semana</h5>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-gray-600">+15% cobertura de tests</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-gray-600">-23% advertencias ESLint</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-gray-600">+8 funciones documentadas</span>
                </div>
              </div>
            </div>
            <div>
              <h5 className="font-medium text-gray-900 mb-3">Áreas de Enfoque</h5>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm text-gray-600">Reducir código duplicado</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm text-gray-600">Mejorar cobertura de componentes</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm text-gray-600">Simplificar funciones complejas</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeMetricsPanel;