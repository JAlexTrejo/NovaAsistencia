import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

import Select from '../../../components/ui/Select';

const ReportHistory = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState('last_30_days');

  const reportHistory = [
    {
      id: 1,
      name: 'Reporte Semanal de Asistencia',
      type: 'attendance-summary',
      generatedBy: 'Sistema Automático',
      generatedAt: new Date(2025, 0, 4, 8, 0),
      status: 'completed',
      format: 'excel',
      fileSize: '2.4 MB',
      downloadCount: 5,
      recipients: ['supervisor@empresa.com', 'rrhh@empresa.com'],
      executionTime: '45s'
    },
    {
      id: 2,
      name: 'Nómina Quincenal - Enero 2025',
      type: 'payroll-detailed',
      generatedBy: 'María González',
      generatedAt: new Date(2025, 0, 3, 14, 30),
      status: 'completed',
      format: 'pdf',
      fileSize: '1.8 MB',
      downloadCount: 12,
      recipients: ['contabilidad@empresa.com', 'gerencia@empresa.com'],
      executionTime: '1m 23s'
    },
    {
      id: 3,
      name: 'Análisis de Productividad por Sitio',
      type: 'site-productivity',
      generatedBy: 'Carlos Ruiz',
      generatedAt: new Date(2025, 0, 3, 10, 15),
      status: 'failed',
      format: 'excel',
      fileSize: null,
      downloadCount: 0,
      recipients: ['supervisor@empresa.com'],
      executionTime: null,
      error: 'Error de conexión con la base de datos'
    },
    {
      id: 4,
      name: 'Dashboard Ejecutivo Diario',
      type: 'executive-dashboard',
      generatedBy: 'Sistema Automático',
      generatedAt: new Date(2025, 0, 3, 7, 30),
      status: 'completed',
      format: 'pdf',
      fileSize: '3.2 MB',
      downloadCount: 8,
      recipients: ['gerencia@empresa.com', 'direccion@empresa.com'],
      executionTime: '2m 10s'
    },
    {
      id: 5,
      name: 'Reporte de Incidentes - Diciembre 2024',
      type: 'incident-analysis',
      generatedBy: 'Ana López',
      generatedAt: new Date(2025, 0, 2, 16, 45),
      status: 'processing',
      format: 'pdf',
      fileSize: null,
      downloadCount: 0,
      recipients: ['seguridad@empresa.com'],
      executionTime: null,
      progress: 75
    },
    {
      id: 6,
      name: 'Resumen Mensual - Diciembre 2024',
      type: 'monthly-summary',
      generatedBy: 'Roberto Silva',
      generatedAt: new Date(2025, 0, 1, 9, 0),
      status: 'completed',
      format: 'excel',
      fileSize: '4.1 MB',
      downloadCount: 15,
      recipients: ['gerencia@empresa.com', 'rrhh@empresa.com', 'contabilidad@empresa.com'],
      executionTime: '3m 45s'
    }
  ];

  const statusOptions = [
    { value: 'all', label: 'Todos los estados' },
    { value: 'completed', label: 'Completados' },
    { value: 'processing', label: 'En proceso' },
    { value: 'failed', label: 'Fallidos' }
  ];

  const dateRangeOptions = [
    { value: 'today', label: 'Hoy' },
    { value: 'last_7_days', label: 'Últimos 7 días' },
    { value: 'last_30_days', label: 'Últimos 30 días' },
    { value: 'last_90_days', label: 'Últimos 90 días' }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-success bg-success/10';
      case 'processing':
        return 'text-warning bg-warning/10';
      case 'failed':
        return 'text-error bg-error/10';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return 'CheckCircle';
      case 'processing':
        return 'Clock';
      case 'failed':
        return 'XCircle';
      default:
        return 'Circle';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed':
        return 'Completado';
      case 'processing':
        return 'En Proceso';
      case 'failed':
        return 'Fallido';
      default:
        return 'Desconocido';
    }
  };

  const getFormatIcon = (format) => {
    switch (format) {
      case 'excel':
        return 'FileSpreadsheet';
      case 'pdf':
        return 'FileText';
      case 'csv':
        return 'Database';
      default:
        return 'File';
    }
  };

  const filteredHistory = reportHistory?.filter(report => {
    const matchesSearch = report?.name?.toLowerCase()?.includes(searchTerm?.toLowerCase()) ||
                         report?.generatedBy?.toLowerCase()?.includes(searchTerm?.toLowerCase());
    const matchesStatus = statusFilter === 'all' || report?.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatDateTime = (date) => {
    return date?.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDownload = (reportId) => {
    // In real implementation, this would trigger file download
    console.log(`Downloading report ${reportId}`);
  };

  const handleRetry = (reportId) => {
    // In real implementation, this would retry failed report generation
    console.log(`Retrying report ${reportId}`);
  };

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Historial de Reportes</h2>
          <p className="text-sm text-muted-foreground">Revisa y descarga reportes generados anteriormente</p>
        </div>
        <Button variant="outline" iconName="Download">
          Exportar Historial
        </Button>
      </div>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Icon name="Search" size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar reportes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e?.target?.value)}
            className="w-full pl-10 pr-4 py-2 border border-border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
          />
        </div>
        
        <Select
          options={statusOptions}
          value={statusFilter}
          onChange={setStatusFilter}
          className="w-full sm:w-48"
        />
        
        <Select
          options={dateRangeOptions}
          value={dateRange}
          onChange={setDateRange}
          className="w-full sm:w-48"
        />
      </div>
      {/* Reports List */}
      <div className="space-y-4">
        {filteredHistory?.map((report) => (
          <div
            key={report?.id}
            className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors duration-150 ease-out-cubic"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <Icon name={getFormatIcon(report?.format)} size={20} className="text-muted-foreground" />
                  <h3 className="font-medium text-foreground">{report?.name}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(report?.status)}`}>
                    <Icon name={getStatusIcon(report?.status)} size={12} className="inline mr-1" />
                    {getStatusText(report?.status)}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm mb-3">
                  <div className="flex items-center space-x-2">
                    <Icon name="User" size={14} className="text-muted-foreground" />
                    <span className="text-foreground">{report?.generatedBy}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Icon name="Calendar" size={14} className="text-muted-foreground" />
                    <span className="text-foreground">{formatDateTime(report?.generatedAt)}</span>
                  </div>
                  
                  {report?.fileSize && (
                    <div className="flex items-center space-x-2">
                      <Icon name="HardDrive" size={14} className="text-muted-foreground" />
                      <span className="text-foreground">{report?.fileSize}</span>
                    </div>
                  )}
                  
                  {report?.executionTime && (
                    <div className="flex items-center space-x-2">
                      <Icon name="Clock" size={14} className="text-muted-foreground" />
                      <span className="text-foreground">{report?.executionTime}</span>
                    </div>
                  )}
                </div>

                {/* Processing Progress */}
                {report?.status === 'processing' && report?.progress && (
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-foreground">Progreso</span>
                      <span className="text-muted-foreground">{report?.progress}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all duration-300 ease-out-cubic"
                        style={{ width: `${report?.progress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {report?.status === 'failed' && report?.error && (
                  <div className="mb-3 p-3 bg-error/10 border border-error/20 rounded-md">
                    <div className="flex items-center space-x-2">
                      <Icon name="AlertCircle" size={16} className="text-error" />
                      <span className="text-sm text-error font-medium">Error:</span>
                    </div>
                    <p className="text-sm text-error mt-1">{report?.error}</p>
                  </div>
                )}
                
                {/* Recipients */}
                <div className="flex items-center space-x-2">
                  <Icon name="Mail" size={14} className="text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Enviado a:</span>
                  <div className="flex flex-wrap gap-1">
                    {report?.recipients?.slice(0, 2)?.map((email, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded-md"
                      >
                        {email}
                      </span>
                    ))}
                    {report?.recipients?.length > 2 && (
                      <span className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded-md">
                        +{report?.recipients?.length - 2} más
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 ml-4">
                {report?.status === 'completed' && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      iconName="Download"
                      onClick={() => handleDownload(report?.id)}
                    >
                      Descargar
                    </Button>
                    <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                      <Icon name="Download" size={12} />
                      <span>{report?.downloadCount}</span>
                    </div>
                  </>
                )}
                
                {report?.status === 'failed' && (
                  <Button
                    variant="outline"
                    size="sm"
                    iconName="RefreshCw"
                    onClick={() => handleRetry(report?.id)}
                  >
                    Reintentar
                  </Button>
                )}
                
                {report?.status === 'processing' && (
                  <Button
                    variant="outline"
                    size="sm"
                    iconName="X"
                    onClick={() => console.log(`Cancelling report ${report?.id}`)}
                  >
                    Cancelar
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      {filteredHistory?.length === 0 && (
        <div className="text-center py-12">
          <Icon name="FileX" size={48} className="mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No se encontraron reportes</h3>
          <p className="text-muted-foreground mb-4">
            No hay reportes que coincidan con los filtros seleccionados
          </p>
          <Button variant="outline" onClick={() => {
            setSearchTerm('');
            setStatusFilter('all');
            setDateRange('last_30_days');
          }}>
            Limpiar filtros
          </Button>
        </div>
      )}
    </div>
  );
};

export default ReportHistory;