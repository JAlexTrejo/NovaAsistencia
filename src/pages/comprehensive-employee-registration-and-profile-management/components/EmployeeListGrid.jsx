// comprehensive-employee-registration-and-profile-management/components/EmployeeListGrid.jsx
import React from 'react';
import Button from '../../../components/ui/Button';
import CurrencyDisplay from '../../../components/ui/CurrencyDisplay';
import {
  User,
  Phone,
  Mail,
  Calendar,
  Edit,
  Play,
  Pause,
  Ban,
  RefreshCw,
  Building2,
  UserCheck,
  Crown,
} from 'lucide-react';

export function EmployeeListGrid({
  employees = [],
  onEditEmployee,
  onEmployeeAction,
  loading = false,
}) {
  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { label: 'Activo', className: 'bg-green-100 text-green-800', icon: UserCheck },
      inactive: { label: 'Inactivo', className: 'bg-gray-100 text-gray-800', icon: Pause },
      suspended: { label: 'Suspendido', className: 'bg-yellow-100 text-yellow-800', icon: Ban },
    };

    const config = statusConfig?.[status] || statusConfig?.inactive;
    const StatusIcon = config?.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config?.className}`}>
        <StatusIcon className="h-3 w-3 mr-1" />
        {config?.label}
      </span>
    );
  };

  const getRoleBadge = (role, isAdmin = false) => {
    if (isAdmin) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
          <Crown className="h-3 w-3 mr-1" />
          Admin
        </span>
      );
    }

    const roleConfig = {
      admin: { label: 'Admin', className: 'bg-blue-100 text-blue-800' },
      supervisor: { label: 'Supervisor', className: 'bg-orange-100 text-orange-800' },
      user: { label: 'Usuario', className: 'bg-gray-100 text-gray-800' },
    };

    const config = roleConfig?.[role] || roleConfig?.user;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config?.className}`}>
        {config?.label}
      </span>
    );
  };

  const getPositionLabel = (position) => {
    const positions = {
      albañil: 'Albañil',
      ayudante: 'Ayudante',
      supervisor: 'Supervisor',
      administrativo: 'Administrativo',
      electricista: 'Electricista',
      plomero: 'Plomero',
      pintor: 'Pintor',
      carpintero: 'Carpintero',
      soldador: 'Soldador',
      operador_maquinaria: 'Operador de Maquinaria',
    };

    return positions?.[position] || position || 'No asignado';
  };

  const getSalaryDisplay = (employee) => {
    const salaryType = employee?.salary_type;
    const hourly = Number(employee?.hourly_rate) || 0;
    const daily = Number(employee?.daily_salary) || 0;

    if (salaryType === 'hourly' && hourly > 0) {
      return (
        <div>
          <CurrencyDisplay amount={hourly} />/hr
          <div className="text-xs text-gray-500">
            <CurrencyDisplay amount={hourly * 8} />/día
          </div>
        </div>
      );
    }

    if (salaryType === 'daily' && daily > 0) {
      return (
        <div>
          <CurrencyDisplay amount={daily} />/día
          <div className="text-xs text-gray-500">
            <CurrencyDisplay amount={daily / 8} />/hr
          </div>
        </div>
      );
    }

    return <span className="text-gray-400">No definido</span>;
  };

  const safeDate = (d) => {
    if (!d) return '—';
    try {
      const dt = d instanceof Date ? d : new Date(d);
      if (isNaN(dt.getTime())) return '—';
      return dt.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return '—';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
          <span className="ml-3 text-gray-600">Cargando empleados...</span>
        </div>
      </div>
    );
  }

  if (!employees?.length) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="text-center py-12">
          <User className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay empleados</h3>
          <p className="text-gray-600">No se encontraron empleados que coincidan con los filtros seleccionados.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b">
        <h2 className="text-lg font-semibold text-gray-900">Empleados ({employees?.length})</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
        {employees.map((employee) => {
          const initials =
            (employee?.full_name || '')
              .split(' ')
              .map((n) => n?.[0])
              .slice(0, 2)
              .join('')
              .toUpperCase() || 'E';

          return (
            <div key={employee?.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-lg font-medium text-gray-700">{initials}</span>
                    </div>
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg font-medium text-gray-900 truncate">
                      {employee?.full_name || 'Sin nombre'}
                    </h3>
                    <p className="text-sm text-gray-500">ID: {employee?.employee_id || 'N/A'}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-1 items-end">
                  {getStatusBadge(employee?.status)}
                  {getRoleBadge(employee?.user_profiles?.role, employee?.user_profiles?.is_super_admin)}
                </div>
              </div>

              {/* Employee Details */}
              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <Briefcase className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span>{getPositionLabel(employee?.position)}</span>
                </div>

                {!!employee?.user_profiles?.email && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="truncate">{employee?.user_profiles?.email}</span>
                  </div>
                )}

                {!!employee?.phone && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span>{employee?.phone}</span>
                  </div>
                )}

                {!!employee?.construction_sites && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Building2 className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="truncate">{employee?.construction_sites?.name}</span>
                  </div>
                )}

                {!!employee?.supervisor && (
                  <div className="flex items-center text-sm text-gray-600">
                    <User className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="truncate">Sup: {employee?.supervisor?.full_name}</span>
                  </div>
                )}

                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span>Desde: {safeDate(employee?.hire_date)}</span>
                </div>
              </div>

              {/* Salary Information */}
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Salario:</span>
                  <div className="text-right">{getSalaryDisplay(employee)}</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEditEmployee?.(employee)}
                  className="flex items-center gap-1"
                >
                  <Edit className="h-3 w-3" />
                  Editar
                </Button>

                <div className="flex gap-2">
                  {employee?.status === 'active' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEmployeeAction?.(employee?.id, 'suspend')}
                      className="text-yellow-600 border-yellow-600 hover:bg-yellow-50"
                    >
                      <Pause className="h-3 w-3" />
                    </Button>
                  )}

                  {employee?.status === 'suspended' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEmployeeAction?.(employee?.id, 'activate')}
                      className="text-green-600 border-green-600 hover:bg-green-50"
                    >
                      <Play className="h-3 w-3" />
                    </Button>
                  )}

                  {employee?.status === 'inactive' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEmployeeAction?.(employee?.id, 'activate')}
                      className="text-green-600 border-green-600 hover:bg-green-50"
                    >
                      <UserCheck className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Icono Briefcase inline (evita dependencias extra)
const Briefcase = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6V4a2 2 0 012-2h0a2 2 0 012 2v2m-8 0h12a2 2 0 012 2v7a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2z" />
  </svg>
);

export default EmployeeListGrid;
