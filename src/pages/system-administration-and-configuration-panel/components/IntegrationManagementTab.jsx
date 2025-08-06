import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

import { Checkbox } from '../../../components/ui/Checkbox';

const IntegrationManagementTab = () => {
  const [integrations, setIntegrations] = useState([
    {
      id: 1,
      name: 'Active Directory',
      type: 'authentication',
      status: 'connected',
      lastSync: new Date(Date.now() - 30 * 60 * 1000),
      health: 'healthy',
      config: {
        server: 'ldap://ad.construcciones.com',
        port: '389',
        baseDN: 'DC=construcciones,DC=com',
        syncInterval: '60'
      }
    },
    {
      id: 2,
      name: 'SAP ERP',
      type: 'erp',
      status: 'connected',
      lastSync: new Date(Date.now() - 2 * 60 * 60 * 1000),
      health: 'warning',
      config: {
        endpoint: 'https://sap.construcciones.com/api',
        clientId: 'ASISTENCIA_PRO',
        syncInterval: '120'
      }
    },
    {
      id: 3,
      name: 'QuickBooks',
      type: 'accounting',
      status: 'disconnected',
      lastSync: new Date(Date.now() - 24 * 60 * 60 * 1000),
      health: 'error',
      config: {
        companyId: 'QB_CONSTRUCCIONES',
        environment: 'production',
        syncInterval: '240'
      }
    },
    {
      id: 4,
      name: 'Microsoft Teams',
      type: 'communication',
      status: 'connected',
      lastSync: new Date(Date.now() - 15 * 60 * 1000),
      health: 'healthy',
      config: {
        tenantId: 'construcciones-teams',
        webhookUrl: 'https://teams.microsoft.com/webhook/...',
        syncInterval: '30'
      }
    }
  ]);

  const [selectedIntegration, setSelectedIntegration] = useState(null);
  const [showConfigModal, setShowConfigModal] = useState(false);

  const getStatusColor = (status) => {
    const colors = {
      connected: 'bg-success text-success-foreground',
      disconnected: 'bg-error text-error-foreground',
      connecting: 'bg-warning text-warning-foreground'
    };
    return colors?.[status] || colors?.disconnected;
  };

  const getHealthColor = (health) => {
    const colors = {
      healthy: 'text-success',
      warning: 'text-warning',
      error: 'text-error'
    };
    return colors?.[health] || colors?.error;
  };

  const getHealthIcon = (health) => {
    const icons = {
      healthy: 'CheckCircle',
      warning: 'AlertTriangle',
      error: 'XCircle'
    };
    return icons?.[health] || icons?.error;
  };

  const getTypeIcon = (type) => {
    const icons = {
      authentication: 'Shield',
      erp: 'Building2',
      accounting: 'Calculator',
      communication: 'MessageSquare',
      hr: 'Users'
    };
    return icons?.[type] || 'Settings';
  };

  const formatLastSync = (date) => {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (minutes < 60) return `hace ${minutes}m`;
    if (hours < 24) return `hace ${hours}h`;
    return `hace ${Math.floor(hours / 24)}d`;
  };

  const handleTestConnection = (integration) => {
    console.log('Testing connection for:', integration?.name);
    // Simulate connection test
  };

  const handleSync = (integration) => {
    console.log('Syncing:', integration?.name);
    // Simulate sync operation
  };

  const handleConfigure = (integration) => {
    setSelectedIntegration(integration);
    setShowConfigModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Integration Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Total Integraciones</p>
              <p className="text-2xl font-bold text-foreground">{integrations?.length}</p>
            </div>
            <Icon name="Plug" size={24} className="text-primary" />
          </div>
        </div>
        
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Conectadas</p>
              <p className="text-2xl font-bold text-success">
                {integrations?.filter(i => i?.status === 'connected')?.length}
              </p>
            </div>
            <Icon name="CheckCircle" size={24} className="text-success" />
          </div>
        </div>
        
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Con Problemas</p>
              <p className="text-2xl font-bold text-warning">
                {integrations?.filter(i => i?.health === 'warning')?.length}
              </p>
            </div>
            <Icon name="AlertTriangle" size={24} className="text-warning" />
          </div>
        </div>
        
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Desconectadas</p>
              <p className="text-2xl font-bold text-error">
                {integrations?.filter(i => i?.status === 'disconnected')?.length}
              </p>
            </div>
            <Icon name="XCircle" size={24} className="text-error" />
          </div>
        </div>
      </div>
      {/* Integration List */}
      <div className="bg-card rounded-lg border border-border">
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Integraciones Configuradas</h3>
            <Button iconName="Plus">
              Nueva Integración
            </Button>
          </div>
        </div>
        
        <div className="divide-y divide-border">
          {integrations?.map((integration) => (
            <div key={integration?.id} className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                    <Icon name={getTypeIcon(integration?.type)} size={24} className="text-primary" />
                  </div>
                  
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="text-lg font-medium text-foreground">{integration?.name}</h4>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(integration?.status)}`}>
                        {integration?.status === 'connected' ? 'Conectado' : 
                         integration?.status === 'disconnected' ? 'Desconectado' : 'Conectando'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 mt-1">
                      <div className="flex items-center space-x-1">
                        <Icon 
                          name={getHealthIcon(integration?.health)} 
                          size={16} 
                          className={getHealthColor(integration?.health)} 
                        />
                        <span className="text-sm text-muted-foreground">
                          {integration?.health === 'healthy' ? 'Saludable' :
                           integration?.health === 'warning' ? 'Advertencia' : 'Error'}
                        </span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        Última sincronización: {formatLastSync(integration?.lastSync)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    iconName="RefreshCw"
                    onClick={() => handleSync(integration)}
                  >
                    Sincronizar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    iconName="Zap"
                    onClick={() => handleTestConnection(integration)}
                  >
                    Probar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    iconName="Settings"
                    onClick={() => handleConfigure(integration)}
                  >
                    Configurar
                  </Button>
                </div>
              </div>
              
              {/* Integration Details */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Tipo:</span>
                  <span className="ml-2 text-foreground capitalize">{integration?.type}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Intervalo de Sync:</span>
                  <span className="ml-2 text-foreground">{integration?.config?.syncInterval} min</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Estado de Salud:</span>
                  <span className={`ml-2 ${getHealthColor(integration?.health)}`}>
                    {integration?.health === 'healthy' ? 'Óptimo' :
                     integration?.health === 'warning' ? 'Necesita atención' : 'Crítico'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Sync Schedule */}
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Icon name="Clock" size={20} className="text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Programación de Sincronización</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Checkbox
              label="Sincronización Automática"
              description="Ejecutar sincronizaciones según intervalos configurados"
              checked
            />
            <Checkbox
              label="Sincronización Nocturna"
              description="Ejecutar sincronización completa a las 2:00 AM"
              checked
            />
            <Checkbox
              label="Notificar Errores"
              description="Enviar alertas cuando falle una sincronización"
              checked
            />
          </div>
          <div className="space-y-4">
            <Input
              label="Hora de Sincronización Nocturna"
              type="time"
              value="02:00"
            />
            <Input
              label="Reintentos en Caso de Error"
              type="number"
              min="1"
              max="10"
              value="3"
            />
            <Input
              label="Timeout de Conexión (seg)"
              type="number"
              min="10"
              max="300"
              value="30"
            />
          </div>
        </div>
      </div>
      {/* Configuration Modal */}
      {showConfigModal && selectedIntegration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg border border-border w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">
                  Configurar {selectedIntegration?.name}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  iconName="X"
                  onClick={() => setShowConfigModal(false)}
                />
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Connection Settings */}
              <div>
                <h4 className="text-md font-medium text-foreground mb-4">Configuración de Conexión</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(selectedIntegration?.config)?.map(([key, value]) => (
                    <Input
                      key={key}
                      label={key?.charAt(0)?.toUpperCase() + key?.slice(1)}
                      value={value}
                      onChange={() => {}}
                    />
                  ))}
                </div>
              </div>
              
              {/* Sync Settings */}
              <div>
                <h4 className="text-md font-medium text-foreground mb-4">Configuración de Sincronización</h4>
                <div className="space-y-4">
                  <Checkbox
                    label="Sincronización Bidireccional"
                    description="Permitir que los datos fluyan en ambas direcciones"
                    checked
                  />
                  <Checkbox
                    label="Validación de Datos"
                    description="Validar datos antes de sincronizar"
                    checked
                  />
                  <Checkbox
                    label="Log Detallado"
                    description="Registrar información detallada de sincronización"
                   
                  />
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-border flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowConfigModal(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="outline"
                iconName="Zap"
                onClick={() => handleTestConnection(selectedIntegration)}
              >
                Probar Conexión
              </Button>
              <Button onClick={() => setShowConfigModal(false)}>
                Guardar Configuración
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IntegrationManagementTab;