import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Select from '../../../components/ui/Select';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import { Checkbox } from '../../../components/ui/Checkbox';

const EmployeeFilters = ({ 
  filters, 
  onFiltersChange, 
  onClearFilters,
  savedFilters = [],
  onSaveFilter,
  onLoadFilter 
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [filterName, setFilterName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  const constructionSites = [
    { value: 'all', label: 'Todos los sitios' },
    { value: 'obra-central', label: 'Obra Central' },
    { value: 'proyecto-norte', label: 'Proyecto Norte' },
    { value: 'edificio-sur', label: 'Edificio Sur' },
    { value: 'complejo-oeste', label: 'Complejo Oeste' }
  ];

  const supervisors = [
    { value: 'all', label: 'Todos los supervisores' },
    { value: 'carlos-martinez', label: 'Carlos Martínez' },
    { value: 'ana-rodriguez', label: 'Ana Rodríguez' },
    { value: 'miguel-santos', label: 'Miguel Santos' },
    { value: 'lucia-fernandez', label: 'Lucía Fernández' }
  ];

  const employmentStatuses = [
    { id: 'active', label: 'Activo', checked: filters?.status?.includes('active') || false },
    { id: 'inactive', label: 'Inactivo', checked: filters?.status?.includes('inactive') || false },
    { id: 'suspended', label: 'Suspendido', checked: filters?.status?.includes('suspended') || false },
    { id: 'terminated', label: 'Terminado', checked: filters?.status?.includes('terminated') || false }
  ];

  const handleStatusChange = (statusId, checked) => {
    const currentStatus = filters?.status || [];
    let newStatus;
    
    if (checked) {
      newStatus = [...currentStatus, statusId];
    } else {
      newStatus = currentStatus?.filter(s => s !== statusId);
    }
    
    onFiltersChange({ ...filters, status: newStatus });
  };

  const handleSaveFilter = () => {
    if (filterName?.trim()) {
      onSaveFilter({
        name: filterName,
        filters: filters,
        createdAt: new Date()
      });
      setFilterName('');
      setShowSaveDialog(false);
    }
  };

  const hasActiveFilters = () => {
    return filters?.search || 
           filters?.site !== 'all' || 
           filters?.supervisor !== 'all' || 
           (filters?.status && filters?.status?.length > 0) ||
           filters?.hireDateFrom ||
           filters?.hireDateTo;
  };

  return (
    <div className="bg-card border border-border rounded-lg">
      {/* Filter Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center space-x-2">
          <Icon name="Filter" size={20} className="text-muted-foreground" />
          <h3 className="font-medium text-foreground">Filtros</h3>
          {hasActiveFilters() && (
            <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
              Activos
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSaveDialog(true)}
            disabled={!hasActiveFilters()}
            iconName="Save"
            iconSize={16}
          >
            Guardar
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            disabled={!hasActiveFilters()}
            iconName="X"
            iconSize={16}
          >
            Limpiar
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            iconName={isCollapsed ? 'ChevronDown' : 'ChevronUp'}
            iconSize={16}
          />
        </div>
      </div>
      {/* Filter Content */}
      {!isCollapsed && (
        <div className="p-4 space-y-4">
          {/* Search */}
          <Input
            label="Búsqueda general"
            type="search"
            placeholder="Buscar por nombre, ID, email..."
            value={filters?.search || ''}
            onChange={(e) => onFiltersChange({ ...filters, search: e?.target?.value })}
            className="mb-4"
          />

          {/* Construction Site */}
          <Select
            label="Sitio de construcción"
            options={constructionSites}
            value={filters?.site || 'all'}
            onChange={(value) => onFiltersChange({ ...filters, site: value })}
            className="mb-4"
          />

          {/* Supervisor */}
          <Select
            label="Supervisor"
            options={supervisors}
            value={filters?.supervisor || 'all'}
            onChange={(value) => onFiltersChange({ ...filters, supervisor: value })}
            className="mb-4"
          />

          {/* Employment Status */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Estado de empleo</label>
            <div className="space-y-2">
              {employmentStatuses?.map((status) => (
                <Checkbox
                  key={status.id}
                  label={status.label}
                  checked={status.checked}
                  onChange={(e) => handleStatusChange(status.id, e?.target?.checked)}
                />
              ))}
            </div>
          </div>

          {/* Hire Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Fecha de contratación desde"
              type="date"
              value={filters?.hireDateFrom || ''}
              onChange={(e) => onFiltersChange({ ...filters, hireDateFrom: e?.target?.value })}
            />
            <Input
              label="Fecha de contratación hasta"
              type="date"
              value={filters?.hireDateTo || ''}
              onChange={(e) => onFiltersChange({ ...filters, hireDateTo: e?.target?.value })}
            />
          </div>

          {/* Saved Filters */}
          {savedFilters?.length > 0 && (
            <div className="pt-4 border-t border-border">
              <label className="text-sm font-medium text-foreground mb-2 block">Filtros guardados</label>
              <div className="space-y-2">
                {savedFilters?.map((savedFilter, index) => (
                  <button
                    key={index}
                    onClick={() => onLoadFilter(savedFilter)}
                    className="w-full flex items-center justify-between p-2 text-sm bg-muted hover:bg-muted/80 rounded-md transition-colors duration-150 ease-out-cubic"
                  >
                    <span className="text-foreground">{savedFilter?.name}</span>
                    <Icon name="ChevronRight" size={14} className="text-muted-foreground" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      {/* Save Filter Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 w-96 max-w-full mx-4">
            <h3 className="text-lg font-semibold text-foreground mb-4">Guardar filtro</h3>
            
            <Input
              label="Nombre del filtro"
              placeholder="Ej: Empleados activos - Obra Central"
              value={filterName}
              onChange={(e) => setFilterName(e?.target?.value)}
              className="mb-4"
            />
            
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowSaveDialog(false);
                  setFilterName('');
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSaveFilter}
                disabled={!filterName?.trim()}
              >
                Guardar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeFilters;