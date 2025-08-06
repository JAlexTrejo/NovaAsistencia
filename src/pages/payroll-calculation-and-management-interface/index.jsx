import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import RoleBasedSidebar from '../../components/ui/RoleBasedSidebar';
import NavigationBreadcrumb from '../../components/ui/NavigationBreadcrumb';
import UserContextHeader from '../../components/ui/UserContextHeader';
import NotificationCenter from '../../components/ui/NotificationCenter';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';

// Import components
import PayrollCalculationEngine from './components/PayrollCalculationEngine';
import EmployeePayrollGrid from './components/EmployeePayrollGrid';
import PayrollAuditTrail from './components/PayrollAuditTrail';
import BulkProcessingTools from './components/BulkProcessingTools';
import IntegrationStatusPanel from './components/IntegrationStatusPanel';

const PayrollCalculationAndManagementInterface = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);
  const [activeView, setActiveView] = useState('calculation');
  const [processingStatus, setProcessingStatus] = useState(null);

  // Mock employee data
  const mockEmployees = [
    {
      id: 1,
      employeeId: 'EMP001',
      name: 'Juan Pérez',
      position: 'Operario de Construcción',
      site: 'obra_central',
      dailyWage: 250,
      supervisor: 'Carlos Rodríguez',
      status: 'active'
    },
    {
      id: 2,
      employeeId: 'EMP002',
      name: 'María González',
      position: 'Soldadora',
      site: 'proyecto_norte',
      dailyWage: 280,
      supervisor: 'Ana Martínez',
      status: 'active'
    },
    {
      id: 3,
      employeeId: 'EMP003',
      name: 'Pedro Sánchez',
      position: 'Electricista',
      site: 'obra_central',
      dailyWage: 300,
      supervisor: 'Carlos Rodríguez',
      status: 'active'
    },
    {
      id: 4,
      employeeId: 'EMP004',
      name: 'Luis Fernández',
      position: 'Plomero',
      site: 'edificio_sur',
      dailyWage: 275,
      supervisor: 'Roberto Silva',
      status: 'active'
    },
    {
      id: 5,
      employeeId: 'EMP005',
      name: 'Carmen Ruiz',
      position: 'Supervisora de Obra',
      site: 'proyecto_norte',
      dailyWage: 350,
      supervisor: 'Ana Martínez',
      status: 'active'
    }
  ];

  // Mock attendance data
  const mockAttendanceData = {
    1: { workedDays: 22, overtimeHours: 8, regularHours: 176 },
    2: { workedDays: 20, overtimeHours: 4, regularHours: 160 },
    3: { workedDays: 23, overtimeHours: 12, regularHours: 184 },
    4: { workedDays: 21, overtimeHours: 6, regularHours: 168 },
    5: { workedDays: 19, overtimeHours: 2, regularHours: 152 }
  };

  const [employees] = useState(mockEmployees);
  const [attendanceData] = useState(mockAttendanceData);

  const viewOptions = [
    { id: 'calculation', label: 'Motor de Cálculo', icon: 'Calculator' },
    { id: 'bulk', label: 'Procesamiento Masivo', icon: 'Users' },
    { id: 'audit', label: 'Registro de Auditoría', icon: 'FileText' },
    { id: 'integration', label: 'Estado de Integraciones', icon: 'Link' }
  ];

  useEffect(() => {
    // Keyboard shortcuts
    const handleKeyPress = (e) => {
      if (e?.ctrlKey || e?.metaKey) {
        switch (e?.key) {
          case '1':
            e?.preventDefault();
            setActiveView('calculation');
            break;
          case '2':
            e?.preventDefault();
            setActiveView('bulk');
            break;
          case '3':
            e?.preventDefault();
            setActiveView('audit');
            break;
          case '4':
            e?.preventDefault();
            setActiveView('integration');
            break;
          case 's':
            e?.preventDefault();
            handleSaveAll();
            break;
          default:
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, []);

  const handleEmployeeSelect = (employee) => {
    setSelectedEmployee(employee);
    setActiveView('calculation');
  };

  const handleCalculationUpdate = (calculations) => {
    console.log('Calculation updated:', calculations);
  };

  const handleSaveAdjustments = (data) => {
    console.log('Saving adjustments:', data);
    // Here you would typically save to backend
  };

  const handleBulkAction = async (action, employeeIds) => {
    setProcessingStatus({
      action: `Procesando: ${action}`,
      processed: 0,
      total: employeeIds?.length,
      status: 'processing'
    });

    // Simulate processing
    for (let i = 0; i <= employeeIds?.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 500));
      setProcessingStatus(prev => ({
        ...prev,
        processed: i,
        status: i === employeeIds?.length ? 'completed' : 'processing'
      }));
    }

    setTimeout(() => setProcessingStatus(null), 3000);
  };

  const handleExport = (format, employeeIds) => {
    console.log(`Exporting ${format} for employees:`, employeeIds);
    // Here you would typically trigger export
  };

  const handleSaveAll = () => {
    console.log('Saving all changes...');
    // Here you would save all pending changes
  };

  const handleLogout = () => {
    console.log('Logging out...');
  };

  const handleProfileClick = () => {
    console.log('Opening profile...');
  };

  const handleSiteChange = (site) => {
    console.log('Changing site to:', site);
  };

  return (
    <>
      <Helmet>
        <title>Gestión de Nómina - AsistenciaPro</title>
        <meta name="description" content="Interface de cálculo y gestión de nómina para empleados de construcción" />
      </Helmet>
      <div className="min-h-screen bg-background">
        {/* Sidebar */}
        <RoleBasedSidebar 
          isCollapsed={sidebarCollapsed}
          userRole="admin"
        />

        {/* Main Content */}
        <div className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-60'} pb-16 md:pb-0`}>
          {/* Header */}
          <header className="bg-card border-b border-border px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  iconName={sidebarCollapsed ? 'ChevronRight' : 'ChevronLeft'}
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="hidden md:flex"
                />
                <div>
                  <h1 className="text-xl font-semibold text-foreground">
                    Gestión de Nómina
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Cálculo y procesamiento de nómina semanal
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <NotificationCenter />
                <UserContextHeader
                  user={{
                    name: 'Ana Martínez',
                    role: 'Admin',
                    site: 'Oficina Central',
                    avatar: null
                  }}
                  onLogout={handleLogout}
                  onProfileClick={handleProfileClick}
                  onSiteChange={handleSiteChange}
                />
              </div>
            </div>
          </header>

          {/* Content */}
          <main className="p-6">
            <NavigationBreadcrumb />

            {/* View Selector */}
            <div className="mb-6">
              <div className="flex items-center space-x-2 bg-muted p-1 rounded-lg w-fit">
                {viewOptions?.map((option) => (
                  <button
                    key={option?.id}
                    onClick={() => setActiveView(option?.id)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-150 ${
                      activeView === option?.id
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                    }`}
                  >
                    <Icon name={option?.icon} size={16} />
                    <span className="hidden md:inline">{option?.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Main Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Panel */}
              <div className="space-y-6">
                {activeView === 'calculation' && (
                  <PayrollCalculationEngine
                    selectedEmployee={selectedEmployee}
                    onCalculationUpdate={handleCalculationUpdate}
                    attendanceData={selectedEmployee ? attendanceData?.[selectedEmployee?.id] : {}}
                    onSaveAdjustments={handleSaveAdjustments}
                  />
                )}

                {activeView === 'bulk' && (
                  <BulkProcessingTools
                    selectedEmployees={selectedEmployeeIds}
                    onBulkProcess={handleBulkAction}
                    onExport={handleExport}
                    processingStatus={processingStatus}
                  />
                )}

                {activeView === 'audit' && (
                  <PayrollAuditTrail />
                )}

                {activeView === 'integration' && (
                  <IntegrationStatusPanel
                    onRefreshStatus={() => console.log('Refreshing status...')}
                    onTestConnection={(id) => console.log('Testing connection:', id)}
                    onSyncData={(id) => console.log('Syncing data:', id)}
                  />
                )}
              </div>

              {/* Right Panel - Employee Grid */}
              <div>
                <EmployeePayrollGrid
                  employees={employees}
                  onEmployeeSelect={handleEmployeeSelect}
                  selectedEmployeeId={selectedEmployee?.id}
                  onBulkAction={(action, ids) => {
                    setSelectedEmployeeIds(ids);
                    if (action !== 'select') {
                      handleBulkAction(action, ids);
                    }
                  }}
                  payrollData={attendanceData}
                />
              </div>
            </div>

            {/* Quick Actions Bar */}
            <div className="fixed bottom-4 right-4 md:relative md:bottom-auto md:right-auto md:mt-6">
              <div className="flex items-center space-x-2 bg-card border border-border rounded-lg p-2 shadow-lg">
                <Button
                  variant="outline"
                  size="sm"
                  iconName="Save"
                  onClick={handleSaveAll}
                >
                  <span className="hidden md:inline">Guardar Todo</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  iconName="Download"
                  onClick={() => handleExport('excel', selectedEmployeeIds)}
                >
                  <span className="hidden md:inline">Exportar</span>
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  iconName="Calculator"
                  onClick={() => handleBulkAction('calculate', employees?.map(e => e?.id))}
                >
                  <span className="hidden md:inline">Calcular Todo</span>
                </Button>
              </div>
            </div>

            {/* Keyboard Shortcuts Help */}
            <div className="mt-8 p-4 bg-muted rounded-lg">
              <h4 className="text-sm font-semibold text-foreground mb-2">
                Atajos de Teclado
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-muted-foreground">
                <div><kbd className="px-1 py-0.5 bg-background rounded">Ctrl+1</kbd> Motor de Cálculo</div>
                <div><kbd className="px-1 py-0.5 bg-background rounded">Ctrl+2</kbd> Procesamiento Masivo</div>
                <div><kbd className="px-1 py-0.5 bg-background rounded">Ctrl+3</kbd> Auditoría</div>
                <div><kbd className="px-1 py-0.5 bg-background rounded">Ctrl+S</kbd> Guardar Todo</div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default PayrollCalculationAndManagementInterface;