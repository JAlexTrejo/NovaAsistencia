import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';

const EmployeeCreationModal = ({ 
  isOpen, 
  onClose, 
  onSave,
  userRole = 'admin' 
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    idNumber: '',
    birthDate: '',
    address: '',
    emergencyContact: '',
    site: '',
    supervisor: '',
    hireDate: new Date()?.toISOString()?.split('T')?.[0],
    dailySalary: '',
    status: 'active'
  });
  
  const [errors, setErrors] = useState({});
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const constructionSites = [
    { value: 'obra-central', label: 'Obra Central' },
    { value: 'proyecto-norte', label: 'Proyecto Norte' },
    { value: 'edificio-sur', label: 'Edificio Sur' },
    { value: 'complejo-oeste', label: 'Complejo Oeste' }
  ];

  const supervisors = [
    { value: 'carlos-martinez', label: 'Carlos Martínez' },
    { value: 'ana-rodriguez', label: 'Ana Rodríguez' },
    { value: 'miguel-santos', label: 'Miguel Santos' },
    { value: 'lucia-fernandez', label: 'Lucía Fernández' }
  ];

  const steps = [
    { id: 1, title: 'Información Personal', icon: 'User' },
    { id: 2, title: 'Contacto', icon: 'Phone' },
    { id: 3, title: 'Empleo', icon: 'Briefcase' },
    { id: 4, title: 'Confirmación', icon: 'CheckCircle' }
  ];

  const validateStep = (step) => {
    const newErrors = {};
    
    switch (step) {
      case 1:
        if (!formData?.name?.trim()) newErrors.name = 'El nombre es requerido';
        if (!formData?.idNumber?.trim()) newErrors.idNumber = 'El número de identificación es requerido';
        if (!formData?.birthDate) newErrors.birthDate = 'La fecha de nacimiento es requerida';
        break;
      case 2:
        if (!formData?.email?.trim()) newErrors.email = 'El email es requerido';
        if (formData?.email && !/\S+@\S+\.\S+/?.test(formData?.email)) {
          newErrors.email = 'El email no es válido';
        }
        if (!formData?.phone?.trim()) newErrors.phone = 'El teléfono es requerido';
        break;
      case 3:
        if (!formData?.site) newErrors.site = 'El sitio de construcción es requerido';
        if (!formData?.supervisor) newErrors.supervisor = 'El supervisor es requerido';
        if (!formData?.hireDate) newErrors.hireDate = 'La fecha de contratación es requerida';
        if (userRole === 'admin' && !formData?.dailySalary) {
          newErrors.dailySalary = 'El salario diario es requerido';
        }
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors?.[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
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
    if (!validateStep(3)) return;
    
    setIsSubmitting(true);
    
    try {
      // Generate employee ID
      const employeeId = `EMP${Date.now()?.toString()?.slice(-6)}`;
      
      const newEmployee = {
        ...formData,
        id: Date.now(),
        employeeId,
        avatar: null,
        lastAttendance: null,
        createdAt: new Date()?.toISOString()
      };
      
      await onSave(newEmployee);
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        idNumber: '',
        birthDate: '',
        address: '',
        emergencyContact: '',
        site: '',
        supervisor: '',
        hireDate: new Date()?.toISOString()?.split('T')?.[0],
        dailySalary: '',
        status: 'active'
      });
      setCurrentStep(1);
      setErrors({});
      onClose();
    } catch (error) {
      console.error('Error creating employee:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Nuevo Empleado</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Paso {currentStep} de {steps?.length}: {steps?.[currentStep - 1]?.title}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            iconName="X"
            iconSize={20}
          />
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            {steps?.map((step, index) => (
              <div key={step?.id} className="flex items-center">
                <div className={`
                  flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors duration-150 ease-out-cubic
                  ${currentStep >= step?.id 
                    ? 'bg-primary border-primary text-primary-foreground' 
                    : 'border-border text-muted-foreground'
                  }
                `}>
                  {currentStep > step?.id ? (
                    <Icon name="Check" size={16} />
                  ) : (
                    <Icon name={step?.icon} size={16} />
                  )}
                </div>
                
                {index < steps?.length - 1 && (
                  <div className={`
                    w-16 h-0.5 mx-2 transition-colors duration-150 ease-out-cubic
                    ${currentStep > step?.id ? 'bg-primary' : 'bg-border'}
                  `} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <div className="p-6 overflow-y-auto max-h-96">
          {currentStep === 1 && (
            <div className="space-y-4">
              <Input
                label="Nombre completo"
                placeholder="Ej: Juan Pérez García"
                value={formData?.name}
                onChange={(e) => handleInputChange('name', e?.target?.value)}
                error={errors?.name}
                required
              />
              
              <Input
                label="Número de identificación"
                placeholder="Ej: 12345678A"
                value={formData?.idNumber}
                onChange={(e) => handleInputChange('idNumber', e?.target?.value)}
                error={errors?.idNumber}
                required
              />
              
              <Input
                label="Fecha de nacimiento"
                type="date"
                value={formData?.birthDate}
                onChange={(e) => handleInputChange('birthDate', e?.target?.value)}
                error={errors?.birthDate}
                required
              />
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <Input
                label="Email"
                type="email"
                placeholder="juan.perez@empresa.com"
                value={formData?.email}
                onChange={(e) => handleInputChange('email', e?.target?.value)}
                error={errors?.email}
                required
              />
              
              <Input
                label="Teléfono"
                type="tel"
                placeholder="+34 600 123 456"
                value={formData?.phone}
                onChange={(e) => handleInputChange('phone', e?.target?.value)}
                error={errors?.phone}
                required
              />
              
              <Input
                label="Dirección"
                placeholder="Calle Principal 123, Ciudad"
                value={formData?.address}
                onChange={(e) => handleInputChange('address', e?.target?.value)}
              />
              
              <Input
                label="Contacto de emergencia"
                placeholder="Nombre y teléfono"
                value={formData?.emergencyContact}
                onChange={(e) => handleInputChange('emergencyContact', e?.target?.value)}
              />
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <Select
                label="Sitio de construcción"
                options={constructionSites}
                value={formData?.site}
                onChange={(value) => handleInputChange('site', value)}
                error={errors?.site}
                required
                placeholder="Seleccionar sitio..."
              />
              
              <Select
                label="Supervisor"
                options={supervisors}
                value={formData?.supervisor}
                onChange={(value) => handleInputChange('supervisor', value)}
                error={errors?.supervisor}
                required
                placeholder="Seleccionar supervisor..."
              />
              
              <Input
                label="Fecha de contratación"
                type="date"
                value={formData?.hireDate}
                onChange={(e) => handleInputChange('hireDate', e?.target?.value)}
                error={errors?.hireDate}
                required
              />
              
              {userRole === 'admin' && (
                <Input
                  label="Salario diario (€)"
                  type="number"
                  placeholder="80.00"
                  value={formData?.dailySalary}
                  onChange={(e) => handleInputChange('dailySalary', e?.target?.value)}
                  error={errors?.dailySalary}
                  required
                />
              )}
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="text-center">
                <Icon name="CheckCircle" size={48} className="mx-auto text-success mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Confirmar creación</h3>
                <p className="text-muted-foreground">
                  Revisa la información antes de crear el empleado.
                </p>
              </div>
              
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-muted-foreground">Nombre:</span>
                    <p className="text-foreground">{formData?.name}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Email:</span>
                    <p className="text-foreground">{formData?.email}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Sitio:</span>
                    <p className="text-foreground">
                      {constructionSites?.find(s => s?.value === formData?.site)?.label}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Supervisor:</span>
                    <p className="text-foreground">
                      {supervisors?.find(s => s?.value === formData?.supervisor)?.label}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-border">
          <Button
            variant="outline"
            onClick={currentStep === 1 ? onClose : handlePrevious}
            iconName={currentStep === 1 ? 'X' : 'ChevronLeft'}
            iconSize={16}
          >
            {currentStep === 1 ? 'Cancelar' : 'Anterior'}
          </Button>
          
          <div className="flex space-x-2">
            {currentStep < steps?.length ? (
              <Button
                onClick={handleNext}
                iconName="ChevronRight"
                iconPosition="right"
                iconSize={16}
              >
                Siguiente
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                loading={isSubmitting}
                iconName="Plus"
                iconSize={16}
              >
                Crear Empleado
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeCreationModal;