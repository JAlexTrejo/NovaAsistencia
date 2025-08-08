import React, { useState, useEffect } from 'react';
import { Clock, LogIn, LogOut, Coffee, Square, MapPin } from 'lucide-react';

export default function AttendanceActionButtons({ todayAttendance, onAction }) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [gettingLocation, setGettingLocation] = useState(false);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Get current location
  const getCurrentLocation = () => {
    setGettingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation?.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position?.coords;
          setLocation(`${latitude?.toFixed(6)}, ${longitude?.toFixed(6)}`);
          setGettingLocation(false);
        },
        (error) => {
          setLocation('Ubicación no disponible');
          setGettingLocation(false);
        }
      );
    } else {
      setLocation('Geolocalización no soportada');
      setGettingLocation(false);
    }
  };

  const handleActionClick = (action) => {
    if (action === 'clock_in' || action === 'clock_out') {
      setPendingAction(action);
      setShowLocationModal(true);
      setLocation('');
      setNotes('');
    } else {
      onAction(action);
    }
  };

  const handleConfirmAction = () => {
    if (pendingAction) {
      onAction(pendingAction, location, notes);
      setShowLocationModal(false);
      setPendingAction(null);
      setLocation('');
      setNotes('');
    }
  };

  const isClockInDisabled = todayAttendance?.clock_in && !todayAttendance?.clock_out;
  const isClockOutDisabled = !todayAttendance?.clock_in || todayAttendance?.clock_out;
  const isLunchStartDisabled = !todayAttendance?.clock_in || todayAttendance?.lunch_start;
  const isLunchEndDisabled = !todayAttendance?.lunch_start || todayAttendance?.lunch_end;

  // Calculate hours worked today
  const calculateHoursWorked = () => {
    if (!todayAttendance?.clock_in) return '0:00';
    
    const clockIn = new Date(todayAttendance?.clock_in);
    const clockOut = todayAttendance?.clock_out ? new Date(todayAttendance?.clock_out) : new Date();
    
    let totalMinutes = (clockOut - clockIn) / (1000 * 60);
    
    // Subtract lunch break if exists
    if (todayAttendance?.lunch_start && todayAttendance?.lunch_end) {
      const lunchStart = new Date(todayAttendance?.lunch_start);
      const lunchEnd = new Date(todayAttendance?.lunch_end);
      const lunchMinutes = (lunchEnd - lunchStart) / (1000 * 60);
      totalMinutes -= lunchMinutes;
    }
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.floor(totalMinutes % 60);
    return `${hours}:${minutes?.toString()?.padStart(2, '0')}`;
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Control de Asistencia
            </h3>
            <p className="text-sm text-gray-600">
              {currentTime.toLocaleTimeString('es-ES')} - {currentTime.toLocaleDateString('es-ES')}
            </p>
          </div>
          
          {/* Hours worked today */}
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">
              {calculateHoursWorked()}
            </div>
            <p className="text-sm text-gray-600">Horas trabajadas hoy</p>
          </div>
        </div>

        {/* Current Status */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-xs text-gray-600 mb-1">Entrada</div>
              <div className={`text-sm font-medium ${
                todayAttendance?.clock_in ? 'text-green-600' : 'text-gray-400'
              }`}>
                {todayAttendance?.clock_in ? 
                  new Date(todayAttendance?.clock_in)?.toLocaleTimeString('es-ES', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  }) : 
                  '--:--'
                }
              </div>
            </div>
            
            <div>
              <div className="text-xs text-gray-600 mb-1">Comida</div>
              <div className={`text-sm font-medium ${
                todayAttendance?.lunch_start ? 'text-orange-600' : 'text-gray-400'
              }`}>
                {todayAttendance?.lunch_start && todayAttendance?.lunch_end ? 'Terminada' : todayAttendance?.lunch_start ?'En comida' : '--:--'
                }
              </div>
            </div>
            
            <div>
              <div className="text-xs text-gray-600 mb-1">Salida</div>
              <div className={`text-sm font-medium ${
                todayAttendance?.clock_out ? 'text-red-600' : 'text-gray-400'
              }`}>
                {todayAttendance?.clock_out ? 
                  new Date(todayAttendance?.clock_out)?.toLocaleTimeString('es-ES', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  }) : 
                  '--:--'
                }
              </div>
            </div>
            
            <div>
              <div className="text-xs text-gray-600 mb-1">Estado</div>
              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                todayAttendance?.clock_out ? 'bg-gray-100 text-gray-800' : todayAttendance?.lunch_start && !todayAttendance?.lunch_end ?'bg-orange-100 text-orange-800': todayAttendance?.clock_in ?'bg-green-100 text-green-800': 'bg-red-100 text-red-800'
              }`}>
                {todayAttendance?.clock_out ? 'Finalizado' :
                 todayAttendance?.lunch_start && !todayAttendance?.lunch_end ? 'En comida': todayAttendance?.clock_in ?'Trabajando': 'Sin entrada'
                }
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Clock In */}
          <button
            onClick={() => handleActionClick('clock_in')}
            disabled={isClockInDisabled}
            className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all ${
              isClockInDisabled
                ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed' :'border-green-200 bg-green-50 text-green-700 hover:bg-green-100 hover:border-green-300'
            }`}
          >
            <LogIn className="h-8 w-8 mb-2" />
            <span className="text-sm font-medium">Entrada</span>
            <span className="text-xs opacity-75 mt-1">
              {isClockInDisabled ? 'Ya registrada' : 'Marcar llegada'}
            </span>
          </button>

          {/* Clock Out */}
          <button
            onClick={() => handleActionClick('clock_out')}
            disabled={isClockOutDisabled}
            className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all ${
              isClockOutDisabled
                ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed' :'border-red-200 bg-red-50 text-red-700 hover:bg-red-100 hover:border-red-300'
            }`}
          >
            <LogOut className="h-8 w-8 mb-2" />
            <span className="text-sm font-medium">Salida</span>
            <span className="text-xs opacity-75 mt-1">
              {isClockOutDisabled ? 'No disponible' : 'Marcar salida'}
            </span>
          </button>

          {/* Lunch Start */}
          <button
            onClick={() => handleActionClick('lunch_start')}
            disabled={isLunchStartDisabled}
            className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all ${
              isLunchStartDisabled
                ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed' :'border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 hover:border-orange-300'
            }`}
          >
            <Coffee className="h-8 w-8 mb-2" />
            <span className="text-sm font-medium">Iniciar Comida</span>
            <span className="text-xs opacity-75 mt-1">
              {isLunchStartDisabled ? 'No disponible' : 'Marcar inicio'}
            </span>
          </button>

          {/* Lunch End */}
          <button
            onClick={() => handleActionClick('lunch_end')}
            disabled={isLunchEndDisabled}
            className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all ${
              isLunchEndDisabled
                ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed' :'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:border-blue-300'
            }`}
          >
            <Square className="h-8 w-8 mb-2" />
            <span className="text-sm font-medium">Terminar Comida</span>
            <span className="text-xs opacity-75 mt-1">
              {isLunchEndDisabled ? 'No disponible' : 'Regresar trabajo'}
            </span>
          </button>
        </div>

        {/* GPS Notice */}
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <MapPin className="h-4 w-4 text-blue-600 mt-0.5" />
            <div>
              <p className="text-sm text-blue-800">
                <strong>Verificación de Ubicación:</strong> Las marcas de entrada y salida 
                incluyen verificación de ubicación GPS para mayor precisión.
              </p>
            </div>
          </div>
        </div>
      </div>
      {/* Location Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {pendingAction === 'clock_in' ? 'Confirmar Entrada' : 'Confirmar Salida'}
            </h3>
            
            <div className="space-y-4">
              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ubicación
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e?.target?.value)}
                    placeholder="Ubicación automática o manual"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={getCurrentLocation}
                    disabled={gettingLocation}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    {gettingLocation ? '...' : 'GPS'}
                  </button>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas (opcional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e?.target?.value)}
                  placeholder="Observaciones adicionales..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowLocationModal(false);
                  setPendingAction(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmAction}
                className={`flex-1 px-4 py-2 text-white rounded-lg ${
                  pendingAction === 'clock_in' ?'bg-green-600 hover:bg-green-700' :'bg-red-600 hover:bg-red-700'
                }`}
              >
                {pendingAction === 'clock_in' ? 'Marcar Entrada' : 'Marcar Salida'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}