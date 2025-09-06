import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import Button from '../../../components/ui/Button';

const EmployeeTable = ({ 
  employees, 
  selectedEmployees, 
  onEmployeeSelect, 
  onSelectAll, 
  onEmployeeClick,
  onSort,
  sortConfig,
  onDelete,
  onRestore,
  userRole = 'admin',
  showDeleteActions = false,
  loading = false
}) => {
  const [hoveredRow, setHoveredRow] = useState(null);

  const getStatusColor = (status) => {
    const colors = {
      'active': 'bg-success text-success-foreground',
      'inactive': 'bg-secondary text-secondary-foreground',
      'suspended': 'bg-warning text-warning-foreground',
      'terminated': 'bg-error text-error-foreground',
      'deleted': 'bg-red-100 text-red-800'
    };
    return colors?.[status] || colors?.inactive;
  };

  const getStatusLabel = (status) => {
    const labels = {
      'active': 'Activo',
      'inactive': 'Inactivo',
      'suspended': 'Suspendido',
      'terminated': 'Terminado',
      'deleted': 'Eliminado'
    };
    return labels?.[status] || status;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString)?.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatLastAttendance = (lastAttendance) => {
    if (!lastAttendance) return 'Sin registro';
    
    const date = new Date(lastAttendance);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Ayer';
    if (diffDays <= 7) return `Hace ${diffDays} días`;
    return formatDate(lastAttendance);
  };

  const handleSort = (column) => {
    const direction = sortConfig?.column === column && sortConfig?.direction === 'asc' ? 'desc' : 'asc';
    onSort({ column, direction });
  };

  const getSortIcon = (column) => {
    if (sortConfig?.column !== column) return 'ArrowUpDown';
    return sortConfig?.direction === 'asc' ? 'ArrowUp' : 'ArrowDown';
  };

  const isAllSelected = employees?.length > 0 && selectedEmployees?.length === employees?.length;
  const isIndeterminate = selectedEmployees?.length > 0 && selectedEmployees?.length < employees?.length;

  // Helper function to handle employee row click
  const handleEmployeeRowClick = (employee, event) => {
    // Prevent row click when clicking on action buttons
    if (event?.target?.closest('button') || event?.target?.closest('.action-button')) {
      return;
    }
    onEmployeeClick?.(employee);
  };

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {/* Loading State */}
      {loading && employees?.length === 0 && (
        <div className="p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando empleados...</p>
        </div>
      )}

      {/* Table Header */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="w-12 p-4">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = isIndeterminate;
                  }}
                  onChange={(e) => onSelectAll?.(e?.target?.checked)}
                  className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary focus:ring-2"
                />
              </th>
              
              <th className="text-left p-4">
                <button
                  onClick={() => handleSort('employee_id')}
                  className="flex items-center space-x-1 text-sm font-medium text-foreground hover:text-primary transition-colors duration-150 ease-out-cubic"
                >
                  <span>ID</span>
                  <Icon name={getSortIcon('employee_id')} size={14} />
                </button>
              </th>
              
              <th className="text-left p-4">
                <button
                  onClick={() => handleSort('full_name')}
                  className="flex items-center space-x-1 text-sm font-medium text-foreground hover:text-primary transition-colors duration-150 ease-out-cubic"
                >
                  <span>Empleado</span>
                  <Icon name={getSortIcon('full_name')} size={14} />
                </button>
              </th>
              
              <th className="text-left p-4">
                <button
                  onClick={() => handleSort('site')}
                  className="flex items-center space-x-1 text-sm font-medium text-foreground hover:text-primary transition-colors duration-150 ease-out-cubic"
                >
                  <span>Sitio</span>
                  <Icon name={getSortIcon('site')} size={14} />
                </button>
              </th>
              
              <th className="text-left p-4">
                <button
                  onClick={() => handleSort('supervisor')}
                  className="flex items-center space-x-1 text-sm font-medium text-foreground hover:text-primary transition-colors duration-150 ease-out-cubic"
                >
                  <span>Supervisor</span>
                  <Icon name={getSortIcon('supervisor')} size={14} />
                </button>
              </th>
              
              <th className="text-left p-4">
                <button
                  onClick={() => handleSort('hire_date')}
                  className="flex items-center space-x-1 text-sm font-medium text-foreground hover:text-primary transition-colors duration-150 ease-out-cubic"
                >
                  <span>Fecha de contratación</span>
                  <Icon name={getSortIcon('hire_date')} size={14} />
                </button>
              </th>
              
              <th className="text-left p-4">
                <button
                  onClick={() => handleSort('status')}
                  className="flex items-center space-x-1 text-sm font-medium text-foreground hover:text-primary transition-colors duration-150 ease-out-cubic"
                >
                  <span>Estado</span>
                  <Icon name={getSortIcon('status')} size={14} />
                </button>
              </th>
              
              <th className="text-left p-4">
                <button
                  onClick={() => handleSort('last_attendance_date')}
                  className="flex items-center space-x-1 text-sm font-medium text-foreground hover:text-primary transition-colors duration-150 ease-out-cubic"
                >
                  <span>Última asistencia</span>
                  <Icon name={getSortIcon('last_attendance_date')} size={14} />
                </button>
              </th>
              
              <th className="text-center p-4 w-32">
                <span className="text-sm font-medium text-foreground">Acciones</span>
              </th>
            </tr>
          </thead>
          
          <tbody>
            {employees?.map((employee) => (
              <tr
                key={employee?.id}
                className={`
                  border-b border-border hover:bg-muted/30 transition-colors duration-150 ease-out-cubic cursor-pointer
                  ${selectedEmployees?.includes(employee?.id) ? 'bg-primary/5' : ''}
                  ${employee?.status === 'deleted' ? 'bg-red-50' : ''}
                `}
                onMouseEnter={() => setHoveredRow(employee?.id)}
                onMouseLeave={() => setHoveredRow(null)}
                onClick={(e) => handleEmployeeRowClick(employee, e)}
              >
                <td className="p-4" onClick={(e) => e?.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedEmployees?.includes(employee?.id)}
                    onChange={(e) => onEmployeeSelect?.(employee?.id, e?.target?.checked)}
                    className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary focus:ring-2"
                  />
                </td>
                
                <td className="p-4">
                  <span className="text-sm font-mono text-muted-foreground">
                    {employee?.employee_id || employee?.employeeId || 'N/A'}
                  </span>
                </td>
                
                <td className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      {employee?.profile_picture_url || employee?.avatar ? (
                        <Image
                          src={employee?.profile_picture_url || employee?.avatar}
                          alt={employee?.full_name || employee?.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">
                          {(employee?.full_name || employee?.name || '')?.split(' ')?.map(n => n?.[0])?.join('')?.toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">
                        {employee?.full_name || employee?.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {employee?.user_profiles?.email || employee?.email || 'Sin email'}
                      </p>
                    </div>
                  </div>
                </td>
                
                <td className="p-4">
                  <div className="flex items-center space-x-2">
                    <Icon name="MapPin" size={14} className="text-muted-foreground" />
                    <span className="text-sm text-foreground">
                      {employee?.construction_sites?.name || employee?.site || 'Sin asignar'}
                    </span>
                  </div>
                </td>
                
                <td className="p-4">
                  <span className="text-sm text-foreground">
                    {employee?.supervisor?.full_name || employee?.supervisor || 'Sin supervisor'}
                  </span>
                </td>
                
                <td className="p-4">
                  <span className="text-sm text-muted-foreground">
                    {formatDate(employee?.hire_date || employee?.hireDate)}
                  </span>
                </td>
                
                <td className="p-4">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(employee?.status)}`}>
                    {getStatusLabel(employee?.status)}
                  </span>
                </td>
                
                <td className="p-4">
                  <span className="text-sm text-muted-foreground">
                    {formatLastAttendance(employee?.last_attendance_date || employee?.lastAttendance)}
                  </span>
                </td>
                
                <td className="p-4" onClick={(e) => e?.stopPropagation()}>
                  <div className="flex items-center justify-center space-x-1 action-button">
                    {/* View Button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEmployeeClick?.(employee)}
                      iconName="Eye"
                      iconSize={16}
                      className="h-8 w-8 hover:bg-blue-100 hover:text-blue-600"
                      title="Ver detalles"
                    />
                    
                    {hoveredRow === employee?.id && (
                      <>
                        {/* Edit Button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e?.stopPropagation();
                            onEmployeeClick?.(employee);
                          }}
                          iconName="Edit"
                          iconSize={16}
                          className="h-8 w-8 hover:bg-blue-100 hover:text-blue-600"
                          title="Editar empleado"
                        />
                        
                        {/* Delete/Restore Buttons */}
                        {showDeleteActions && (
                          <>
                            {employee?.status === 'deleted' ? (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e?.stopPropagation();
                                  onRestore?.(employee);
                                }}
                                iconName="RotateCcw"
                                iconSize={16}
                                className="h-8 w-8 hover:bg-green-100 hover:text-green-600"
                                title="Restaurar empleado"
                              />
                            ) : (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e?.stopPropagation();
                                  onDelete?.(employee);
                                }}
                                iconName="Trash2"
                                iconSize={16}
                                className="h-8 w-8 hover:bg-red-100 hover:text-red-600"
                                title="Eliminar empleado"
                              />
                            )}
                          </>
                        )}
                        
                        {/* More Options Button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e?.stopPropagation();
                            // Handle more actions menu
                          }}
                          iconName="MoreHorizontal"
                          iconSize={16}
                          className="h-8 w-8 hover:bg-gray-100 hover:text-gray-600"
                          title="Más opciones"
                        />
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Empty State */}
      {!loading && employees?.length === 0 && (
        <div className="p-12 text-center">
          <Icon name="Users" size={48} className="mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No se encontraron empleados</h3>
          <p className="text-muted-foreground">
            Ajusta los filtros o agrega nuevos empleados al sistema.
          </p>
        </div>
      )}
    </div>
  );
};

export default EmployeeTable;