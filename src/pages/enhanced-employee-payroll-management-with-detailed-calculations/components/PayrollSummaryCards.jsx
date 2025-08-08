import React from 'react';
import Icon from '../../../components/AppIcon';
import CurrencyDisplay from '../../../components/ui/CurrencyDisplay';

const PayrollSummaryCards = ({ employees = [], currencyConfig, weekRange }) => {
  // Calculate totals
  const totalEmployees = employees?.length || 0;
  const totalWorkedDays = employees?.reduce((sum, emp) => sum + (emp?.workedDays || 0), 0);
  const totalRegularHours = employees?.reduce((sum, emp) => sum + (emp?.regularHours || 0), 0);
  const totalOvertimeHours = employees?.reduce((sum, emp) => sum + (emp?.overtimeHours || 0), 0);
  const totalGrossPay = employees?.reduce((sum, emp) => sum + (emp?.grossPay || 0), 0);

  const averageWorkedDays = totalEmployees > 0 ? (totalWorkedDays / totalEmployees) : 0;

  const summaryCards = [
    {
      title: 'Total Empleados',
      value: totalEmployees,
      icon: 'Users',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      format: 'number'
    },
    {
      title: 'Días Trabajados',
      value: totalWorkedDays,
      subtitle: `Promedio: ${averageWorkedDays?.toFixed(1)} días`,
      icon: 'Calendar',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      format: 'number'
    },
    {
      title: 'Horas Regulares',
      value: totalRegularHours,
      subtitle: `${totalOvertimeHours}h extras`,
      icon: 'Clock',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      format: 'hours'
    },
    {
      title: 'Nómina Total',
      value: totalGrossPay,
      subtitle: `Semana ${new Date(weekRange?.start)?.toLocaleDateString()}`,
      icon: 'DollarSign',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      format: 'currency'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {summaryCards?.map((card, index) => (
        <div key={index} className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground">
                {card?.title}
              </p>
              <div className="mt-1">
                {card?.format === 'currency' ? (
                  <CurrencyDisplay 
                    amount={card?.value}
                    currency={currencyConfig?.currency}
                    symbol={currencyConfig?.symbol}
                    className="text-2xl font-bold text-foreground"
                  />
                ) : card?.format === 'hours' ? (
                  <p className="text-2xl font-bold text-foreground">
                    {card?.value?.toFixed(0)}h
                  </p>
                ) : (
                  <p className="text-2xl font-bold text-foreground">
                    {card?.value?.toLocaleString()}
                  </p>
                )}
              </div>
              {card?.subtitle && (
                <p className="text-xs text-muted-foreground mt-1">
                  {card?.subtitle}
                </p>
              )}
            </div>
            
            <div className={`p-3 rounded-full ${card?.bgColor}`}>
              <Icon 
                name={card?.icon} 
                size={20} 
                className={card?.color}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PayrollSummaryCards;