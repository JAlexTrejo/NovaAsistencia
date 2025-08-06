import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';

const PayrollCalculationEngine = ({ 
  selectedEmployee, 
  onCalculationUpdate,
  attendanceData = {},
  onSaveAdjustments 
}) => {
  const [calculations, setCalculations] = useState({
    regularHours: 0,
    overtimeHours: 0,
    regularPay: 0,
    overtimePay: 0,
    bonuses: 0,
    deductions: 0,
    grossPay: 0,
    netPay: 0
  });

  const [adjustments, setAdjustments] = useState([]);
  const [newAdjustment, setNewAdjustment] = useState({
    type: 'bonus',
    amount: '',
    description: '',
    category: 'performance'
  });

  const adjustmentTypes = [
    { value: 'bonus', label: 'Bono' },
    { value: 'deduction', label: 'Deducción' }
  ];

  const adjustmentCategories = [
    { value: 'performance', label: 'Rendimiento' },
    { value: 'overtime_bonus', label: 'Bono Horas Extra' },
    { value: 'transport', label: 'Transporte' },
    { value: 'food', label: 'Alimentación' },
    { value: 'safety_equipment', label: 'Equipo de Seguridad' },
    { value: 'advance', label: 'Anticipo' },
    { value: 'loan', label: 'Préstamo' },
    { value: 'insurance', label: 'Seguro' },
    { value: 'other', label: 'Otro' }
  ];

  useEffect(() => {
    if (selectedEmployee && attendanceData) {
      calculatePayroll();
    }
  }, [selectedEmployee, attendanceData, adjustments]);

  const calculatePayroll = () => {
    if (!selectedEmployee) return;

    const dailyWage = selectedEmployee?.dailyWage || 250;
    const workedDays = attendanceData?.workedDays || 0;
    const overtimeHours = attendanceData?.overtimeHours || 0;
    const overtimeRate = dailyWage / 8 * 1.5; // 1.5x rate for overtime

    const regularPay = dailyWage * workedDays;
    const overtimePay = overtimeHours * overtimeRate;

    const totalBonuses = adjustments?.filter(adj => adj?.type === 'bonus')?.reduce((sum, adj) => sum + parseFloat(adj?.amount || 0), 0);

    const totalDeductions = adjustments?.filter(adj => adj?.type === 'deduction')?.reduce((sum, adj) => sum + parseFloat(adj?.amount || 0), 0);

    const grossPay = regularPay + overtimePay + totalBonuses;
    const netPay = grossPay - totalDeductions;

    const newCalculations = {
      regularHours: workedDays * 8,
      overtimeHours,
      regularPay,
      overtimePay,
      bonuses: totalBonuses,
      deductions: totalDeductions,
      grossPay,
      netPay
    };

    setCalculations(newCalculations);
    onCalculationUpdate && onCalculationUpdate(newCalculations);
  };

  const handleAddAdjustment = () => {
    if (!newAdjustment?.amount || !newAdjustment?.description) return;

    const adjustment = {
      id: Date.now(),
      ...newAdjustment,
      amount: parseFloat(newAdjustment?.amount),
      timestamp: new Date(),
      user: 'Admin Usuario'
    };

    setAdjustments([...adjustments, adjustment]);
    setNewAdjustment({
      type: 'bonus',
      amount: '',
      description: '',
      category: 'performance'
    });
  };

  const handleRemoveAdjustment = (id) => {
    setAdjustments(adjustments?.filter(adj => adj?.id !== id));
  };

  const handleSaveAll = () => {
    onSaveAdjustments && onSaveAdjustments({
      employeeId: selectedEmployee?.id,
      calculations,
      adjustments
    });
  };

  if (!selectedEmployee) {
    return (
      <div className="bg-card border border-border rounded-lg p-8 text-center">
        <Icon name="Calculator" size={48} className="mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Motor de Cálculo de Nómina
        </h3>
        <p className="text-muted-foreground">
          Selecciona un empleado para comenzar los cálculos de nómina
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Cálculo de Nómina
            </h3>
            <p className="text-sm text-muted-foreground">
              {selectedEmployee?.name} - {selectedEmployee?.position}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              iconName="RefreshCw"
              onClick={calculatePayroll}
            >
              Recalcular
            </Button>
            <Button
              variant="default"
              iconName="Save"
              onClick={handleSaveAll}
            >
              Guardar
            </Button>
          </div>
        </div>
      </div>
      {/* Calculation Summary */}
      <div className="p-6 border-b border-border">
        <h4 className="text-md font-semibold text-foreground mb-4">
          Resumen de Cálculos
        </h4>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Horas Regulares:</span>
              <span className="font-medium">{calculations?.regularHours}h</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Horas Extra:</span>
              <span className="font-medium">{calculations?.overtimeHours}h</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Pago Regular:</span>
              <span className="font-medium">${calculations?.regularPay?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Pago Horas Extra:</span>
              <span className="font-medium">${calculations?.overtimePay?.toLocaleString()}</span>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Bonos:</span>
              <span className="font-medium text-success">+${calculations?.bonuses?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Deducciones:</span>
              <span className="font-medium text-error">-${calculations?.deductions?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Pago Bruto:</span>
              <span className="font-medium">${calculations?.grossPay?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center border-t border-border pt-2">
              <span className="text-md font-semibold text-foreground">Pago Neto:</span>
              <span className="text-lg font-bold text-primary">${calculations?.netPay?.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Calculation Formula */}
        <div className="bg-muted rounded-lg p-4">
          <h5 className="text-sm font-semibold text-foreground mb-2">Fórmula de Cálculo:</h5>
          <p className="text-xs text-muted-foreground">
            Pago Neto = (Días Trabajados × Salario Diario) + (Horas Extra × Tarifa Extra) + Bonos - Deducciones
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Tarifa Extra = (Salario Diario ÷ 8) × 1.5
          </p>
        </div>
      </div>
      {/* Manual Adjustments */}
      <div className="p-6">
        <h4 className="text-md font-semibold text-foreground mb-4">
          Ajustes Manuales
        </h4>

        {/* Add New Adjustment */}
        <div className="bg-muted rounded-lg p-4 mb-4">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <Select
              label="Tipo"
              options={adjustmentTypes}
              value={newAdjustment?.type}
              onChange={(value) => setNewAdjustment({...newAdjustment, type: value})}
            />
            <Select
              label="Categoría"
              options={adjustmentCategories}
              value={newAdjustment?.category}
              onChange={(value) => setNewAdjustment({...newAdjustment, category: value})}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <Input
              label="Monto"
              type="number"
              placeholder="0.00"
              value={newAdjustment?.amount}
              onChange={(e) => setNewAdjustment({...newAdjustment, amount: e?.target?.value})}
            />
            <Input
              label="Descripción"
              placeholder="Motivo del ajuste"
              value={newAdjustment?.description}
              onChange={(e) => setNewAdjustment({...newAdjustment, description: e?.target?.value})}
            />
          </div>

          <Button
            variant="outline"
            iconName="Plus"
            onClick={handleAddAdjustment}
            disabled={!newAdjustment?.amount || !newAdjustment?.description}
          >
            Agregar Ajuste
          </Button>
        </div>

        {/* Adjustments List */}
        {adjustments?.length > 0 && (
          <div className="space-y-2">
            {adjustments?.map((adjustment) => (
              <div key={adjustment?.id} className="flex items-center justify-between p-3 bg-background border border-border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      adjustment?.type === 'bonus' ?'bg-success/10 text-success' :'bg-error/10 text-error'
                    }`}>
                      {adjustment?.type === 'bonus' ? 'Bono' : 'Deducción'}
                    </span>
                    <span className="text-sm font-medium">
                      {adjustmentCategories?.find(cat => cat?.value === adjustment?.category)?.label}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {adjustment?.description}
                  </p>
                </div>
                
                <div className="flex items-center space-x-3">
                  <span className={`text-lg font-semibold ${
                    adjustment?.type === 'bonus' ? 'text-success' : 'text-error'
                  }`}>
                    {adjustment?.type === 'bonus' ? '+' : '-'}${adjustment?.amount?.toLocaleString()}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    iconName="Trash2"
                    onClick={() => handleRemoveAdjustment(adjustment?.id)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PayrollCalculationEngine;