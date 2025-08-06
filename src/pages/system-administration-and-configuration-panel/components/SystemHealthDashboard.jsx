import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const SystemHealthDashboard = () => {
  const [systemMetrics, setSystemMetrics] = useState({
    server: {
      status: 'healthy',
      uptime: '15d 8h 32m',
      cpu: 45,
      memory: 68,
      disk: 72,
      load: 1.2
    },
    database: {
      status: 'healthy',
      connections: 25,
      maxConnections: 100,
      queryTime: 12,
      size: '2.4 GB',
      backupStatus: 'completed'
    },
    application: {
      status: 'healthy',
      activeUsers: 127,
      requestsPerMinute: 450,
      errorRate: 0.02,
      responseTime: 180
    },
    integrations: {
      status: 'warning',
      activeConnections: 3,
      totalConnections: 4,
      lastSyncErrors: 1,
      avgSyncTime: 45
    }
  });

  const [alerts] = useState([
    {
      id: 1,
      type: 'warning',
      title: 'Uso de Disco Alto',
      message: 'El disco del servidor está al 72% de capacidad',
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      acknowledged: false
    },
    {
      id: 2,
      type: 'error',
      title: 'Fallo en Integración QuickBooks',
      message: 'La conexión con QuickBooks ha fallado durante la última sincronización',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      acknowledged: false
    },
    {
      id: 3,
      type: 'info',
      title: 'Respaldo Completado',
      message: 'El respaldo automático se completó exitosamente',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
      acknowledged: true
    }
  ]);

  const getStatusColor = (status) => {
    const colors = {
      healthy: 'text-success',
      warning: 'text-warning',
      error: 'text-error',
      critical: 'text-error'
    };
    return colors?.[status] || colors?.error;
  };

  const getStatusBgColor = (status) => {
    const colors = {
      healthy: 'bg-success/10 border-success/20',
      warning: 'bg-warning/10 border-warning/20',
      error: 'bg-error/10 border-error/20',
      critical: 'bg-error/10 border-error/20'
    };
    return colors?.[status] || colors?.error;
  };

  const getStatusIcon = (status) => {
    const icons = {
      healthy: 'CheckCircle',
      warning: 'AlertTriangle',
      error: 'XCircle',
      critical: 'AlertOctagon'
    };
    return icons?.[status] || icons?.error;
  };

  const getAlertColor = (type) => {
    const colors = {
      info: 'bg-primary/10 border-primary/20 text-primary',
      warning: 'bg-warning/10 border-warning/20 text-warning',
      error: 'bg-error/10 border-error/20 text-error'
    };
    return colors?.[type] || colors?.info;
  };

  const getAlertIcon = (type) => {
    const icons = {
      info: 'Info',
      warning: 'AlertTriangle',
      error: 'AlertCircle'
    };
    return icons?.[type] || icons?.info;
  };

  const formatTimestamp = (date) => {
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 60) return `hace ${minutes}m`;
    if (hours < 24) return `hace ${hours}h`;
    return `hace ${Math.floor(hours / 24)}d`;
  };

  const getProgressColor = (percentage) => {
    if (percentage < 50) return 'bg-success';
    if (percentage < 80) return 'bg-warning';
    return 'bg-error';
  };

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setSystemMetrics(prev => ({
        ...prev,
        server: {
          ...prev?.server,
          cpu: Math.max(20, Math.min(80, prev?.server?.cpu + (Math.random() - 0.5) * 10)),
          memory: Math.max(30, Math.min(90, prev?.server?.memory + (Math.random() - 0.5) * 5))
        },
        application: {
          ...prev?.application,
          activeUsers: Math.max(50, Math.min(200, prev?.application?.activeUsers + Math.floor((Math.random() - 0.5) * 10))),
          requestsPerMinute: Math.max(200, Math.min(800, prev?.application?.requestsPerMinute + Math.floor((Math.random() - 0.5) * 50)))
        }
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`rounded-lg border p-4 ${getStatusBgColor(systemMetrics?.server?.status)}`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-foreground">Servidor</h3>
            <Icon 
              name={getStatusIcon(systemMetrics?.server?.status)} 
              size={20} 
              className={getStatusColor(systemMetrics?.server?.status)} 
            />
          </div>
          <p className="text-xs text-muted-foreground">Uptime: {systemMetrics?.server?.uptime}</p>
          <p className="text-xs text-muted-foreground">Load: {systemMetrics?.server?.load}</p>
        </div>

        <div className={`rounded-lg border p-4 ${getStatusBgColor(systemMetrics?.database?.status)}`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-foreground">Base de Datos</h3>
            <Icon 
              name={getStatusIcon(systemMetrics?.database?.status)} 
              size={20} 
              className={getStatusColor(systemMetrics?.database?.status)} 
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Conexiones: {systemMetrics?.database?.connections}/{systemMetrics?.database?.maxConnections}
          </p>
          <p className="text-xs text-muted-foreground">Tamaño: {systemMetrics?.database?.size}</p>
        </div>

        <div className={`rounded-lg border p-4 ${getStatusBgColor(systemMetrics?.application?.status)}`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-foreground">Aplicación</h3>
            <Icon 
              name={getStatusIcon(systemMetrics?.application?.status)} 
              size={20} 
              className={getStatusColor(systemMetrics?.application?.status)} 
            />
          </div>
          <p className="text-xs text-muted-foreground">Usuarios: {systemMetrics?.application?.activeUsers}</p>
          <p className="text-xs text-muted-foreground">Req/min: {systemMetrics?.application?.requestsPerMinute}</p>
        </div>

        <div className={`rounded-lg border p-4 ${getStatusBgColor(systemMetrics?.integrations?.status)}`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-foreground">Integraciones</h3>
            <Icon 
              name={getStatusIcon(systemMetrics?.integrations?.status)} 
              size={20} 
              className={getStatusColor(systemMetrics?.integrations?.status)} 
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Activas: {systemMetrics?.integrations?.activeConnections}/{systemMetrics?.integrations?.totalConnections}
          </p>
          <p className="text-xs text-muted-foreground">Errores: {systemMetrics?.integrations?.lastSyncErrors}</p>
        </div>
      </div>
      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Server Resources */}
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Icon name="Server" size={20} className="text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Recursos del Servidor</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-foreground">CPU</span>
                <span className="text-muted-foreground">{systemMetrics?.server?.cpu}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(systemMetrics?.server?.cpu)}`}
                  style={{ width: `${systemMetrics?.server?.cpu}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-foreground">Memoria</span>
                <span className="text-muted-foreground">{systemMetrics?.server?.memory}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(systemMetrics?.server?.memory)}`}
                  style={{ width: `${systemMetrics?.server?.memory}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-foreground">Disco</span>
                <span className="text-muted-foreground">{systemMetrics?.server?.disk}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${getProgressColor(systemMetrics?.server?.disk)}`}
                  style={{ width: `${systemMetrics?.server?.disk}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Application Performance */}
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Icon name="Activity" size={20} className="text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Rendimiento de la Aplicación</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{systemMetrics?.application?.activeUsers}</p>
              <p className="text-sm text-muted-foreground">Usuarios Activos</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{systemMetrics?.application?.requestsPerMinute}</p>
              <p className="text-sm text-muted-foreground">Req/min</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-success">{systemMetrics?.application?.errorRate}%</p>
              <p className="text-sm text-muted-foreground">Tasa de Error</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{systemMetrics?.application?.responseTime}ms</p>
              <p className="text-sm text-muted-foreground">Tiempo Respuesta</p>
            </div>
          </div>
        </div>
      </div>
      {/* System Alerts */}
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Icon name="AlertTriangle" size={20} className="text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Alertas del Sistema</h3>
          </div>
          <Button variant="outline" size="sm" iconName="Settings">
            Configurar Alertas
          </Button>
        </div>
        
        <div className="space-y-3">
          {alerts?.map((alert) => (
            <div key={alert.id} className={`p-4 rounded-lg border ${getAlertColor(alert.type)}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <Icon name={getAlertIcon(alert.type)} size={20} />
                  <div>
                    <h4 className="font-medium">{alert.title}</h4>
                    <p className="text-sm opacity-80 mt-1">{alert.message}</p>
                    <p className="text-xs opacity-60 mt-2">{formatTimestamp(alert.timestamp)}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  {!alert.acknowledged && (
                    <Button variant="ghost" size="sm" iconName="Check">
                      Reconocer
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" iconName="X">
                    Descartar
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Quick Actions */}
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Icon name="Zap" size={20} className="text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Acciones Rápidas</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button variant="outline" iconName="RotateCcw" fullWidth>
            Reiniciar Servicios
          </Button>
          <Button variant="outline" iconName="Database" fullWidth>
            Ejecutar Respaldo
          </Button>
          <Button variant="outline" iconName="RefreshCw" fullWidth>
            Limpiar Caché
          </Button>
          <Button variant="outline" iconName="FileText" fullWidth>
            Ver Logs
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SystemHealthDashboard;