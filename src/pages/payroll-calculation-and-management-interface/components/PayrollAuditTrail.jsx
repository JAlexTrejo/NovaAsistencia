import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';

const PayrollAuditTrail = ({ auditLogs = [] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('all');
  const [filterUser, setFilterUser] = useState('all');

  // Mock audit trail data
  const mockAuditLogs = [
    {
      id: 1,
      timestamp: new Date('2025-01-04T14:30:00'),
      user: 'Ana Martínez',
      action: 'manual_adjustment',
      description: 'Agregó bono de rendimiento de $500 a Juan Pérez',
      employeeId: 'EMP001',
      employeeName: 'Juan Pérez',
      details: {
        type: 'bonus',
        amount: 500,
        category: 'performance',
        justification: 'Excelente desempeño en proyecto urgente'
      }
    },
    {
      id: 2,
      timestamp: new Date('2025-01-04T13:15:00'),
      user: 'Carlos Rodríguez',
      action: 'payroll_calculation',
      description: 'Calculó nómina semanal para 25 empleados',
      employeeId: 'BULK',
      employeeName: 'Múltiples empleados',
      details: {
        employeeCount: 25,
        totalAmount: 125000,
        period: 'Semana 1, Enero 2025'
      }
    },
    {
      id: 3,
      timestamp: new Date('2025-01-04T12:45:00'),
      user: 'Ana Martínez',
      action: 'deduction_added',
      description: 'Agregó deducción por anticipo de $300 a María González',
      employeeId: 'EMP002',
      employeeName: 'María González',
      details: {
        type: 'deduction',
        amount: 300,
        category: 'advance',
        justification: 'Anticipo solicitado por empleado'
      }
    },
    {
      id: 4,
      timestamp: new Date('2025-01-04T11:20:00'),
      user: 'Sistema',
      action: 'overtime_calculation',
      description: 'Calculó automáticamente 12 horas extra para Pedro Sánchez',
      employeeId: 'EMP003',
      employeeName: 'Pedro Sánchez',
      details: {
        overtimeHours: 12,
        rate: 46.875,
        totalAmount: 562.5
      }
    },
    {
      id: 5,
      timestamp: new Date('2025-01-04T10:00:00'),
      user: 'Carlos Rodríguez',
      action: 'payroll_approval',
      description: 'Aprobó nómina de Luis Fernández',
      employeeId: 'EMP004',
      employeeName: 'Luis Fernández',
      details: {
        grossPay: 5775,
        netPay: 5198,
        status: 'approved'
      }
    }
  ];

  const actionTypes = [
    { value: 'all', label: 'Todas las Acciones' },
    { value: 'manual_adjustment', label: 'Ajuste Manual' },
    { value: 'payroll_calculation', label: 'Cálculo de Nómina' },
    { value: 'deduction_added', label: 'Deducción Agregada' },
    { value: 'overtime_calculation', label: 'Cálculo Horas Extra' },
    { value: 'payroll_approval', label: 'Aprobación de Nómina' }
  ];

  const users = [
    { value: 'all', label: 'Todos los Usuarios' },
    { value: 'Ana Martínez', label: 'Ana Martínez' },
    { value: 'Carlos Rodríguez', label: 'Carlos Rodríguez' },
    { value: 'Sistema', label: 'Sistema' }
  ];

  const actionIcons = {
    manual_adjustment: 'Edit',
    payroll_calculation: 'Calculator',
    deduction_added: 'Minus',
    overtime_calculation: 'Clock',
    payroll_approval: 'CheckCircle',
    default: 'Activity'
  };

  const actionColors = {
    manual_adjustment: 'text-warning',
    payroll_calculation: 'text-primary',
    deduction_added: 'text-error',
    overtime_calculation: 'text-accent',
    payroll_approval: 'text-success',
    default: 'text-muted-foreground'
  };

  const activeLogs = auditLogs?.length > 0 ? auditLogs : mockAuditLogs;

  const filteredLogs = activeLogs?.filter(log => {
    const matchesSearch = log?.description?.toLowerCase()?.includes(searchTerm?.toLowerCase()) ||
                         log?.employeeName?.toLowerCase()?.includes(searchTerm?.toLowerCase()) ||
                         log?.user?.toLowerCase()?.includes(searchTerm?.toLowerCase());
    const matchesAction = filterAction === 'all' || log?.action === filterAction;
    const matchesUser = filterUser === 'all' || log?.user === filterUser;
    
    return matchesSearch && matchesAction && matchesUser;
  });

  const formatTimestamp = (timestamp) => {
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })?.format(timestamp);
  };

  const getActionLabel = (action) => {
    const actionType = actionTypes?.find(type => type?.value === action);
    return actionType ? actionType?.label : action;
  };

  return (
    <div className="bg-card border border-border rounded-lg">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Registro de Auditoría
            </h3>
            <p className="text-sm text-muted-foreground">
              Historial de todas las modificaciones de nómina
            </p>
          </div>
          <Button
            variant="outline"
            iconName="Download"
          >
            Exportar Registro
          </Button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            placeholder="Buscar en registro..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e?.target?.value)}
            iconName="Search"
          />
          <Select
            options={actionTypes}
            value={filterAction}
            onChange={setFilterAction}
            placeholder="Filtrar por acción"
          />
          <Select
            options={users}
            value={filterUser}
            onChange={setFilterUser}
            placeholder="Filtrar por usuario"
          />
        </div>
      </div>
      {/* Audit Log List */}
      <div className="max-h-96 overflow-y-auto">
        {filteredLogs?.length === 0 ? (
          <div className="p-8 text-center">
            <Icon name="FileText" size={48} className="mx-auto text-muted-foreground mb-4" />
            <h4 className="text-lg font-semibold text-foreground mb-2">
              No hay registros
            </h4>
            <p className="text-muted-foreground">
              No se encontraron registros de auditoría con los filtros aplicados
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredLogs?.map((log) => (
              <div key={log?.id} className="p-4 hover:bg-muted/50 transition-colors duration-150">
                <div className="flex items-start space-x-4">
                  {/* Action Icon */}
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center ${
                    actionColors?.[log?.action] || actionColors?.default
                  }`}>
                    <Icon 
                      name={actionIcons?.[log?.action] || actionIcons?.default} 
                      size={16} 
                    />
                  </div>

                  {/* Log Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-foreground">
                          {getActionLabel(log?.action)}
                        </span>
                        <span className="px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full">
                          {log?.employeeId}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatTimestamp(log?.timestamp)}
                      </span>
                    </div>

                    <p className="text-sm text-foreground mb-2">
                      {log?.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <span>
                          <Icon name="User" size={12} className="inline mr-1" />
                          {log?.user}
                        </span>
                        <span>
                          <Icon name="UserCheck" size={12} className="inline mr-1" />
                          {log?.employeeName}
                        </span>
                      </div>

                      {/* Additional Details */}
                      {log?.details && (
                        <div className="text-xs text-muted-foreground">
                          {log?.details?.amount && (
                            <span className={`font-medium ${
                              log?.details?.type === 'bonus' ? 'text-success' : 
                              log?.details?.type === 'deduction'? 'text-error' : 'text-foreground'
                            }`}>
                              {log?.details?.type === 'bonus' ? '+' : 
                               log?.details?.type === 'deduction' ? '-' : ''}
                              ${log?.details?.amount?.toLocaleString()}
                            </span>
                          )}
                          {log?.details?.employeeCount && (
                            <span className="font-medium text-foreground">
                              {log?.details?.employeeCount} empleados
                            </span>
                          )}
                          {log?.details?.overtimeHours && (
                            <span className="font-medium text-foreground">
                              {log?.details?.overtimeHours}h extra
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Justification */}
                    {log?.details?.justification && (
                      <div className="mt-2 p-2 bg-muted rounded text-xs text-muted-foreground">
                        <Icon name="MessageSquare" size={12} className="inline mr-1" />
                        {log?.details?.justification}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Footer */}
      <div className="p-4 border-t border-border bg-muted/50">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Mostrando {filteredLogs?.length} de {activeLogs?.length} registros
          </span>
          <span>
            Última actualización: {formatTimestamp(new Date())}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PayrollAuditTrail;