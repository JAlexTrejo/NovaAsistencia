import React, { useState, useEffect } from 'react';
import { X, Filter, Calendar, Building } from 'lucide-react';
import { companiesService } from '../../../services/obrasFinancialService';

const FiltersModal = ({ onClose, onApplyFilters, currentFilters }) => {
  const [filters, setFilters] = useState({
    status: currentFilters?.status || 'all',
    company: currentFilters?.company || 'all',
    dateRange: currentFilters?.dateRange || { start: '', end: '' }
  });
  
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load companies for filter options
  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const { data, error } = await companiesService?.getAll();
      
      if (!error && data) {
        setCompanies(data?.filter(c => c?.activo));
      }
    } catch (err) {
      console.error('Error loading companies:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle filter changes
  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  // Handle date range changes
  const handleDateRangeChange = (dateType, value) => {
    setFilters(prev => ({
      ...prev,
      dateRange: {
        ...prev?.dateRange,
        [dateType]: value
      }
    }));
  };

  // Reset all filters
  const handleResetFilters = () => {
    setFilters({
      status: 'all',
      company: 'all',
      dateRange: { start: '', end: '' }
    });
  };

  // Apply filters
  const handleApplyFilters = () => {
    onApplyFilters(filters);
  };

  // Check if filters have been applied
  const hasActiveFilters = () => {
    return (
      filters?.status !== 'all' ||
      filters?.company !== 'all' ||
      filters?.dateRange?.start ||
      filters?.dateRange?.end
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Filter className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Filtros</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estado de la Obra
            </label>
            <select
              value={filters?.status}
              onChange={(e) => handleFilterChange('status', e?.target?.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Todos los estados</option>
              <option value="Planeación">En Planeación</option>
              <option value="En ejecución">En Ejecución</option>
              <option value="En pausa">En Pausa</option>
              <option value="Concluida">Concluidas</option>
              <option value="Cancelada">Canceladas</option>
            </select>
          </div>

          {/* Company Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Empresa/Cliente
            </label>
            {loading ? (
              <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span>Cargando empresas...</span>
                </div>
              </div>
            ) : (
              <select
                value={filters?.company}
                onChange={(e) => handleFilterChange('company', e?.target?.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Todas las empresas</option>
                {companies?.map((company) => (
                  <option key={company?.id} value={company?.id}>
                    {company?.nombre} ({company?.tipo})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Date Range Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>Rango de Fechas de Inicio</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Desde</label>
                <input
                  type="date"
                  value={filters?.dateRange?.start}
                  onChange={(e) => handleDateRangeChange('start', e?.target?.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Hasta</label>
                <input
                  type="date"
                  value={filters?.dateRange?.end}
                  onChange={(e) => handleDateRangeChange('end', e?.target?.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            {filters?.dateRange?.start && filters?.dateRange?.end && (
              <p className="mt-2 text-xs text-gray-600">
                Filtrando obras que iniciaron entre {new Date(filters?.dateRange?.start)?.toLocaleDateString('es-MX')} y {new Date(filters?.dateRange?.end)?.toLocaleDateString('es-MX')}
              </p>
            )}
          </div>

          {/* Active Filters Summary */}
          {hasActiveFilters() && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-900 mb-2">Filtros Activos</h3>
              <div className="space-y-1 text-sm text-blue-800">
                {filters?.status !== 'all' && (
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    <span>Estado: {filters?.status}</span>
                  </div>
                )}
                {filters?.company !== 'all' && (
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    <span>Empresa: {companies?.find(c => c?.id === filters?.company)?.nombre}</span>
                  </div>
                )}
                {(filters?.dateRange?.start || filters?.dateRange?.end) && (
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    <span>
                      Fecha: {filters?.dateRange?.start ? new Date(filters?.dateRange?.start)?.toLocaleDateString('es-MX') : 'Sin inicio'} - {filters?.dateRange?.end ? new Date(filters?.dateRange?.end)?.toLocaleDateString('es-MX') : 'Sin fin'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* No Active Filters Message */}
          {!hasActiveFilters() && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
              <Building className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Sin filtros activos</p>
              <p className="text-xs text-gray-500 mt-1">Se mostrarán todas las obras disponibles</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-between p-6 border-t border-gray-200">
          <button
            type="button"
            onClick={handleResetFilters}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Limpiar Filtros
          </button>
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleApplyFilters}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Aplicar Filtros
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FiltersModal;