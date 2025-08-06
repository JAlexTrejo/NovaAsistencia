import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const IntegrationStatusPanel = ({ 
  onRefreshStatus,
  onTestConnection,
  onSyncData 
}) => {
  const [integrations, setIntegrations] = useState([]);
  const [lastSync, setLastSync] = useState(new Date());

  // Mock integration status data
  const mockIntegrations = [
    {
      id: 'accounting_system',
      name: 'Sistema Contable',
      description: 'Integración con software de contabilidad principal',
      status: 'connected',
      lastSync: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
      syncFrequency: 'Cada 30 minutos',
      recordsSync: 1250,
      errors: 0,
      icon: 'Calculator'
    },
    {
      id: 'bank_transfer',
      name: 'Transferencias Bancarias',
      description: 'Sistema de pagos y transferencias automáticas',
      status: 'connected',
      lastSync: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      syncFrequency: 'Diario a las 18:00',
      recordsSync: 85,
      errors: 0,
      icon: 'CreditCard'
    },
    {
      id: 'hr_system',
      name: 'Sistema de RRHH',
      description: 'Integración con base de datos de empleados',
      status: 'warning',
      lastSync: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
      syncFrequency: 'Cada 4 horas',
      recordsSync: 320,
      errors: 2,
      icon: 'Users',
      lastError: 'Timeout en conexión - reintentando automáticamente'
    },
    {
      id: 'tax_system',
      name: 'Sistema Tributario',
      description: 'Reportes automáticos a entidades fiscales',
      status: 'error',
      lastSync: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
      syncFrequency: 'Semanal',
      recordsSync: 0,
      errors: 5,
      icon: 'FileText',
      lastError: 'Error de autenticación - requiere intervención manual'
    },
    {
      id: 'time_tracking',
      name: 'Control de Tiempo',
      description: 'Sincronización con sistema de asistencia',
      status: 'connected',
      lastSync: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      syncFrequency: 'Tiempo real',
      recordsSync: 2840,
      errors: 0,
      icon: 'Clock'
    }
  ];

  useEffect(() => {
    setIntegrations(mockIntegrations);
  }, []);

  const statusConfig = {
    connected: {
      color: 'text-success',
      bgColor: 'bg-success/10',
      label: 'Conectado',
      icon: 'CheckCircle'
    },
    warning: {
      color: 'text-warning',
      bgColor: 'bg-warning/10',
      label: 'Advertencia',
      icon: 'AlertTriangle'
    },
    error: {
      color: 'text-error',
      bgColor: 'bg-error/10',
      label: 'Error',
      icon: 'XCircle'
    },
    disconnected: {
      color: 'text-muted-foreground',
      bgColor: 'bg-muted',
      label: 'Desconectado',
      icon: 'Circle'
    }
  };

  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `hace ${minutes}m`;
    if (hours < 24) return `hace ${hours}h`;
    return `hace ${days}d`;
  };

  const handleRefreshAll = () => {
    setLastSync(new Date());
    onRefreshStatus && onRefreshStatus();
  };

  const handleTestConnection = (integrationId) => {
    onTestConnection && onTestConnection(integrationId);
  };

  const handleSyncData = (integrationId) => {
    onSyncData && onSyncData(integrationId);
  };

  const connectedCount = integrations?.filter(i => i?.status === 'connected')?.length;
  const errorCount = integrations?.filter(i => i?.status === 'error')?.length;
  const warningCount = integrations?.filter(i => i?.status === 'warning')?.length;

  return (
    <div className="bg-card border border-border rounded-lg">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Estado de Integraciones
            </h3>
            <p className="text-sm text-muted-foreground">
              Monitoreo de conexiones con sistemas externos
            </p>
          </div>
          <Button
            variant="outline"
            iconName="RefreshCw"
            onClick={handleRefreshAll}
          >
            Actualizar Todo
          </Button>
        </div>

        {/* Status Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-success/10 rounded-lg">
            <div className="text-2xl font-bold text-success mb-1">
              {connectedCount}
            </div>
            <div className="text-xs text-success">
              Conectados
            </div>
          </div>
          
          <div className="text-center p-3 bg-warning/10 rounded-lg">
            <div className="text-2xl font-bold text-warning mb-1">
              {warningCount}
            </div>
            <div className="text-xs text-warning">
              Advertencias
            </div>
          </div>
          
          <div className="text-center p-3 bg-error/10 rounded-lg">
            <div className="text-2xl font-bold text-error mb-1">
              {errorCount}
            </div>
            <div className="text-xs text-error">
              Errores
            </div>
          </div>
        </div>
      </div>
      {/* Integration List */}
      <div className="divide-y divide-border">
        {integrations?.map((integration) => {
          const config = statusConfig?.[integration?.status];
          
          return (
            <div key={integration?.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-4">
                  <div className={`w-10 h-10 rounded-lg ${config?.bgColor} flex items-center justify-center`}>
                    <Icon name={integration?.icon} size={20} className={config?.color} />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="text-md font-semibold text-foreground">
                        {integration?.name}
                      </h4>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config?.bgColor} ${config?.color}`}>
                        <Icon name={config?.icon} size={12} className="inline mr-1" />
                        {config?.label}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {integration?.description}
                    </p>
                    
                    {integration?.lastError && (
                      <div className="p-2 bg-error/10 border border-error/20 rounded text-xs text-error">
                        <Icon name="AlertCircle" size={12} className="inline mr-1" />
                        {integration?.lastError}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    iconName="TestTube"
                    onClick={() => handleTestConnection(integration?.id)}
                  >
                    Probar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    iconName="RefreshCw"
                    onClick={() => handleSyncData(integration?.id)}
                    disabled={integration?.status === 'error'}
                  >
                    Sincronizar
                  </Button>
                </div>
              </div>
              {/* Integration Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Última Sincronización:</span>
                  <p className="font-medium text-foreground">
                    {formatTimestamp(integration?.lastSync)}
                  </p>
                </div>
                
                <div>
                  <span className="text-muted-foreground">Frecuencia:</span>
                  <p className="font-medium text-foreground">
                    {integration?.syncFrequency}
                  </p>
                </div>
                
                <div>
                  <span className="text-muted-foreground">Registros Sincronizados:</span>
                  <p className="font-medium text-foreground">
                    {integration?.recordsSync?.toLocaleString()}
                  </p>
                </div>
                
                <div>
                  <span className="text-muted-foreground">Errores:</span>
                  <p className={`font-medium ${integration?.errors > 0 ? 'text-error' : 'text-success'}`}>
                    {integration?.errors}
                  </p>
                </div>
              </div>
              {/* Sync Progress (for active syncs) */}
              {integration?.status === 'connected' && integration?.id === 'time_tracking' && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">
                      Sincronización en tiempo real activa
                    </span>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                      <span className="text-xs text-success">En línea</span>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Última actualización: {formatTimestamp(new Date(Date.now() - 30000))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {/* Footer */}
      <div className="p-4 border-t border-border bg-muted/50">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Última verificación: {formatTimestamp(lastSync)}
          </span>
          <div className="flex items-center space-x-4">
            <span>
              {connectedCount}/{integrations?.length} sistemas conectados
            </span>
            <Button
              variant="ghost"
              size="sm"
              iconName="Settings"
            >
              Configurar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntegrationStatusPanel;