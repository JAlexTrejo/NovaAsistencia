import React from 'react';
import Icon from '../../../components/AppIcon';
import CurrencyDisplay from '../../../components/ui/CurrencyDisplay';

const EmployeeSelectionGrid = ({ 
  employees = [], 
  selectedEmployee, 
  onEmployeeSelect,
  processing,
  currencyConfig
}) => {

  const handleEmployeeClick = (employee) => {
    if (processing) return;
    onEmployeeSelect?.(employee);
  };

  return (
    <div className="bg-card border border-border rounded-lg">
      <div className="p-4 border-b border-border">
        <h3 className="text-lg font-semibold text-foreground flex items-center">
          <Icon name="Users" size={20} className="mr-2" />
          Empleados ({employees?.length || 0})
        </h3>
      </div>

      <div className="p-4">
        {employees?.length === 0 ? (
          <div className="text-center py-8">
            <Icon name="Users" size={32} className="mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No hay empleados disponibles</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {employees?.map((employee) => (
              <div
                key={employee?.id}
                onClick={() => handleEmployeeClick(employee)}
                className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-sm ${
                  selectedEmployee?.id === employee?.id
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border hover:border-primary/50'
                } ${processing ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-foreground truncate">
                      {employee?.name}
                    </h4>
                    <p className="text-sm text-muted-foreground truncate">
                      {employee?.employeeCode} • {employee?.site}
                    </p>
                  </div>
                  
                  {selectedEmployee?.id === employee?.id && (
                    <Icon 
                      name="Check" 
                      size={16} 
                      className="text-primary flex-shrink-0 ml-2" 
                    />
                  )}
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Días:</span>
                    <span className="ml-1 font-medium">
                      {employee?.workedDays || 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">H. Extra:</span>
                    <span className="ml-1 font-medium">
                      {employee?.overtimeHours || 0}h
                    </span>
                  </div>
                </div>

                <div className="mt-2 pt-2 border-t border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Salario Bruto:</span>
                    <CurrencyDisplay 
                      amount={employee?.grossPay || 0}
                      currency={currencyConfig?.currency}
                      symbol={currencyConfig?.symbol}
                      className="text-sm font-semibold text-foreground"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeSelectionGrid;