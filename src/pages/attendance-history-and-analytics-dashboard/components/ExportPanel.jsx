import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import { Checkbox } from '../../../components/ui/Checkbox';

const ExportPanel = ({ onExport, isExporting = false }) => {
  const [exportConfig, setExportConfig] = useState({
    format: 'excel',
    dateRange: 'current',
    includeCharts: true,
    includeDetails: true,
    includeIncidents: false,
    groupBy: 'employee'
  });

  const formatOptions = [
    { value: 'excel', label: 'Excel (.xlsx)' },
    { value: 'pdf', label: 'PDF' },
    { value: 'csv', label: 'CSV' }
  ];

  const dateRangeOptions = [
    { value: 'current', label: 'Filtros Actuales' },
    { value: 'week', label: 'Última Semana' },
    { value: 'month', label: 'Último Mes' },
    { value: 'quarter', label: 'Último Trimestre' },
    { value: 'custom', label: 'Rango Personalizado' }
  ];

  const groupByOptions = [
    { value: 'employee', label: 'Por Empleado' },
    { value: 'site', label: 'Por Sitio' },
    { value: 'supervisor', label: 'Por Supervisor' },
    { value: 'date', label: 'Por Fecha' }
  ];

  const handleConfigChange = (key, value) => {
    setExportConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleExport = () => {
    onExport(exportConfig);
  };

  const getFormatIcon = (format) => {
    switch (format) {
      case 'excel': return 'FileSpreadsheet';
      case 'pdf': return 'FileText';
      case 'csv': return 'Database';
      default: return 'Download';
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-primary/10 text-primary rounded-lg">
          <Icon name="Download" size={20} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">Exportar Datos</h3>
          <p className="text-sm text-muted-foreground">Generar reportes personalizados</p>
        </div>
      </div>
      <div className="space-y-6">
        {/* Format Selection */}
        <div>
          <Select
            label="Formato de Exportación"
            options={formatOptions}
            value={exportConfig?.format}
            onChange={(value) => handleConfigChange('format', value)}
          />
        </div>

        {/* Date Range */}
        <div>
          <Select
            label="Rango de Fechas"
            options={dateRangeOptions}
            value={exportConfig?.dateRange}
            onChange={(value) => handleConfigChange('dateRange', value)}
          />
        </div>

        {/* Group By */}
        <div>
          <Select
            label="Agrupar Por"
            options={groupByOptions}
            value={exportConfig?.groupBy}
            onChange={(value) => handleConfigChange('groupBy', value)}
          />
        </div>

        {/* Export Options */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-foreground">Opciones de Contenido</h4>
          
          <div className="space-y-3">
            <Checkbox
              label="Incluir Gráficos"
              description="Agregar visualizaciones al reporte"
              checked={exportConfig?.includeCharts}
              onChange={(e) => handleConfigChange('includeCharts', e?.target?.checked)}
            />
            
            <Checkbox
              label="Incluir Detalles Completos"
              description="Todos los campos de asistencia"
              checked={exportConfig?.includeDetails}
              onChange={(e) => handleConfigChange('includeDetails', e?.target?.checked)}
            />
            
            <Checkbox
              label="Incluir Incidentes"
              description="Registros de ausencias y permisos"
              checked={exportConfig?.includeIncidents}
              onChange={(e) => handleConfigChange('includeIncidents', e?.target?.checked)}
            />
          </div>
        </div>

        {/* Quick Export Templates */}
        <div className="space-y-4 pt-4 border-t border-border">
          <h4 className="text-sm font-medium text-foreground">Plantillas Rápidas</h4>
          
          <div className="grid grid-cols-1 gap-3">
            <Button
              variant="outline"
              fullWidth
              iconName="FileSpreadsheet"
              iconPosition="left"
              onClick={() => {
                setExportConfig({
                  format: 'excel',
                  dateRange: 'month',
                  includeCharts: true,
                  includeDetails: true,
                  includeIncidents: true,
                  groupBy: 'employee'
                });
              }}
            >
              Reporte Mensual Completo
            </Button>
            
            <Button
              variant="outline"
              fullWidth
              iconName="FileText"
              iconPosition="left"
              onClick={() => {
                setExportConfig({
                  format: 'pdf',
                  dateRange: 'week',
                  includeCharts: true,
                  includeDetails: false,
                  includeIncidents: false,
                  groupBy: 'site'
                });
              }}
            >
              Resumen Semanal por Sitio
            </Button>
            
            <Button
              variant="outline"
              fullWidth
              iconName="Database"
              iconPosition="left"
              onClick={() => {
                setExportConfig({
                  format: 'csv',
                  dateRange: 'current',
                  includeCharts: false,
                  includeDetails: true,
                  includeIncidents: false,
                  groupBy: 'date'
                });
              }}
            >
              Datos Raw para Análisis
            </Button>
          </div>
        </div>

        {/* Export Button */}
        <div className="pt-4 border-t border-border">
          <Button
            variant="default"
            fullWidth
            loading={isExporting}
            onClick={handleExport}
            iconName={getFormatIcon(exportConfig?.format)}
            iconPosition="left"
          >
            {isExporting ? 'Generando...' : `Exportar como ${exportConfig?.format?.toUpperCase()}`}
          </Button>
        </div>

        {/* Export History */}
        <div className="space-y-3 pt-4 border-t border-border">
          <h4 className="text-sm font-medium text-foreground">Exportaciones Recientes</h4>
          
          <div className="space-y-2">
            {[
              { name: 'Reporte_Asistencia_Enero_2025.xlsx', date: '2025-01-04', size: '2.4 MB' },
              { name: 'Resumen_Semanal_Dic_2024.pdf', date: '2024-12-30', size: '1.8 MB' },
              { name: 'Datos_Tardanzas_Dic_2024.csv', date: '2024-12-28', size: '456 KB' }
            ]?.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Icon 
                    name={file?.name?.endsWith('.xlsx') ? 'FileSpreadsheet' : 
                          file?.name?.endsWith('.pdf') ? 'FileText' : 'Database'} 
                    size={16} 
                    className="text-muted-foreground" 
                  />
                  <div>
                    <div className="text-sm font-medium text-foreground">{file?.name}</div>
                    <div className="text-xs text-muted-foreground">{file?.date} • {file?.size}</div>
                  </div>
                </div>
                <Button variant="ghost" size="icon">
                  <Icon name="Download" size={16} />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportPanel;