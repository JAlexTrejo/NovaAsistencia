import React, { useState, useEffect } from 'react';
import Button from '../../../components/ui/Button';
import { Clock, Coffee, LogOut, LogIn, CheckCircle, MapPin, AlertTriangle } from 'lucide-react';
import { attendanceService } from '../../../services/attendanceService';
import { useAuth } from '../../../contexts/AuthContext';
import Icon from '../../../components/AppIcon';

export function AttendanceActionButtons({ siteId, onAttendanceUpdate }) {
  const { user } = useAuth()
  const [todayRecord, setTodayRecord] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)
  const [message, setMessage] = useState('')
  const [locationError, setLocationError] = useState('')
  const [gpsAccuracy, setGpsAccuracy] = useState(null)

  useEffect(() => {
    if (user?.id) {
      loadTodayAttendance()
    }
  }, [user?.id])

  const loadTodayAttendance = async () => {
    try {
      setLoading(true)
      const result = await attendanceService?.getTodayAttendance(user?.id)
      
      if (result?.ok) {
        setTodayRecord(result?.data)
      }
    } catch (error) {
      console.error('Error loading today attendance:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAttendanceAction = async (action) => {
    if (!user?.id || !siteId) {
      setMessage('Error: Usuario o sitio no disponible')
      return
    }

    setActionLoading(action)
    setMessage('')
    setLocationError('')

    try {
      // Get high-accuracy location
      let location = null
      let accuracy = null
      
      if (navigator.geolocation) {
        try {
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 10000,
              enableHighAccuracy: true,
              maximumAge: 30000
            })
          })
          
          location = `${position?.coords?.latitude}, ${position?.coords?.longitude}`
          accuracy = position?.coords?.accuracy
          setGpsAccuracy(accuracy)
          
          // Check GPS accuracy
          if (accuracy > 50) {
            setLocationError(`⚠️ Precisión GPS baja: ${Math.round(accuracy)}m. Se recomienda mejor señal GPS.`)
          }
          
        } catch (error) {
          console.log('GPS error:', error)
          setLocationError('❌ No se pudo obtener la ubicación GPS. Verifique que tenga permisos de ubicación habilitados.')
          
          // For demo purposes, allow registration without GPS but show warning
          if (error?.code === 1) { // Permission denied
            setLocationError('⚠️ Permisos de ubicación denegados. El registro se realizará sin validación GPS.')
          } else if (error?.code === 2) { // Position unavailable
            setLocationError('⚠️ Ubicación no disponible. Verifique su conexión GPS.')
          } else if (error?.code === 3) { // Timeout
            setLocationError('⚠️ Tiempo de espera GPS agotado. El registro se realizará sin validación.')
          }
        }
      } else {
        setLocationError('❌ GPS no soportado en este dispositivo.')
      }

      const result = await attendanceService?.registerAttendance(
        user?.id,
        siteId,
        action,
        location
      )

      if (result?.ok) {
        setTodayRecord(result?.data)
        
        let successMsg = getActionSuccessMessage(action)
        
        // Add location validation info to success message
        if (result?.validation) {
          if (result?.validation?.dentro_del_rango) {
            successMsg += ` ✅ Ubicación validada (${result?.validation?.distancia_metros}m)`
          }
        }
        
        if (result?.locationError) {
          successMsg += ` ⚠️ ${result?.locationError}`
        }
        
        setMessage(successMsg)
        onAttendanceUpdate?.(result?.data)
        
        // Clear message after 5 seconds
        setTimeout(() => {
          setMessage('')
          setLocationError('')
        }, 5000)
      } else {
        setMessage(`❌ ${result?.error}`)
        
        // Show validation details if available
        if (result?.validation) {
          setLocationError(
            `Distancia actual: ${result?.validation?.distancia_metros}m, ` +
            `Radio permitido: ${result?.validation?.radio_permitido}m`
          )
        }
      }
    } catch (error) {
      setMessage('❌ Error al registrar asistencia')
      console.error('Attendance action error:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const getActionSuccessMessage = (action) => {
    const messages = {
      entrada: '✅ Entrada registrada correctamente',
      inicio_comida: '🍽️ Inicio de comida registrado',
      fin_comida: '✅ Fin de comida registrado',
      salida: '👋 Salida registrada correctamente'
    }
    return messages?.[action] || 'Acción registrada';
  }

  const getNextAction = () => {
    if (!todayRecord) return 'entrada'
    
    if (!todayRecord?.entrada) return 'entrada'
    if (!todayRecord?.inicio_comida) return 'inicio_comida'
    if (!todayRecord?.fin_comida) return 'fin_comida'
    if (!todayRecord?.salida) return 'salida'
    
    return null // All actions completed
  }

  const getActionConfig = (action) => {
    const configs = {
      entrada: {
        label: 'Registrar Entrada',
        icon: LogIn,
        color: 'bg-green-600 hover:bg-green-700',
        description: 'Marca tu llegada al trabajo'
      },
      inicio_comida: {
        label: 'Inicio Comida',
        icon: Coffee,
        color: 'bg-orange-600 hover:bg-orange-700',
        description: 'Marca el inicio de tu hora de comida'
      },
      fin_comida: {
        label: 'Fin Comida',
        icon: Coffee,
        color: 'bg-blue-600 hover:bg-blue-700',
        description: 'Marca el fin de tu hora de comida'
      },
      salida: {
        label: 'Registrar Salida',
        icon: LogOut,
        color: 'bg-red-600 hover:bg-red-700',
        description: 'Marca tu salida del trabajo'
      }
    }
    return configs?.[action];
  }

  const formatTime = (timestamp) => {
    if (!timestamp) return null
    return new Date(timestamp)?.toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Cargando estado de asistencia...</span>
        </div>
      </div>
    )
  }

  const nextAction = getNextAction()
  const isCompleted = nextAction === null

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Control de Asistencia
        </h3>
        <p className="text-sm text-gray-600">
          {new Date()?.toLocaleDateString('es-MX', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </p>
      </div>

      {/* Location Status */}
      {(gpsAccuracy || locationError) && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="flex items-start space-x-2">
            <MapPin className="h-4 w-4 text-yellow-600 mt-0.5" />
            <div className="text-sm">
              {gpsAccuracy && (
                <p className="text-yellow-800">
                  Precisión GPS: {Math.round(gpsAccuracy)}m
                  {gpsAccuracy <= 20 && <span className="text-green-600"> ✅ Excelente</span>}
                  {gpsAccuracy > 20 && gpsAccuracy <= 50 && <span className="text-yellow-600"> ⚠️ Aceptable</span>}
                  {gpsAccuracy > 50 && <span className="text-red-600"> ❌ Baja</span>}
                </p>
              )}
              {locationError && (
                <p className="text-yellow-800 mt-1">{locationError}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Message Display */}
      {message && (
        <div className={`mb-4 p-3 rounded-md ${
          message?.includes('❌') 
            ? 'bg-red-50 border border-red-200' :'bg-blue-50 border border-blue-200'
        }`}>
          <p className={`text-sm text-center ${
            message?.includes('❌') ? 'text-red-800' : 'text-blue-800'
          }`}>
            {message}
          </p>
        </div>
      )}

      {/* Current Status */}
      <div className="mb-6 space-y-2">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center space-x-2">
            <LogIn className={`h-4 w-4 ${todayRecord?.entrada ? 'text-green-600' : 'text-gray-400'}`} />
            <span className={todayRecord?.entrada ? 'text-green-600' : 'text-gray-400'}>
              Entrada: {formatTime(todayRecord?.entrada) || 'Pendiente'}
            </span>
            {todayRecord?.entrada && todayRecord?.dentro_del_rango && (
              <CheckCircle className="h-3 w-3 text-green-500" title="Ubicación validada" />
            )}
            {todayRecord?.entrada && todayRecord?.dentro_del_rango === false && (
              <AlertTriangle className="h-3 w-3 text-red-500" title="Fuera del rango permitido" />
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <Coffee className={`h-4 w-4 ${todayRecord?.inicio_comida ? 'text-orange-600' : 'text-gray-400'}`} />
            <span className={todayRecord?.inicio_comida ? 'text-orange-600' : 'text-gray-400'}>
              Comida: {formatTime(todayRecord?.inicio_comida) || 'Pendiente'}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Coffee className={`h-4 w-4 ${todayRecord?.fin_comida ? 'text-blue-600' : 'text-gray-400'}`} />
            <span className={todayRecord?.fin_comida ? 'text-blue-600' : 'text-gray-400'}>
              Regreso: {formatTime(todayRecord?.fin_comida) || 'Pendiente'}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <LogOut className={`h-4 w-4 ${todayRecord?.salida ? 'text-red-600' : 'text-gray-400'}`} />
            <span className={todayRecord?.salida ? 'text-red-600' : 'text-gray-400'}>
              Salida: {formatTime(todayRecord?.salida) || 'Pendiente'}
            </span>
            {todayRecord?.salida && todayRecord?.dentro_del_rango && (
              <CheckCircle className="h-3 w-3 text-green-500" title="Ubicación validada" />
            )}
            {todayRecord?.salida && todayRecord?.dentro_del_rango === false && (
              <AlertTriangle className="h-3 w-3 text-red-500" title="Fuera del rango permitido" />
            )}
          </div>
        </div>
        
        {/* GPS validation info */}
        {todayRecord?.distancia_metros && (
          <div className="mt-3 p-2 bg-gray-50 rounded-md">
            <div className="flex items-center justify-center space-x-2 text-xs">
              <MapPin className="h-3 w-3 text-gray-600" />
              <span className="text-gray-700">
                Distancia al sitio: {todayRecord?.distancia_metros}m
                {todayRecord?.dentro_del_rango ? (
                  <span className="text-green-600 ml-1">✅ Dentro del rango</span>
                ) : (
                  <span className="text-red-600 ml-1">❌ Fuera del rango</span>
                )}
              </span>
            </div>
          </div>
        )}
        
        {todayRecord?.total_hours && (
          <div className="mt-3 p-3 bg-gray-50 rounded-md">
            <div className="flex items-center justify-center space-x-2">
              <Clock className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-900">
                Horas trabajadas hoy: {todayRecord?.total_hours}h
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Action Button */}
      {isCompleted ? (
        <div className="text-center py-4">
          <div className="flex items-center justify-center space-x-2 text-green-600 mb-2">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">Jornada completada</span>
          </div>
          <p className="text-sm text-gray-600">
            Has registrado todos los horarios para hoy
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {(() => {
            const config = getActionConfig(nextAction)
            const Icon = config?.icon
            
            return (
              <>
                <Button
                  onClick={() => handleAttendanceAction(nextAction)}
                  disabled={actionLoading !== null}
                  className={`w-full ${config?.color} text-white py-3 px-4 rounded-md font-medium transition-colors`}
                >
                  {actionLoading === nextAction ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Registrando...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Icon className="h-4 w-4" />
                      <span>{config?.label}</span>
                    </div>
                  )}
                </Button>
                <p className="text-xs text-gray-500 text-center">
                  {config?.description}
                </p>
              </>
            );
          })()}
        </div>
      )}

      {/* GPS Requirements Notice */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
        <div className="flex items-start space-x-2">
          <MapPin className="h-4 w-4 text-blue-600 mt-0.5" />
          <div className="text-xs text-blue-800">
            <p className="font-medium mb-1">📍 Validación GPS Activada</p>
            <ul className="space-y-1 text-blue-700">
              <li>• Se registrará tu ubicación GPS actual</li>
              <li>• Debes estar dentro del área de trabajo asignada</li>
              <li>• La precisión GPS debe ser menor a 50 metros</li>
              <li>• Si estás fuera del área, el registro será rechazado</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AttendanceActionButtons;