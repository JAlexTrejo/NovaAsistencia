import React from 'react';
import Icon from '../../../components/AppIcon';

const WeeklyTimecardTable = ({ 
  weekData = [],
  currentWeekStart = new Date(),
  onDateClick = () => {}
}) => {
  // Mock data for current week
  const mockWeekData = [
    {
      date: '2025-01-27',
      dayName: 'Lunes',
      clockIn: '08:00',
      lunchStart: '12:00',
      lunchEnd: '13:00',
      clockOut: '17:30',
      totalHours: 8.5,
      regularHours: 8,
      overtimeHours: 0.5,
      status: 'complete',
      isLate: false
    },
    {
      date: '2025-01-28',
      dayName: 'Martes',
      clockIn: '08:15',
      lunchStart: '12:30',
      lunchEnd: '13:30',
      clockOut: '18:00',
      totalHours: 8.75,
      regularHours: 8,
      overtimeHours: 0.75,
      status: 'complete',
      isLate: true
    },
    {
      date: '2025-01-29',
      dayName: 'Miércoles',
      clockIn: '07:45',
      lunchStart: '12:00',
      lunchEnd: '13:00',
      clockOut: '17:15',
      totalHours: 8.5,
      regularHours: 8,
      overtimeHours: 0.5,
      status: 'complete',
      isLate: false
    },
    {
      date: '2025-01-30',
      dayName: 'Jueves',
      clockIn: '08:05',
      lunchStart: '12:15',
      lunchEnd: '13:15',
      clockOut: null,
      totalHours: 0,
      regularHours: 0,
      overtimeHours: 0,
      status: 'incomplete',
      isLate: true
    },
    {
      date: '2025-01-31',
      dayName: 'Viernes',
      clockIn: null,
      lunchStart: null,
      lunchEnd: null,
      clockOut: null,
      totalHours: 0,
      regularHours: 0,
      overtimeHours: 0,
      status: 'pending',
      isLate: false
    }
  ];

  const displayData = weekData?.length > 0 ? weekData : mockWeekData;

  const getStatusIcon = (status) => {
    switch (status) {
      case 'complete':
        return <Icon name="CheckCircle" size={16} className="text-success" />;
      case 'incomplete':
        return <Icon name="AlertCircle" size={16} className="text-warning" />;
      case 'pending':
        return <Icon name="Clock" size={16} className="text-muted-foreground" />;
      default:
        return <Icon name="Circle" size={16} className="text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status, isLate) => {
    if (status === 'complete') {
      return (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          isLate ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'
        }`}>
          {isLate ? 'Tardanza' : 'Completo'}
        </span>
      );
    }
    if (status === 'incomplete') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-warning/10 text-warning">
          Incompleto
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
        Pendiente
      </span>
    );
  };

  const formatTime = (time) => {
    return time || '--:--';
  };

  const formatHours = (hours) => {
    return hours ? `${hours?.toFixed(2)}h` : '0.00h';
  };

  const getTotalWeekHours = () => {
    return displayData?.reduce((total, day) => total + (day?.totalHours || 0), 0);
  };

  const getTotalRegularHours = () => {
    return displayData?.reduce((total, day) => total + (day?.regularHours || 0), 0);
  };

  const getTotalOvertimeHours = () => {
    return displayData?.reduce((total, day) => total + (day?.overtimeHours || 0), 0);
  };

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">
            Registro Semanal
          </h3>
          <div className="text-sm text-muted-foreground">
            Semana del {currentWeekStart?.toLocaleDateString('es-ES', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            })}
          </div>
        </div>
      </div>
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Día
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Entrada
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Almuerzo
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Salida
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Total
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Extra
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Estado
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {displayData?.map((day, index) => (
              <tr 
                key={index}
                className="hover:bg-muted/30 transition-colors duration-150 ease-out-cubic cursor-pointer"
                onClick={() => onDateClick(day?.date)}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(day?.status)}
                    <div>
                      <div className="text-sm font-medium text-foreground">
                        {day?.dayName}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(day.date)?.toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm text-foreground">
                    {formatTime(day?.clockIn)}
                  </div>
                  {day?.isLate && day?.clockIn && (
                    <div className="text-xs text-warning">
                      Tardanza
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm text-foreground">
                    {day?.lunchStart && day?.lunchEnd 
                      ? `${formatTime(day?.lunchStart)} - ${formatTime(day?.lunchEnd)}`
                      : '--:-- - --:--'
                    }
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm text-foreground">
                    {formatTime(day?.clockOut)}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm font-medium text-foreground">
                    {formatHours(day?.totalHours)}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className={`text-sm font-medium ${
                    day?.overtimeHours > 0 ? 'text-warning' : 'text-muted-foreground'
                  }`}>
                    {formatHours(day?.overtimeHours)}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {getStatusBadge(day?.status, day?.isLate)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Summary Footer */}
      <div className="px-6 py-4 bg-muted/30 border-t border-border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">
              {formatHours(getTotalWeekHours())}
            </div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">
              Total Semanal
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-success">
              {formatHours(getTotalRegularHours())}
            </div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">
              Horas Regulares
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-warning">
              {formatHours(getTotalOvertimeHours())}
            </div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">
              Horas Extra
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeeklyTimecardTable;