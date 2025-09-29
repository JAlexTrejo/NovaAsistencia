import React, { useEffect, useMemo, useState } from 'react';
import { Users, UserPlus, Search, Download, RefreshCw, Building2, UserCheck, AlertTriangle } from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { useBranding } from '@/components/BrandingProvider';

import BrandedHeader from '@/components/ui/BrandedHeader';
import BrandedFooter from '@/components/ui/BrandedFooter';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import NavigationBreadcrumb from '@/components/ui/NavigationBreadcrumb';
import UserContextHeader from '@/components/ui/UserContextHeader';
import NotificationCenter from '@/components/ui/NotificationCenter';
import CurrencyDisplay from '@/components/ui/CurrencyDisplay';
import Loading from '../../components/ui/Loading';
import ErrorState from '../../components/ui/ErrorState';
import { showToast } from '../../components/ui/ToastHub';

import { EmployeeRegistrationWizard } from './components/EmployeeRegistrationWizard';
import { EmployeeProfileEditor } from './components/EmployeeProfileEditor';
import { EmployeeListGrid } from './components/EmployeeListGrid';

import { supabase } from '@/lib/supabase';
import enhancedEmployeeService from '@/services/enhancedEmployeeService';
import { useQuery } from '../../hooks/useQuery';

export default function ComprehensiveEmployeeRegistrationAndProfileManagement() {
  const { isAdmin, isSuperAdmin } = useAuth();
  const { branding, formatCurrency } = useBranding();

  // UI State
  const [showRegistrationWizard, setShowRegistrationWizard] = useState(false);
  const [showProfileEditor, setShowProfileEditor] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  // Filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    site: 'all',
    position: 'all',
    status: 'active',
    role: 'all',
    supervisor: 'all'
  });

  const breadcrumbItems = useMemo(() => ([
    { label: 'Gestión', href: '/admin' },
    { label: 'Empleados', href: '/comprehensive-employee-registration-and-profile-management' }
  ]), []);

  // ------------ QUERIES ------------
  // Empleados
  const {
    data: employeesData,
    isLoading: employeesLoading,
    error: employeesError,
    refetch: refetchEmployees
  } = useQuery(
    enhancedEmployeeService.getEmployees.bind(enhancedEmployeeService),
    {
      params: {
        search: searchTerm || undefined,
        site: filters.site,
        position: filters.position,
        status: filters.status === 'all' ? [] : [filters.status],
        supervisor: filters.supervisor
      },
      deps: [searchTerm, JSON.stringify(filters)],
      retry: 1,
      keepPreviousData: true,
      onError: (e) => showToast({ title: 'Error al cargar empleados', message: e.message, type: 'error' })
    }
  );

  // Sitios
  const {
    data: sitesData,
    isLoading: sitesLoading,
    error: sitesError,
    refetch: refetchSites
  } = useQuery(
    enhancedEmployeeService.getSites.bind(enhancedEmployeeService),
    {
      deps: [],
      retry: 1,
      keepPreviousData: true,
      onError: (e) => showToast({ title: 'Error al cargar sitios', message: e.message, type: 'error' })
    }
  );

  // Supervisores
  const {
    data: supervisorsData,
    isLoading: supervisorsLoading,
    error: supervisorsError,
    refetch: refetchSupervisors
  } = useQuery(
    enhancedEmployeeService.getSupervisors.bind(enhancedEmployeeService),
    {
      deps: [],
      retry: 1,
      keepPreviousData: true,
      onError: (e) => showToast({ title: 'Error al cargar supervisores', message: e.message, type: 'error' })
    }
  );

  // Estadísticas
  const {
    data: statsData,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats
  } = useQuery(
    enhancedEmployeeService.getEmployeeStats.bind(enhancedEmployeeService),
    {
      deps: [],
      retry: 1,
      keepPreviousData: true,
      onError: (e) => showToast({ title: 'Error al calcular estadísticas', message: e.message, type: 'error' })
    }
  );

  const loading = employeesLoading || sitesLoading || supervisorsLoading || statsLoading;
  const anyError = employeesError || sitesError || supervisorsError || statsError;

  // Derivados
  const employees = employeesData ?? [];
  const constructionSites = sitesData ?? [];
  const supervisors = supervisorsData ?? [];

  const statistics = useMemo(() => ({
    totalEmployees: statsData?.total ?? 0,
    activeEmployees: statsData?.active ?? 0,
    totalSites: constructionSites?.length ?? 0,
    averageSalary: (() => {
      if (!employees?.length) return 0;
      let total = 0;
      let count = 0;
      employees.forEach(emp => {
        if (emp?.salaryType === 'hourly' && emp?.hourlyRate > 0) {
          total += Number(emp?.hourlyRate);
          count++;
        } else if (emp?.salaryType === 'daily' && emp?.dailySalary > 0) {
          total += Number(emp?.dailySalary) / 8;
          count++;
        }
      });
      return count ? total / count : 0;
    })()
  }), [statsData, constructionSites, employees]);

  // Re-fetch agrupado
  const refreshAll = async () => {
    await Promise.all([refetchEmployees(), refetchSites(), refetchSupervisors(), refetchStats()]);
  };

  // ------------ ACCIONES ------------
  const handleEmployeeRegistration = async (employeeData) => {
    try {
      // 1) Crear usuario (opcional)
      let userId = null;
      if (employeeData?.email) {
        const { data: authData, error: authError } = await supabase?.auth?.signUp({
          email: employeeData?.email,
          password: employeeData?.tempPassword || 'AsistenciaPro2024',
          options: { data: { full_name: employeeData?.fullName, role: employeeData?.role || 'user' } }
        });
        if (authError && !authError?.message?.includes('already registered')) throw authError;
        userId = authData?.user?.id ?? null;
      }

      // 2) Crear perfil
      const payload = {
        userId,
        name: employeeData?.fullName,
        employeeId: employeeData?.employeeId || `EMP-${Date.now()}`,
        phone: employeeData?.phone,
        address: employeeData?.address,
        birthDate: employeeData?.birthDate,
        hireDate: employeeData?.hireDate || new Date().toISOString().split('T')[0],
        position: employeeData?.position || 'albañil',
        salaryType: employeeData?.salaryType || 'daily',
        hourlyRate: employeeData?.salaryType === 'hourly' ? Number(employeeData?.hourlyRate || 0) : 0,
        dailySalary: employeeData?.salaryType === 'daily' ? Number(employeeData?.dailySalary || 0) : 0,
        siteId: employeeData?.siteId || null,
        supervisorId: employeeData?.supervisorId || null,
        emergencyContact: employeeData?.emergencyContact,
        idNumber: employeeData?.idNumber,
        avatar: employeeData?.profilePicture || null
      };

      await enhancedEmployeeService.createEmployee(payload);

      showToast({ title: 'Listo', message: 'Empleado registrado exitosamente', type: 'success' });
      setShowRegistrationWizard(false);
      await Promise.all([refetchEmployees(), refetchStats()]);
      return { success: true };
    } catch (error) {
      showToast({ title: 'Error al registrar', message: error?.message, type: 'error' });
      return { success: false, error: error?.message };
    }
  };

  const handleEmployeeUpdate = async (employeeId, updateData) => {
    try {
      const payload = {
        name: updateData?.fullName,
        phone: updateData?.phone,
        address: updateData?.address,
        birthDate: updateData?.birthDate,
        position: updateData?.position,
        salaryType: updateData?.salaryType,
        hourlyRate: updateData?.salaryType === 'hourly' ? Number(updateData?.hourlyRate || 0) : 0,
        dailySalary: updateData?.salaryType === 'daily' ? Number(updateData?.dailySalary || 0) : 0,
        siteId: updateData?.siteId,
        supervisorId: updateData?.supervisorId,
        emergencyContact: updateData?.emergencyContact,
        idNumber: updateData?.idNumber,
        avatar: updateData?.profilePicture
      };

      await enhancedEmployeeService.updateEmployee(employeeId, payload);

      showToast({ title: 'Actualizado', message: 'Perfil del empleado actualizado', type: 'success' });
      setShowProfileEditor(false);
      setSelectedEmployee(null);
      await refetchEmployees();
      return { success: true };
    } catch (error) {
      showToast({ title: 'Error al actualizar', message: error?.message, type: 'error' });
      return { success: false, error: error?.message };
    }
  };

  const handleEmployeeAction = async (employeeId, action) => {
    try {
      let status = null;
      if (action === 'activate') status = 'active';
      if (action === 'suspend') status = 'suspended';
      if (action === 'deactivate') status = 'inactive';
      if (!status) return;

      await enhancedEmployeeService.updateEmployee(employeeId, { status });
      showToast({ title: 'Hecho', message: 'Estado actualizado', type: 'success' });
      await Promise.all([refetchEmployees(), refetchStats()]);
    } catch (error) {
      showToast({ title: 'Error', message: error?.message, type: 'error' });
    }
  };

  const exportEmployeeData = async () => {
    try {
      if (!employees?.length) return;
      const csvRows = employees.map(emp => ({
        'ID Empleado': emp?.employeeId || '',
        'Nombre Completo': emp?.name || '',
        'Email': emp?.email || 'N/A',
        'Teléfono': emp?.phone || 'N/A',
        'Puesto': emp?.position || '',
        'Sitio': emp?.site || 'Sin asignar',
        'Supervisor': emp?.supervisor || 'Sin asignar',
        'Salario por Hora': formatCurrency(emp?.hourlyRate || 0),
        'Salario Diario': formatCurrency(emp?.dailySalary || 0),
        'Estado': emp?.status || '',
        'Fecha de Contratación': emp?.hireDate || ''
      }));

      const header = Object.keys(csvRows[0] || {}).join(',');
      const body = csvRows
        .map(r =>
          Object.values(r)
            .map(v => `"${String(v).replace(/"/g, '""')}"`)
            .join(',')
        )
        .join('\n');
      const csvContent = `${header}\n${body}`;

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `empleados_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      showToast({ title: 'Listo', message: 'Datos exportados', type: 'success' });
    } catch (_) {
      showToast({ title: 'Error', message: 'No se pudo exportar', type: 'error' });
    }
  };

  // ------------ GUARD DE ACCESO ------------
  if (!isAdmin() && !isSuperAdmin()) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h1>
          <p className="text-gray-600">No tienes permisos para acceder a esta sección.</p>
        </div>
      </div>
    );
  }

  // ------------ LOADING / ERROR ------------
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading label="Cargando empleados y catálogos…" />
      </div>
    );
  }

  if (anyError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <ErrorState message="No se pudieron cargar los datos." onRetry={refreshAll} />
      </div>
    );
  }

  // ------------ RENDER ------------
  return (
    <div className="min-h-screen bg-gray-50">
      <BrandedHeader />
      <UserContextHeader />
      <NavigationBreadcrumb items={breadcrumbItems} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Users className="h-8 w-8" style={{ color: branding?.color_primario }} />
                Gestión Integral de Empleados
              </h1>
              <p className="text-gray-600 mt-2">
                Registro, edición y administración completa de perfiles de empleados
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowRegistrationWizard(true)}
                className="flex items-center gap-2"
                style={{ backgroundColor: branding?.color_primario }}
              >
                <UserPlus className="h-4 w-4" />
                Registrar Empleado
              </Button>

              <Button
                variant="outline"
                onClick={exportEmployeeData}
                className="flex items-center gap-2"
                disabled={employees?.length === 0}
              >
                <Download className="h-4 w-4" />
                Exportar
              </Button>

              <Button
                variant="outline"
                onClick={refreshAll}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Actualizar
              </Button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Empleados</p>
                <p className="text-2xl font-bold text-gray-900">{statistics?.totalEmployees}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Empleados registrados en el sistema</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Empleados Activos</p>
                <p className="text-2xl font-bold text-gray-900">{statistics?.activeEmployees}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <UserCheck className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Con estado activo</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Sitios de Construcción</p>
                <p className="text-2xl font-bold text-gray-900">{statistics?.totalSites}</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <Building2 className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Obras activas</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Salario Promedio</p>
                <p className="text-2xl font-bold text-gray-900">
                  <CurrencyDisplay amount={statistics?.averageSalary} />
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <div className="h-6 w-6 text-purple-600 flex items-center justify-center text-sm font-bold">
                  {branding?.simbolo_moneda}
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Por hora promedio</p>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Buscar por nombre, ID, correo o teléfono..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e?.target?.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="flex gap-3 flex-wrap">
                <Select
                  value={filters?.site}
                  onChange={(e) => setFilters((f) => ({ ...f, site: e?.target?.value }))}
                  options={[
                    { value: 'all', label: 'Todos los sitios' },
                    ...constructionSites?.map(site => ({ value: site?.id, label: site?.name }))
                  ]}
                  className="w-48"
                />

                <Select
                  value={filters?.position}
                  onChange={(e) => setFilters((f) => ({ ...f, position: e?.target?.value }))}
                  options={[
                    { value: 'all', label: 'Todos los puestos' },
                    { value: 'albañil', label: 'Albañil' },
                    { value: 'ayudante', label: 'Ayudante' },
                    { value: 'supervisor', label: 'Supervisor' },
                    { value: 'administrativo', label: 'Administrativo' },
                    { value: 'electricista', label: 'Electricista' },
                    { value: 'plomero', label: 'Plomero' },
                    { value: 'pintor', label: 'Pintor' },
                    { value: 'carpintero', label: 'Carpintero' },
                    { value: 'soldador', label: 'Soldador' },
                    { value: 'operador_maquinaria', label: 'Operador de Maquinaria' }
                  ]}
                  className="w-48"
                />

                <Select
                  value={filters?.status}
                  onChange={(e) => setFilters((f) => ({ ...f, status: e?.target?.value }))}
                  options={[
                    { value: 'all', label: 'Todos los estados' },
                    { value: 'active', label: 'Activo' },
                    { value: 'inactive', label: 'Inactivo' },
                    { value: 'suspended', label: 'Suspendido' }
                  ]}
                  className="w-48"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Employee List Grid */}
        <EmployeeListGrid
          employees={employees}
          constructionSites={constructionSites}
          supervisors={supervisors}
          onEditEmployee={(employee) => {
            setSelectedEmployee(employee);
            setShowProfileEditor(true);
          }}
          onEmployeeAction={handleEmployeeAction}
          loading={loading}
          formatCurrency={formatCurrency}
        />
      </main>

      {/* Modales */}
      {showRegistrationWizard && (
        <EmployeeRegistrationWizard
          constructionSites={constructionSites}
          supervisors={supervisors}
          onSubmit={handleEmployeeRegistration}
          onClose={() => setShowRegistrationWizard(false)}
          branding={branding}
        />
      )}

      {showProfileEditor && selectedEmployee && (
        <EmployeeProfileEditor
          employee={selectedEmployee}
          constructionSites={constructionSites}
          supervisors={supervisors}
          onSubmit={(updateData) => handleEmployeeUpdate(selectedEmployee?.id, updateData)}
          onClose={() => {
            setShowProfileEditor(false);
            setSelectedEmployee(null);
          }}
          branding={branding}
        />
      )}

      {/* Notificaciones globales */}
      <NotificationCenter />

      <BrandedFooter />
    </div>
  );
}
