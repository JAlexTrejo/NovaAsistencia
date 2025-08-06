import React from 'react';
import { Calendar, Filter, RotateCcw } from 'lucide-react';

export default function FilterPanel({ filters, onFilterChange }) {
  const handleFilterChange = (key, value) => {
    onFilterChange?.({
      ...filters,
      [key]: value
    });
  };

  const resetFilters = () => {
    onFilterChange?.({
      dateRange: 'today',
      module: 'all',
      action: 'all',
      role: 'all',
      severity: 'all'
    });
  };

  const hasActiveFilters = Object.values(filters || {})?.some(value => 
    value !== 'all' && value !== 'today'
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <Filter className="h-5 w-5 mr-2" />
          Filtros Avanzados
        </h3>
        
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            Limpiar filtros
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Date Range Filter */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 flex items-center">
            <Calendar className="h-4 w-4 mr-1" />
            Rango de Fecha
          </label>
          <select
            value={filters?.dateRange || 'today'}
            onChange={(e) => handleFilterChange('dateRange', e?.target?.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            <option value="today">Hoy</option>
            <option value="week">Última semana</option>
            <option value="month">Último mes</option>
            <option value="all">Todo el tiempo</option>
          </select>
        </div>

        {/* Module Filter */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Módulo
          </label>
          <select
            value={filters?.module || 'all'}
            onChange={(e) => handleFilterChange('module', e?.target?.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            <option value="all">Todos los módulos</option>
            <option value="Authentication">Autenticación</option>
            <option value="Profile">Perfil</option>
            <option value="Attendance">Asistencia</option>
            <option value="Configuration">Configuración</option>
            <option value="Reports">Reportes</option>
            <option value="Security">Seguridad</option>
            <option value="Administration">Administración</option>
          </select>
        </div>

        {/* Action Filter */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Acción
          </label>
          <select
            value={filters?.action || 'all'}
            onChange={(e) => handleFilterChange('action', e?.target?.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            <option value="all">Todas las acciones</option>
            <option value="login">Inicio de sesión</option>
            <option value="logout">Cierre de sesión</option>
            <option value="check_in">Check-in</option>
            <option value="check_out">Check-out</option>
            <option value="profile_update">Actualización de perfil</option>
            <option value="config_change">Cambio de configuración</option>
            <option value="failed_login">Login fallido</option>
            <option value="unauthorized_access">Acceso no autorizado</option>
          </select>
        </div>

        {/* Role Filter */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Rol de Usuario
          </label>
          <select
            value={filters?.role || 'all'}
            onChange={(e) => handleFilterChange('role', e?.target?.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            <option value="all">Todos los roles</option>
            <option value="user">Usuario</option>
            <option value="supervisor">Supervisor</option>
            <option value="admin">Administrador</option>
            <option value="superadmin">Super Administrador</option>
          </select>
        </div>

        {/* Severity Filter */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Severidad
          </label>
          <select
            value={filters?.severity || 'all'}
            onChange={(e) => handleFilterChange('severity', e?.target?.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            <option value="all">Todas las severidades</option>
            <option value="critical">Crítica</option>
            <option value="high">Alta</option>
            <option value="medium">Media</option>
            <option value="low">Baja</option>
            <option value="info">Información</option>
          </select>
        </div>
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center space-x-2 text-sm text-blue-800">
            <span className="font-medium">Filtros activos:</span>
            {filters?.dateRange !== 'today' && filters?.dateRange !== 'all' && (
              <span className="bg-blue-100 px-2 py-1 rounded text-xs">
                Fecha: {filters?.dateRange === 'week' ? 'Última semana' : 'Último mes'}
              </span>
            )}
            {filters?.module !== 'all' && (
              <span className="bg-blue-100 px-2 py-1 rounded text-xs">
                Módulo: {filters?.module}
              </span>
            )}
            {filters?.action !== 'all' && (
              <span className="bg-blue-100 px-2 py-1 rounded text-xs">
                Acción: {filters?.action?.replace(/_/g, ' ')}
              </span>
            )}
            {filters?.role !== 'all' && (
              <span className="bg-blue-100 px-2 py-1 rounded text-xs">
                Rol: {filters?.role}
              </span>
            )}
            {filters?.severity !== 'all' && (
              <span className="bg-blue-100 px-2 py-1 rounded text-xs">
                Severidad: {filters?.severity}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}