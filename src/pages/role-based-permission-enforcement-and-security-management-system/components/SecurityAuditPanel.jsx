import React, { useState } from 'react';
import { AlertTriangle, Eye, Shield, User, Clock, Filter, Download, Trash2 } from 'lucide-react';

export default function SecurityAuditPanel({ securityEvents, onClearEvents }) {
  const [filterType, setFilterType] = useState('all');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Filter events by type
  const filteredEvents = securityEvents?.filter(event => {
    if (filterType === 'all') return true;
    return event.type === filterType;
  }) || [];

  // Sort events
  const sortedEvents = filteredEvents?.sort((a, b) => {
    const dateA = new Date(a.timestamp);
    const dateB = new Date(b.timestamp);
    return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
  });

  const getEventIcon = (type) => {
    const icons = {
      'permission_check': Eye,
      'role_change': User,
      'emergency_override': AlertTriangle,
      'security_violation': Shield,
      'system_access': Shield
    };
    const IconComponent = icons?.[type] || AlertTriangle;
    return <IconComponent className="h-5 w-5" />;
  };

  const getEventColor = (type, result) => {
    if (type === 'permission_check') {
      return result === 'granted' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
    }
    if (type === 'role_change') return 'bg-blue-100 text-blue-800';
    if (type === 'emergency_override') return 'bg-yellow-100 text-yellow-800';
    if (type === 'security_violation') return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getEventLabel = (type) => {
    const labels = {
      'permission_check': 'Verificación de Permisos',
      'role_change': 'Cambio de Rol',
      'emergency_override': 'Override de Emergencia',
      'security_violation': 'Violación de Seguridad',
      'system_access': 'Acceso al Sistema'
    };
    return labels?.[type] || type;
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const diff = Math.floor((now - timestamp) / 1000);

    if (diff < 60) return `hace ${diff}s`;
    if (diff < 3600) return `hace ${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `hace ${Math.floor(diff / 3600)}h`;
    return `hace ${Math.floor(diff / 86400)}d`;
  };

  const exportEvents = () => {
    const headers = [
      'Fecha/Hora',
      'Tipo',
      'Usuario',
      'Acción',
      'Resultado',
      'Detalles'
    ];

    const csvContent = [
      headers?.join(','),
      ...sortedEvents?.map(event => [
        new Date(event.timestamp)?.toLocaleString(),
        getEventLabel(event.type),
        event.user,
        event.action,
        event.result,
        event.details || ''
      ]?.join(','))
    ]?.join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL?.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auditoria_seguridad_${new Date()?.toISOString()?.split('T')?.[0]}.csv`;
    document.body?.appendChild(a);
    a?.click();
    document.body?.removeChild(a);
    window.URL?.revokeObjectURL(url);
  };

  const eventTypeStats = {
    permission_check: securityEvents?.filter(e => e?.type === 'permission_check')?.length || 0,
    role_change: securityEvents?.filter(e => e?.type === 'role_change')?.length || 0,
    emergency_override: securityEvents?.filter(e => e?.type === 'emergency_override')?.length || 0,
    security_violation: securityEvents?.filter(e => e?.type === 'security_violation')?.length || 0
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            <AlertTriangle className="h-6 w-6 inline mr-2 text-red-600" />
            Auditoría de Seguridad
          </h2>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={exportEvents}
              disabled={sortedEvents?.length === 0}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </button>
            
            <button
              onClick={onClearEvents}
              disabled={securityEvents?.length === 0}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Limpiar
            </button>
          </div>
        </div>

        {/* Event Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center">
              <Eye className="h-6 w-6 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-600">Verificaciones</p>
                <p className="text-lg font-bold text-blue-900">{eventTypeStats?.permission_check}</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-green-50 rounded-lg">
            <div className="flex items-center">
              <User className="h-6 w-6 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-green-600">Cambios de Rol</p>
                <p className="text-lg font-bold text-green-900">{eventTypeStats?.role_change}</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-yellow-50 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-yellow-600">Overrides</p>
                <p className="text-lg font-bold text-yellow-900">{eventTypeStats?.emergency_override}</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-red-50 rounded-lg">
            <div className="flex items-center">
              <Shield className="h-6 w-6 text-red-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-red-600">Violaciones</p>
                <p className="text-lg font-bold text-red-900">{eventTypeStats?.security_violation}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e?.target?.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Todos los Eventos</option>
              <option value="permission_check">Verificaciones de Permisos</option>
              <option value="role_change">Cambios de Rol</option>
              <option value="emergency_override">Overrides de Emergencia</option>
              <option value="security_violation">Violaciones de Seguridad</option>
            </select>
          </div>

          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e?.target?.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="desc">Más Reciente Primero</option>
            <option value="asc">Más Antiguo Primero</option>
          </select>

          <div className="text-sm text-gray-600">
            {sortedEvents?.length} de {securityEvents?.length || 0} eventos
          </div>
        </div>

        {/* Security Events List */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {sortedEvents?.map((event) => (
            <div key={event.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="flex-shrink-0 mt-1">
                    <div className={`p-2 rounded-full ${getEventColor(event.type, event.result)}`}>
                      {getEventIcon(event.type)}
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEventColor(event.type, event.result)}`}>
                        {getEventLabel(event.type)}
                      </span>
                      
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="h-3 w-3 mr-1" />
                        {getTimeAgo(event.timestamp)}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                      <div>
                        <p className="text-gray-600">Usuario:</p>
                        <p className="font-medium text-gray-900">{event.user}</p>
                      </div>
                      
                      <div>
                        <p className="text-gray-600">Acción:</p>
                        <p className="font-medium text-gray-900">{event.action}</p>
                      </div>
                      
                      <div>
                        <p className="text-gray-600">Resultado:</p>
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          event.result === 'granted' || event.result === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : event.result === 'denied' ?'bg-red-100 text-red-800' :'bg-yellow-100 text-yellow-800'
                        }`}>
                          {event.result?.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    
                    {event.details && (
                      <div className="mt-3 p-2 bg-gray-100 rounded text-sm text-gray-700">
                        <p className="font-medium text-gray-600 mb-1">Detalles:</p>
                        <p>{event.details}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <button
                  onClick={() => setSelectedEvent(selectedEvent === event.id ? null : event.id)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                >
                  <Eye className="h-4 w-4" />
                </button>
              </div>
              
              {/* Extended Details */}
              {selectedEvent === event.id && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                  <h5 className="font-medium text-blue-900 mb-2">Información Adicional</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-blue-700 font-medium">Timestamp Completo:</p>
                      <p className="text-blue-800">{new Date(event.timestamp)?.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-blue-700 font-medium">ID del Evento:</p>
                      <p className="text-blue-800 font-mono">{event.id}</p>
                    </div>
                  </div>
                  
                  {event.type === 'permission_check' && (
                    <div className="mt-3 p-2 bg-white rounded border">
                      <p className="text-sm">
                        <strong>Análisis:</strong> Verificación de permisos para acceder a funcionalidad específica.
                        {event.result === 'denied' && ' Se recomienda revisar los roles asignados al usuario.'}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {sortedEvents?.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            {securityEvents?.length === 0 ? (
              <div>
                <p className="text-lg font-medium mb-2">No hay eventos de seguridad</p>
                <p className="text-sm">Los eventos aparecerán aquí cuando ocurran</p>
              </div>
            ) : (
              <div>
                <p className="text-lg font-medium mb-2">No hay eventos que coincidan con el filtro</p>
                <p className="text-sm">Intenta cambiar los filtros para ver más resultados</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}