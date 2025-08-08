import React from 'react';
import Icon from '../../../components/AppIcon';
import CurrencyDisplay from '../../../components/ui/CurrencyDisplay';

const PayrollEstimationCards = ({ summary, weekStart, weekEnd, loading = false }) => {
  const cards = [
    {
      label: 'Total Empleados',
      value: summary?.totalEmployees || 0,
      icon: 'Users',
      color: 'blue',
      format: 'number'
    },
    {
      label: 'Horas Regulares',
      value: summary?.totalRegularHours || 0,
      icon: 'Clock',
      color: 'green',
      format: 'hours'
    },
    {
      label: 'Horas Extra',
      value: summary?.totalOvertimeHours || 0,
      icon: 'Clock4',
      color: 'orange',
      format: 'hours'
    },
    {
      label: 'Total Bruto',
      value: summary?.totalGrossPay || 0,
      icon: 'DollarSign',
      color: 'purple',
      format: 'currency'
    },
    {
      label: 'Total Neto',
      value: summary?.totalNetPay || 0,
      icon: 'Wallet',
      color: 'emerald',
      format: 'currency'
    },
    {
      label: 'Promedio Diario',
      value: summary?.averageDailyPay || 0,
      icon: 'TrendingUp',
      color: 'pink',
      format: 'currency'
    }
  ];

  const getColorClasses = (color) => {
    const colorMap = {
      blue: 'bg-blue-50 border-blue-200 text-blue-600',
      green: 'bg-green-50 border-green-200 text-green-600',
      orange: 'bg-orange-50 border-orange-200 text-orange-600',
      purple: 'bg-purple-50 border-purple-200 text-purple-600',
      emerald: 'bg-emerald-50 border-emerald-200 text-emerald-600',
      pink: 'bg-pink-50 border-pink-200 text-pink-600'
    };
    return colorMap?.[color] || colorMap?.blue;
  };

  const formatValue = (value, format) => {
    if (loading) return '---';
    
    switch (format) {
      case 'currency':
        return <CurrencyDisplay amount={value} />;
      case 'hours':
        return `${value?.toFixed(1)}h`;
      case 'number':
        return value?.toLocaleString('es-MX');
      default:
        return value;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {cards?.map((card, index) => (
        <div 
          key={index}
          className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-shadow duration-200"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground mb-1">
                {card?.label}
              </p>
              <div className={`text-2xl font-bold ${loading ? 'animate-pulse' : ''}`}>
                {formatValue(card?.value, card?.format)}
              </div>
              
              {/* Show zero state hint for currency values */}
              {!loading && card?.format === 'currency' && card?.value === 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Se actualizará con datos de asistencia
                </p>
              )}
            </div>
            
            <div className={`w-12 h-12 rounded-lg border flex items-center justify-center ${getColorClasses(card?.color)}`}>
              <Icon name={card?.icon} size={20} />
            </div>
          </div>

          {/* Progress bar for hours */}
          {card?.format === 'hours' && !loading && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>0h</span>
                <span>40h/sem</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${
                    card?.color === 'green' ? 'bg-green-500' : 'bg-orange-500'
                  }`}
                  style={{
                    width: `${Math.min((card?.value / 40) * 100, 100)}%`
                  }}
                />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default PayrollEstimationCards;