import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';

const AuditLogViewer = () => {
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    user: '',
    action: '',
    module: ''
  });

  const [auditLogs] = useState([
    {
      id: 1,
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      user: 'carlos.rodriguez@construcciones.com',
      action: 'USER_CREATED',
      module: 'User Management',
      details: 'Nuevo usuario creado: María González',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      severity: 'info',
      success: true
    },
    {
      id: 2,
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      user: 'admin@construcciones.com',
      action: 'PERMISSION_MODIFIED',
      module: 'Security',
      details: 'Permisos modificados para usuario Juan Pérez',
      ipAddress: '192.168.1.101',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      severity: 'warning',
      success: true
    },
    {
      id: 3,
      timestamp: new Date(Date.now() - 45 * 60 * 1000),
      user: 'maria.gonzalez@construcciones.com',
      action: 'DATA_EXPORT',
      module: 'Reports',
      details: 'Exportación de reporte de nómina - Enero 2025',
      ipAddress: '192.168.1.102',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      severity: 'info',
      success: true
    },
    {
      id: 4,
      timestamp: new Date(Date.now() - 60 * 60 * 1000),
      user: 'juan.perez@construcciones.com',
      action: 'LOGIN_FAILED',
      module: 'Authentication',
      details: 'Intento de inicio de sesión fallido - Contraseña incorrecta',
      ipAddress: '192.168.1.103',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
      severity: 'error',
      success: false
    },
    {
      id: 5,
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      user: 'system@construcciones.com',
      action: 'BACKUP_COMPLETED',
      module: 'System',
      details: 'Respaldo automático completado exitosamente',
      ipAddress: '127.0.0.1',
      userAgent: 'System Process',
      severity: 'info',
      success: true
    },
    {
      id: 6,
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
      user: 'ana.martinez@construcciones.com',
      action: 'PAYROLL_CALCULATED',
      module: 'Payroll',
      details: 'Cálculo de nómina semanal - Semana 2, Enero 2025',
      ipAddress: '192.168.1.104',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      severity: 'info',
      success: true
    }
  ]);

  const actionOptions = [
    { value: '', label: 'Todas las acciones' },
    { value: 'USER_CREATED', label: 'Usuario Creado' },
    { value: 'USER_MODIFIED', label: 'Usuario Modificado' },
    { value: 'USER_DELETED', label: 'Usuario Eliminado' },
    { value: 'PERMISSION_MODIFIED', label: 'Permisos Modificados' },
    { value: 'LOGIN_SUCCESS', label: 'Inicio de Sesión Exitoso' },
    { value: 'LOGIN_FAILED', label: 'Inicio de Sesión Fallido' },
    { value: 'DATA_EXPORT', label: 'Exportación de Datos' },
    { value: 'BACKUP_COMPLETED', label: 'Respaldo Completado' },
    { value: 'PAYROLL_CALCULATED', label: 'Nómina Calculada' }
  ];

  const moduleOptions = [
    { value: '', label: 'Todos los módulos' },
    { value: 'User Management', label: 'Gestión de Usuarios' },
    { value: 'Security', label: 'Seguridad' },
    { value: 'Authentication', label: 'Autenticación' },
    { value: 'Reports', label: 'Reportes' },
    { value: 'Payroll', label: 'Nómina' },
    { value: 'System', label: 'Sistema' },
    { value: 'Attendance', label: 'Asistencia' }
  ];

  const getSeverityColor = (severity) => {
    const colors = {
      info: 'text-primary',
      warning: 'text-warning',
      error: 'text-error',
      success: 'text-success'
    };
    return colors?.[severity] || colors?.info;
  };

  const getSeverityIcon = (severity) => {
    const icons = {
      info: 'Info',
      warning: 'AlertTriangle',
      error: 'XCircle',
      success: 'CheckCircle'
    };
    return icons?.[severity] || icons?.info;
  };

  const getActionIcon = (action) => {
    const icons = {
      USER_CREATED: 'UserPlus',
      USER_MODIFIED: 'UserCheck',
      USER_DELETED: 'UserX',
      PERMISSION_MODIFIED: 'Shield',
      LOGIN_SUCCESS: 'LogIn',
      LOGIN_FAILED: 'LogOut',
      DATA_EXPORT: 'Download',
      BACKUP_COMPLETED: 'Database',
      PAYROLL_CALCULATED: 'Calculator'
    };
    return icons?.[action] || 'Activity';
  };

  const formatTimestamp = (date) => {
    return date?.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const handleExport = () => {
    console.log('Exporting audit logs with filters:', filters);
  };

  const filteredLogs = auditLogs?.filter(log => {
    const matchesUser = !filters?.user || log?.user?.toLowerCase()?.includes(filters?.user?.toLowerCase());
    const matchesAction = !filters?.action || log?.action === filters?.action;
    const matchesModule = !filters?.module || log?.module === filters?.module;
    return matchesUser && matchesAction && matchesModule;
  });

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Icon name="Filter" size={20} className="text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Filtros de Búsqueda</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Input
            label="Fecha Desde"
            type="date"
            value={filters?.dateFrom}
            onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e?.target?.value }))}
          />
          <Input
            label="Fecha Hasta"
            type="date"
            value={filters?.dateTo}
            onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e?.target?.value }))}
          />
          <Input
            label="Usuario"
            type="text"
            placeholder="Buscar por email..."
            value={filters?.user}
            onChange={(e) => setFilters(prev => ({ ...prev, user: e?.target?.value }))}
          />
          <Select
            label="Acción"
            options={actionOptions}
            value={filters?.action}
            onChange={(value) => setFilters(prev => ({ ...prev, action: value }))}
          />
          <Select
            label="Módulo"
            options={moduleOptions}
            value={filters?.module}
            onChange={(value) => setFilters(prev => ({ ...prev, module: value }))}
          />
        </div>
        
        <div className="flex justify-between items-center mt-4">
          <span className="text-sm text-muted-foreground">
            {filteredLogs?.length} registro(s) encontrado(s)
          </span>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              iconName="RotateCcw"
              onClick={() => setFilters({ dateFrom: '', dateTo: '', user: '', action: '', module: '' })}
            >
              Limpiar Filtros
            </Button>
            <Button
              variant="outline"
              size="sm"
              iconName="Download"
              onClick={handleExport}
            >
              Exportar
            </Button>
          </div>
        </div>
      </div>
      {/* Audit Logs Table */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">Registro de Auditoría</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-4 font-medium text-foreground">Fecha/Hora</th>
                <th className="text-left p-4 font-medium text-foreground">Usuario</th>
                <th className="text-left p-4 font-medium text-foreground">Acción</th>
                <th className="text-left p-4 font-medium text-foreground">Módulo</th>
                <th className="text-left p-4 font-medium text-foreground">Detalles</th>
                <th className="text-left p-4 font-medium text-foreground">Estado</th>
                <th className="text-left p-4 font-medium text-foreground">IP</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs?.map((log) => (
                <tr key={log?.id} className="border-t border-border hover:bg-muted/50">
                  <td className="p-4 text-sm text-foreground">
                    {formatTimestamp(log?.timestamp)}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">
                        {log?.user?.charAt(0)?.toUpperCase()}
                      </div>
                      <span className="text-sm text-foreground">{log?.user}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center space-x-2">
                      <Icon 
                        name={getActionIcon(log?.action)} 
                        size={16} 
                        className={getSeverityColor(log?.severity)} 
                      />
                      <span className="text-sm text-foreground">{log?.action}</span>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-foreground">
                    {log?.module}
                  </td>
                  <td className="p-4 text-sm text-muted-foreground max-w-xs truncate">
                    {log?.details}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center space-x-1">
                      <Icon 
                        name={getSeverityIcon(log?.severity)} 
                        size={16} 
                        className={getSeverityColor(log?.severity)} 
                      />
                      <span className={`text-sm ${getSeverityColor(log?.severity)}`}>
                        {log?.success ? 'Exitoso' : 'Fallido'}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {log?.ipAddress}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredLogs?.length === 0 && (
          <div className="p-8 text-center">
            <Icon name="Search" size={32} className="mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No se encontraron registros con los filtros aplicados</p>
          </div>
        )}
      </div>
      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Total Eventos</p>
              <p className="text-2xl font-bold text-foreground">{filteredLogs?.length}</p>
            </div>
            <Icon name="Activity" size={24} className="text-primary" />
          </div>
        </div>
        
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Eventos Exitosos</p>
              <p className="text-2xl font-bold text-success">
                {filteredLogs?.filter(log => log?.success)?.length}
              </p>
            </div>
            <Icon name="CheckCircle" size={24} className="text-success" />
          </div>
        </div>
        
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Eventos Fallidos</p>
              <p className="text-2xl font-bold text-error">
                {filteredLogs?.filter(log => !log?.success)?.length}
              </p>
            </div>
            <Icon name="XCircle" size={24} className="text-error" />
          </div>
        </div>
        
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Usuarios Únicos</p>
              <p className="text-2xl font-bold text-foreground">
                {new Set(filteredLogs.map(log => log.user))?.size}
              </p>
            </div>
            <Icon name="Users" size={24} className="text-primary" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditLogViewer;