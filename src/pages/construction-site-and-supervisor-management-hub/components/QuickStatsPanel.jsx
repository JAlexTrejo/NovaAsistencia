import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const QuickStatsPanel = ({ 
  sites, 
  supervisors, 
  onViewReports, 
  onExportData,
  selectedNode 
}) => {
  const getStats = () => {
    const totalSites = sites?.length;
    const activeSites = sites?.filter(site => site?.status === 'active')?.length;
    const totalEmployees = sites?.reduce((sum, site) => sum + site?.employeeCount, 0);
    const totalSupervisors = supervisors?.length;
    const unassignedSites = sites?.filter(site => !site?.supervisor)?.length;
    const avgEmployeesPerSite = totalSites > 0 ? Math.round(totalEmployees / totalSites) : 0;

    return {
      totalSites,
      activeSites,
      totalEmployees,
      totalSupervisors,
      unassignedSites,
      avgEmployeesPerSite
    };
  };

  const stats = getStats();

  const getSelectedNodeStats = () => {
    if (!selectedNode) return null;

    switch (selectedNode?.type) {
      case 'site':
        return {
          title: selectedNode?.data?.name,
          subtitle: selectedNode?.data?.location,
          stats: [
            { label: 'Empleados', value: selectedNode?.data?.employeeCount, icon: 'Users' },
            { label: 'Progreso', value: `${selectedNode?.data?.progress}%`, icon: 'TrendingUp' },
            { label: 'Estado', value: selectedNode?.data?.status, icon: 'Activity' },
            { label: 'Supervisor', value: selectedNode?.data?.supervisor?.name || 'Sin asignar', icon: 'UserCheck' }
          ]
        };
      case 'supervisor':
        return {
          title: selectedNode?.data?.name,
          subtitle: selectedNode?.data?.email,
          stats: [
            { label: 'Sitios', value: selectedNode?.data?.assignedSites, icon: 'Building2' },
            { label: 'Empleados', value: selectedNode?.data?.totalEmployees, icon: 'Users' },
            { label: 'Experiencia', value: `${selectedNode?.data?.experience} años`, icon: 'Award' },
            { label: 'Estado', value: selectedNode?.data?.status, icon: 'Activity' }
          ]
        };
      default:
        return null;
    }
  };

  const selectedStats = getSelectedNodeStats();

  const StatCard = ({ icon, label, value, color = 'primary' }) => (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center space-x-3">
        <div className={`flex items-center justify-center w-10 h-10 bg-${color}/10 rounded-lg`}>
          <Icon name={icon} size={20} className={`text-${color}`} />
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Selected Node Details */}
      {selectedStats && (
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground">{selectedStats?.title}</h3>
              <p className="text-sm text-muted-foreground">{selectedStats?.subtitle}</p>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewReports(selectedNode)}
                iconName="BarChart3"
                iconPosition="left"
              >
                Ver reportes
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onExportData(selectedNode)}
                iconName="Download"
                iconPosition="left"
              >
                Exportar
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {selectedStats?.stats?.map((stat, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-muted/50 rounded-md">
                <Icon name={stat?.icon} size={16} className="text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">{stat?.value}</p>
                  <p className="text-xs text-muted-foreground">{stat?.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Overall Statistics */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Estadísticas Generales</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onExportData({ type: 'all' })}
            iconName="Download"
            iconPosition="left"
          >
            Exportar todo
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <StatCard
            icon="Building2"
            label="Total de sitios"
            value={stats?.totalSites}
            color="primary"
          />
          <StatCard
            icon="Play"
            label="Sitios activos"
            value={stats?.activeSites}
            color="success"
          />
          <StatCard
            icon="Users"
            label="Total empleados"
            value={stats?.totalEmployees}
            color="secondary"
          />
          <StatCard
            icon="UserCheck"
            label="Supervisores"
            value={stats?.totalSupervisors}
            color="warning"
          />
        </div>
      </div>
      {/* Alerts and Warnings */}
      {stats?.unassignedSites > 0 && (
        <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <Icon name="AlertTriangle" size={20} className="text-warning" />
            <div>
              <p className="text-sm font-medium text-warning">
                {stats?.unassignedSites} sitio{stats?.unassignedSites > 1 ? 's' : ''} sin supervisor
              </p>
              <p className="text-xs text-warning/80">
                Asigna supervisores para mejorar la gestión
              </p>
            </div>
          </div>
        </div>
      )}
      {/* Quick Actions */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Acciones Rápidas</h3>
        <div className="space-y-3">
          <Button
            variant="outline"
            fullWidth
            onClick={() => onViewReports({ type: 'attendance' })}
            iconName="Clock"
            iconPosition="left"
          >
            Reportes de asistencia
          </Button>
          <Button
            variant="outline"
            fullWidth
            onClick={() => onViewReports({ type: 'payroll' })}
            iconName="Calculator"
            iconPosition="left"
          >
            Resúmenes de nómina
          </Button>
          <Button
            variant="outline"
            fullWidth
            onClick={() => onViewReports({ type: 'incidents' })}
            iconName="AlertTriangle"
            iconPosition="left"
          >
            Estadísticas de incidentes
          </Button>
        </div>
      </div>
      {/* System Integration Status */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Estado de Integración</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Icon name="Database" size={16} className="text-success" />
              <span className="text-sm text-foreground">Sistema de empleados</span>
            </div>
            <span className="text-xs text-success bg-success/10 px-2 py-1 rounded-full">Sincronizado</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Icon name="Calendar" size={16} className="text-success" />
              <span className="text-sm text-foreground">Gestión de proyectos</span>
            </div>
            <span className="text-xs text-success bg-success/10 px-2 py-1 rounded-full">Conectado</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Icon name="MapPin" size={16} className="text-warning" />
              <span className="text-sm text-foreground">Geolocalización</span>
            </div>
            <span className="text-xs text-warning bg-warning/10 px-2 py-1 rounded-full">Parcial</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickStatsPanel;