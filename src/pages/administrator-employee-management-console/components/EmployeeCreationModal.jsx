// src/administrator-employee-management-console/EmployeeCreationModal.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import { siteDataService } from '../../data/siteDataService';
import { supervisorDataService } from '../../data/supervisorDataService';
import { employeeDataService } from '../../data/employeeDataService';

const EMAIL_RE = /\S+@\S+\.\S+/;

const EmployeeCreationModal = ({
  isOpen,
  onClose,
  onSave,          // callback opcional tras crear
  userRole = 'admin',
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    idNumber: '',
    birthDate: '',
    address: '',
    emergencyContact: '',
    site: '',           // obra_id
    supervisor: '',     // supervisor_id
    hireDate: new Date().toISOString().split('T')?.[0],
    dailySalary: '',
    status: 'active',
    puesto: '',         // opcional: cargo/puesto (no mock)
  });

  const [errors, setErrors] = useState({});
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Datos reales desde BD
  const [sites, setSites] = useState([]);
  const [sitesLoading, setSitesLoading] = useState(false);
  const [supervisors, setSupervisors] = useState([]);
  const [supervisorsLoading, setSupervisorsLoading] = useState(false);

  const mountedRef = useRef(false);
  const inFlightRef = useRef({ sites: false, sups: false });

  const siteOptions = useMemo(
    () => (sites || []).map(s => ({ value: s.id, label: s.nombre })),
    [sites]
  );
  const supervisorOptions = useMemo(
    () => (supervisors || []).map(u => ({ value: u.id, label: u.nombre || u.correo })),
    [supervisors]
  );

  const steps = [
    { id: 1, title: 'Información Personal', icon: 'User' },
    { id: 2, title: 'Contacto', icon: 'Phone' },
    { id: 3, title: 'Empleo', icon: 'Briefcase' },
    { id: 4, title: 'Confirmación', icon: 'CheckCircle' },
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors?.[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validateStep = (step) => {
    const e = {};
    if (step === 1) {
      if (!formData?.name?.trim()) e.name = 'El nombre es requerido';
      if (!formData?.idNumber?.trim()) e.idNumber = 'El número de identificación es requerido';
      if (!formData?.birthDate) e.birthDate = 'La fecha de nacimiento es requerida';
    }
    if (step === 2) {
      if (!formData?.email?.trim()) e.email = 'El email es requerido';
      else if (!EMAIL_RE.test(formData?.email)) e.email = 'El email no es válido';
      if (!formData?.phone?.trim()) e.phone = 'El teléfono es requerido';
    }
    if (step === 3) {
      if (!formData?.site) e.site = 'El sitio de construcción es requerido';
      if (!formData?.supervisor) e.supervisor = 'El supervisor es requerido';
      if (!formData?.hireDate) e.hireDate = 'La fecha de contratación es requerida';
      if (userRole === 'admin' && (formData?.dailySalary === '' || formData?.dailySalary === null)) {
        e.dailySalary = 'El salario diario es requerido';
      }
      if (formData?.dailySalary !== '' && Number.isNaN(+formData?.dailySalary)) {
        e.dailySalary = 'El salario debe ser numérico';
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length));
    }
  };

  const handlePrevious = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const handleSubmit = async () => {
    if (!validateStep(3)) return;
    setIsSubmitting(true);
    try {
      // Mapea a tu tabla `usuarios` vía employeeDataService (sin valores ficticios)
      const payload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        puesto: formData.puesto || null,                // si no capturas puesto, va null
        obra_id: formData.site,                         // obra real
        supervisor_id: formData.supervisor,             // supervisor real
        hourly_rate: Number(formData.dailySalary) || 0, // usa field existente en BD
        role: 'user',
      };

      const res = await employeeDataService.createEmployee(payload);
      if (!res?.success) throw new Error(res?.error || 'No se pudo crear el empleado');

      if (typeof onSave === 'function') {
        await onSave(res.data);
      }

      // Reset limpio
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
        hireDate: new Date().toISOString().split('T')?.[0],
        dailySalary: '',
        status: 'active',
        puesto: '',
      });
      setCurrentStep(1);
      setErrors({});
      onClose?.();
    } catch (err) {
      console.error('Error creating employee:', err);
      setErrors(prev => ({ ...prev, submit: err?.message || 'No se pudo crear el empleado' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cargar sitios y supervisores desde BD al abrir
  useEffect(() => {
    mountedRef.current = true;
    if (!isOpen) return;

    const loadSites = async () => {
      if (inFlightRef.current.sites) return;
      inFlightRef.current.sites = true;
      setSitesLoading(true);
      try {
        const res = await siteDataService.getSites({ activa: true, limit: 500, orderBy: 'created_at', order: 'desc' });
        if (mountedRef.current && res?.success) setSites(res.data || []);
      } catch (e) {
        console.error('Error loading sites:', e);
      } finally {
        setSitesLoading(false);
        inFlightRef.current.sites = false;
      }
    };

    const loadSupervisors = async () => {
      if (inFlightRef.current.sups) return;
      inFlightRef.current.sups = true;
      setSupervisorsLoading(true);
      try {
        const res = await supervisorDataService.getSupervisors({
          roles: ['supervisor', 'admin', 'superadmin'],
          is_active: true,
          limit: 500,
          orderBy: 'created_at',
          order: 'desc',
        });
        if (mountedRef.current && res?.success) setSupervisors(res.data || []);
      } catch (e) {
        console.error('Error loading supervisors:', e);
      } finally {
        setSupervisorsLoading(false);
        inFlightRef.current.sups = false;
      }
    };

    loadSites();
    loadSupervisors();

    return () => { mountedRef.current = false; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Nuevo Empleado</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Paso {currentStep} de {steps.length}: {steps[currentStep - 1]?.title}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} iconName="X" iconSize={20} />
        </div>

        {/* Steps */}
        <div className="px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            {steps.map((step, idx) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors
                  ${currentStep >= step.id ? 'bg-primary border-primary text-primary-foreground' : 'border-border text-muted-foreground'}`}>
                  {currentStep > step.id ? <Icon name="Check" size={16} /> : <Icon name={step.icon} size={16} />}
                </div>
                {idx < steps.length - 1 && (
                  <div className={`w-16 h-0.5 mx-2 ${currentStep > step.id ? 'bg-primary' : 'bg-border'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-96">
          {currentStep === 1 && (
            <div className="space-y-4">
              <Input
                label="Nombre completo"
                placeholder="Ej: Juan Pérez García"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e?.target?.value)}
                error={errors.name}
                required
              />
              <Input
                label="Número de identificación"
                placeholder="Ej: 12345678A"
                value={formData.idNumber}
                onChange={(e) => handleInputChange('idNumber', e?.target?.value)}
                error={errors.idNumber}
                required
              />
              <Input
                label="Fecha de nacimiento"
                type="date"
                value={formData.birthDate}
                onChange={(e) => handleInputChange('birthDate', e?.target?.value)}
                error={errors.birthDate}
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
                value={formData.email}
                onChange={(e) => handleInputChange('email', e?.target?.value)}
                error={errors.email}
                required
              />
              <Input
                label="Teléfono"
                type="tel"
                placeholder="+52 81 0000 0000"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e?.target?.value)}
                error={errors.phone}
                required
              />
              <Input
                label="Dirección"
                placeholder="Calle Principal 123, Ciudad"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e?.target?.value)}
              />
              <Input
                label="Contacto de emergencia"
                placeholder="Nombre y teléfono"
                value={formData.emergencyContact}
                onChange={(e) => handleInputChange('emergencyContact', e?.target?.value)}
              />
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <Select
                label="Sitio de construcción"
                options={siteOptions}
                value={formData.site}
                onChange={(value) => handleInputChange('site', value)}
                error={errors.site}
                required
                placeholder={sitesLoading ? 'Cargando sitios...' : 'Seleccionar sitio...'}
                disabled={sitesLoading}
              />
              <Select
                label="Supervisor"
                options={supervisorOptions}
                value={formData.supervisor}
                onChange={(value) => handleInputChange('supervisor', value)}
                error={errors.supervisor}
                required
                placeholder={supervisorsLoading ? 'Cargando supervisores...' : 'Seleccionar supervisor...'}
                disabled={supervisorsLoading}
              />
              <Input
                label="Fecha de contratación"
                type="date"
                value={formData.hireDate}
                onChange={(e) => handleInputChange('hireDate', e?.target?.value)}
                error={errors.hireDate}
                required
              />
              {userRole === 'admin' && (
                <Input
                  label="Salario diario"
                  type="number"
                  placeholder="800.00"
                  value={formData.dailySalary}
                  onChange={(e) => handleInputChange('dailySalary', e?.target?.value)}
                  error={errors.dailySalary}
                  required
                />
              )}
              <Input
                label="Puesto (opcional)"
                placeholder="Ej: Albañil, Electricista..."
                value={formData.puesto}
                onChange={(e) => handleInputChange('puesto', e?.target?.value)}
              />
              {errors.submit && <p className="text-sm text-destructive mt-2">{errors.submit}</p>}
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="text-center">
                <Icon name="CheckCircle" size={48} className="mx-auto text-success mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Confirmar creación</h3>
                <p className="text-muted-foreground">Revisa la información antes de crear el empleado.</p>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-muted-foreground">Nombre:</span>
                    <p className="text-foreground">{formData.name}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Email:</span>
                    <p className="text-foreground">{formData.email}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Sitio:</span>
                    <p className="text-foreground">
                      {siteOptions.find(s => s.value === formData.site)?.label || '—'}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Supervisor:</span>
                    <p className="text-foreground">
                      {supervisorOptions.find(s => s.value === formData.supervisor)?.label || '—'}
                    </p>
                  </div>
                  {formData.puesto ? (
                    <div className="col-span-2">
                      <span className="font-medium text-muted-foreground">Puesto:</span>
                      <p className="text-foreground">{formData.puesto}</p>
                    </div>
                  ) : null}
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
            {currentStep < steps.length ? (
              <Button
                onClick={handleNext}
                iconName="ChevronRight"
                iconPosition="right"
                iconSize={16}
                disabled={sitesLoading || supervisorsLoading}
              >
                Siguiente
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                loading={isSubmitting}
                iconName="Plus"
                iconSize={16}
                disabled={isSubmitting}
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
