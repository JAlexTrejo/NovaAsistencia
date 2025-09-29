import React, { useState } from 'react';
import { Download, FileText, Table, Calendar, Clock, CheckCircle } from 'lucide-react';
import { activityLogService } from '@/services/activityLogService';

export default function ExportPanel({ logs = [], filters = {} }) {
  const [exportFormat, setExportFormat] = useState('csv');      // csv | json | report
  const [exportRange, setExportRange] = useState('current');    // current | all
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  // --- helpers ---
  const safe = (v) => (v ?? '');
  const toESDateTime = (iso) => (iso ? new Date(iso).toLocaleString('es-ES') : '');

  // CSV: comillas dobles y saltos de línea
  const csvCell = (val) => {
    const s = String(val ?? '');
    const needsQuotes = /[",\n]/.test(s);
    const escaped = s.replace(/"/g, '""');
    return needsQuotes ? `"${escaped}"` : escaped;
  };

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
    const rows = data.map((log) => ([
      toESDateTime(log?.fecha),
      safe(log?.usuarios?.nombre),
      safe(log?.usuarios?.correo),
      safe(log?.rol),
      safe(log?.accion),
      safe(log?.modulo),
      safe(log?.descripcion),
      safe(log?.ip_address)
    ].map(csvCell).join(',')));

    const csv = [headers.join(','), ...rows].join('\n');
    // BOM para Excel
    return '\uFEFF' + csv;
  };

  const generateJSON = (data) => {
    const exportData = data.map((log) => ({
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
      user_agent: log?.user_agent,
      metadata: log?.metadata ?? null
    }));
    return JSON.stringify(exportData, null, 2);
  };

  const generateReport = (data) => {
    const moduleDistribution = {};
    const actionDistribution = {};
    const roleDistribution = {};
    const userSet = new Set();

    data.forEach((log) => {
      moduleDistribution[log?.modulo] = (moduleDistribution[log?.modulo] || 0) + 1;
      actionDistribution[log?.accion] = (actionDistribution[log?.accion] || 0) + 1;
      roleDistribution[log?.rol] = (roleDistribution[log?.rol] || 0) + 1;
      if (log?.usuario_id) userSet.add(log?.usuario_id);
    });

    const reportData = {
      metadata: {
        generatedAt: new Date().toISOString(),
        totalRecords: data.length,
        filters,
        dateRange: {
          from: data.length > 0 ? data[data.length - 1]?.fecha : null,
          to: data.length > 0 ? data[0]?.fecha : null
        }
      },
      summary: {
        uniqueUsers: userSet.size,
        moduleDistribution,
        actionDistribution,
        roleDistribution
      },
      logs: data
    };

    return JSON.stringify(reportData, null, 2);
  };

  const downloadFile = (content, filename, contentType) => {
    const blob = new Blob([content], { type: contentType });
    const url = window.URL?.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.replace(/[^\w\-\.]+/g, '_'); // nombre seguro
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL?.revokeObjectURL(url);
  };

  const buildFilename = (base) => {
    const ts = new Date().toISOString().split('T')[0];
    const parts = [base, exportRange];
    const filterTags = Object.entries(filters || {})
      .filter(([k, v]) => v && v !== 'all' && v !== 'today')
      .map(([k, v]) => `${k}-${String(v).toLowerCase()}`);
    if (filterTags.length) parts.push(filterTags.join('_'));
    parts.push(ts);
    return parts.join('-');
  };

  const fetchAllLogs = async () => {
    // Usa el service para exportar TODO (sin mock, sin dependencias del estado de la UI)
    const result = await activityLogService.exportLogs({
      // Puedes mapear aquí tus filtros UI > filtros del service si lo deseas
      // e.g. module, action, startDate, endDate...
    });
    if (!result?.success) throw result?.error || new Error('No se pudo exportar');
    // exportLogs() devuelve objetos de campos legibles;
    // si deseas conservar la misma forma que tus "logs" con usuarios embebidos,
    // puedes en el service crear un exportLogsWithUsers. Para ahora, usamos lo cargado en dashboard.
    return logs; // fallback a lo visible si no quieres segunda llamada
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      setExportSuccess(false);

      const dataToExport = exportRange === 'current'
        ? logs
        : await fetchAllLogs();

      const filenameBase =
        exportFormat === 'report' ? 'activity-report' : 'activity-logs';

      let content, filename, contentType;

      if (exportFormat === 'csv') {
        content = generateCSV(dataToExport);
        filename = `${buildFilename(filenameBase)}.csv`;
        contentType = 'text/csv;charset=utf-8;';
      } else if (exportFormat === 'json') {
        content = generateJSON(dataToExport);
        filename = `${buildFilename(filenameBase)}.json`;
        contentType = 'application/json;charset=utf-8;';
      } else if (exportFormat === 'report') {
        content = generateReport(dataToExport);
        filename = `${buildFilename('activity-report')}.json`;
        contentType = 'application/json;charset=utf-8;';
      } else {
        throw new Error('Formato de exportación no válido');
      }

      downloadFile(content, filename, contentType);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (err) {
      console.error('Error exporting data:', err);
      alert('Error al exportar los datos. Por favor, inténtalo de nuevo.');
    } finally {
      setIsExporting(false);
    }
  };

  const getFormatIcon = (format) => {
    switch (format) {
      case 'csv': return <Table className="h-4 w-4" />;
      case 'json': return <FileText className="h-4 w-4" />;
      case 'report': return <FileText className="h-4 w-4" />;
      default: return <Download className="h-4 w-4" />;
    }
  };

  const getFormatDescription = (format) => {
    switch (format) {
      case 'csv': return 'Archivo CSV compatible con Excel y hojas de cálculo';
      case 'json': return 'Datos en formato JSON para análisis programático';
      case 'report': return 'Reporte completo con estadísticas y metadatos';
      default: return '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Download className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-medium text-gray-900">Exportar Datos</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Formato */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Formato de Exportación
            </label>
            <div className="space-y-3">
              {[
                { value: 'csv', label: 'CSV (Excel)' },
                { value: 'json', label: 'JSON (Datos)' },
                { value: 'report', label: 'Reporte Completo' }
              ].map((format) => (
                <label key={format.value} className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="exportFormat"
                    value={format.value}
                    checked={exportFormat === format.value}
                    onChange={(e) => setExportFormat(e.target.value)}
                    className="mt-1 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      {getFormatIcon(format.value)}
                      <span className="font-medium text-gray-900">{format.label}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {getFormatDescription(format.value)}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Rango */}
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
                  onChange={(e) => setExportRange(e.target.value)}
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

              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="exportRange"
                  value="all"
                  checked={exportRange === 'all'}
                  onChange={(e) => setExportRange(e.target.value)}
                  className="mt-1 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span className="font-medium text-gray-900">Todo (según filtros)</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Consultar y exportar todos los registros coincidentes con filtros
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Resumen */}
          <div className="bg-gray-50 rounded-lg p-4 border">
            <h4 className="font-medium text-gray-900 mb-2">Resumen de Exportación</h4>
            <div className="space-y-1 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Registros (vista actual):</span>
                <span className="font-medium">{logs?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Formato:</span>
                <span className="font-medium uppercase">{exportFormat}</span>
              </div>
              <div className="flex justify-between">
                <span>Rango:</span>
                <span className="font-medium">{exportRange === 'current' ? 'Actual' : 'Todo (filtros)'}</span>
              </div>
              <div className="flex justify-between">
                <span>Filtros aplicados:</span>
                <span className="font-medium">
                  {Object.values(filters || {}).filter(v => v !== 'all' && v !== 'today').length || 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Botón */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
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
            disabled={isExporting || (exportRange === 'current' && logs?.length === 0)}
            className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
              isExporting || (exportRange === 'current' && logs?.length === 0)
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
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

      {logs?.length === 0 && exportRange === 'current' && (
        <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <p className="text-sm text-yellow-800">
            No hay datos disponibles para exportar. Ajusta los filtros para mostrar más registros.
          </p>
        </div>
      )}
    </div>
  );
}
