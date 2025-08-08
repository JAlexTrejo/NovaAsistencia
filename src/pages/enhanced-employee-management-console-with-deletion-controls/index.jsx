import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import RoleBasedSidebar from '../../components/ui/RoleBasedSidebar';
import NavigationHeader from '../../components/ui/NavigationHeader';
import UserContextHeader from '../../components/ui/UserContextHeader';
import NotificationCenter from '../../components/ui/NotificationCenter';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

import EmployeeFilters from '../administrator-employee-management-console/components/EmployeeFilters';
import EmployeeTable from '../administrator-employee-management-console/components/EmployeeTable';
import EmployeeDetailPanel from '../administrator-employee-management-console/components/EmployeeDetailPanel';
import BulkActionsToolbar from '../administrator-employee-management-console/components/BulkActionsToolbar';
import EmployeeCreationModal from '../administrator-employee-management-console/components/EmployeeCreationModal';
import DeleteConfirmationModal from './components/DeleteConfirmationModal';
import { getEmployeesWithFilters, deleteEmployee, restoreEmployee } from '../../services/employeeService';

const EnhancedEmployeeManagementConsoleWithDeletionControls = () => {
  const navigate = useNavigate();
  const { user, userProfile, isSuperAdmin, signOut } = useAuth();
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false);
  const [isEditingEmployee, setIsEditingEmployee] = useState(false);
  const [isCreationModalOpen, setIsCreationModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const [globalSearch, setGlobalSearch] = useState('');
  const [notification, setNotification] = useState('');

  const [filters, setFilters] = useState({
    search: '',
    status: ['active'],
    siteId: '',
    supervisorId: '',
    hireDateFrom: '',
    hireDateTo: '',
    includeDeleted: false
  });

  const [sortConfig, setSortConfig] = useState({
    column: 'full_name',
    direction: 'asc'
  });

  // Load employees with filters
  const loadEmployees = async () => {
    try {
      setLoading(true);
      setError('');
      const searchFilters = {
        ...filters,
        search: globalSearch,
        sortColumn: sortConfig?.column,
        sortDirection: sortConfig?.direction
      };
      
      const data = await getEmployeesWithFilters(searchFilters);
      setEmployees(data || []);
    } catch (err) {
      setError(`Error al cargar empleados: ${err?.message || 'Error desconocido'}`);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, [filters, sortConfig]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      loadEmployees();
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [globalSearch]);

  const handleEmployeeSelect = (employeeId, selected) => {
    if (selected) {
      setSelectedEmployees(prev => [...prev, employeeId]);
    } else {
      setSelectedEmployees(prev => prev?.filter(id => id !== employeeId));
    }
  };

  const handleSelectAll = (selected) => {
    if (selected) {
      setSelectedEmployees(employees?.map(emp => emp?.id));
    } else {
      setSelectedEmployees([]);
    }
  };

  const handleEmployeeClick = (employee) => {
    setSelectedEmployee(employee);
    setIsDetailPanelOpen(true);
    setIsEditingEmployee(false);
  };

  const handleCloseDetailPanel = () => {
    setIsDetailPanelOpen(false);
    setSelectedEmployee(null);
    setIsEditingEmployee(false);
  };

  const handleSaveEmployee = async (updatedEmployee) => {
    setEmployees(prev => prev?.map(emp => 
      emp?.id === updatedEmployee?.id ? updatedEmployee : emp
    ));
    setSelectedEmployee(updatedEmployee);
    await loadEmployees(); // Refresh data
  };

  const handleCreateEmployee = async (newEmployee) => {
    setEmployees(prev => [...prev, newEmployee]);
    await loadEmployees(); // Refresh data
  };

  const handleDeleteClick = (employee) => {
    if (!isSuperAdmin()) {
      setNotification('Solo SuperAdmins pueden eliminar empleados');
      setTimeout(() => setNotification(''), 3000);
      return;
    }
    
    setEmployeeToDelete(employee);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!employeeToDelete || !isSuperAdmin()) return;

    try {
      setLoading(true);
      await deleteEmployee(employeeToDelete?.id);
      
      setNotification(`Empleado ${employeeToDelete?.full_name} eliminado exitosamente`);
      setTimeout(() => setNotification(''), 3000);
      
      setIsDeleteModalOpen(false);
      setEmployeeToDelete(null);
      setSelectedEmployees(prev => prev?.filter(id => id !== employeeToDelete?.id));
      
      if (selectedEmployee?.id === employeeToDelete?.id) {
        handleCloseDetailPanel();
      }
      
      await loadEmployees();
    } catch (err) {
      setError(`Error al eliminar empleado: ${err?.message}`);
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreEmployee = async (employee) => {
    if (!isSuperAdmin()) {
      setNotification('Solo SuperAdmins pueden restaurar empleados');
      setTimeout(() => setNotification(''), 3000);
      return;
    }

    try {
      setLoading(true);
      await restoreEmployee(employee?.id);
      
      setNotification(`Empleado ${employee?.full_name} restaurado exitosamente`);
      setTimeout(() => setNotification(''), 3000);
      
      await loadEmployees();
    } catch (err) {
      setError(`Error al restaurar empleado: ${err?.message}`);
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedEmployees?.length === 0) return;

    switch (action) {
      case 'delete':
        if (!isSuperAdmin()) {
          setNotification('Solo SuperAdmins pueden eliminar empleados masivamente');
          setTimeout(() => setNotification(''), 3000);
          return;
        }
        
        try {
          setLoading(true);
          for (const employeeId of selectedEmployees) {
            await deleteEmployee(employeeId);
          }
          
          setNotification(`${selectedEmployees?.length} empleados eliminados exitosamente`);
          setTimeout(() => setNotification(''), 3000);
          
          setSelectedEmployees([]);
          await loadEmployees();
        } catch (err) {
          setError(`Error en eliminación masiva: ${err?.message}`);
          setTimeout(() => setError(''), 5000);
        } finally {
          setLoading(false);
        }
        break;

      case 'export':
        handleExportData();
        break;

      default:
        console.log('Bulk action:', action, selectedEmployees);
    }
  };

  const handleViewAttendance = (employee) => {
    navigate('/admin/attendance', { 
      state: { employeeId: employee?.id } 
    });
  };

  const handleViewPayroll = (employee) => {
    navigate('/admin/payroll', { 
      state: { employeeId: employee?.id } 
    });
  };

  const handleViewIncidents = (employee) => {
    navigate('/admin/incidents', { 
      state: { employeeId: employee?.id } 
    });
  };

  const handleExportData = () => {
    const dataToExport = selectedEmployees?.length > 0 
      ? employees?.filter(emp => selectedEmployees?.includes(emp?.id))
      : employees;
    
    console.log('Exporting data:', dataToExport);
    // TODO: Implement actual export logic
    
    setNotification('Exportación iniciada');
    setTimeout(() => setNotification(''), 3000);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (err) {
      setError(`Error al cerrar sesión: ${err?.message}`);
    }
  };

  if (loading && employees?.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Cargando empleados...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Notifications */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg">
          {notification}
        </div>
      )}

      {error && (
        <div className="fixed top-4 right-4 z-50 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg">
          {error}
          <button 
            onClick={() => setError('')}
            className="ml-2 text-white hover:text-gray-200"
          >
            ×
          </button>
        </div>
      )}

      {/* Sidebar */}
      <RoleBasedSidebar 
        isCollapsed={sidebarCollapsed}
        userRole={userProfile?.role?.toLowerCase()}
      />

      {/* Main Content */}
      <div className={`transition-all duration-300 ease-out-cubic ${sidebarCollapsed ? 'ml-16' : 'ml-60'} pb-16 md:pb-0`}>
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="hidden md:flex"
                iconName={sidebarCollapsed ? 'PanelLeftOpen' : 'PanelLeftClose'}
                iconSize={20}
              />
              
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Gestión Avanzada de Empleados
                </h1>
                <p className="text-muted-foreground">
                  Control integral con funcionalidades de eliminación y recuperación
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Global Search */}
              <div className="hidden md:block w-80">
                <Input
                  type="search"
                  placeholder="Buscar empleados..."
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e?.target?.value)}
                  className="w-full"
                />
              </div>

              <NotificationCenter />
              <UserContextHeader 
                user={{
                  name: userProfile?.full_name || 'Usuario',
                  role: userProfile?.role === 'superadmin' ? 'SuperAdmin' : 
                        userProfile?.role === 'admin' ? 'Admin' : 
                        userProfile?.role?.charAt(0)?.toUpperCase() + userProfile?.role?.slice(1),
                  site: 'Sistema Central'
                }}
                onLogout={handleLogout}
              />
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-6">
          <NavigationHeader 
            showBackButton={false}
            showHomeButton={false}
          />

          {/* Action Bar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Icon name="Users" size={20} />
                <span className="text-sm">
                  {employees?.length} empleado{employees?.length !== 1 ? 's' : ''} encontrado{employees?.length !== 1 ? 's' : ''}
                </span>
              </div>
              
              {filters?.includeDeleted && (
                <div className="flex items-center space-x-2 text-amber-600 text-sm bg-amber-50 px-2 py-1 rounded-md">
                  <Icon name="AlertTriangle" size={16} />
                  <span>Incluyendo empleados eliminados</span>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={handleExportData}
                iconName="Download"
                iconSize={16}
                disabled={loading}
              >
                Exportar
              </Button>
              
              <Button
                onClick={() => setIsCreationModalOpen(true)}
                iconName="Plus"
                iconSize={16}
                disabled={loading}
              >
                Nuevo Empleado
              </Button>
            </div>
          </div>

          {/* Bulk Actions */}
          <BulkActionsToolbar
            selectedCount={selectedEmployees?.length}
            onBulkAction={handleBulkAction}
            onClearSelection={() => setSelectedEmployees([])}
            userRole={userProfile?.role?.toLowerCase()}
            showDeleteActions={isSuperAdmin()}
          />

          {/* Main Layout */}
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            {/* Filters Sidebar */}
            <div className="xl:col-span-1">
              <EmployeeFilters
                filters={filters}
                onFiltersChange={setFilters}
                onClearFilters={() => setFilters({
                  search: '',
                  status: ['active'],
                  siteId: '',
                  supervisorId: '',
                  hireDateFrom: '',
                  hireDateTo: '',
                  includeDeleted: false
                })}
                showDeletedFilter={isSuperAdmin()}
              />
            </div>

            {/* Employee Table */}
            <div className={`${isDetailPanelOpen ? 'xl:col-span-2' : 'xl:col-span-3'}`}>
              <EmployeeTable
                employees={employees}
                selectedEmployees={selectedEmployees}
                onEmployeeSelect={handleEmployeeSelect}
                onSelectAll={handleSelectAll}
                onEmployeeClick={handleEmployeeClick}
                onSort={setSortConfig}
                sortConfig={sortConfig}
                onDelete={handleDeleteClick}
                onRestore={handleRestoreEmployee}
                userRole={userProfile?.role?.toLowerCase()}
                showDeleteActions={isSuperAdmin()}
                loading={loading}
              />
            </div>

            {/* Detail Panel */}
            {isDetailPanelOpen && (
              <div className="xl:col-span-1">
                <EmployeeDetailPanel
                  employee={selectedEmployee}
                  onClose={handleCloseDetailPanel}
                  onSave={handleSaveEmployee}
                  onDelete={handleDeleteClick}
                  onRestore={handleRestoreEmployee}
                  onViewAttendance={handleViewAttendance}
                  onViewPayroll={handleViewPayroll}
                  onViewIncidents={handleViewIncidents}
                  userRole={userProfile?.role?.toLowerCase()}
                  showDeleteActions={isSuperAdmin()}
                  isEditing={isEditingEmployee}
                  onToggleEdit={() => setIsEditingEmployee(!isEditingEmployee)}
                />
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Employee Creation Modal */}
      <EmployeeCreationModal
        isOpen={isCreationModalOpen}
        onClose={() => setIsCreationModalOpen(false)}
        onSave={handleCreateEmployee}
        userRole={userProfile?.role?.toLowerCase()}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        employee={employeeToDelete}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setEmployeeToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        loading={loading}
      />
    </div>
  );
};

export default EnhancedEmployeeManagementConsoleWithDeletionControls;