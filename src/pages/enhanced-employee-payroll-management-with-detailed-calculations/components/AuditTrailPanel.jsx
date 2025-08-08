import React from 'react';
import Icon from '../../../components/AppIcon';

const AuditTrailPanel = ({ logs = [], employeeId }) => {
  // Filter logs for the specific employee if provided
  const filteredLogs = employeeId 
    ? logs?.filter(log => log?.description?.includes(employeeId))
    : logs;

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp)?.toLocaleString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'calculation':
        return 'Calculator';
      case 'adjustment_added':
        return 'Plus';
      case 'export':
        return 'Download';
      case 'bulk_calculation':
        return 'Users';
      default:
        return 'Activity';
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'calculation': case'bulk_calculation':
        return 'text-blue-600 bg-blue-50';
      case 'adjustment_added':
        return 'text-green-600 bg-green-50';
      case 'export':
        return 'text-purple-600 bg-purple-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg">
      <div className="p-4 border-b border-border">
        <h4 className="text-lg font-semibold text-foreground flex items-center">
          <Icon name="FileText" size={20} className="mr-2" />
          Registro de Auditoría
          {employeeId && (
            <span className="ml-2 text-sm text-muted-foreground">
              (Empleado específico)
            </span>
          )}
        </h4>
      </div>

      <div className="p-4">
        {filteredLogs?.length === 0 ? (
          <div className="text-center py-8">
            <Icon name="FileText" size={32} className="mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No hay registros de auditoría disponibles</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredLogs?.slice(0, 20)?.map((log) => (
              <div 
                key={log?.id}
                className="flex items-start space-x-3 p-3 bg-background border border-border rounded-lg"
              >
                <div className={`p-2 rounded-full flex-shrink-0 ${getActionColor(log?.action)}`}>
                  <Icon name={getActionIcon(log?.action)} size={16} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h5 className="text-sm font-medium text-foreground truncate">
                      {log?.action === 'calculation' && 'Cálculo de Nómina'}
                      {log?.action === 'adjustment_added' && 'Ajuste Agregado'}
                      {log?.action === 'export' && 'Exportación de Datos'}
                      {log?.action === 'bulk_calculation' && 'Cálculo Masivo'}
                      {!['calculation', 'adjustment_added', 'export', 'bulk_calculation']?.includes(log?.action) && 'Actividad'}
                    </h5>
                    <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                      {formatTimestamp(log?.timestamp)}
                    </span>
                  </div>
                  
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {log?.description}
                  </p>
                  
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      Por: {log?.user}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            
            {filteredLogs?.length > 20 && (
              <div className="text-center pt-2">
                <p className="text-xs text-muted-foreground">
                  Mostrando los 20 registros más recientes de {filteredLogs?.length} total
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditTrailPanel;