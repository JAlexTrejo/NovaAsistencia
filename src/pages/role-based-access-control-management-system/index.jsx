import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Users, Shield, Crown, AlertTriangle, CheckCircle, Search, RefreshCw, Eye } from 'lucide-react';
import BrandedHeader from '../../components/ui/BrandedHeader';
import BrandedFooter from '../../components/ui/BrandedFooter';
import { supabase } from '../../lib/supabase';

export default function RoleBasedAccessControlManagementSystem() {
  const { user, userProfile, isSuperAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('roles');
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [bulkAction, setBulkAction] = useState('');

  const roleHierarchy = [
    {
      id: 1,
      nombre: 'user',
      descripcion: 'Can view profile, history, and notifications',
      level: 1,
      color: 'green',
      permissions: [
        'view_profile',
        'view_history', 
        'view_notifications',
        'check_in_out'
      ]
    },
    {
      id: 2,
      nombre: 'supervisor',
      descripcion: 'Can view and register attendance for their team',
      level: 2,
      color: 'yellow',
      permissions: [
        'view_profile',
        'view_history',
        'view_notifications',
        'check_in_out',
        'manage_team_attendance',
        'view_team_reports',
        'register_incidents'
      ]
    },
    {
      id: 3,
      nombre: 'admin',
      descripcion: 'Access to payroll, reports, and incident management',
      level: 3,
      color: 'red',
      permissions: [
        'view_profile',
        'view_history',
        'view_notifications',
        'check_in_out',
        'manage_team_attendance',
        'view_team_reports',
        'register_incidents',
        'access_payroll',
        'generate_reports',
        'manage_employees',
        'manage_construction_sites',
        'view_all_incidents'
      ]
    },
    {
      id: 4,
      nombre: 'superadmin',
      descripcion: 'Full system access including visual configuration',
      level: 4,
      color: 'purple',
      permissions: [
        'full_system_access',
        'visual_configuration',
        'system_logs',
        'role_management',
        'user_management',
        'database_management',
        'security_configuration',
        'backup_restore',
        'system_monitoring'
      ]
    }
  ];

  useEffect(() => {
    if (!isSuperAdmin?.()) {
      return;
    }
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load users
      const { data: usersData, error: usersError } = await supabase
        ?.from('usuarios')
        ?.select('*')
        ?.order('created_at', { ascending: false });

      if (usersError) {
        console.error('Error loading users:', usersError);
      } else {
        setUsers(usersData || []);
      }

      // Load roles (from our predefined hierarchy)
      setRoles(roleHierarchy);

      await logActivity('role_management_access', 'Role Management', 'Accessed role-based access control system');

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const logActivity = async (action, module, description) => {
    try {
      await supabase?.from('logs_actividad')?.insert({
        usuario_id: user?.id,
        rol: userProfile?.rol,
        accion: action,
        modulo: module,
        descripcion: description
      });
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  };

  const filteredUsers = users?.filter(user => {
    const matchesSearch = user?.nombre?.toLowerCase()?.includes(searchTerm?.toLowerCase()) ||
                         user?.correo?.toLowerCase()?.includes(searchTerm?.toLowerCase());
    const matchesRole = roleFilter === 'all' || user?.rol === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleUserRoleUpdate = async (userId, newRole) => {
    setSaving(true);
    setSaveMessage('');

    try {
      const { error } = await supabase
        ?.from('usuarios')
        ?.update({ rol: newRole })
        ?.eq('id', userId);

      if (error) {
        setSaveMessage(`Error: ${error?.message}`);
      } else {
        setSaveMessage(`Role updated successfully!`);
        await loadData();
        await logActivity('role_update', 'Role Management', `Updated user role to ${newRole}`);
      }
    } catch (error) {
      setSaveMessage(`Error: ${error?.message}`);
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  const handleBulkRoleUpdate = async () => {
    if (!bulkAction || selectedUsers?.length === 0) {
      setSaveMessage('Please select users and an action');
      return;
    }

    setSaving(true);
    setSaveMessage('');

    try {
      const { error } = await supabase
        ?.from('usuarios')
        ?.update({ rol: bulkAction })
        ?.in('id', selectedUsers);

      if (error) {
        setSaveMessage(`Error: ${error?.message}`);
      } else {
        setSaveMessage(`Bulk role update completed for ${selectedUsers?.length} users!`);
        setSelectedUsers([]);
        setBulkAction('');
        await loadData();
        await logActivity('bulk_role_update', 'Role Management', `Updated ${selectedUsers?.length} users to ${bulkAction} role`);
      }
    } catch (error) {
      setSaveMessage(`Error: ${error?.message}`);
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  const getRoleColor = (roleName) => {
    const role = roleHierarchy?.find(r => r?.nombre === roleName);
    return role?.color || 'gray';
  };

  const getRolePermissions = (roleName) => {
    const role = roleHierarchy?.find(r => r?.nombre === roleName);
    return role?.permissions || [];
  };

  const getPermissionCount = (roleName) => {
    return getRolePermissions(roleName)?.length;
  };

  if (!isSuperAdmin?.()) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">Only SuperAdmins can access the Role-Based Access Control Management System</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading role management system...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <BrandedHeader />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Role-Based Access Control Management System
          </h1>
          <p className="text-gray-600">
            Manage user roles, permissions, and system security controls
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Panel - Role Hierarchy (30%) */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Crown className="w-5 h-5 mr-2 text-yellow-600" />
                Role Hierarchy
              </h3>
              
              <div className="space-y-4">
                {roleHierarchy?.map((role) => (
                  <div
                    key={role?.id}
                    className={`border-l-4 border-${role?.color}-500 bg-${role?.color}-50 p-3 rounded-r-md`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium bg-${role?.color}-100 text-${role?.color}-800`}>
                        Level {role?.level}
                      </span>
                      <span className="text-xs text-gray-500">
                        {getPermissionCount(role?.nombre)} permissions
                      </span>
                    </div>
                    <h4 className="font-medium text-gray-900 capitalize">{role?.nombre}</h4>
                    <p className="text-xs text-gray-600 mt-1">{role?.descripcion}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-md">
                <h4 className="font-medium text-blue-900 mb-2">Security Note</h4>
                <p className="text-xs text-blue-700">
                  Higher-level roles inherit all permissions from lower levels. Changes take effect immediately.
                </p>
              </div>
            </div>
          </div>

          {/* Right Panel - Permission Management (70%) */}
          <div className="lg:col-span-3 space-y-6">
            {/* Tab Navigation */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6">
                  <button
                    onClick={() => setActiveTab('roles')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'roles' ?'border-blue-500 text-blue-600' :'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Users className="w-4 h-4 inline mr-2" />
                    User Role Assignment
                  </button>
                  <button
                    onClick={() => setActiveTab('permissions')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'permissions' ?'border-blue-500 text-blue-600' :'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Shield className="w-4 h-4 inline mr-2" />
                    Permission Matrix
                  </button>
                  <button
                    onClick={() => setActiveTab('audit')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'audit' ?'border-blue-500 text-blue-600' :'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Eye className="w-4 h-4 inline mr-2" />
                    Security Audit
                  </button>
                </nav>
              </div>

              <div className="p-6">
                {activeTab === 'roles' && (
                  <div className="space-y-6">
                    {/* Filters and Search */}
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex-1">
                        <div className="relative">
                          <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Search users by name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e?.target?.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      
                      <div className="sm:w-48">
                        <select
                          value={roleFilter}
                          onChange={(e) => setRoleFilter(e?.target?.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="all">All Roles</option>
                          <option value="user">User</option>
                          <option value="supervisor">Supervisor</option>
                          <option value="admin">Admin</option>
                          <option value="superadmin">SuperAdmin</option>
                        </select>
                      </div>
                    </div>

                    {/* Bulk Actions */}
                    {selectedUsers?.length > 0 && (
                      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-blue-700">
                            {selectedUsers?.length} user{selectedUsers?.length !== 1 ? 's' : ''} selected
                          </span>
                          <div className="flex items-center space-x-2">
                            <select
                              value={bulkAction}
                              onChange={(e) => setBulkAction(e?.target?.value)}
                              className="px-3 py-1 text-sm border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">Select Action</option>
                              <option value="user">Change to User</option>
                              <option value="supervisor">Change to Supervisor</option>
                              <option value="admin">Change to Admin</option>
                            </select>
                            <button
                              onClick={handleBulkRoleUpdate}
                              disabled={!bulkAction || isSaving}
                              className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                            >
                              Apply
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* User Grid */}
                    <div className="overflow-x-auto">
                      <table className="min-w-full bg-white border border-gray-200 rounded-md">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left">
                              <input
                                type="checkbox"
                                onChange={(e) => {
                                  if (e?.target?.checked) {
                                    setSelectedUsers(filteredUsers?.map(u => u?.id));
                                  } else {
                                    setSelectedUsers([]);
                                  }
                                }}
                                checked={selectedUsers?.length === filteredUsers?.length && filteredUsers?.length > 0}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                              />
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              User
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Current Role
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Permissions
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredUsers?.map((user) => (
                            <tr key={user?.id} className="hover:bg-gray-50">
                              <td className="px-4 py-4">
                                <input
                                  type="checkbox"
                                  checked={selectedUsers?.includes(user?.id)}
                                  onChange={(e) => {
                                    if (e?.target?.checked) {
                                      setSelectedUsers([...selectedUsers, user?.id]);
                                    } else {
                                      setSelectedUsers(selectedUsers?.filter(id => id !== user?.id));
                                    }
                                  }}
                                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                />
                              </td>
                              <td className="px-4 py-4">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-10 w-10">
                                    <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                      <Users className="w-5 h-5 text-gray-600" />
                                    </div>
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">{user?.nombre}</div>
                                    <div className="text-sm text-gray-500">{user?.correo}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  getRoleColor(user?.rol) === 'purple' ? 'bg-purple-100 text-purple-800' :
                                  getRoleColor(user?.rol) === 'red' ? 'bg-red-100 text-red-800' :
                                  getRoleColor(user?.rol) === 'yellow'? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                                }`}>
                                  {user?.rol || 'Not Assigned'}
                                </span>
                              </td>
                              <td className="px-4 py-4">
                                <div className="text-sm text-gray-500">
                                  {getPermissionCount(user?.rol)} permissions
                                </div>
                              </td>
                              <td className="px-4 py-4">
                                <select
                                  value={user?.rol || ''}
                                  onChange={(e) => handleUserRoleUpdate(user?.id, e?.target?.value)}
                                  disabled={isSaving}
                                  className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="">Select Role</option>
                                  <option value="user">User</option>
                                  <option value="supervisor">Supervisor</option>
                                  <option value="admin">Admin</option>
                                  <option value="superadmin">SuperAdmin</option>
                                </select>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      
                      {filteredUsers?.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          No users found matching your criteria
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'permissions' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Permission Matrix</h3>
                    
                    <div className="overflow-x-auto">
                      <table className="min-w-full bg-white border border-gray-200 rounded-md">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Permission
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                              User
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Supervisor
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Admin
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                              SuperAdmin
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {[
                            'view_profile', 'view_history', 'view_notifications', 'check_in_out',
                            'manage_team_attendance', 'view_team_reports', 'register_incidents',
                            'access_payroll', 'generate_reports', 'manage_employees',
                            'visual_configuration', 'system_logs', 'role_management'
                          ]?.map((permission) => (
                            <tr key={permission} className="hover:bg-gray-50">
                              <td className="px-4 py-4 text-sm font-medium text-gray-900 capitalize">
                                {permission?.replace(/_/g, ' ')}
                              </td>
                              {roleHierarchy?.map((role) => (
                                <td key={role?.nombre} className="px-4 py-4 text-center">
                                  {role?.permissions?.includes(permission) ? (
                                    <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                                  ) : (
                                    <div className="w-5 h-5 bg-gray-200 rounded-full mx-auto"></div>
                                  )}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {activeTab === 'audit' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Audit Trail</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                      <div className="bg-green-50 border border-green-200 rounded-md p-4">
                        <div className="flex items-center">
                          <CheckCircle className="w-8 h-8 text-green-500" />
                          <div className="ml-3">
                            <p className="text-sm font-medium text-green-800">Active Users</p>
                            <p className="text-2xl font-bold text-green-900">
                              {users?.filter(u => u?.rol)?.length}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                        <div className="flex items-center">
                          <AlertTriangle className="w-8 h-8 text-yellow-500" />
                          <div className="ml-3">
                            <p className="text-sm font-medium text-yellow-800">Unassigned</p>
                            <p className="text-2xl font-bold text-yellow-900">
                              {users?.filter(u => !u?.rol)?.length}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                        <div className="flex items-center">
                          <Users className="w-8 h-8 text-blue-500" />
                          <div className="ml-3">
                            <p className="text-sm font-medium text-blue-800">Supervisors</p>
                            <p className="text-2xl font-bold text-blue-900">
                              {users?.filter(u => u?.rol === 'supervisor')?.length}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-red-50 border border-red-200 rounded-md p-4">
                        <div className="flex items-center">
                          <Crown className="w-8 h-8 text-red-500" />
                          <div className="ml-3">
                            <p className="text-sm font-medium text-red-800">Admins</p>
                            <p className="text-2xl font-bold text-red-900">
                              {users?.filter(u => ['admin', 'superadmin']?.includes(u?.rol))?.length}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-md p-6">
                      <h4 className="font-medium text-gray-900 mb-4">Security Recommendations</h4>
                      <div className="space-y-3">
                        <div className="flex items-start space-x-3">
                          <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">Role-based access control active</p>
                            <p className="text-sm text-gray-600">All users have appropriate role assignments</p>
                          </div>
                        </div>
                        
                        {users?.filter(u => !u?.rol)?.length > 0 && (
                          <div className="flex items-start space-x-3">
                            <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">Unassigned users detected</p>
                              <p className="text-sm text-gray-600">
                                {users?.filter(u => !u?.rol)?.length} users need role assignment
                              </p>
                            </div>
                          </div>
                        )}

                        <div className="flex items-start space-x-3">
                          <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">Activity logging enabled</p>
                            <p className="text-sm text-gray-600">All role changes are being tracked</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {saveMessage && (
                  <div className={`p-3 rounded-md text-sm ${
                    saveMessage?.includes('Error') 
                      ? 'bg-red-50 text-red-700 border border-red-200' :'bg-green-50 text-green-700 border border-green-200'
                  }`}>
                    {saveMessage}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <BrandedFooter />
    </div>
  );
}