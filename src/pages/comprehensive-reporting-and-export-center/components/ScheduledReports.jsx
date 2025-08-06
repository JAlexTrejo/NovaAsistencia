import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import { Checkbox } from '../../../components/ui/Checkbox';

const ScheduledReports = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  const scheduledReports = [
    {
      id: 1,
      name: 'Reporte Semanal de Asistencia',
      description: 'Resumen semanal de asistencia por sitio',
      schedule: 'weekly',
      frequency: 'Lunes a las 08:00',
      lastRun: new Date(2025, 0, 1, 8, 0),
      nextRun: new Date(2025, 0, 6, 8, 0),
      status: 'active',
      recipients: ['supervisor@empresa.com', 'rrhh@empresa.com'],
      format: 'excel',
      template: 'attendance-summary'
    },
    {
      id: 2,
      name: 'Nómina Quincenal',
      description: 'Cálculo de nómina cada 15 días',
      schedule: 'biweekly',
      frequency: '1ro y 15 de cada mes a las 09:00',
      lastRun: new Date(2025, 0, 1, 9, 0),
      nextRun: new Date(2025, 0, 15, 9, 0),
      status: 'active',
      recipients: ['contabilidad@empresa.com', 'gerencia@empresa.com'],
      format: 'pdf',
      template: 'payroll-detailed'
    },
    {
      id: 3,
      name: 'Análisis Mensual de Incidentes',
      description: 'Reporte mensual de incidentes y tendencias',
      schedule: 'monthly',
      frequency: 'Primer día del mes a las 10:00',
      lastRun: new Date(2024, 11, 1, 10, 0),
      nextRun: new Date(2025, 1, 1, 10, 0),
      status: 'paused',
      recipients: ['seguridad@empresa.com', 'supervisor@empresa.com'],
      format: 'pdf',
      template: 'incident-analysis'
    },
    {
      id: 4,
      name: 'Dashboard Ejecutivo Diario',
      description: 'KPIs y métricas clave para la gerencia',
      schedule: 'daily',
      frequency: 'Diario a las 07:30',
      lastRun: new Date(2025, 0, 4, 7, 30),
      nextRun: new Date(2025, 0, 5, 7, 30),
      status: 'active',
      recipients: ['gerencia@empresa.com', 'direccion@empresa.com'],
      format: 'pdf',
      template: 'executive-dashboard'
    }
  ];

  const frequencyOptions = [
    { value: 'daily', label: 'Diario' },
    { value: 'weekly', label: 'Semanal' },
    { value: 'biweekly', label: 'Quincenal' },
    { value: 'monthly', label: 'Mensual' },
    { value: 'quarterly', label: 'Trimestral' }
  ];

  const formatOptions = [
    { value: 'excel', label: 'Excel (.xlsx)' },
    { value: 'pdf', label: 'PDF (.pdf)' },
    { value: 'csv', label: 'CSV (.csv)' }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'text-success bg-success/10';
      case 'paused':
        return 'text-warning bg-warning/10';
      case 'error':
        return 'text-error bg-error/10';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return 'Play';
      case 'paused':
        return 'Pause';
      case 'error':
        return 'AlertCircle';
      default:
        return 'Clock';
    }
  };

  const formatDateTime = (date) => {
    return date?.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const toggleReportStatus = (reportId) => {
    // In real implementation, this would make an API call
    console.log(`Toggling status for report ${reportId}`);
  };

  const runReportNow = (reportId) => {
    // In real implementation, this would trigger immediate report generation
    console.log(`Running report ${reportId} now`);
  };

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Reportes Programados</h2>
          <p className="text-sm text-muted-foreground">Automatiza la generación y distribución de reportes</p>
        </div>
        <Button
          variant="default"
          iconName="Plus"
          iconPosition="left"
          onClick={() => setShowCreateModal(true)}
        >
          Nuevo Reporte Programado
        </Button>
      </div>
      {/* Reports List */}
      <div className="space-y-4">
        {scheduledReports?.map((report) => (
          <div
            key={report?.id}
            className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors duration-150 ease-out-cubic"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="font-medium text-foreground">{report?.name}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(report?.status)}`}>
                    <Icon name={getStatusIcon(report?.status)} size={12} className="inline mr-1" />
                    {report?.status === 'active' ? 'Activo' : report?.status === 'paused' ? 'Pausado' : 'Error'}
                  </span>
                </div>
                
                <p className="text-sm text-muted-foreground mb-3">{report?.description}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <Icon name="Calendar" size={14} className="text-muted-foreground" />
                    <span className="text-foreground">{report?.frequency}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Icon name="Clock" size={14} className="text-muted-foreground" />
                    <span className="text-foreground">Último: {formatDateTime(report?.lastRun)}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Icon name="ArrowRight" size={14} className="text-muted-foreground" />
                    <span className="text-foreground">Próximo: {formatDateTime(report?.nextRun)}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Icon name="FileText" size={14} className="text-muted-foreground" />
                    <span className="text-foreground">{report?.format?.toUpperCase()}</span>
                  </div>
                </div>
                
                <div className="mt-3">
                  <div className="flex items-center space-x-2 mb-1">
                    <Icon name="Mail" size={14} className="text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">Destinatarios:</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {report?.recipients?.map((email, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded-md"
                      >
                        {email}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 ml-4">
                <Button
                  variant="outline"
                  size="sm"
                  iconName="Play"
                  onClick={() => runReportNow(report?.id)}
                >
                  Ejecutar Ahora
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  iconName={report?.status === 'active' ? 'Pause' : 'Play'}
                  onClick={() => toggleReportStatus(report?.id)}
                >
                  {report?.status === 'active' ? 'Pausar' : 'Activar'}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  iconName="Settings"
                  onClick={() => setSelectedReport(report)}
                >
                  Configurar
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {scheduledReports?.length === 0 && (
        <div className="text-center py-12">
          <Icon name="Calendar" size={48} className="mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No hay reportes programados</h3>
          <p className="text-muted-foreground mb-4">
            Crea tu primer reporte programado para automatizar la generación de informes
          </p>
          <Button onClick={() => setShowCreateModal(true)} iconName="Plus">
            Crear Reporte Programado
          </Button>
        </div>
      )}
      {/* Create/Edit Modal */}
      {(showCreateModal || selectedReport) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg border border-border w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">
                  {selectedReport ? 'Editar Reporte Programado' : 'Nuevo Reporte Programado'}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  iconName="X"
                  onClick={() => {
                    setShowCreateModal(false);
                    setSelectedReport(null);
                  }}
                />
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <Input
                label="Nombre del Reporte"
                placeholder="Ingresa el nombre del reporte"
                defaultValue={selectedReport?.name || ''}
              />
              
              <Input
                label="Descripción"
                placeholder="Describe el propósito del reporte"
                defaultValue={selectedReport?.description || ''}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Frecuencia"
                  options={frequencyOptions}
                  defaultValue={selectedReport?.schedule || 'weekly'}
                />
                
                <Select
                  label="Formato de Exportación"
                  options={formatOptions}
                  defaultValue={selectedReport?.format || 'excel'}
                />
              </div>
              
              <Input
                label="Destinatarios (separados por coma)"
                placeholder="email1@empresa.com, email2@empresa.com"
                defaultValue={selectedReport?.recipients?.join(', ') || ''}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Hora de Ejecución"
                  type="time"
                  defaultValue="08:00"
                />
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Opciones</label>
                  <div className="space-y-2">
                    <Checkbox label="Incluir archivos adjuntos" />
                    <Checkbox label="Notificar por email" defaultChecked />
                    <Checkbox label="Comprimir archivos grandes" />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-border flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateModal(false);
                  setSelectedReport(null);
                }}
              >
                Cancelar
              </Button>
              <Button variant="default">
                {selectedReport ? 'Actualizar' : 'Crear'} Reporte
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduledReports;