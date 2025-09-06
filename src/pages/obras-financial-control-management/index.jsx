import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Building, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Eye,
  Plus,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  Pause,
  X,
  Download,
  Filter,
  Search
} from 'lucide-react';
import { obrasService, financialAnalyticsService } from '../../services/obrasFinancialService';
import ObraCreationModal from './components/ObraCreationModal';
import ObraDetailModal from './components/ObraDetailModal';
import ExportModal from './components/ExportModal';
import FiltersModal from './components/FiltersModal';

const ObrasFinancialControlManagement = () => {
  const { isAdmin, isSuperAdmin, loading } = useAuth();
  const [obras, setObras] = useState([]);
  const [filteredObras, setFilteredObras] = useState([]);
  const [overallKPIs, setOverallKPIs] = useState(null);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState('');
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [selectedObra, setSelectedObra] = useState(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [dateRangeFilter, setDateRangeFilter] = useState({ start: '', end: '' });

  // Check permissions
  useEffect(() => {
    if (loading) return;
    
    if (!isAdmin() && !isSuperAdmin()) {
      setError('No tienes permisos para acceder a la gestión financiera de obras.');
      return;
    }
    
    loadData();
  }, [loading, isAdmin, isSuperAdmin]);

  // Load obras and KPIs data
  const loadData = async () => {
    try {
      setLoadingData(true);
      setError('');

      const [obrasResult, kpisResult] = await Promise.all([
        obrasService?.getAll(),
        financialAnalyticsService?.getOverallKPIs()
      ]);

      if (obrasResult?.error) {
        setError(`Error al cargar obras: ${obrasResult?.error}`);
        return;
      }

      if (kpisResult?.error) {
        setError(`Error al cargar KPIs: ${kpisResult?.error}`);
        return;
      }

      setObras(obrasResult?.data || []);
      setFilteredObras(obrasResult?.data || []);
      setOverallKPIs(kpisResult?.data);
    } catch (err) {
      setError('Error al cargar los datos de obras');
      console.error('Error loading obras data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  // Apply filters
  useEffect(() => {
    let filtered = obras;

    // Search filter
    if (searchTerm) {
      filtered = filtered?.filter(obra => 
        obra?.nombre?.toLowerCase()?.includes(searchTerm?.toLowerCase()) ||
        obra?.clave?.toLowerCase()?.includes(searchTerm?.toLowerCase()) ||
        obra?.empresa_nombre?.toLowerCase()?.includes(searchTerm?.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered?.filter(obra => obra?.estatus === statusFilter);
    }

    // Company filter
    if (companyFilter !== 'all') {
      filtered = filtered?.filter(obra => obra?.empresa_id === companyFilter);
    }

    // Date range filter
    if (dateRangeFilter?.start && dateRangeFilter?.end) {
      filtered = filtered?.filter(obra => {
        const obraDate = new Date(obra?.fecha_inicio);
        const startDate = new Date(dateRangeFilter?.start);
        const endDate = new Date(dateRangeFilter?.end);
        return obraDate >= startDate && obraDate <= endDate;
      });
    }

    setFilteredObras(filtered);
  }, [obras, searchTerm, statusFilter, companyFilter, dateRangeFilter]);

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '$0.00';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2
    })?.format(amount);
  };

  // Format percentage
  const formatPercentage = (value) => {
    if (!value && value !== 0) return '0%';
    return `${value?.toFixed(1)}%`;
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'En ejecución':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'Planeación':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'En pausa':
        return <Pause className="h-4 w-4 text-yellow-500" />;
      case 'Concluida':
        return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case 'Cancelada':
        return <X className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  // Get status color class
  const getStatusColorClass = (status) => {
    switch (status) {
      case 'En ejecución':
        return 'bg-green-100 text-green-800';
      case 'Planeación':
        return 'bg-blue-100 text-blue-800';
      case 'En pausa':
        return 'bg-yellow-100 text-yellow-800';
      case 'Concluida':
        return 'bg-emerald-100 text-emerald-800';
      case 'Cancelada':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Handle obra detail view
  const handleViewObra = (obra) => {
    setSelectedObra(obra);
    setShowDetailModal(true);
  };

  // Handle successful obra creation
  const handleObraCreated = () => {
    setShowCreateModal(false);
    loadData(); // Reload data
  };

  // Handle successful obra update
  const handleObraUpdated = () => {
    setShowDetailModal(false);
    loadData(); // Reload data
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error && !isAdmin() && !isSuperAdmin()) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Acceso Denegado</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Control Financiero de Obras</h1>
                <p className="mt-2 text-gray-600">Gestión integral de presupuestos, facturas, pagos y KPIs</p>
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowFiltersModal(true)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md flex items-center space-x-2 transition-colors"
                >
                  <Filter className="h-4 w-4" />
                  <span>Filtros</span>
                </button>
                <button
                  onClick={() => setShowExportModal(true)}
                  className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 rounded-md flex items-center space-x-2 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  <span>Exportar</span>
                </button>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center space-x-2 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>Nueva Obra</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overall KPIs */}
        {overallKPIs && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Building className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Obras</p>
                  <p className="text-2xl font-semibold text-gray-900">{overallKPIs?.obras_total || 0}</p>
                  <p className="text-sm text-green-600">{overallKPIs?.obras_activas || 0} activas</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Presupuesto Total</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {formatCurrency(overallKPIs?.total_presupuesto)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-8 w-8 text-emerald-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Facturado</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {formatCurrency(overallKPIs?.total_facturado)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingDown className="h-8 w-8 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Por Cobrar</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {formatCurrency(overallKPIs?.total_por_cobrar)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar obras por nombre, clave o empresa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e?.target?.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Loading State */}
        {loadingData && (
          <div className="bg-white rounded-lg shadow p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-4"></div>
              <span className="text-gray-600">Cargando obras...</span>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        {/* Obras Table */}
        {!loadingData && !error && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Obra
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Presupuesto Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Facturado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Por Cobrar
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Gastos
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      % Utilidad Real
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avance Financiero
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredObras?.length > 0 ? (
                    filteredObras?.map((obra) => (
                      <tr key={obra?.obra_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {obra?.nombre}
                            </div>
                            <div className="text-sm text-gray-500">
                              {obra?.clave} • {obra?.empresa_nombre}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(obra?.estatus)}
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColorClass(obra?.estatus)}`}>
                              {obra?.estatus}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(obra?.presupuesto_total)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(obra?.facturado_total)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={obra?.por_cobrar > 0 ? 'text-orange-600 font-medium' : 'text-gray-900'}>
                            {formatCurrency(obra?.por_cobrar)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(obra?.gastos_total)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={obra?.utilidad_pct_real >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                            {formatPercentage(obra?.utilidad_pct_real)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center space-x-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${Math.min(obra?.avance_financiero_pct || 0, 100)}%` }}
                              ></div>
                            </div>
                            <span className="text-xs font-medium">
                              {formatPercentage(obra?.avance_financiero_pct)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleViewObra(obra)}
                            className="text-blue-600 hover:text-blue-900 flex items-center space-x-1"
                          >
                            <Eye className="h-4 w-4" />
                            <span>Ver Detalles</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="9" className="px-6 py-12 text-center text-sm text-gray-500">
                        {searchTerm || statusFilter !== 'all' || companyFilter !== 'all' ? (
                          <div>
                            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                            <p>No se encontraron obras con los filtros aplicados</p>
                          </div>
                        ) : (
                          <div>
                            <Building className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                            <p>No hay obras registradas</p>
                            <button
                              onClick={() => setShowCreateModal(true)}
                              className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
                            >
                              Crear primera obra
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      {/* Modals */}
      {showCreateModal && (
        <ObraCreationModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleObraCreated}
        />
      )}
      {showDetailModal && selectedObra && (
        <ObraDetailModal
          obra={selectedObra}
          onClose={() => setShowDetailModal(false)}
          onSuccess={handleObraUpdated}
        />
      )}
      {showExportModal && (
        <ExportModal
          obras={filteredObras}
          onClose={() => setShowExportModal(false)}
        />
      )}
      {showFiltersModal && (
        <FiltersModal
          onClose={() => setShowFiltersModal(false)}
          onApplyFilters={(filters) => {
            setStatusFilter(filters?.status || 'all');
            setCompanyFilter(filters?.company || 'all');
            setDateRangeFilter(filters?.dateRange || { start: '', end: '' });
            setShowFiltersModal(false);
          }}
          currentFilters={{
            status: statusFilter,
            company: companyFilter,
            dateRange: dateRangeFilter
          }}
        />
      )}
    </div>
  );
};

export default ObrasFinancialControlManagement;