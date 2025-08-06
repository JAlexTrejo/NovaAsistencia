import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const ReportTemplateLibrary = ({ onSelectTemplate, selectedTemplate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const reportTemplates = [
    {
      id: 'attendance-summary',
      name: 'Resumen de Asistencia',
      description: 'Reporte completo de asistencia por empleado y período',
      category: 'attendance',
      icon: 'Clock',
      fields: ['Empleado', 'Fecha', 'Entrada', 'Salida', 'Horas Trabajadas', 'Estado'],
      lastUsed: new Date(2025, 0, 3),
      popularity: 95
    },
    {
      id: 'payroll-detailed',
      name: 'Nómina Detallada',
      description: 'Cálculo completo de nómina con deducciones y bonificaciones',
      category: 'payroll',
      icon: 'Calculator',
      fields: ['Empleado', 'Salario Base', 'Horas Extra', 'Deducciones', 'Total'],
      lastUsed: new Date(2025, 0, 2),
      popularity: 88
    },
    {
      id: 'incident-analysis',
      name: 'Análisis de Incidentes',
      description: 'Reporte de incidentes por tipo, frecuencia y resolución',
      category: 'incidents',
      icon: 'AlertTriangle',
      fields: ['Fecha', 'Tipo', 'Empleado', 'Descripción', 'Estado', 'Resolución'],
      lastUsed: new Date(2025, 0, 1),
      popularity: 72
    },
    {
      id: 'compliance-audit',
      name: 'Auditoría de Cumplimiento',
      description: 'Reporte para auditorías laborales y cumplimiento normativo',
      category: 'compliance',
      icon: 'Shield',
      fields: ['Empleado', 'Horas Legales', 'Descansos', 'Overtime', 'Cumplimiento'],
      lastUsed: new Date(2024, 11, 28),
      popularity: 65
    },
    {
      id: 'site-productivity',
      name: 'Productividad por Sitio',
      description: 'Análisis de productividad y eficiencia por obra',
      category: 'analytics',
      icon: 'TrendingUp',
      fields: ['Sitio', 'Empleados', 'Horas Trabajadas', 'Productividad', 'Eficiencia'],
      lastUsed: new Date(2024, 11, 30),
      popularity: 78
    },
    {
      id: 'monthly-summary',
      name: 'Resumen Mensual',
      description: 'Consolidado mensual de asistencia, nómina e incidentes',
      category: 'summary',
      icon: 'Calendar',
      fields: ['Mes', 'Total Empleados', 'Asistencia %', 'Nómina Total', 'Incidentes'],
      lastUsed: new Date(2024, 11, 31),
      popularity: 92
    }
  ];

  const categories = [
    { id: 'all', name: 'Todos', icon: 'Grid3X3' },
    { id: 'attendance', name: 'Asistencia', icon: 'Clock' },
    { id: 'payroll', name: 'Nómina', icon: 'Calculator' },
    { id: 'incidents', name: 'Incidentes', icon: 'AlertTriangle' },
    { id: 'compliance', name: 'Cumplimiento', icon: 'Shield' },
    { id: 'analytics', name: 'Análisis', icon: 'TrendingUp' },
    { id: 'summary', name: 'Resúmenes', icon: 'FileText' }
  ];

  const filteredTemplates = reportTemplates?.filter(template => {
    const matchesSearch = template?.name?.toLowerCase()?.includes(searchTerm?.toLowerCase()) ||
                         template?.description?.toLowerCase()?.includes(searchTerm?.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template?.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const formatLastUsed = (date) => {
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    if (diffDays < 30) return `Hace ${Math.ceil(diffDays / 7)} semanas`;
    return `Hace ${Math.ceil(diffDays / 30)} meses`;
  };

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Plantillas de Reportes</h2>
          <p className="text-sm text-muted-foreground">Selecciona una plantilla predefinida para comenzar</p>
        </div>
        <Button variant="outline" iconName="Plus" iconPosition="left">
          Nueva Plantilla
        </Button>
      </div>
      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Icon name="Search" size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar plantillas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e?.target?.value)}
            className="w-full pl-10 pr-4 py-2 border border-border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories?.map((category) => (
            <button
              key={category?.id}
              onClick={() => setSelectedCategory(category?.id)}
              className={`
                flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap
                transition-all duration-150 ease-out-cubic
                ${selectedCategory === category?.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                }
              `}
            >
              <Icon name={category?.icon} size={16} />
              <span>{category?.name}</span>
            </button>
          ))}
        </div>
      </div>
      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTemplates?.map((template) => (
          <div
            key={template?.id}
            onClick={() => onSelectTemplate(template)}
            className={`
              p-4 border rounded-lg cursor-pointer transition-all duration-150 ease-out-cubic hover:scale-98
              ${selectedTemplate?.id === template?.id
                ? 'border-primary bg-primary/5' :'border-border hover:border-primary/50 hover:bg-muted/50'
              }
            `}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className={`
                  p-2 rounded-md
                  ${selectedTemplate?.id === template?.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                  }
                `}>
                  <Icon name={template?.icon} size={20} />
                </div>
                <div>
                  <h3 className="font-medium text-foreground">{template?.name}</h3>
                  <p className="text-sm text-muted-foreground">{template?.description}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  <Icon name="TrendingUp" size={14} className="text-success" />
                  <span className="text-xs text-success font-medium">{template?.popularity}%</span>
                </div>
              </div>
            </div>

            <div className="mb-3">
              <p className="text-xs text-muted-foreground mb-2">Campos incluidos:</p>
              <div className="flex flex-wrap gap-1">
                {template?.fields?.slice(0, 4)?.map((field, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded-md"
                  >
                    {field}
                  </span>
                ))}
                {template?.fields?.length > 4 && (
                  <span className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded-md">
                    +{template?.fields?.length - 4} más
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Último uso: {formatLastUsed(template?.lastUsed)}</span>
              <div className="flex items-center space-x-1">
                <Icon name="Clock" size={12} />
                <span>~2 min</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      {filteredTemplates?.length === 0 && (
        <div className="text-center py-12">
          <Icon name="FileX" size={48} className="mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No se encontraron plantillas</h3>
          <p className="text-muted-foreground mb-4">
            No hay plantillas que coincidan con tu búsqueda
          </p>
          <Button variant="outline" onClick={() => {
            setSearchTerm('');
            setSelectedCategory('all');
          }}>
            Limpiar filtros
          </Button>
        </div>
      )}
    </div>
  );
};

export default ReportTemplateLibrary;