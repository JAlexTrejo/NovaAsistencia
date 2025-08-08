import React, { useState } from 'react';
import { Users, Edit3, Save, X, AlertTriangle, CheckCircle2, Shield, UserPlus } from 'lucide-react';

export default function RoleManagementTools({
  users,
  roleHierarchy,
  onUpdateUserRole,
  currentUser
}) {
  const [editingUserId, setEditingUserId] = useState(null);
  const [selectedRole, setSelectedRole] = useState('');
  const [bulkSelectedUsers, setBulkSelectedUsers] = useState([]);
  const [bulkRole, setBulkRole] = useState('');
  const [showBulkEdit, setShowBulkEdit] = useState(false);

  // Only allow role changes if current user is superadmin
  const canModifyRoles = currentUser?.role === 'superadmin';

  const handleStartEdit = (userId, currentRole) => {
    if (!canModifyRoles) return;
    setEditingUserId(userId);
    setSelectedRole(currentRole);
  };

  const handleSaveRole = async () => {
    if (editingUserId && selectedRole) {
      await onUpdateUserRole(editingUserId, selectedRole);
      setEditingUserId(null);
      setSelectedRole('');
    }
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
    setSelectedRole('');
  };

  const handleBulkUserSelection = (userId) => {
    setBulkSelectedUsers(prev => 
      prev?.includes(userId)
        ? prev?.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleBulkRoleUpdate = async () => {
    if (bulkSelectedUsers?.length === 0 || !bulkRole) return;

    for (const userId of bulkSelectedUsers) {
      await onUpdateUserRole(userId, bulkRole);
    }

    setBulkSelectedUsers([]);
    setBulkRole('');
    setShowBulkEdit(false);
  };

  const getRoleStats = () => {
    const stats = {};
    Object.keys(roleHierarchy)?.forEach(role => {
      stats[role] = users?.filter(user => user?.role === role)?.length || 0;
    });
    return stats;
  };

  const roleStats = getRoleStats();
  const roles = Object.keys(roleHierarchy)?.sort((a, b) => 
    roleHierarchy?.[b]?.level - roleHierarchy?.[a]?.level
  );

  return (
    <div className="space-y-6">
      {/* Role Statistics */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            <Users className="h-6 w-6 inline mr-2 text-blue-600" />
            Gestión de Roles de Usuario
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {roles?.map(role => (
              <div key={role} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleHierarchy?.[role]?.color}`}>
                    {roleHierarchy?.[role]?.label}
                  </span>
                  <Shield className="h-4 w-4 text-gray-400" />
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {roleStats?.[role]}
                  </div>
                  <div className="text-sm text-gray-600">usuarios</div>
                </div>
              </div>
            ))}
          </div>

          {!canModifyRoles && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <div className="flex items-center">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mr-2" />
                <span className="text-sm text-yellow-800">
                  Solo los Super Administradores pueden modificar roles de usuario.
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Bulk Role Management */}
      {canModifyRoles && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                <UserPlus className="h-5 w-5 inline mr-2" />
                Gestión Masiva de Roles
              </h3>
              
              <button
                onClick={() => setShowBulkEdit(!showBulkEdit)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                {showBulkEdit ? 'Cancelar' : 'Editar Masivo'}
              </button>
            </div>

            {showBulkEdit && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center space-x-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-purple-700 mb-1">
                      Nuevo Rol
                    </label>
                    <select
                      value={bulkRole}
                      onChange={(e) => setBulkRole(e?.target?.value)}
                      className="px-3 py-2 border border-purple-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                    >
                      <option value="">Seleccionar rol...</option>
                      {roles?.map(role => (
                        <option key={role} value={role}>
                          {roleHierarchy?.[role]?.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex items-end">
                    <button
                      onClick={handleBulkRoleUpdate}
                      disabled={bulkSelectedUsers?.length === 0 || !bulkRole}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                    >
                      Aplicar a {bulkSelectedUsers?.length} usuarios
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {/* User Role Management Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Lista de Usuarios</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-gray-50">
                  {showBulkEdit && (
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={bulkSelectedUsers?.length === users?.length}
                        onChange={(e) => {
                          if (e?.target?.checked) {
                            setBulkSelectedUsers(users?.map(u => u?.id) || []);
                          } else {
                            setBulkSelectedUsers([]);
                          }
                        }}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                    </th>
                  )}
                  
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    Usuario
                  </th>
                  
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    Rol Actual
                  </th>
                  
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    Estado
                  </th>
                  
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    Última Actividad
                  </th>
                  
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    Acciones
                  </th>
                </tr>
              </thead>
              
              <tbody className="divide-y divide-gray-200">
                {users?.map((user) => (
                  <tr key={user?.id} className="hover:bg-gray-50">
                    {showBulkEdit && (
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={bulkSelectedUsers?.includes(user?.id)}
                          onChange={() => handleBulkUserSelection(user?.id)}
                          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                      </td>
                    )}
                    
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                          <Users className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{user?.full_name || 'Sin nombre'}</p>
                          <p className="text-sm text-gray-500">{user?.email || 'Sin email'}</p>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-4 py-3">
                      {editingUserId === user?.id ? (
                        <select
                          value={selectedRole}
                          onChange={(e) => setSelectedRole(e?.target?.value)}
                          className="px-3 py-1 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        >
                          {roles?.map(role => (
                            <option key={role} value={role}>
                              {roleHierarchy?.[role]?.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          roleHierarchy?.[user?.role]?.color || 'bg-gray-100 text-gray-800'
                        }`}>
                          {roleHierarchy?.[user?.role]?.label || user?.role}
                        </span>
                      )}
                    </td>
                    
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user?.status === 'active' ?'bg-green-100 text-green-800' :'bg-red-100 text-red-800'
                      }`}>
                        {user?.status === 'active' ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {user?.last_attendance_date 
                        ? new Date(user.last_attendance_date)?.toLocaleDateString()
                        : 'Nunca'
                      }
                    </td>
                    
                    <td className="px-4 py-3">
                      {canModifyRoles && (
                        <div className="flex items-center space-x-2">
                          {editingUserId === user?.id ? (
                            <>
                              <button
                                onClick={handleSaveRole}
                                className="p-2 text-green-600 hover:bg-green-100 rounded-full"
                                title="Guardar"
                              >
                                <Save className="h-4 w-4" />
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="p-2 text-gray-600 hover:bg-gray-100 rounded-full"
                                title="Cancelar"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleStartEdit(user?.id, user?.role)}
                              className="p-2 text-blue-600 hover:bg-blue-100 rounded-full"
                              title="Editar rol"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {users?.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No hay usuarios disponibles</p>
            </div>
          )}
        </div>
      </div>
      {/* Role Change History */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            <CheckCircle2 className="h-5 w-5 inline mr-2" />
            Historial de Cambios Recientes
          </h3>
          
          <div className="text-center py-8 text-gray-500">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay cambios recientes de roles</p>
            <p className="text-sm">Los cambios aparecerán aquí después de modificar roles</p>
          </div>
        </div>
      </div>
    </div>
  );
}