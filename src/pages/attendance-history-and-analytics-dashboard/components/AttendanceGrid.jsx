import React, { useMemo } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { Checkbox } from '../../../components/ui/Checkbox';

const AttendanceGrid = ({
  data = [],
  loading = false,
  /** sorting */
  onSort,
  sortConfig = { key: null, direction: 'asc' },
  /** bulk selection */
  selectedRecords = [],
  onRecordSelect = () => {},
  onBulkAction = () => {},
  onRecordEdit = () => {},
  /** pagination (controlled) */
  page = 1,
  pageSize = 20,
  totalCount = 0,
  onPageChange = () => {},
}) => {
  /** ---------- Columns ---------- */
  const columns = useMemo(() => ([
    { key: 'employee',     label: 'Empleado',         sortable: true },
    { key: 'date',         label: 'Fecha',            sortable: true },
    { key: 'clockIn',      label: 'Entrada',          sortable: true },
    { key: 'lunchStart',   label: 'Inicio Almuerzo',  sortable: false },
    { key: 'lunchEnd',     label: 'Fin Almuerzo',     sortable: false },
    { key: 'clockOut',     label: 'Salida',           sortable: true },
    { key: 'totalHours',   label: 'Horas Total',      sortable: true },
    { key: 'overtime',     label: 'Horas Extra',      sortable: true },
    { key: 'status',       label: 'Estado',           sortable: true },
    { key: 'incidents',    label: 'Incidentes',       sortable: false },
    { key: 'actions',      label: 'Acciones',         sortable: false },
  ]), []);

  /** ---------- Utils ---------- */
  const getInitials = (fullName = '') => {
    const parts = `${fullName}`.trim().split(/\s+/).slice(0, 2);
    const initials = parts.map(p => (p?.[0] || '').toUpperCase()).join('');
    return initials || 'E';
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      complete:   { color: 'bg-success/10 text-success border-success/20',   label: 'Completo' },
      incomplete: { color: 'bg-warning/10 text-warning border-warning/20',   label: 'Incompleto' },
      late:       { color: 'bg-error/10 text-error border-error/20',         label: 'Tardío' },
      overtime:   { color: 'bg-primary/10 text-primary border-primary/20',   label: 'Horas Extra' },
    };
    const config = statusConfig?.[status] || statusConfig.complete;
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const safeTimeToLocale = (time) => {
    if (!time) return '-';
    // Admite "HH:mm" o "HH:mm:ss"
    const safe = /^\d{2}:\d{2}(:\d{2})?$/.test(time) ? time : '00:00';
    const d = new Date(`2000-01-01T${safe}`);
    return isNaN(d.getTime())
      ? '-'
      : d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  const safeDateToLocale = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return isNaN(d.getTime())
      ? '-'
      : d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const handleSort = (key) => {
    const col = columns.find(c => c.key === key);
    if (!col?.sortable) return;
    onSort?.(key);
  };

  const allVisibleSelected = useMemo(() => {
    if (!data?.length) return false;
    return data.every(r => selectedRecords.includes(r?.id));
  }, [data, selectedRecords]);

  const toggleSelectAll = (checked) => {
    if (checked) {
      const idsToAdd = data.map(r => r?.id).filter(Boolean);
      const merged = Array.from(new Set([...selectedRecords, ...idsToAdd]));
      onRecordSelect(merged);
    } else {
      const visibleSet = new Set(data.map(r => r?.id));
      const remaining = selectedRecords.filter(id => !visibleSet.has(id));
      onRecordSelect(remaining);
    }
  };

  const toggleSelectRow = (recordId, checked) => {
    if (!recordId) return;
    if (checked) {
      onRecordSelect(Array.from(new Set([...selectedRecords, recordId])));
    } else {
      onRecordSelect(selectedRecords.filter(id => id !== recordId));
    }
  };

  const getSortIcon = (key) => {
    if (sortConfig?.key !== key) return 'ArrowUpDown';
    return sortConfig?.direction === 'asc' ? 'ArrowUp' : 'ArrowDown';
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / Math.max(1, pageSize)));
  const showingFrom = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const showingTo = Math.min(page * pageSize, totalCount);

  /** ---------- Loading ---------- */
  if (loading) {
    return (
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="p-4 border-b border-border">
          <div className="h-4 w-32 bg-muted/50 rounded animate-pulse" />
        </div>
        <div className="p-6 space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-10 bg-muted/40 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  /** ---------- Empty ---------- */
  if (!data?.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-12 text-center">
        <Icon name="CalendarX" size={48} className="mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-1">Sin registros</h3>
        <p className="text-sm text-muted-foreground">
          No se encontraron datos de asistencia con los filtros actuales.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {/* Bulk Actions Bar */}
      {selectedRecords?.length > 0 && (
        <div className="bg-muted/50 border-b border-border p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">
              {selectedRecords.length} registro(s) seleccionado(s)
            </span>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onBulkAction('approve')}
                iconName="Check"
                iconPosition="left"
                aria-label="Aprobar seleccionados"
              >
                Aprobar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onBulkAction('reject')}
                iconName="X"
                iconPosition="left"
                aria-label="Rechazar seleccionados"
              >
                Rechazar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onBulkAction('export')}
                iconName="Download"
                iconPosition="left"
                aria-label="Exportar seleccionados"
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
              <th className="p-4 text-left w-10">
                <Checkbox
                  aria-label="Seleccionar todos los registros visibles"
                  checked={allVisibleSelected}
                  onChange={(e) => toggleSelectAll(e?.target?.checked)}
                />
              </th>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`p-4 text-left text-sm font-medium text-foreground ${
                    column.sortable ? 'cursor-pointer hover:bg-muted/50' : ''
                  }`}
                  onClick={() => handleSort(column.key)}
                  aria-sort={
                    sortConfig?.key === column.key
                      ? (sortConfig?.direction === 'asc' ? 'ascending' : 'descending')
                      : 'none'
                  }
                  scope="col"
                >
                  <div className="flex items-center space-x-2">
                    <span>{column.label}</span>
                    {column.sortable && (
                      <Icon
                        name={getSortIcon(column.key)}
                        size={14}
                        className="text-muted-foreground"
                        aria-hidden="true"
                      />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {data.map((record, index) => (
              <tr
                key={record?.id ?? `row-${index}`}
                className={`border-b border-border hover:bg-muted/30 ${
                  index % 2 === 0 ? 'bg-background' : 'bg-muted/10'
                }`}
              >
                <td className="p-4">
                  <Checkbox
                    aria-label={`Seleccionar registro de ${record?.employee || 'empleado'} del ${safeDateToLocale(record?.date)}`}
                    checked={selectedRecords.includes(record?.id)}
                    onChange={(e) => toggleSelectRow(record?.id, e?.target?.checked)}
                  />
                </td>

                <td className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-medium">
                      {getInitials(record?.employee)}
                    </div>
                    <div>
                      <div className="font-medium text-foreground">{record?.employee || '-'}</div>
                      <div className="text-xs text-muted-foreground">{record?.site || '-'}</div>
                    </div>
                  </div>
                </td>

                <td className="p-4 text-sm text-foreground">{safeDateToLocale(record?.date)}</td>
                <td className="p-4 text-sm text-foreground">{safeTimeToLocale(record?.clockIn)}</td>
                <td className="p-4 text-sm text-foreground">{safeTimeToLocale(record?.lunchStart)}</td>
                <td className="p-4 text-sm text-foreground">{safeTimeToLocale(record?.lunchEnd)}</td>
                <td className="p-4 text-sm text-foreground">{safeTimeToLocale(record?.clockOut)}</td>

                <td className="p-4 text-sm font-medium text-foreground">
                  {Number.isFinite(record?.totalHours) ? `${record.totalHours}h` : '-'}
                </td>
                <td className="p-4 text-sm font-medium text-primary">
                  {Number.isFinite(record?.overtime) ? `${record.overtime}h` : '0h'}
                </td>

                <td className="p-4">{getStatusBadge(record?.status)}</td>

                <td className="p-4">
                  {Array.isArray(record?.incidents) && record.incidents.length > 0 ? (
                    <div className="flex items-center space-x-1">
                      <Icon name="AlertTriangle" size={16} className="text-warning" />
                      <span className="text-xs text-warning">{record.incidents.length}</span>
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
                      aria-label="Editar registro"
                      onClick={() => onRecordEdit(record)}
                    >
                      <Icon name="Edit" size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Ver detalles"
                      onClick={() => {/* abre modal / drawer de detalles */}}
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
          {totalCount > 0
            ? <>Mostrando {showingFrom}–{showingTo} de {totalCount} registros</>
            : <>0 registros</>}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page <= 1}
            aria-label="Página anterior"
          >
            <Icon name="ChevronLeft" size={16} />
          </Button>

          <span className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded">
            {page}
          </span>
          <span className="px-3 py-1 text-sm text-muted-foreground">
            de {totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            aria-label="Página siguiente"
          >
            <Icon name="ChevronRight" size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AttendanceGrid;
