import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import { Checkbox } from '../../../components/ui/Checkbox';

const FilterPanel = ({ 
  isCollapsed, 
  onToggleCollapse, 
  filters, 
  onFiltersChange,
  onApplyFilters,
  onResetFilters 
}) => {
  const [localFilters, setLocalFilters] = useState(filters);

  const siteOptions = [
    { value: 'all', label: 'Todos los Sitios' },
    { value: 'obra-central', label: 'Obra Central' },
    { value: 'proyecto-norte', label: 'Proyecto Norte' },
    { value: 'edificio-sur', label: 'Edificio Sur' },
    { value: 'complejo-oeste', label: 'Complejo Oeste' }
  ];

  const supervisorOptions = [
    { value: 'all', label: 'Todos los Supervisores' },
    { value: 'carlos-martinez', label: 'Carlos Martínez' },
    { value: 'ana-rodriguez', label: 'Ana Rodríguez' },
    { value: 'luis-garcia', label: 'Luis García' },
    { value: 'maria-lopez', label: 'María López' }
  ];

  const statusOptions = [
    { value: 'all', label: 'Todos los Estados' },
    { value: 'complete', label: 'Completo' },
    { value: 'incomplete', label: 'Incompleto' },
    { value: 'late', label: 'Tardío' },
    { value: 'overtime', label: 'Horas Extra' }
  ];

  const savedViewOptions = [
    { value: '', label: 'Seleccionar vista guardada...' },
    { value: 'weekly-summary', label: 'Resumen Semanal' },
    { value: 'monthly-report', label: 'Reporte Mensual' },
    { value: 'tardiness-analysis', label: 'Análisis de Tardanzas' },
    { value: 'overtime-tracking', label: 'Seguimiento Horas Extra' }
  ];

  const handleFilterChange = (key, value) => {
    const updatedFilters = { ...localFilters, [key]: value };
    setLocalFilters(updatedFilters);
    onFiltersChange(updatedFilters);
  };

  const handleApply = () => {
    onApplyFilters(localFilters);
  };

  const handleReset = () => {
    const resetFilters = {
      dateFrom: '',
      dateTo: '',
      site: 'all',
      supervisor: 'all',
      status: 'all',
      employee: '',
      includeIncidents: false,
      includeOvertime: true,
      savedView: ''
    };
    setLocalFilters(resetFilters);
    onResetFilters();
  };

  if (isCollapsed) {
    return (
      <div className="w-16 bg-card border-r border-border p-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
          className="w-full"
        >
          <Icon name="ChevronRight" size={20} />
        </Button>
      </div>
    );
  }

  return (
    <div className="w-80 bg-card border-r border-border p-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-foreground">Filtros</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
        >
          <Icon name="ChevronLeft" size={20} />
        </Button>
      </div>
      <div className="space-y-6">
        {/* Saved Views */}
        <div>
          <Select
            label="Vistas Guardadas"
            options={savedViewOptions}
            value={localFilters?.savedView}
            onChange={(value) => handleFilterChange('savedView', value)}
            placeholder="Cargar vista guardada..."
          />
        </div>

        {/* Date Range */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-foreground">Rango de Fechas</h3>
          <Input
            label="Fecha Desde"
            type="date"
            value={localFilters?.dateFrom}
            onChange={(e) => handleFilterChange('dateFrom', e?.target?.value)}
          />
          <Input
            label="Fecha Hasta"
            type="date"
            value={localFilters?.dateTo}
            onChange={(e) => handleFilterChange('dateTo', e?.target?.value)}
          />
        </div>

        {/* Site Selection */}
        <div>
          <Select
            label="Sitio de Construcción"
            options={siteOptions}
            value={localFilters?.site}
            onChange={(value) => handleFilterChange('site', value)}
          />
        </div>

        {/* Supervisor Selection */}
        <div>
          <Select
            label="Supervisor"
            options={supervisorOptions}
            value={localFilters?.supervisor}
            onChange={(value) => handleFilterChange('supervisor', value)}
          />
        </div>

        {/* Employee Search */}
        <div>
          <Input
            label="Buscar Empleado"
            type="search"
            placeholder="Nombre del empleado..."
            value={localFilters?.employee}
            onChange={(e) => handleFilterChange('employee', e?.target?.value)}
          />
        </div>

        {/* Status Filter */}
        <div>
          <Select
            label="Estado de Asistencia"
            options={statusOptions}
            value={localFilters?.status}
            onChange={(value) => handleFilterChange('status', value)}
          />
        </div>

        {/* Additional Options */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-foreground">Opciones Adicionales</h3>
          
          <Checkbox
            label="Incluir Incidentes"
            checked={localFilters?.includeIncidents}
            onChange={(e) => handleFilterChange('includeIncidents', e?.target?.checked)}
          />
          
          <Checkbox
            label="Incluir Horas Extra"
            checked={localFilters?.includeOvertime}
            onChange={(e) => handleFilterChange('includeOvertime', e?.target?.checked)}
          />
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-4 border-t border-border">
          <Button
            variant="default"
            fullWidth
            onClick={handleApply}
            iconName="Search"
            iconPosition="left"
          >
            Aplicar Filtros
          </Button>
          
          <Button
            variant="outline"
            fullWidth
            onClick={handleReset}
            iconName="RotateCcw"
            iconPosition="left"
          >
            Limpiar Filtros
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="space-y-2 pt-4 border-t border-border">
          <h3 className="text-sm font-medium text-foreground">Acciones Rápidas</h3>
          
          <Button
            variant="ghost"
            size="sm"
            fullWidth
            iconName="Calendar"
            iconPosition="left"
            onClick={() => {
              const today = new Date()?.toISOString()?.split('T')?.[0];
              const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)?.toISOString()?.split('T')?.[0];
              handleFilterChange('dateFrom', weekAgo);
              handleFilterChange('dateTo', today);
            }}
          >
            Última Semana
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            fullWidth
            iconName="Calendar"
            iconPosition="left"
            onClick={() => {
              const today = new Date()?.toISOString()?.split('T')?.[0];
              const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)?.toISOString()?.split('T')?.[0];
              handleFilterChange('dateFrom', monthAgo);
              handleFilterChange('dateTo', today);
            }}
          >
            Último Mes
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FilterPanel;