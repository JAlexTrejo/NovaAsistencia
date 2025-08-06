import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';

const EmployeeDetailPanel = ({ 
  employee, 
  onClose, 
  onSave, 
  onViewAttendance, 
  onViewPayroll, 
  onViewIncidents,
  userRole = 'admin',
  isEditing = false,
  onToggleEdit 
}) => {
  const [editData, setEditData] = useState(employee || {});
  const [activeTab, setActiveTab] = useState('general');

  if (!employee) {
    return (
      <div className="w-full h-full bg-card border border-border rounded-lg flex items-center justify-center">
        <div className="text-center">
          <Icon name="Users" size={48} className="mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Selecciona un empleado</h3>
          <p className="text-muted-foreground">
            Haz clic en un empleado de la tabla para ver sus detalles.
          </p>
        </div>
      </div>
    );
  }

  const constructionSites = [
    { value: 'obra-central', label: 'Obra Central' },
    { value: 'proyecto-norte', label: 'Proyecto Norte' },
    { value: 'edificio-sur', label: 'Edificio Sur' },
    { value: 'complejo-oeste', label: 'Complejo Oeste' }
  ];

  const supervisors = [
    { value: 'carlos-martinez', label: 'Carlos Martínez' },
    { value: 'ana-rodriguez', label: 'Ana Rodríguez' },
    { value: 'miguel-santos', label: 'Miguel Santos' },
    { value: 'lucia-fernandez', label: 'Lucía Fernández' }
  ];

  const statusOptions = [
    { value: 'active', label: 'Activo' },
    { value: 'inactive', label: 'Inactivo' },
    { value: 'suspended', label: 'Suspendido' },
    { value: 'terminated', label: 'Terminado' }
  ];

  const tabs = [
    { id: 'general', label: 'General', icon: 'User' },
    { id: 'contact', label: 'Contacto', icon: 'Phone' },
    { id: 'employment', label: 'Empleo', icon: 'Briefcase' },
    { id: 'documents', label: 'Documentos', icon: 'FileText' }
  ];

  const getStatusColor = (status) => {
    const colors = {
      'active': 'bg-success text-success-foreground',
      'inactive': 'bg-secondary text-secondary-foreground',
      'suspended': 'bg-warning text-warning-foreground',
      'terminated': 'bg-error text-error-foreground'
    };
    return colors?.[status] || colors?.inactive;
  };

  const handleSave = () => {
    onSave(editData);
    onToggleEdit();
  };

  const handleInputChange = (field, value) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  const formatDate = (dateString) => {
    return new Date(dateString)?.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="w-full h-full bg-card border border-border rounded-lg flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            {employee?.avatar ? (
              <Image
                src={employee?.avatar}
                alt={employee?.name}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                {employee?.name?.split(' ')?.map(n => n?.[0])?.join('')?.toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">{employee?.name}</h2>
            <p className="text-sm text-muted-foreground">ID: {employee?.employeeId}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={onToggleEdit}
                iconName="X"
                iconSize={16}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                iconName="Save"
                iconSize={16}
              >
                Guardar
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleEdit}
              iconName="Edit"
              iconSize={16}
            >
              Editar
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            iconName="X"
            iconSize={16}
          />
        </div>
      </div>
      {/* Status and Quick Actions */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(employee?.status)}`}>
            {employee?.status === 'active' ? 'Activo' : 
             employee?.status === 'inactive' ? 'Inactivo' :
             employee?.status === 'suspended' ? 'Suspendido' : 'Terminado'}
          </span>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewAttendance(employee)}
              iconName="Clock"
              iconSize={16}
            >
              Asistencia
            </Button>
            
            {userRole === 'admin' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewPayroll(employee)}
                iconName="Calculator"
                iconSize={16}
              >
                Nómina
              </Button>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewIncidents(employee)}
              iconName="AlertTriangle"
              iconSize={16}
            >
              Incidentes
            </Button>
          </div>
        </div>
      </div>
      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="flex space-x-8 px-4">
          {tabs?.map((tab) => (
            <button
              key={tab?.id}
              onClick={() => setActiveTab(tab?.id)}
              className={`
                flex items-center space-x-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors duration-150 ease-out-cubic
                ${activeTab === tab?.id
                  ? 'border-primary text-primary' :'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
                }
              `}
            >
              <Icon name={tab?.icon} size={16} />
              <span>{tab?.label}</span>
            </button>
          ))}
        </nav>
      </div>
      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'general' && (
          <div className="space-y-4">
            {isEditing ? (
              <>
                <Input
                  label="Nombre completo"
                  value={editData?.name || ''}
                  onChange={(e) => handleInputChange('name', e?.target?.value)}
                />
                
                <Input
                  label="ID de empleado"
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
                  <p className="text-sm text-foreground mt-1">{employee?.name}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">ID de empleado</label>
                  <p className="text-sm text-foreground mt-1 font-mono">{employee?.employeeId}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Fecha de nacimiento</label>
                  <p className="text-sm text-foreground mt-1">
                    {employee?.birthDate ? formatDate(employee?.birthDate) : 'No especificada'}
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
                  value={editData?.email || ''}
                  onChange={(e) => handleInputChange('email', e?.target?.value)}
                />
                
                <Input
                  label="Teléfono"
                  type="tel"
                  value={editData?.phone || ''}
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
                  <p className="text-sm text-foreground mt-1">{employee?.email}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Teléfono</label>
                  <p className="text-sm text-foreground mt-1">{employee?.phone || 'No especificado'}</p>
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
                  options={constructionSites}
                  value={editData?.site || ''}
                  onChange={(value) => handleInputChange('site', value)}
                />
                
                <Select
                  label="Supervisor"
                  options={supervisors}
                  value={editData?.supervisor || ''}
                  onChange={(value) => handleInputChange('supervisor', value)}
                />
                
                <Select
                  label="Estado"
                  options={statusOptions}
                  value={editData?.status || ''}
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
                    label="Salario diario"
                    type="number"
                    value={editData?.dailySalary || ''}
                    onChange={(e) => handleInputChange('dailySalary', e?.target?.value)}
                  />
                )}
              </>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Sitio de construcción</label>
                  <p className="text-sm text-foreground mt-1">{employee?.site}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Supervisor</label>
                  <p className="text-sm text-foreground mt-1">{employee?.supervisor}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Fecha de contratación</label>
                  <p className="text-sm text-foreground mt-1">{formatDate(employee?.hireDate)}</p>
                </div>
                
                {userRole === 'admin' && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Salario diario</label>
                    <p className="text-sm text-foreground mt-1">€{employee?.dailySalary || 'No especificado'}</p>
                  </div>
                )}
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Última asistencia</label>
                  <p className="text-sm text-foreground mt-1">
                    {employee?.lastAttendance ? formatDate(employee?.lastAttendance) : 'Sin registro'}
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
              <p className="text-muted-foreground mb-4">
                Gestiona los documentos y archivos del empleado.
              </p>
              <Button
                variant="outline"
                iconName="Upload"
                iconSize={16}
              >
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