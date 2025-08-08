import React, { useState } from 'react';
import { Calendar, Clock, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';

export default function WeeklyTimecardSummary({ weeklyTimecard, todayAttendance }) {
  const [selectedWeekOffset, setSelectedWeekOffset] = useState(0);

  if (!weeklyTimecard) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="space-y-3">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const getDayName = (dateString) => {
    const date = new Date(dateString);
    return date?.toLocaleDateString('es-ES', { weekday: 'short' });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date?.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
  };

  const getStatusColor = (record) => {
    if (record?.clock_out) return 'bg-green-100 border-green-200 text-green-800';
    if (record?.clock_in) return 'bg-blue-100 border-blue-200 text-blue-800';
    return 'bg-gray-100 border-gray-200 text-gray-600';
  };

  const getStatusText = (record) => {
    if (record?.clock_out) return 'Completo';
    if (record?.clock_in) return 'En curso';
    return 'Sin registro';
  };

  // Calculate progress towards 40-hour work week
  const regularHours = parseFloat(weeklyTimecard?.totalRegularHours || 0);
  const overtimeHours = parseFloat(weeklyTimecard?.totalOvertimeHours || 0);
  const totalHours = regularHours + overtimeHours;
  const weekProgress = Math.min((totalHours / 40) * 100, 100);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Registro Semanal
          </h3>
          <p className="text-sm text-gray-600">
            {new Date(weeklyTimecard?.weekStart)?.toLocaleDateString('es-ES')} - {' '}
            {new Date(weeklyTimecard?.weekEnd)?.toLocaleDateString('es-ES')}
          </p>
        </div>
        
        {/* Week Navigation */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setSelectedWeekOffset(selectedWeekOffset - 1)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm text-gray-600 min-w-[80px] text-center">
            {selectedWeekOffset === 0 ? 'Esta semana' : 
             selectedWeekOffset === -1 ? 'Sem. pasada' : 
             `${Math.abs(selectedWeekOffset)} sem. atrás`}
          </span>
          <button
            onClick={() => setSelectedWeekOffset(selectedWeekOffset + 1)}
            disabled={selectedWeekOffset >= 0}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      {/* Weekly Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">
            {regularHours?.toFixed(1)}
          </div>
          <div className="text-sm text-blue-600">Horas Regulares</div>
        </div>
        
        <div className="bg-orange-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">
            {overtimeHours?.toFixed(1)}
          </div>
          <div className="text-sm text-orange-600">Horas Extra</div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            {totalHours?.toFixed(1)}
          </div>
          <div className="text-sm text-green-600">Total Horas</div>
        </div>
      </div>
      {/* Week Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Progreso Semanal (40 horas)
          </span>
          <span className="text-sm text-gray-600">
            {weekProgress?.toFixed(0)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${weekProgress}%` }}
          ></div>
        </div>
      </div>
      {/* Daily Records */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">
          Registro Diario
        </h4>
        
        {weeklyTimecard?.dailyRecords?.length > 0 ? (
          <div className="space-y-2">
            {weeklyTimecard?.dailyRecords?.map((record, index) => (
              <div 
                key={record?.id || index}
                className={`flex items-center justify-between p-3 rounded-lg border ${getStatusColor(record)}`}
              >
                <div className="flex items-center space-x-3">
                  <div className="text-sm font-medium">
                    {getDayName(record?.date)} {formatDate(record?.date)}
                  </div>
                  <span className="text-xs px-2 py-1 bg-white rounded-full">
                    {getStatusText(record)}
                  </span>
                </div>
                
                <div className="flex items-center space-x-4 text-sm">
                  {record?.clock_in && (
                    <div className="text-center">
                      <div className="font-medium">
                        {new Date(record?.clock_in)?.toLocaleTimeString('es-ES', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                      <div className="text-xs opacity-75">Entrada</div>
                    </div>
                  )}
                  
                  {record?.clock_out && (
                    <div className="text-center">
                      <div className="font-medium">
                        {new Date(record?.clock_out)?.toLocaleTimeString('es-ES', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                      <div className="text-xs opacity-75">Salida</div>
                    </div>
                  )}
                  
                  <div className="text-center">
                    <div className="font-bold">
                      {parseFloat(record?.total_hours || 0)?.toFixed(1)}h
                    </div>
                    <div className="text-xs opacity-75">Total</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">
              No hay registros para esta semana
            </p>
          </div>
        )}
      </div>
      {/* Performance Indicators */}
      {totalHours > 0 && (
        <div className="border-t border-gray-100 pt-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium text-gray-700">
                  Puntualidad
                </span>
              </div>
              <div className="text-lg font-bold text-green-600">
                {weeklyTimecard?.dailyRecords?.filter(r => r?.clock_in)?.length || 0}
                /{weeklyTimecard?.dailyRecords?.length || 0} días
              </div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1">
                <Clock className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium text-gray-700">
                  Promedio Diario
                </span>
              </div>
              <div className="text-lg font-bold text-blue-600">
                {weeklyTimecard?.dailyRecords?.length > 0 ? 
                  (totalHours / weeklyTimecard?.dailyRecords?.filter(r => r?.total_hours > 0)?.length)?.toFixed(1) : 
                  '0.0'
                }h
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}