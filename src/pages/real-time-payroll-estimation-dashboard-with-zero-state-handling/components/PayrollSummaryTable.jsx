import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import CurrencyDisplay from '../../../components/ui/CurrencyDisplay';

const PayrollSummaryTable = ({ 
  payrollData, 
  selectedEmployees, 
  onSelectionChange, 
  onCalculateEmployee, 
  onExportEmployee,
  calculating = false,
  loading = false 
}) => {
  const [sortConfig, setSortConfig] = useState({ key: 'full_name', direction: 'asc' });

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig?.key === key && sortConfig?.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      onSelectionChange(payrollData?.map(record => record?.employee_profiles?.employee_id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectRecord = (employeeId, checked) => {
    if (checked) {
      onSelectionChange([...selectedEmployees, employeeId]);
    } else {
      onSelectionChange(selectedEmployees?.filter(id => id !== employeeId));
    }
  };

  const sortedData = [...payrollData]?.sort((a, b) => {
    const aValue = a?.employee_profiles?.[sortConfig?.key] || a?.[sortConfig?.key];
    const bValue = b?.employee_profiles?.[sortConfig?.key] || b?.[sortConfig?.key];
    
    if (aValue < bValue) return sortConfig?.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig?.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const SortableHeader = ({ children, sortKey, className = '' }) => (
    <th 
      className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50 ${className}`}
      onClick={() => handleSort(sortKey)}
    >
      <div className="flex items-center space-x-1">
        <span>{children}</span>
        {sortConfig?.key === sortKey && (
          <Icon 
            name={sortConfig?.direction === 'asc' ? 'ChevronUp' : 'ChevronDown'} 
            size={14} 
          />
        )}
      </div>
    </th>
  );

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold">Resumen de Nómina Semanal</h3>
        </div>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (payrollData?.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold">Resumen de Nómina Semanal</h3>
        </div>
        <div className="p-8 text-center text-muted-foreground">
          <Icon name="FileText" size={48} className="mx-auto mb-4 text-gray-300" />
          <p>No hay datos de nómina para mostrar</p>
          <p className="text-sm">Los empleados aparecerán aquí cuando se calculen las estimaciones</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Resumen de Nómina Semanal</h3>
          <div className="text-sm text-muted-foreground">
            {selectedEmployees?.length > 0 && `${selectedEmployees?.length} seleccionados`}
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedEmployees?.length === payrollData?.length}
                  onChange={(e) => handleSelectAll(e?.target?.checked)}
                  className="rounded border-gray-300"
                />
              </th>
              <SortableHeader sortKey="full_name">Empleado</SortableHeader>
              <SortableHeader sortKey="construction_sites.name">Proyecto</SortableHeader>
              <SortableHeader sortKey="regular_hours">Horas Reg.</SortableHeader>
              <SortableHeader sortKey="overtime_hours">Horas Extra</SortableHeader>
              <SortableHeader sortKey="base_pay">Pago Base</SortableHeader>
              <SortableHeader sortKey="overtime_pay">Pago Extra</SortableHeader>
              <SortableHeader sortKey="gross_total">Total Bruto</SortableHeader>
              <SortableHeader sortKey="net_total">Total Neto</SortableHeader>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedData?.map((record) => {
              const employee = record?.employee_profiles;
              const isSelected = selectedEmployees?.includes(employee?.employee_id);
              
              return (
                <tr 
                  key={record?.id} 
                  className={`hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => handleSelectRecord(employee?.employee_id, e?.target?.checked)}
                      className="rounded border-gray-300"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8">
                        <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-gray-700">
                            {employee?.full_name?.charAt(0)?.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {employee?.full_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {employee?.employee_id}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {employee?.construction_sites?.name || 'Sin asignar'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {parseFloat(record?.regular_hours || 0)?.toFixed(1)}h
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {parseFloat(record?.overtime_hours || 0)?.toFixed(1)}h
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <CurrencyDisplay amount={parseFloat(record?.base_pay || 0)} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <CurrencyDisplay amount={parseFloat(record?.overtime_pay || 0)} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    <CurrencyDisplay amount={parseFloat(record?.gross_total || 0)} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                    <CurrencyDisplay amount={parseFloat(record?.net_total || 0)} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onCalculateEmployee(record?.employee_id)}
                        disabled={calculating}
                        iconName="RefreshCw"
                        className="p-1"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onExportEmployee(employee)}
                        iconName="Download"
                        className="p-1"
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {/* Summary Footer */}
      <div className="bg-gray-50 px-6 py-4 border-t">
        <div className="flex justify-between items-center text-sm">
          <div className="text-muted-foreground">
            Mostrando {payrollData?.length} empleados
          </div>
          <div className="font-medium">
            Total General: <CurrencyDisplay 
              amount={payrollData?.reduce((sum, record) => sum + parseFloat(record?.net_total || 0), 0)} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayrollSummaryTable;