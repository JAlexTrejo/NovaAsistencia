import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import { Checkbox } from '../../../components/ui/Checkbox';

const SystemSettingsTab = () => {
  const [settings, setSettings] = useState({
    workingHours: {
      startTime: '08:00',
      endTime: '18:00',
      lunchDuration: '60',
      tardinessTolerance: '10'
    },
    payroll: {
      overtimeThreshold: '9',
      overtimeMultiplier: '1.5',
      weekendMultiplier: '2.0',
      holidayMultiplier: '2.5'
    },
    attendance: {
      autoClockOut: true,
      locationRequired: true,
      photoRequired: false,
      offlineMode: true
    },
    notifications: {
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      reminderTime: '30'
    }
  });

  const [hasChanges, setHasChanges] = useState(false);

  const timezoneOptions = [
    { value: 'America/Mexico_City', label: 'Ciudad de México (GMT-6)' },
    { value: 'America/Bogota', label: 'Bogotá (GMT-5)' },
    { value: 'America/Lima', label: 'Lima (GMT-5)' },
    { value: 'America/Argentina/Buenos_Aires', label: 'Buenos Aires (GMT-3)' },
    { value: 'Europe/Madrid', label: 'Madrid (GMT+1)' }
  ];

  const currencyOptions = [
    { value: 'MXN', label: 'Peso Mexicano (MXN)' },
    { value: 'COP', label: 'Peso Colombiano (COP)' },
    { value: 'PEN', label: 'Sol Peruano (PEN)' },
    { value: 'ARS', label: 'Peso Argentino (ARS)' },
    { value: 'EUR', label: 'Euro (EUR)' }
  ];

  const handleInputChange = (section, field, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev?.[section],
        [field]: value
      }
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    // Simulate save operation
    console.log('Saving settings:', settings);
    setHasChanges(false);
  };

  const handleReset = () => {
    // Reset to default values
    setHasChanges(false);
  };

  return (
    <div className="space-y-8">
      {/* Save Banner */}
      {hasChanges && (
        <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Icon name="AlertTriangle" size={20} className="text-warning" />
              <span className="text-sm font-medium text-foreground">
                Tienes cambios sin guardar
              </span>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={handleReset}>
                Descartar
              </Button>
              <Button size="sm" onClick={handleSave}>
                Guardar Cambios
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Working Hours Configuration */}
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Icon name="Clock" size={20} className="text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Configuración de Horarios</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Input
            label="Hora de Entrada"
            type="time"
            value={settings?.workingHours?.startTime}
            onChange={(e) => handleInputChange('workingHours', 'startTime', e?.target?.value)}
          />
          <Input
            label="Hora de Salida"
            type="time"
            value={settings?.workingHours?.endTime}
            onChange={(e) => handleInputChange('workingHours', 'endTime', e?.target?.value)}
          />
          <Input
            label="Duración Almuerzo (min)"
            type="number"
            value={settings?.workingHours?.lunchDuration}
            onChange={(e) => handleInputChange('workingHours', 'lunchDuration', e?.target?.value)}
          />
          <Input
            label="Tolerancia Tardanza (min)"
            type="number"
            value={settings?.workingHours?.tardinessTolerance}
            onChange={(e) => handleInputChange('workingHours', 'tardinessTolerance', e?.target?.value)}
          />
        </div>
      </div>
      {/* Payroll Configuration */}
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Icon name="Calculator" size={20} className="text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Configuración de Nómina</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Input
            label="Umbral Horas Extra (h)"
            type="number"
            step="0.5"
            value={settings?.payroll?.overtimeThreshold}
            onChange={(e) => handleInputChange('payroll', 'overtimeThreshold', e?.target?.value)}
            description="Horas trabajadas para considerar tiempo extra"
          />
          <Input
            label="Multiplicador Horas Extra"
            type="number"
            step="0.1"
            value={settings?.payroll?.overtimeMultiplier}
            onChange={(e) => handleInputChange('payroll', 'overtimeMultiplier', e?.target?.value)}
          />
          <Input
            label="Multiplicador Fin de Semana"
            type="number"
            step="0.1"
            value={settings?.payroll?.weekendMultiplier}
            onChange={(e) => handleInputChange('payroll', 'weekendMultiplier', e?.target?.value)}
          />
          <Input
            label="Multiplicador Feriados"
            type="number"
            step="0.1"
            value={settings?.payroll?.holidayMultiplier}
            onChange={(e) => handleInputChange('payroll', 'holidayMultiplier', e?.target?.value)}
          />
        </div>
      </div>
      {/* Attendance Settings */}
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Icon name="UserCheck" size={20} className="text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Configuración de Asistencia</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Checkbox
              label="Cierre Automático de Jornada"
              description="Cerrar automáticamente a las 18:00 si no se registra salida"
              checked={settings?.attendance?.autoClockOut}
              onChange={(e) => handleInputChange('attendance', 'autoClockOut', e?.target?.checked)}
            />
            <Checkbox
              label="Ubicación Requerida"
              description="Solicitar ubicación GPS al registrar asistencia"
              checked={settings?.attendance?.locationRequired}
              onChange={(e) => handleInputChange('attendance', 'locationRequired', e?.target?.checked)}
            />
          </div>
          <div className="space-y-4">
            <Checkbox
              label="Foto Requerida"
              description="Solicitar foto de verificación al registrar"
              checked={settings?.attendance?.photoRequired}
              onChange={(e) => handleInputChange('attendance', 'photoRequired', e?.target?.checked)}
            />
            <Checkbox
              label="Modo Offline"
              description="Permitir registro sin conexión a internet"
              checked={settings?.attendance?.offlineMode}
              onChange={(e) => handleInputChange('attendance', 'offlineMode', e?.target?.checked)}
            />
          </div>
        </div>
      </div>
      {/* Notification Settings */}
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Icon name="Bell" size={20} className="text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Configuración de Notificaciones</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Checkbox
              label="Notificaciones por Email"
              description="Enviar alertas y recordatorios por correo"
              checked={settings?.notifications?.emailNotifications}
              onChange={(e) => handleInputChange('notifications', 'emailNotifications', e?.target?.checked)}
            />
            <Checkbox
              label="Notificaciones SMS"
              description="Enviar alertas críticas por mensaje de texto"
              checked={settings?.notifications?.smsNotifications}
              onChange={(e) => handleInputChange('notifications', 'smsNotifications', e?.target?.checked)}
            />
          </div>
          <div className="space-y-4">
            <Checkbox
              label="Notificaciones Push"
              description="Mostrar notificaciones en la aplicación"
              checked={settings?.notifications?.pushNotifications}
              onChange={(e) => handleInputChange('notifications', 'pushNotifications', e?.target?.checked)}
            />
            <Input
              label="Tiempo de Recordatorio (min)"
              type="number"
              value={settings?.notifications?.reminderTime}
              onChange={(e) => handleInputChange('notifications', 'reminderTime', e?.target?.value)}
              description="Minutos antes del fin de jornada para recordar"
            />
          </div>
        </div>
      </div>
      {/* Regional Settings */}
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Icon name="Globe" size={20} className="text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Configuración Regional</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Zona Horaria"
            options={timezoneOptions}
            value="America/Mexico_City"
            onChange={() => {}}
            description="Zona horaria para cálculos de tiempo"
          />
          <Select
            label="Moneda"
            options={currencyOptions}
            value="MXN"
            onChange={() => {}}
            description="Moneda para cálculos de nómina"
          />
        </div>
      </div>
      {/* System Health */}
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Icon name="Activity" size={20} className="text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Estado del Sistema</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-success/10 border border-success/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Base de Datos</p>
                <p className="text-xs text-muted-foreground">Conexión estable</p>
              </div>
              <Icon name="Database" size={20} className="text-success" />
            </div>
          </div>
          
          <div className="bg-success/10 border border-success/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Servidor</p>
                <p className="text-xs text-muted-foreground">Funcionando correctamente</p>
              </div>
              <Icon name="Server" size={20} className="text-success" />
            </div>
          </div>
          
          <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Almacenamiento</p>
                <p className="text-xs text-muted-foreground">85% utilizado</p>
              </div>
              <Icon name="HardDrive" size={20} className="text-warning" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemSettingsTab;