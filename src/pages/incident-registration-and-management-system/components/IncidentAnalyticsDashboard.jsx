import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const IncidentAnalyticsDashboard = ({ incidents }) => {
  const [timeRange, setTimeRange] = useState('month');

  // Calculate analytics data
  const totalIncidents = incidents?.length;
  const pendingIncidents = incidents?.filter(i => i?.status === 'pending')?.length;
  const approvedIncidents = incidents?.filter(i => i?.status === 'approved')?.length;
  const rejectedIncidents = incidents?.filter(i => i?.status === 'rejected')?.length;

  // Incident types distribution
  const typeDistribution = incidents?.reduce((acc, incident) => {
    acc[incident.type] = (acc?.[incident?.type] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.entries(typeDistribution)?.map(([type, count]) => ({
    name: type,
    value: count,
    label: type === 'absence' ? 'Ausencia' :
           type === 'permit' ? 'Permiso' :
           type === 'tardiness' ? 'Tardanza' :
           type === 'medical' ? 'Médico' :
           type === 'emergency' ? 'Emergencia' :
           type === 'training' ? 'Capacitación' : 'Otro'
  }));

  // Monthly trend data
  const monthlyData = incidents?.reduce((acc, incident) => {
    const month = new Date(incident.submittedAt)?.toLocaleDateString('es-ES', { month: 'short' });
    const existing = acc?.find(item => item?.month === month);
    if (existing) {
      existing.count += 1;
      if (incident?.status === 'approved') existing.approved += 1;
      if (incident?.status === 'rejected') existing.rejected += 1;
    } else {
      acc?.push({
        month,
        count: 1,
        approved: incident?.status === 'approved' ? 1 : 0,
        rejected: incident?.status === 'rejected' ? 1 : 0
      });
    }
    return acc;
  }, []);

  // Site distribution
  const siteData = incidents?.reduce((acc, incident) => {
    acc[incident.site] = (acc?.[incident?.site] || 0) + 1;
    return acc;
  }, {});

  const siteChartData = Object.entries(siteData)?.map(([site, count]) => ({
    site,
    count
  }));

  // Top employees with most incidents
  const employeeData = incidents?.reduce((acc, incident) => {
    acc[incident.employeeName] = (acc?.[incident?.employeeName] || 0) + 1;
    return acc;
  }, {});

  const topEmployees = Object.entries(employeeData)?.sort(([,a], [,b]) => b - a)?.slice(0, 5)?.map(([name, count]) => ({ name, count }));

  const COLORS = ['#2563EB', '#F59E0B', '#DC2626', '#059669', '#7C3AED', '#EC4899'];

  const StatCard = ({ title, value, icon, color, description, trend }) => (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon name={icon} size={24} color="white" />
        </div>
      </div>
      {trend && (
        <div className="flex items-center mt-4 text-xs">
          <Icon 
            name={trend?.direction === 'up' ? 'TrendingUp' : 'TrendingDown'} 
            size={12} 
            className={trend?.direction === 'up' ? 'text-success' : 'text-error'} 
          />
          <span className={`ml-1 ${trend?.direction === 'up' ? 'text-success' : 'text-error'}`}>
            {trend?.percentage}%
          </span>
          <span className="text-muted-foreground ml-1">vs mes anterior</span>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Análisis de Incidentes</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Resumen y tendencias de incidentes registrados
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e?.target?.value)}
            className="px-3 py-2 border border-border rounded-md bg-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="week">Esta Semana</option>
            <option value="month">Este Mes</option>
            <option value="quarter">Este Trimestre</option>
            <option value="year">Este Año</option>
          </select>
        </div>
      </div>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Incidentes"
          value={totalIncidents}
          icon="FileText"
          color="bg-primary"
          description="Todos los incidentes registrados"
          trend={{ direction: 'up', percentage: 12 }}
        />
        <StatCard
          title="Pendientes"
          value={pendingIncidents}
          icon="Clock"
          color="bg-warning"
          description="Esperando aprobación"
          trend={{ direction: 'down', percentage: 5 }}
        />
        <StatCard
          title="Aprobados"
          value={approvedIncidents}
          icon="CheckCircle"
          color="bg-success"
          description="Incidentes aprobados"
          trend={{ direction: 'up', percentage: 8 }}
        />
        <StatCard
          title="Rechazados"
          value={rejectedIncidents}
          icon="XCircle"
          color="bg-error"
          description="Incidentes rechazados"
          trend={{ direction: 'down', percentage: 15 }}
        />
      </div>
      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Incident Types Distribution */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Distribución por Tipo
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100)?.toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS?.[index % COLORS?.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Trend */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Tendencia Mensual
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#2563EB" 
                  strokeWidth={2}
                  name="Total"
                />
                <Line 
                  type="monotone" 
                  dataKey="approved" 
                  stroke="#059669" 
                  strokeWidth={2}
                  name="Aprobados"
                />
                <Line 
                  type="monotone" 
                  dataKey="rejected" 
                  stroke="#DC2626" 
                  strokeWidth={2}
                  name="Rechazados"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Incidents by Site */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Incidentes por Sitio
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={siteChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="site" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#2563EB" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Employees */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Empleados con Más Incidentes
          </h3>
          <div className="space-y-3">
            {topEmployees?.map((employee, index) => (
              <div key={employee?.name} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-full text-sm font-medium">
                    {index + 1}
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    {employee?.name}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">
                    {employee?.count} incidentes
                  </span>
                  <div className="w-16 bg-border rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full"
                      style={{ width: `${(employee?.count / Math.max(...topEmployees?.map(e => e?.count))) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Quick Insights */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Insights Rápidos
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Icon name="TrendingUp" size={16} className="text-primary" />
              <span className="text-sm font-medium text-primary">Tendencia</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Los incidentes médicos han aumentado un 15% este mes, considere revisar las condiciones de seguridad.
            </p>
          </div>
          
          <div className="p-4 bg-warning/5 border border-warning/20 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Icon name="AlertTriangle" size={16} className="text-warning" />
              <span className="text-sm font-medium text-warning">Atención</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {pendingIncidents} incidentes pendientes requieren revisión urgente para mantener el flujo de trabajo.
            </p>
          </div>
          
          <div className="p-4 bg-success/5 border border-success/20 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Icon name="CheckCircle" size={16} className="text-success" />
              <span className="text-sm font-medium text-success">Positivo</span>
            </div>
            <p className="text-xs text-muted-foreground">
              El tiempo promedio de aprobación ha mejorado un 20% comparado con el mes anterior.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncidentAnalyticsDashboard;