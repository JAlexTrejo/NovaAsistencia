// src/pages/enhanced-employee-management-console-with-deletion-controls/index.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
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

import enhancedEmployeeService from '@/services/enhancedEmployeeService';
import { useQuery } from '@/hooks/useQuery';
import { showToast } from '@/components/ui/ToastHub';

const EnhancedEmployeeManagementConsoleWithDeletionControls = () => {
  const navigate = useNavigate();
  const { userProfile, isSuperAdmin, signOut } = useAuth();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false);
  const [isEditingEmployee, setIsEditingEmployee] = useState(false);
  const [isCreationModalOpen, setIsCreationModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);

  const [globalSearch, setGlobalSearch] = useState('');
  const searchDebounceRef = useRef(null);

  const [filters, setFilters] = useState({
    search: '',
    status: ['active'],
    siteId: '',
    supervisorId: '',
    hireDateFrom: '',
    hireDateTo: '',
    includeDeleted: false
  });

  const [sortConfig, setSortConfig] = useState({ column: 'name', direction: 'asc' });

  // Sincroniza buscador global con filtro "search" con debounce
  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: globalSearch }));
    }, 400);
    return () => searchDebounceRef.current && clearTimeout(searchDebounceRef.current);
  }, [globalSearch]);

  // Mapea filtros → params del service
  const serviceParams = useMemo(() => {
    return {
      search: filters.search || '',
      site: filters.siteId || 'all',
      supervisor: filters.supervisorId || 'all',
      status: Array.isArray(filters.status) ? filters.status : [],
      position: 'all',
      hireDateFrom: filters.hireDateFrom || '',
      hireDateTo: filters.hireDateTo || '',
      limit: 1000,
    };
  }, [filters]);

  // Data: empleados (desde service)
  const {
    data: employeesRaw = [],
    isLoading,
    error,
    refetch,
  } = useQuery(enhancedEmployeeService.getEmployees.bind(enhancedEmployeeService), serviceParams, {
    deps: [JSON.stringify(serviceParams)],
    keepPreviousData: true,
    retry: 1,
    onError: (e) =>
      showToast({ title: 'Error al cargar empleados', message: e.message, type: 'error' }),
  });

  // Incluir/ocultar eliminados (el service siempre excluye deleted; si includeDeleted=true, no podemos traerlos directo sin cambiar el service, así que lo dejamos documentado)
  // Si necesitas ver "deleted" realmente, amplía el service para aceptar includeDeleted y quitar el .neq('status','deleted')
  const employees = useMemo(() => {
    if (filters.includeDeleted) {
      // Nota: actualmente el service no trae 'deleted'; este branch queda para cuando habilites la opción en el service.
      return employeesRaw;
    }
    return employeesRaw.filter((e) => e.status !== 'deleted');
  }, [employeesRaw, filters.includeDeleted]);

  // Ordenamiento en memoria
  const sortedEmployees = useMemo(() => {
    const arr = [...employees];
    const { column, direction } = sortConfig || {};
    arr.sort((a, b) => {
      const av = (a?.[column] ?? '').toString().toLowerCase();
      const bv = (b?.[column] ?? '').toString().toLowerCase();
      if (direction === 'asc') return av < bv ? -1 : av > bv ? 1 : 0;
      return av > bv ? -1 : av < bv ? 1 : 0;
    });
    return arr;
  }, [employees, sortConfig]);

  // Selección fila
  const handleEmployeeSelect = (employeeId, selected) => {
    setSelectedEmployees((prev) => (selected ? [...prev, employeeId] : prev.filter((id) => id !== employeeId)));
  };
  const handleSelectAll = (selected) => {
    setSelectedEmployees(selected ? sortedEmployees.map((e) => e.id) : []);
  };

  // Abrir detalle
  const handleEmployeeClick = async (employee) => {
    setSelectedEmployee(employee);
    setIsDetailPanelOpen(true);
    setIsEditingEmployee(false);
  };
  const handleCloseDetailPanel = () => {
    setIsDetailPanelOpen(false);
    setSelectedEmployee(null);
    setIsEditingEmployee(false);
  };

  // Guardar cambios (usa service)
  const handleSaveEmployee = async (updatedEmployee) => {
    try {
      await enhancedEmployeeService.updateEmployee(updatedEmployee.id, {
        name: updatedEmployee?.name,
        phone: updatedEmployee?.phone,
        position: updatedEmployee?.position,
        status: updatedEmployee?.status,
        siteId: updatedEmployee?.siteId,
        supervisorId: updatedEmployee?.supervisorId,
        dailySalary: updatedEmployee?.dailySalary,
        hourlyRate: updatedEmployee?.hourlyRate,
      });
      showToast({ title: 'Empleado actualizado', type: 'success' });
      await refetch();
      setSelectedEmployee(updatedEmployee);
    } catch (e) {
      showToast({ title: 'Error al actualizar', message: e.message, type: 'error' });
    }
  };

  // Crear empleado (deja el modal tal cual: el propio modal puede usar service.createEmployee)
  const handleCreateEmployee = async (newEmployeeData) => {
    try {
      await enhancedEmployeeService.createEmployee(newEmployeeData);
      showToast({ title: 'Empleado creado', type: 'success' });
      await refetch();
      setIsCreationModalOpen(false);
    } catch (e) {
      showToast({ title: 'Error al crear', message: e.message, type: 'error' });
    }
  };

  // Eliminar (soft delete)
  const requestDelete = (employee) => {
    if (!isSuperAdmin()) {
      showToast({ title: 'Permisos insuficientes', message: 'Solo SuperAdmins pueden eliminar', type: 'warning' });
      return;
    }
    setEmployeeToDelete(employee);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!employeeToDelete) return;
    try {
      await enhancedEmployeeService.deleteEmployee(employeeToDelete.id, userProfile?.id);
      showToast({ title: 'Empleado eliminado', message: employeeToDelete?.name, type: 'success' });
      setIsDeleteModalOpen(false);
      setEmployeeToDelete(null);
      setSelectedEmployees((prev) => prev.filter((id) => id !== employeeToDelete.id));
      if (selectedEmployee?.id === employeeToDelete.id) handleCloseDetailPanel();
      await refetch();
    } catch (e) {
      showToast({ title: 'Error al eliminar', message: e.message, type: 'error' });
    }
  };

  // Restaurar (status → active)
  const handleRestoreEmployee = async (employee) => {
    if (!isSuperAdmin()) {
      showToast({ title: 'Permisos insuficientes', message: 'Solo SuperAdmins pueden restaurar', type: 'warning' });
      return;
    }
    try {
      await enhancedEmployeeService.updateEmployee(employee.id, { status: 'active' });
      showToast({ title: 'Empleado restaurado', message: employee?.name, type: 'success' });
      await refetch();
    } catch (e) {
      showToast({ title: 'Error al restaurar', message: e.message, type: 'error' });
    }
  };

  // Acciones masivas
  const handleBulkAction = async (action) => {
    if (!selectedEmployees.length) return;

    if (action === 'delete') {
      if (!isSuperAdmin()) {
        showToast({ title: 'Permisos insuficientes', message: 'Solo SuperAdmins pueden eliminar', type: 'warning' });
        return;
      }
      try {
        // Soft delete en lote
        await enhancedEmployeeService.bulkUpdateEmployees(selectedEmployees, { status: 'deleted' });
        showToast({ title: 'Eliminación masiva completada', message: `${selectedEmployees.length} empleados`, type: 'success' });
        setSelectedEmployees([]);
        await refetch();
      } catch (e) {
        showToast({ title: 'Error en eliminación masiva', message: e.message, type: 'error' });
      }
      return;
    }

    if (action === 'export') {
      handleExportData();
      return;
    }

    // Otros (activar/inactivar)
    if (action === 'activate') {
      try {
        await enhancedEmployeeService.bulkUpdateEmployees(selectedEmployees, { status: 'active' });
        showToast({ title: 'Activados', message: `${selectedEmployees.length} empleados`, type: 'success' });
        setSelectedEmployees([]);
        await refetch();
      } catch (e) {
        showToast({ title: 'Error al activar', message: e.message, type: 'error' });
      }
      return;
    }

    if (action === 'deactivate') {
      try {
        await enhancedEmployeeService.bulkUpdateEmployees(selectedEmployees, { status: 'inactive' });
        showToast({ title: 'Desactivados', message: `${selectedEmployees.length} empleados`, type: 'success' });
        setSelectedEmployees([]);
        await refetch();
      } catch (e) {
        showToast({ title: 'Error al desactivar', message: e.message, type: 'error' });
      }
      return;
    }
  };

  // Navegación a vistas relacionadas
  const handleViewAttendance = (employee) => {
    navigate('/attendance-history-and-analytics-dashboard', { state: { employeeId: employee?.id } });
  };
  const handleViewPayroll = (employee) => {
    navigate('/advanced-payroll-calculation-engine-with-comprehensive-wage-management', { state: { employeeId: employee?.id } });
  };
  const handleViewIncidents = (employee) => {
    navigate('/incident-registration-and-management-system', { state: { employeeId: employee?.id } });
  };

  // Exportación CSV simple
  const handleExportData = () => {
    const dataToExport = selectedEmployees.length
      ? sortedEmployees.filter((emp) => selectedEmployees.includes(emp.id))
      : sortedEmployees;

    if (!dataToExport.length) {
      showToast({ title: 'Sin datos', message: 'No hay empleados para exportar', type: 'info' });
      return;
    }

    const rows = dataToExport.map((emp) => ({
      'ID Empleado': emp?.employeeId || '',
      'Nombre': emp?.name || '',
      'Email': emp?.email || '',
      'Teléfono': emp?.phone || '',
      'Obra': emp?.site || '',
      'Supervisor': emp?.supervisor || '',
      'Puesto': emp?.position || '',
      'Estado': emp?.status || '',
      'Salario Diario': emp?.dailySalary ?? 0,
      'Salario Hora': emp?.hourlyRate ?? 0,
      'Fecha Contratación': emp?.hireDate || ''
    }));
    const header = Object.keys(rows[0]).join(',');
    const body = rows
      .map((r) =>
        Object.values(r)
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(',')
      )
      .join('\n');

    const csv = `${header}\n${body}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `empleados_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    showToast({ title: 'Exportado', message: 'CSV generado', type: 'success' });
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/employee-login-portal');
    } catch (e) {
      navigate('/employee-login-portal');
    }
  };

  // Cargando inicial
  if (isLoading && !employeesRaw.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Cargando empleados...</span>
        </div>
      </div>
    );
  }

  const anyError = error;

  return (
    <div className="min-h-screen bg-background">
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
                <h1 className="text-2xl font-bold text-foreground">Gestión Avanzada de Empleados</h1>
                <p className="text-muted-foreground">Control con eliminación y recuperación (soft delete)</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
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
                  role:
                    userProfile?.role === 'superadmin'
                      ? 'SuperAdmin'
                      : userProfile?.role === 'admin'
                      ? 'Admin'
                      : userProfile?.role?.charAt(0)?.toUpperCase() + userProfile?.role?.slice(1),
                  site: 'Sistema Central',
                }}
                onLogout={handleLogout}
              />
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-6">
          <NavigationHeader showBackButton={false} showHomeButton={false} />

          {/* Estado de error (si aplica) */}
          {anyError && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-red-700">
              {String(anyError)}
              <Button variant="link" className="ml-2" onClick={() => refetch()}>
                Reintentar
              </Button>
            </div>
          )}

          {/* Action Bar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Icon name="Users" size={20} />
                <span className="text-sm">
                  {sortedEmployees.length} empleado{sortedEmployees.length !== 1 ? 's' : ''}{' '}
                  {sortedEmployees.length !== employees.length && ` de ${employees.length} filtrado(s)`}
                </span>
              </div>

              {filters?.includeDeleted && (
                <div className="flex items-center space-x-2 text-amber-600 text-sm bg-amber-50 px-2 py-1 rounded-md">
                  <Icon name="AlertTriangle" size={16} />
                  <span>Incluyendo empleados eliminados*</span>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={handleExportData} iconName="Download" iconSize={16}>
                Exportar
              </Button>
              <Button onClick={() => setIsCreationModalOpen(true)} iconName="Plus" iconSize={16}>
                Nuevo Empleado
              </Button>
            </div>
          </div>

          {/* Bulk Actions */}
          <BulkActionsToolbar
            selectedCount={selectedEmployees.length}
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
                onClearFilters={() =>
                  setFilters({
                    search: '',
                    status: ['active'],
                    siteId: '',
                    supervisorId: '',
                    hireDateFrom: '',
                    hireDateTo: '',
                    includeDeleted: false,
                  })
                }
                showDeletedFilter={isSuperAdmin()}
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
                onDelete={requestDelete}
                onRestore={handleRestoreEmployee}
                userRole={userProfile?.role?.toLowerCase()}
                showDeleteActions={isSuperAdmin()}
                loading={isLoading}
              />
            </div>

            {/* Detail Panel */}
            {isDetailPanelOpen && (
              <div className="xl:col-span-1">
                <EmployeeDetailPanel
                  employee={selectedEmployee}
                  onClose={handleCloseDetailPanel}
                  onSave={handleSaveEmployee}
                  onDelete={requestDelete}
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
        loading={isLoading}
      />
    </div>
  );
};

export default EnhancedEmployeeManagementConsoleWithDeletionControls;
