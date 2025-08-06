import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import { Checkbox } from '../../../components/ui/Checkbox';

const BulkAssignmentPanel = ({ 
  sites, 
  supervisors, 
  employees, 
  onBulkAssign, 
  onClose,
  userRole = 'admin'
}) => {
  const [assignmentType, setAssignmentType] = useState('employee-to-site');
  const [selectedItems, setSelectedItems] = useState([]);
  const [targetSelection, setTargetSelection] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const assignmentTypes = [
    { value: 'employee-to-site', label: 'Asignar empleados a sitio' },
    { value: 'employee-to-supervisor', label: 'Asignar empleados a supervisor' },
    { value: 'site-to-supervisor', label: 'Asignar sitios a supervisor' }
  ];

  const getSourceOptions = () => {
    switch (assignmentType) {
      case 'employee-to-site': case'employee-to-supervisor':
        return employees?.map(emp => ({
          value: emp?.id,
          label: `${emp?.name} - ${emp?.currentSite || 'Sin sitio'}`,
          description: emp?.position
        }));
      case 'site-to-supervisor':
        return sites?.map(site => ({
          value: site?.id,
          label: `${site?.name} - ${site?.location}`,
          description: `${site?.employeeCount} empleados`
        }));
      default:
        return [];
    }
  };

  const getTargetOptions = () => {
    switch (assignmentType) {
      case 'employee-to-site':
        return sites?.map(site => ({
          value: site?.id,
          label: site?.name,
          description: site?.location
        }));
      case 'employee-to-supervisor': case'site-to-supervisor':
        return supervisors?.map(sup => ({
          value: sup?.id,
          label: sup?.name,
          description: `${sup?.assignedSites} sitios asignados`
        }));
      default:
        return [];
    }
  };

  const handleItemToggle = (itemId) => {
    setSelectedItems(prev => 
      prev?.includes(itemId) 
        ? prev?.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSelectAll = () => {
    const allIds = getSourceOptions()?.map(option => option?.value);
    setSelectedItems(selectedItems?.length === allIds?.length ? [] : allIds);
  };

  const handleBulkAssign = async () => {
    if (selectedItems?.length === 0 || !targetSelection) return;

    setIsProcessing(true);
    try {
      await onBulkAssign({
        type: assignmentType,
        sourceIds: selectedItems,
        targetId: targetSelection
      });
      setSelectedItems([]);
      setTargetSelection('');
    } catch (error) {
      console.error('Error en asignación masiva:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const getAssignmentSummary = () => {
    const sourceCount = selectedItems?.length;
    const targetName = getTargetOptions()?.find(opt => opt?.value === targetSelection)?.label;
    
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
  };

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
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">Asignación Masiva</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
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
              Seleccionar elementos ({selectedItems?.length} seleccionados)
            </label>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              iconName={selectedItems?.length === getSourceOptions()?.length ? 'Square' : 'CheckSquare'}
              iconPosition="left"
            >
              {selectedItems?.length === getSourceOptions()?.length ? 'Deseleccionar todo' : 'Seleccionar todo'}
            </Button>
          </div>

          <div className="max-h-64 overflow-y-auto border border-border rounded-md p-2 space-y-2">
            {getSourceOptions()?.map(option => (
              <div key={option?.value} className="flex items-center space-x-3 p-2 hover:bg-muted rounded-md">
                <Checkbox
                  checked={selectedItems?.includes(option?.value)}
                  onChange={() => handleItemToggle(option?.value)}
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{option?.label}</p>
                  {option?.description && (
                    <p className="text-xs text-muted-foreground">{option?.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Target Selection */}
        <div>
          <Select
            label="Asignar a"
            options={getTargetOptions()}
            value={targetSelection}
            onChange={setTargetSelection}
            placeholder="Selecciona el destino"
            searchable
          />
        </div>

        {/* Assignment Summary */}
        {getAssignmentSummary() && (
          <div className="bg-primary/10 border border-primary/20 rounded-md p-4">
            <div className="flex items-center space-x-2">
              <Icon name="Info" size={16} className="text-primary" />
              <p className="text-sm font-medium text-primary">{getAssignmentSummary()}</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-border">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="default"
            onClick={handleBulkAssign}
            disabled={selectedItems?.length === 0 || !targetSelection || isProcessing}
            loading={isProcessing}
            iconName="Users"
            iconPosition="left"
          >
            Asignar ({selectedItems?.length})
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BulkAssignmentPanel;