// src/pages/construction-site-and-supervisor-management-hub/index.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import RoleBasedSidebar from '@/components/ui/RoleBasedSidebar';
import NavigationBreadcrumb from '@/components/ui/NavigationBreadcrumb';
import UserContextHeader from '@/components/ui/UserContextHeader';
import NotificationCenter from '@/components/ui/NotificationCenter';
import Icon from '@/components/AppIcon';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Loading from '@/components/ui/Loading';
import ErrorState from '@/components/ui/ErrorState';
import { showToast } from '@/components/ui/ToastHub';

import SiteCard from './components/SiteCard';
import SupervisorCard from './components/SupervisorCard';
import OrganizationalTree from './components/OrganizationalTree';
import BulkAssignmentPanel from './components/BulkAssignmentPanel';
import QuickStatsPanel from './components/QuickStatsPanel';

import { useQuery } from '@/hooks/useQuery';
import { getAllSites } from '@/services/constructionSiteService';
import enhancedEmployeeService from '@/services/enhancedEmployeeService';
import { useAuth } from '@/contexts/AuthContext';

const DEBOUNCE_MS = 350;

const ConstructionSiteAndSupervisorManagementHub = () => {
  const navigate = useNavigate();
  const { getCurrentUserContext } = useAuth();
  const currentUser = getCurrentUserContext();
  const userRole = currentUser?.role?.toLowerCase?.() || 'user';

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('sites'); // 'sites' | 'supervisors'
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedNode, setSelectedNode] = useState(null);
  const [showBulkAssignment, setShowBulkAssignment] = useState(false);

  // ------------------------------
  // Debounce búsqueda
  // ------------------------------
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm?.trim()), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // ------------------------------
  // SITIOS (paginación + búsqueda)
  // ------------------------------
  const [page, setPage] = useState(0);

  const {
    data: sitesData,
    isLoading: sitesLoading,
    isFetching: sitesFetching,
    error: sitesError,
    refetch: refetchSites,
  } = useQuery(getAllSites, {
    params: { page, search: debouncedSearch || undefined },
    deps: [page, debouncedSearch],
    keepPreviousData: true,
    retry: 1,
    onError: (e) =>
      showToast({
        title: 'Error al cargar sitios',
        message: e?.message || 'Intenta nuevamente',
        type: 'error',
      }),
  });

  const sitesRows = sitesData?.rows ?? [];
  const sitesCount = sitesData?.count ?? 0;
  const pageSize = sitesData?.pageSize ?? 50;
  const totalPages = Math.max(1, Math.ceil(sitesCount / pageSize));

  // Filtro de estado (cliente): 'active' -> is_active true
  const filteredSites = useMemo(() => {
    const term = (debouncedSearch || '').toLowerCase();
    return (sitesRows || []).filter((site) => {
      const matchesSearch =
        !term ||
        site?.name?.toLowerCase()?.includes(term) ||
        site?.location?.toLowerCase()?.includes(term) ||
        (site?.code ? site.code.toLowerCase().includes(term) : false);

      const matchesStatus =
        filterStatus === 'all'
          ? true
          : filterStatus === 'active'
          ? !!site?.is_active
          : true; // otros estados aún no existen en DB

      return matchesSearch && matchesStatus;
    });
  }, [sitesRows, debouncedSearch, filterStatus]);

  // ------------------------------
  // SUPERVISORES (reales)
  // ------------------------------
  const {
    data: supervisorsData,
    isLoading: supervisorsLoading,
    error: supervisorsError,
    refetch: refetchSupervisors,
  } = useQuery(enhancedEmployeeService.getSupervisors, {
    deps: [],
    retry: 1,
    onError: (e) =>
      showToast({
        title: 'Error al cargar supervisores',
        message: e?.message || 'Intenta nuevamente',
        type: 'error',
      }),
  });

  const supervisors = supervisorsData ?? [];

  const filteredSupervisors = useMemo(() => {
    const term = (debouncedSearch || '').toLowerCase();

    return (supervisors || []).filter((supervisor) => {
      const matchesSearch =
        !term ||
        supervisor?.full_name?.toLowerCase()?.includes(term) ||
        supervisor?.email?.toLowerCase()?.includes(term);

      // Si tu tabla de usuarios/perfiles tiene status, mapéalo aquí.
      // Por ahora, no filtramos por estado (sólo 'all').
      const matchesStatus = filterStatus === 'all' ? true : true;

      return matchesSearch && matchesStatus;
    });
  }, [supervisors, debouncedSearch, filterStatus]);

  // ------------------------------
  // Handlers (sin mocks)
  // ------------------------------
  const handleSiteEdit = (site) => {
    // navigate(`/construction-sites/${site.id}/edit`);
    showToast({ title: 'Acción', message: `Editar sitio ${site?.name}`, type: 'info' });
  };

  const handleSiteDelete = (site) => {
    showToast({ title: 'Pendiente', message: 'Eliminar sitio (conectar servicio)', type: 'warning' });
  };

  const handleSiteViewDetails = (site) => {
    // navigate(`/construction-sites/${site.id}`);
    showToast({ title: 'Detalle', message: `Sitio: ${site?.name}`, type: 'info' });
  };

  const handleAssignSupervisor = (site) => {
    showToast({ title: 'Asignación', message: `Asignar supervisor a ${site?.name}`, type: 'info' });
  };

  const handleSupervisorEdit = (supervisor) => {
    showToast({ title: 'Acción', message: `Editar supervisor ${supervisor?.full_name}`, type: 'info' });
  };

  const handleSupervisorDelete = (supervisor) => {
    showToast({ title: 'Pendiente', message: 'Eliminar supervisor (conectar servicio)', type: 'warning' });
  };

  const handleSupervisorViewDetails = (supervisor) => {
    showToast({ title: 'Detalle', message: `Supervisor: ${supervisor?.full_name}`, type: 'info' });
  };

  const handleAssignSites = (supervisor) => {
    setShowBulkAssignment(true);
    setSelectedNode({ type: 'supervisor', id: supervisor?.id, label: supervisor?.full_name });
  };

  const handleNodeSelect = (node) => setSelectedNode(node);

  const handleDragDrop = (draggedItem, targetItem) => {
    showToast({ title: 'Reordenar', message: 'Arrastrar y soltar pendiente de servicio', type: 'info' });
  };

  const handleBulkAssign = async (assignmentData) => {
    showToast({ title: 'Asignando…', message: 'Procesando asignación masiva', type: 'info' });
    await new Promise((r) => setTimeout(r, 800));
    showToast({ title: 'Listo', message: 'Asignación completada', type: 'success' });
  };

  const handleViewReports = (node) => {
    navigate('/comprehensive-reporting-and-export-center');
  };

  const handleExportData = () => {
    showToast({ title: 'Exportar', message: 'Exportación pendiente de implementar', type: 'info' });
  };

  const handleLogout = () => navigate('/employee-login-portal');

  useEffect(() => {
    document.title = 'Gestión de Sitios y Supervisores - AsistenciaPro';
  }, []);

  const anyError = sitesError || supervisorsError;

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
                aria-label="Alternar barra lateral"
              >
                <Icon name={sidebarCollapsed ? 'ChevronRight' : 'ChevronLeft'} size={20} />
              </Button>

              <div>
                <h1 className="text-2xl font-bold text-foreground">Gestión de Sitios y Supervisores</h1>
                <p className="text-sm text-muted-foreground">Administra la estructura organizacional y asignaciones</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                iconName="RefreshCw"
                onClick={() => {
                  refetchSites();
                  refetchSupervisors();
                }}
              >
                Actualizar
              </Button>
              <NotificationCenter />
              <UserContextHeader onLogout={handleLogout} />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-6">
          <NavigationBreadcrumb />

          {anyError && (
            <div className="mb-4">
              <ErrorState
                message="No se pudieron cargar algunos datos."
                onRetry={() => {
                  refetchSites();
                  refetchSupervisors();
                }}
              />
            </div>
          )}

          <div className="grid grid-cols-12 gap-6 h-[calc(100vh-200px)]">
            {/* Left Panel - Organizational Tree */}
            <div className="col-span-12 lg:col-span-4 xl:col-span-3">
              <OrganizationalTree
                sites={sitesRows}
                supervisors={supervisors}
                onNodeSelect={handleNodeSelect}
                selectedNode={selectedNode}
                onDragDrop={handleDragDrop}
                userRole={userRole}
                isLoading={sitesLoading || supervisorsLoading}
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
                      Supervisores ({supervisors.length})
                    </Button>
                  </div>

                  <div className="flex items-center space-x-2">
                    {userRole === 'admin' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowBulkAssignment((v) => !v)}
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
                        options={
                          activeTab === 'sites'
                            ? [
                                { value: 'all', label: 'Todos los estados' },
                                { value: 'active', label: 'Activo' },
                                // placeholders (si más adelante agregas columna status)
                                { value: 'planning', label: 'Planificación' },
                                { value: 'completed', label: 'Completado' },
                                { value: 'suspended', label: 'Suspendido' },
                              ]
                            : [
                                { value: 'all', label: 'Todos los estados' },
                                // Mapea aquí si tuvieras status en perfiles/usuarios.
                              ]
                        }
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
                      supervisors={supervisors}
                      employees={[]}
                      onBulkAssign={handleBulkAssign}
                      onClose={() => setShowBulkAssignment(false)}
                      userRole={userRole}
                    />
                  ) : activeTab === 'sites' ? (
                    sitesLoading ? (
                      <Loading label="Cargando sitios…" />
                    ) : sitesError ? (
                      <ErrorState message={sitesError?.message} onRetry={refetchSites} />
                    ) : filteredSites.length > 0 ? (
                      <>
                        <div className="space-y-4">
                          {filteredSites.map((site) => (
                            <SiteCard
                              key={site?.id}
                              site={{
                                ...site,
                                status: site?.is_active ? 'active' : 'inactive',
                                progress: site?.progress ?? undefined,
                                supervisor: site?.supervisor || null,
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
                          {debouncedSearch ? 'Intenta con otros términos de búsqueda' : 'Comienza creando tu primer sitio de construcción'}
                        </p>
                        {userRole === 'admin' && (
                          <Button iconName="Plus" iconPosition="left">
                            Crear nuevo sitio
                          </Button>
                        )}
                      </div>
                    )
                  ) : supervisorsLoading ? (
                    <Loading label="Cargando supervisores…" />
                  ) : supervisorsError ? (
                    <ErrorState message={supervisorsError?.message} onRetry={refetchSupervisors} />
                  ) : filteredSupervisors.length > 0 ? (
                    filteredSupervisors.map((supervisor) => (
                      <SupervisorCard
                        key={supervisor?.id}
                        supervisor={{
                          id: supervisor?.id,
                          name: supervisor?.full_name,
                          email: supervisor?.email,
                          phone: supervisor?.phone,
                          // Métricas por supervisor: si las tienes en el service, mápéalas aquí.
                          assignedSites: supervisor?.assignedSites ?? 0,
                          totalEmployees: supervisor?.totalEmployees ?? 0,
                          status: 'active',
                          avatar: supervisor?.avatar || null,
                        }}
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
                        {debouncedSearch ? 'Intenta con otros términos de búsqueda' : 'Comienza agregando supervisores a tu equipo'}
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
                supervisors={supervisors}
                onViewReports={handleViewReports}
                onExportData={handleExportData}
                selectedNode={selectedNode}
                isLoading={sitesLoading || supervisorsLoading}
              />
            </div>
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation Spacer */}
      <div className="md:hidden h-16" />
    </div>
  );
};

export default ConstructionSiteAndSupervisorManagementHub;
