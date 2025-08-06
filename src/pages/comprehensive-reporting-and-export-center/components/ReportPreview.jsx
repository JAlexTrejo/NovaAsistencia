import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const ReportPreview = ({ reportConfig }) => {
  const [previewData, setPreviewData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [exportFormat, setExportFormat] = useState('excel');

  // Mock data for preview
  const mockData = [
    {
      employee_name: 'Juan Pérez',
      employee_id: 'EMP001',
      site_name: 'Obra Central',
      date: '2025-01-04',
      check_in: '08:00',
      check_out: '17:30',
      hours_worked: 8.5,
      overtime_hours: 0.5,
      total_pay: 425.00,
      attendance_status: 'Presente'
    },
    {
      employee_name: 'María González',
      employee_id: 'EMP002',
      site_name: 'Proyecto Norte',
      date: '2025-01-04',
      check_in: '08:15',
      check_out: '17:00',
      hours_worked: 7.75,
      overtime_hours: 0,
      total_pay: 387.50,
      attendance_status: 'Tardanza'
    },
    {
      employee_name: 'Carlos Ruiz',
      employee_id: 'EMP003',
      site_name: 'Obra Central',
      date: '2025-01-04',
      check_in: '07:45',
      check_out: '18:00',
      hours_worked: 9.25,
      overtime_hours: 1.25,
      total_pay: 512.50,
      attendance_status: 'Presente'
    },
    {
      employee_name: 'Ana López',
      employee_id: 'EMP004',
      site_name: 'Edificio Sur',
      date: '2025-01-04',
      check_in: '08:00',
      check_out: '16:30',
      hours_worked: 7.5,
      overtime_hours: 0,
      total_pay: 375.00,
      attendance_status: 'Presente'
    },
    {
      employee_name: 'Roberto Silva',
      employee_id: 'EMP005',
      site_name: 'Complejo Este',
      date: '2025-01-04',
      check_in: '08:30',
      check_out: '17:15',
      hours_worked: 7.75,
      overtime_hours: 0,
      total_pay: 387.50,
      attendance_status: 'Tardanza'
    }
  ];

  const exportFormats = [
    { id: 'excel', name: 'Excel (.xlsx)', icon: 'FileSpreadsheet' },
    { id: 'pdf', name: 'PDF (.pdf)', icon: 'FileText' },
    { id: 'csv', name: 'CSV (.csv)', icon: 'Database' }
  ];

  const generatePreview = () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setPreviewData(mockData);
      setIsLoading(false);
    }, 1500);
  };

  const handleExport = (format) => {
    setIsLoading(true);
    // Simulate export process
    setTimeout(() => {
      setIsLoading(false);
      // In real implementation, this would trigger file download
      alert(`Reporte exportado en formato ${format?.toUpperCase()}`);
    }, 2000);
  };

  const getFieldDisplayName = (fieldId) => {
    const fieldNames = {
      employee_name: 'Empleado',
      employee_id: 'ID',
      site_name: 'Sitio',
      date: 'Fecha',
      check_in: 'Entrada',
      check_out: 'Salida',
      hours_worked: 'Horas',
      overtime_hours: 'H. Extra',
      total_pay: 'Pago Total',
      attendance_status: 'Estado'
    };
    return fieldNames?.[fieldId] || fieldId;
  };

  const formatValue = (fieldId, value) => {
    if (fieldId === 'total_pay') {
      return `€${value?.toFixed(2)}`;
    }
    if (fieldId === 'hours_worked' || fieldId === 'overtime_hours') {
      return `${value}h`;
    }
    if (fieldId === 'date') {
      return new Date(value)?.toLocaleDateString('es-ES');
    }
    return value;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Presente':
        return 'text-success bg-success/10';
      case 'Tardanza':
        return 'text-warning bg-warning/10';
      case 'Ausente':
        return 'text-error bg-error/10';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  const selectedFields = reportConfig?.fields || [];
  const filteredData = previewData?.slice(0, 10) || [];

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Vista Previa del Reporte</h2>
          <p className="text-sm text-muted-foreground">
            {reportConfig?.name || 'Reporte sin nombre'} - Vista previa de los primeros 10 registros
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={generatePreview}
            loading={isLoading}
            iconName="RefreshCw"
          >
            Actualizar Vista
          </Button>
        </div>
      </div>
      {!previewData && !isLoading && (
        <div className="text-center py-12">
          <Icon name="FileSearch" size={48} className="mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Vista Previa No Disponible</h3>
          <p className="text-muted-foreground mb-4">
            Haz clic en "Actualizar Vista" para generar la vista previa del reporte
          </p>
          <Button onClick={generatePreview} iconName="Play">
            Generar Vista Previa
          </Button>
        </div>
      )}
      {isLoading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <h3 className="text-lg font-medium text-foreground mb-2">Generando Vista Previa</h3>
          <p className="text-muted-foreground">Procesando datos del reporte...</p>
        </div>
      )}
      {previewData && !isLoading && (
        <div className="space-y-6">
          {/* Report Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-muted rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Icon name="Users" size={16} className="text-primary" />
                <span className="text-sm font-medium text-foreground">Total Empleados</span>
              </div>
              <p className="text-2xl font-bold text-foreground mt-1">{filteredData?.length}</p>
            </div>
            <div className="bg-muted rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Icon name="Clock" size={16} className="text-success" />
                <span className="text-sm font-medium text-foreground">Horas Totales</span>
              </div>
              <p className="text-2xl font-bold text-foreground mt-1">
                {filteredData?.reduce((sum, row) => sum + row?.hours_worked, 0)?.toFixed(1)}h
              </p>
            </div>
            <div className="bg-muted rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Icon name="TrendingUp" size={16} className="text-warning" />
                <span className="text-sm font-medium text-foreground">Horas Extra</span>
              </div>
              <p className="text-2xl font-bold text-foreground mt-1">
                {filteredData?.reduce((sum, row) => sum + row?.overtime_hours, 0)?.toFixed(1)}h
              </p>
            </div>
            <div className="bg-muted rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Icon name="Euro" size={16} className="text-primary" />
                <span className="text-sm font-medium text-foreground">Pago Total</span>
              </div>
              <p className="text-2xl font-bold text-foreground mt-1">
                €{filteredData?.reduce((sum, row) => sum + row?.total_pay, 0)?.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Data Table */}
          <div className="border border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    {selectedFields?.map((fieldId) => (
                      <th
                        key={fieldId}
                        className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                      >
                        {getFieldDisplayName(fieldId)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-background divide-y divide-border">
                  {filteredData?.map((row, index) => (
                    <tr key={index} className="hover:bg-muted/50">
                      {selectedFields?.map((fieldId) => (
                        <td key={fieldId} className="px-4 py-3 whitespace-nowrap text-sm">
                          {fieldId === 'attendance_status' ? (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(row?.[fieldId])}`}>
                              {row?.[fieldId]}
                            </span>
                          ) : (
                            <span className="text-foreground">
                              {formatValue(fieldId, row?.[fieldId])}
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Export Options */}
          <div className="border-t border-border pt-6">
            <h3 className="text-sm font-medium text-foreground mb-4">Opciones de Exportación</h3>
            <div className="flex flex-wrap gap-3">
              {exportFormats?.map((format) => (
                <Button
                  key={format?.id}
                  variant={exportFormat === format?.id ? 'default' : 'outline'}
                  onClick={() => {
                    setExportFormat(format?.id);
                    handleExport(format?.id);
                  }}
                  iconName={format?.icon}
                  iconPosition="left"
                  loading={isLoading && exportFormat === format?.id}
                >
                  {format?.name}
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              El reporte completo contiene {mockData?.length * 10} registros aproximadamente
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportPreview;