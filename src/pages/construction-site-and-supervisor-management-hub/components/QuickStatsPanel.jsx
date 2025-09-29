import React, { useMemo } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const numberFmt = new Intl.NumberFormat('es-MX');

/**
 * QuickStatsPanel
 * - sites: [{ id, name, location, status, employeeCount, progress, supervisor }]
 * - supervisors: [{ id, name, email, assignedSites, totalEmployees, experience, status }]
 */
const QuickStatsPanel = ({
  sites = [],
  supervisors = [],
  onViewReports,
  onExportData,
  selectedNode,
}) => {
  // -------- Helpers
  const safeNum = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);
  const asPct = (v) => (Number.isFinite(Number(v)) ? `${v}%` : '—');

  // -------- Estadísticas generales (memo)
  const stats = useMemo(() => {
    const totalSites = safeNum(sites?.length, 0);
    const activeSites = safeNum(sites?.filter((s) => s?.status === 'active')?.length, 0);
    const totalEmployees = safeNum(
      sites?.reduce((sum, s) => sum + safeNum(s?.employeeCount, 0), 0),
      0
    );
    const totalSupervisors = safeNum(supervisors?.length, 0);
    const unassignedSites = safeNum(sites?.filter((s) => !s?.supervisor)?.length, 0);
    const avgEmployeesPerSite =
      totalSites > 0 ? Math.round(totalEmployees / totalSites) : 0;

    return {
      totalSites,
      activeSites,
      totalEmployees,
      totalSupervisors,
      unassignedSites,
      avgEmployeesPerSite,
    };
  }, [sites, supervisors]);

  // -------- Resumen del nodo seleccionado (memo)
  const selectedStats = useMemo(() => {
    if (!selectedNode) return null;

    if (selectedNode?.type === 'site') {
      const d = selectedNode?.data || {};
      return {
        title: d?.name || 'Sitio',
        subtitle: d?.location || 'Ubicación no especificada',
        stats: [
          { label: 'Empleados', value: safeNum(d?.employeeCount, 0), icon: 'Users' },
          { label: 'Progreso', value: asPct(d?.progress), icon: 'TrendingUp' },
          { label: 'Estado', value: d?.status || '—', icon: 'Activity' },
          { label: 'Supervisor', value: d?.supervisor?.name || 'Sin asignar', icon: 'UserCheck' },
        ],
      };
    }

    if (selectedNode?.type === 'supervisor') {
      const d = selectedNode?.data || {};
      return {
        title: d?.name || 'Supervisor',
        subtitle: d?.email || '—',
        stats: [
          { label: 'Sitios', value: safeNum(d?.assignedSites, 0), icon: 'Building2' },
          { label: 'Empleados', value: safeNum(d?.totalEmployees, 0), icon: 'Users' },
          { label: 'Experiencia', value: Number.isFinite(d?.experience) ? `${d?.experience} años` : '—', icon: 'Award' },
          { label: 'Estado', value: d?.status || '—', icon: 'Activity' },
        ],
      };
    }

    return null;
  }, [selectedNode]);

  // -------- Color map (Tailwind seguro)
  const colorMap = {
    primary: { bg: 'bg-primary/10', text: 'text-primary', badge: 'bg-primary/10 text-primary' },
    success: { bg: 'bg-success/10', text: 'text-success', badge: 'bg-success/10 text-success' },
    warning: { bg: 'bg-warning/10', text: 'text-warning', badge: 'bg-warning/10 text-warning' },
    error:   { bg: 'bg-error/10',   text: 'text-error',   badge: 'bg-error/10 text-error' },
    secondary: { bg: 'bg-secondary/10', text: 'text-secondary', badge: 'bg-secondary/10 text-secondary' },
    muted: { bg: 'bg-muted', text: 'text-muted-foreground', badge: 'bg-muted text-muted-foreground' },
  };

  const StatCard = ({ icon, label, value, color = 'primary' }) => {
    const c = colorMap[color] || colorMap.muted;
    return (
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${c.bg}`}>
            <Icon name={icon} size={20} className={c.text} />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{numberFmt.format(safeNum(value, 0))}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Selected Node Details */}
      {selectedStats && (
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground">{selectedStats.title}</h3>
              <p className="text-sm text-muted-foreground">{selectedStats.subtitle}</p>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewReports?.(selectedNode)}
                iconName="BarChart3"
                iconPosition="left"
              >
                Ver reportes
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onExportData?.(selectedNode)}
                iconName="Download"
                iconPosition="left"
              >
                Exportar
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {selectedStats.stats.map((stat, i) => (
              <div key={i} className="flex items-center space-x-3 p-3 bg-muted/50 rounded-md">
                <Icon name={stat.icon} size={16} className="text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {typeof stat.value === 'number' ? numberFmt.format(stat.value) : stat.value}
                  </p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
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
            onClick={() => onExportData?.({ type: 'all' })}
            iconName="Download"
            iconPosition="left"
          >
            Exportar todo
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <StatCard icon="Building2" label="Total de sitios" value={stats.totalSites} color="primary" />
          <StatCard icon="Play" label="Sitios activos" value={stats.activeSites} color="success" />
          <StatCard icon="Users" label="Total empleados" value={stats.totalEmployees} color="secondary" />
          <StatCard icon="UserCheck" label="Supervisores" value={stats.totalSupervisors} color="warning" />
        </div>
      </div>

      {/* Unassigned Alert */}
      {stats.unassignedSites > 0 && (
        <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <Icon name="AlertTriangle" size={20} className="text-warning" />
            <div>
              <p className="text-sm font-medium text-warning">
                {numberFmt.format(stats.unassignedSites)} sitio
                {stats.unassignedSites > 1 ? 's' : ''} sin supervisor
              </p>
              <p className="text-xs text-warning/80">Asigna supervisores para mejorar la gestión</p>
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
            onClick={() => onViewReports?.({ type: 'attendance' })}
            iconName="Clock"
            iconPosition="left"
          >
            Reportes de asistencia
          </Button>
          <Button
            variant="outline"
            fullWidth
            onClick={() => onViewReports?.({ type: 'payroll' })}
            iconName="Calculator"
            iconPosition="left"
          >
            Resúmenes de nómina
          </Button>
          <Button
            variant="outline"
            fullWidth
            onClick={() => onViewReports?.({ type: 'incidents' })}
            iconName="AlertTriangle"
            iconPosition="left"
          >
            Estadísticas de incidentes
          </Button>
        </div>
      </div>

      {/* System Integration Status (mock) */}
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
