// comprehensive-employee-registration-and-profile-management/components/EmployeeProfileEditor.jsx
import React, { useState, useEffect } from 'react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import { X, User, Save } from 'lucide-react';

export function EmployeeProfileEditor({
  employee,
  constructionSites = [],
  supervisors = [],
  onSubmit,
  onClose,
  branding,
}) {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [hasChanges, setHasChanges] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    address: '',
    birthDate: '',
    position: 'albañil',
    salaryType: 'daily',
    hourlyRate: '',
    dailySalary: '',
    siteId: '',
    supervisorId: '',
    emergencyContact: '',
    idNumber: '',
    profilePicture: null,
  });

  useEffect(() => {
    if (employee) {
      setFormData({
        fullName: employee?.full_name || '',
        phone: employee?.phone || '',
        address: employee?.address || '',
        birthDate: employee?.birth_date || '',
        position: employee?.position || 'albañil',
        salaryType: employee?.salary_type || 'daily',
        hourlyRate:
          typeof employee?.hourly_rate === 'number'
            ? String(employee?.hourly_rate)
            : employee?.hourly_rate?.toString?.() || '',
        dailySalary:
          typeof employee?.daily_salary === 'number'
            ? String(employee?.daily_salary)
            : employee?.daily_salary?.toString?.() || '',
        siteId: employee?.site_id || '',
        supervisorId: employee?.supervisor_id || '',
        emergencyContact: employee?.emergency_contact || '',
        idNumber: employee?.id_number || '',
        profilePicture: employee?.profile_picture_url || null,
      });
    }
  }, [employee]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setHasChanges(true);

    if (errors?.[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: null,
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData?.fullName?.trim()) {
      newErrors.fullName = 'El nombre completo es requerido';
    }

    if (!formData?.position) {
      newErrors.position = 'El puesto es requerido';
    }

    if (formData?.salaryType === 'hourly') {
      const v = parseFloat(formData?.hourlyRate);
      if (!v || v <= 0) newErrors.hourlyRate = 'El salario por hora debe ser mayor a 0';
    }

    if (formData?.salaryType === 'daily') {
      const v = parseFloat(formData?.dailySalary);
      if (!v || v <= 0) newErrors.dailySalary = 'El salario diario debe ser mayor a 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();

    if (!validateForm()) return;
    if (!hasChanges) {
      onClose?.();
      return;
    }

    try {
      setLoading(true);
      const payload = {
        full_name: formData.fullName?.trim(),
        phone: formData.phone?.trim() || null,
        address: formData.address?.trim() || null,
        birth_date: formData.birthDate || null,
        position: formData.position,
        salary_type: formData.salaryType,
        hourly_rate:
          formData.salaryType === 'hourly' ? Number(parseFloat(formData.hourlyRate).toFixed(2)) : 0,
        daily_salary:
        formData.salaryType === 'daily' ? Number(parseFloat(formData.dailySalary).toFixed(2)) : 0,
        site_id: formData.siteId || null,
        supervisor_id: formData.supervisorId || null,
        emergency_contact: formData.emergencyContact?.trim() || null,
        id_number: formData.idNumber?.trim() || null,
        profile_picture_url: formData.profilePicture || null,
      };

      const result = await onSubmit?.(payload);
      if (result?.success) onClose?.();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error updating employee:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      if (window.confirm('¿Estás seguro de que quieres cancelar? Se perderán los cambios no guardados.')) {
        onClose?.();
      }
    } else {
      onClose?.();
    }
  };

  const safeDate = (d) => {
    if (!d) return '—';
    try {
      const dt = d instanceof Date ? d : new Date(d);
      if (isNaN(dt.getTime())) return '—';
      return dt.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return '—';
    }
  };

  if (!employee) return null;

  const currency = branding?.simbolo_moneda || '$';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <User className="h-6 w-6" />
              Editar Perfil de Empleado
            </h2>
            <p className="text-gray-600 mt-1">
              ID: {employee?.employee_id || 'N/A'} | {employee?.user_profiles?.email || employee?.email || 'Sin email'}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Información Personal */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Información Personal</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nombre Completo *</label>
                <Input
                  type="text"
                  value={formData?.fullName}
                  onChange={(e) => handleInputChange('fullName', e?.target?.value)}
                  placeholder="Juan Pérez García"
                  error={errors?.fullName}
                />
                {errors?.fullName && <p className="text-red-500 text-sm mt-1">{errors?.fullName}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono</label>
                <Input
                  type="tel"
                  value={formData?.phone}
                  onChange={(e) => handleInputChange('phone', e?.target?.value)}
                  placeholder="(555) 123-4567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de Nacimiento</label>
                <Input
                  type="date"
                  value={formData?.birthDate || ''}
                  onChange={(e) => handleInputChange('birthDate', e?.target?.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Número de Identificación</label>
                <Input
                  type="text"
                  value={formData?.idNumber}
                  onChange={(e) => handleInputChange('idNumber', e?.target?.value)}
                  placeholder="RFC, CURP, INE, etc."
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Dirección</label>
                <textarea
                  value={formData?.address}
                  onChange={(e) => handleInputChange('address', e?.target?.value)}
                  placeholder="Dirección completa"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contacto de Emergencia</label>
                <Input
                  type="text"
                  value={formData?.emergencyContact}
                  onChange={(e) => handleInputChange('emergencyContact', e?.target?.value)}
                  placeholder="Nombre y teléfono"
                />
              </div>
            </div>
          </div>

          {/* Detalles de Empleo */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Detalles de Empleo</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Puesto *</label>
                <Select
                  value={formData?.position}
                  onChange={(value) => handleInputChange('position', value)}
                  options={[
                    { value: 'albañil', label: 'Albañil' },
                    { value: 'ayudante', label: 'Ayudante' },
                    { value: 'supervisor', label: 'Supervisor' },
                    { value: 'administrativo', label: 'Administrativo' },
                    { value: 'electricista', label: 'Electricista' },
                    { value: 'plomero', label: 'Plomero' },
                    { value: 'pintor', label: 'Pintor' },
                    { value: 'carpintero', label: 'Carpintero' },
                    { value: 'soldador', label: 'Soldador' },
                    { value: 'operador_maquinaria', label: 'Operador de Maquinaria' },
                  ]}
                  error={errors?.position}
                />
                {errors?.position && <p className="text-red-500 text-sm mt-1">{errors?.position}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Estado del Empleado</label>
                <div className="flex items-center space-x-4">
                  <span
                    className={`px-3 py-1 text-sm rounded-full ${
                      employee?.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : employee?.status === 'suspended'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {employee?.status === 'active' && 'Activo'}
                    {employee?.status === 'suspended' && 'Suspendido'}
                    {employee?.status === 'inactive' && 'Inactivo'}
                  </span>
                  <span className="text-sm text-gray-600">
                    Empleado desde: {safeDate(employee?.hire_date)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Información Salarial */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Información Salarial</h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Salario</label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="salaryType"
                    value="daily"
                    checked={formData?.salaryType === 'daily'}
                    onChange={(e) => handleInputChange('salaryType', e?.target?.value)}
                    className="mr-2"
                  />
                  Diario
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="salaryType"
                    value="hourly"
                    checked={formData?.salaryType === 'hourly'}
                    onChange={(e) => handleInputChange('salaryType', e?.target?.value)}
                    className="mr-2"
                  />
                  Por Hora
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {formData?.salaryType === 'daily' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Salario Diario * ({currency})
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData?.dailySalary}
                    onChange={(e) => handleInputChange('dailySalary', e?.target?.value)}
                    placeholder="300.00"
                    error={errors?.dailySalary}
                  />
                  {errors?.dailySalary && <p className="text-red-500 text-sm mt-1">{errors?.dailySalary}</p>}
                </div>
              )}

              {formData?.salaryType === 'hourly' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Salario por Hora * ({currency})
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData?.hourlyRate}
                    onChange={(e) => handleInputChange('hourlyRate', e?.target?.value)}
                    placeholder="37.50"
                    error={errors?.hourlyRate}
                  />
                  {errors?.hourlyRate && <p className="text-red-500 text-sm mt-1">{errors?.hourlyRate}</p>}
                </div>
              )}

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Equivalencias:</strong>
                </p>
                {formData?.salaryType === 'daily' && formData?.dailySalary && (
                  <p className="text-sm">
                    Por hora: {currency}
                    {(parseFloat(formData?.dailySalary) / 8)?.toFixed(2)}
                  </p>
                )}
                {formData?.salaryType === 'hourly' && formData?.hourlyRate && (
                  <p className="text-sm">
                    Por día: {currency}
                    {(parseFloat(formData?.hourlyRate) * 8)?.toFixed(2)}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Asignación */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Asignación</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sitio de Construcción</label>
                <Select
                  value={formData?.siteId}
                  onChange={(value) => handleInputChange('siteId', value)}
                  options={[
                    { value: '', label: 'Sin asignar' },
                    ...constructionSites.map((site) => ({
                      value: site?.id,
                      label: `${site?.name || site?.nombre || 'Sitio'} - ${
                        site?.location || site?.direccion || 'Ubicación no especificada'
                      }`,
                    })),
                  ]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Supervisor</label>
                <Select
                  value={formData?.supervisorId}
                  onChange={(value) => handleInputChange('supervisorId', value)}
                  options={[
                    { value: '', label: 'Sin supervisor asignado' },
                    ...supervisors.map((s) => ({
                      value: s?.id,
                      label: `${s?.full_name || s?.nombre || 'Supervisor'} (${s?.email || s?.correo || 'sin email'})`,
                    })),
                  ]}
                />
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || !hasChanges}
              className="flex items-center gap-2"
              style={{ backgroundColor: branding?.color_primario }}
            >
              {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
              <Save className="h-4 w-4" />
              {hasChanges ? 'Guardar Cambios' : 'Sin Cambios'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EmployeeProfileEditor;
