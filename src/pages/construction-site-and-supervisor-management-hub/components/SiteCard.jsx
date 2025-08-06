import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const SiteCard = ({ 
  site, 
  onEdit, 
  onDelete, 
  onViewDetails, 
  onAssignSupervisor,
  userRole = 'admin'
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusColor = (status) => {
    const colors = {
      'active': 'bg-success text-success-foreground',
      'planning': 'bg-warning text-warning-foreground',
      'completed': 'bg-secondary text-secondary-foreground',
      'suspended': 'bg-error text-error-foreground'
    };
    return colors?.[status] || colors?.active;
  };

  const getStatusIcon = (status) => {
    const icons = {
      'active': 'Play',
      'planning': 'Clock',
      'completed': 'CheckCircle',
      'suspended': 'Pause'
    };
    return icons?.[status] || 'Building2';
  };

  const formatDate = (dateString) => {
    return new Date(dateString)?.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-all duration-200 ease-out-cubic">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg">
              <Icon name="Building2" size={20} className="text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">{site?.name}</h3>
              <p className="text-sm text-muted-foreground">Código: {site?.code}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <div className="flex items-center space-x-1">
              <Icon name="MapPin" size={14} />
              <span>{site?.location}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Icon name="Users" size={14} />
              <span>{site?.employeeCount} empleados</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(site?.status)}`}>
            <Icon name={getStatusIcon(site?.status)} size={12} className="mr-1" />
            {site?.status === 'active' ? 'Activo' : 
             site?.status === 'planning' ? 'Planificación' :
             site?.status === 'completed' ? 'Completado' : 'Suspendido'}
          </span>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <Icon name={isExpanded ? 'ChevronUp' : 'ChevronDown'} size={16} />
          </Button>
        </div>
      </div>
      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-muted-foreground">Progreso del proyecto</span>
          <span className="font-medium text-foreground">{site?.progress}%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300 ease-out-cubic"
            style={{ width: `${site?.progress}%` }}
          />
        </div>
      </div>
      {/* Supervisor Info */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
            <Icon name="UserCheck" size={16} className="text-secondary-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              {site?.supervisor ? site?.supervisor?.name : 'Sin supervisor asignado'}
            </p>
            {site?.supervisor && (
              <p className="text-xs text-muted-foreground">{site?.supervisor?.email}</p>
            )}
          </div>
        </div>
        
        {userRole === 'admin' && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAssignSupervisor(site)}
            iconName="UserPlus"
            iconPosition="left"
          >
            {site?.supervisor ? 'Cambiar' : 'Asignar'}
          </Button>
        )}
      </div>
      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t border-border pt-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Fecha de inicio</p>
              <p className="text-sm font-medium text-foreground">{formatDate(site?.startDate)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Fecha estimada de finalización</p>
              <p className="text-sm font-medium text-foreground">{formatDate(site?.endDate)}</p>
            </div>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-1">Descripción</p>
            <p className="text-sm text-foreground">{site?.description}</p>
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetails(site)}
              iconName="Eye"
              iconPosition="left"
            >
              Ver detalles
            </Button>
            
            {userRole === 'admin' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(site)}
                  iconName="Edit"
                  iconPosition="left"
                >
                  Editar
                </Button>
                
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onDelete(site)}
                  iconName="Trash2"
                  iconPosition="left"
                >
                  Eliminar
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SiteCard;