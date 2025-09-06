import React from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Play, 
  RefreshCw, 
  Eye,
  AlertTriangle
} from 'lucide-react';

const TestResultsGrid = ({ testResults, onRunTests, loading }) => {
  const testSuites = [
    {
      name: 'Payroll Calculations',
      file: 'src/utils/payroll.test.js',
      tests: 25,
      passed: 25,
      failed: 0,
      duration: '2.1s',
      status: 'passed',
      lastRun: '2025-01-11 19:30:00',
      coverage: 98.5
    },
    {
      name: 'Auth Service',
      file: 'src/services/authService.test.js',
      tests: 15,
      passed: 13,
      failed: 2,
      duration: '3.4s',
      status: 'failed',
      lastRun: '2025-01-11 19:30:00',
      coverage: 76.2,
      failures: [
        'should handle network timeout',
        'should validate OTP correctly'
      ]
    },
    {
      name: 'Employee Service',
      file: 'src/services/employeeService.test.js',
      tests: 8,
      passed: 8,
      failed: 0,
      duration: '1.8s',
      status: 'passed',
      lastRun: '2025-01-11 19:30:00',
      coverage: 92.1
    },
    {
      name: 'Navigation Helpers',
      file: 'src/utils/navigationHelpers.test.js',
      tests: 12,
      passed: 12,
      failed: 0,
      duration: '0.9s',
      status: 'passed',
      lastRun: '2025-01-11 19:30:00',
      coverage: 100
    },
    {
      name: 'Form Validation',
      file: 'src/utils/validation.test.js',
      tests: 18,
      passed: 15,
      failed: 3,
      duration: '1.2s',
      status: 'failed',
      lastRun: '2025-01-11 19:30:00',
      coverage: 68.9,
      failures: [
        'should validate email format',
        'should check phone number length',
        'should handle special characters'
      ]
    }
  ];

  const getStatusIcon = (status) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'running':
        return <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'passed':
        return 'bg-green-50 border-green-200';
      case 'failed':
        return 'bg-red-50 border-red-200';
      case 'running':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getCoverageColor = (coverage) => {
    if (coverage >= 90) return 'text-green-600 bg-green-100';
    if (coverage >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Resultados Detallados de Pruebas
          </h3>
          <p className="text-gray-600 mt-1">
            Última ejecución: {new Date()?.toLocaleString('es-MX')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onRunTests}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {loading ? 'Ejecutando...' : 'Ejecutar Todas'}
          </button>
        </div>
      </div>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">
            {testResults?.total || 0}
          </div>
          <div className="text-sm text-gray-600">Total Tests</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-green-600">
            {testResults?.passed || 0}
          </div>
          <div className="text-sm text-gray-600">Passed</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-red-600">
            {testResults?.failed || 0}
          </div>
          <div className="text-sm text-gray-600">Failed</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-blue-600">
            {testResults?.coverage || 0}%
          </div>
          <div className="text-sm text-gray-600">Coverage</div>
        </div>
      </div>
      {/* Test Suites Grid */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h4 className="font-medium text-gray-900">Suites de Prueba</h4>
        </div>
        <div className="divide-y divide-gray-200">
          {testSuites?.map((suite, index) => (
            <div key={index} className={`p-6 hover:bg-gray-50 ${getStatusColor(suite?.status)}`}>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getStatusIcon(suite?.status)}
                    <h5 className="font-medium text-gray-900">{suite?.name}</h5>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCoverageColor(suite?.coverage)}`}>
                      {suite?.coverage}% coverage
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 mb-2">
                    {suite?.file}
                  </div>
                  <div className="flex items-center gap-6 text-sm text-gray-600">
                    <span>{suite?.tests} tests</span>
                    <span className="text-green-600">{suite?.passed} passed</span>
                    {suite?.failed > 0 && (
                      <span className="text-red-600">{suite?.failed} failed</span>
                    )}
                    <span>{suite?.duration}</span>
                    <span>Last run: {suite?.lastRun}</span>
                  </div>

                  {/* Show failures if any */}
                  {suite?.failures && suite?.failures?.length > 0 && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                        <span className="font-medium text-red-800">Pruebas Fallidas:</span>
                      </div>
                      <ul className="text-sm text-red-700 space-y-1">
                        {suite?.failures?.map((failure, idx) => (
                          <li key={idx} className="list-disc list-inside">
                            {failure}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 text-gray-400 hover:text-gray-600">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button 
                    className="p-2 text-gray-400 hover:text-gray-600"
                    onClick={() => onRunTests && onRunTests(suite?.file)}
                  >
                    <Play className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Coverage Report */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h4 className="font-medium text-gray-900">Reporte de Cobertura</h4>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h5 className="font-medium text-gray-900 mb-3">Por Categoría</h5>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Utilities (payroll, helpers)</span>
                  <span className="font-medium text-green-600">95.2%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Services (auth, data)</span>
                  <span className="font-medium text-yellow-600">78.4%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Components</span>
                  <span className="font-medium text-red-600">62.1%</span>
                </div>
              </div>
            </div>
            <div>
              <h5 className="font-medium text-gray-900 mb-3">Archivos Críticos</h5>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">payroll.js</span>
                  <span className="font-medium text-green-600">98.5%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">authService.js</span>
                  <span className="font-medium text-yellow-600">76.2%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">employeeService.js</span>
                  <span className="font-medium text-green-600">92.1%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestResultsGrid;