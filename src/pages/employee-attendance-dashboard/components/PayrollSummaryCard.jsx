import React from 'react';
import Icon from '../../../components/AppIcon';

const PayrollSummaryCard = ({ 
  payrollData = null,
  currency = '€',
  onViewDetails = () => {}
}) => {
  // Mock payroll data
  const mockPayrollData = {
    weeklyEstimate: 456.75,
    regularHours: 32.5,
    regularRate: 12.50,
    regularPay: 406.25,
    overtimeHours: 4.0,
    overtimeRate: 18.75,
    overtimePay: 75.00,
    bonuses: 25.00,
    deductions: 49.50,
    incidentDeductions: 24.50,
    taxDeductions: 25.00,
    netPay: 432.25,
    payPeriod: 'Semana del 27 Ene - 31 Ene 2025',
    lastUpdated: new Date()
  };

  const data = payrollData || mockPayrollData;

  const formatCurrency = (amount) => {
    return `${currency}${amount?.toFixed(2)}`;
  };

  const getPayrollStatus = () => {
    const currentDay = new Date()?.getDay();
    if (currentDay >= 1 && currentDay <= 5) {
      return {
        status: 'calculating',
        message: 'Calculando en tiempo real',
        color: 'text-primary'
      };
    } else {
      return {
        status: 'final',
        message: 'Cálculo final disponible',
        color: 'text-success'
      };
    }
  };

  const payrollStatus = getPayrollStatus();

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-primary/5 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Icon name="Calculator" size={20} className="text-primary" />
            <h3 className="text-lg font-semibold text-foreground">
              Estimación de Nómina
            </h3>
          </div>
          <div className={`flex items-center space-x-1 text-sm ${payrollStatus?.color}`}>
            <Icon name="Clock" size={16} />
            <span>{payrollStatus?.message}</span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {data?.payPeriod}
        </p>
      </div>
      {/* Main Amount */}
      <div className="px-6 py-6 text-center bg-gradient-to-br from-primary/5 to-transparent">
        <div className="text-4xl font-bold text-foreground mb-2">
          {formatCurrency(data?.netPay)}
        </div>
        <div className="text-sm text-muted-foreground">
          Pago neto estimado
        </div>
      </div>
      {/* Breakdown */}
      <div className="px-6 py-4 space-y-4">
        {/* Regular Hours */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Icon name="Clock" size={16} className="text-muted-foreground" />
            <span className="text-sm text-foreground">
              Horas regulares ({data?.regularHours}h)
            </span>
          </div>
          <span className="text-sm font-medium text-foreground">
            {formatCurrency(data?.regularPay)}
          </span>
        </div>

        {/* Overtime Hours */}
        {data?.overtimeHours > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Icon name="Zap" size={16} className="text-warning" />
              <span className="text-sm text-foreground">
                Horas extra ({data?.overtimeHours}h)
              </span>
            </div>
            <span className="text-sm font-medium text-warning">
              +{formatCurrency(data?.overtimePay)}
            </span>
          </div>
        )}

        {/* Bonuses */}
        {data?.bonuses > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Icon name="Gift" size={16} className="text-success" />
              <span className="text-sm text-foreground">Bonificaciones</span>
            </div>
            <span className="text-sm font-medium text-success">
              +{formatCurrency(data?.bonuses)}
            </span>
          </div>
        )}

        {/* Deductions */}
        {data?.deductions > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Icon name="Minus" size={16} className="text-error" />
                <span className="text-sm text-foreground">Deducciones</span>
              </div>
              <span className="text-sm font-medium text-error">
                -{formatCurrency(data?.deductions)}
              </span>
            </div>
            
            {/* Deduction Details */}
            <div className="ml-6 space-y-1">
              {data?.incidentDeductions > 0 && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Incidentes</span>
                  <span className="text-error">
                    -{formatCurrency(data?.incidentDeductions)}
                  </span>
                </div>
              )}
              {data?.taxDeductions > 0 && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Impuestos</span>
                  <span className="text-error">
                    -{formatCurrency(data?.taxDeductions)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {/* Divider */}
      <div className="px-6">
        <div className="border-t border-border"></div>
      </div>
      {/* Net Pay */}
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <span className="text-base font-semibold text-foreground">
            Total Neto
          </span>
          <span className="text-xl font-bold text-primary">
            {formatCurrency(data?.netPay)}
          </span>
        </div>
      </div>
      {/* Footer Actions */}
      <div className="px-6 py-4 bg-muted/30 border-t border-border">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Actualizado: {data?.lastUpdated?.toLocaleTimeString('es-ES', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
          <button
            onClick={onViewDetails}
            className="text-primary hover:text-primary/80 font-medium transition-colors duration-150 ease-out-cubic"
          >
            Ver detalles
          </button>
        </div>
      </div>
      {/* Rate Information */}
      <div className="px-6 py-3 bg-muted/20 border-t border-border">
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-muted-foreground">Tarifa regular:</span>
            <span className="ml-1 font-medium text-foreground">
              {formatCurrency(data?.regularRate)}/h
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Tarifa extra:</span>
            <span className="ml-1 font-medium text-foreground">
              {formatCurrency(data?.overtimeRate)}/h
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayrollSummaryCard;