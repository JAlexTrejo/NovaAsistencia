import React, { useState } from 'react';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';

const PersonalIncidentLog = ({ 
  incidents = [],
  onViewIncident = () => {},
  onCreateIncident = () => {}
}) => {
  const [filter, setFilter] = useState('all');

  // Mock incident data
  const mockIncidents = [
    {
      id: 1,
      type: 'absence',
      title: 'Solicitud de Ausencia Médica',
      description: 'Cita médica programada para revisión anual',
      date: '2025-02-05',
      status: 'pending',
      priority: 'medium',
      attachments: [
        { name: 'cita_medica.pdf', size: '245 KB', type: 'pdf' }
      ],
      submittedAt: new Date('2025-01-28T10:30:00'),
      responseDate: null,
      approvedBy: null,
      comments: null
    },
    {
      id: 2,
      type: 'tardiness',
      title: 'Justificación de Tardanza',
      description: 'Retraso debido a problemas de transporte público',
      date: '2025-01-28',
      status: 'approved',
      priority: 'low',
      attachments: [],
      submittedAt: new Date('2025-01-28T09:15:00'),
      responseDate: new Date('2025-01-28T14:20:00'),
      approvedBy: 'Carlos Mendez',
      comments: 'Justificación aceptada. Se recomienda salir con más tiempo.'
    },
    {
      id: 3,
      type: 'permit',
      title: 'Permiso Personal',
      description: 'Trámites bancarios urgentes',
      date: '2025-01-25',
      status: 'rejected',
      priority: 'low',
      attachments: [],
      submittedAt: new Date('2025-01-24T16:45:00'),
      responseDate: new Date('2025-01-25T08:30:00'),
      approvedBy: 'Carlos Mendez',
      comments: 'No se puede aprobar debido a la carga de trabajo del proyecto.'
    },
    {
      id: 4,
      type: 'medical',
      title: 'Incapacidad Médica',
      description: 'Lesión menor en la mano derecha',
      date: '2025-01-20',
      status: 'approved',
      priority: 'high',
      attachments: [
        { name: 'certificado_medico.pdf', size: '1.2 MB', type: 'pdf' },
        { name: 'radiografia.jpg', size: '856 KB', type: 'image' }
      ],
      submittedAt: new Date('2025-01-20T11:00:00'),
      responseDate: new Date('2025-01-20T15:30:00'),
      approvedBy: 'Ana Rodriguez',
      comments: 'Aprobado. Reincorporación programada para el 22/01.'
    }
  ];

  const displayIncidents = incidents?.length > 0 ? incidents : mockIncidents;

  const getIncidentIcon = (type) => {
    const iconMap = {
      absence: 'UserX',
      tardiness: 'Clock',
      permit: 'FileText',
      medical: 'Heart',
      other: 'AlertCircle'
    };
    return iconMap?.[type] || iconMap?.other;
  };

  const getIncidentTypeLabel = (type) => {
    const labelMap = {
      absence: 'Ausencia',
      tardiness: 'Tardanza',
      permit: 'Permiso',
      medical: 'Médico',
      other: 'Otro'
    };
    return labelMap?.[type] || 'Desconocido';
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: 'Pendiente', color: 'bg-warning/10 text-warning', icon: 'Clock' },
      approved: { label: 'Aprobado', color: 'bg-success/10 text-success', icon: 'CheckCircle' },
      rejected: { label: 'Rechazado', color: 'bg-error/10 text-error', icon: 'XCircle' },
      draft: { label: 'Borrador', color: 'bg-muted text-muted-foreground', icon: 'Edit' }
    };

    const config = statusConfig?.[status] || statusConfig?.pending;
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config?.color}`}>
        <Icon name={config?.icon} size={12} className="mr-1" />
        {config?.label}
      </span>
    );
  };

  const getPriorityColor = (priority) => {
    const colorMap = {
      high: 'border-l-error',
      medium: 'border-l-warning',
      low: 'border-l-muted-foreground'
    };
    return colorMap?.[priority] || colorMap?.low;
  };

  const getAttachmentIcon = (type) => {
    if (type === 'pdf') return 'FileText';
    if (type === 'image') return 'Image';
    return 'Paperclip';
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i))?.toFixed(1)) + ' ' + sizes?.[i];
  };

  const filteredIncidents = displayIncidents?.filter(incident => {
    if (filter === 'all') return true;
    return incident?.status === filter;
  });

  const getFilterCount = (status) => {
    if (status === 'all') return displayIncidents?.length;
    return displayIncidents?.filter(i => i?.status === status)?.length;
  };

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h3 className="text-lg font-semibold text-foreground">
            Mis Incidentes
          </h3>
          
          <Button
            variant="default"
            iconName="Plus"
            iconPosition="left"
            onClick={onCreateIncident}
            className="w-full sm:w-auto"
          >
            Nuevo Incidente
          </Button>
        </div>
      </div>
      {/* Filter Tabs */}
      <div className="px-6 py-3 border-b border-border bg-muted/30">
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'all', label: 'Todos' },
            { key: 'pending', label: 'Pendientes' },
            { key: 'approved', label: 'Aprobados' },
            { key: 'rejected', label: 'Rechazados' }
          ]?.map((tab) => (
            <button
              key={tab?.key}
              onClick={() => setFilter(tab?.key)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-150 ease-out-cubic ${
                filter === tab?.key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {tab?.label} ({getFilterCount(tab?.key)})
            </button>
          ))}
        </div>
      </div>
      {/* Incidents List */}
      <div className="divide-y divide-border">
        {filteredIncidents?.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <Icon name="FileText" size={48} className="mx-auto text-muted-foreground mb-4" />
            <h4 className="text-lg font-medium text-foreground mb-2">
              No hay incidentes
            </h4>
            <p className="text-sm text-muted-foreground mb-4">
              {filter === 'all' ?'No has registrado ningún incidente aún.'
                : `No hay incidentes con estado "${filter}".`
              }
            </p>
            <Button
              variant="outline"
              iconName="Plus"
              iconPosition="left"
              onClick={onCreateIncident}
            >
              Crear Primer Incidente
            </Button>
          </div>
        ) : (
          filteredIncidents?.map((incident) => (
            <div
              key={incident?.id}
              className={`px-6 py-4 hover:bg-muted/30 transition-colors duration-150 ease-out-cubic border-l-4 ${getPriorityColor(incident?.priority)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex items-center space-x-3 mb-2">
                    <Icon 
                      name={getIncidentIcon(incident?.type)} 
                      size={20} 
                      className="text-muted-foreground flex-shrink-0" 
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-foreground truncate">
                        {incident?.title}
                      </h4>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {getIncidentTypeLabel(incident?.type)}
                        </span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(incident.date)?.toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                    {getStatusBadge(incident?.status)}
                  </div>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {incident?.description}
                  </p>

                  {/* Attachments */}
                  {incident?.attachments && incident?.attachments?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {incident?.attachments?.map((attachment, index) => (
                        <div
                          key={index}
                          className="flex items-center space-x-1 px-2 py-1 bg-muted rounded text-xs"
                        >
                          <Icon 
                            name={getAttachmentIcon(attachment?.type)} 
                            size={12} 
                            className="text-muted-foreground" 
                          />
                          <span className="text-muted-foreground truncate max-w-24">
                            {attachment?.name}
                          </span>
                          <span className="text-muted-foreground">
                            ({attachment?.size})
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Response Info */}
                  {incident?.status !== 'pending' && incident?.status !== 'draft' && (
                    <div className="text-xs text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <span>Respondido por {incident?.approvedBy}</span>
                        <span>•</span>
                        <span>
                          {incident?.responseDate?.toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      {incident?.comments && (
                        <p className="mt-1 text-foreground">
                          "{incident?.comments}"
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex-shrink-0 ml-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    iconName="Eye"
                    onClick={() => onViewIncident(incident)}
                  >
                    Ver
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      {/* Footer */}
      {filteredIncidents?.length > 0 && (
        <div className="px-6 py-4 bg-muted/30 border-t border-border">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {filteredIncidents?.length} incidente{filteredIncidents?.length !== 1 ? 's' : ''}
            </span>
            <button
              onClick={() => onViewIncident('all')}
              className="text-primary hover:text-primary/80 font-medium transition-colors duration-150 ease-out-cubic"
            >
              Ver historial completo
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonalIncidentLog;