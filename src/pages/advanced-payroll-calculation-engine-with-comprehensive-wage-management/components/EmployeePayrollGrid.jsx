import React, { useState } from 'react';
import { Check, Clock, DollarSign, User, MapPin, Eye, Calculator } from 'lucide-react';
import CurrencyDisplay from '../../../components/ui/CurrencyDisplay';

export default function EmployeePayrollGrid({
  employees,
  payrollData,
  selectedEmployees,
  onSelectionChange,
  onCalculatePayroll,
  onProcessPayroll,
  processing
}) {
  const [sortField, setSortField] = useState('full_name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [filterStatus, setFilterStatus] = useState('all');

  // Combine employee data with payroll data
  const combinedData = employees?.map(employee => {
    const payroll = payrollData?.find(p => p?.employeeId === employee?.id) || {};
    return {
      ...employee,
      payroll
    };
  }) || [];

  // Apply filters and sorting
  let filteredData = combinedData;
  
  if (filterStatus !== 'all') {
    filteredData = filteredData?.filter(item => {
      if (filterStatus === 'processed') return item?.payroll?.processed;
      if (filterStatus === 'pending') return !item?.payroll?.processed && item?.payroll?.grossPay > 0;
      if (filterStatus === 'no_payroll') return !item?.payroll?.grossPay;
      return true;
    });
  }

  // Sort data
  filteredData?.sort((a, b) => {
    let aValue = a?.[sortField];
    let bValue = b?.[sortField];
    
    if (sortField === 'grossPay') {
      aValue = a?.payroll?.grossPay || 0;
      bValue = b?.payroll?.grossPay || 0;
    }
    
    if (typeof aValue === 'string') {
      aValue = aValue?.toLowerCase();
      bValue = bValue?.toLowerCase();
    }
    
    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSelectAll = () => {
    if (selectedEmployees?.length === filteredData?.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(filteredData?.map(item => item?.id));
    }
  };

  const handleSelectEmployee = (employeeId) => {
    if (selectedEmployees?.includes(employeeId)) {
      onSelectionChange(selectedEmployees?.filter(id => id !== employeeId));
    } else {
      onSelectionChange([...selectedEmployees, employeeId]);
    }
  };

  const getStatusBadge = (employee) => {
    const payroll = employee?.payroll;
    
    if (payroll?.processed) {
      return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Procesada</span>;
    } else if (payroll?.grossPay > 0) {
      return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">Pendiente</span>;
    } else {
      return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">Sin Nómina</span>;
    }
  };

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
              {selectedEmployees?.length || 0} de {filteredData?.length} seleccionados
            </span>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedEmployees?.length === filteredData?.length && filteredData?.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
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
                
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  Sitio
                </th>
                
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
                
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  Estado
                </th>
                
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  Acciones
                </th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-gray-200">
              {filteredData?.map((employee) => (
                <tr key={employee?.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedEmployees?.includes(employee?.id) || false}
                      onChange={() => handleSelectEmployee(employee?.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{employee?.full_name || 'Sin nombre'}</p>
                        <p className="text-sm text-gray-500">{employee?.email || 'Sin email'}</p>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {employee?.employee_id || 'N/A'}
                  </td>
                  
                  <td className="px-4 py-3 text-sm text-gray-900">
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                      {employee?.site_name || 'Sin asignar'}
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
                        Neto: <CurrencyDisplay amount={employee?.payroll?.netPay || 0} />
                      </p>
                    </div>
                  </td>
                  
                  <td className="px-4 py-3">
                    {getStatusBadge(employee)}
                  </td>
                  
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

        {filteredData?.length === 0 && (
          <div className="text-center py-12">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No hay empleados que coincidan con el filtro seleccionado</p>
          </div>
        )}
      </div>
    </div>
  );
}