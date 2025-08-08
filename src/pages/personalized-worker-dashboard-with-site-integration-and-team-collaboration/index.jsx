import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { enhancedAttendanceService } from '../../services/enhancedAttendanceService';
import { AlertCircle, User } from 'lucide-react';

// Components
import PersonalInfoCard from './components/PersonalInfoCard';
import SiteInfoCard from './components/SiteInfoCard';
import CoworkersList from './components/CoworkersList';
import AttendanceActionButtons from './components/AttendanceActionButtons';
import WeeklyTimecardSummary from './components/WeeklyTimecardSummary';
import RecentIncidents from './components/RecentIncidents';
import PayrollSummaryCard from './components/PayrollSummaryCard';

export default function PersonalizedWorkerDashboard() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [workerProfile, setWorkerProfile] = useState(null);
  const [coworkers, setCoworkers] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [weeklyTimecard, setWeeklyTimecard] = useState(null);
  const [recentIncidents, setRecentIncidents] = useState([]);
  const [payrollEstimation, setPayrollEstimation] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && user && userProfile?.role === 'user') {
      loadWorkerDashboardData();
    } else if (!authLoading && userProfile?.role !== 'user') {
      setError('Esta página es solo para trabajadores de campo');
      setLoading(false);
    }
  }, [user, userProfile, authLoading]);

  const loadWorkerDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load worker profile
      const profileResult = await enhancedAttendanceService?.getWorkerProfile(user?.id);
      if (!profileResult?.success) {
        setError('No se encontró perfil de empleado');
        return;
      }
      
      setWorkerProfile(profileResult?.data);

      // Load parallel data
      const [
        coworkersResult,
        todayResult,
        weeklyResult,
        incidentsResult,
        payrollResult
      ] = await Promise.all([
        enhancedAttendanceService?.getSiteCoworkers(profileResult?.data?.site_id, user?.id),
        enhancedAttendanceService?.getTodayAttendanceStatus(profileResult?.data?.id),
        enhancedAttendanceService?.getWeeklyTimecard(profileResult?.data?.id),
        enhancedAttendanceService?.getWorkerIncidents(profileResult?.data?.id, 5),
        enhancedAttendanceService?.getRecentPayrollEstimation(profileResult?.data?.id)
      ]);

      // Set data from results
      setCoworkers(coworkersResult?.data || []);
      setTodayAttendance(todayResult?.data);
      setWeeklyTimecard(weeklyResult?.data);
      setRecentIncidents(incidentsResult?.data || []);
      setPayrollEstimation(payrollResult?.data);
      
    } catch (error) {
      setError(`Error cargando datos: ${error?.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAttendanceAction = async (action, location = null, notes = null) => {
    try {
      setError('');
      let result;

      switch (action) {
        case 'clock_in':
          result = await enhancedAttendanceService?.clockIn(workerProfile?.id, location, notes);
          break;
        case 'clock_out':
          result = await enhancedAttendanceService?.clockOut(workerProfile?.id, location, notes);
          break;
        case 'lunch_start':
          result = await enhancedAttendanceService?.startLunchBreak(workerProfile?.id);
          break;
        case 'lunch_end':
          result = await enhancedAttendanceService?.endLunchBreak(workerProfile?.id);
          break;
        default:
          return;
      }

      if (result?.success) {
        // Refresh attendance data
        const todayResult = await enhancedAttendanceService?.getTodayAttendanceStatus(workerProfile?.id);
        setTodayAttendance(todayResult?.data);
        
        const weeklyResult = await enhancedAttendanceService?.getWeeklyTimecard(workerProfile?.id);
        setWeeklyTimecard(weeklyResult?.data);
      } else {
        setError(result?.error || 'Error en la acción de asistencia');
      }
    } catch (error) {
      setError(`Error: ${error?.message}`);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando panel del trabajador...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error de Acceso</h2>
            <p className="text-gray-600 mb-4">{error}</p>
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
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
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
            />
          </div>

          {/* Middle Row - Timecard and Payroll */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <WeeklyTimecardSummary 
              weeklyTimecard={weeklyTimecard}
              todayAttendance={todayAttendance}
            />
            <PayrollSummaryCard 
              payrollEstimation={payrollEstimation}
              weeklyTimecard={weeklyTimecard}
              workerProfile={workerProfile}
            />
          </div>

          {/* Bottom Row - Coworkers and Incidents */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CoworkersList 
              coworkers={coworkers}
              siteInfo={workerProfile?.construction_sites}
            />
            <RecentIncidents 
              incidents={recentIncidents}
              employeeId={workerProfile?.id}
              onIncidentSubmitted={() => {
                // Refresh incidents
                enhancedAttendanceService?.getWorkerIncidents(workerProfile?.id, 5)?.then(result => setRecentIncidents(result?.data || []));
              }}
            />
          </div>

        </div>
      </main>
    </div>
  );
}