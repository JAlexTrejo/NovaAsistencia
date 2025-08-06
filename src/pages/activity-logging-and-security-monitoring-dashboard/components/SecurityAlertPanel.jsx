import React, { useState, useMemo } from 'react';
import { AlertTriangle, Shield, XCircle, Clock, TrendingUp, Eye } from 'lucide-react';

export default function SecurityAlertPanel({ logs = [] }) {
  const [selectedSeverity, setSelectedSeverity] = useState('all');

  const securityAlerts = useMemo(() => {
    if (!logs?.length) return [];

    const securityActions = [
      'failed_login',
      'unauthorized_access',
      'security_violation',
      'permission_denied',
      'suspicious_activity',
      'account_locked',
      'multiple_failed_attempts',
      'unusual_login_location'
    ];

    return logs
      ?.filter(log => 
        securityActions?.some(action => 
          log?.accion?.toLowerCase()?.includes(action?.replace('_', ''))
        ) ||
        log?.descripcion?.toLowerCase()?.includes('security') ||
        log?.descripcion?.toLowerCase()?.includes('unauthorized') ||
        log?.descripcion?.toLowerCase()?.includes('failed')
      )
      ?.slice(0, 50) // Limit to last 50 security events
      ?.map(log => ({
        ...log,
        severity: getSeverityLevel(log?.accion, log?.descripcion),
        category: getCategoryFromAction(log?.accion)
      }));
  }, [logs]);

  const getSeverityLevel = (action, description) => {
    const text = `${action} ${description}`?.toLowerCase();
    
    if (text?.includes('unauthorized') || text?.includes('violation') || text?.includes('breach')) {
      return 'critical';
    }
    if (text?.includes('failed') || text?.includes('denied') || text?.includes('locked')) {
      return 'high';
    }
    if (text?.includes('suspicious') || text?.includes('unusual')) {
      return 'medium';
    }
    
    return 'low';
  };

  const getCategoryFromAction = (action) => {
    const actionLower = action?.toLowerCase();
    
    if (actionLower?.includes('login') || actionLower?.includes('auth')) {
      return 'authentication';
    }
    if (actionLower?.includes('access') || actionLower?.includes('permission')) {
      return 'authorization';
    }
    if (actionLower?.includes('data') || actionLower?.includes('export')) {
      return 'data_access';
    }
    
    return 'general';
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'medium':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'low':
        return <Shield className="h-4 w-4 text-blue-500" />;
      default:
        return <Shield className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 border-red-300 text-red-800';
      case 'high':
        return 'bg-red-50 border-red-200 text-red-700';
      case 'medium':
        return 'bg-yellow-50 border-yellow-200 text-yellow-700';
      case 'low':
        return 'bg-blue-50 border-blue-200 text-blue-700';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-700';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'authentication':
        return <Shield className="h-3 w-3" />;
      case 'authorization':
        return <XCircle className="h-3 w-3" />;
      case 'data_access':
        return <Eye className="h-3 w-3" />;
      default:
        return <AlertTriangle className="h-3 w-3" />;
    }
  };

  const filteredAlerts = selectedSeverity === 'all' 
    ? securityAlerts 
    : securityAlerts?.filter(alert => alert?.severity === selectedSeverity);

  const severityStats = useMemo(() => {
    const stats = { critical: 0, high: 0, medium: 0, low: 0 };
    securityAlerts?.forEach(alert => {
      stats[alert?.severity] = (stats?.[alert?.severity] || 0) + 1;
    });
    return stats;
  }, [securityAlerts]);

  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);

    if (diffMinutes < 1) {
      return 'Ahora';
    } else if (diffMinutes < 60) {
      return `${diffMinutes}m`;
    } else if (diffHours < 24) {
      return `${diffHours}h`;
    } else {
      return `${Math.floor(diffHours / 24)}d`;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border h-fit">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center">
          <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
          Alertas de Seguridad
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          {securityAlerts?.length || 0} eventos de seguridad detectados
        </p>
      </div>
      {/* Severity Summary */}
      <div className="p-4 bg-gray-50 border-b border-gray-200">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center justify-between p-2 bg-red-100 rounded-lg">
            <div className="flex items-center">
              <XCircle className="h-4 w-4 text-red-600 mr-2" />
              <span className="text-sm font-medium text-red-800">Críticas</span>
            </div>
            <span className="text-lg font-bold text-red-900">{severityStats?.critical}</span>
          </div>
          
          <div className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
              <span className="text-sm font-medium text-red-700">Altas</span>
            </div>
            <span className="text-lg font-bold text-red-800">{severityStats?.high}</span>
          </div>
          
          <div className="flex items-center justify-between p-2 bg-yellow-50 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle className="h-4 w-4 text-yellow-500 mr-2" />
              <span className="text-sm font-medium text-yellow-700">Medias</span>
            </div>
            <span className="text-lg font-bold text-yellow-800">{severityStats?.medium}</span>
          </div>
          
          <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
            <div className="flex items-center">
              <Shield className="h-4 w-4 text-blue-500 mr-2" />
              <span className="text-sm font-medium text-blue-700">Bajas</span>
            </div>
            <span className="text-lg font-bold text-blue-800">{severityStats?.low}</span>
          </div>
        </div>
      </div>
      {/* Severity Filter */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex space-x-2">
          {['all', 'critical', 'high', 'medium', 'low']?.map(severity => (
            <button
              key={severity}
              onClick={() => setSelectedSeverity(severity)}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                selectedSeverity === severity
                  ? 'bg-blue-100 text-blue-800 border border-blue-300' :'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {severity === 'all' ? 'Todas' : severity?.charAt(0)?.toUpperCase() + severity?.slice(1)}
              {severity !== 'all' && (
                <span className="ml-1 text-xs">({severityStats?.[severity] || 0})</span>
              )}
            </button>
          ))}
        </div>
      </div>
      {/* Alerts List */}
      <div className="max-h-96 overflow-y-auto">
        {filteredAlerts?.length === 0 ? (
          <div className="p-6 text-center">
            <Shield className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">
              {selectedSeverity === 'all' ?'No se detectaron alertas de seguridad'
                : `No hay alertas de severidad ${selectedSeverity}`
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredAlerts?.map((alert, index) => (
              <div
                key={alert?.id || index}
                className={`p-4 border-l-4 ${getSeverityColor(alert?.severity)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="flex-shrink-0 mt-0.5">
                      {getSeverityIcon(alert?.severity)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm font-medium capitalize">
                          {alert?.accion?.replace(/_/g, ' ')}
                        </span>
                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                          {getCategoryIcon(alert?.category)}
                          <span className="capitalize">{alert?.category?.replace(/_/g, ' ')}</span>
                        </div>
                      </div>
                      
                      <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                        {alert?.descripcion}
                      </p>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatTimeAgo(alert?.fecha)}
                        </span>
                        
                        <span className="truncate max-w-24" title={alert?.usuarios?.nombre}>
                          {alert?.usuarios?.nombre || 'Usuario desconocido'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Summary Footer */}
      {securityAlerts?.length > 0 && (
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              Últimas {Math.min(50, securityAlerts?.length)} alertas
            </span>
            
            <div className="flex items-center text-gray-500">
              <TrendingUp className="h-4 w-4 mr-1" />
              <span>Monitoreo activo</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}