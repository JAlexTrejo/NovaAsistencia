import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';

const SystemStatus = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const systemServices = [
    {
      id: 1,
      name: 'Active Directory',
      status: 'online',
      description: 'Sincronización de usuarios activa',
      lastSync: new Date(Date.now() - 15 * 60 * 1000) // 15 minutes ago
    },
    {
      id: 2,
      name: 'SSO Service',
      status: 'online',
      description: 'Inicio de sesión único disponible',
      lastSync: new Date(Date.now() - 5 * 60 * 1000) // 5 minutes ago
    },
    {
      id: 3,
      name: 'Database',
      status: 'online',
      description: 'Base de datos operativa',
      lastSync: new Date(Date.now() - 2 * 60 * 1000) // 2 minutes ago
    },
    {
      id: 4,
      name: 'Backup System',
      status: 'maintenance',
      description: 'Respaldo programado en progreso',
      lastSync: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
    }
  ];

  const maintenanceSchedule = [
    {
      id: 1,
      title: 'Mantenimiento de Base de Datos',
      description: 'Optimización y limpieza de datos históricos',
      scheduledDate: '2025-01-05',
      scheduledTime: '02:00 - 04:00',
      impact: 'low'
    },
    {
      id: 2,
      title: 'Actualización de Seguridad',
      description: 'Parches de seguridad y actualizaciones del sistema',
      scheduledDate: '2025-01-12',
      scheduledTime: '01:00 - 03:00',
      impact: 'medium'
    },
    {
      id: 3,
      title: 'Migración de Servidores',
      description: 'Migración a nueva infraestructura de servidores',
      scheduledDate: '2025-01-19',
      scheduledTime: '00:00 - 06:00',
      impact: 'high'
    }
  ];

  const recentUpdates = [
    {
      id: 1,
      version: 'v2.4.1',
      date: '2025-01-02',
      changes: [
        'Mejoras en el rendimiento del dashboard',
        'Corrección de errores en reportes',
        'Nueva funcionalidad de exportación'
      ]
    },
    {
      id: 2,
      version: 'v2.4.0',
      date: '2024-12-28',
      changes: [
        'Interfaz renovada para móviles',
        'Integración con sistema de nómina',
        'Notificaciones en tiempo real'
      ]
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return 'text-success';
      case 'maintenance': return 'text-warning';
      case 'offline': return 'text-error';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'online': return 'CheckCircle';
      case 'maintenance': return 'Settings';
      case 'offline': return 'XCircle';
      default: return 'Circle';
    }
  };

  const getImpactColor = (impact) => {
    switch (impact) {
      case 'high': return 'text-error';
      case 'medium': return 'text-warning';
      case 'low': return 'text-success';
      default: return 'text-muted-foreground';
    }
  };

  const formatRelativeTime = (date) => {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 1) return 'Ahora';
    if (minutes < 60) return `hace ${minutes}m`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `hace ${hours}h`;
    
    const days = Math.floor(hours / 24);
    return `hace ${days}d`;
  };

  return (
    <div className="w-full max-w-sm">
      {/* System Status Section */}
      <div className="bg-card rounded-lg shadow-lg border border-border p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Icon name="Activity" size={20} className="text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Estado del Sistema</h3>
          </div>
          <div className="text-xs text-muted-foreground">
            {currentTime.toLocaleTimeString('es-ES', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </div>
        </div>

        <div className="space-y-3">
          {systemServices?.map((service) => (
            <div key={service?.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center space-x-3">
                <Icon 
                  name={getStatusIcon(service?.status)} 
                  size={16} 
                  className={getStatusColor(service?.status)} 
                />
                <div>
                  <p className="text-sm font-medium text-foreground">{service?.name}</p>
                  <p className="text-xs text-muted-foreground">{service?.description}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-xs font-medium capitalize ${getStatusColor(service?.status)}`}>
                  {service?.status === 'online' ? 'En línea' : 
                   service?.status === 'maintenance' ? 'Mantenimiento' : 'Fuera de línea'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatRelativeTime(service?.lastSync)}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 bg-success/10 rounded-lg">
          <div className="flex items-center space-x-2">
            <Icon name="CheckCircle" size={16} className="text-success" />
            <p className="text-sm font-medium text-success">Todos los servicios operativos</p>
          </div>
        </div>
      </div>
      {/* Maintenance Schedule Section */}
      <div className="bg-card rounded-lg shadow-lg border border-border p-6 mb-6">
        <div className="flex items-center space-x-2 mb-4">
          <Icon name="Calendar" size={20} className="text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Mantenimiento Programado</h3>
        </div>

        <div className="space-y-3">
          {maintenanceSchedule?.map((maintenance) => (
            <div key={maintenance?.id} className="border-l-4 border-warning/30 pl-4 py-2">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-foreground">{maintenance?.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {maintenance?.description}
                  </p>
                  <div className="flex items-center space-x-4 mt-2">
                    <p className="text-xs text-muted-foreground">
                      {new Date(maintenance.scheduledDate)?.toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'short'
                      })}
                    </p>
                    <p className="text-xs text-muted-foreground">{maintenance?.scheduledTime}</p>
                  </div>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  maintenance?.impact === 'high' ? 'bg-error/10 text-error' :
                  maintenance?.impact === 'medium'? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'
                }`}>
                  {maintenance?.impact === 'high' ? 'Alto' :
                   maintenance?.impact === 'medium' ? 'Medio' : 'Bajo'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Recent Updates Section */}
      <div className="bg-card rounded-lg shadow-lg border border-border p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Icon name="Download" size={20} className="text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Actualizaciones Recientes</h3>
        </div>

        <div className="space-y-4">
          {recentUpdates?.map((update) => (
            <div key={update?.id} className="p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-primary">{update?.version}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(update.date)?.toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'short'
                  })}
                </span>
              </div>
              <ul className="space-y-1">
                {update?.changes?.map((change, index) => (
                  <li key={index} className="text-xs text-muted-foreground flex items-start space-x-2">
                    <Icon name="ChevronRight" size={12} className="mt-0.5 flex-shrink-0" />
                    <span>{change}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-4 text-center">
          <button className="text-xs text-primary hover:text-primary/80 transition-colors">
            Ver historial completo
          </button>
        </div>
      </div>
    </div>
  );
};

export default SystemStatus;