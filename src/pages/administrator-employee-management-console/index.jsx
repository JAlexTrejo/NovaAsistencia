import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import RoleBasedSidebar from '../../components/ui/RoleBasedSidebar';
import NavigationHeader from '../../components/ui/NavigationHeader';
import UserContextHeader from '../../components/ui/UserContextHeader';
import NotificationCenter from '../../components/ui/NotificationCenter';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import EmployeeFilters from './components/EmployeeFilters';
import EmployeeTable from './components/EmployeeTable';
import EmployeeDetailPanel from './components/EmployeeDetailPanel';
import BulkActionsToolbar from './components/BulkActionsToolbar';
import EmployeeCreationModal from './components/EmployeeCreationModal';
import { useAuth } from '../../contexts/AuthContext';
import enhancedEmployeeService from '../../services/enhancedEmployeeService';

const AdministratorEmployeeManagementConsole = () => {
  const navigate = useNavigate();
  const { getCurrentUserContext, loading: authLoading } = useAuth();
  
  // State management
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false);
  const [isEditingEmployee, setIsEditingEmployee] = useState(false);
  const [isCreationModalOpen, setIsCreationModalOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  
  // Data state
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);
  
  // Filter state
  const [filters, setFilters] = useState({
    search: '',
    site: 'all',
    supervisor: 'all',
    status: [],
    position: 'all',
    hireDateFrom: '',
    hireDateTo: ''
  });
  
  const [sortConfig, setSortConfig] = useState({
    column: 'name',
    direction: 'asc'
  });
  
  const [savedFilters, setSavedFilters] = useState([]);

  const currentUser = getCurrentUserContext();

  // Load employees data
  const loadEmployees = async () => {
    try {
      setLoading(true);
      setError('');
      const employeesData = await enhancedEmployeeService?.getEmployees();
      setEmployees(employeesData);
    } catch (err) {
      console.error('Error loading employees:', err);
      setError(err?.message || 'Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  // Load statistics
  const loadStats = async () => {
    try {
      const statsData = await enhancedEmployeeService?.getEmployeeStats();
      setStats(statsData);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  // Initial data load
  useEffect(() => {
    if (!authLoading && currentUser) {
      loadEmployees();
      loadStats();
    }
  }, [authLoading, currentUser]);

  // Filter and sort employees
  useEffect(() => {
    let filtered = [...employees];

    // Apply filters
    if (filters?.search) {
      const searchTerm = filters?.search?.toLowerCase();
      filtered = filtered?.filter(employee =>
        employee?.name?.toLowerCase()?.includes(searchTerm) ||
        employee?.email?.toLowerCase()?.includes(searchTerm) ||
        employee?.employeeId?.toLowerCase()?.includes(searchTerm) ||
        employee?.phone?.toLowerCase()?.includes(searchTerm)
      );
    }

    if (filters?.site !== 'all') {
      filtered = filtered?.filter(employee => employee?.site === filters?.site);
    }

    if (filters?.supervisor !== 'all') {
      filtered = filtered?.filter(employee => employee?.supervisor === filters?.supervisor);
    }

    if (filters?.status?.length > 0) {
      filtered = filtered?.filter(employee => filters?.status?.includes(employee?.status));
    }

    if (filters?.position !== 'all') {
      filtered = filtered?.filter(employee => employee?.position === filters?.position);
    }

    if (filters?.hireDateFrom) {
      filtered = filtered?.filter(employee => 
        new Date(employee?.hireDate) >= new Date(filters?.hireDateFrom)
      );
    }

    if (filters?.hireDateTo) {
      filtered = filtered?.filter(employee => 
        new Date(employee?.hireDate) <= new Date(filters?.hireDateTo)
      );
    }

    // Apply sorting
    filtered?.sort((a, b) => {
      const aValue = a?.[sortConfig?.column];
      const bValue = b?.[sortConfig?.column];
      
      if (sortConfig?.direction === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    setFilteredEmployees(filtered);
  }, [employees, filters, sortConfig]);

  // Update global search in filters
  useEffect(() => {
    setFilters(prev => ({ ...prev, search: globalSearch }));
  }, [globalSearch]);

  // Event handlers
  const handleEmployeeSelect = (employeeId, selected) => {
    if (selected) {
      setSelectedEmployees(prev => [...prev, employeeId]);
    } else {
      setSelectedEmployees(prev => prev?.filter(id => id !== employeeId));
    }
  };

  const handleSelectAll = (selected) => {
    if (selected) {
      setSelectedEmployees(filteredEmployees?.map(emp => emp?.id));
    } else {
      setSelectedEmployees([]);
    }
  };

  const handleEmployeeClick = async (employee) => {
    try {
      // Fetch complete employee details
      const fullEmployee = await enhancedEmployeeService?.getEmployeeById(employee?.id);
      setSelectedEmployee(fullEmployee);
      setIsDetailPanelOpen(true);
      setIsEditingEmployee(false);
    } catch (err) {
      console.error('Error loading employee details:', err);
      setError('Failed to load employee details');
    }
  };

  const handleCloseDetailPanel = () => {
    setIsDetailPanelOpen(false);
    setSelectedEmployee(null);
    setIsEditingEmployee(false);
  };

  const handleSaveEmployee = async (updatedEmployee) => {
    try {
      await enhancedEmployeeService?.updateEmployee(updatedEmployee?.id, updatedEmployee);
      setSelectedEmployee(updatedEmployee);
      // Reload employees list
      await loadEmployees();
      await loadStats();
    } catch (err) {
      console.error('Error updating employee:', err);
      setError('Failed to update employee');
    }
  };

  const handleCreateEmployee = async (newEmployeeData) => {
    try {
      await enhancedEmployeeService?.createEmployee(newEmployeeData);
      // Reload employees list
      await loadEmployees();
      await loadStats();
      setIsCreationModalOpen(false);
    } catch (err) {
      console.error('Error creating employee:', err);
      setError('Failed to create employee');
    }
  };

  const handleBulkAction = async (action) => {
    try {
      if (action === 'delete' && selectedEmployees?.length > 0) {
        // Implement bulk delete
        for (const employeeId of selectedEmployees) {
          await enhancedEmployeeService?.deleteEmployee(employeeId, currentUser?.id);
        }
        await loadEmployees();
        await loadStats();
        setSelectedEmployees([]);
      } else if (action === 'activate' && selectedEmployees?.length > 0) {
        await enhancedEmployeeService?.bulkUpdateEmployees(selectedEmployees, { status: 'active' });
        await loadEmployees();
        setSelectedEmployees([]);
      } else if (action === 'deactivate' && selectedEmployees?.length > 0) {
        await enhancedEmployeeService?.bulkUpdateEmployees(selectedEmployees, { status: 'inactive' });
        await loadEmployees();
        setSelectedEmployees([]);
      }
    } catch (err) {
      console.error('Error in bulk action:', err);
      setError(`Failed to ${action} employees`);
    }
  };

  const handleSaveFilter = (filterData) => {
    setSavedFilters(prev => [...prev, filterData]);
  };

  const handleLoadFilter = (savedFilter) => {
    setFilters(savedFilter?.filters);
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      site: 'all',
      supervisor: 'all',
      status: [],
      position: 'all',
      hireDateFrom: '',
      hireDateTo: ''
    });
    setGlobalSearch('');
  };

  const handleViewAttendance = (employee) => {
    navigate('/attendance-history-and-analytics-dashboard', { 
      state: { employeeId: employee?.id } 
    });
  };

  const handleViewPayroll = (employee) => {
    navigate('/payroll-calculation-and-management-interface', { 
      state: { employeeId: employee?.id } 
    });
  };

  const handleViewIncidents = (employee) => {
    navigate('/incident-registration-and-management-system', { 
      state: { employeeId: employee?.id } 
    });
  };

  const handleExportData = () => {
    const dataToExport = selectedEmployees?.length > 0 
      ? employees?.filter(emp => selectedEmployees?.includes(emp?.id))
      : filteredEmployees;
    
    // Create CSV content
    const csvContent = [
      // Headers
      ['ID Empleado', 'Nombre', 'Email', 'Teléfono', 'Obra', 'Supervisor', 'Puesto', 'Estado', 'Salario Diario']?.join(','),
      // Data rows
      ...dataToExport?.map(emp => [
        emp?.employeeId || '',
        `"${emp?.name || ''}"`,
        emp?.email || '',
        emp?.phone || '',
        `"${emp?.site || ''}"`,
        `"${emp?.supervisor || ''}"`,
        emp?.position || '',
        emp?.status || '',
        emp?.dailySalary || 0
      ]?.join(','))
    ]?.join('\n');

    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link?.setAttribute('href', url);
    link?.setAttribute('download', `empleados_${new Date()?.toISOString()?.split('T')?.[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body?.appendChild(link);
    link?.click();
    document.body?.removeChild(link);
  };

  // Show loading state
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Cargando empleados...</span>
        </div>
      </div>
    );
  }

  // Show error state
  if (error && !loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Icon name="AlertCircle" size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Error al cargar datos</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={loadEmployees} variant="outline">
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <RoleBasedSidebar 
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        userRole={currentUser?.role?.toLowerCase()}
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
                <h1 className="text-2xl font-bold text-foreground">Consola de Empleados</h1>
                <p className="text-muted-foreground">Gestión integral de empleados y estructura organizacional</p>
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
                onLogout={() => navigate('/employee-login-portal')}
              />
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-6">
          {/* Navigation Header */}
          <NavigationHeader 
            title="Consola de Empleados"
            subtitle="Gestión integral de empleados y estructura organizacional"
            showBackButton={false}
            showHomeButton={false}
          />

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-card rounded-lg p-4 border border-border">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Icon name="Users" size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-foreground">{stats?.total}</div>
                    <div className="text-sm text-muted-foreground">Total Empleados</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-card rounded-lg p-4 border border-border">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Icon name="CheckCircle" size={20} className="text-green-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-foreground">{stats?.active}</div>
                    <div className="text-sm text-muted-foreground">Activos</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-card rounded-lg p-4 border border-border">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Icon name="Pause" size={20} className="text-gray-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-foreground">{stats?.inactive}</div>
                    <div className="text-sm text-muted-foreground">Inactivos</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-card rounded-lg p-4 border border-border">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <Icon name="AlertCircle" size={20} className="text-red-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-foreground">{stats?.suspended}</div>
                    <div className="text-sm text-muted-foreground">Suspendidos</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Bar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Icon name="Users" size={20} />
                <span className="text-sm">
                  {filteredEmployees?.length} empleado{filteredEmployees?.length !== 1 ? 's' : ''} 
                  {filteredEmployees?.length !== employees?.length && ` de ${employees?.length} total`}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={handleExportData}
                iconName="Download"
                iconSize={16}
              >
                Exportar
              </Button>
              
              <Button
                onClick={() => setIsCreationModalOpen(true)}
                iconName="Plus"
                iconSize={16}
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
            userRole={currentUser?.role?.toLowerCase()}
          />

          {/* Main Layout */}
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            {/* Filters Sidebar */}
            <div className="xl:col-span-1">
              <EmployeeFilters
                filters={filters}
                onFiltersChange={setFilters}
                onClearFilters={handleClearFilters}
                savedFilters={savedFilters}
                onSaveFilter={handleSaveFilter}
                onLoadFilter={handleLoadFilter}
              />
            </div>

            {/* Employee Table */}
            <div className={`${isDetailPanelOpen ? 'xl:col-span-2' : 'xl:col-span-3'}`}>
              <EmployeeTable
                employees={filteredEmployees}
                selectedEmployees={selectedEmployees}
                onEmployeeSelect={handleEmployeeSelect}
                onSelectAll={handleSelectAll}
                onEmployeeClick={handleEmployeeClick}
                onSort={setSortConfig}
                sortConfig={sortConfig}
                onDelete={async (employeeId) => {
                  try {
                    await enhancedEmployeeService?.deleteEmployee(employeeId, currentUser?.id);
                    await loadEmployees();
                    await loadStats();
                  } catch (err) {
                    console.error('Error deleting employee:', err);
                    setError('Failed to delete employee');
                  }
                }}
                onRestore={async (employeeId) => {
                  try {
                    await enhancedEmployeeService?.updateEmployee(employeeId, { status: 'active' });
                    await loadEmployees();
                    await loadStats();
                  } catch (err) {
                    console.error('Error restoring employee:', err);
                    setError('Failed to restore employee');
                  }
                }}
                userRole={currentUser?.role?.toLowerCase()}
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
                  onViewAttendance={handleViewAttendance}
                  onViewPayroll={handleViewPayroll}
                  onViewIncidents={handleViewIncidents}
                  userRole={currentUser?.role?.toLowerCase()}
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
        userRole={currentUser?.role?.toLowerCase()}
      />
    </div>
  );
};

export default AdministratorEmployeeManagementConsole;