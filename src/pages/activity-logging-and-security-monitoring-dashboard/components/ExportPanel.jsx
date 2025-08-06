import React, { useState } from 'react';
import { Download, FileText, Table, Calendar, Clock, CheckCircle } from 'lucide-react';

export default function ExportPanel({ logs = [], filters = {} }) {
  const [exportFormat, setExportFormat] = useState('csv');
  const [exportRange, setExportRange] = useState('current');
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  const generateCSV = (data) => {
    const headers = [
      'Fecha',
      'Usuario',
      'Email',
      'Rol',
      'Acción',
      'Módulo', 
      'Descripción',
      'IP'
    ];

    const csvContent = [
      headers?.join(','),
      ...data?.map(log => [
        log?.fecha ? new Date(log?.fecha)?.toLocaleString('es-ES') : '',
        log?.usuarios?.nombre || '',
        log?.usuarios?.correo || '',
        log?.rol || '',
        log?.accion || '',
        log?.modulo || '',
        `"${log?.descripcion?.replace(/"/g, '""') || ''}"`,
        log?.ip_address || ''
      ]?.join(','))
    ]?.join('\n');

    return csvContent;
  };

  const generateJSON = (data) => {
    const exportData = data?.map(log => ({
      fecha: log?.fecha,
      usuario: {
        nombre: log?.usuarios?.nombre,
        correo: log?.usuarios?.correo
      },
      rol: log?.rol,
      accion: log?.accion,
      modulo: log?.modulo,
      descripcion: log?.descripcion,
      ip_address: log?.ip_address,
      user_agent: log?.user_agent
    }));

    return JSON.stringify(exportData, null, 2);
  };

  const generateReport = (data) => {
    const reportData = {
      metadata: {
        generatedAt: new Date()?.toISOString(),
        totalRecords: data?.length,
        filters: filters,
        dateRange: {
          from: data?.length > 0 ? data?.[data?.length - 1]?.fecha : null,
          to: data?.length > 0 ? data?.[0]?.fecha : null
        }
      },
      summary: {
        uniqueUsers: new Set(data?.map(log => log?.usuario_id))?.size,
        moduleDistribution: data?.reduce((acc, log) => {
          acc[log?.modulo] = (acc?.[log?.modulo] || 0) + 1;
          return acc;
        }, {}),
        actionDistribution: data?.reduce((acc, log) => {
          acc[log?.accion] = (acc?.[log?.accion] || 0) + 1;
          return acc;
        }, {}),
        roleDistribution: data?.reduce((acc, log) => {
          acc[log?.rol] = (acc?.[log?.rol] || 0) + 1;
          return acc;
        }, {})
      },
      logs: data
    };

    return JSON.stringify(reportData, null, 2);
  };

  const downloadFile = (content, filename, contentType) => {
    const blob = new Blob([content], { type: contentType });
    const url = window?.URL?.createObjectURL(blob);
    const link = document?.createElement('a');
    link.href = url;
    link.download = filename;
    document?.body?.appendChild(link);
    link?.click();
    document?.body?.removeChild(link);
    window?.URL?.revokeObjectURL(url);
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      setExportSuccess(false);

      // Simulate processing time for better UX
      await new Promise(resolve => setTimeout(resolve, 1000));

      const dataToExport = exportRange === 'current' ? logs : logs; // Could be extended for different ranges
      const timestamp = new Date()?.toISOString()?.split('T')?.[0];
      
      let content, filename, contentType;

      switch (exportFormat) {
        case 'csv':
          content = generateCSV(dataToExport);
          filename = `activity-logs-${timestamp}.csv`;
          contentType = 'text/csv;charset=utf-8;';
          break;
        
        case 'json':
          content = generateJSON(dataToExport);
          filename = `activity-logs-${timestamp}.json`;
          contentType = 'application/json;charset=utf-8;';
          break;
        
        case 'report':
          content = generateReport(dataToExport);
          filename = `activity-report-${timestamp}.json`;
          contentType = 'application/json;charset=utf-8;';
          break;
        
        default:
          throw new Error('Formato de exportación no válido');
      }

      downloadFile(content, filename, contentType);
      setExportSuccess(true);
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => setExportSuccess(false), 3000);

    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Error al exportar los datos. Por favor, inténtalo de nuevo.');
    } finally {
      setIsExporting(false);
    }
  };

  const getFormatIcon = (format) => {
    switch (format) {
      case 'csv':
        return <Table className="h-4 w-4" />;
      case 'json':
        return <FileText className="h-4 w-4" />;
      case 'report':
        return <FileText className="h-4 w-4" />;
      default:
        return <Download className="h-4 w-4" />;
    }
  };

  const getFormatDescription = (format) => {
    switch (format) {
      case 'csv':
        return 'Archivo CSV compatible con Excel y hojas de cálculo';
      case 'json':
        return 'Datos en formato JSON para análisis programático';
      case 'report':
        return 'Reporte completo con estadísticas y metadatos';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Download className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-medium text-gray-900">Exportar Datos</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Export Format Selection */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Formato de Exportación
            </label>
            <div className="space-y-3">
              {[
                { value: 'csv', label: 'CSV (Excel)', icon: 'table' },
                { value: 'json', label: 'JSON (Datos)', icon: 'code' },
                { value: 'report', label: 'Reporte Completo', icon: 'file' }
              ]?.map((format) => (
                <label key={format?.value} className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="exportFormat"
                    value={format?.value}
                    checked={exportFormat === format?.value}
                    onChange={(e) => setExportFormat(e?.target?.value)}
                    className="mt-1 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      {getFormatIcon(format?.value)}
                      <span className="font-medium text-gray-900">{format?.label}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {getFormatDescription(format?.value)}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Export Range Selection */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Rango de Datos
            </label>
            <div className="space-y-3">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="exportRange"
                  value="current"
                  checked={exportRange === 'current'}
                  onChange={(e) => setExportRange(e?.target?.value)}
                  className="mt-1 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span className="font-medium text-gray-900">Datos Actuales</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Exportar {logs?.length || 0} registros mostrados actualmente
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Export Summary */}
          <div className="bg-gray-50 rounded-lg p-4 border">
            <h4 className="font-medium text-gray-900 mb-2">Resumen de Exportación</h4>
            <div className="space-y-1 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Registros:</span>
                <span className="font-medium">{logs?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Formato:</span>
                <span className="font-medium uppercase">{exportFormat}</span>
              </div>
              <div className="flex justify-between">
                <span>Filtros aplicados:</span>
                <span className="font-medium">
                  {Object?.values(filters || {})?.filter(v => v !== 'all' && v !== 'today')?.length || 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Export Button */}
      <div className="flex items-center justify-between pts-4 border-t border-gray-200">
        <div className="flex items-center space-x-2">
          <Clock className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-500">
            La exportación puede tardar unos segundos
          </span>
        </div>

        <div className="flex items-center space-x-3">
          {exportSuccess && (
            <div className="flex items-center space-x-2 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">¡Exportación exitosa!</span>
            </div>
          )}
          
          <button
            onClick={handleExport}
            disabled={isExporting || logs?.length === 0}
            className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
              isExporting || logs?.length === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' :'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isExporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Exportando...</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                <span>Exportar Datos</span>
              </>
            )}
          </button>
        </div>
      </div>

      {logs?.length === 0 && (
        <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <p className="text-sm text-yellow-800">
            No hay datos disponibles para exportar. Ajusta los filtros para mostrar más registros.
          </p>
        </div>
      )}
    </div>
  );
}