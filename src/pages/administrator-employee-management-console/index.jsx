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

const AdministratorEmployeeManagementConsole = () => {
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false);
  const [isEditingEmployee, setIsEditingEmployee] = useState(false);
  const [isCreationModalOpen, setIsCreationModalOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [filters, setFilters] = useState({
    search: '',
    site: 'all',
    supervisor: 'all',
    status: [],
    hireDateFrom: '',
    hireDateTo: ''
  });
  const [sortConfig, setSortConfig] = useState({
    column: 'name',
    direction: 'asc'
  });
  const [savedFilters, setSavedFilters] = useState([]);

  // Mock user data
  const currentUser = {
    name: 'Carlos Martínez',
    role: 'Admin',
    site: 'Obra Central',
    avatar: null
  };

  // Mock employees data
  const [employees, setEmployees] = useState([
    {
      id: 1,
      employeeId: 'EMP001',
      name: 'Juan Pérez García',
      email: 'juan.perez@construcciones.com',
      phone: '+34 600 123 456',
      idNumber: '12345678A',
      birthDate: '1985-03-15',
      address: 'Calle Mayor 123, Madrid',
      emergencyContact: 'María Pérez - +34 600 654 321',
      site: 'Obra Central',
      supervisor: 'Carlos Martínez',
      hireDate: '2023-01-15',
      status: 'active',
      dailySalary: 85,
      lastAttendance: '2025-01-03',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
    },
    {
      id: 2,
      employeeId: 'EMP002',
      name: 'María González López',
      email: 'maria.gonzalez@construcciones.com',
      phone: '+34 600 234 567',
      idNumber: '23456789B',
      birthDate: '1990-07-22',
      address: 'Avenida Libertad 45, Barcelona',
      emergencyContact: 'Pedro González - +34 600 765 432',
      site: 'Proyecto Norte',
      supervisor: 'Ana Rodríguez',
      hireDate: '2023-03-10',
      status: 'active',
      dailySalary: 80,
      lastAttendance: '2025-01-03',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face'
    },
    {
      id: 3,
      employeeId: 'EMP003',
      name: 'Carlos Ruiz Martín',
      email: 'carlos.ruiz@construcciones.com',
      phone: '+34 600 345 678',
      idNumber: '34567890C',
      birthDate: '1988-11-08',
      address: 'Plaza España 12, Valencia',
      emergencyContact: 'Ana Ruiz - +34 600 876 543',
      site: 'Edificio Sur',
      supervisor: 'Miguel Santos',
      hireDate: '2022-09-20',
      status: 'active',
      dailySalary: 90,
      lastAttendance: '2025-01-02',
      avatar: null
    },
    {
      id: 4,
      employeeId: 'EMP004',
      name: 'Ana Fernández Silva',
      email: 'ana.fernandez@construcciones.com',
      phone: '+34 600 456 789',
      idNumber: '45678901D',
      birthDate: '1992-05-14',
      address: 'Calle Sol 78, Sevilla',
      emergencyContact: 'Luis Fernández - +34 600 987 654',
      site: 'Complejo Oeste',
      supervisor: 'Lucía Fernández',
      hireDate: '2023-06-01',
      status: 'suspended',
      dailySalary: 75,
      lastAttendance: '2024-12-28',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face'
    },
    {
      id: 5,
      employeeId: 'EMP005',
      name: 'Miguel Torres Vega',
      email: 'miguel.torres@construcciones.com',
      phone: '+34 600 567 890',
      idNumber: '56789012E',
      birthDate: '1987-09-30',
      address: 'Paseo Marítimo 234, Málaga',
      emergencyContact: 'Carmen Torres - +34 600 098 765',
      site: 'Obra Central',
      supervisor: 'Carlos Martínez',
      hireDate: '2022-11-15',
      status: 'inactive',
      dailySalary: 82,
      lastAttendance: '2024-12-20',
      avatar: null
    }
  ]);

  // Filter employees based on current filters
  const filteredEmployees = employees?.filter(employee => {
    const matchesSearch = !filters?.search || 
      employee?.name?.toLowerCase()?.includes(filters?.search?.toLowerCase()) ||
      employee?.email?.toLowerCase()?.includes(filters?.search?.toLowerCase()) ||
      employee?.employeeId?.toLowerCase()?.includes(filters?.search?.toLowerCase());
    
    const matchesSite = filters?.site === 'all' || employee?.site === filters?.site;
    const matchesSupervisor = filters?.supervisor === 'all' || employee?.supervisor === filters?.supervisor;
    const matchesStatus = filters?.status?.length === 0 || filters?.status?.includes(employee?.status);
    
    const matchesHireDate = (!filters?.hireDateFrom || new Date(employee.hireDate) >= new Date(filters.hireDateFrom)) &&
                           (!filters?.hireDateTo || new Date(employee.hireDate) <= new Date(filters.hireDateTo));
    
    return matchesSearch && matchesSite && matchesSupervisor && matchesStatus && matchesHireDate;
  });

  // Sort employees
  const sortedEmployees = [...filteredEmployees]?.sort((a, b) => {
    const aValue = a?.[sortConfig?.column];
    const bValue = b?.[sortConfig?.column];
    
    if (sortConfig?.direction === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  const handleEmployeeSelect = (employeeId, selected) => {
    if (selected) {
      setSelectedEmployees(prev => [...prev, employeeId]);
    } else {
      setSelectedEmployees(prev => prev?.filter(id => id !== employeeId));
    }
  };

  const handleSelectAll = (selected) => {
    if (selected) {
      setSelectedEmployees(sortedEmployees?.map(emp => emp?.id));
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

  const handleSaveEmployee = (updatedEmployee) => {
    setEmployees(prev => prev?.map(emp => 
      emp?.id === updatedEmployee?.id ? updatedEmployee : emp
    ));
    setSelectedEmployee(updatedEmployee);
  };

  const handleCreateEmployee = (newEmployee) => {
    setEmployees(prev => [...prev, newEmployee]);
  };

  const handleBulkAction = (action) => {
    console.log('Bulk action:', action);
    // Implement bulk actions logic here
    setSelectedEmployees([]);
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
      hireDateFrom: '',
      hireDateTo: ''
    });
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
    // Mock export functionality
    const dataToExport = selectedEmployees?.length > 0 
      ? employees?.filter(emp => selectedEmployees?.includes(emp?.id))
      : sortedEmployees;
    
    console.log('Exporting data:', dataToExport);
    // Implement actual export logic here
  };

  // Update global search in filters
  useEffect(() => {
    setFilters(prev => ({ ...prev, search: globalSearch }));
  }, [globalSearch]);

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <RoleBasedSidebar 
        isCollapsed={sidebarCollapsed}
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
                user={currentUser}
                onLogout={() => navigate('/employee-login-portal')}
              />
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-6">
          {/* Navigation Header */}
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
                  {sortedEmployees?.length} empleado{sortedEmployees?.length !== 1 ? 's' : ''} 
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
                employees={sortedEmployees}
                selectedEmployees={selectedEmployees}
                onEmployeeSelect={handleEmployeeSelect}
                onSelectAll={handleSelectAll}
                onEmployeeClick={handleEmployeeClick}
                onSort={setSortConfig}
                sortConfig={sortConfig}
                userRole={currentUser?.role?.toLowerCase()}
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