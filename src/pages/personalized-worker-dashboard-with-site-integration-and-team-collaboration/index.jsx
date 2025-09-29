// pages/personalized-worker-dashboard-with-site-integration-and-team-collaboration/index.jsx
import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { AlertCircle, User } from 'lucide-react';

import PersonalInfoCard from './components/PersonalInfoCard';
import SiteInfoCard from './components/SiteInfoCard';
import CoworkersList from './components/CoworkersList';
import AttendanceActionButtons from './components/AttendanceActionButtons';
import WeeklyTimecardSummary from './components/WeeklyTimecardSummary';
import RecentIncidents from './components/RecentIncidents';
import PayrollSummaryCard from './components/PayrollSummaryCard';

import { useQuery } from '@/hooks/useQuery';
import { getWorkerProfile, getSiteCoworkers, getWeeklyTimecard, getWorkerIncidents, clockIn, clockOut, startLunchBreak, endLunchBreak, getTodayAttendanceStatus, getRecentPayrollEstimation } from '@/services/enhancedAttendanceService';

export default function PersonalizedWorkerDashboard() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const isWorker = userProfile?.role === 'user';
  const userId = user?.id;

  // 1) Perfil del trabajador (clave para habilitar las demás)
  const {
    data: workerProfile,
    isLoading: loadingProfile,
    error: errorProfile,
    refetch: refetchProfile,
  } = useQuery(getWorkerProfile, {
    params: userId,
    enabled: !!userId && isWorker && !authLoading,
  });

  const employeeId = workerProfile?.id;
  const siteId = workerProfile?.site_id;

  // 2) Compañeros del mismo sitio
  const {
    data: coworkers,
    isLoading: loadingCoworkers,
    error: errorCoworkers,
    refetch: refetchCoworkers,
  } = useQuery(getSiteCoworkers, {
    params: [siteId, userId], // (siteId, excludeUserId)
    enabled: !!employeeId && !!siteId,
    select: (d) => (Array.isArray(d) ? d : []),
  });

  // 3) Asistencia de hoy
  const {
    data: todayAttendance,
    isLoading: loadingToday,
    error: errorToday,
    refetch: refetchToday,
  } = useQuery(getTodayAttendanceStatus, {
    params: employeeId,
    enabled: !!employeeId,
  });

  // 4) Resumen semanal
  const {
    data: weeklyTimecard,
    isLoading: loadingWeekly,
    error: errorWeekly,
    refetch: refetchWeekly,
  } = useQuery(getWeeklyTimecard, {
    params: employeeId,
    enabled: !!employeeId,
  });

  // 5) Incidentes recientes
  const {
    data: incidents = [],
    isLoading: loadingIncidents,
    error: errorIncidents,
    refetch: refetchIncidents,
  } = useQuery(getWorkerIncidents, {
    params: [employeeId, 5], // (employeeId, limit)
    enabled: !!employeeId,
    select: (d) => (Array.isArray(d) ? d : []),
  });

  // 6) Estimación de nómina reciente
  const {
    data: payrollEstimation,
    isLoading: loadingPayroll,
    error: errorPayroll,
    refetch: refetchPayroll,
  } = useQuery(getRecentPayrollEstimation, {
    params: employeeId,
    enabled: !!employeeId,
  });

  // Handlers de acciones de asistencia
  const handleAttendanceAction = async (action, location = null, notes = null) => {
    if (!employeeId) return;
    try {
      let res;
      if (action === 'clock_in')       res = await clockIn(employeeId, { location, notes });
      else if (action === 'clock_out') res = await clockOut(employeeId, { location, notes });
      else if (action === 'lunch_start') res = await startLunchBreak(employeeId);
      else if (action === 'lunch_end')   res = await endLunchBreak(employeeId);

      if (!res?.ok) throw new Error(res?.error || 'Acción inválida');
      await Promise.all([refetchToday(), refetchWeekly()]);
    } catch (e) {
      alert(e?.message || 'Error en la acción de asistencia');
    }
  };

  // Estados de carga/errores
  if (authLoading || (isWorker && loadingProfile)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando panel del trabajador...</p>
        </div>
      </div>
    );
  }

  if (!isWorker) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error de Acceso</h2>
            <p className="text-gray-600 mb-4">Esta página es solo para trabajadores de campo</p>
            <button
              onClick={() => window.history?.back()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Volver
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (errorProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No se pudo cargar el perfil</h2>
            <p className="text-gray-600 mb-4">{errorProfile?.message}</p>
            <button
              onClick={() => refetchProfile()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <User className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Dashboard Personal
                </h1>
                <p className="text-sm text-gray-600">
                  Bienvenido, {workerProfile?.full_name}
                </p>
              </div>
            </div>

            {/* Quick Status Indicator */}
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {new Date()?.toLocaleDateString('es-ES', { 
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
                  })}
                </p>
                <p className="text-xs text-gray-600">
                  {todayAttendance?.clock_in ? 
                    `Entrada: ${new Date(todayAttendance?.clock_in)?.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}` :
                    'Sin entrada registrada'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Top Row - Personal Info and Site Integration */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <PersonalInfoCard 
              workerProfile={workerProfile} 
              userProfile={userProfile}
            />
            <SiteInfoCard 
              siteInfo={workerProfile?.construction_sites}
              supervisor={workerProfile?.supervisor}
            />
          </div>

          {/* Attendance Action Buttons */}
          <div className="mb-6">
            <AttendanceActionButtons 
              todayAttendance={todayAttendance}
              onAction={handleAttendanceAction}
              isLoading={loadingToday}
            />
          </div>

          {/* Middle Row - Timecard and Payroll */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <WeeklyTimecardSummary 
              weeklyTimecard={weeklyTimecard}
              todayAttendance={todayAttendance}
              isLoading={loadingWeekly}
            />
            <PayrollSummaryCard 
              payrollEstimation={payrollEstimation}
              weeklyTimecard={weeklyTimecard}
              workerProfile={workerProfile}
              isLoading={loadingPayroll}
            />
          </div>

          {/* Bottom Row - Coworkers and Incidents */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CoworkersList 
              coworkers={coworkers}
              siteInfo={workerProfile?.construction_sites}
              isLoading={loadingCoworkers}
            />
            <RecentIncidents 
              incidents={incidents}
              employeeId={workerProfile?.id}
              isLoading={loadingIncidents}
              onIncidentSubmitted={async () => {
                await refetchIncidents();
              }}
              errorMessage={errorIncidents?.message}
            />
          </div>
        </div>
      </main>
    </div>
  );
}