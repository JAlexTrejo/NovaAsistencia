import React, { useState, useEffect } from 'react';
import { X, Building, DollarSign, AlertTriangle } from 'lucide-react';
import { obrasService, companiesService, dependenciesService } from '../../../services/obrasFinancialService';

const ObraCreationModal = ({ onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [companies, setCompanies] = useState([]);
  const [dependencies, setDependencies] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  const [formData, setFormData] = useState({
    clave: '',
    nombre: '',
    estatus: 'Planeación',
    empresa_id: '',
    dependencia_id: '',
    con_iva: true,
    presupuesto_inicial: '',
    anticipo: '',
    fecha_inicio: '',
    fecha_fin_compromiso: '',
    notas: ''
  });

  const [errors, setErrors] = useState({});

  // Load companies and dependencies
  useEffect(() => {
    loadOptions();
  }, []);

  const loadOptions = async () => {
    try {
      setLoadingOptions(true);
      
      const [companiesResult, dependenciesResult] = await Promise.all([
        companiesService?.getAll(),
        dependenciesService?.getAll()
      ]);

      if (companiesResult?.data) {
        setCompanies(companiesResult?.data?.filter(c => c?.activo));
      }

      if (dependenciesResult?.data) {
        setDependencies(dependenciesResult?.data?.filter(d => d?.activo));
      }
    } catch (err) {
      console.error('Error loading options:', err);
      setError('Error al cargar opciones');
    } finally {
      setLoadingOptions(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e?.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear field error when user starts typing
    if (errors?.[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData?.clave?.trim()) {
      newErrors.clave = 'La clave es requerida';
    }

    if (!formData?.nombre?.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    }

    if (!formData?.empresa_id) {
      newErrors.empresa_id = 'La empresa es requerida';
    }

    if (!formData?.presupuesto_inicial || parseFloat(formData?.presupuesto_inicial) < 0) {
      newErrors.presupuesto_inicial = 'El presupuesto inicial debe ser mayor a 0';
    }

    if (formData?.anticipo && parseFloat(formData?.anticipo) < 0) {
      newErrors.anticipo = 'El anticipo no puede ser negativo';
    }

    if (formData?.fecha_inicio && formData?.fecha_fin_compromiso) {
      const inicio = new Date(formData?.fecha_inicio);
      const fin = new Date(formData?.fecha_fin_compromiso);
      if (inicio > fin) {
        newErrors.fecha_fin_compromiso = 'La fecha de fin debe ser posterior a la fecha de inicio';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e?.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Prepare data for submission
      const submitData = {
        ...formData,
        presupuesto_inicial: parseFloat(formData?.presupuesto_inicial) || 0,
        anticipo: parseFloat(formData?.anticipo) || 0,
        dependencia_id: formData?.dependencia_id || null,
        fecha_inicio: formData?.fecha_inicio || null,
        fecha_fin_compromiso: formData?.fecha_fin_compromiso || null,
        notas: formData?.notas?.trim() || null
      };

      const { data, error: createError } = await obrasService?.create(submitData);

      if (createError) {
        setError(createError);
        return;
      }

      onSuccess?.(data);
    } catch (err) {
      setError('Error al crear la obra');
      console.error('Error creating obra:', err);
    } finally {
      setLoading(false);
    }
  };

  // Format currency input
  const formatCurrencyInput = (value) => {
    if (!value) return '';
    return parseFloat(value)?.toLocaleString('es-MX', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Building className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Nueva Obra</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                <span className="text-red-700">{error}</span>
              </div>
            </div>
          )}

          {loadingOptions && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                <span className="text-blue-700">Cargando opciones...</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Información Básica</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Clave de Obra *
                </label>
                <input
                  type="text"
                  name="clave"
                  value={formData?.clave}
                  onChange={handleInputChange}
                  placeholder="Ej: OBR-2025-001"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                    errors?.clave ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors?.clave && (
                  <p className="mt-1 text-sm text-red-600">{errors?.clave}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de la Obra *
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={formData?.nombre}
                  onChange={handleInputChange}
                  placeholder="Ej: Construcción de Edificio"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                    errors?.nombre ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors?.nombre && (
                  <p className="mt-1 text-sm text-red-600">{errors?.nombre}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <select
                  name="estatus"
                  value={formData?.estatus}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="Planeación">Planeación</option>
                  <option value="En ejecución">En ejecución</option>
                  <option value="En pausa">En pausa</option>
                  <option value="Concluida">Concluida</option>
                  <option value="Cancelada">Cancelada</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Empresa/Cliente *
                </label>
                <select
                  name="empresa_id"
                  value={formData?.empresa_id}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                    errors?.empresa_id ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Seleccionar empresa...</option>
                  {companies?.map((company) => (
                    <option key={company?.id} value={company?.id}>
                      {company?.nombre} ({company?.tipo})
                    </option>
                  ))}
                </select>
                {errors?.empresa_id && (
                  <p className="mt-1 text-sm text-red-600">{errors?.empresa_id}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dependencia (Opcional)
                </label>
                <select
                  name="dependencia_id"
                  value={formData?.dependencia_id}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Sin dependencia...</option>
                  {dependencies?.map((dependency) => (
                    <option key={dependency?.id} value={dependency?.id}>
                      {dependency?.nombre} ({dependency?.siglas})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Financial Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                <span>Información Financiera</span>
              </h3>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="con_iva"
                    checked={formData?.con_iva}
                    onChange={handleInputChange}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Incluir IVA en cálculos
                  </span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Presupuesto Inicial *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    name="presupuesto_inicial"
                    value={formData?.presupuesto_inicial}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className={`w-full pl-8 pr-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                      errors?.presupuesto_inicial ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                </div>
                {errors?.presupuesto_inicial && (
                  <p className="mt-1 text-sm text-red-600">{errors?.presupuesto_inicial}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Anticipo
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    name="anticipo"
                    value={formData?.anticipo}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className={`w-full pl-8 pr-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                      errors?.anticipo ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                </div>
                {errors?.anticipo && (
                  <p className="mt-1 text-sm text-red-600">{errors?.anticipo}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Inicio
                </label>
                <input
                  type="date"
                  name="fecha_inicio"
                  value={formData?.fecha_inicio}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Compromiso
                </label>
                <input
                  type="date"
                  name="fecha_fin_compromiso"
                  value={formData?.fecha_fin_compromiso}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                    errors?.fecha_fin_compromiso ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors?.fecha_fin_compromiso && (
                  <p className="mt-1 text-sm text-red-600">{errors?.fecha_fin_compromiso}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas
                </label>
                <textarea
                  name="notas"
                  value={formData?.notas}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="Notas adicionales sobre la obra..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="mt-8 flex justify-end space-x-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || loadingOptions}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Creando...</span>
                </div>
              ) : (
                'Crear Obra'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ObraCreationModal;