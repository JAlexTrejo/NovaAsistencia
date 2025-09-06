import React, { useState } from 'react';
import { X, Download, FileSpreadsheet, FileText, Filter } from 'lucide-react';

const ExportModal = ({ obras, onClose }) => {
  const [exportFormat, setExportFormat] = useState('xlsx');
  const [exportType, setExportType] = useState('summary');
  const [includeFilters, setIncludeFilters] = useState({
    status: 'all',
    dateRange: { start: '', end: '' },
    includeKPIs: true,
    includeDetails: false
  });
  const [loading, setLoading] = useState(false);

  // Format currency for export
  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return 0;
    return amount;
  };

  // Format percentage for export
  const formatPercentage = (value) => {
    if (!value && value !== 0) return 0;
    return parseFloat(value?.toFixed(2));
  };

  // Prepare data for export
  const prepareExportData = () => {
    let filteredObras = obras;

    // Apply status filter
    if (includeFilters?.status !== 'all') {
      filteredObras = filteredObras?.filter(obra => obra?.estatus === includeFilters?.status);
    }

    // Apply date range filter
    if (includeFilters?.dateRange?.start && includeFilters?.dateRange?.end) {
      filteredObras = filteredObras?.filter(obra => {
        const obraDate = new Date(obra?.fecha_inicio);
        const startDate = new Date(includeFilters?.dateRange?.start);
        const endDate = new Date(includeFilters?.dateRange?.end);
        return obraDate >= startDate && obraDate <= endDate;
      });
    }

    if (exportType === 'summary') {
      return filteredObras?.map(obra => ({
        'Clave': obra?.clave || '',
        'Nombre': obra?.nombre || '',
        'Estado': obra?.estatus || '',
        'Empresa': obra?.empresa_nombre || '',
        'Dependencia': obra?.dependencia_nombre || 'N/A',
        'Presupuesto Total': formatCurrency(obra?.presupuesto_total),
        'Órdenes de Cambio': formatCurrency(obra?.presupuesto_total - obra?.presupuesto_inicial),
        'Facturado Total': formatCurrency(obra?.facturado_total),
        'Pagado Total': formatCurrency(obra?.pagado_total),
        'Por Cobrar': formatCurrency(obra?.por_cobrar),
        'Gastos Total': formatCurrency(obra?.gastos_total),
        'Costo Directo': formatCurrency(obra?.costo_directo),
        'Utilidad Bruta': formatCurrency(obra?.utilidad_bruta),
        'Utilidad vs Presupuesto': formatCurrency(obra?.utilidad_vs_presupuesto),
        '% Utilidad Real': formatPercentage(obra?.utilidad_pct_real),
        '% Avance Financiero': formatPercentage(obra?.avance_financiero_pct),
        '% Margen Presupuestado': formatPercentage(obra?.margen_presupuestado_pct),
        'Fecha Inicio': obra?.fecha_inicio || '',
        'Fecha Compromiso': obra?.fecha_fin_compromiso || ''
      }));
    }

    // For detailed report, return comprehensive data
    return filteredObras;
  };

  // Generate CSV content
  const generateCSV = (data) => {
    if (!data?.length) return '';

    const headers = Object.keys(data?.[0]);
    const csvContent = [
      headers?.join(','),
      ...data?.map(row => 
        headers?.map(header => {
          const value = row?.[header];
          // Escape commas and quotes in values
          if (typeof value === 'string' && (value?.includes(',') || value?.includes('"'))) {
            return `"${value?.replace(/"/g, '""')}"`;
          }
          return value ?? '';
        })?.join(',')
      )
    ]?.join('\n');

    return csvContent;
  };

  // Generate Excel-compatible content (CSV with BOM for proper encoding)
  const generateExcel = (data) => {
    const csv = generateCSV(data);
    return '\uFEFF' + csv; // Add BOM for proper UTF-8 encoding in Excel
  };

  // Generate PDF content (simplified - in a real app, you'd use a PDF library)
  const generatePDFContent = (data) => {
    // This is a simplified version. In production, you'd use jsPDF or similar
    return `
REPORTE FINANCIERO DE OBRAS
Generado: ${new Date()?.toLocaleString('es-MX')}
Total de obras: ${data?.length}

${data?.map(obra => `
OBRA: ${obra?.['Clave']} - ${obra?.['Nombre']}
Estado: ${obra?.['Estado']}
Empresa: ${obra?.['Empresa']}
Presupuesto Total: $${obra?.['Presupuesto Total']?.toLocaleString('es-MX')}
Facturado: $${obra?.['Facturado Total']?.toLocaleString('es-MX')}
Por Cobrar: $${obra?.['Por Cobrar']?.toLocaleString('es-MX')}
% Utilidad Real: ${obra?.['% Utilidad Real']}%
% Avance: ${obra?.['% Avance Financiero']}%
----------------------------------------
`)?.join('')}
    `;
  };

  // Handle export
  const handleExport = async () => {
    try {
      setLoading(true);

      const data = prepareExportData();
      
      if (!data?.length) {
        alert('No hay datos para exportar con los filtros seleccionados');
        return;
      }

      let content;
      let mimeType;
      let fileName;

      switch (exportFormat) {
        case 'xlsx':
          content = generateExcel(data);
          mimeType = 'text/csv';
          fileName = `obras-financiero-${exportType}-${new Date()?.toISOString()?.split('T')?.[0]}.csv`;
          break;
        case 'csv':
          content = generateCSV(data);
          mimeType = 'text/csv';
          fileName = `obras-financiero-${exportType}-${new Date()?.toISOString()?.split('T')?.[0]}.csv`;
          break;
        case 'pdf':
          content = generatePDFContent(data);
          mimeType = 'text/plain';
          fileName = `obras-financiero-${exportType}-${new Date()?.toISOString()?.split('T')?.[0]}.txt`;
          break;
        default:
          throw new Error('Formato no soportado');
      }

      // Create and download file
      const blob = new Blob([content], { type: mimeType });
      const url = window.URL?.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body?.appendChild(link);
      link?.click();
      document.body?.removeChild(link);
      window.URL?.revokeObjectURL(url);

      onClose();
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Error al exportar los datos. Por favor intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Download className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Exportar Reportes</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Export Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Tipo de Reporte
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="exportType"
                  value="summary"
                  checked={exportType === 'summary'}
                  onChange={(e) => setExportType(e?.target?.value)}
                  className="form-radio h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Resumen Ejecutivo (KPIs principales por obra)
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="exportType"
                  value="detailed"
                  checked={exportType === 'detailed'}
                  onChange={(e) => setExportType(e?.target?.value)}
                  className="form-radio h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Reporte Detallado (incluye transacciones)
                </span>
              </label>
            </div>
          </div>

          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Formato de Exportación
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setExportFormat('xlsx')}
                className={`p-4 border-2 rounded-lg flex flex-col items-center space-y-2 transition-colors ${
                  exportFormat === 'xlsx' ?'border-blue-500 bg-blue-50 text-blue-700' :'border-gray-300 hover:border-gray-400'
                }`}
              >
                <FileSpreadsheet className="h-8 w-8" />
                <span className="text-sm font-medium">Excel (.xlsx)</span>
              </button>
              <button
                type="button"
                onClick={() => setExportFormat('csv')}
                className={`p-4 border-2 rounded-lg flex flex-col items-center space-y-2 transition-colors ${
                  exportFormat === 'csv' ?'border-blue-500 bg-blue-50 text-blue-700' :'border-gray-300 hover:border-gray-400'
                }`}
              >
                <FileText className="h-8 w-8" />
                <span className="text-sm font-medium">CSV</span>
              </button>
              <button
                type="button"
                onClick={() => setExportFormat('pdf')}
                className={`p-4 border-2 rounded-lg flex flex-col items-center space-y-2 transition-colors ${
                  exportFormat === 'pdf' ?'border-blue-500 bg-blue-50 text-blue-700' :'border-gray-300 hover:border-gray-400'
                }`}
              >
                <FileText className="h-8 w-8" />
                <span className="text-sm font-medium">PDF</span>
              </button>
            </div>
          </div>

          {/* Filters */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Filtros de Exportación
            </label>
            <div className="space-y-4">
              {/* Status Filter */}
              <div>
                <label className="block text-sm text-gray-600 mb-1">Estado de Obra</label>
                <select
                  value={includeFilters?.status}
                  onChange={(e) => setIncludeFilters(prev => ({ ...prev, status: e?.target?.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">Todas las obras</option>
                  <option value="Planeación">En Planeación</option>
                  <option value="En ejecución">En Ejecución</option>
                  <option value="En pausa">En Pausa</option>
                  <option value="Concluida">Concluidas</option>
                  <option value="Cancelada">Canceladas</option>
                </select>
              </div>

              {/* Date Range Filter */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Fecha Inicio Desde</label>
                  <input
                    type="date"
                    value={includeFilters?.dateRange?.start}
                    onChange={(e) => setIncludeFilters(prev => ({ 
                      ...prev, 
                      dateRange: { ...prev?.dateRange, start: e?.target?.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Fecha Inicio Hasta</label>
                  <input
                    type="date"
                    value={includeFilters?.dateRange?.end}
                    onChange={(e) => setIncludeFilters(prev => ({ 
                      ...prev, 
                      dateRange: { ...prev?.dateRange, end: e?.target?.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Include Options */}
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={includeFilters?.includeKPIs}
                    onChange={(e) => setIncludeFilters(prev => ({ ...prev, includeKPIs: e?.target?.checked }))}
                    className="form-checkbox h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Incluir KPIs financieros</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={includeFilters?.includeDetails}
                    onChange={(e) => setIncludeFilters(prev => ({ ...prev, includeDetails: e?.target?.checked }))}
                    className="form-checkbox h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Incluir detalles de transacciones</span>
                </label>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Resumen de Exportación</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p>• Formato: {exportFormat?.toUpperCase()}</p>
              <p>• Tipo: {exportType === 'summary' ? 'Resumen Ejecutivo' : 'Reporte Detallado'}</p>
              <p>• Total de obras disponibles: {obras?.length || 0}</p>
              <p>• Obras filtradas: {prepareExportData()?.length || 0}</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-4 p-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Exportando...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Download className="h-4 w-4" />
                <span>Exportar</span>
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;