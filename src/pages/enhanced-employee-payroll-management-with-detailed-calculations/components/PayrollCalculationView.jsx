import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import CurrencyDisplay from '../../../components/ui/CurrencyDisplay';

const PayrollCalculationView = ({ 
  employee, 
  calculations = {}, 
  adjustments = [], 
  onSaveAdjustment,
  processing,
  currencyConfig,
  weekRange
}) => {
  const [newAdjustment, setNewAdjustment] = useState({
    type: 'bonus',
    category: 'performance',
    amount: '',
    description: ''
  });

  const adjustmentTypes = [
    { value: 'bonus', label: 'Bonificación' },
    { value: 'deduction', label: 'Deducción' }
  ];

  const adjustmentCategories = [
    { value: 'performance', label: 'Rendimiento' },
    { value: 'overtime_bonus', label: 'Bono Horas Extra' },
    { value: 'transport', label: 'Transporte' },
    { value: 'food', label: 'Alimentación' },
    { value: 'safety', label: 'Equipo Seguridad' },
    { value: 'advance', label: 'Anticipo' },
    { value: 'loan', label: 'Préstamo' },
    { value: 'other', label: 'Otro' }
  ];

  const handleAddAdjustment = () => {
    if (!newAdjustment?.amount || !newAdjustment?.description) return;

    const adjustment = {
      ...newAdjustment,
      amount: parseFloat(newAdjustment?.amount),
      employeeId: employee?.id
    };

    onSaveAdjustment?.(adjustment);

    // Reset form
    setNewAdjustment({
      type: 'bonus',
      category: 'performance',
      amount: '',
      description: ''
    });
  };

  // Calculate totals with adjustments
  const totalBonuses = adjustments
    ?.filter(adj => adj?.type === 'bonus')
    ?.reduce((sum, adj) => sum + (adj?.amount || 0), 0) || 0;

  const totalDeductions = adjustments
    ?.filter(adj => adj?.type === 'deduction')
    ?.reduce((sum, adj) => sum + (adj?.amount || 0), 0) || 0;

  const finalGrossPay = (calculations?.grossPay || 0) + totalBonuses;
  const finalNetPay = finalGrossPay - totalDeductions;

  const overtimeRate = employee?.dailySalary ? (employee?.dailySalary / 8 * 1.5) : 0;

  return (
    <div className="space-y-6">
      {/* Employee Header */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold text-foreground">
              {employee?.name}
            </h3>
            <p className="text-muted-foreground">
              {employee?.employeeCode} • {employee?.site}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Período</p>
            <p className="font-medium">
              {new Date(weekRange?.start)?.toLocaleDateString()} - {new Date(weekRange?.end)?.toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-2xl font-bold text-foreground">{calculations?.workedDays || 0}</p>
            <p className="text-xs text-muted-foreground">Días Trabajados</p>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-2xl font-bold text-foreground">{calculations?.regularHours || 0}h</p>
            <p className="text-xs text-muted-foreground">Horas Regulares</p>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-2xl font-bold text-primary">{calculations?.overtimeHours || 0}h</p>
            <p className="text-xs text-muted-foreground">Horas Extra</p>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <CurrencyDisplay 
              amount={employee?.dailySalary || 0}
              currency={currencyConfig?.currency}
              symbol={currencyConfig?.symbol}
              className="text-2xl font-bold text-foreground block"
            />
            <p className="text-xs text-muted-foreground">Salario Diario</p>
          </div>
        </div>
      </div>

      {/* Detailed Calculations */}
      <div className="bg-card border border-border rounded-lg">
        <div className="p-4 border-b border-border">
          <h4 className="text-lg font-semibold text-foreground flex items-center">
            <Icon name="Calculator" size={20} className="mr-2" />
            Cálculos Detallados
          </h4>
        </div>

        <div className="p-6 space-y-4">
          {/* Base Calculations */}
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2">
              <span className="text-muted-foreground">
                Pago Base ({calculations?.workedDays || 0} días × {currencyConfig?.symbol}{employee?.dailySalary || 0})
              </span>
              <CurrencyDisplay 
                amount={calculations?.basePay || 0}
                currency={currencyConfig?.currency}
                symbol={currencyConfig?.symbol}
                className="font-medium"
              />
            </div>

            <div className="flex justify-between items-center py-2">
              <span className="text-muted-foreground">
                Horas Extra ({calculations?.overtimeHours || 0}h × {currencyConfig?.symbol}{overtimeRate?.toFixed(2)})
              </span>
              <CurrencyDisplay 
                amount={calculations?.overtimePay || 0}
                currency={currencyConfig?.currency}
                symbol={currencyConfig?.symbol}
                className="font-medium text-primary"
              />
            </div>

            <div className="border-t border-border pt-2">
              <div className="flex justify-between items-center py-2">
                <span className="font-medium">Subtotal</span>
                <CurrencyDisplay 
                  amount={calculations?.grossPay || 0}
                  currency={currencyConfig?.currency}
                  symbol={currencyConfig?.symbol}
                  className="font-semibold"
                />
              </div>
            </div>

            {/* Adjustments */}
            {totalBonuses > 0 && (
              <div className="flex justify-between items-center py-2">
                <span className="text-success">+ Bonificaciones</span>
                <CurrencyDisplay 
                  amount={totalBonuses}
                  currency={currencyConfig?.currency}
                  symbol={currencyConfig?.symbol}
                  className="font-medium text-success"
                />
              </div>
            )}

            {totalDeductions > 0 && (
              <div className="flex justify-between items-center py-2">
                <span className="text-destructive">- Deducciones</span>
                <CurrencyDisplay 
                  amount={totalDeductions}
                  currency={currencyConfig?.currency}
                  symbol={currencyConfig?.symbol}
                  className="font-medium text-destructive"
                />
              </div>
            )}

            {/* Final Totals */}
            <div className="border-t-2 border-border pt-3 space-y-2">
              <div className="flex justify-between items-center py-1">
                <span className="font-semibold">Salario Bruto</span>
                <CurrencyDisplay 
                  amount={finalGrossPay}
                  currency={currencyConfig?.currency}
                  symbol={currencyConfig?.symbol}
                  className="font-bold text-lg"
                />
              </div>
              
              <div className="flex justify-between items-center py-1">
                <span className="font-semibold text-primary">Salario Neto</span>
                <CurrencyDisplay 
                  amount={finalNetPay}
                  currency={currencyConfig?.currency}
                  symbol={currencyConfig?.symbol}
                  className="font-bold text-xl text-primary"
                />
              </div>
            </div>
          </div>

          {/* Formula Explanation */}
          <div className="bg-muted/50 rounded-lg p-4 mt-6">
            <h5 className="text-sm font-semibold text-foreground mb-2">Fórmulas de Cálculo:</h5>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• Pago Base = Días Trabajados × Salario Diario</p>
              <p>• Tarifa Hora Extra = (Salario Diario ÷ 8) × 1.5</p>
              <p>• Pago Horas Extra = Horas Extra × Tarifa Hora Extra</p>
              <p>• Salario Neto = Salario Bruto + Bonificaciones - Deducciones</p>
            </div>
          </div>
        </div>
      </div>

      {/* Manual Adjustments */}
      <div className="bg-card border border-border rounded-lg">
        <div className="p-4 border-b border-border">
          <h4 className="text-lg font-semibold text-foreground flex items-center">
            <Icon name="Edit" size={20} className="mr-2" />
            Ajustes Manuales
          </h4>
        </div>

        <div className="p-6">
          {/* Add New Adjustment */}
          <div className="bg-muted/50 rounded-lg p-4 mb-4">
            <h5 className="font-medium text-foreground mb-3">Agregar Ajuste</h5>
            
            <div className="grid grid-cols-2 gap-3 mb-3">
              <Select
                label="Tipo"
                options={adjustmentTypes}
                value={newAdjustment?.type}
                onChange={(value) => setNewAdjustment(prev => ({ ...prev, type: value }))}
              />
              
              <Select
                label="Categoría"
                options={adjustmentCategories}
                value={newAdjustment?.category}
                onChange={(value) => setNewAdjustment(prev => ({ ...prev, category: value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <Input
                label="Monto"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={newAdjustment?.amount}
                onChange={(e) => setNewAdjustment(prev => ({ ...prev, amount: e?.target?.value }))}
              />
              
              <Input
                label="Descripción"
                placeholder="Motivo del ajuste"
                value={newAdjustment?.description}
                onChange={(e) => setNewAdjustment(prev => ({ ...prev, description: e?.target?.value }))}
              />
            </div>

            <Button
              variant="default"
              iconName="Plus"
              onClick={handleAddAdjustment}
              disabled={!newAdjustment?.amount || !newAdjustment?.description || processing}
            >
              Agregar Ajuste
            </Button>
          </div>

          {/* Existing Adjustments */}
          {adjustments?.length > 0 && (
            <div className="space-y-2">
              <h5 className="font-medium text-foreground mb-2">Ajustes Aplicados</h5>
              {adjustments?.map((adjustment) => (
                <div 
                  key={adjustment?.id} 
                  className="flex items-center justify-between p-3 bg-background border border-border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        adjustment?.type === 'bonus' ?'bg-success/10 text-success' :'bg-destructive/10 text-destructive'
                      }`}>
                        {adjustment?.type === 'bonus' ? 'Bonificación' : 'Deducción'}
                      </span>
                      <span className="text-sm font-medium">
                        {adjustmentCategories?.find(cat => cat?.value === adjustment?.category)?.label}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {adjustment?.description}
                    </p>
                  </div>
                  
                  <CurrencyDisplay 
                    amount={adjustment?.amount}
                    currency={currencyConfig?.currency}
                    symbol={currencyConfig?.symbol}
                    className={`font-semibold ${
                      adjustment?.type === 'bonus' ? 'text-success' : 'text-destructive'
                    }`}
                    showSign
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PayrollCalculationView;