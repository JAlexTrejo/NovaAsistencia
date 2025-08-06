import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';

const BulkProcessingTools = ({ 
  selectedEmployees = [], 
  onBulkProcess,
  onExport,
  processingStatus = null
}) => {
  const [bulkAction, setBulkAction] = useState('calculate');
  const [exportFormat, setExportFormat] = useState('excel');
  const [isProcessing, setIsProcessing] = useState(false);

  const bulkActions = [
    { value: 'calculate', label: 'Calcular Nómina', icon: 'Calculator' },
    { value: 'approve', label: 'Aprobar Nómina', icon: 'CheckCircle' },
    { value: 'generate_receipts', label: 'Generar Recibos', icon: 'FileText' },
    { value: 'mark_paid', label: 'Marcar como Pagado', icon: 'CreditCard' }
  ];

  const exportFormats = [
    { value: 'excel', label: 'Excel (.xlsx)', icon: 'FileSpreadsheet' },
    { value: 'csv', label: 'CSV (.csv)', icon: 'FileText' },
    { value: 'pdf', label: 'PDF (.pdf)', icon: 'FileImage' }
  ];

  const handleBulkProcess = async () => {
    if (selectedEmployees?.length === 0) return;
    
    setIsProcessing(true);
    try {
      await onBulkProcess(bulkAction, selectedEmployees);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExport = () => {
    onExport && onExport(exportFormat, selectedEmployees);
  };

  const getActionIcon = (action) => {
    const actionObj = bulkActions?.find(a => a?.value === action);
    return actionObj ? actionObj?.icon : 'Settings';
  };

  const getActionLabel = (action) => {
    const actionObj = bulkActions?.find(a => a?.value === action);
    return actionObj ? actionObj?.label : action;
  };

  return (
    <div className="bg-card border border-border rounded-lg">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Procesamiento Masivo
            </h3>
            <p className="text-sm text-muted-foreground">
              {selectedEmployees?.length} empleados seleccionados
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Icon name="Users" size={20} className="text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">
              {selectedEmployees?.length}
            </span>
          </div>
        </div>
      </div>
      {/* Bulk Actions */}
      <div className="p-6 border-b border-border">
        <h4 className="text-md font-semibold text-foreground mb-4">
          Acciones Masivas
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <Select
            label="Seleccionar Acción"
            options={bulkActions}
            value={bulkAction}
            onChange={setBulkAction}
          />
          <div className="flex items-end">
            <Button
              variant="default"
              iconName={getActionIcon(bulkAction)}
              onClick={handleBulkProcess}
              disabled={selectedEmployees?.length === 0 || isProcessing}
              loading={isProcessing}
              fullWidth
            >
              {getActionLabel(bulkAction)}
            </Button>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {bulkActions?.map((action) => (
            <Button
              key={action?.value}
              variant="outline"
              size="sm"
              iconName={action?.icon}
              onClick={() => {
                setBulkAction(action?.value);
                handleBulkProcess();
              }}
              disabled={selectedEmployees?.length === 0 || isProcessing}
            >
              {action?.label}
            </Button>
          ))}
        </div>
      </div>
      {/* Export Tools */}
      <div className="p-6 border-b border-border">
        <h4 className="text-md font-semibold text-foreground mb-4">
          Herramientas de Exportación
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <Select
            label="Formato de Exportación"
            options={exportFormats}
            value={exportFormat}
            onChange={setExportFormat}
          />
          <div className="flex items-end">
            <Button
              variant="outline"
              iconName="Download"
              onClick={handleExport}
              disabled={selectedEmployees?.length === 0}
              fullWidth
            >
              Exportar Datos
            </Button>
          </div>
        </div>

        {/* Export Templates */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <Button
            variant="ghost"
            size="sm"
            iconName="FileSpreadsheet"
            onClick={() => {
              setExportFormat('excel');
              handleExport();
            }}
          >
            Reporte Completo
          </Button>
          <Button
            variant="ghost"
            size="sm"
            iconName="FileText"
            onClick={() => {
              setExportFormat('pdf');
              handleExport();
            }}
          >
            Recibos de Pago
          </Button>
          <Button
            variant="ghost"
            size="sm"
            iconName="FileImage"
            onClick={() => {
              setExportFormat('csv');
              handleExport();
            }}
          >
            Datos para Contabilidad
          </Button>
        </div>
      </div>
      {/* Processing Status */}
      {processingStatus && (
        <div className="p-6 border-b border-border">
          <h4 className="text-md font-semibold text-foreground mb-4">
            Estado del Procesamiento
          </h4>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${
                  processingStatus?.status === 'completed' ? 'bg-success' :
                  processingStatus?.status === 'processing' ? 'bg-warning animate-pulse' :
                  processingStatus?.status === 'error' ? 'bg-error' : 'bg-muted-foreground'
                }`}></div>
                <span className="text-sm font-medium text-foreground">
                  {processingStatus?.action}
                </span>
              </div>
              <span className="text-sm text-muted-foreground">
                {processingStatus?.processed}/{processingStatus?.total}
              </span>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  processingStatus?.status === 'completed' ? 'bg-success' :
                  processingStatus?.status === 'error' ? 'bg-error' : 'bg-primary'
                }`}
                style={{ 
                  width: `${(processingStatus?.processed / processingStatus?.total) * 100}%` 
                }}
              ></div>
            </div>
            
            {processingStatus?.message && (
              <p className="text-sm text-muted-foreground">
                {processingStatus?.message}
              </p>
            )}
          </div>
        </div>
      )}
      {/* Statistics */}
      <div className="p-6">
        <h4 className="text-md font-semibold text-foreground mb-4">
          Estadísticas de Selección
        </h4>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-primary mb-1">
              {selectedEmployees?.length}
            </div>
            <div className="text-xs text-muted-foreground">
              Empleados
            </div>
          </div>
          
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-success mb-1">
              ${(selectedEmployees?.length * 5200)?.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">
              Nómina Estimada
            </div>
          </div>
          
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-warning mb-1">
              {Math.floor(selectedEmployees?.length * 0.3)}
            </div>
            <div className="text-xs text-muted-foreground">
              Pendientes
            </div>
          </div>
          
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-accent mb-1">
              {Math.floor(selectedEmployees?.length * 0.7)}
            </div>
            <div className="text-xs text-muted-foreground">
              Calculados
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkProcessingTools;