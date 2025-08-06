import React, { useState } from 'react';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';


const HistoricalAttendanceViewer = ({ 
  onDateRangeChange = () => {},
  onExportData = () => {}
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState('current_week');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Mock historical data
  const mockHistoricalData = [
    {
      date: '2025-01-27',
      dayName: 'Lunes',
      clockIn: '08:00',
      clockOut: '17:30',
      totalHours: 8.5,
      overtimeHours: 0.5,
      status: 'complete',
      site: 'Obra Central',
      supervisor: 'Carlos Mendez'
    },
    {
      date: '2025-01-26',
      dayName: 'Domingo',
      clockIn: null,
      clockOut: null,
      totalHours: 0,
      overtimeHours: 0,
      status: 'weekend',
      site: 'Obra Central',
      supervisor: 'Carlos Mendez'
    },
    {
      date: '2025-01-25',
      dayName: 'Sábado',
      clockIn: '09:00',
      clockOut: '14:00',
      totalHours: 5,
      overtimeHours: 0,
      status: 'complete',
      site: 'Obra Central',
      supervisor: 'Carlos Mendez'
    },
    {
      date: '2025-01-24',
      dayName: 'Viernes',
      clockIn: '07:45',
      clockOut: '18:15',
      totalHours: 9.5,
      overtimeHours: 1.5,
      status: 'complete',
      site: 'Obra Central',
      supervisor: 'Carlos Mendez'
    },
    {
      date: '2025-01-23',
      dayName: 'Jueves',
      clockIn: '08:15',
      clockOut: '17:00',
      totalHours: 7.75,
      overtimeHours: 0,
      status: 'incomplete',
      site: 'Obra Central',
      supervisor: 'Carlos Mendez'
    },
    {
      date: '2025-01-22',
      dayName: 'Miércoles',
      clockIn: null,
      clockOut: null,
      totalHours: 0,
      overtimeHours: 0,
      status: 'absent',
      site: 'Obra Central',
      supervisor: 'Carlos Mendez'
    },
    {
      date: '2025-01-21',
      dayName: 'Martes',
      clockIn: '08:00',
      clockOut: '17:30',
      totalHours: 8.5,
      overtimeHours: 0.5,
      status: 'complete',
      site: 'Proyecto Norte',
      supervisor: 'Ana Rodriguez'
    },
    {
      date: '2025-01-20',
      dayName: 'Lunes',
      clockIn: '08:30',
      clockOut: '17:45',
      totalHours: 8.25,
      overtimeHours: 0.25,
      status: 'late',
      site: 'Proyecto Norte',
      supervisor: 'Ana Rodriguez'
    }
  ];

  const periodOptions = [
    { value: 'current_week', label: 'Semana Actual' },
    { value: 'last_week', label: 'Semana Pasada' },
    { value: 'current_month', label: 'Mes Actual' },
    { value: 'last_month', label: 'Mes Pasado' },
    { value: 'last_30_days', label: 'Últimos 30 días' },
    { value: 'current_pay_period', label: 'Período de Pago Actual' },
    { value: 'custom', label: 'Rango Personalizado' }
  ];

  const getStatusBadge = (status) => {
    const statusConfig = {
      complete: { label: 'Completo', color: 'bg-success/10 text-success' },
      incomplete: { label: 'Incompleto', color: 'bg-warning/10 text-warning' },
      late: { label: 'Tardanza', color: 'bg-warning/10 text-warning' },
      absent: { label: 'Ausente', color: 'bg-error/10 text-error' },
      weekend: { label: 'Fin de semana', color: 'bg-muted text-muted-foreground' }
    };

    const config = statusConfig?.[status] || statusConfig?.complete;
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config?.color}`}>
        {config?.label}
      </span>
    );
  };

  const formatTime = (time) => {
    return time || '--:--';
  };

  const formatHours = (hours) => {
    return hours ? `${hours?.toFixed(2)}h` : '0.00h';
  };

  const totalPages = Math.ceil(mockHistoricalData?.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = mockHistoricalData?.slice(startIndex, endIndex);

  const handlePeriodChange = (value) => {
    setSelectedPeriod(value);
    setCurrentPage(1);
    onDateRangeChange(value);
  };

  const handleExport = () => {
    onExportData(selectedPeriod, mockHistoricalData);
  };

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h3 className="text-lg font-semibold text-foreground">
            Historial de Asistencia
          </h3>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Select
              options={periodOptions}
              value={selectedPeriod}
              onChange={handlePeriodChange}
              placeholder="Seleccionar período"
              className="w-full sm:w-48"
            />
            
            <Button
              variant="outline"
              iconName="Download"
              iconPosition="left"
              onClick={handleExport}
              className="w-full sm:w-auto"
            >
              Exportar
            </Button>
          </div>
        </div>
      </div>
      {/* Quick Stats */}
      <div className="px-6 py-4 bg-muted/30 border-b border-border">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-xl font-bold text-foreground">
              {mockHistoricalData?.filter(d => d?.status === 'complete' || d?.status === 'late')?.length}
            </div>
            <div className="text-xs text-muted-foreground">Días trabajados</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-warning">
              {mockHistoricalData?.filter(d => d?.status === 'late')?.length}
            </div>
            <div className="text-xs text-muted-foreground">Tardanzas</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-error">
              {mockHistoricalData?.filter(d => d?.status === 'absent')?.length}
            </div>
            <div className="text-xs text-muted-foreground">Ausencias</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-success">
              {mockHistoricalData?.reduce((total, d) => total + (d?.totalHours || 0), 0)?.toFixed(1)}h
            </div>
            <div className="text-xs text-muted-foreground">Total horas</div>
          </div>
        </div>
      </div>
      {/* Data Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Fecha
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Entrada
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
                Sitio
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Estado
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {currentData?.map((record, index) => (
              <tr 
                key={index}
                className="hover:bg-muted/30 transition-colors duration-150 ease-out-cubic"
              >
                <td className="px-4 py-3">
                  <div>
                    <div className="text-sm font-medium text-foreground">
                      {record?.dayName}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(record.date)?.toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm text-foreground">
                    {formatTime(record?.clockIn)}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm text-foreground">
                    {formatTime(record?.clockOut)}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm font-medium text-foreground">
                    {formatHours(record?.totalHours)}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className={`text-sm font-medium ${
                    record?.overtimeHours > 0 ? 'text-warning' : 'text-muted-foreground'
                  }`}>
                    {formatHours(record?.overtimeHours)}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm text-foreground">
                    {record?.site}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {record?.supervisor}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {getStatusBadge(record?.status)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Mostrando {startIndex + 1} a {Math.min(endIndex, mockHistoricalData?.length)} de {mockHistoricalData?.length} registros
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
                iconName="ChevronLeft"
                iconPosition="left"
              >
                Anterior
              </Button>
              
              <span className="text-sm text-foreground">
                Página {currentPage} de {totalPages}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
                iconName="ChevronRight"
                iconPosition="right"
              >
                Siguiente
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoricalAttendanceViewer;