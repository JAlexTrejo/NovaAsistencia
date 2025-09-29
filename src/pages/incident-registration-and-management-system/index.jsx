import React, { useEffect, useMemo, useState } from 'react';
import RoleBasedSidebar from '../../components/ui/RoleBasedSidebar';
import NavigationBreadcrumb from '../../components/ui/NavigationBreadcrumb';
import UserContextHeader from '../../components/ui/UserContextHeader';
import NotificationCenter from '../../components/ui/NotificationCenter';
import IncidentCreationForm from './components/IncidentCreationForm';
import PendingApprovalsQueue from './components/PendingApprovalsQueue';
import IncidentHistoryGrid from './components/IncidentHistoryGrid';
import IncidentAnalyticsDashboard from './components/IncidentAnalyticsDashboard';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { incidentService } from '../../services/incidentService';

const IncidentRegistrationAndManagementSystem = () => {
  const { userProfile } = useAuth();

  const currentUser = useMemo(
    () => ({
      id: userProfile?.id,
      name: userProfile?.full_name || 'Usuario',
      role:
        userProfile?.role === 'superadmin'
          ? 'SuperAdmin'
          : userProfile?.role === 'admin'
          ? 'Admin'
          : userProfile?.role === 'supervisor'
          ? 'Supervisor'
          : 'Employee',
      site: '—',
      avatar: null,
    }),
    [userProfile]
  );

  const [activeTab, setActiveTab] = useState('create');

  // estado de datos
  const [incidents, setIncidents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // filtros/paginación (ajústalos si tus subcomponentes ya traen internos)
  const [queueStatus] = useState('pending'); // para cola
  const [historyStatus, setHistoryStatus] = useState('all'); // para historial
  const [historyPage, setHistoryPage] = useState(0);
  const [historyPageSize] = useState(20);
  const [historyTotal, setHistoryTotal] = useState(0);

  // --------- CARGA INICIAL: cola + historial ----------
  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      try {
        setIsLoading(true);

        // Cargar cola (pendientes)
        const queueRes = await incidentService.listIncidents({
          status: queueStatus, // 'pending'
          page: 0,
          pageSize: 50,
        });

        // Cargar historial (todos o por filtro)
        const histRes = await incidentService.listIncidents({
          status: historyStatus === 'all' ? undefined : historyStatus,
          page: historyPage,
          pageSize: historyPageSize,
        });

        if (!mounted) return;

        // fusión simple: puedes separar estados si tus componentes lo requieren
        // aquí mantenemos un único arreglo y filtramos al mostrar
        const merged = [
          ...(queueRes?.data?.rows || []),
          ...(histRes?.data?.rows || []),
        ];
        // si quieres evitar duplicados por id
        const uniqueById = Object.values(
          merged.reduce((acc, it) => {
            acc[it.id] = it;
            return acc;
          }, {})
        );

        setIncidents(uniqueById);
        setHistoryTotal(histRes?.data?.count || 0);
      } catch (e) {
        console.error('Error loading incidents:', e);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    bootstrap();
    return () => {
      mounted = false;
    };
  }, [queueStatus, historyStatus, historyPage, historyPageSize]);

  // --------- UTIL: recargar datos (por ejemplo tras crear/aprobar/rechazar) ----------
  const reload = async () => {
    try {
      setIsLoading(true);
      const [queueRes, histRes] = await Promise.all([
        incidentService.listIncidents({
          status: queueStatus,
          page: 0,
          pageSize: 50,
        }),
        incidentService.listIncidents({
          status: historyStatus === 'all' ? undefined : historyStatus,
          page: historyPage,
          pageSize: historyPageSize,
        }),
      ]);

      const merged = [
        ...(queueRes?.data?.rows || []),
        ...(histRes?.data?.rows || []),
      ];
      const uniqueById = Object.values(
        merged.reduce((acc, it) => {
          acc[it.id] = it;
          return acc;
        }, {})
      );
      setIncidents(uniqueById);
      setHistoryTotal(histRes?.data?.count || 0);
    } catch (e) {
      console.error('Error reloading incidents:', e);
    } finally {
      setIsLoading(false);
    }
  };

  // --------- manejadores de acciones ----------
  const handleIncidentCreated = (created) => {
    // el form ya la creó en la DB; aquí refrescamos y pasamos a "queue"
    setActiveTab('queue');
    reload();
  };

  const handleApproveIncident = async (incidentId, comment) => {
    try {
      await incidentService.approveIncident(incidentId, comment);
      await reload();
    } catch (e) {
      console.error('Error approving incident:', e);
    }
  };

  const handleRejectIncident = async (incidentId, reason) => {
    try {
      await incidentService.rejectIncident(incidentId, reason);
      await reload();
    } catch (e) {
      console.error('Error rejecting incident:', e);
    }
  };

  // --------- tabs ----------
  const tabs = [
    { id: 'create', label: 'Registrar Incidente', icon: 'Plus', count: null },
    {
      id: 'queue',
      label: 'Cola de Aprobaciones',
      icon: 'Clock',
      count: incidents?.filter((i) => i?.status === 'pending')?.length || 0,
    },
    {
      id: 'history',
      label: 'Historial',
      icon: 'FileText',
      count: incidents?.length || 0,
    },
    { id: 'analytics', label: 'Análisis', icon: 'BarChart3', count: null },
  ];

  // --------- loading inicial ----------
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex">
        <RoleBasedSidebar userRole={currentUser?.role?.toLowerCase()} />
        <div className="flex-1 ml-0 md:ml-60">
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <Icon name="Loader2" size={48} className="mx-auto text-primary animate-spin mb-4" />
              <p className="text-lg font-medium text-foreground">Cargando sistema de incidentes...</p>
              <p className="text-sm text-muted-foreground mt-1">Preparando datos y configuraciones</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --------- render ----------
  return (
    <div className="min-h-screen bg-background">
      <RoleBasedSidebar userRole={currentUser?.role?.toLowerCase()} />
      <div className="flex-1 ml-0 md:ml-60">
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Icon name="AlertTriangle" size={24} className="text-primary" />
                <h1 className="text-xl font-semibold text-foreground">
                  Sistema de Gestión de Incidentes
                </h1>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <NotificationCenter />
              <UserContextHeader
                user={currentUser}
                onLogout={() => {}}
                onProfileClick={() => {}}
                onSiteChange={() => {}}
              />
            </div>
          </div>
        </header>

        {/* Main */}
        <main className="p-6">
          <NavigationBreadcrumb />

          {/* Tabs */}
          <div className="mb-6">
            <div className="border-b border-border">
              <nav className="-mb-px flex space-x-8">
                {tabs?.map((tab) => (
                  <button
                    key={tab?.id}
                    onClick={() => setActiveTab(tab?.id)}
                    className={`
                      flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-150
                      ${
                        activeTab === tab?.id
                          ? 'border-primary text-primary'
                          : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                      }
                    `}
                  >
                    <Icon name={tab?.icon} size={16} />
                    <span>{tab?.label}</span>
                    {tab?.count !== null && tab?.count > 0 && (
                      <span className="bg-primary text-primary-foreground text-xs font-medium px-2 py-0.5 rounded-full">
                        {tab?.count}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-6">
            {activeTab === 'create' && (
              <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
                <div className="xl:col-span-2">
                  <IncidentCreationForm
                    // Si como supervisor eliges a qué empleado va, pásalo por prop: targetEmployeeId="uuid"
                    onIncidentCreated={handleIncidentCreated}
                    onCancel={() => setActiveTab('queue')}
                  />
                </div>
                <div className="xl:col-span-3">
                  <PendingApprovalsQueue
                    incidents={incidents?.filter((i) => i?.status === 'pending')}
                    onApprove={handleApproveIncident}
                    onReject={handleRejectIncident}
                    currentUser={currentUser}
                  />
                </div>
              </div>
            )}

            {activeTab === 'queue' && (
              <PendingApprovalsQueue
                incidents={incidents?.filter((i) => i?.status === 'pending')}
                onApprove={handleApproveIncident}
                onReject={handleRejectIncident}
                currentUser={currentUser}
              />
            )}

            {activeTab === 'history' && (
              <IncidentHistoryGrid
                incidents={
                  historyStatus === 'all'
                    ? incidents
                    : incidents?.filter((i) => i?.status === historyStatus)
                }
                currentUser={currentUser}
                statusFilter={historyStatus}
                onStatusFilterChange={(s) => {
                  setHistoryPage(0);
                  setHistoryStatus(s || 'all');
                  reload();
                }}
                page={historyPage}
                onPageChange={(p) => {
                  setHistoryPage(p);
                  reload();
                }}
                pageSize={historyPageSize}
                total={historyTotal}
              />
            )}

            {activeTab === 'analytics' && (
              <IncidentAnalyticsDashboard incidents={incidents} />
            )}
          </div>

          {/* Quick Actions Floating Button */}
          <div className="fixed bottom-6 right-6 z-40">
            <div className="flex flex-col space-y-2">
              {activeTab !== 'create' && (
                <Button
                  onClick={() => setActiveTab('create')}
                  className="rounded-full shadow-lg"
                  iconName="Plus"
                  iconSize={20}
                >
                  Nuevo Incidente
                </Button>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default IncidentRegistrationAndManagementSystem;
