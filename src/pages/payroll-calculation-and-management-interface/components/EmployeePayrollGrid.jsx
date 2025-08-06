import React, { useState, useMemo } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';

const EmployeePayrollGrid = ({ 
  employees = [], 
  onEmployeeSelect, 
  selectedEmployeeId,
  onBulkAction,
  payrollData = {}
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [filterSite, setFilterSite] = useState('all');
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [expandedRows, setExpandedRows] = useState([]);

  // Mock payroll data for employees
  const mockPayrollData = {
    1: { workedDays: 22, overtimeHours: 8, grossPay: 6200, deductions: 620, netPay: 5580, status: 'calculated' },
    2: { workedDays: 20, overtimeHours: 4, grossPay: 5100, deductions: 510, netPay: 4590, status: 'pending' },
    3: { workedDays: 23, overtimeHours: 12, grossPay: 6950, deductions: 695, netPay: 6255, status: 'approved' },
    4: { workedDays: 21, overtimeHours: 6, grossPay: 5775, deductions: 577, netPay: 5198, status: 'calculated' },
    5: { workedDays: 19, overtimeHours: 2, grossPay: 4850, deductions: 485, netPay: 4365, status: 'pending' }
  };

  const sites = [
    { value: 'all', label: 'Todos los Sitios' },
    { value: 'obra_central', label: 'Obra Central' },
    { value: 'proyecto_norte', label: 'Proyecto Norte' },
    { value: 'edificio_sur', label: 'Edificio Sur' }
  ];

  const statusColors = {
    pending: 'bg-warning/10 text-warning',
    calculated: 'bg-primary/10 text-primary',
    approved: 'bg-success/10 text-success',
    paid: 'bg-muted text-muted-foreground'
  };

  const statusLabels = {
    pending: 'Pendiente',
    calculated: 'Calculado',
    approved: 'Aprobado',
    paid: 'Pagado'
  };

  const filteredAndSortedEmployees = useMemo(() => {
    let filtered = employees?.filter(employee => {
      const matchesSearch = employee?.name?.toLowerCase()?.includes(searchTerm?.toLowerCase()) ||
                           employee?.employeeId?.toLowerCase()?.includes(searchTerm?.toLowerCase());
      const matchesSite = filterSite === 'all' || employee?.site === filterSite;
      return matchesSearch && matchesSite;
    });

    return filtered?.sort((a, b) => {
      let aValue = a?.[sortField];
      let bValue = b?.[sortField];
      
      if (sortField === 'netPay') {
        aValue = mockPayrollData?.[a?.id]?.netPay || 0;
        bValue = mockPayrollData?.[b?.id]?.netPay || 0;
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
  }, [employees, searchTerm, sortField, sortDirection, filterSite]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSelectEmployee = (employeeId) => {
    if (selectedEmployees?.includes(employeeId)) {
      setSelectedEmployees(selectedEmployees?.filter(id => id !== employeeId));
    } else {
      setSelectedEmployees([...selectedEmployees, employeeId]);
    }
  };

  const handleSelectAll = () => {
    if (selectedEmployees?.length === filteredAndSortedEmployees?.length) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(filteredAndSortedEmployees?.map(emp => emp?.id));
    }
  };

  const toggleRowExpansion = (employeeId) => {
    if (expandedRows?.includes(employeeId)) {
      setExpandedRows(expandedRows?.filter(id => id !== employeeId));
    } else {
      setExpandedRows([...expandedRows, employeeId]);
    }
  };

  const handleBulkAction = (action) => {
    onBulkAction && onBulkAction(action, selectedEmployees);
  };

  const SortableHeader = ({ field, children }) => (
    <th 
      className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted transition-colors duration-150"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center space-x-1">
        <span>{children}</span>
        {sortField === field && (
          <Icon 
            name={sortDirection === 'asc' ? 'ChevronUp' : 'ChevronDown'} 
            size={14} 
          />
        )}
      </div>
    </th>
  );

  return (
    <div className="bg-card border border-border rounded-lg">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">
            Nómina de Empleados
          </h3>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              iconName="Download"
              onClick={() => handleBulkAction('export')}
              disabled={selectedEmployees?.length === 0}
            >
              Exportar
            </Button>
            <Button
              variant="default"
              iconName="Calculator"
              onClick={() => handleBulkAction('calculate')}
              disabled={selectedEmployees?.length === 0}
            >
              Calcular Seleccionados
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            placeholder="Buscar empleado..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e?.target?.value)}
            iconName="Search"
          />
          <Select
            options={sites}
            value={filterSite}
            onChange={setFilterSite}
            placeholder="Filtrar por sitio"
          />
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">
              {selectedEmployees?.length} de {filteredAndSortedEmployees?.length} seleccionados
            </span>
          </div>
        </div>
      </div>
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedEmployees?.length === filteredAndSortedEmployees?.length && filteredAndSortedEmployees?.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-border"
                />
              </th>
              <SortableHeader field="name">Empleado</SortableHeader>
              <SortableHeader field="position">Posición</SortableHeader>
              <SortableHeader field="site">Sitio</SortableHeader>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Días Trabajados
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Horas Extra
              </th>
              <SortableHeader field="netPay">Pago Neto</SortableHeader>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Estado
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-background divide-y divide-border">
            {filteredAndSortedEmployees?.map((employee) => {
              const payroll = mockPayrollData?.[employee?.id] || {};
              const isExpanded = expandedRows?.includes(employee?.id);
              const isSelected = selectedEmployees?.includes(employee?.id);
              
              return (
                <React.Fragment key={employee?.id}>
                  <tr 
                    className={`hover:bg-muted transition-colors duration-150 ${
                      selectedEmployeeId === employee?.id ? 'bg-primary/5 border-l-4 border-l-primary' : ''
                    }`}
                  >
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectEmployee(employee?.id)}
                        className="rounded border-border"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                          {employee?.name?.split(' ')?.map(n => n?.[0])?.join('')?.toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-foreground">
                            {employee?.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            ID: {employee?.employeeId}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-foreground">
                      {employee?.position}
                    </td>
                    <td className="px-4 py-4 text-sm text-foreground">
                      {employee?.site}
                    </td>
                    <td className="px-4 py-4 text-sm text-foreground">
                      {payroll?.workedDays || 0} días
                    </td>
                    <td className="px-4 py-4 text-sm text-foreground">
                      {payroll?.overtimeHours || 0}h
                    </td>
                    <td className="px-4 py-4 text-sm font-semibold text-foreground">
                      ${(payroll?.netPay || 0)?.toLocaleString()}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        statusColors?.[payroll?.status] || statusColors?.pending
                      }`}>
                        {statusLabels?.[payroll?.status] || 'Pendiente'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          iconName="Calculator"
                          onClick={() => onEmployeeSelect(employee)}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          iconName={isExpanded ? 'ChevronUp' : 'ChevronDown'}
                          onClick={() => toggleRowExpansion(employee?.id)}
                        />
                      </div>
                    </td>
                  </tr>
                  {/* Expanded Row Details */}
                  {isExpanded && (
                    <tr>
                      <td colSpan="9" className="px-4 py-4 bg-muted/50">
                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-foreground">Salario Base:</span>
                            <p className="text-muted-foreground">${employee?.dailyWage * (payroll?.workedDays || 0)}</p>
                          </div>
                          <div>
                            <span className="font-medium text-foreground">Pago Horas Extra:</span>
                            <p className="text-muted-foreground">${((employee?.dailyWage / 8) * 1.5 * (payroll?.overtimeHours || 0))?.toLocaleString()}</p>
                          </div>
                          <div>
                            <span className="font-medium text-foreground">Pago Bruto:</span>
                            <p className="text-muted-foreground">${(payroll?.grossPay || 0)?.toLocaleString()}</p>
                          </div>
                          <div>
                            <span className="font-medium text-foreground">Deducciones:</span>
                            <p className="text-muted-foreground">-${(payroll?.deductions || 0)?.toLocaleString()}</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      {/* Footer */}
      <div className="p-4 border-t border-border bg-muted/50">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Mostrando {filteredAndSortedEmployees?.length} empleados
          </span>
          <div className="flex items-center space-x-4">
            <span>
              Total Nómina: ${filteredAndSortedEmployees?.reduce((sum, emp) => 
                sum + (mockPayrollData?.[emp?.id]?.netPay || 0), 0
              )?.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeePayrollGrid;