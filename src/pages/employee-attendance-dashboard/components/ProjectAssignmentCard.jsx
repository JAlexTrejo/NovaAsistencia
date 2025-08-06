import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const ProjectAssignmentCard = ({ 
  assignment = null,
  onContactSupervisor = () => {},
  onViewProjectDetails = () => {}
}) => {
  // Mock assignment data
  const mockAssignment = {
    projectName: 'Construcción Edificio Residencial Torre Norte',
    projectCode: 'TN-2025-001',
    siteName: 'Obra Central',
    siteAddress: 'Av. Principal 1234, Madrid, España',
    supervisor: {
      name: 'Carlos Mendez',
      phone: '+34 612 345 678',
      email: 'carlos.mendez@construcciones.es',
      avatar: null
    },
    startDate: '2025-01-15',
    expectedEndDate: '2025-06-30',
    progress: 35,
    currentPhase: 'Estructura',
    workSchedule: {
      monday: '08:00 - 17:30',
      tuesday: '08:00 - 17:30',
      wednesday: '08:00 - 17:30',
      thursday: '08:00 - 17:30',
      friday: '08:00 - 17:30',
      saturday: '09:00 - 14:00',
      sunday: 'Descanso'
    },
    teamSize: 24,
    safetyOfficer: 'Ana Rodriguez',
    emergencyContact: '+34 900 123 456',
    coordinates: { lat: 40.4168, lng: -3.7038 }
  };

  const data = assignment || mockAssignment;

  const getInitials = (name) => {
    return name
      .split(' ')?.map(word => word?.charAt(0))?.join('')?.toUpperCase()?.slice(0, 2);
  };

  const formatDate = (dateString) => {
    return new Date(dateString)?.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getProgressColor = (progress) => {
    if (progress < 30) return 'bg-error';
    if (progress < 70) return 'bg-warning';
    return 'bg-success';
  };

  const getCurrentDaySchedule = () => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = days?.[new Date()?.getDay()];
    return data?.workSchedule?.[today] || 'No programado';
  };

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-primary/5 border-b border-border">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-foreground mb-1">
              Asignación Actual
            </h3>
            <p className="text-sm text-muted-foreground">
              {data?.projectCode}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            iconName="ExternalLink"
            iconPosition="right"
            onClick={onViewProjectDetails}
          >
            Ver Proyecto
          </Button>
        </div>
      </div>
      {/* Project Info */}
      <div className="px-6 py-4 border-b border-border">
        <h4 className="font-medium text-foreground mb-3">
          {data?.projectName}
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Site Location */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Icon name="MapPin" size={16} className="text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">
                {data?.siteName}
              </span>
            </div>
            <p className="text-xs text-muted-foreground ml-6">
              {data?.siteAddress}
            </p>
          </div>

          {/* Current Phase */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Icon name="Building2" size={16} className="text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">
                Fase Actual: {data?.currentPhase}
              </span>
            </div>
            <div className="ml-6">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">Progreso</span>
                <span className="font-medium text-foreground">{data?.progress}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ease-out-cubic ${getProgressColor(data?.progress)}`}
                  style={{ width: `${data?.progress}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Schedule Info */}
      <div className="px-6 py-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h5 className="font-medium text-foreground">Horario de Trabajo</h5>
          <div className="flex items-center space-x-1 text-sm text-primary">
            <Icon name="Clock" size={16} />
            <span>Hoy: {getCurrentDaySchedule()}</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          {Object.entries(data?.workSchedule)?.map(([day, schedule]) => {
            const dayLabels = {
              monday: 'Lun',
              tuesday: 'Mar',
              wednesday: 'Mié',
              thursday: 'Jue',
              friday: 'Vie',
              saturday: 'Sáb',
              sunday: 'Dom'
            };
            
            const isToday = new Date()?.getDay() === Object.keys(data?.workSchedule)?.indexOf(day);
            
            return (
              <div 
                key={day}
                className={`p-2 rounded text-center ${
                  isToday ? 'bg-primary/10 text-primary' : 'bg-muted/50 text-muted-foreground'
                }`}
              >
                <div className="font-medium">{dayLabels?.[day]}</div>
                <div className="text-xs">{schedule}</div>
              </div>
            );
          })}
        </div>
      </div>
      {/* Supervisor Info */}
      <div className="px-6 py-4 border-b border-border">
        <h5 className="font-medium text-foreground mb-3">Supervisor Asignado</h5>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {data?.supervisor?.avatar ? (
              <img
                src={data?.supervisor?.avatar}
                alt={data?.supervisor?.name}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                {getInitials(data?.supervisor?.name)}
              </div>
            )}
            
            <div>
              <p className="text-sm font-medium text-foreground">
                {data?.supervisor?.name}
              </p>
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                <Icon name="Phone" size={12} />
                <span>{data?.supervisor?.phone}</span>
              </div>
            </div>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            iconName="MessageCircle"
            iconPosition="left"
            onClick={onContactSupervisor}
          >
            Contactar
          </Button>
        </div>
      </div>
      {/* Additional Info */}
      <div className="px-6 py-4 bg-muted/30">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <Icon name="Users" size={16} className="text-muted-foreground" />
            <div>
              <div className="font-medium text-foreground">{data?.teamSize}</div>
              <div className="text-xs text-muted-foreground">Trabajadores</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Icon name="Shield" size={16} className="text-muted-foreground" />
            <div>
              <div className="font-medium text-foreground">{data?.safetyOfficer}</div>
              <div className="text-xs text-muted-foreground">Seguridad</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Icon name="Phone" size={16} className="text-error" />
            <div>
              <div className="font-medium text-foreground">{data?.emergencyContact}</div>
              <div className="text-xs text-muted-foreground">Emergencias</div>
            </div>
          </div>
        </div>
      </div>
      {/* Project Timeline */}
      <div className="px-6 py-4">
        <div className="flex items-center justify-between text-sm">
          <div>
            <span className="text-muted-foreground">Inicio: </span>
            <span className="font-medium text-foreground">
              {formatDate(data?.startDate)}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Fin estimado: </span>
            <span className="font-medium text-foreground">
              {formatDate(data?.expectedEndDate)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectAssignmentCard;