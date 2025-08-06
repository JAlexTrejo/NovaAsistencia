import React, { useState, useMemo } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { Checkbox } from '../../../components/ui/Checkbox';

const AttendanceGrid = ({ 
  data, 
  onSort, 
  sortConfig, 
  onBulkAction,
  selectedRecords,
  onRecordSelect,
  onRecordEdit 
}) => {
  const [selectAll, setSelectAll] = useState(false);

  const columns = [
    { key: 'employee', label: 'Empleado', sortable: true },
    { key: 'date', label: 'Fecha', sortable: true },
    { key: 'clockIn', label: 'Entrada', sortable: true },
    { key: 'lunchStart', label: 'Inicio Almuerzo', sortable: false },
    { key: 'lunchEnd', label: 'Fin Almuerzo', sortable: false },
    { key: 'clockOut', label: 'Salida', sortable: true },
    { key: 'totalHours', label: 'Horas Total', sortable: true },
    { key: 'overtime', label: 'Horas Extra', sortable: true },
    { key: 'status', label: 'Estado', sortable: true },
    { key: 'incidents', label: 'Incidentes', sortable: false },
    { key: 'actions', label: 'Acciones', sortable: false }
  ];

  const getStatusBadge = (status) => {
    const statusConfig = {
      complete: { color: 'bg-success/10 text-success border-success/20', label: 'Completo' },
      incomplete: { color: 'bg-warning/10 text-warning border-warning/20', label: 'Incompleto' },
      late: { color: 'bg-error/10 text-error border-error/20', label: 'Tardío' },
      overtime: { color: 'bg-primary/10 text-primary border-primary/20', label: 'Horas Extra' }
    };

    const config = statusConfig?.[status] || statusConfig?.complete;
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${config?.color}`}>
        {config?.label}
      </span>
    );
  };

  const formatTime = (time) => {
    if (!time) return '-';
    return new Date(`2000-01-01T${time}`)?.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (date) => {
    return new Date(date)?.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handleSort = (key) => {
    if (columns?.find(col => col?.key === key)?.sortable) {
      onSort(key);
    }
  };

  const handleSelectAll = (checked) => {
    setSelectAll(checked);
    if (checked) {
      onRecordSelect(data?.map(record => record?.id));
    } else {
      onRecordSelect([]);
    }
  };

  const handleRecordSelect = (recordId, checked) => {
    if (checked) {
      onRecordSelect([...selectedRecords, recordId]);
    } else {
      onRecordSelect(selectedRecords?.filter(id => id !== recordId));
      setSelectAll(false);
    }
  };

  const getSortIcon = (key) => {
    if (sortConfig?.key !== key) return 'ArrowUpDown';
    return sortConfig?.direction === 'asc' ? 'ArrowUp' : 'ArrowDown';
  };

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {/* Bulk Actions Bar */}
      {selectedRecords?.length > 0 && (
        <div className="bg-muted/50 border-b border-border p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">
              {selectedRecords?.length} registro(s) seleccionado(s)
            </span>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onBulkAction('approve')}
                iconName="Check"
                iconPosition="left"
              >
                Aprobar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onBulkAction('reject')}
                iconName="X"
                iconPosition="left"
              >
                Rechazar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onBulkAction('export')}
                iconName="Download"
                iconPosition="left"
              >
                Exportar
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/30">
            <tr>
              <th className="p-4 text-left">
                <Checkbox
                  checked={selectAll}
                  onChange={(e) => handleSelectAll(e?.target?.checked)}
                />
              </th>
              {columns?.map((column) => (
                <th
                  key={column?.key}
                  className={`p-4 text-left text-sm font-medium text-foreground ${
                    column?.sortable ? 'cursor-pointer hover:bg-muted/50' : ''
                  }`}
                  onClick={() => handleSort(column?.key)}
                >
                  <div className="flex items-center space-x-2">
                    <span>{column?.label}</span>
                    {column?.sortable && (
                      <Icon 
                        name={getSortIcon(column?.key)} 
                        size={14} 
                        className="text-muted-foreground" 
                      />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data?.map((record, index) => (
              <tr 
                key={record?.id}
                className={`border-b border-border hover:bg-muted/30 ${
                  index % 2 === 0 ? 'bg-background' : 'bg-muted/10'
                }`}
              >
                <td className="p-4">
                  <Checkbox
                    checked={selectedRecords?.includes(record?.id)}
                    onChange={(e) => handleRecordSelect(record?.id, e?.target?.checked)}
                  />
                </td>
                <td className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-medium">
                      {record?.employee?.split(' ')?.map(n => n?.[0])?.join('')}
                    </div>
                    <div>
                      <div className="font-medium text-foreground">{record?.employee}</div>
                      <div className="text-xs text-muted-foreground">{record?.site}</div>
                    </div>
                  </div>
                </td>
                <td className="p-4 text-sm text-foreground">{formatDate(record?.date)}</td>
                <td className="p-4 text-sm text-foreground">{formatTime(record?.clockIn)}</td>
                <td className="p-4 text-sm text-foreground">{formatTime(record?.lunchStart)}</td>
                <td className="p-4 text-sm text-foreground">{formatTime(record?.lunchEnd)}</td>
                <td className="p-4 text-sm text-foreground">{formatTime(record?.clockOut)}</td>
                <td className="p-4 text-sm font-medium text-foreground">{record?.totalHours}h</td>
                <td className="p-4 text-sm font-medium text-primary">{record?.overtime}h</td>
                <td className="p-4">{getStatusBadge(record?.status)}</td>
                <td className="p-4">
                  {record?.incidents?.length > 0 ? (
                    <div className="flex items-center space-x-1">
                      <Icon name="AlertTriangle" size={16} className="text-warning" />
                      <span className="text-xs text-warning">{record?.incidents?.length}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">-</span>
                  )}
                </td>
                <td className="p-4">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onRecordEdit(record)}
                    >
                      <Icon name="Edit" size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {/* View details */}}
                    >
                      <Icon name="Eye" size={16} />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Pagination */}
      <div className="flex items-center justify-between p-4 border-t border-border">
        <div className="text-sm text-muted-foreground">
          Mostrando {data?.length} de 150 registros
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" disabled>
            <Icon name="ChevronLeft" size={16} />
          </Button>
          <span className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded">1</span>
          <span className="px-3 py-1 text-sm text-muted-foreground">2</span>
          <span className="px-3 py-1 text-sm text-muted-foreground">3</span>
          <Button variant="outline" size="sm">
            <Icon name="ChevronRight" size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AttendanceGrid;