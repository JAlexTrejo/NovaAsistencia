import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useBranding } from '../../components/BrandingProvider';
import BrandedHeader from '../../components/ui/BrandedHeader';
import BrandedFooter from '../../components/ui/BrandedFooter';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import NavigationBreadcrumb from '../../components/ui/NavigationBreadcrumb';
import UserContextHeader from '../../components/ui/UserContextHeader';
import NotificationCenter from '../../components/ui/NotificationCenter';
import CurrencyDisplay from '../../components/ui/CurrencyDisplay';
import { EmployeeRegistrationWizard } from './components/EmployeeRegistrationWizard';
import { EmployeeProfileEditor } from './components/EmployeeProfileEditor';
import { EmployeeListGrid } from './components/EmployeeListGrid';
import { supabase } from '../../lib/supabase';
import { Users, UserPlus, Search, Filter, Download, RefreshCw, Building2, UserCheck, AlertTriangle } from 'lucide-react';

export default function ComprehensiveEmployeeRegistrationAndProfileManagement() {
  const { user, userProfile, isAdmin, isSuperAdmin } = useAuth();
  const { branding, formatCurrency } = useBranding();
  const [employees, setEmployees] = useState([]);
  const [constructionSites, setConstructionSites] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  // UI State
  const [showRegistrationWizard, setShowRegistrationWizard] = useState(false);
  const [showProfileEditor, setShowProfileEditor] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid', 'table'

  // Filter and Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    site: '',
    position: '',
    status: 'active',
    role: '',
    supervisor: ''
  });

  // Statistics
  const [statistics, setStatistics] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    totalSites: 0,
    averageSalary: 0
  });

  const breadcrumbItems = [
    { label: 'Gestión', href: '/admin' },
    { label: 'Empleados', href: '/comprehensive-employee-registration-and-profile-management' }
  ];

  useEffect(() => {
    if (isAdmin() || isSuperAdmin()) {
      loadInitialData();
    }
  }, [user]);

  useEffect(() => {
    applyFiltersAndSearch();
  }, [searchTerm, filters]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadEmployees(),
        loadConstructionSites(),
        loadSupervisors(),
        calculateStatistics()
      ]);
    } catch (error) {
      setNotification({
        type: 'error',
        message: `Error al cargar datos: ${error?.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const { data, error } = await supabase?.from('employee_profiles')?.select(`
          *,
          user_profiles:user_id (
            id,
            email,
            full_name,
            role,
            phone
          ),
          construction_sites:site_id (
            id,
            name,
            location
          ),
          supervisor:supervisor_id (
            id,
            full_name,
            email,
            phone
          )
        `)?.neq('status', 'deleted')?.order('created_at', { ascending: false });

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error loading employees:', error);
      setNotification({
        type: 'error',
        message: 'Error al cargar empleados'
      });
    }
  };

  const loadConstructionSites = async () => {
    try {
      const { data, error } = await supabase?.from('construction_sites')?.select('*')?.eq('is_active', true)?.order('name', { ascending: true });

      if (error) throw error;
      setConstructionSites(data || []);
    } catch (error) {
      console.error('Error loading construction sites:', error);
    }
  };

  const loadSupervisors = async () => {
    try {
      const { data, error } = await supabase?.from('user_profiles')?.select('id, full_name, email, phone')?.in('role', ['supervisor', 'admin', 'superadmin'])?.order('full_name', { ascending: true });

      if (error) throw error;
      setSupervisors(data || []);
    } catch (error) {
      console.error('Error loading supervisors:', error);
    }
  };

  const calculateStatistics = async () => {
    try {
      const { data: employeeData, error: employeeError } = await supabase?.from('employee_profiles')?.select('status, hourly_rate, daily_salary, salary_type')?.neq('status', 'deleted');

      if (employeeError) throw employeeError;

      const totalEmployees = employeeData?.length || 0;
      const activeEmployees = employeeData?.filter(emp => emp?.status === 'active')?.length || 0;
      
      // Calculate average salary (convert to hourly rate for consistency)
      let totalHourlyRate = 0;
      let salaryCount = 0;
      
      employeeData?.forEach(emp => {
        if (emp?.salary_type === 'hourly' && emp?.hourly_rate > 0) {
          totalHourlyRate += parseFloat(emp?.hourly_rate);
          salaryCount++;
        } else if (emp?.salary_type === 'daily' && emp?.daily_salary > 0) {
          // Convert daily to hourly (assuming 8 hours per day)
          totalHourlyRate += parseFloat(emp?.daily_salary) / 8;
          salaryCount++;
        }
      });

      const averageSalary = salaryCount > 0 ? totalHourlyRate / salaryCount : 0;

      setStatistics({
        totalEmployees,
        activeEmployees,
        totalSites: constructionSites?.length || 0,
        averageSalary
      });
    } catch (error) {
      console.error('Error calculating statistics:', error);
    }
  };

  const applyFiltersAndSearch = () => {
    let filtered = [...employees];

    // Apply search
    if (searchTerm) {
      const searchLower = searchTerm?.toLowerCase();
      filtered = filtered?.filter(emp => 
        emp?.full_name?.toLowerCase()?.includes(searchLower) ||
        emp?.employee_id?.toLowerCase()?.includes(searchLower) ||
        emp?.user_profiles?.email?.toLowerCase()?.includes(searchLower) ||
        emp?.id_number?.toLowerCase()?.includes(searchLower) ||
        emp?.phone?.toLowerCase()?.includes(searchLower)
      );
    }

    // Apply filters
    if (filters?.site) {
      filtered = filtered?.filter(emp => emp?.site_id === filters?.site);
    }
    if (filters?.position) {
      filtered = filtered?.filter(emp => emp?.position === filters?.position);
    }
    if (filters?.status) {
      filtered = filtered?.filter(emp => emp?.status === filters?.status);
    }
    if (filters?.role) {
      filtered = filtered?.filter(emp => emp?.user_profiles?.role === filters?.role);
    }
    if (filters?.supervisor) {
      filtered = filtered?.filter(emp => emp?.supervisor_id === filters?.supervisor);
    }

    setEmployees(filtered);
  };

  const handleEmployeeRegistration = async (employeeData) => {
    try {
      // Create user profile first if email is provided
      let userId = null;
      if (employeeData?.email) {
        const { data: authData, error: authError } = await supabase?.auth?.signUp({
          email: employeeData?.email,
          password: employeeData?.tempPassword || 'AsistenciaPro2024',
          options: {
            data: {
              full_name: employeeData?.fullName,
              role: employeeData?.role || 'user'
            }
          }
        });

        if (authError && !authError?.message?.includes('already registered')) {
          throw authError;
        }

        userId = authData?.user?.id;
      }

      // Create employee profile
      const employeeProfile = {
        full_name: employeeData?.fullName,
        employee_id: employeeData?.employeeId || `EMP-${Date.now()}`,
        email: employeeData?.email,
        phone: employeeData?.phone,
        address: employeeData?.address,
        birth_date: employeeData?.birthDate,
        hire_date: employeeData?.hireDate || new Date()?.toISOString()?.split('T')?.[0],
        position: employeeData?.position || 'albañil',
        hourly_rate: employeeData?.salaryType === 'hourly' ? parseFloat(employeeData?.hourlyRate || 0) : 0,
        daily_salary: employeeData?.salaryType === 'daily' ? parseFloat(employeeData?.dailySalary || 0) : 0,
        salary_type: employeeData?.salaryType || 'daily',
        site_id: employeeData?.siteId || null,
        supervisor_id: employeeData?.supervisorId || null,
        user_id: userId,
        emergency_contact: employeeData?.emergencyContact,
        id_number: employeeData?.idNumber,
        profile_picture_url: employeeData?.profilePicture || null,
        status: 'active'
      };

      const { data, error } = await supabase?.from('employee_profiles')?.insert([employeeProfile])?.select(`
          *,
          user_profiles:user_id (
            full_name,
            email,
            role
          ),
          construction_sites:site_id (
            name,
            location
          ),
          supervisor:supervisor_id (
            full_name,
            email
          )
        `)?.single();

      if (error) throw error;

      setNotification({
        type: 'success',
        message: 'Empleado registrado exitosamente'
      });

      setShowRegistrationWizard(false);
      await loadEmployees();
      await calculateStatistics();

      return { success: true, employee: data };
    } catch (error) {
      setNotification({
        type: 'error',
        message: `Error al registrar empleado: ${error?.message}`
      });
      return { success: false, error: error?.message };
    }
  };

  const handleEmployeeUpdate = async (employeeId, updateData) => {
    try {
      const { data, error } = await supabase?.from('employee_profiles')?.update({
          full_name: updateData?.fullName,
          phone: updateData?.phone,
          address: updateData?.address,
          birth_date: updateData?.birthDate,
          position: updateData?.position,
          hourly_rate: updateData?.salaryType === 'hourly' ? parseFloat(updateData?.hourlyRate || 0) : 0,
          daily_salary: updateData?.salaryType === 'daily' ? parseFloat(updateData?.dailySalary || 0) : 0,
          salary_type: updateData?.salaryType,
          site_id: updateData?.siteId,
          supervisor_id: updateData?.supervisorId,
          emergency_contact: updateData?.emergencyContact,
          id_number: updateData?.idNumber,
          profile_picture_url: updateData?.profilePicture,
          updated_at: new Date()?.toISOString()
        })?.eq('id', employeeId)?.select()?.single();

      if (error) throw error;

      setNotification({
        type: 'success',
        message: 'Perfil del empleado actualizado exitosamente'
      });

      setShowProfileEditor(false);
      setSelectedEmployee(null);
      await loadEmployees();

      return { success: true, employee: data };
    } catch (error) {
      setNotification({
        type: 'error',
        message: `Error al actualizar empleado: ${error?.message}`
      });
      return { success: false, error: error?.message };
    }
  };

  const handleEmployeeAction = async (employeeId, action) => {
    try {
      let updateData = {};
      let successMessage = '';

      switch (action) {
        case 'activate':
          updateData = { status: 'active' };
          successMessage = 'Empleado activado exitosamente';
          break;
        case 'suspend':
          updateData = { status: 'suspended' };
          successMessage = 'Empleado suspendido exitosamente';
          break;
        case 'deactivate':
          updateData = { status: 'inactive' };
          successMessage = 'Empleado desactivado exitosamente';
          break;
        default:
          return;
      }

      const { error } = await supabase?.from('employee_profiles')?.update(updateData)?.eq('id', employeeId);

      if (error) throw error;

      setNotification({
        type: 'success',
        message: successMessage
      });

      await loadEmployees();
      await calculateStatistics();
    } catch (error) {
      setNotification({
        type: 'error',
        message: `Error al actualizar estado del empleado: ${error?.message}`
      });
    }
  };

  const exportEmployeeData = async () => {
    try {
      const csvData = employees?.map(emp => ({
        'ID Empleado': emp?.employee_id,
        'Nombre Completo': emp?.full_name,
        'Email': emp?.user_profiles?.email || 'N/A',
        'Teléfono': emp?.phone || 'N/A',
        'Puesto': emp?.position,
        'Sitio': emp?.construction_sites?.name || 'Sin asignar',
        'Supervisor': emp?.supervisor?.full_name || 'Sin asignar',
        'Salario por Hora': formatCurrency(emp?.hourly_rate || 0),
        'Salario Diario': formatCurrency(emp?.daily_salary || 0),
        'Estado': emp?.status,
        'Fecha de Contratación': emp?.hire_date
      }));

      const csvContent = [
        Object.keys(csvData?.[0] || {})?.join(','),
        ...csvData?.map(row => Object.values(row)?.map(val => `"${val}"`)?.join(','))
      ]?.join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL?.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `empleados_${new Date()?.toISOString()?.split('T')?.[0]}.csv`;
      link?.click();
      
      setNotification({
        type: 'success',
        message: 'Datos exportados exitosamente'
      });
    } catch (error) {
      setNotification({
        type: 'error',
        message: 'Error al exportar datos'
      });
    }
  };

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
                onClick={loadInitialData}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
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
                  onChange={(e) => setFilters({...filters, site: e?.target?.value})}
                  options={[
                    { value: '', label: 'Todos los sitios' },
                    ...constructionSites?.map(site => ({
                      value: site?.id,
                      label: site?.name
                    }))
                  ]}
                  className="w-48"
                />
                <Select
                  value={filters?.position}
                  onChange={(e) => setFilters({...filters, position: e?.target?.value})}
                  options={[
                    { value: '', label: 'Todos los puestos' },
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
                  onChange={(e) => setFilters({...filters, status: e?.target?.value})}
                  options={[
                    { value: '', label: 'Todos los estados' },
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
      {/* Employee Registration Wizard Modal */}
      {showRegistrationWizard && (
        <EmployeeRegistrationWizard
          constructionSites={constructionSites}
          supervisors={supervisors}
          onSubmit={handleEmployeeRegistration}
          onClose={() => setShowRegistrationWizard(false)}
          branding={branding}
        />
      )}
      {/* Employee Profile Editor Modal */}
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
      {/* Notification */}
      <NotificationCenter
        notification={notification}
        onClose={() => setNotification(null)}
      />
      <BrandedFooter />
    </div>
  );
}