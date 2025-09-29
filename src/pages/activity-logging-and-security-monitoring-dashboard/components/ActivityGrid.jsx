import React, { useMemo, useState, useId, useCallback } from 'react';
import { ChevronDown, ChevronRight, User, Clock, MapPin, Monitor, AlertCircle, CheckCircle, XCircle, Info } from 'lucide-react';

export default function ActivityGrid({ logs = [], loading = false, searchTerm = '' }) {
  const [expandedRows, setExpandedRows] = useState(new Set());

  const toggleRowExpansion = useCallback((logId) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(logId)) next.delete(logId);
      else next.add(logId);
      return next;
    });
  }, []);

  const getActionIcon = (action) => {
    const a = (action || '').toLowerCase();
    if (a.includes('login') || a.includes('signin')) return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (a.includes('logout') || a.includes('signout')) return <XCircle className="h-4 w-4 text-red-500" />;
    if (a.includes('failed') || a.includes('error') || a.includes('unauthorized')) return <AlertCircle className="h-4 w-4 text-red-500" />;
    if (a.includes('update') || a.includes('edit') || a.includes('config')) return <Info className="h-4 w-4 text-blue-500" />;
    return <Info className="h-4 w-4 text-gray-500" />;
  };

  const getSeverityColor = (action, module) => {
    const a = (action || '').toLowerCase();
    const m = (module || '').toLowerCase();
    if (a.includes('failed') || a.includes('error') || a.includes('unauthorized')) return 'bg-red-50 border-l-red-500 text-red-900';
    if (a.includes('login') || a.includes('signin')) return 'bg-green-50 border-l-green-500 text-green-900';
    if (m.includes('security') || a.includes('permission')) return 'bg-yellow-50 border-l-yellow-500 text-yellow-900';
    if (a.includes('config') || a.includes('admin')) return 'bg-purple-50 border-l-purple-500 text-purple-900';
    return 'bg-gray-50 border-l-gray-500 text-gray-900';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';

    const now = new Date();
    const diffMs = now - date;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return 'Ahora mismo';
    if (diffMinutes < 60) return `Hace ${diffMinutes} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays}d`;

    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Más robusto: no dependemos de test() con flag 'g'
  const highlighter = useMemo(() => {
    const term = (searchTerm || '').trim();
    if (!term) return null;
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(${escaped})`, 'gi');
  }, [searchTerm]);

  const highlightSearchTerm = (text) => {
    if (!highlighter || !text) return text;
    const parts = String(text).split(highlighter);
    return parts.map((part, idx) =>
      idx % 2 === 1 ? (
        <mark key={idx} className="bg-yellow-200 px-1 rounded">
          {part}
        </mark>
      ) : (
        <span key={idx}>{part}</span>
      )
    );
  };

  const onRowKeyDown = (e, logId) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleRowExpansion(logId);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-16 bg-gray-200 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!logs?.length) {
    return (
      <div className="p-12 text-center">
        <Monitor className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No hay actividades</h3>
        <p className="text-gray-500">No se encontraron registros de actividad con los filtros aplicados.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden">
      <div className="max-h-[800px] overflow-y-auto">
        {logs.map((log, index) => {
          const id = log?.id ?? index; // fallback estable si el backend no trae id
          const isExpanded = expandedRows.has(id);
          const severityClass = getSeverityColor(log?.accion, log?.modulo);
          const panelId = `log-panel-${id}`;
          const rowBtnId = `log-toggle-${id}`;

          return (
            <div
              key={id}
              className={`border-l-4 ${severityClass} transition-all duration-200 ${
                index !== logs.length - 1 ? 'border-b border-gray-100' : ''
              }`}
            >
              {/* Main Row */}
              <div
                className="p-4 hover:bg-gray-50 cursor-pointer focus:outline-none"
                role="button"
                tabIndex={0}
                aria-expanded={isExpanded}
                aria-controls={panelId}
                onKeyDown={(e) => onRowKeyDown(e, id)}
                onClick={() => toggleRowExpansion(id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1 min-w-0">
                    {/* Expand/Collapse Icon */}
                    <button
                      id={rowBtnId}
                      type="button"
                      aria-label={isExpanded ? 'Contraer' : 'Expandir'}
                      aria-expanded={isExpanded}
                      aria-controls={panelId}
                      className="flex-shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleRowExpansion(id);
                      }}
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      )}
                    </button>

                    {/* Action Icon */}
                    <div className="flex-shrink-0">{getActionIcon(log?.accion)}</div>

                    {/* Main Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-1">
                        <span className="font-medium text-gray-900 capitalize">
                          {highlightSearchTerm(log?.accion)}
                        </span>
                        {log?.modulo ? (
                          <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {log?.modulo}
                          </span>
                        ) : null}
                        {log?.rol ? (
                          <span className="text-sm text-gray-500 bg-blue-100 text-blue-800 px-2 py-1 rounded capitalize">
                            {log?.rol}
                          </span>
                        ) : null}
                      </div>
                      <p className="text-sm text-gray-600 truncate">
                        {highlightSearchTerm(log?.descripcion)}
                      </p>
                    </div>

                    {/* User Info */}
                    <div className="flex items-center space-x-2 text-sm text-gray-500 flex-shrink-0">
                      <User className="h-4 w-4" />
                      <span className="max-w-32 truncate">
                        {log?.usuarios?.nombre || 'Usuario Desconocido'}
                      </span>
                    </div>

                    {/* Timestamp */}
                    <div className="flex items-center space-x-2 text-sm text-gray-500 flex-shrink-0">
                      <Clock className="h-4 w-4" />
                      <span className="whitespace-nowrap">{formatDate(log?.fecha)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={rowBtnId}
                  className="px-4 pb-4 bg-gray-50 border-t border-gray-200"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                    {/* User Details */}
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-900 flex items-center">
                        <User className="h-4 w-4 mr-2" />
                        Usuario
                      </h4>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>
                          <strong>Nombre:</strong> {log?.usuarios?.nombre || 'N/A'}
                        </p>
                        <p>
                          <strong>Email:</strong> {log?.usuarios?.correo || 'N/A'}
                        </p>
                        <p>
                          <strong>Rol:</strong> <span className="capitalize">{log?.rol || 'N/A'}</span>
                        </p>
                      </div>
                    </div>

                    {/* Activity Details */}
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-900 flex items-center">
                        <Monitor className="h-4 w-4 mr-2" />
                        Actividad
                      </h4>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>
                          <strong>Acción:</strong>{' '}
                          <span className="capitalize">{log?.accion || 'N/A'}</span>
                        </p>
                        <p>
                          <strong>Módulo:</strong> {log?.modulo || 'N/A'}
                        </p>
                        <p>
                          <strong>ID Log:</strong>{' '}
                          <code className="bg-gray-200 px-1 rounded text-xs">{log?.id ?? 'N/A'}</code>
                        </p>
                      </div>
                    </div>

                    {/* Technical Details */}
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-900 flex items-center">
                        <MapPin className="h-4 w-4 mr-2" />
                        Detalles Técnicos
                      </h4>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>
                          <strong>IP:</strong> {log?.ip_address || 'No registrada'}
                        </p>
                        <p>
                          <strong>Fecha Completa:</strong>{' '}
                          {log?.fecha ? new Date(log?.fecha).toLocaleString('es-ES') : 'N/A'}
                        </p>
                        <p>
                          <strong>User Agent:</strong>
                          <span className="block text-xs text-gray-500 mt-1 max-w-full truncate">
                            {log?.user_agent || 'No registrado'}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Full Description */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-2">Descripción Completa</h4>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {highlightSearchTerm(log?.descripcion)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
