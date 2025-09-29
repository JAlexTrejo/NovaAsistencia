// src/administrator-employee-management-console/BulkActionsToolbar.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';

import { siteDataService } from '../../data/siteDataService';
import { supervisorDataService } from '../../data/supervisorDataService';

const BulkActionsToolbar = ({
  selectedCount,
  onBulkAction,
  onClearSelection,
  userRole = 'admin',
}) => {
  const [showBulkMenu, setShowBulkMenu] = useState(false);
  const [bulkActionType, setBulkActionType] = useState('');
  const [bulkActionValue, setBulkActionValue] = useState('');

  const [sites, setSites] = useState([]);
  const [sitesLoading, setSitesLoading] = useState(false);

  const [supervisors, setSupervisors] = useState([]);
  const [supervisorsLoading, setSupervisorsLoading] = useState(false);

  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Cargar sitios reales
  useEffect(() => {
    const loadSites = async () => {
      setSitesLoading(true);
      try {
        const res = await siteDataService.getSites();
        if (mountedRef.current && res?.success) setSites(res.data || []);
      } catch (e) {
        console.error('Error loading sites:', e);
      } finally {
        setSitesLoading(false);
      }
    };
    loadSites();
  }, []);

  // Cargar supervisores reales
  useEffect(() => {
    const loadSupervisors = async () => {
      setSupervisorsLoading(true);
      try {
        const res = await supervisorDataService.getSupervisors();
        if (mountedRef.current && res?.success) setSupervisors(res.data || []);
      } catch (e) {
        console.error('Error loading supervisors:', e);
      } finally {
        setSupervisorsLoading(false);
      }
    };
    loadSupervisors();
  }, []);

  // Opciones dinámicas
  const siteOptions = useMemo(
    () => (sites || []).map(s => ({ value: s.id, label: s.nombre })),
    [sites]
  );

  const supervisorOptions = useMemo(
    () => (supervisors || []).map(u => ({
      value: u.id,
      label: u.nombre || u.correo
    })),
    [supervisors]
  );

  const statusOptions = useMemo(() => ([
    { value: 'active', label: 'Activo' },
    { value: 'inactive', label: 'Inactivo' },
    { value: 'suspended', label: 'Suspendido' },
    { value: 'terminated', label: 'Terminado' },
  ]), []);

  const bulkActions = useMemo(() => ([
    { value: 'change-site',        label: 'Cambiar sitio de construcción', icon: 'MapPin' },
    { value: 'change-supervisor',  label: 'Cambiar supervisor',            icon: 'UserCheck' },
    { value: 'change-status',      label: 'Cambiar estado',                icon: 'ToggleLeft' },
    { value: 'export-data',        label: 'Exportar datos seleccionados',  icon: 'Download' },
    { value: 'send-notification',  label: 'Enviar notificación',           icon: 'Bell' },
  ]), []);

  const getActionOptions = (actionType) => {
    switch (actionType) {
      case 'change-site':
        return siteOptions;
      case 'change-supervisor':
        return supervisorOptions;
      case 'change-status':
        return statusOptions;
      default:
        return [];
    }
  };

  const handleBulkAction = () => {
    // export-data y send-notification no requieren "valor" previo
    const noValueNeeded = ['export-data', 'send-notification'].includes(bulkActionType);
    if (!bulkActionType) return;
    if (!noValueNeeded && !bulkActionValue) return;

    onBulkAction?.({
      action: bulkActionType,
      value: bulkActionValue,
      selectedCount,
    });

    // Reset
    setBulkActionType('');
    setBulkActionValue('');
    setShowBulkMenu(false);
  };

  const canExecuteAction = () => {
    if (['export-data', 'send-notification'].includes(bulkActionType)) return true;
    return Boolean(bulkActionType && bulkActionValue);
  };

  if (selectedCount === 0) return null;

  return (
    <div className="bg-primary text-primary-foreground p-4 rounded-lg mb-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Icon name="CheckSquare" size={20} />
            <span className="font-medium">
              {selectedCount} empleado{selectedCount !== 1 ? 's' : ''} seleccionado{selectedCount !== 1 ? 's' : ''}
            </span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            className="text-primary-foreground hover:bg-primary-foreground/10"
            iconName="X"
            iconSize={16}
          >
            Limpiar selección
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowBulkMenu(!showBulkMenu)}
            className="text-primary-foreground hover:bg-primary-foreground/10"
            iconName="Settings"
            iconSize={16}
          >
            Acciones masivas
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onBulkAction?.({ action: 'export-selected', selectedCount })}
            className="text-primary-foreground hover:bg-primary-foreground/10"
            iconName="Download"
            iconSize={16}
          >
            Exportar
          </Button>
        </div>
      </div>

      {/* Menú de acciones masivas */}
      {showBulkMenu && (
        <div className="mt-4 p-4 bg-primary-foreground/10 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Select
                label="Acción"
                options={bulkActions.map(a => ({ value: a.value, label: a.label }))}
                value={bulkActionType}
                onChange={(v) => {
                  setBulkActionType(v);
                  setBulkActionValue(''); // limpiar valor previo al cambiar acción
                }}
                placeholder="Seleccionar acción..."
                className="text-foreground"
              />
            </div>

            {bulkActionType && !['export-data', 'send-notification'].includes(bulkActionType) && (
              <div>
                <Select
                  label="Nuevo valor"
                  options={getActionOptions(bulkActionType)}
                  value={bulkActionValue}
                  onChange={setBulkActionValue}
                  placeholder={
                    bulkActionType === 'change-site'
                      ? (sitesLoading ? 'Cargando sitios...' : 'Seleccionar sitio...')
                      : bulkActionType === 'change-supervisor'
                      ? (supervisorsLoading ? 'Cargando supervisores...' : 'Seleccionar supervisor...')
                      : 'Seleccionar valor...'
                  }
                  disabled={
                    (bulkActionType === 'change-site' && sitesLoading) ||
                    (bulkActionType === 'change-supervisor' && supervisorsLoading)
                  }
                  className="text-foreground"
                />
              </div>
            )}

            <div className="flex items-end">
              <Button
                onClick={handleBulkAction}
                disabled={!canExecuteAction()}
                className="w-full bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                iconName="Play"
                iconSize={16}
              >
                Ejecutar
              </Button>
            </div>
          </div>

          {bulkActionType === 'send-notification' && (
            <div className="mt-4">
              <textarea
                placeholder="Mensaje de notificación..."
                className="w-full p-3 border border-primary-foreground/20 rounded-md bg-primary-foreground/10 text-primary-foreground placeholder-primary-foreground/60 resize-none"
                rows={3}
                value={bulkActionValue}
                onChange={(e) => setBulkActionValue(e?.target?.value)}
              />
            </div>
          )}

          {bulkActionType && (
            <div className="mt-3 p-3 bg-primary-foreground/5 rounded-md">
              <div className="flex items-start space-x-2">
                <Icon name="Info" size={16} className="text-primary-foreground/80 mt-0.5" />
                <div className="text-sm text-primary-foreground/80">
                  {bulkActionType === 'change-site' &&
                    `Se cambiará el sitio de construcción de ${selectedCount} empleado${selectedCount !== 1 ? 's' : ''}.`}
                  {bulkActionType === 'change-supervisor' &&
                    `Se cambiará el supervisor de ${selectedCount} empleado${selectedCount !== 1 ? 's' : ''}.`}
                  {bulkActionType === 'change-status' &&
                    `Se cambiará el estado de ${selectedCount} empleado${selectedCount !== 1 ? 's' : ''}.`}
                  {bulkActionType === 'export-data' &&
                    `Se exportarán los datos de ${selectedCount} empleado${selectedCount !== 1 ? 's' : ''} seleccionado${selectedCount !== 1 ? 's' : ''}.`}
                  {bulkActionType === 'send-notification' &&
                    `Se enviará una notificación a ${selectedCount} empleado${selectedCount !== 1 ? 's' : ''}.`}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BulkActionsToolbar;
