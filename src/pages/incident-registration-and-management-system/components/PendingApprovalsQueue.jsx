import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';

const PendingApprovalsQueue = ({ incidents, onApprove, onReject, currentUser }) => {
  const [selectedIncidents, setSelectedIncidents] = useState([]);
  const [filterStatus, setFilterStatus] = useState('pending');
  const [sortBy, setSortBy] = useState('priority');
  const [expandedIncident, setExpandedIncident] = useState(null);

  const statusOptions = [
    { value: 'all', label: 'Todos los Estados' },
    { value: 'pending', label: 'Pendientes' },
    { value: 'approved', label: 'Aprobados' },
    { value: 'rejected', label: 'Rechazados' },
    { value: 'under_review', label: 'En Revisión' }
  ];

  const sortOptions = [
    { value: 'priority', label: 'Por Prioridad' },
    { value: 'date', label: 'Por Fecha' },
    { value: 'employee', label: 'Por Empleado' },
    { value: 'type', label: 'Por Tipo' }
  ];

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-warning/10 text-warning border-warning/20',
      approved: 'bg-success/10 text-success border-success/20',
      rejected: 'bg-error/10 text-error border-error/20',
      under_review: 'bg-primary/10 text-primary border-primary/20'
    };
    return colors?.[status] || colors?.pending;
  };

  const getPriorityIcon = (priority) => {
    return priority === 'high' ? 'AlertTriangle' : 'Clock';
  };

  const getPriorityColor = (priority) => {
    return priority === 'high' ? 'text-error' : 'text-muted-foreground';
  };

  const getTypeIcon = (type) => {
    const icons = {
      absence: 'UserX',
      permit: 'FileText',
      tardiness: 'Clock',
      medical: 'Heart',
      emergency: 'AlertTriangle',
      training: 'GraduationCap',
      other: 'HelpCircle'
    };
    return icons?.[type] || icons?.other;
  };

  const filteredIncidents = incidents?.filter(incident => filterStatus === 'all' || incident?.status === filterStatus)?.sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          if (a?.priority === 'high' && b?.priority !== 'high') return -1;
          if (a?.priority !== 'high' && b?.priority === 'high') return 1;
          return new Date(b.submittedAt) - new Date(a.submittedAt);
        case 'date':
          return new Date(b.submittedAt) - new Date(a.submittedAt);
        case 'employee':
          return a?.employeeName?.localeCompare(b?.employeeName);
        case 'type':
          return a?.type?.localeCompare(b?.type);
        default:
          return 0;
      }
    });

  const handleSelectIncident = (incidentId) => {
    setSelectedIncidents(prev => 
      prev?.includes(incidentId)
        ? prev?.filter(id => id !== incidentId)
        : [...prev, incidentId]
    );
  };

  const handleSelectAll = () => {
    const pendingIds = filteredIncidents?.filter(incident => incident?.status === 'pending')?.map(incident => incident?.id);
    
    setSelectedIncidents(prev => 
      prev?.length === pendingIds?.length ? [] : pendingIds
    );
  };

  const handleBulkAction = async (action) => {
    const selectedPendingIncidents = filteredIncidents?.filter(
      incident => selectedIncidents?.includes(incident?.id) && incident?.status === 'pending'
    );

    for (const incident of selectedPendingIncidents) {
      if (action === 'approve') {
        await onApprove(incident?.id, 'Aprobación masiva');
      } else if (action === 'reject') {
        await onReject(incident?.id, 'Rechazo masivo');
      }
    }

    setSelectedIncidents([]);
  };

  const formatDate = (date) => {
    return new Date(date)?.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateRange = (startDate, endDate) => {
    const start = new Date(startDate)?.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit'
    });
    
    if (!endDate) return start;
    
    const end = new Date(endDate)?.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit'
    });
    
    return `${start} - ${end}`;
  };

  const pendingCount = incidents?.filter(i => i?.status === 'pending')?.length;
  const selectedPendingCount = selectedIncidents?.filter(id => 
    incidents?.find(i => i?.id === id)?.status === 'pending'
  )?.length;

  return (
    <div className="bg-card border border-border rounded-lg">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Cola de Aprobaciones</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {pendingCount} incidentes pendientes de revisión
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Icon name="Clock" size={20} className="text-warning" />
            <span className="text-sm font-medium text-warning">
              {pendingCount} Pendientes
            </span>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              options={statusOptions}
              value={filterStatus}
              onChange={setFilterStatus}
              placeholder="Filtrar por estado..."
            />
            <Select
              options={sortOptions}
              value={sortBy}
              onChange={setSortBy}
              placeholder="Ordenar por..."
            />
          </div>
          
          {selectedPendingCount > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">
                {selectedPendingCount} seleccionados
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('approve')}
                iconName="Check"
                iconSize={16}
              >
                Aprobar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('reject')}
                iconName="X"
                iconSize={16}
              >
                Rechazar
              </Button>
            </div>
          )}
        </div>
      </div>
      {/* Incidents List */}
      <div className="max-h-96 overflow-y-auto">
        {filteredIncidents?.length === 0 ? (
          <div className="p-8 text-center">
            <Icon name="Inbox" size={48} className="mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              No hay incidentes
            </h3>
            <p className="text-sm text-muted-foreground">
              {filterStatus === 'pending' ?'No hay incidentes pendientes de aprobación' :'No se encontraron incidentes con los filtros aplicados'
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {/* Select All Header */}
            {filteredIncidents?.some(i => i?.status === 'pending') && (
              <div className="p-4 bg-muted/30">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedIncidents?.length === filteredIncidents?.filter(i => i?.status === 'pending')?.length}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-primary border-border rounded focus:ring-ring"
                  />
                  <span className="text-sm font-medium text-foreground">
                    Seleccionar todos los pendientes
                  </span>
                </label>
              </div>
            )}

            {filteredIncidents?.map((incident) => (
              <div key={incident?.id} className="p-4 hover:bg-muted/50 transition-colors duration-150">
                <div className="flex items-start space-x-4">
                  {/* Checkbox */}
                  {incident?.status === 'pending' && (
                    <input
                      type="checkbox"
                      checked={selectedIncidents?.includes(incident?.id)}
                      onChange={() => handleSelectIncident(incident?.id)}
                      className="w-4 h-4 text-primary border-border rounded focus:ring-ring mt-1"
                    />
                  )}

                  {/* Incident Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <Icon 
                          name={getTypeIcon(incident?.type)} 
                          size={16} 
                          className="text-muted-foreground" 
                        />
                        <span className="text-sm font-medium text-foreground">
                          {incident?.employeeName}
                        </span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(incident?.status)}`}>
                          {incident?.status === 'pending' && 'Pendiente'}
                          {incident?.status === 'approved' && 'Aprobado'}
                          {incident?.status === 'rejected' && 'Rechazado'}
                          {incident?.status === 'under_review' && 'En Revisión'}
                        </span>
                        {incident?.priority === 'high' && (
                          <Icon 
                            name="AlertTriangle" 
                            size={14} 
                            className="text-error" 
                          />
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-muted-foreground">
                          {formatDate(incident?.submittedAt)}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedIncident(
                            expandedIncident === incident?.id ? null : incident?.id
                          )}
                          iconName={expandedIncident === incident?.id ? 'ChevronUp' : 'ChevronDown'}
                          iconSize={16}
                        >
                          {expandedIncident === incident?.id ? 'Menos' : 'Más'}
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-2">
                      <span className="capitalize">{incident?.type}</span>
                      <span>•</span>
                      <span>{formatDateRange(incident?.startDate, incident?.endDate)}</span>
                      <span>•</span>
                      <span>{incident?.site}</span>
                    </div>

                    <p className="text-sm text-foreground line-clamp-2">
                      {incident?.description}
                    </p>

                    {/* Expanded Details */}
                    {expandedIncident === incident?.id && (
                      <div className="mt-4 p-4 bg-muted rounded-lg space-y-3">
                        <div>
                          <h4 className="text-sm font-medium text-foreground mb-1">Motivo:</h4>
                          <p className="text-sm text-muted-foreground capitalize">{incident?.reason}</p>
                        </div>
                        
                        {incident?.attachments && incident?.attachments?.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-foreground mb-2">Documentos:</h4>
                            <div className="flex flex-wrap gap-2">
                              {incident?.attachments?.map((attachment, index) => (
                                <div key={index} className="flex items-center space-x-2 bg-background px-2 py-1 rounded text-xs">
                                  <Icon name="Paperclip" size={12} />
                                  <span>{attachment?.name}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {incident?.status === 'pending' && (
                          <div className="flex items-center space-x-2 pt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onApprove(incident?.id, 'Aprobado por supervisor')}
                              iconName="Check"
                              iconSize={16}
                            >
                              Aprobar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onReject(incident?.id, 'Rechazado por supervisor')}
                              iconName="X"
                              iconSize={16}
                            >
                              Rechazar
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PendingApprovalsQueue;