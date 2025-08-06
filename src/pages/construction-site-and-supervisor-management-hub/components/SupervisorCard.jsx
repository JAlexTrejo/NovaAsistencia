import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const SupervisorCard = ({ 
  supervisor, 
  onEdit, 
  onDelete, 
  onViewDetails, 
  onAssignSites,
  userRole = 'admin'
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusColor = (status) => {
    const colors = {
      'active': 'bg-success text-success-foreground',
      'inactive': 'bg-secondary text-secondary-foreground',
      'vacation': 'bg-warning text-warning-foreground'
    };
    return colors?.[status] || colors?.active;
  };

  const getInitials = (name) => {
    return name
      .split(' ')?.map(word => word?.charAt(0))?.join('')?.toUpperCase()?.slice(0, 2);
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-all duration-200 ease-out-cubic">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-4">
          {supervisor?.avatar ? (
            <img
              src={supervisor?.avatar}
              alt={supervisor?.name}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
              {getInitials(supervisor?.name)}
            </div>
          )}
          
          <div>
            <h3 className="text-lg font-semibold text-foreground">{supervisor?.name}</h3>
            <p className="text-sm text-muted-foreground">{supervisor?.email}</p>
            <div className="flex items-center space-x-2 mt-1">
              <Icon name="Phone" size={12} className="text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{supervisor?.phone}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(supervisor?.status)}`}>
            {supervisor?.status === 'active' ? 'Activo' : 
             supervisor?.status === 'inactive' ? 'Inactivo' : 'Vacaciones'}
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
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-primary">{supervisor?.assignedSites}</p>
          <p className="text-xs text-muted-foreground">Sitios asignados</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-success">{supervisor?.totalEmployees}</p>
          <p className="text-xs text-muted-foreground">Empleados</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-warning">{supervisor?.experience}</p>
          <p className="text-xs text-muted-foreground">Años exp.</p>
        </div>
      </div>
      {/* Sites Preview */}
      <div className="mb-4">
        <p className="text-sm font-medium text-foreground mb-2">Sitios supervisados</p>
        <div className="flex flex-wrap gap-2">
          {supervisor?.sites?.slice(0, 3)?.map((site, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-1 bg-muted text-muted-foreground rounded-md text-xs"
            >
              <Icon name="Building2" size={12} className="mr-1" />
              {site}
            </span>
          ))}
          {supervisor?.sites?.length > 3 && (
            <span className="inline-flex items-center px-2 py-1 bg-muted text-muted-foreground rounded-md text-xs">
              +{supervisor?.sites?.length - 3} más
            </span>
          )}
        </div>
      </div>
      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t border-border pt-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Fecha de contratación</p>
              <p className="text-sm font-medium text-foreground">
                {new Date(supervisor.hireDate)?.toLocaleDateString('es-ES')}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Especialización</p>
              <p className="text-sm font-medium text-foreground">{supervisor?.specialization}</p>
            </div>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-1">Certificaciones</p>
            <div className="flex flex-wrap gap-1">
              {supervisor?.certifications?.map((cert, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 bg-primary/10 text-primary rounded-md text-xs"
                >
                  <Icon name="Award" size={12} className="mr-1" />
                  {cert}
                </span>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-1">Todos los sitios</p>
            <div className="grid grid-cols-2 gap-2">
              {supervisor?.sites?.map((site, index) => (
                <div key={index} className="flex items-center space-x-2 p-2 bg-muted rounded-md">
                  <Icon name="Building2" size={14} className="text-muted-foreground" />
                  <span className="text-sm text-foreground">{site}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetails(supervisor)}
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
                  onClick={() => onAssignSites(supervisor)}
                  iconName="Building2"
                  iconPosition="left"
                >
                  Asignar sitios
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(supervisor)}
                  iconName="Edit"
                  iconPosition="left"
                >
                  Editar
                </Button>
                
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onDelete(supervisor)}
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

export default SupervisorCard;