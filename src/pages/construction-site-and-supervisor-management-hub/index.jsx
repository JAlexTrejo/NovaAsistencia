import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RoleBasedSidebar from '../../components/ui/RoleBasedSidebar';
import NavigationBreadcrumb from '../../components/ui/NavigationBreadcrumb';
import UserContextHeader from '../../components/ui/UserContextHeader';
import NotificationCenter from '../../components/ui/NotificationCenter';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';

import SiteCard from './components/SiteCard';
import SupervisorCard from './components/SupervisorCard';
import OrganizationalTree from './components/OrganizationalTree';
import BulkAssignmentPanel from './components/BulkAssignmentPanel';
import QuickStatsPanel from './components/QuickStatsPanel';

// NUEVO: datos reales
import { useQuery } from '@/hooks/useQuery';
import { getAllSites } from '@/services/constructionSiteService';
import Loading from '@/components/ui/Loading';
import ErrorState from '@/components/ui/ErrorState';
import { showToast } from '@/components/ui/ToastHub';

const ConstructionSiteAndSupervisorManagementHub = () => {
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('sites');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedNode, setSelectedNode] = useState(null);
  const [showBulkAssignment, setShowBulkAssignment] = useState(false);
  const [userRole] = useState('admin'); // TODO: obtener de AuthContext si ya lo tienes

  // ------------------------------
  // 1) SITIOS: datos reales (paginación + búsqueda)
  // ------------------------------
  const [page, setPage] = useState(0);

  const {
    data: sitesData,
    isLoading: sitesLoading,
    isFetching: sitesFetching,
    error: sitesError,
    refetch: refetchSites,
  } = useQuery(getAllSites, {
    params: { page, search: searchTerm },
    deps: [page, searchTerm],
    keepPreviousData: true,
    onError: (e) =>
      showToast({
        title: 'Error al cargar sitios',
        message: e.message || 'Intenta nuevamente',
        type: 'error',
      }),
  });

  const sitesRows = sitesData?.rows ?? [];
  const sitesCount = sitesData?.count ?? 0;
  const pageSize = sitesData?.pageSize ?? 50;
  const totalPages = Math.max(1, Math.ceil(sitesCount / pageSize));

  // Filtrado de estado (cliente): 'active' -> is_active true, el resto queda como ALL por ahora
  const filteredSites = useMemo(() => {
    const s = sitesRows.filter((site) => {
      const matchesSearch =
        !searchTerm ||
        site?.name?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
        site?.location?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
        (site?.code ? site.code.toLowerCase().includes(searchTerm.toLowerCase()) : false);

    // Nota: en el esquema real no siempre hay 'status'; usamos is_active para 'active'
      const matchesStatus =
        filterStatus === 'all' ? true :
        filterStatus === 'active' ? !!site?.is_active :
        true; // otros estados no están implementados en DB; dejamos pasar

      return matchesSearch && matchesStatus;
    });
    return s;
  }, [sitesRows, searchTerm, filterStatus]);

  // ------------------------------
  // 2) SUPERVISORES: de momento mock (si ya tienes tabla, los conectamos luego)
  // ------------------------------
  const mockSupervisors = [
    { id: 1, name: 'Carlos Mendoza', email: 'carlos.mendoza@empresa.com', phone: '+52 55 1111 2222', status: 'active', assignedSites: 2, totalEmployees: 73, experience: 12, hireDate: '2018-03-15', specialization: 'Construcción de Edificios', avatar: null, sites: ['Torre Empresarial Norte', 'Edificio Residencial Centro'], certifications: ['PMP', 'Seguridad Industrial', 'Gestión de Calidad'] },
    { id: 2, name: 'María González', email: 'maria.gonzalez@empresa.com', phone: '+52 55 2222 3333', status: 'active', assignedSites: 1, totalEmployees: 32, experience: 8, hireDate: '2020-07-22', specialization: 'Proyectos Residenciales', avatar: null, sites: ['Complejo Residencial Sur'], certifications: ['Arquitectura Sostenible', 'BIM', 'Seguridad Industrial'] },
    { id: 3, name: 'Roberto Silva', email: 'roberto.silva@empresa.com', phone: '+52 55 3333 4444', status: 'vacation', assignedSites: 1, totalEmployees: 15, experience: 15, hireDate: '2015-11-08', specialization: 'Infraestructura Vial', avatar: null, sites: ['Puente Vehicular Este'], certifications: ['Ingeniería Civil', 'Gestión de Proyectos', 'Topografía'] },
    { id: 4, name: 'Ana Rodríguez', email: 'ana.rodriguez@empresa.com', phone: '+52 55 4444 5555', status: 'active', assignedSites: 0, totalEmployees: 0, experience: 6, hireDate: '2021-02-14', specialization: 'Construcción Comercial', avatar: null, sites: [], certifications: ['Gestión de Calidad', 'Seguridad Industrial'] },
  ];

  const filteredSupervisors = useMemo(() => {
    return mockSupervisors.filter((supervisor) => {
      const matchesSearch =
        !searchTerm ||
        supervisor?.name?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
        supervisor?.email?.toLowerCase()?.includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || supervisor?.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [searchTerm, filterStatus]);

  const statusOptions = [
    { value: 'all', label: 'Todos los estados' },
    { value: 'active', label: 'Activo' },
    // Los siguientes son placeholders; si tu tabla tiene columna 'status', podemos mapearlos
    { value: 'planning', label: 'Planificación' },
    { value: 'completed', label: 'Completado' },
    { value: 'suspended', label: 'Suspendido' },
  ];

  const supervisorStatusOptions = [
    { value: 'all', label: 'Todos los estados' },
    { value: 'active', label: 'Activo' },
    { value: 'inactive', label: 'Inactivo' },
    { value: 'vacation', label: 'Vacaciones' },
  ];

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
    await new Promise((resolve) => setTimeout(resolve, 1000));
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
      <RoleBasedSidebar isCollapsed={sidebarCollapsed} userRole={userRole} />
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
                <p className="text-sm text-muted-foreground">Administra la estructura organizacional y asignaciones</p>
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
                // Pasamos sitios reales (sin filtrar) al árbol para ver toda la estructura
                sites={sitesRows}
                supervisors={mockSupervisors}
                onNodeSelect={handleNodeSelect}
                selectedNode={selectedNode}
                onDragDrop={handleDragDrop}
                userRole={userRole}
                isLoading={sitesLoading}
              />
            </div>

            {/* Center Panel */}
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
                      Sitios ({sitesCount})
                    </Button>
                    <Button
                      variant={activeTab === 'supervisors' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setActiveTab('supervisors')}
                      iconName="UserCheck"
                      iconPosition="left"
                    >
                      Supervisores ({mockSupervisors.length})
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

                    <Button variant="default" size="sm" iconName="Plus" iconPosition="left">
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
                        onChange={(e) => {
                          setPage(0); // reset página al cambiar búsqueda
                          setSearchTerm(e?.target?.value);
                        }}
                      />
                    </div>
                    <div className="w-48">
                      <Select
                        options={activeTab === 'sites' ? [
                          { value: 'all', label: 'Todos los estados' },
                          { value: 'active', label: 'Activo' },
                          // Los demás estados son placeholders
                          { value: 'planning', label: 'Planificación' },
                          { value: 'completed', label: 'Completado' },
                          { value: 'suspended', label: 'Suspendido' },
                        ] : [
                          { value: 'all', label: 'Todos los estados' },
                          { value: 'active', label: 'Activo' },
                          { value: 'inactive', label: 'Inactivo' },
                          { value: 'vacation', label: 'Vacaciones' },
                        ]}
                        value={filterStatus}
                        onChange={(val) => {
                          setPage(0);
                          setFilterStatus(val);
                        }}
                        placeholder="Filtrar por estado"
                      />
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                  {showBulkAssignment ? (
                    <BulkAssignmentPanel
                      sites={sitesRows}
                      supervisors={mockSupervisors}
                      employees={[]}
                      onBulkAssign={handleBulkAssign}
                      onClose={() => setShowBulkAssignment(false)}
                      userRole={userRole}
                    />
                  ) : activeTab === 'sites' ? (
                    sitesLoading ? (
                      <Loading label="Cargando sitios…" />
                    ) : sitesError ? (
                      <ErrorState message={sitesError.message} onRetry={refetchSites} />
                    ) : filteredSites.length > 0 ? (
                      <>
                        <div className="space-y-4">
                          {filteredSites.map((site) => (
                            <SiteCard
                              key={site?.id}
                              site={{
                                ...site,
                                // compatibilidad: algunos SiteCard esperan 'status' o 'progress'
                                status: site?.is_active ? 'active' : 'inactive',
                                progress: site?.progress ?? undefined, // si tienes progreso en DB, usa esa columna
                                supervisor: site?.supervisor || null, // si tienes join, pásalo aquí
                              }}
                              onEdit={handleSiteEdit}
                              onDelete={handleSiteDelete}
                              onViewDetails={handleSiteViewDetails}
                              onAssignSupervisor={handleAssignSupervisor}
                              userRole={userRole}
                            />
                          ))}
                        </div>

                        {/* Paginación */}
                        <div className="flex items-center justify-between mt-4">
                          <div className="text-xs text-muted-foreground">
                            {sitesFetching ? 'Actualizando… ' : ''} Total: {sitesCount} · Página {page + 1} de {totalPages}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setPage((p) => Math.max(0, p - 1))}
                              disabled={page === 0}
                              className="px-3 py-1.5 rounded border disabled:opacity-50"
                            >
                              Anterior
                            </button>
                            <button
                              onClick={() => setPage((p) => (p + 1 < totalPages ? p + 1 : p))}
                              disabled={page + 1 >= totalPages}
                              className="px-3 py-1.5 rounded border disabled:opacity-50"
                            >
                              Siguiente
                            </button>
                          </div>
                        </div>
                      </>
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
                  ) : filteredSupervisors.length > 0 ? (
                    filteredSupervisors.map((supervisor) => (
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
                  )}
                </div>
              </div>
            </div>

            {/* Right Panel - Quick Stats */}
            <div className="col-span-12 lg:col-span-3">
              <QuickStatsPanel
                sites={sitesRows}              
                supervisors={mockSupervisors}   
                onViewReports={handleViewReports}
                onExportData={handleExportData}
                selectedNode={selectedNode}
                isLoading={sitesLoading}
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
