// advanced-payroll-calculation-engine-with-comprehensive-wage-management/components/PayrollAuditTrail.jsx
import React, { useMemo, useState, useCallback } from 'react';
import { FileText, Clock, User, Filter, Trash2, Download } from 'lucide-react';
import CurrencyDisplay from '../../../components/ui/CurrencyDisplay';

export default function PayrollAuditTrail({ auditEntries = [], onClearAudit }) {
  const [filterType, setFilterType] = useState('all');
  const [sortOrder, setSortOrder] = useState('desc');

  const ACTION_LABELS = {
    calculate_payroll: 'Cálculo de Nómina',
    bulk_calculate: 'Cálculo Masivo',
    calculate_aguinaldo: 'Cálculo Aguinaldo',
    calculate_severance: 'Cálculo Finiquito',
    process_payroll: 'Procesar Nómina',
    approve_payroll: 'Aprobar Nómina',
    modify_rates: 'Modificar Tarifas',
  };

  const ACTION_COLORS = {
    calculate_payroll: 'bg-blue-100 text-blue-800',
    bulk_calculate: 'bg-purple-100 text-purple-800',
    calculate_aguinaldo: 'bg-green-100 text-green-800',
    calculate_severance: 'bg-orange-100 text-orange-800',
    process_payroll: 'bg-emerald-100 text-emerald-800',
    approve_payroll: 'bg-teal-100 text-teal-800',
    modify_rates: 'bg-yellow-100 text-yellow-800',
    default: 'bg-gray-100 text-gray-800',
  };

  const getActionLabel = (action) => ACTION_LABELS[action] ?? action ?? '—';
  const getActionColor = (action) => ACTION_COLORS[action] ?? ACTION_COLORS.default;

  // Filtrado y ordenado inmutable
  const sortedEntries = useMemo(() => {
    const filtered =
      filterType === 'all'
        ? [...auditEntries]
        : auditEntries.filter((e) => e?.action === filterType);

    return filtered
      .slice()
      .sort((a, b) => {
        const dateA = new Date(a?.timestamp || 0).getTime();
        const dateB = new Date(b?.timestamp || 0).getTime();
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      });
  }, [auditEntries, filterType, sortOrder]);

  // CSV helpers
  const csvEscape = (val) => {
    const s = String(val ?? '');
    // Si contiene comillas, comas o saltos de línea -> envolver en comillas dobles y duplicar comillas
    if (/[",\n\r]/.test(s)) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const exportAuditLog = useCallback(() => {
    if (!sortedEntries.length) return;

    const headers = [
      'Fecha/Hora',
      'Acción',
      'Empleado',
      'Monto',
      'Usuario',
      'Detalles',
    ];

    const rows = sortedEntries.map((entry) => [
      new Date(entry?.timestamp || 0).toISOString(),
      getActionLabel(entry?.action),
      entry?.employee ?? '',
      typeof entry?.amount === 'number' ? entry.amount : (Number(entry?.amount) || 0),
      entry?.user ?? '',
      entry?.details ?? '',
    ]);

    const csv =
      [headers, ...rows]
        .map((row) => row.map(csvEscape).join(','))
        .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });

    // SSR-safe
    if (typeof window !== 'undefined') {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `auditoria_nomina_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }, [sortedEntries]);

  const totalAmount = useMemo(
    () => sortedEntries.reduce((sum, e) => sum + (Number(e?.amount) || 0), 0),
    [sortedEntries]
  );

  const uniqueEmployees = useMemo(
    () => new Set(sortedEntries.map((e) => e?.employee).filter(Boolean)).size,
    [sortedEntries]
  );

  const uniqueUsers = useMemo(
    () => new Set(sortedEntries.map((e) => e?.user).filter(Boolean)).size,
    [sortedEntries]
  );

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            <FileText className="h-6 w-6 inline mr-2 text-blue-600" />
            Auditoría de Nóminas
          </h2>

          <div className="flex items-center space-x-4">
            <button
              onClick={exportAuditLog}
              disabled={!sortedEntries.length}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </button>

            <button
              onClick={onClearAudit}
              disabled={!auditEntries.length}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Limpiar
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Todas las Acciones</option>
              <option value="calculate_payroll">Cálculo de Nómina</option>
              <option value="bulk_calculate">Cálculo Masivo</option>
              <option value="calculate_aguinaldo">Aguinaldos</option>
              <option value="calculate_severance">Finiquitos</option>
              <option value="process_payroll">Procesar Nómina</option>
              <option value="approve_payroll">Aprobar Nómina</option>
              <option value="modify_rates">Modificar Tarifas</option>
            </select>
          </div>

          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="desc">Más Reciente Primero</option>
            <option value="asc">Más Antiguo Primero</option>
          </select>

          <div className="text-sm text-gray-600">
            {sortedEntries.length} de {auditEntries.length || 0} entradas
          </div>
        </div>

        {/* Entradas */}
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {sortedEntries.map((entry) => (
            <div key={entry?.id ?? `${entry?.timestamp}-${entry?.user}-${entry?.action}`} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActionColor(entry?.action)}`}>
                        {getActionLabel(entry?.action)}
                      </span>

                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="h-3 w-3 mr-1" />
                        {new Date(entry?.timestamp || 0).toLocaleString()}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600 mb-1">Empleado:</p>
                        <p className="font-medium text-gray-900">{entry?.employee ?? '—'}</p>
                      </div>

                      <div>
                        <p className="text-gray-600 mb-1">Monto:</p>
                        <p className="font-bold text-green-600">
                          <CurrencyDisplay amount={Number(entry?.amount) || 0} />
                        </p>
                      </div>

                      <div>
                        <p className="text-gray-600 mb-1">Procesado por:</p>
                        <div className="flex items-center">
                          <User className="h-3 w-3 mr-1 text-gray-400" />
                          <p className="font-medium text-gray-900">{entry?.user ?? '—'}</p>
                        </div>
                      </div>
                    </div>

                    {entry?.details && (
                      <div className="mt-3 p-2 bg-gray-50 rounded text-sm text-gray-700">
                        <p className="font-medium text-gray-600 mb-1">Detalles:</p>
                        <p>{entry.details}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty states */}
        {!sortedEntries.length && (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            {auditEntries.length === 0 ? (
              <>
                <p className="text-gray-500 mb-2">No hay registros de auditoría disponibles</p>
                <p className="text-gray-400 text-sm">Los registros aparecerán aquí después de realizar cálculos de nómina</p>
              </>
            ) : (
              <>
                <p className="text-gray-500 mb-2">No hay registros que coincidan con el filtro seleccionado</p>
                <p className="text-gray-400 text-sm">Intenta cambiar los filtros para ver más resultados</p>
              </>
            )}
          </div>
        )}

        {/* Resumen */}
        {!!sortedEntries.length && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-3">Resumen de Auditoría</h4>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{sortedEntries.length}</p>
                <p className="text-gray-600">Total Acciones</p>
              </div>

              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  <CurrencyDisplay amount={totalAmount} />
                </p>
                <p className="text-gray-600">Monto Total</p>
              </div>

              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">{uniqueEmployees}</p>
                <p className="text-gray-600">Empleados Afectados</p>
              </div>

              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">{uniqueUsers}</p>
                <p className="text-gray-600">Usuarios Activos</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
