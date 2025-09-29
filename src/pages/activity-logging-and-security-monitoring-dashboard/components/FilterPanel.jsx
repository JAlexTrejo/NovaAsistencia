import React, { useMemo } from 'react';
import { Calendar, Filter, RotateCcw } from 'lucide-react';

export default function FilterPanel({
  filters,
  onFilterChange,
  // nuevas props para evitar mocks:
  moduleOptions = [],       // [{value:'Authentication', label:'Autenticación'}, ...]
  actionOptions = [],       // [{value:'login', label:'Inicio de sesión'}, ...]
  roleOptions = [],         // [{value:'user', label:'Usuario'}, ...]
  severityOptions = []      // [{value:'critical', label:'Crítica'}, ...]
}) {
  const handle = (key, value) => onFilterChange?.({ ...filters, [key]: value });

  const reset = () => onFilterChange?.({
    dateRange: 'today',
    startDate: '',
    endDate: '',
    module: 'all',
    action: 'all',
    role: 'all',
    severity: 'all'
  });

  const hasActiveFilters = useMemo(() =>
    Object.entries(filters || {}).some(([k, v]) =>
      !['all', 'today', '', null, undefined].includes(v) && !['startDate','endDate'].includes(k)
    ) || !!(filters?.startDate || filters?.endDate)
  , [filters]);

  const showCustomDates = filters?.dateRange === 'custom';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <Filter className="h-5 w-5 mr-2" />
          Filtros Avanzados
        </h3>

        {hasActiveFilters && (
          <button onClick={reset} className="text-sm text-blue-600 hover:text-blue-800 flex items-center">
            <RotateCcw className="h-4 w-4 mr-1" />
            Limpiar filtros
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Date Range */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 flex items-center">
            <Calendar className="h-4 w-4 mr-1" />
            Rango de Fecha
          </label>
          <select
            value={filters?.dateRange || 'today'}
            onChange={(e) => handle('dateRange', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            <option value="today">Hoy</option>
            <option value="week">Última semana</option>
            <option value="month">Último mes</option>
            <option value="all">Todo el tiempo</option>
            <option value="custom">Personalizado</option>
          </select>

          {showCustomDates && (
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={filters?.startDate || ''}
                onChange={(e) => handle('startDate', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              <input
                type="date"
                value={filters?.endDate || ''}
                onChange={(e) => handle('endDate', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
          )}
        </div>

        {/* Module */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Módulo</label>
          <select
            value={filters?.module || 'all'}
            onChange={(e) => handle('module', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            <option value="all">Todos los módulos</option>
            {moduleOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Action */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Acción</label>
          <select
            value={filters?.action || 'all'}
            onChange={(e) => handle('action', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            <option value="all">Todas las acciones</option>
            {actionOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Role */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Rol de Usuario</label>
          <select
            value={filters?.role || 'all'}
            onChange={(e) => handle('role', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            <option value="all">Todos los roles</option>
            {roleOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Severity */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Severidad</label>
          <select
            value={filters?.severity || 'all'}
            onChange={(e) => handle('severity', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            <option value="all">Todas las severidades</option>
            {severityOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Active filters summary */}
      {hasActiveFilters && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center flex-wrap gap-2 text-sm text-blue-800">
            <span className="font-medium mr-1">Filtros activos:</span>
            {filters?.dateRange && filters?.dateRange !== 'today' && (
              <span className="bg-blue-100 px-2 py-1 rounded text-xs">
                Fecha: {filters?.dateRange === 'custom'
                  ? `${filters?.startDate || '—'} → ${filters?.endDate || '—'}`
                  : filters?.dateRange === 'week' ? 'Última semana'
                  : filters?.dateRange === 'month' ? 'Último mes' : 'Todo el tiempo'}
              </span>
            )}
            {filters?.module !== 'all' && <span className="bg-blue-100 px-2 py-1 rounded text-xs">Módulo: {filters?.module}</span>}
            {filters?.action !== 'all' && <span className="bg-blue-100 px-2 py-1 rounded text-xs">Acción: {String(filters?.action).replace(/_/g,' ')}</span>}
            {filters?.role !== 'all' && <span className="bg-blue-100 px-2 py-1 rounded text-xs">Rol: {filters?.role}</span>}
            {filters?.severity !== 'all' && <span className="bg-blue-100 px-2 py-1 rounded text-xs">Severidad: {filters?.severity}</span>}
          </div>
        </div>
      )}
    </div>
  );
}
