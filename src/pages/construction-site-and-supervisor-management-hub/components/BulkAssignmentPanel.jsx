import React, { useEffect, useMemo, useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import { Checkbox } from '../../../components/ui/Checkbox';

const BulkAssignmentPanel = ({
  sites = [],
  supervisors = [],
  employees = [],
  onBulkAssign,
  onClose,
  userRole = 'admin',
}) => {
  const [assignmentType, setAssignmentType] = useState('employee-to-site');
  const [selectedItems, setSelectedItems] = useState([]);
  const [targetSelection, setTargetSelection] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // búsqueda local para la lista de origen (empleados o sitios)
  const [sourceSearch, setSourceSearch] = useState('');

  const assignmentTypes = [
    { value: 'employee-to-site', label: 'Asignar empleados a sitio' },
    { value: 'employee-to-supervisor', label: 'Asignar empleados a supervisor' },
    { value: 'site-to-supervisor', label: 'Asignar sitios a supervisor' },
  ];

  // Normalización de opciones (memoizado)
  const sourceOptions = useMemo(() => {
    switch (assignmentType) {
      case 'employee-to-site':
      case 'employee-to-supervisor':
        return (employees || []).map((emp) => ({
          value: emp?.id,
          label: `${emp?.name || emp?.full_name || 'Empleado'} - ${emp?.currentSite || 'Sin sitio'}`,
          description: emp?.position || emp?.role || '',
          raw: emp,
        }));
      case 'site-to-supervisor':
        return (sites || []).map((site) => ({
          value: site?.id,
          label: `${site?.name} - ${site?.location || 'Sin ubicación'}`,
          description: `${site?.employeeCount ?? 0} empleados`,
          raw: site,
        }));
      default:
        return [];
    }
  }, [assignmentType, employees, sites]);

  const targetOptions = useMemo(() => {
    switch (assignmentType) {
      case 'employee-to-site':
        return (sites || []).map((site) => ({
          value: site?.id,
          label: site?.name,
          description: site?.location || '',
          raw: site,
        }));
      case 'employee-to-supervisor':
      case 'site-to-supervisor':
        return (supervisors || []).map((sup) => ({
          value: sup?.id,
          label: sup?.name || sup?.full_name || 'Supervisor',
          description: `${sup?.assignedSites ?? 0} sitios asignados`,
          raw: sup,
        }));
      default:
        return [];
    }
  }, [assignmentType, sites, supervisors]);

  // Filtrado de la lista de origen por texto
  const filteredSourceOptions = useMemo(() => {
    const term = sourceSearch.trim().toLowerCase();
    if (!term) return sourceOptions;
    return sourceOptions.filter(
      (opt) =>
        opt.label.toLowerCase().includes(term) ||
        (opt.description || '').toLowerCase().includes(term)
    );
  }, [sourceOptions, sourceSearch]);

  // Reset de selección al cambiar de tipo de asignación
  useEffect(() => {
    setSelectedItems([]);
    setTargetSelection('');
    setSourceSearch('');
  }, [assignmentType]);

  const allFilteredIds = useMemo(
    () => filteredSourceOptions.map((o) => o.value),
    [filteredSourceOptions]
  );

  const isAllFilteredSelected =
    allFilteredIds.length > 0 &&
    allFilteredIds.every((id) => selectedItems.includes(id));

  const handleItemToggle = (itemId) => {
    setSelectedItems((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  };

  const handleSelectAllFiltered = () => {
    setSelectedItems((prev) =>
      isAllFilteredSelected
        ? prev.filter((id) => !allFilteredIds.includes(id))
        : Array.from(new Set([...prev, ...allFilteredIds]))
    );
  };

  const canAssign = selectedItems.length > 0 && !!targetSelection && !isProcessing;

  const handleBulkAssign = async () => {
    if (!canAssign) return;
    setIsProcessing(true);
    try {
      await onBulkAssign?.({
        type: assignmentType,
        sourceIds: selectedItems,
        targetId: targetSelection,
      });
      setSelectedItems([]);
      setTargetSelection('');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error en asignación masiva:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const summaryText = useMemo(() => {
    const sourceCount = selectedItems.length;
    const targetName = targetOptions.find((opt) => opt.value === targetSelection)?.label;
    if (!sourceCount || !targetName) return '';
    switch (assignmentType) {
      case 'employee-to-site':
        return `Asignar ${sourceCount} empleado${sourceCount > 1 ? 's' : ''} al sitio "${targetName}"`;
      case 'employee-to-supervisor':
        return `Asignar ${sourceCount} empleado${sourceCount > 1 ? 's' : ''} al supervisor "${targetName}"`;
      case 'site-to-supervisor':
        return `Asignar ${sourceCount} sitio${sourceCount > 1 ? 's' : ''} al supervisor "${targetName}"`;
      default:
        return '';
    }
  }, [assignmentType, selectedItems, targetOptions, targetSelection]);

  if (userRole !== 'admin') {
    return (
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="text-center">
          <Icon name="Lock" size={48} className="mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Acceso Restringido</h3>
          <p className="text-muted-foreground">No tienes permisos para realizar asignaciones masivas.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">Asignación Masiva</h3>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Cerrar">
          <Icon name="X" size={20} />
        </Button>
      </div>

      <div className="space-y-6">
        {/* Assignment Type Selection */}
        <div>
          <Select
            label="Tipo de asignación"
            options={assignmentTypes}
            value={assignmentType}
            onChange={setAssignmentType}
            className="mb-4"
          />
        </div>

        {/* Source Selection */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-foreground">
              Seleccionar elementos ({selectedItems.length} seleccionados)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="search"
                placeholder="Buscar…"
                value={sourceSearch}
                onChange={(e) => setSourceSearch(e.target.value)}
                className="px-2 py-1 text-sm border border-border rounded"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAllFiltered}
                disabled={filteredSourceOptions.length === 0}
                iconName={
                  isAllFilteredSelected ? 'Square' : 'CheckSquare'
                }
                iconPosition="left"
                title={
                  filteredSourceOptions.length === 0
                    ? 'No hay elementos para seleccionar'
                    : isAllFilteredSelected
                    ? 'Deseleccionar visibles'
                    : 'Seleccionar visibles'
                }
              >
                {isAllFilteredSelected ? 'Deseleccionar visibles' : 'Seleccionar visibles'}
              </Button>
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto border border-border rounded-md p-2 space-y-2">
            {filteredSourceOptions.length === 0 ? (
              <div className="text-sm text-muted-foreground px-2 py-4 text-center">
                {sourceOptions.length === 0
                  ? 'No hay elementos disponibles.'
                  : 'Sin resultados para el filtro.'}
              </div>
            ) : (
              filteredSourceOptions.map((option) => (
                <div
                  key={option.value}
                  className="flex items-center space-x-3 p-2 hover:bg-muted rounded-md"
                >
                  <Checkbox
                    checked={selectedItems.includes(option.value)}
                    onChange={() => handleItemToggle(option.value)}
                    aria-label={`Seleccionar ${option.label}`}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{option.label}</p>
                    {option.description && (
                      <p className="text-xs text-muted-foreground">{option.description}</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            Mostrando {filteredSourceOptions.length} de {sourceOptions.length}
          </div>
        </div>

        {/* Target Selection */}
        <div>
          <Select
            label="Asignar a"
            options={targetOptions}
            value={targetSelection}
            onChange={(val) => setTargetSelection(val)}
            placeholder="Selecciona el destino"
            searchable
          />
        </div>

        {/* Assignment Summary */}
        {summaryText && (
          <div className="bg-primary/10 border border-primary/20 rounded-md p-4">
            <div className="flex items-center space-x-2">
              <Icon name="Info" size={16} className="text-primary" />
              <p className="text-sm font-medium text-primary">{summaryText}</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-top border-border">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="default"
            onClick={handleBulkAssign}
            disabled={!canAssign}
            loading={isProcessing}
            iconName="Users"
            iconPosition="left"
          >
            Asignar ({selectedItems.length})
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BulkAssignmentPanel;
