import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import RoleBasedSidebar from '../../components/ui/RoleBasedSidebar';

import NavigationHeader from '../../components/ui/NavigationHeader';
import UserContextHeader from '../../components/ui/UserContextHeader';
import NotificationCenter from '../../components/ui/NotificationCenter';
import { AttendanceActionButtons } from './components/AttendanceActionButtons';
import WeeklyTimecardTable from './components/WeeklyTimecardTable';
import PayrollSummaryCard from './components/PayrollSummaryCard';
import HistoricalAttendanceViewer from './components/HistoricalAttendanceViewer';
import PersonalIncidentLog from './components/PersonalIncidentLog';
import ProjectAssignmentCard from './components/ProjectAssignmentCard';
import Icon from '../../components/AppIcon';

const EmployeeAttendanceDashboard = () => {
  const navigate = useNavigate();
  const { user, userProfile, signOut } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentStatus, setCurrentStatus] = useState('clocked_out');
  const [locationStatus, setLocationStatus] = useState('available');
  const [isLoading, setIsLoading] = useState(false);

  // Use real user data from auth context
  const currentUser = {
    name: userProfile?.full_name || user?.email?.split('@')?.[0] || 'Usuario',
    role: userProfile?.role === 'superadmin' ? 'SuperAdmin' : 
          userProfile?.role === 'admin' ? 'Admin' :
          userProfile?.role === 'supervisor'? 'Supervisor' : 'Employee',
    site: 'Obra Central', // This could come from user profile later
    avatar: null,
    email: user?.email
  };

  // Mock current week data
  const [currentWeekStart] = useState(() => {
    const today = new Date();
    const monday = new Date(today);
    monday?.setDate(today?.getDate() - today?.getDay() + 1);
    return monday;
  });

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.ctrlKey) {
        switch (event.key) {
          case '1':
            event.preventDefault();
            if (currentStatus === 'clocked_out') handleClockIn();
            break;
          case '2':
            event.preventDefault();
            if (currentStatus === 'clocked_in') handleLunchStart();
            else if (currentStatus === 'lunch_started') handleLunchEnd();
            break;
          case '3':
            event.preventDefault();
            if (currentStatus === 'clocked_in' || currentStatus === 'lunch_ended') handleClockOut();
            break;
          default:
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStatus]);

  // Check location status
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation?.getCurrentPosition(
        () => setLocationStatus('available'),
        () => setLocationStatus('unavailable')
      );
    } else {
      setLocationStatus('unavailable');
    }
  }, []);

  const handleClockIn = async () => {
    setIsLoading(true);
    try {
      // TODO: Integrate with attendance service
      await new Promise(resolve => setTimeout(resolve, 1500));
      setCurrentStatus('clocked_in');
      // Show success notification
    } catch (error) {
      console.error('Error clocking in:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLunchStart = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setCurrentStatus('lunch_started');
    } catch (error) {
      console.error('Error starting lunch:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLunchEnd = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setCurrentStatus('lunch_ended');
    } catch (error) {
      console.error('Error ending lunch:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClockOut = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setCurrentStatus('clocked_out');
    } catch (error) {
      console.error('Error clocking out:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
      // Force navigation even if logout fails
      navigate('/login', { replace: true });
    }
  };

  const handleSiteChange = (site) => {
    console.log('Site changed to:', site?.name);
  };

  const handleDateClick = (date) => {
    console.log('Date clicked:', date);
  };

  const handleViewPayrollDetails = () => {
    navigate('/admin/payroll');
  };

  const handleDateRangeChange = (range) => {
    console.log('Date range changed:', range);
  };

  const handleExportData = (period, data) => {
    console.log('Exporting data:', period, data);
  };

  const handleViewIncident = (incident) => {
    if (incident === 'all') {
      navigate('/admin/incidents');
    } else {
      console.log('Viewing incident:', incident);
    }
  };

  const handleCreateIncident = () => {
    navigate('/admin/incidents');
  };

  const handleContactSupervisor = () => {
    console.log('Contacting supervisor');
  };

  const handleViewProjectDetails = () => {
    navigate('/supervisor/sites');
  };

  const handleNotificationClick = (notification) => {
    console.log('Notification clicked:', notification);
  };

  const handleMarkAsRead = (notificationId) => {
    console.log('Mark as read:', notificationId);
  };

  const handleMarkAllAsRead = () => {
    console.log('Mark all as read');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <RoleBasedSidebar 
        isCollapsed={sidebarCollapsed}
        userRole={userProfile?.role || 'user'}
      />
      {/* Main Content */}
      <div className={`transition-all duration-300 ease-out-cubic ${
        sidebarCollapsed ? 'md:ml-16' : 'md:ml-60'
      }`}>
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-card border-b border-border">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="hidden md:flex p-2 hover:bg-muted rounded-lg transition-colors duration-150 ease-out-cubic"
              >
                <Icon name={sidebarCollapsed ? 'ChevronRight' : 'ChevronLeft'} size={20} />
              </button>
              
              <div>
                <h1 className="text-xl font-semibold text-foreground">
                  Dashboard de Asistencia
                </h1>
                <p className="text-sm text-muted-foreground">
                  Bienvenido, {currentUser?.name}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <NotificationCenter
                onNotificationClick={handleNotificationClick}
                onMarkAsRead={handleMarkAsRead}
                onMarkAllAsRead={handleMarkAllAsRead}
              />
              
              <UserContextHeader
                user={currentUser}
                onLogout={handleLogout}
                onSiteChange={handleSiteChange}
              />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6 pb-20 md:pb-6">
          {/* Navigation Header */}
          <NavigationHeader 
            showBackButton={false}
            showHomeButton={false}
          />

          {/* Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Main Actions */}
            <div className="lg:col-span-2 space-y-6">
              {/* Attendance Actions */}
              <AttendanceActionButtons
                currentStatus={currentStatus}
                onClockIn={handleClockIn}
                onLunchStart={handleLunchStart}
                onLunchEnd={handleLunchEnd}
                onClockOut={handleClockOut}
                isLoading={isLoading}
                locationStatus={locationStatus}
              />

              {/* Weekly Timecard */}
              <WeeklyTimecardTable
                currentWeekStart={currentWeekStart}
                onDateClick={handleDateClick}
              />

              {/* Historical Attendance */}
              <HistoricalAttendanceViewer
                onDateRangeChange={handleDateRangeChange}
                onExportData={handleExportData}
              />
            </div>

            {/* Right Column - Summary & Info */}
            <div className="space-y-6">
              {/* Payroll Summary */}
              <PayrollSummaryCard
                onViewDetails={handleViewPayrollDetails}
              />

              {/* Project Assignment */}
              <ProjectAssignmentCard
                onContactSupervisor={handleContactSupervisor}
                onViewProjectDetails={handleViewProjectDetails}
              />

              {/* Personal Incidents */}
              <PersonalIncidentLog
                onViewIncident={handleViewIncident}
                onCreateIncident={handleCreateIncident}
              />
            </div>
          </div>

          {/* Quick Actions Footer - Mobile Only */}
          <div className="md:hidden fixed bottom-16 left-4 right-4 bg-card border border-border rounded-lg p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <div className="font-medium text-foreground">Acciones Rápidas</div>
                <div className="text-xs text-muted-foreground">
                  Estado: {currentStatus === 'clocked_out' ? 'Fuera' : 'Trabajando'}
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => navigate('/admin/incidents')}
                  className="p-2 bg-warning text-warning-foreground rounded-md"
                >
                  <Icon name="AlertTriangle" size={16} />
                </button>
                <button
                  onClick={() => navigate('/admin/payroll')}
                  className="p-2 bg-primary text-primary-foreground rounded-md"
                >
                  <Icon name="Calculator" size={16} />
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default EmployeeAttendanceDashboard;