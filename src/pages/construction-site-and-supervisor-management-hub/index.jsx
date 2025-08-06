import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import RoleBasedSidebar from '../../components/ui/RoleBasedSidebar';
import NavigationBreadcrumb from '../../components/ui/NavigationBreadcrumb';
import UserContextHeader from '../../components/ui/UserContextHeader';
import NotificationCenter from '../../components/ui/NotificationCenter';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';

// Import components
import SiteCard from './components/SiteCard';
import SupervisorCard from './components/SupervisorCard';
import OrganizationalTree from './components/OrganizationalTree';
import BulkAssignmentPanel from './components/BulkAssignmentPanel';
import QuickStatsPanel from './components/QuickStatsPanel';

const ConstructionSiteAndSupervisorManagementHub = () => {
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('sites');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedNode, setSelectedNode] = useState(null);
  const [showBulkAssignment, setShowBulkAssignment] = useState(false);
  const [userRole] = useState('admin'); // Mock user role

  // Mock data
  const mockSites = [
    {
      id: 1,
      name: "Torre Empresarial Norte",
      code: "TEN-001",
      location: "Av. Libertador, Caracas",
      status: "active",
      progress: 75,
      employeeCount: 45,
      startDate: "2024-01-15",
      endDate: "2024-12-20",
      description: "Construcción de torre empresarial de 25 pisos con oficinas comerciales y estacionamiento subterráneo.",
      supervisor: {
        id: 1,
        name: "Carlos Mendoza",
        email: "carlos.mendoza@empresa.com"
      }
    },
    {
      id: 2,
      name: "Complejo Residencial Sur",
      code: "CRS-002",
      location: "Urbanización El Rosal, Valencia",
      status: "planning",
      progress: 25,
      employeeCount: 32,
      startDate: "2024-03-01",
      endDate: "2025-06-30",
      description: "Desarrollo residencial con 120 apartamentos distribuidos en 6 edificios de 4 pisos cada uno.",
      supervisor: {
        id: 2,
        name: "María González",
        email: "maria.gonzalez@empresa.com"
      }
    },
    {
      id: 3,
      name: "Centro Comercial Plaza",
      code: "CCP-003",
      location: "Zona Industrial, Maracay",
      status: "active",
      progress: 60,
      employeeCount: 28,
      startDate: "2023-11-10",
      endDate: "2024-08-15",
      description: "Centro comercial de 3 niveles con 80 locales comerciales, área de comidas y cine.",
      supervisor: null
    },
    {
      id: 4,
      name: "Puente Vehicular Este",
      code: "PVE-004",
      location: "Autopista Regional, Barquisimeto",
      status: "completed",
      progress: 100,
      employeeCount: 15,
      startDate: "2023-06-01",
      endDate: "2024-01-30",
      description: "Construcción de puente vehicular de 4 carriles con ciclovía y aceras peatonales.",
      supervisor: {
        id: 3,
        name: "Roberto Silva",
        email: "roberto.silva@empresa.com"
      }
    }
  ];

  const mockSupervisors = [
    {
      id: 1,
      name: "Carlos Mendoza",
      email: "carlos.mendoza@empresa.com",
      phone: "+58 412-1234567",
      status: "active",
      assignedSites: 2,
      totalEmployees: 73,
      experience: 12,
      hireDate: "2018-03-15",
      specialization: "Construcción de Edificios",
      avatar: null,
      sites: ["Torre Empresarial Norte", "Edificio Residencial Centro"],
      certifications: ["PMP", "Seguridad Industrial", "Gestión de Calidad"]
    },
    {
      id: 2,
      name: "María González",
      email: "maria.gonzalez@empresa.com",
      phone: "+58 414-2345678",
      status: "active",
      assignedSites: 1,
      totalEmployees: 32,
      experience: 8,
      hireDate: "2020-07-22",
      specialization: "Proyectos Residenciales",
      avatar: null,
      sites: ["Complejo Residencial Sur"],
      certifications: ["Arquitectura Sostenible", "BIM", "Seguridad Industrial"]
    },
    {
      id: 3,
      name: "Roberto Silva",
      email: "roberto.silva@empresa.com",
      phone: "+58 416-3456789",
      status: "vacation",
      assignedSites: 1,
      totalEmployees: 15,
      experience: 15,
      hireDate: "2015-11-08",
      specialization: "Infraestructura Vial",
      avatar: null,
      sites: ["Puente Vehicular Este"],
      certifications: ["Ingeniería Civil", "Gestión de Proyectos", "Topografía"]
    },
    {
      id: 4,
      name: "Ana Rodríguez",
      email: "ana.rodriguez@empresa.com",
      phone: "+58 424-4567890",
      status: "active",
      assignedSites: 0,
      totalEmployees: 0,
      experience: 6,
      hireDate: "2021-02-14",
      specialization: "Construcción Comercial",
      avatar: null,
      sites: [],
      certifications: ["Gestión de Calidad", "Seguridad Industrial"]
    }
  ];

  const mockEmployees = [
    { id: 1, name: "Juan Pérez", position: "Albañil", currentSite: "Torre Empresarial Norte" },
    { id: 2, name: "Luis García", position: "Electricista", currentSite: "Complejo Residencial Sur" },
    { id: 3, name: "Pedro Martínez", position: "Plomero", currentSite: null },
    { id: 4, name: "José López", position: "Soldador", currentSite: "Centro Comercial Plaza" }
  ];

  const statusOptions = [
    { value: 'all', label: 'Todos los estados' },
    { value: 'active', label: 'Activo' },
    { value: 'planning', label: 'Planificación' },
    { value: 'completed', label: 'Completado' },
    { value: 'suspended', label: 'Suspendido' }
  ];

  const supervisorStatusOptions = [
    { value: 'all', label: 'Todos los estados' },
    { value: 'active', label: 'Activo' },
    { value: 'inactive', label: 'Inactivo' },
    { value: 'vacation', label: 'Vacaciones' }
  ];

  // Filter functions
  const filteredSites = mockSites?.filter(site => {
    const matchesSearch = site?.name?.toLowerCase()?.includes(searchTerm?.toLowerCase()) ||
                         site?.location?.toLowerCase()?.includes(searchTerm?.toLowerCase()) ||
                         site?.code?.toLowerCase()?.includes(searchTerm?.toLowerCase());
    const matchesStatus = filterStatus === 'all' || site?.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const filteredSupervisors = mockSupervisors?.filter(supervisor => {
    const matchesSearch = supervisor?.name?.toLowerCase()?.includes(searchTerm?.toLowerCase()) ||
                         supervisor?.email?.toLowerCase()?.includes(searchTerm?.toLowerCase());
    const matchesStatus = filterStatus === 'all' || supervisor?.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Event handlers
  const handleSiteEdit = (site) => {
    console.log('Editar sitio:', site);
  };

  const handleSiteDelete = (site) => {
    console.log('Eliminar sitio:', site);
  };

  const handleSiteViewDetails = (site) => {
    console.log('Ver detalles del sitio:', site);
  };

  const handleAssignSupervisor = (site) => {
    console.log('Asignar supervisor al sitio:', site);
  };

  const handleSupervisorEdit = (supervisor) => {
    console.log('Editar supervisor:', supervisor);
  };

  const handleSupervisorDelete = (supervisor) => {
    console.log('Eliminar supervisor:', supervisor);
  };

  const handleSupervisorViewDetails = (supervisor) => {
    console.log('Ver detalles del supervisor:', supervisor);
  };

  const handleAssignSites = (supervisor) => {
    console.log('Asignar sitios al supervisor:', supervisor);
  };

  const handleNodeSelect = (node) => {
    setSelectedNode(node);
  };

  const handleDragDrop = (draggedItem, targetItem) => {
    console.log('Reorganizar estructura:', draggedItem, targetItem);
  };

  const handleBulkAssign = async (assignmentData) => {
    console.log('Asignación masiva:', assignmentData);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  const handleViewReports = (node) => {
    console.log('Ver reportes para:', node);
    navigate('/comprehensive-reporting-and-export-center');
  };

  const handleExportData = (node) => {
    console.log('Exportar datos para:', node);
  };

  const handleLogout = () => {
    navigate('/employee-login-portal');
  };

  useEffect(() => {
    document.title = 'Gestión de Sitios y Supervisores - AsistenciaPro';
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <RoleBasedSidebar 
        isCollapsed={sidebarCollapsed} 
        userRole={userRole}
      />
      <div className={`transition-all duration-300 ease-out-cubic ${sidebarCollapsed ? 'md:ml-16' : 'md:ml-60'}`}>
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="hidden md:flex"
              >
                <Icon name={sidebarCollapsed ? 'ChevronRight' : 'ChevronLeft'} size={20} />
              </Button>
              
              <div>
                <h1 className="text-2xl font-bold text-foreground">Gestión de Sitios y Supervisores</h1>
                <p className="text-sm text-muted-foreground">
                  Administra la estructura organizacional y asignaciones
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <NotificationCenter />
              <UserContextHeader onLogout={handleLogout} />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-6">
          <NavigationBreadcrumb />

          <div className="grid grid-cols-12 gap-6 h-[calc(100vh-200px)]">
            {/* Left Panel - Organizational Tree */}
            <div className="col-span-12 lg:col-span-4 xl:col-span-3">
              <OrganizationalTree
                sites={mockSites}
                supervisors={mockSupervisors}
                onNodeSelect={handleNodeSelect}
                selectedNode={selectedNode}
                onDragDrop={handleDragDrop}
                userRole={userRole}
              />
            </div>

            {/* Center Panel - Main Content */}
            <div className="col-span-12 lg:col-span-5 xl:col-span-6">
              <div className="bg-card border border-border rounded-lg h-full flex flex-col">
                {/* Tabs */}
                <div className="flex items-center justify-between p-4 border-b border-border">
                  <div className="flex items-center space-x-1">
                    <Button
                      variant={activeTab === 'sites' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setActiveTab('sites')}
                      iconName="Building2"
                      iconPosition="left"
                    >
                      Sitios ({mockSites?.length})
                    </Button>
                    <Button
                      variant={activeTab === 'supervisors' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setActiveTab('supervisors')}
                      iconName="UserCheck"
                      iconPosition="left"
                    >
                      Supervisores ({mockSupervisors?.length})
                    </Button>
                  </div>

                  <div className="flex items-center space-x-2">
                    {userRole === 'admin' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowBulkAssignment(!showBulkAssignment)}
                        iconName="Users"
                        iconPosition="left"
                      >
                        Asignación masiva
                      </Button>
                    )}
                    
                    <Button
                      variant="default"
                      size="sm"
                      iconName="Plus"
                      iconPosition="left"
                    >
                      {activeTab === 'sites' ? 'Nuevo sitio' : 'Nuevo supervisor'}
                    </Button>
                  </div>
                </div>

                {/* Filters */}
                <div className="p-4 border-b border-border">
                  <div className="flex items-center space-x-4">
                    <div className="flex-1">
                      <Input
                        type="search"
                        placeholder={`Buscar ${activeTab === 'sites' ? 'sitios' : 'supervisores'}...`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e?.target?.value)}
                      />
                    </div>
                    <div className="w-48">
                      <Select
                        options={activeTab === 'sites' ? statusOptions : supervisorStatusOptions}
                        value={filterStatus}
                        onChange={setFilterStatus}
                        placeholder="Filtrar por estado"
                      />
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                  {showBulkAssignment ? (
                    <BulkAssignmentPanel
                      sites={mockSites}
                      supervisors={mockSupervisors}
                      employees={mockEmployees}
                      onBulkAssign={handleBulkAssign}
                      onClose={() => setShowBulkAssignment(false)}
                      userRole={userRole}
                    />
                  ) : (
                    <div className="space-y-4">
                      {activeTab === 'sites' ? (
                        filteredSites?.length > 0 ? (
                          filteredSites?.map(site => (
                            <SiteCard
                              key={site?.id}
                              site={site}
                              onEdit={handleSiteEdit}
                              onDelete={handleSiteDelete}
                              onViewDetails={handleSiteViewDetails}
                              onAssignSupervisor={handleAssignSupervisor}
                              userRole={userRole}
                            />
                          ))
                        ) : (
                          <div className="text-center py-12">
                            <Icon name="Building2" size={48} className="mx-auto text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold text-foreground mb-2">No se encontraron sitios</h3>
                            <p className="text-muted-foreground mb-4">
                              {searchTerm ? 'Intenta con otros términos de búsqueda' : 'Comienza creando tu primer sitio de construcción'}
                            </p>
                            {userRole === 'admin' && (
                              <Button iconName="Plus" iconPosition="left">
                                Crear nuevo sitio
                              </Button>
                            )}
                          </div>
                        )
                      ) : (
                        filteredSupervisors?.length > 0 ? (
                          filteredSupervisors?.map(supervisor => (
                            <SupervisorCard
                              key={supervisor?.id}
                              supervisor={supervisor}
                              onEdit={handleSupervisorEdit}
                              onDelete={handleSupervisorDelete}
                              onViewDetails={handleSupervisorViewDetails}
                              onAssignSites={handleAssignSites}
                              userRole={userRole}
                            />
                          ))
                        ) : (
                          <div className="text-center py-12">
                            <Icon name="UserCheck" size={48} className="mx-auto text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold text-foreground mb-2">No se encontraron supervisores</h3>
                            <p className="text-muted-foreground mb-4">
                              {searchTerm ? 'Intenta con otros términos de búsqueda' : 'Comienza agregando supervisores a tu equipo'}
                            </p>
                            {userRole === 'admin' && (
                              <Button iconName="Plus" iconPosition="left">
                                Agregar supervisor
                              </Button>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Panel - Quick Stats */}
            <div className="col-span-12 lg:col-span-3">
              <QuickStatsPanel
                sites={mockSites}
                supervisors={mockSupervisors}
                onViewReports={handleViewReports}
                onExportData={handleExportData}
                selectedNode={selectedNode}
              />
            </div>
          </div>
        </main>
      </div>
      {/* Mobile Bottom Navigation Spacer */}
      <div className="md:hidden h-16"></div>
    </div>
  );
};

export default ConstructionSiteAndSupervisorManagementHub;