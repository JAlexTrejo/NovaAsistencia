import React, { useState } from 'react';

import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import { Checkbox } from '../../../components/ui/Checkbox';

const UserManagementTab = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const users = [
    {
      id: 1,
      name: "Carlos Rodríguez",
      email: "carlos.rodriguez@construcciones.com",
      role: "SuperAdmin",
      status: "active",
      lastLogin: new Date(Date.now() - 2 * 60 * 60 * 1000),
      site: "Oficina Central",
      permissions: {
        userManagement: true,
        systemConfig: true,
        payrollAccess: true,
        reportGeneration: true,
        auditLogs: true
      }
    },
    {
      id: 2,
      name: "María González",
      email: "maria.gonzalez@construcciones.com",
      role: "Admin",
      status: "active",
      lastLogin: new Date(Date.now() - 30 * 60 * 1000),
      site: "Obra Norte",
      permissions: {
        userManagement: true,
        systemConfig: false,
        payrollAccess: true,
        reportGeneration: true,
        auditLogs: false
      }
    },
    {
      id: 3,
      name: "Juan Pérez",
      email: "juan.perez@construcciones.com",
      role: "Supervisor",
      status: "active",
      lastLogin: new Date(Date.now() - 4 * 60 * 60 * 1000),
      site: "Proyecto Sur",
      permissions: {
        userManagement: false,
        systemConfig: false,
        payrollAccess: false,
        reportGeneration: true,
        auditLogs: false
      }
    },
    {
      id: 4,
      name: "Ana Martínez",
      email: "ana.martinez@construcciones.com",
      role: "Employee",
      status: "inactive",
      lastLogin: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      site: "Obra Central",
      permissions: {
        userManagement: false,
        systemConfig: false,
        payrollAccess: false,
        reportGeneration: false,
        auditLogs: false
      }
    }
  ];

  const roleOptions = [
    { value: '', label: 'Todos los roles' },
    { value: 'SuperAdmin', label: 'SuperAdmin' },
    { value: 'Admin', label: 'Administrador' },
    { value: 'Supervisor', label: 'Supervisor' },
    { value: 'Employee', label: 'Empleado' }
  ];

  const filteredUsers = users?.filter(user => {
    const matchesSearch = user?.name?.toLowerCase()?.includes(searchTerm?.toLowerCase()) ||
                         user?.email?.toLowerCase()?.includes(searchTerm?.toLowerCase());
    const matchesRole = !selectedRole || user?.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const handleUserSelection = (userId, checked) => {
    if (checked) {
      setSelectedUsers([...selectedUsers, userId]);
    } else {
      setSelectedUsers(selectedUsers?.filter(id => id !== userId));
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedUsers(filteredUsers?.map(user => user?.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const formatLastLogin = (date) => {
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (hours < 24) return `hace ${hours}h`;
    return `hace ${days}d`;
  };

  const getRoleColor = (role) => {
    const colors = {
      SuperAdmin: 'bg-error text-error-foreground',
      Admin: 'bg-warning text-warning-foreground',
      Supervisor: 'bg-primary text-primary-foreground',
      Employee: 'bg-secondary text-secondary-foreground'
    };
    return colors?.[role] || colors?.Employee;
  };

  const getStatusColor = (status) => {
    return status === 'active' ?'bg-success/10 text-success border-success/20' :'bg-muted text-muted-foreground border-border';
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="flex-1">
            <Input
              type="search"
              placeholder="Buscar usuarios por nombre o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e?.target?.value)}
              className="w-full"
            />
          </div>
          <div className="w-full sm:w-48">
            <Select
              options={roleOptions}
              value={selectedRole}
              onChange={setSelectedRole}
              placeholder="Filtrar por rol"
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" iconName="Download">
            Exportar
          </Button>
          <Button iconName="Plus">
            Nuevo Usuario
          </Button>
        </div>
      </div>
      {/* Bulk Actions */}
      {selectedUsers?.length > 0 && (
        <div className="bg-muted p-4 rounded-lg border border-border">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">
              {selectedUsers?.length} usuario(s) seleccionado(s)
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" iconName="Shield">
                Cambiar Permisos
              </Button>
              <Button variant="outline" size="sm" iconName="UserX">
                Desactivar
              </Button>
              <Button variant="destructive" size="sm" iconName="Trash2">
                Eliminar
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Users Table */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-4 font-medium text-foreground">
                  <Checkbox
                    checked={selectedUsers?.length === filteredUsers?.length && filteredUsers?.length > 0}
                    onChange={(e) => handleSelectAll(e?.target?.checked)}
                  />
                </th>
                <th className="text-left p-4 font-medium text-foreground">Usuario</th>
                <th className="text-left p-4 font-medium text-foreground">Rol</th>
                <th className="text-left p-4 font-medium text-foreground">Estado</th>
                <th className="text-left p-4 font-medium text-foreground">Último Acceso</th>
                <th className="text-left p-4 font-medium text-foreground">Sitio</th>
                <th className="text-left p-4 font-medium text-foreground">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers?.map((user) => (
                <tr key={user?.id} className="border-t border-border hover:bg-muted/50">
                  <td className="p-4">
                    <Checkbox
                      checked={selectedUsers?.includes(user?.id)}
                      onChange={(e) => handleUserSelection(user?.id, e?.target?.checked)}
                    />
                  </td>
                  <td className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                        {user?.name?.split(' ')?.map(n => n?.[0])?.join('')?.toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{user?.name}</div>
                        <div className="text-sm text-muted-foreground">{user?.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(user?.role)}`}>
                      {user?.role}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(user?.status)}`}>
                      {user?.status === 'active' ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {formatLastLogin(user?.lastLogin)}
                  </td>
                  <td className="p-4 text-sm text-foreground">
                    {user?.site}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        iconName="Shield"
                        onClick={() => {
                          setSelectedUser(user);
                          setShowPermissionModal(true);
                        }}
                      >
                        Permisos
                      </Button>
                      <Button variant="ghost" size="sm" iconName="Edit">
                        Editar
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* Permission Modal */}
      {showPermissionModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg border border-border w-full max-w-md">
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">
                  Permisos de {selectedUser?.name}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  iconName="X"
                  onClick={() => setShowPermissionModal(false)}
                />
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="space-y-3">
                <Checkbox
                  label="Gestión de Usuarios"
                  description="Crear, editar y eliminar usuarios"
                  checked={selectedUser?.permissions?.userManagement}
                />
                <Checkbox
                  label="Configuración del Sistema"
                  description="Modificar configuraciones globales"
                  checked={selectedUser?.permissions?.systemConfig}
                />
                <Checkbox
                  label="Acceso a Nómina"
                  description="Ver y gestionar información de nómina"
                  checked={selectedUser?.permissions?.payrollAccess}
                />
                <Checkbox
                  label="Generación de Reportes"
                  description="Crear y exportar reportes"
                  checked={selectedUser?.permissions?.reportGeneration}
                />
                <Checkbox
                  label="Logs de Auditoría"
                  description="Acceder a registros de auditoría"
                  checked={selectedUser?.permissions?.auditLogs}
                />
              </div>
            </div>
            
            <div className="p-6 border-t border-border flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowPermissionModal(false)}
              >
                Cancelar
              </Button>
              <Button onClick={() => setShowPermissionModal(false)}>
                Guardar Cambios
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementTab;