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
  userRole = 'admin'
}) => {
  const [hoveredRow, setHoveredRow] = useState(null);

  const getStatusColor = (status) => {
    const colors = {
      'active': 'bg-success text-success-foreground',
      'inactive': 'bg-secondary text-secondary-foreground',
      'suspended': 'bg-warning text-warning-foreground',
      'terminated': 'bg-error text-error-foreground'
    };
    return colors?.[status] || colors?.inactive;
  };

  const getStatusLabel = (status) => {
    const labels = {
      'active': 'Activo',
      'inactive': 'Inactivo',
      'suspended': 'Suspendido',
      'terminated': 'Terminado'
    };
    return labels?.[status] || status;
  };

  const formatDate = (dateString) => {
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

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
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
                  onChange={(e) => onSelectAll(e?.target?.checked)}
                  className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary focus:ring-2"
                />
              </th>
              
              <th className="text-left p-4">
                <button
                  onClick={() => handleSort('employeeId')}
                  className="flex items-center space-x-1 text-sm font-medium text-foreground hover:text-primary transition-colors duration-150 ease-out-cubic"
                >
                  <span>ID</span>
                  <Icon name={getSortIcon('employeeId')} size={14} />
                </button>
              </th>
              
              <th className="text-left p-4">
                <button
                  onClick={() => handleSort('name')}
                  className="flex items-center space-x-1 text-sm font-medium text-foreground hover:text-primary transition-colors duration-150 ease-out-cubic"
                >
                  <span>Empleado</span>
                  <Icon name={getSortIcon('name')} size={14} />
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
                  onClick={() => handleSort('hireDate')}
                  className="flex items-center space-x-1 text-sm font-medium text-foreground hover:text-primary transition-colors duration-150 ease-out-cubic"
                >
                  <span>Fecha de contratación</span>
                  <Icon name={getSortIcon('hireDate')} size={14} />
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
                  onClick={() => handleSort('lastAttendance')}
                  className="flex items-center space-x-1 text-sm font-medium text-foreground hover:text-primary transition-colors duration-150 ease-out-cubic"
                >
                  <span>Última asistencia</span>
                  <Icon name={getSortIcon('lastAttendance')} size={14} />
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
                `}
                onMouseEnter={() => setHoveredRow(employee?.id)}
                onMouseLeave={() => setHoveredRow(null)}
                onClick={() => onEmployeeClick(employee)}
              >
                <td className="p-4" onClick={(e) => e?.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedEmployees?.includes(employee?.id)}
                    onChange={(e) => onEmployeeSelect(employee?.id, e?.target?.checked)}
                    className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary focus:ring-2"
                  />
                </td>
                
                <td className="p-4">
                  <span className="text-sm font-mono text-muted-foreground">
                    {employee?.employeeId}
                  </span>
                </td>
                
                <td className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      {employee?.avatar ? (
                        <Image
                          src={employee?.avatar}
                          alt={employee?.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">
                          {employee?.name?.split(' ')?.map(n => n?.[0])?.join('')?.toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">
                        {employee?.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {employee?.email}
                      </p>
                    </div>
                  </div>
                </td>
                
                <td className="p-4">
                  <div className="flex items-center space-x-2">
                    <Icon name="MapPin" size={14} className="text-muted-foreground" />
                    <span className="text-sm text-foreground">{employee?.site}</span>
                  </div>
                </td>
                
                <td className="p-4">
                  <span className="text-sm text-foreground">{employee?.supervisor}</span>
                </td>
                
                <td className="p-4">
                  <span className="text-sm text-muted-foreground">
                    {formatDate(employee?.hireDate)}
                  </span>
                </td>
                
                <td className="p-4">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(employee?.status)}`}>
                    {getStatusLabel(employee?.status)}
                  </span>
                </td>
                
                <td className="p-4">
                  <span className="text-sm text-muted-foreground">
                    {formatLastAttendance(employee?.lastAttendance)}
                  </span>
                </td>
                
                <td className="p-4" onClick={(e) => e?.stopPropagation()}>
                  <div className="flex items-center justify-center space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEmployeeClick(employee)}
                      iconName="Eye"
                      iconSize={16}
                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 ease-out-cubic"
                    />
                    
                    {hoveredRow === employee?.id && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e?.stopPropagation();
                            // Handle edit action
                          }}
                          iconName="Edit"
                          iconSize={16}
                        />
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e?.stopPropagation();
                            // Handle more actions
                          }}
                          iconName="MoreHorizontal"
                          iconSize={16}
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
      {employees?.length === 0 && (
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