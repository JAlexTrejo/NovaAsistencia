// src/administrator-employee-management-console/EmployeeDetailPanel.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';

import { siteDataService } from '../../data/siteDataService';
import { supervisorDataService } from '../../data/supervisorDataService';
import { employeeDataService } from '../../data/employeeDataService';

const STATUS_OPTIONS = [
  { value: 'active', label: 'Activo' },
  { value: 'inactive', label: 'Inactivo' },
  { value: 'suspended', label: 'Suspendido' },
  { value: 'terminated', label: 'Terminado' },
];

const TABS = [
  { id: 'general', label: 'General', icon: 'User' },
  { id: 'contact', label: 'Contacto', icon: 'Phone' },
  { id: 'employment', label: 'Empleo', icon: 'Briefcase' },
  { id: 'documents', label: 'Documentos', icon: 'FileText' },
];

const getStatusColor = (status) => {
  const colors = {
    active: 'bg-success text-success-foreground',
    inactive: 'bg-secondary text-secondary-foreground',
    suspended: 'bg-warning text-warning-foreground',
    terminated: 'bg-error text-error-foreground',
  };
  return colors[status] || colors.inactive;
};

const EmployeeDetailPanel = ({
  employee,
  onClose,
  onSave,           // callback opcional tras guardar
  onViewAttendance,
  onViewPayroll,
  onViewIncidents,
  userRole = 'admin',
  isEditing = false,
  onToggleEdit,
}) => {
  const [editData, setEditData] = useState(employee || {});
  const [activeTab, setActiveTab] = useState('general');

  const [sites, setSites] = useState([]);
  const [sitesLoading, setSitesLoading] = useState(false);

  const [supervisors, setSupervisors] = useState([]);
  const [supervisorsLoading, setSupervisorsLoading] = useState(false);

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Cargar datos reales de BD
  useEffect(() => {
    if (!employee) return;

    const loadSites = async () => {
      setSitesLoading(true);
      try {
        const res = await siteDataService.getSites({ activa: true, limit: 500 });
        if (mountedRef.current && res?.success) setSites(res.data || []);
      } catch (e) {
        console.error('Error loading sites:', e);
      } finally {
        setSitesLoading(false);
      }
    };

    const loadSupervisors = async () => {
      setSupervisorsLoading(true);
      try {
        const res = await supervisorDataService.getSupervisors({
          roles: ['supervisor', 'admin', 'superadmin'],
          is_active: true,
          limit: 500,
        });
        if (mountedRef.current && res?.success) setSupervisors(res.data || []);
      } catch (e) {
        console.error('Error loading supervisors:', e);
      } finally {
        setSupervisorsLoading(false);
      }
    };

    loadSites();
    loadSupervisors();
  }, [employee?.id]);

  // Mantener editData sincronizado al cambiar el empleado
  useEffect(() => {
    setEditData(employee || {});
    setFormError('');
  }, [employee]);

  const siteOptions = useMemo(
    () => (sites || []).map(s => ({ value: s.id, label: s.nombre })),
    [sites]
  );
  const supervisorOptions = useMemo(
    () => (supervisors || []).map(u => ({ value: u.id, label: u.nombre || u.correo })),
    [supervisors]
  );

  const siteLabel = useMemo(() => {
    const byId = siteOptions.find(s => s.value === (employee?.obra_id || employee?.site || employee?.site_id));
    return byId?.label || employee?.sitio_asignado || '—';
  }, [employee, siteOptions]);

  const supervisorLabel = useMemo(() => {
    const id = employee?.supervisor_id || employee?.supervisor;
    const found = supervisorOptions.find(s => s.value === id);
    return found?.label || employee?.supervisor_name || '—';
  }, [employee, supervisorOptions]);

  if (!employee) {
    return (
      <div className="w-full h-full bg-card border border-border rounded-lg flex items-center justify-center">
        <div className="text-center">
          <Icon name="Users" size={48} className="mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Selecciona un empleado</h3>
          <p className="text-muted-foreground">Haz clic en un empleado de la tabla para ver sus detalles.</p>
        </div>
      </div>
    );
  }

  const handleInputChange = (field, value) => {
    setEditData(prev => ({ ...prev, [field]: value }));
    if (formError) setFormError('');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No especificada';
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return 'No especificada';
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setFormError('');

      // Mapear a columnas reales de `usuarios`
      const payload = {
        nombre: editData?.name ?? editData?.nombre ?? employee?.nombre ?? employee?.name,
        correo: editData?.email ?? employee?.correo ?? employee?.email,
        telefono: editData?.phone ?? employee?.telefono ?? employee?.phone ?? null,
        puesto: editData?.puesto ?? employee?.puesto ?? null,
        obra_id:
          editData?.obra_id ??
          editData?.site ??
          employee?.obra_id ??
          employee?.site ??
          null,
        supervisor_id:
          editData?.supervisor_id ??
          editData?.supervisor ??
          employee?.supervisor_id ??
          null,
        hourly_rate:
          editData?.hourly_rate ??
          editData?.dailySalary ??
          employee?.hourly_rate ??
          0,
        // is_active desde status
        is_active:
          (editData?.status ?? employee?.status ?? 'active') === 'active',
      };

      const res = await employeeDataService.updateEmployee(employee.id, payload);
      if (!res?.success) throw new Error(res?.error || 'No se pudo actualizar el empleado');

      // Refrescar datos locales con respuesta de BD
      const updated = res.data;

      if (typeof onSave === 'function') await onSave(updated);
      onToggleEdit?.(); // salir de edición
    } catch (e) {
      console.error('Save error:', e);
      setFormError(e?.message || 'Error al guardar cambios');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full h-full bg-card border border-border rounded-lg flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            {employee?.avatar ? (
              <Image src={employee.avatar} alt={employee?.nombre || employee?.name} className="w-12 h-12 rounded-full object-cover" />
            ) : (
              <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                {(employee?.nombre || employee?.name || '??')
                  .split(' ')
                  .map(n => n?.[0])
                  .filter(Boolean)
                  .join('')
                  .toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">{employee?.nombre || employee?.name}</h2>
            {employee?.employeeId ? (
              <p className="text-sm text-muted-foreground">ID: {employee.employeeId}</p>
            ) : null}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {isEditing ? (
            <>
              <Button variant="outline" size="sm" onClick={onToggleEdit} iconName="X" iconSize={16}>
                Cancelar
              </Button>
              <Button size="sm" onClick={handleSave} loading={saving} iconName="Save" iconSize={16}>
                Guardar
              </Button>
            </>
          ) : (
            <Button variant="outline" size="sm" onClick={onToggleEdit} iconName="Edit" iconSize={16}>
              Editar
            </Button>
          )}

          <Button variant="ghost" size="icon" onClick={onClose} iconName="X" iconSize={16} />
        </div>
      </div>

      {/* Status & quick actions */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
              (employee?.status || (employee?.is_active ? 'active' : 'inactive'))
            )}`}
          >
            {employee?.status
              ? (employee.status === 'active'
                  ? 'Activo'
                  : employee.status === 'inactive'
                    ? 'Inactivo'
                    : employee.status === 'suspended'
                      ? 'Suspendido'
                      : 'Terminado')
              : employee?.is_active
                ? 'Activo'
                : 'Inactivo'}
          </span>

          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => onViewAttendance?.(employee)} iconName="Clock" iconSize={16}>
              Asistencia
            </Button>

            {userRole === 'admin' && (
              <Button variant="outline" size="sm" onClick={() => onViewPayroll?.(employee)} iconName="Calculator" iconSize={16}>
                Nómina
              </Button>
            )}

            <Button variant="outline" size="sm" onClick={() => onViewIncidents?.(employee)} iconName="AlertTriangle" iconSize={16}>
              Incidentes
            </Button>
          </div>
        </div>
        {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="flex space-x-8 px-4">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'}`}
            >
              <Icon name={tab.icon} size={16} />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'general' && (
          <div className="space-y-4">
            {isEditing ? (
              <>
                <Input
                  label="Nombre completo"
                  value={editData?.name ?? editData?.nombre ?? ''}
                  onChange={(e) => handleInputChange('name', e?.target?.value)}
                />
                <Input
                  label="ID de empleado (opcional)"
                  value={editData?.employeeId || ''}
                  onChange={(e) => handleInputChange('employeeId', e?.target?.value)}
                />
                <Input
                  label="Fecha de nacimiento"
                  type="date"
                  value={editData?.birthDate || ''}
                  onChange={(e) => handleInputChange('birthDate', e?.target?.value)}
                />
                <Input
                  label="Número de identificación"
                  value={editData?.idNumber || ''}
                  onChange={(e) => handleInputChange('idNumber', e?.target?.value)}
                />
              </>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Nombre completo</label>
                  <p className="text-sm text-foreground mt-1">{employee?.nombre || employee?.name}</p>
                </div>
                {employee?.employeeId ? (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">ID de empleado</label>
                    <p className="text-sm text-foreground mt-1 font-mono">{employee.employeeId}</p>
                  </div>
                ) : null}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Fecha de nacimiento</label>
                  <p className="text-sm text-foreground mt-1">
                    {employee?.birthDate ? formatDate(employee.birthDate) : 'No especificada'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Número de identificación</label>
                  <p className="text-sm text-foreground mt-1">{employee?.idNumber || 'No especificado'}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'contact' && (
          <div className="space-y-4">
            {isEditing ? (
              <>
                <Input
                  label="Email"
                  type="email"
                  value={editData?.email ?? employee?.correo ?? ''}
                  onChange={(e) => handleInputChange('email', e?.target?.value)}
                />
                <Input
                  label="Teléfono"
                  type="tel"
                  value={editData?.phone ?? employee?.telefono ?? ''}
                  onChange={(e) => handleInputChange('phone', e?.target?.value)}
                />
                <Input
                  label="Dirección"
                  value={editData?.address || ''}
                  onChange={(e) => handleInputChange('address', e?.target?.value)}
                />
                <Input
                  label="Contacto de emergencia"
                  value={editData?.emergencyContact || ''}
                  onChange={(e) => handleInputChange('emergencyContact', e?.target?.value)}
                />
              </>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="text-sm text-foreground mt-1">{employee?.email || employee?.correo}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Teléfono</label>
                  <p className="text-sm text-foreground mt-1">{employee?.phone || employee?.telefono || 'No especificado'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Dirección</label>
                  <p className="text-sm text-foreground mt-1">{employee?.address || 'No especificada'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Contacto de emergencia</label>
                  <p className="text-sm text-foreground mt-1">{employee?.emergencyContact || 'No especificado'}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'employment' && (
          <div className="space-y-4">
            {isEditing ? (
              <>
                <Select
                  label="Sitio de construcción"
                  options={siteOptions}
                  value={
                    editData?.obra_id ??
                    editData?.site ??
                    employee?.obra_id ??
                    employee?.site ??
                    ''
                  }
                  onChange={(value) => handleInputChange('obra_id', value)}
                  placeholder={sitesLoading ? 'Cargando sitios...' : 'Seleccionar sitio...'}
                  disabled={sitesLoading}
                />
                <Select
                  label="Supervisor"
                  options={supervisorOptions}
                  value={
                    editData?.supervisor_id ??
                    editData?.supervisor ??
                    employee?.supervisor_id ??
                    ''
                  }
                  onChange={(value) => handleInputChange('supervisor_id', value)}
                  placeholder={supervisorsLoading ? 'Cargando supervisores...' : 'Seleccionar supervisor...'}
                  disabled={supervisorsLoading}
                />
                <Select
                  label="Estado"
                  options={STATUS_OPTIONS}
                  value={editData?.status ?? (employee?.is_active ? 'active' : 'inactive')}
                  onChange={(value) => handleInputChange('status', value)}
                />
                <Input
                  label="Fecha de contratación"
                  type="date"
                  value={editData?.hireDate || ''}
                  onChange={(e) => handleInputChange('hireDate', e?.target?.value)}
                />
                {userRole === 'admin' && (
                  <Input
                    label="Salario (hourly_rate)"
                    type="number"
                    value={editData?.hourly_rate ?? editData?.dailySalary ?? employee?.hourly_rate ?? ''}
                    onChange={(e) => handleInputChange('hourly_rate', e?.target?.value)}
                  />
                )}
                <Input
                  label="Puesto"
                  value={editData?.puesto ?? employee?.puesto ?? ''}
                  onChange={(e) => handleInputChange('puesto', e?.target?.value)}
                />
              </>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Sitio de construcción</label>
                  <p className="text-sm text-foreground mt-1">{siteLabel}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Supervisor</label>
                  <p className="text-sm text-foreground mt-1">{supervisorLabel}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Fecha de contratación</label>
                  <p className="text-sm text-foreground mt-1">
                    {employee?.hireDate ? formatDate(employee.hireDate) : 'No especificada'}
                  </p>
                </div>
                {userRole === 'admin' && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Salario (hourly_rate)</label>
                    <p className="text-sm text-foreground mt-1">
                      {typeof employee?.hourly_rate === 'number' ? employee.hourly_rate : employee?.dailySalary || 'No especificado'}
                    </p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Puesto</label>
                  <p className="text-sm text-foreground mt-1">{employee?.puesto || 'No especificado'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Última asistencia</label>
                  <p className="text-sm text-foreground mt-1">
                    {employee?.lastAttendance ? formatDate(employee.lastAttendance) : 'Sin registro'}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="space-y-4">
            <div className="text-center py-8">
              <Icon name="FileText" size={48} className="mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">Documentos del empleado</h3>
              <p className="text-muted-foreground mb-4">Gestiona los documentos y archivos del empleado.</p>
              <Button variant="outline" iconName="Upload" iconSize={16}>
                Subir documento
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeDetailPanel;
