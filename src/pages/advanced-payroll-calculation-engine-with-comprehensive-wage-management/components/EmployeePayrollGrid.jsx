// advanced-payroll-calculation-engine-with-comprehensive-wage-management/components/EmployeePayrollGrid.jsx
import React, { useMemo, useState, useCallback } from 'react';
import { Check, Clock, DollarSign, User, MapPin, Eye, Calculator } from 'lucide-react';
import CurrencyDisplay from '../../../components/ui/CurrencyDisplay';

/**
 * Props:
 * - employees: Array<{
 *     id: string,
 *     full_name?: string, name?: string,
 *     email?: string | { user_profiles?: { email?: string } },
 *     employee_id?: string,
 *     construction_sites?: { name?: string },
 *     site?: string, site_name?: string
 *   }>
 * - payrollData: Array<{ employeeId: string, id?: string, regularHours?: number, overtimeHours?: number, grossPay?: number, netPay?: number, processed?: boolean }>
 * - selectedEmployees: string[]
 * - onSelectionChange: (ids: string[]) => void
 * - onCalculatePayroll: (employeeId: string) => void | Promise<void>
 * - onProcessPayroll: (payrollId: string) => void | Promise<void>
 * - processing: boolean
 */
export default function EmployeePayrollGrid({
  employees = [],
  payrollData = [],
  selectedEmployees = [],
  onSelectionChange,
  onCalculatePayroll,
  onProcessPayroll,
  processing = false
}) {
  const [sortField, setSortField] = useState('full_name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [filterStatus, setFilterStatus] = useState('all');

  // Index payroll by employeeId para O(1)
  const payrollByEmployeeId = useMemo(() => {
    const map = new Map();
    for (const p of payrollData) {
      if (p && p.employeeId != null) map.set(String(p.employeeId), p);
    }
    return map;
  }, [payrollData]);

  // Combina empleado + nómina con fallbacks consistentes
  const combinedData = useMemo(() => {
    return (employees || []).map((employee) => {
      const payroll = payrollByEmployeeId.get(String(employee?.id)) || {};
      const fullName = employee?.full_name ?? employee?.name ?? 'Sin nombre';
      const email =
        employee?.user_profiles?.email ??
        employee?.email ??
        'Sin email';
      const siteName =
        employee?.construction_sites?.name ??
        employee?.site_name ??
        employee?.site ??
        'Sin asignar';
      const code = employee?.employee_id ?? 'N/A';
      return {
        ...employee,
        _fullName: fullName,
        _email: email,
        _siteName: siteName,
        _code: code,
        payroll
      };
    });
  }, [employees, payrollByEmployeeId]);

  // Filtro por estado de nómina
  const filteredData = useMemo(() => {
    if (filterStatus === 'all') return combinedData;

    return combinedData.filter((item) => {
      const p = item?.payroll || {};
      if (filterStatus === 'processed') return !!p?.processed;
      if (filterStatus === 'pending') return !p?.processed && (p?.grossPay || 0) > 0;
      if (filterStatus === 'no_payroll') return !(p?.grossPay > 0);
      return true;
    });
  }, [combinedData, filterStatus]);

  // Ordenamiento estable y seguro
  const sortedData = useMemo(() => {
    const arr = filteredData.slice(); // no mutar
    const dir = sortDirection === 'asc' ? 1 : -1;

    arr.sort((a, b) => {
      let aVal;
      let bVal;

      switch (sortField) {
        case 'full_name':
          aVal = a?._fullName?.toLowerCase?.() || '';
          bVal = b?._fullName?.toLowerCase?.() || '';
          break;
        case 'employee_id':
          aVal = String(a?._code ?? '');
          bVal = String(b?._code ?? '');
          break;
        case 'grossPay':
          aVal = Number(a?.payroll?.grossPay || 0);
          bVal = Number(b?.payroll?.grossPay || 0);
          break;
        default:
          // fallback: intenta por campo directo
          aVal = a?.[sortField];
          bVal = b?.[sortField];
          if (typeof aVal === 'string') aVal = aVal.toLowerCase();
          if (typeof bVal === 'string') bVal = bVal.toLowerCase();
          if (aVal == null) aVal = '';
          if (bVal == null) bVal = '';
      }

      if (aVal > bVal) return dir;
      if (aVal < bVal) return -dir;
      return 0;
    });

    return arr;
  }, [filteredData, sortField, sortDirection]);

  const handleSort = useCallback((field) => {
    setSortField((prev) => (prev === field ? prev : field));
    setSortDirection((prevDir) => (sortField === field ? (prevDir === 'asc' ? 'desc' : 'asc') : 'asc'));
  }, [sortField]);

  const handleSelectAll = useCallback(() => {
    if (!sortedData.length) {
      onSelectionChange?.([]);
      return;
    }
    const allIds = sortedData.map((item) => item?.id).filter(Boolean);
    const allSelected = allIds.length > 0 && allIds.every((id) => selectedEmployees.includes(id));
    onSelectionChange?.(allSelected ? [] : allIds);
  }, [sortedData, selectedEmployees, onSelectionChange]);

  const handleSelectEmployee = useCallback(
    (employeeId) => {
      if (!employeeId) return;
      if (selectedEmployees.includes(employeeId)) {
        onSelectionChange?.(selectedEmployees.filter((id) => id !== employeeId));
      } else {
        onSelectionChange?.([...selectedEmployees, employeeId]);
      }
    },
    [selectedEmployees, onSelectionChange]
  );

  const getStatusBadge = (payroll) => {
    if (payroll?.processed) {
      return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Procesada</span>;
    }
    if ((payroll?.grossPay || 0) > 0) {
      return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">Pendiente</span>;
    }
    return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">Sin Nómina</span>;
  };

  const allVisibleSelected =
    sortedData.length > 0 &&
    sortedData.every((item) => selectedEmployees.includes(item?.id));

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            <User className="h-6 w-6 inline mr-2 text-blue-600" />
            Nómina de Empleados
          </h2>

          <div className="flex items-center space-x-4">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e?.target?.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Todos los Estados</option>
              <option value="processed">Procesadas</option>
              <option value="pending">Pendientes</option>
              <option value="no_payroll">Sin Nómina</option>
            </select>

            <span className="text-sm text-gray-600">
              {selectedEmployees?.length || 0} de {sortedData?.length || 0} seleccionados
            </span>
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    aria-label="Seleccionar todos"
                  />
                </th>

                <th
                  className="px-4 py-3 text-left text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('full_name')}
                >
                  <div className="flex items-center">
                    Empleado
                    {sortField === 'full_name' && (
                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>

                <th
                  className="px-4 py-3 text-left text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('employee_id')}
                >
                  <div className="flex items-center">
                    Código
                    {sortField === 'employee_id' && (
                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>

                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Sitio</th>

                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  <Clock className="h-4 w-4 inline mr-1" />
                  Horas
                </th>

                <th
                  className="px-4 py-3 text-left text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('grossPay')}
                >
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 mr-1" />
                    Salario Bruto
                    {sortField === 'grossPay' && (
                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>

                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Estado</th>

                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Acciones</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {sortedData?.map((employee) => (
                <tr key={employee?.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedEmployees?.includes(employee?.id) || false}
                      onChange={() => handleSelectEmployee(employee?.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      aria-label={`Seleccionar ${employee?._fullName}`}
                    />
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{employee?._fullName}</p>
                        <p className="text-sm text-gray-500">{employee?._email}</p>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3 text-sm text-gray-900">{employee?._code}</td>

                  <td className="px-4 py-3 text-sm text-gray-900">
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                      {employee?._siteName}
                    </div>
                  </td>

                  <td className="px-4 py-3 text-sm">
                    <div>
                      <p className="text-gray-900">
                        Regular: {employee?.payroll?.regularHours || 0}h
                      </p>
                      <p className="text-gray-500">
                        Extra: {employee?.payroll?.overtimeHours || 0}h
                      </p>
                    </div>
                  </td>

                  <td className="px-4 py-3 text-sm font-medium">
                    <div>
                      <p className="text-gray-900">
                        <CurrencyDisplay amount={employee?.payroll?.grossPay || 0} />
                      </p>
                      <p className="text-gray-500">
                        Neto:{' '}
                        <CurrencyDisplay amount={employee?.payroll?.netPay || 0} />
                      </p>
                    </div>
                  </td>

                  <td className="px-4 py-3">{getStatusBadge(employee?.payroll)}</td>

                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onCalculatePayroll?.(employee?.id)}
                        disabled={processing}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-full disabled:opacity-50"
                        title="Calcular nómina"
                      >
                        <Calculator className="h-4 w-4" />
                      </button>

                      <button
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-full"
                        title="Ver detalles"
                      >
                        <Eye className="h-4 w-4" />
                      </button>

                      {employee?.payroll?.grossPay > 0 && !employee?.payroll?.processed && (
                        <button
                          onClick={() => onProcessPayroll?.(employee?.payroll?.id)}
                          className="p-2 text-green-600 hover:bg-green-100 rounded-full"
                          title="Procesar nómina"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {sortedData?.length === 0 && (
          <div className="text-center py-12">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No hay empleados que coincidan con el filtro seleccionado</p>
          </div>
        )}
      </div>
    </div>
  );
}
