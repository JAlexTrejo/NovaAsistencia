// advanced-payroll-calculation-engine-with-comprehensive-wage-management/components/BulkProcessingTools.jsx
import React, { useState, useMemo } from 'react';
import { Users, PlayCircle, Download, FileText, Clock, AlertCircle } from 'lucide-react';
import CurrencyDisplay from '../../../components/ui/CurrencyDisplay';

/**
 * Props:
 * - selectedEmployees: string[] (ids)
 * - employees: Array<{ id: string, full_name?: string, employee_id?: string, payroll?: {...} }>
 * - onBulkCalculate: () => Promise<void>
 * - processing: boolean
 * - weekRange?: { start?: Date, end?: Date }
 * - avgProcessMsPerEmployee?: number  // opcional, para mostrar ETA real (no mock)
 */
export default function BulkProcessingTools({
  selectedEmployees = [],
  employees = [],
  onBulkCalculate,
  processing = false,
  weekRange,
  avgProcessMsPerEmployee, // opcional: si no viene, no mostramos ETA
}) {
  const [bulkOptions, setBulkOptions] = useState({
    includeOvertimeCalculation: true,
    includeBonuses: false,
    includeDeductions: true,
    autoApprove: false,
    generateReports: true,
  });

  const [progress, setProgress] = useState({
    total: 0,
    completed: 0,
    errors: [],
    currentEmployee: null,
  });

  const selectedEmployeeData = useMemo(
    () => employees?.filter((emp) => selectedEmployees?.includes(emp?.id)) || [],
    [employees, selectedEmployees]
  );

  const estimatedSeconds = useMemo(() => {
    if (!avgProcessMsPerEmployee || !Number.isFinite(avgProcessMsPerEmployee)) return null;
    const totalMs = (selectedEmployees?.length || 0) * avgProcessMsPerEmployee;
    return Math.max(0, Math.round(totalMs / 1000));
  }, [avgProcessMsPerEmployee, selectedEmployees?.length]);

  const handleBulkProcess = async () => {
    if (!selectedEmployees?.length || processing) return;

    setProgress({
      total: selectedEmployees.length,
      completed: 0,
      errors: [],
      currentEmployee: null,
    });

    try {
      await onBulkCalculate?.({
        options: bulkOptions,
        onTick: (info) => {
          // Permite que el caller reporte progreso (opcional)
          // info: { completed, total, currentEmployeeName, error? }
          setProgress((prev) => ({
            total: info?.total ?? prev.total,
            completed: info?.completed ?? prev.completed,
            errors: info?.error ? [...prev.errors, info.error] : prev.errors,
            currentEmployee: info?.currentEmployeeName ?? prev.currentEmployee,
          }));
        },
      });
    } catch (error) {
      setProgress((prev) => ({
        ...prev,
        errors: [...prev.errors, error?.message || 'Error desconocido en procesamiento masivo'],
      }));
    }
  };

  // CSV helpers
  const escapeCSV = (value) => {
    const str = value == null ? '' : String(value);
    if (/[",\n]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const toISODate = (d) => {
    try {
      if (d instanceof Date) return d.toISOString().split('T')[0];
      const dd = new Date(d);
      return Number.isNaN(dd.getTime()) ? undefined : dd.toISOString().split('T')[0];
    } catch {
      return undefined;
    }
  };

  const handleExportPayroll = () => {
    const headers = [
      'Empleado',
      'Código',
      'Horas Regulares',
      'Horas Extra',
      'Salario Base',
      'Pago Horas Extra',
      'Bonificaciones',
      'Deducciones',
      'Salario Bruto',
      'Salario Neto',
    ];

    const rows = selectedEmployeeData?.map((emp) => {
      const p = emp?.payroll || {};
      return [
        emp?.full_name ?? emp?.name ?? '—',
        emp?.employee_id ?? emp?.codigo ?? emp?.id ?? '—',
        p?.regularHours ?? 0,
        p?.overtimeHours ?? 0,
        p?.basePay ?? 0,
        p?.overtimePay ?? 0,
        p?.bonuses ?? 0,
        p?.deductions ?? 0,
        p?.grossPay ?? 0,
        p?.netPay ?? 0,
      ]
        .map(escapeCSV)
        .join(',');
    });

    const csvContent = [headers.join(','), ...(rows || [])].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL?.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const startStr = toISODate(weekRange?.start) || 'periodo';
    a.download = `nomina_${startStr}.csv`;
    document.body?.appendChild(a);
    a?.click();
    document.body?.removeChild(a);
    window.URL?.revokeObjectURL(url);
  };

  // Totales “live”
  const totalGross = useMemo(
    () => selectedEmployeeData?.reduce((sum, emp) => sum + (emp?.payroll?.grossPay || 0), 0) || 0,
    [selectedEmployeeData]
  );
  const totalRegular = useMemo(
    () => selectedEmployeeData?.reduce((sum, emp) => sum + (emp?.payroll?.regularHours || 0), 0) || 0,
    [selectedEmployeeData]
  );
  const totalOvertime = useMemo(
    () => selectedEmployeeData?.reduce((sum, emp) => sum + (emp?.payroll?.overtimeHours || 0), 0) || 0,
    [selectedEmployeeData]
  );

  return (
    <div className="space-y-6">
      {/* Processing Options */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            <Users className="h-6 w-6 inline mr-2 text-blue-600" />
            Herramientas de Procesamiento Masivo
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Selection Summary */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Empleados Seleccionados</h3>

              <div className="bg-blue-50 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-blue-800 font-medium">
                    {selectedEmployees?.length || 0} empleados seleccionados
                  </span>
                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
                {typeof estimatedSeconds === 'number' && (
                  <p className="text-blue-600 text-sm mt-1">Tiempo estimado: ~{estimatedSeconds} segundos</p>
                )}
              </div>

              <div className="space-y-2 max-h-32 overflow-y-auto">
                {selectedEmployeeData?.map((employee) => (
                  <div key={employee?.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm font-medium">{employee?.full_name ?? employee?.name ?? '—'}</span>
                    <span className="text-xs text-gray-500">{employee?.employee_id ?? employee?.id ?? '—'}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Processing Options */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Opciones de Procesamiento</h3>

              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={bulkOptions?.includeOvertimeCalculation}
                    onChange={(e) =>
                      setBulkOptions((prev) => ({
                        ...prev,
                        includeOvertimeCalculation: e?.target?.checked,
                      }))
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Incluir cálculo de horas extra</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={bulkOptions?.includeBonuses}
                    onChange={(e) =>
                      setBulkOptions((prev) => ({
                        ...prev,
                        includeBonuses: e?.target?.checked,
                      }))
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Incluir bonificaciones automáticas</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={bulkOptions?.includeDeductions}
                    onChange={(e) =>
                      setBulkOptions((prev) => ({
                        ...prev,
                        includeDeductions: e?.target?.checked,
                      }))
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Aplicar deducciones (impuestos, incidencias)</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={bulkOptions?.autoApprove}
                    onChange={(e) =>
                      setBulkOptions((prev) => ({
                        ...prev,
                        autoApprove: e?.target?.checked,
                      }))
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Auto-aprobar nóminas calculadas</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={bulkOptions?.generateReports}
                    onChange={(e) =>
                      setBulkOptions((prev) => ({
                        ...prev,
                        generateReports: e?.target?.checked,
                      }))
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Generar reportes automáticamente</span>
                </label>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-4 mt-6">
            <button
              onClick={handleBulkProcess}
              disabled={selectedEmployees?.length === 0 || processing}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <PlayCircle className="h-5 w-5 mr-2" />
              {processing ? 'Procesando...' : 'Iniciar Procesamiento Masivo'}
            </button>

            <button
              onClick={handleExportPayroll}
              disabled={selectedEmployees?.length === 0}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <Download className="h-5 w-5 mr-2" />
              Exportar CSV
            </button>
          </div>
        </div>
      </div>

      {/* Progress Tracking */}
      {processing && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              <Clock className="h-5 w-5 inline mr-2 text-blue-600" />
              Progreso de Procesamiento
            </h3>

            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>
                  Progreso: {progress?.completed} de {progress?.total}
                </span>
                <span>{progress?.total ? Math.round((progress?.completed / progress?.total) * 100) : 0}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${
                      progress?.total ? (progress?.completed / progress?.total) * 100 : 0
                    }%`,
                  }}
                ></div>
              </div>
            </div>

            {progress?.currentEmployee && (
              <div className="flex items-center text-sm text-gray-600 mb-4">
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                Procesando: {progress?.currentEmployee}
              </div>
            )}

            {progress?.errors?.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-red-800 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Errores encontrados:
                </h4>
                {progress?.errors?.map((error, index) => (
                  <div key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                    {error}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            <FileText className="h-5 w-5 inline mr-2 text-blue-600" />
            Resumen de Procesamiento
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{selectedEmployees?.length || 0}</div>
              <div className="text-sm text-gray-600">Empleados Seleccionados</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                <CurrencyDisplay amount={totalGross} />
              </div>
              <div className="text-sm text-gray-600">Total Salario Bruto</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{totalRegular}h</div>
              <div className="text-sm text-gray-600">Horas Regulares</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{totalOvertime}h</div>
              <div className="text-sm text-gray-600">Horas Extra</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
