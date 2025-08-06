import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import { Checkbox } from '../../../components/ui/Checkbox';

const ReportBuilder = ({ selectedTemplate, onReportChange }) => {
  const [reportConfig, setReportConfig] = useState({
    name: selectedTemplate?.name || 'Nuevo Reporte',
    dateRange: 'last_30_days',
    sites: [],
    employees: [],
    departments: [],
    fields: selectedTemplate?.fields || [],
    filters: {},
    groupBy: '',
    sortBy: 'date',
    sortOrder: 'desc'
  });

  const [activeTab, setActiveTab] = useState('fields');

  const dateRangeOptions = [
    { value: 'today', label: 'Hoy' },
    { value: 'yesterday', label: 'Ayer' },
    { value: 'last_7_days', label: 'Últimos 7 días' },
    { value: 'last_30_days', label: 'Últimos 30 días' },
    { value: 'this_month', label: 'Este mes' },
    { value: 'last_month', label: 'Mes anterior' },
    { value: 'this_year', label: 'Este año' },
    { value: 'custom', label: 'Rango personalizado' }
  ];

  const availableFields = [
    { id: 'employee_name', name: 'Nombre del Empleado', category: 'employee' },
    { id: 'employee_id', name: 'ID Empleado', category: 'employee' },
    { id: 'site_name', name: 'Sitio de Trabajo', category: 'site' },
    { id: 'department', name: 'Departamento', category: 'employee' },
    { id: 'date', name: 'Fecha', category: 'time' },
    { id: 'check_in', name: 'Hora de Entrada', category: 'time' },
    { id: 'check_out', name: 'Hora de Salida', category: 'time' },
    { id: 'lunch_start', name: 'Inicio de Almuerzo', category: 'time' },
    { id: 'lunch_end', name: 'Fin de Almuerzo', category: 'time' },
    { id: 'hours_worked', name: 'Horas Trabajadas', category: 'calculation' },
    { id: 'overtime_hours', name: 'Horas Extra', category: 'calculation' },
    { id: 'base_salary', name: 'Salario Base', category: 'payroll' },
    { id: 'overtime_pay', name: 'Pago Horas Extra', category: 'payroll' },
    { id: 'deductions', name: 'Deducciones', category: 'payroll' },
    { id: 'bonuses', name: 'Bonificaciones', category: 'payroll' },
    { id: 'total_pay', name: 'Pago Total', category: 'payroll' },
    { id: 'attendance_status', name: 'Estado de Asistencia', category: 'status' },
    { id: 'incident_type', name: 'Tipo de Incidente', category: 'incidents' },
    { id: 'incident_description', name: 'Descripción del Incidente', category: 'incidents' }
  ];

  const siteOptions = [
    { value: 'site_1', label: 'Obra Central' },
    { value: 'site_2', label: 'Proyecto Norte' },
    { value: 'site_3', label: 'Edificio Sur' },
    { value: 'site_4', label: 'Complejo Este' }
  ];

  const groupByOptions = [
    { value: '', label: 'Sin agrupar' },
    { value: 'employee', label: 'Por Empleado' },
    { value: 'site', label: 'Por Sitio' },
    { value: 'department', label: 'Por Departamento' },
    { value: 'date', label: 'Por Fecha' },
    { value: 'week', label: 'Por Semana' },
    { value: 'month', label: 'Por Mes' }
  ];

  const sortOptions = [
    { value: 'date', label: 'Fecha' },
    { value: 'employee_name', label: 'Nombre' },
    { value: 'hours_worked', label: 'Horas Trabajadas' },
    { value: 'total_pay', label: 'Pago Total' }
  ];

  const tabs = [
    { id: 'fields', name: 'Campos', icon: 'Columns' },
    { id: 'filters', name: 'Filtros', icon: 'Filter' },
    { id: 'grouping', name: 'Agrupación', icon: 'Group' },
    { id: 'formatting', name: 'Formato', icon: 'Palette' }
  ];

  const updateConfig = (key, value) => {
    const newConfig = { ...reportConfig, [key]: value };
    setReportConfig(newConfig);
    onReportChange(newConfig);
  };

  const toggleField = (fieldId) => {
    const currentFields = reportConfig?.fields || [];
    const newFields = currentFields?.includes(fieldId)
      ? currentFields?.filter(id => id !== fieldId)
      : [...currentFields, fieldId];
    updateConfig('fields', newFields);
  };

  const fieldCategories = availableFields?.reduce((acc, field) => {
    if (!acc?.[field?.category]) {
      acc[field.category] = [];
    }
    acc?.[field?.category]?.push(field);
    return acc;
  }, {});

  const categoryNames = {
    employee: 'Empleado',
    site: 'Sitio',
    time: 'Tiempo',
    calculation: 'Cálculos',
    payroll: 'Nómina',
    status: 'Estado',
    incidents: 'Incidentes'
  };

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Constructor de Reportes</h2>
          <p className="text-sm text-muted-foreground">Personaliza tu reporte según tus necesidades</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" iconName="Save">
            Guardar Plantilla
          </Button>
          <Button variant="default" iconName="Play">
            Generar Reporte
          </Button>
        </div>
      </div>
      {/* Report Name */}
      <div className="mb-6">
        <Input
          label="Nombre del Reporte"
          value={reportConfig?.name}
          onChange={(e) => updateConfig('name', e?.target?.value)}
          placeholder="Ingresa el nombre del reporte"
        />
      </div>
      {/* Tabs */}
      <div className="border-b border-border mb-6">
        <nav className="flex space-x-8">
          {tabs?.map((tab) => (
            <button
              key={tab?.id}
              onClick={() => setActiveTab(tab?.id)}
              className={`
                flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm
                transition-colors duration-150 ease-out-cubic
                ${activeTab === tab?.id
                  ? 'border-primary text-primary' :'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
                }
              `}
            >
              <Icon name={tab?.icon} size={16} />
              <span>{tab?.name}</span>
            </button>
          ))}
        </nav>
      </div>
      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'fields' && (
          <div>
            <h3 className="text-sm font-medium text-foreground mb-4">Seleccionar Campos</h3>
            <div className="space-y-4">
              {Object.entries(fieldCategories)?.map(([category, fields]) => (
                <div key={category} className="border border-border rounded-lg p-4">
                  <h4 className="font-medium text-foreground mb-3 flex items-center">
                    <Icon name="Folder" size={16} className="mr-2 text-muted-foreground" />
                    {categoryNames?.[category]}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {fields?.map((field) => (
                      <Checkbox
                        key={field?.id}
                        label={field?.name}
                        checked={reportConfig?.fields?.includes(field?.id) || false}
                        onChange={() => toggleField(field?.id)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'filters' && (
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-foreground mb-4">Filtros de Datos</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Rango de Fechas"
                options={dateRangeOptions}
                value={reportConfig?.dateRange}
                onChange={(value) => updateConfig('dateRange', value)}
              />
              
              <Select
                label="Sitios de Trabajo"
                options={siteOptions}
                value={reportConfig?.sites}
                onChange={(value) => updateConfig('sites', value)}
                multiple
                searchable
                placeholder="Seleccionar sitios..."
              />
            </div>

            {reportConfig?.dateRange === 'custom' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Fecha de Inicio"
                  type="date"
                  value={reportConfig?.startDate || ''}
                  onChange={(e) => updateConfig('startDate', e?.target?.value)}
                />
                <Input
                  label="Fecha de Fin"
                  type="date"
                  value={reportConfig?.endDate || ''}
                  onChange={(e) => updateConfig('endDate', e?.target?.value)}
                />
              </div>
            )}

            <div className="border border-border rounded-lg p-4">
              <h4 className="font-medium text-foreground mb-3">Filtros Avanzados</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Horas Mínimas Trabajadas"
                  type="number"
                  placeholder="0"
                  value={reportConfig?.minHours || ''}
                  onChange={(e) => updateConfig('minHours', e?.target?.value)}
                />
                <Input
                  label="Horas Máximas Trabajadas"
                  type="number"
                  placeholder="24"
                  value={reportConfig?.maxHours || ''}
                  onChange={(e) => updateConfig('maxHours', e?.target?.value)}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'grouping' && (
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-foreground mb-4">Agrupación y Ordenamiento</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Agrupar Por"
                options={groupByOptions}
                value={reportConfig?.groupBy}
                onChange={(value) => updateConfig('groupBy', value)}
              />
              
              <Select
                label="Ordenar Por"
                options={sortOptions}
                value={reportConfig?.sortBy}
                onChange={(value) => updateConfig('sortBy', value)}
              />
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-foreground">Orden:</span>
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="sortOrder"
                    value="asc"
                    checked={reportConfig?.sortOrder === 'asc'}
                    onChange={(e) => updateConfig('sortOrder', e?.target?.value)}
                    className="text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-foreground">Ascendente</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="sortOrder"
                    value="desc"
                    checked={reportConfig?.sortOrder === 'desc'}
                    onChange={(e) => updateConfig('sortOrder', e?.target?.value)}
                    className="text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-foreground">Descendente</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'formatting' && (
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-foreground mb-4">Opciones de Formato</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <Checkbox
                  label="Incluir encabezados"
                  checked={reportConfig?.includeHeaders !== false}
                  onChange={(e) => updateConfig('includeHeaders', e?.target?.checked)}
                />
                <Checkbox
                  label="Incluir totales"
                  checked={reportConfig?.includeTotals || false}
                  onChange={(e) => updateConfig('includeTotals', e?.target?.checked)}
                />
                <Checkbox
                  label="Incluir gráficos"
                  checked={reportConfig?.includeCharts || false}
                  onChange={(e) => updateConfig('includeCharts', e?.target?.checked)}
                />
              </div>
              
              <div className="space-y-3">
                <Checkbox
                  label="Formato de moneda"
                  checked={reportConfig?.formatCurrency || false}
                  onChange={(e) => updateConfig('formatCurrency', e?.target?.checked)}
                />
                <Checkbox
                  label="Formato de fecha corta"
                  checked={reportConfig?.shortDateFormat || false}
                  onChange={(e) => updateConfig('shortDateFormat', e?.target?.checked)}
                />
                <Checkbox
                  label="Resaltar fines de semana"
                  checked={reportConfig?.highlightWeekends || false}
                  onChange={(e) => updateConfig('highlightWeekends', e?.target?.checked)}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportBuilder;