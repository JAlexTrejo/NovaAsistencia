import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';

const IncidentHistoryGrid = ({ incidents, currentUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIncident, setSelectedIncident] = useState(null);

  const itemsPerPage = 20;

  const typeOptions = [
    { value: 'all', label: 'Todos los Tipos' },
    { value: 'absence', label: 'Ausencia' },
    { value: 'permit', label: 'Permiso' },
    { value: 'tardiness', label: 'Tardanza' },
    { value: 'medical', label: 'Incapacidad Médica' },
    { value: 'emergency', label: 'Emergencia Familiar' },
    { value: 'training', label: 'Capacitación' },
    { value: 'other', label: 'Otro' }
  ];

  const statusOptions = [
    { value: 'all', label: 'Todos los Estados' },
    { value: 'pending', label: 'Pendientes' },
    { value: 'approved', label: 'Aprobados' },
    { value: 'rejected', label: 'Rechazados' },
    { value: 'under_review', label: 'En Revisión' }
  ];

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-warning/10 text-warning border-warning/20',
      approved: 'bg-success/10 text-success border-success/20',
      rejected: 'bg-error/10 text-error border-error/20',
      under_review: 'bg-primary/10 text-primary border-primary/20'
    };
    return colors?.[status] || colors?.pending;
  };

  const getTypeIcon = (type) => {
    const icons = {
      absence: 'UserX',
      permit: 'FileText',
      tardiness: 'Clock',
      medical: 'Heart',
      emergency: 'AlertTriangle',
      training: 'GraduationCap',
      other: 'HelpCircle'
    };
    return icons?.[type] || icons?.other;
  };

  const filteredIncidents = incidents?.filter(incident => {
      const matchesSearch = incident?.employeeName?.toLowerCase()?.includes(searchTerm?.toLowerCase()) ||
                           incident?.description?.toLowerCase()?.includes(searchTerm?.toLowerCase());
      const matchesType = filterType === 'all' || incident?.type === filterType;
      const matchesStatus = filterStatus === 'all' || incident?.status === filterStatus;
      
      let matchesDateRange = true;
      if (dateRange?.start) {
        matchesDateRange = new Date(incident.startDate) >= new Date(dateRange.start);
      }
      if (dateRange?.end && matchesDateRange) {
        matchesDateRange = new Date(incident.startDate) <= new Date(dateRange.end);
      }

      return matchesSearch && matchesType && matchesStatus && matchesDateRange;
    })?.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

  const totalPages = Math.ceil(filteredIncidents?.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedIncidents = filteredIncidents?.slice(startIndex, startIndex + itemsPerPage);

  const formatDate = (date) => {
    return new Date(date)?.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatDateTime = (date) => {
    return new Date(date)?.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateDuration = (startDate, endDate) => {
    if (!endDate) return '1 día';
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return `${diffDays} día${diffDays > 1 ? 's' : ''}`;
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterType('all');
    setFilterStatus('all');
    setDateRange({ start: '', end: '' });
    setCurrentPage(1);
  };

  return (
    <div className="bg-card border border-border rounded-lg">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Historial de Incidentes</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {filteredIncidents?.length} incidentes encontrados
            </p>
          </div>
          <Button
            variant="outline"
            onClick={clearFilters}
            iconName="RotateCcw"
            iconSize={16}
          >
            Limpiar Filtros
          </Button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Input
            placeholder="Buscar empleado o descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e?.target?.value)}
            className="lg:col-span-2"
          />
          <Select
            options={typeOptions}
            value={filterType}
            onChange={setFilterType}
            placeholder="Tipo..."
          />
          <Select
            options={statusOptions}
            value={filterStatus}
            onChange={setFilterStatus}
            placeholder="Estado..."
          />
          <div className="flex space-x-2">
            <Input
              type="date"
              value={dateRange?.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e?.target?.value }))}
              placeholder="Desde"
            />
            <Input
              type="date"
              value={dateRange?.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e?.target?.value }))}
              placeholder="Hasta"
            />
          </div>
        </div>
      </div>
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/30">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Empleado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Tipo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Fechas
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Duración
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Enviado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paginatedIncidents?.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-12 text-center">
                  <Icon name="Search" size={48} className="mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    No se encontraron incidentes
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Intenta ajustar los filtros de búsqueda
                  </p>
                </td>
              </tr>
            ) : (
              paginatedIncidents?.map((incident) => (
                <tr key={incident?.id} className="hover:bg-muted/50 transition-colors duration-150">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                        {incident?.employeeName?.split(' ')?.map(n => n?.[0])?.join('')?.toUpperCase()?.slice(0, 2)}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-foreground">
                          {incident?.employeeName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {incident?.site}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <Icon 
                        name={getTypeIcon(incident?.type)} 
                        size={16} 
                        className="text-muted-foreground" 
                      />
                      <span className="text-sm text-foreground capitalize">
                        {incident?.type}
                      </span>
                      {incident?.priority === 'high' && (
                        <Icon name="AlertTriangle" size={14} className="text-error" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-foreground">
                      {formatDate(incident?.startDate)}
                      {incident?.endDate && (
                        <>
                          <br />
                          <span className="text-muted-foreground">
                            hasta {formatDate(incident?.endDate)}
                          </span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-foreground">
                      {calculateDuration(incident?.startDate, incident?.endDate)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(incident?.status)}`}>
                      {incident?.status === 'pending' && 'Pendiente'}
                      {incident?.status === 'approved' && 'Aprobado'}
                      {incident?.status === 'rejected' && 'Rechazado'}
                      {incident?.status === 'under_review' && 'En Revisión'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(incident?.submittedAt)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedIncident(incident)}
                      iconName="Eye"
                      iconSize={16}
                    >
                      Ver
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, filteredIncidents?.length)} de {filteredIncidents?.length} incidentes
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                iconName="ChevronLeft"
                iconSize={16}
              >
                Anterior
              </Button>
              <span className="text-sm text-foreground">
                Página {currentPage} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                iconName="ChevronRight"
                iconSize={16}
              >
                Siguiente
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Incident Detail Modal */}
      {selectedIncident && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">
                  Detalle del Incidente
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedIncident(null)}
                  iconName="X"
                  iconSize={16}
                />
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Empleado</label>
                  <p className="text-sm text-foreground">{selectedIncident?.employeeName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Sitio</label>
                  <p className="text-sm text-foreground">{selectedIncident?.site}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Tipo</label>
                  <p className="text-sm text-foreground capitalize">{selectedIncident?.type}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Estado</label>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(selectedIncident?.status)}`}>
                    {selectedIncident?.status === 'pending' && 'Pendiente'}
                    {selectedIncident?.status === 'approved' && 'Aprobado'}
                    {selectedIncident?.status === 'rejected' && 'Rechazado'}
                    {selectedIncident?.status === 'under_review' && 'En Revisión'}
                  </span>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Descripción</label>
                <p className="text-sm text-foreground mt-1">{selectedIncident?.description}</p>
              </div>
              
              {selectedIncident?.attachments && selectedIncident?.attachments?.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Documentos Adjuntos</label>
                  <div className="mt-2 space-y-2">
                    {selectedIncident?.attachments?.map((attachment, index) => (
                      <div key={index} className="flex items-center space-x-2 p-2 bg-muted rounded">
                        <Icon name="Paperclip" size={16} />
                        <span className="text-sm text-foreground">{attachment?.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IncidentHistoryGrid;