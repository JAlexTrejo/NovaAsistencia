import React from 'react';
import Icon from '../../../components/AppIcon';

const SafetyReminders = () => {
  const safetyTips = [
    {
      id: 1,
      icon: 'HardHat',
      title: 'Equipo de Protección Personal',
      description: 'Siempre use casco, chaleco reflectivo y calzado de seguridad en el sitio de construcción.',
      priority: 'high'
    },
    {
      id: 2,
      icon: 'AlertTriangle',
      title: 'Reporte de Incidentes',
      description: 'Reporte inmediatamente cualquier accidente o condición insegura a su supervisor.',
      priority: 'high'
    },
    {
      id: 3,
      icon: 'Eye',
      title: 'Protección Ocular',
      description: 'Use gafas de seguridad al trabajar con herramientas eléctricas o materiales que generen partículas.',
      priority: 'medium'
    },
    {
      id: 4,
      icon: 'Zap',
      title: 'Seguridad Eléctrica',
      description: 'Verifique que las herramientas eléctricas estén en buen estado antes de usarlas.',
      priority: 'medium'
    }
  ];

  const announcements = [
    {
      id: 1,
      type: 'info',
      title: 'Capacitación de Seguridad',
      message: 'Capacitación obligatoria de seguridad el viernes 8 de enero a las 8:00 AM.',
      date: '2025-01-04'
    },
    {
      id: 2,
      type: 'warning',
      title: 'Condiciones Climáticas',
      message: 'Se esperan lluvias fuertes. Extreme precauciones en superficies resbaladizas.',
      date: '2025-01-04'
    },
    {
      id: 3,
      type: 'success',
      title: 'Reconocimiento',
      message: 'Felicitaciones al equipo de Obra Central por 30 días sin incidentes.',
      date: '2025-01-03'
    }
  ];

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-error';
      case 'medium': return 'text-warning';
      default: return 'text-primary';
    }
  };

  const getAnnouncementIcon = (type) => {
    switch (type) {
      case 'warning': return 'AlertTriangle';
      case 'success': return 'CheckCircle';
      default: return 'Info';
    }
  };

  const getAnnouncementColor = (type) => {
    switch (type) {
      case 'warning': return 'text-warning';
      case 'success': return 'text-success';
      default: return 'text-primary';
    }
  };

  return (
    <div className="w-full max-w-sm">
      {/* Safety Reminders Section */}
      <div className="bg-card rounded-lg shadow-lg border border-border p-6 mb-6">
        <div className="flex items-center space-x-2 mb-4">
          <Icon name="Shield" size={20} className="text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Recordatorios de Seguridad</h3>
        </div>

        <div className="space-y-4">
          {safetyTips?.map((tip) => (
            <div key={tip?.id} className="flex items-start space-x-3 p-3 bg-muted/30 rounded-lg">
              <div className={`flex-shrink-0 ${getPriorityColor(tip?.priority)}`}>
                <Icon name={tip?.icon} size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-foreground mb-1">{tip?.title}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">{tip?.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 bg-primary/10 rounded-lg">
          <div className="flex items-center space-x-2">
            <Icon name="Phone" size={16} className="text-primary" />
            <div className="text-sm">
              <p className="font-medium text-foreground">Emergencias: 911</p>
              <p className="text-xs text-muted-foreground">Supervisor: (555) 123-4567</p>
            </div>
          </div>
        </div>
      </div>
      {/* Company Announcements Section */}
      <div className="bg-card rounded-lg shadow-lg border border-border p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Icon name="Megaphone" size={20} className="text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Anuncios de la Empresa</h3>
        </div>

        <div className="space-y-3">
          {announcements?.map((announcement) => (
            <div key={announcement?.id} className="border-l-4 border-primary/30 pl-4 py-2">
              <div className="flex items-start space-x-2">
                <Icon 
                  name={getAnnouncementIcon(announcement?.type)} 
                  size={16} 
                  className={`mt-0.5 ${getAnnouncementColor(announcement?.type)}`} 
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-foreground">{announcement?.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {announcement?.message}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2 opacity-75">
                    {new Date(announcement.date)?.toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'long'
                    })}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 text-center">
          <button className="text-xs text-primary hover:text-primary/80 transition-colors">
            Ver todos los anuncios
          </button>
        </div>
      </div>
    </div>
  );
};

export default SafetyReminders;