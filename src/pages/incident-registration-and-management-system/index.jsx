import React, { useState, useEffect } from 'react';
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

const IncidentRegistrationAndManagementSystem = () => {
  const [currentUser] = useState({
    id: 1,
    name: 'Carlos Mendoza',
    role: 'Supervisor',
    site: 'Obra Central',
    avatar: null
  });

  const [activeTab, setActiveTab] = useState('create');
  const [incidents, setIncidents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Mock incidents data
  const mockIncidents = [
    {
      id: 1,
      employeeId: 2,
      employeeName: 'María González',
      site: 'Obra Central',
      type: 'medical',
      reason: 'illness',
      startDate: '2025-01-03',
      endDate: '2025-01-05',
      description: 'Incapacidad médica por gripe. Adjunto certificado médico que indica reposo de 3 días. El médico recomienda evitar actividades físicas intensas.',
      status: 'pending',
      priority: 'high',
      submittedAt: new Date('2025-01-02T08:30:00'),
      attachments: [
        { id: 1, name: 'certificado_medico.pdf', size: 245760, type: 'application/pdf' },
        { id: 2, name: 'receta_medica.jpg', size: 156432, type: 'image/jpeg' }
      ],
      isUrgent: true,
      notifyHR: true
    },
    {
      id: 2,
      employeeId: 3,
      employeeName: 'Roberto Silva',
      site: 'Proyecto Norte',
      type: 'tardiness',
      reason: 'transportation',
      startDate: '2025-01-02',
      endDate: null,
      description: 'Llegada tardía debido a problemas con el transporte público. El autobús se averió en la ruta y tuve que esperar el siguiente servicio.',
      status: 'approved',
      priority: 'normal',
      submittedAt: new Date('2025-01-02T09:15:00'),
      attachments: [],
      isUrgent: false,
      notifyHR: false
    },
    {
      id: 3,
      employeeId: 4,
      employeeName: 'Ana Rodríguez',
      site: 'Edificio Sur',
      type: 'permit',
      reason: 'family_emergency',
      startDate: '2025-01-04',
      endDate: '2025-01-04',
      description: 'Solicito permiso por emergencia familiar. Mi madre fue hospitalizada y necesito acompañarla durante los procedimientos médicos.',
      status: 'pending',
      priority: 'high',
      submittedAt: new Date('2025-01-03T14:20:00'),
      attachments: [
        { id: 3, name: 'comprobante_hospital.pdf', size: 189234, type: 'application/pdf' }
      ],
      isUrgent: true,
      notifyHR: true
    },
    {
      id: 4,
      employeeId: 5,
      employeeName: 'Luis Martínez',
      site: 'Obra Central',
      type: 'absence',
      reason: 'personal_matters',
      startDate: '2024-12-28',
      endDate: '2024-12-30',
      description: 'Ausencia por asuntos personales urgentes. Necesito resolver trámites legales que no pueden posponerse.',
      status: 'rejected',
      priority: 'normal',
      submittedAt: new Date('2024-12-27T16:45:00'),
      attachments: [],
      isUrgent: false,
      notifyHR: false,
      rejectionReason: 'Falta de documentación de soporte'
    },
    {
      id: 5,
      employeeId: 6,
      employeeName: 'Carmen López',
      site: 'Proyecto Norte',
      type: 'training',
      reason: 'other',
      startDate: '2025-01-06',
      endDate: '2025-01-08',
      description: 'Capacitación en seguridad industrial requerida por la empresa. El curso incluye certificación en manejo de equipos pesados.',
      status: 'approved',
      priority: 'normal',
      submittedAt: new Date('2024-12-30T10:00:00'),
      attachments: [
        { id: 4, name: 'programa_capacitacion.pdf', size: 312456, type: 'application/pdf' }
      ],
      isUrgent: false,
      notifyHR: true
    },
    {
      id: 6,
      employeeId: 7,
      employeeName: 'Diego Herrera',
      site: 'Edificio Sur',
      type: 'emergency',
      reason: 'family_emergency',
      startDate: '2025-01-01',
      endDate: null,
      description: 'Emergencia familiar por fallecimiento de familiar directo. Requiero tiempo para arreglos funerarios y trámites legales.',
      status: 'approved',
      priority: 'high',
      submittedAt: new Date('2024-12-31T22:30:00'),
      attachments: [
        { id: 5, name: 'acta_defuncion.pdf', size: 198765, type: 'application/pdf' }
      ],
      isUrgent: true,
      notifyHR: true
    }
  ];

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIncidents(mockIncidents);
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleSubmitIncident = async (incidentData) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setIncidents(prev => [incidentData, ...prev]);
      setActiveTab('queue'); // Switch to queue tab after submission
      
      // Show success notification (would be handled by notification system)
      console.log('Incident submitted successfully:', incidentData);
    } catch (error) {
      console.error('Error submitting incident:', error);
      throw error;
    }
  };

  const handleApproveIncident = async (incidentId, comment) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setIncidents(prev => prev?.map(incident => 
        incident?.id === incidentId 
          ? { ...incident, status: 'approved', approvedAt: new Date(), approvalComment: comment }
          : incident
      ));
    } catch (error) {
      console.error('Error approving incident:', error);
    }
  };

  const handleRejectIncident = async (incidentId, reason) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setIncidents(prev => prev?.map(incident => 
        incident?.id === incidentId 
          ? { ...incident, status: 'rejected', rejectedAt: new Date(), rejectionReason: reason }
          : incident
      ));
    } catch (error) {
      console.error('Error rejecting incident:', error);
    }
  };

  const tabs = [
    { id: 'create', label: 'Registrar Incidente', icon: 'Plus', count: null },
    { id: 'queue', label: 'Cola de Aprobaciones', icon: 'Clock', count: incidents?.filter(i => i?.status === 'pending')?.length },
    { id: 'history', label: 'Historial', icon: 'FileText', count: incidents?.length },
    { id: 'analytics', label: 'Análisis', icon: 'BarChart3', count: null }
  ];

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
                onLogout={() => console.log('Logout')}
                onProfileClick={() => console.log('Profile')}
                onSiteChange={(site) => console.log('Site changed:', site)}
              />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-6">
          <NavigationBreadcrumb />
          
          {/* Tab Navigation */}
          <div className="mb-6">
            <div className="border-b border-border">
              <nav className="-mb-px flex space-x-8">
                {tabs?.map((tab) => (
                  <button
                    key={tab?.id}
                    onClick={() => setActiveTab(tab?.id)}
                    className={`
                      flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-150
                      ${activeTab === tab?.id
                        ? 'border-primary text-primary' :'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
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

          {/* Tab Content */}
          <div className="space-y-6">
            {activeTab === 'create' && (
              <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
                <div className="xl:col-span-2">
                  <IncidentCreationForm 
                    onSubmit={handleSubmitIncident}
                    currentUser={currentUser}
                  />
                </div>
                <div className="xl:col-span-3">
                  <PendingApprovalsQueue
                    incidents={incidents?.filter(i => i?.status === 'pending')?.slice(0, 5)}
                    onApprove={handleApproveIncident}
                    onReject={handleRejectIncident}
                    currentUser={currentUser}
                  />
                </div>
              </div>
            )}

            {activeTab === 'queue' && (
              <PendingApprovalsQueue
                incidents={incidents}
                onApprove={handleApproveIncident}
                onReject={handleRejectIncident}
                currentUser={currentUser}
              />
            )}

            {activeTab === 'history' && (
              <IncidentHistoryGrid
                incidents={incidents}
                currentUser={currentUser}
              />
            )}

            {activeTab === 'analytics' && (
              <IncidentAnalyticsDashboard
                incidents={incidents}
              />
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