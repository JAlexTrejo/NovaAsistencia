import React, { useState } from 'react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import { X, User, Briefcase, MapPin, DollarSign, ChevronLeft, ChevronRight } from 'lucide-react';

export function EmployeeRegistrationWizard({ 
  constructionSites = [], 
  supervisors = [], 
  onSubmit, 
  onClose, 
  branding 
}) {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    // Personal Information
    fullName: '',
    email: '',
    phone: '',
    address: '',
    birthDate: '',
    idNumber: '',
    emergencyContact: '',
    
    // Employment Details
    employeeId: '',
    hireDate: new Date()?.toISOString()?.split('T')?.[0],
    position: 'albañil',
    role: 'user',
    
    // Salary Information
    salaryType: 'daily',
    hourlyRate: '',
    dailySalary: '',
    
    // Assignment
    siteId: '',
    supervisorId: '',
    
    // Additional
    profilePicture: null,
    tempPassword: 'AsistenciaPro2024'
  });

  const steps = [
    { id: 1, title: 'Información Personal', icon: User },
    { id: 2, title: 'Detalles de Empleo', icon: Briefcase },
    { id: 3, title: 'Salario y Beneficios', icon: DollarSign },
    { id: 4, title: 'Asignación', icon: MapPin }
  ];

  const validateStep = (step) => {
    const newErrors = {};

    switch (step) {
      case 1:
        if (!formData?.fullName?.trim()) newErrors.fullName = 'El nombre completo es requerido';
        if (!formData?.email?.trim()) {
          newErrors.email = 'El correo electrónico es requerido';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/?.test(formData?.email)) {
          newErrors.email = 'Formato de correo electrónico inválido';
        }
        if (!formData?.phone?.trim()) newErrors.phone = 'El teléfono es requerido';
        break;
      
      case 2:
        if (!formData?.position) newErrors.position = 'El puesto es requerido';
        if (!formData?.hireDate) newErrors.hireDate = 'La fecha de contratación es requerida';
        break;
      
      case 3:
        if (formData?.salaryType === 'hourly' && (!formData?.hourlyRate || parseFloat(formData?.hourlyRate) <= 0)) {
          newErrors.hourlyRate = 'El salario por hora debe ser mayor a 0';
        }
        if (formData?.salaryType === 'daily' && (!formData?.dailySalary || parseFloat(formData?.dailySalary) <= 0)) {
          newErrors.dailySalary = 'El salario diario debe ser mayor a 0';
        }
        break;
      
      case 4:
        // Optional validations for assignment
        break;
      
      default:
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps?.length));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    try {
      setLoading(true);
      const result = await onSubmit(formData);
      if (result?.success) {
        onClose();
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <User className="h-5 w-5" />
              Información Personal
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre Completo *
                </label>
                <Input
                  type="text"
                  value={formData?.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e?.target?.value})}
                  placeholder="Juan Pérez García"
                  error={errors?.fullName}
                />
                {errors?.fullName && <p className="text-red-500 text-sm mt-1">{errors?.fullName}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Correo Electrónico *
                </label>
                <Input
                  type="email"
                  value={formData?.email}
                  onChange={(e) => setFormData({...formData, email: e?.target?.value})}
                  placeholder="juan.perez@email.com"
                  error={errors?.email}
                />
                {errors?.email && <p className="text-red-500 text-sm mt-1">{errors?.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono *
                </label>
                <Input
                  type="tel"
                  value={formData?.phone}
                  onChange={(e) => setFormData({...formData, phone: e?.target?.value})}
                  placeholder="(555) 123-4567"
                  error={errors?.phone}
                />
                {errors?.phone && <p className="text-red-500 text-sm mt-1">{errors?.phone}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Nacimiento
                </label>
                <Input
                  type="date"
                  value={formData?.birthDate}
                  onChange={(e) => setFormData({...formData, birthDate: e?.target?.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número de Identificación
                </label>
                <Input
                  type="text"
                  value={formData?.idNumber}
                  onChange={(e) => setFormData({...formData, idNumber: e?.target?.value})}
                  placeholder="RFC, CURP, INE, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contacto de Emergencia
                </label>
                <Input
                  type="text"
                  value={formData?.emergencyContact}
                  onChange={(e) => setFormData({...formData, emergencyContact: e?.target?.value})}
                  placeholder="Nombre y teléfono"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dirección
              </label>
              <textarea
                value={formData?.address}
                onChange={(e) => setFormData({...formData, address: e?.target?.value})}
                placeholder="Dirección completa"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Detalles de Empleo
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ID del Empleado
                </label>
                <Input
                  type="text"
                  value={formData?.employeeId}
                  onChange={(e) => setFormData({...formData, employeeId: e?.target?.value})}
                  placeholder="Se generará automáticamente si se deja vacío"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Contratación *
                </label>
                <Input
                  type="date"
                  value={formData?.hireDate}
                  onChange={(e) => setFormData({...formData, hireDate: e?.target?.value})}
                  error={errors?.hireDate}
                />
                {errors?.hireDate && <p className="text-red-500 text-sm mt-1">{errors?.hireDate}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Puesto *
                </label>
                <Select
                  value={formData?.position}
                  onChange={(e) => setFormData({...formData, position: e?.target?.value})}
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
                    { value: 'operador_maquinaria', label: 'Operador de Maquinaria' }
                  ]}
                  error={errors?.position}
                />
                {errors?.position && <p className="text-red-500 text-sm mt-1">{errors?.position}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rol del Usuario
                </label>
                <Select
                  value={formData?.role}
                  onChange={(e) => setFormData({...formData, role: e?.target?.value})}
                  options={[
                    { value: 'user', label: 'Usuario' },
                    { value: 'supervisor', label: 'Supervisor' },
                    { value: 'admin', label: 'Administrador' }
                  ]}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Determina los permisos de acceso al sistema
                </p>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Salario y Beneficios
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Salario
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="salaryType"
                    value="daily"
                    checked={formData?.salaryType === 'daily'}
                    onChange={(e) => setFormData({...formData, salaryType: e?.target?.value})}
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
                    onChange={(e) => setFormData({...formData, salaryType: e?.target?.value})}
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
                    Salario Diario * ({branding?.simbolo_moneda})
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData?.dailySalary}
                    onChange={(e) => setFormData({...formData, dailySalary: e?.target?.value})}
                    placeholder="300.00"
                    error={errors?.dailySalary}
                  />
                  {errors?.dailySalary && <p className="text-red-500 text-sm mt-1">{errors?.dailySalary}</p>}
                </div>
              )}

              {formData?.salaryType === 'hourly' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Salario por Hora * ({branding?.simbolo_moneda})
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData?.hourlyRate}
                    onChange={(e) => setFormData({...formData, hourlyRate: e?.target?.value})}
                    placeholder="37.50"
                    error={errors?.hourlyRate}
                  />
                  {errors?.hourlyRate && <p className="text-red-500 text-sm mt-1">{errors?.hourlyRate}</p>}
                </div>
              )}
            </div>
            {formData?.salaryType === 'daily' && formData?.dailySalary && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Equivalente por hora:</strong> {branding?.simbolo_moneda}{(parseFloat(formData?.dailySalary) / 8)?.toFixed(2)} 
                  (basado en 8 horas por día)
                </p>
              </div>
            )}
            {formData?.salaryType === 'hourly' && formData?.hourlyRate && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Equivalente diario:</strong> {branding?.simbolo_moneda}{(parseFloat(formData?.hourlyRate) * 8)?.toFixed(2)} 
                  (basado en 8 horas por día)
                </p>
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Asignación
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sitio de Construcción
                </label>
                <Select
                  value={formData?.siteId}
                  onChange={(e) => setFormData({...formData, siteId: e?.target?.value})}
                  options={[
                    { value: '', label: 'Sin asignar' },
                    ...constructionSites?.map(site => ({
                      value: site?.id,
                      label: `${site?.name} - ${site?.location || 'Ubicación no especificada'}`
                    }))
                  ]}
                />
                <p className="text-xs text-gray-500 mt-1">
                  El empleado será asignado a este sitio de construcción
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Supervisor
                </label>
                <Select
                  value={formData?.supervisorId}
                  onChange={(e) => setFormData({...formData, supervisorId: e?.target?.value})}
                  options={[
                    { value: '', label: 'Sin supervisor asignado' },
                    ...supervisors?.map(supervisor => ({
                      value: supervisor?.id,
                      label: `${supervisor?.full_name} (${supervisor?.email})`
                    }))
                  ]}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData?.role === 'supervisor' || formData?.role === 'admin' 
                    ? 'Los supervisores y administradores no requieren supervisor asignado' :'Supervisor directo del empleado'
                  }
                </p>
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3">Resumen del Empleado</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p><strong>Nombre:</strong> {formData?.fullName}</p>
                  <p><strong>Email:</strong> {formData?.email}</p>
                  <p><strong>Teléfono:</strong> {formData?.phone}</p>
                  <p><strong>Puesto:</strong> {formData?.position}</p>
                </div>
                <div>
                  <p><strong>Rol:</strong> {formData?.role}</p>
                  <p><strong>Tipo de Salario:</strong> {formData?.salaryType === 'daily' ? 'Diario' : 'Por Hora'}</p>
                  <p><strong>Salario:</strong> 
                    {formData?.salaryType === 'daily' 
                      ? ` ${branding?.simbolo_moneda}${formData?.dailySalary}/día`
                      : ` ${branding?.simbolo_moneda}${formData?.hourlyRate}/hora`
                    }
                  </p>
                  <p><strong>Sitio:</strong> {
                    constructionSites?.find(s => s?.id === formData?.siteId)?.name || 'Sin asignar'
                  }</p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Registro de Empleado</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Progress Indicator */}
        <div className="px-6 py-4 border-b">
          <div className="flex items-center justify-between mb-4">
            {steps?.map((step, index) => {
              const StepIcon = step?.icon;
              const isActive = currentStep === step?.id;
              const isCompleted = currentStep > step?.id;
              
              return (
                <div key={step?.id} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    isCompleted 
                      ? 'bg-green-500 border-green-500 text-white' 
                      : isActive 
                        ? 'border-blue-500 text-blue-500' :'border-gray-300 text-gray-400'
                  }`}>
                    <StepIcon className="h-5 w-5" />
                  </div>
                  {index < steps?.length - 1 && (
                    <div className={`flex-1 h-1 mx-4 ${
                      isCompleted ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-900">
              Paso {currentStep} de {steps?.length}: {steps?.find(s => s?.id === currentStep)?.title}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          {renderStepContent()}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Button>

          <div className="flex gap-3">
            {currentStep < steps?.length ? (
              <Button
                onClick={handleNext}
                className="flex items-center gap-2"
                style={{ backgroundColor: branding?.color_primario }}
              >
                Siguiente
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2"
                style={{ backgroundColor: branding?.color_primario }}
              >
                {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                Registrar Empleado
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}