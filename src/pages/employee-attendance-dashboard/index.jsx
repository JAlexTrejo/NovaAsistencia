import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import AttendanceActionButtons from './components/AttendanceActionButtons';
import PayrollSummaryCard from './components/PayrollSummaryCard';
import PersonalIncidentLog from './components/PersonalIncidentLog';
import WeeklyTimecardTable from './components/WeeklyTimecardTable';
import ProjectAssignmentCard from './components/ProjectAssignmentCard';
import HistoricalAttendanceViewer from './components/HistoricalAttendanceViewer';

export default function EmployeeAttendanceDashboard() {
  const { user, userProfile } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  const handleAttendanceUpdate = () => {
    setRefreshKey(prev => prev + 1);
  };

  if (!user || !userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Cargando tu información...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Bienvenido, {userProfile?.full_name || user?.email}
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Panel de asistencia personal
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <AttendanceActionButtons
              siteId={userProfile?.site_id}
              onAttendanceUpdate={handleAttendanceUpdate}
            />
            
            <WeeklyTimecardTable
              userId={user?.id}
              refreshKey={refreshKey}
            />
            
            <HistoricalAttendanceViewer
              userId={user?.id}
            />
          </div>

          <div className="space-y-6">
            <ProjectAssignmentCard
              siteId={userProfile?.site_id}
              supervisorId={userProfile?.supervisor_id}
            />
            
            <PayrollSummaryCard
              userId={user?.id}
              refreshKey={refreshKey}
            />
            
            <PersonalIncidentLog
              userId={user?.id}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
