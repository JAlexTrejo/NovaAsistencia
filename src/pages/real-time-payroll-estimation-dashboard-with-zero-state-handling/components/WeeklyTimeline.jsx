import React from 'react';
import CurrencyDisplay from '../../../components/ui/CurrencyDisplay';

const WeeklyTimeline = ({ weekStart, payrollData, loading = false }) => {
  // Generate days of the week
  const weekDays = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(weekStart);
    day?.setDate(weekStart?.getDate() + i);
    weekDays?.push({
      date: day,
      dayName: day?.toLocaleDateString('es-ES', { weekday: 'short' }),
      dayNumber: day?.getDate(),
      isToday: day?.toDateString() === new Date()?.toDateString()
    });
  }

  // Calculate daily totals (mock data since we don't have daily breakdown)
  const dailyTotals = weekDays?.map((day, index) => {
    // Mock progressive accumulation for demonstration
    const progress = Math.min((index + 1) / 7, 1);
    const totalPay = payrollData?.reduce((sum, record) => sum + (parseFloat(record?.gross_total) || 0), 0);
    
    return {
      ...day,
      amount: totalPay * progress / 7,
      hours: payrollData?.reduce((sum, record) => sum + (parseFloat(record?.regular_hours) || 0), 0) * progress / 7,
      employees: Math.floor(payrollData?.length * progress)
    };
  });

  const maxAmount = Math.max(...dailyTotals?.map(d => d?.amount));

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Progresión Semanal
        </h3>
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="flex justify-between">
            {[...Array(7)]?.map((_, i) => (
              <div key={i} className="text-center">
                <div className="h-4 bg-gray-200 rounded w-8 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-6"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">
          Progresión Semanal de Ingresos
        </h3>
        <div className="text-sm text-muted-foreground">
          {payrollData?.length === 0 ? (
            'Sin datos de asistencia'
          ) : (
            `${payrollData?.length} empleados activos`
          )}
        </div>
      </div>
      {payrollData?.length === 0 ? (
        <div className="text-center py-8">
          <div className="flex justify-between items-end h-32 mb-4">
            {dailyTotals?.map((day, index) => (
              <div key={index} className="flex flex-col items-center flex-1">
                <div
                  className="bg-gray-200 w-8 rounded-t transition-all duration-500"
                  style={{ height: '8px' }}
                />
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-2 text-center">
            {dailyTotals?.map((day, index) => (
              <div key={index} className={`text-sm ${day?.isToday ? 'font-bold text-blue-600' : 'text-muted-foreground'}`}>
                <div className="font-medium">{day?.dayName}</div>
                <div className="text-xs">{day?.dayNumber}</div>
                <div className="mt-2 text-xs">
                  <CurrencyDisplay amount={0} />
                </div>
              </div>
            ))}
          </div>
          
          <p className="text-muted-foreground text-sm mt-4">
            Los valores aparecerán cuando se registre asistencia diaria
          </p>
        </div>
      ) : (
        <div>
          {/* Chart */}
          <div className="flex justify-between items-end h-32 mb-4">
            {dailyTotals?.map((day, index) => (
              <div key={index} className="flex flex-col items-center flex-1 group">
                <div className="relative">
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    <div>{day?.employees} empleados</div>
                    <div>{day?.hours?.toFixed(1)}h trabajadas</div>
                    <div><CurrencyDisplay amount={day?.amount} /></div>
                  </div>
                  
                  {/* Bar */}
                  <div
                    className={`w-8 rounded-t transition-all duration-500 ${
                      day?.isToday 
                        ? 'bg-blue-500 hover:bg-blue-600' :'bg-green-500 hover:bg-green-600'
                    }`}
                    style={{ 
                      height: maxAmount > 0 ? `${Math.max((day?.amount / maxAmount) * 120, 8)}px` : '8px' 
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Labels */}
          <div className="grid grid-cols-7 gap-2 text-center">
            {dailyTotals?.map((day, index) => (
              <div key={index} className={`text-sm ${day?.isToday ? 'font-bold text-blue-600' : 'text-muted-foreground'}`}>
                <div className="font-medium">{day?.dayName}</div>
                <div className="text-xs">{day?.dayNumber}</div>
                <div className="mt-2 text-xs">
                  <CurrencyDisplay amount={day?.amount} />
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="mt-6 pt-4 border-t border-border">
            <div className="flex justify-between text-sm">
              <div className="text-muted-foreground">
                Progreso de la semana
              </div>
              <div className="font-medium">
                {((new Date()?.getDay() + 6) % 7 + 1)} de 7 días
              </div>
            </div>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(((new Date()?.getDay() + 6) % 7 + 1) / 7 * 100, 100)}%`
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeeklyTimeline;