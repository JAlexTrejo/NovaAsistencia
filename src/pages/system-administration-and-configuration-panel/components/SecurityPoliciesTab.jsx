import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

import { Checkbox } from '../../../components/ui/Checkbox';

const SecurityPoliciesTab = () => {
  const [policies, setPolicies] = useState({
    password: {
      minLength: '8',
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      expirationDays: '90',
      historyCount: '5'
    },
    session: {
      timeoutMinutes: '30',
      maxConcurrentSessions: '3',
      requireReauth: true,
      rememberDevice: false
    },
    twoFactor: {
      enabled: true,
      requiredForAdmins: true,
      requiredForSupervisors: false,
      backupCodes: true,
      smsEnabled: true,
      emailEnabled: true
    },
    api: {
      rateLimitEnabled: true,
      requestsPerMinute: '100',
      tokenExpirationHours: '24',
      refreshTokenDays: '30'
    }
  });

  const [securityEvents, setSecurityEvents] = useState([
    {
      id: 1,
      type: 'login_failure',
      user: 'carlos.rodriguez@construcciones.com',
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      details: 'Múltiples intentos fallidos de inicio de sesión',
      severity: 'high',
      status: 'active'
    },
    {
      id: 2,
      type: 'permission_change',
      user: 'admin@construcciones.com',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      details: 'Permisos modificados para usuario María González',
      severity: 'medium',
      status: 'resolved'
    },
    {
      id: 3,
      type: 'data_export',
      user: 'maria.gonzalez@construcciones.com',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
      details: 'Exportación masiva de datos de nómina',
      severity: 'medium',
      status: 'reviewed'
    }
  ]);

  const [hasChanges, setHasChanges] = useState(false);

  const handlePolicyChange = (section, field, value) => {
    setPolicies(prev => ({
      ...prev,
      [section]: {
        ...prev?.[section],
        [field]: value
      }
    }));
    setHasChanges(true);
  };

  const getSeverityColor = (severity) => {
    const colors = {
      high: 'bg-error/10 text-error border-error/20',
      medium: 'bg-warning/10 text-warning border-warning/20',
      low: 'bg-success/10 text-success border-success/20'
    };
    return colors?.[severity] || colors?.low;
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-error text-error-foreground',
      resolved: 'bg-success text-success-foreground',
      reviewed: 'bg-secondary text-secondary-foreground'
    };
    return colors?.[status] || colors?.active;
  };

  const formatTimestamp = (date) => {
    return date?.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
                Cambios de seguridad pendientes de aplicar
              </span>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                Descartar
              </Button>
              <Button size="sm">
                Aplicar Políticas
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Password Policies */}
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Icon name="Lock" size={20} className="text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Políticas de Contraseña</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <Input
            label="Longitud Mínima"
            type="number"
            min="6"
            max="20"
            value={policies?.password?.minLength}
            onChange={(e) => handlePolicyChange('password', 'minLength', e?.target?.value)}
          />
          <Input
            label="Expiración (días)"
            type="number"
            min="30"
            max="365"
            value={policies?.password?.expirationDays}
            onChange={(e) => handlePolicyChange('password', 'expirationDays', e?.target?.value)}
          />
          <Input
            label="Historial de Contraseñas"
            type="number"
            min="1"
            max="10"
            value={policies?.password?.historyCount}
            onChange={(e) => handlePolicyChange('password', 'historyCount', e?.target?.value)}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <Checkbox
              label="Requerir Mayúsculas"
              description="Al menos una letra mayúscula"
              checked={policies?.password?.requireUppercase}
              onChange={(e) => handlePolicyChange('password', 'requireUppercase', e?.target?.checked)}
            />
            <Checkbox
              label="Requerir Minúsculas"
              description="Al menos una letra minúscula"
              checked={policies?.password?.requireLowercase}
              onChange={(e) => handlePolicyChange('password', 'requireLowercase', e?.target?.checked)}
            />
          </div>
          <div className="space-y-3">
            <Checkbox
              label="Requerir Números"
              description="Al menos un dígito numérico"
              checked={policies?.password?.requireNumbers}
              onChange={(e) => handlePolicyChange('password', 'requireNumbers', e?.target?.checked)}
            />
            <Checkbox
              label="Requerir Caracteres Especiales"
              description="Al menos un símbolo especial"
              checked={policies?.password?.requireSpecialChars}
              onChange={(e) => handlePolicyChange('password', 'requireSpecialChars', e?.target?.checked)}
            />
          </div>
        </div>
      </div>
      {/* Session Management */}
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Icon name="Timer" size={20} className="text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Gestión de Sesiones</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Input
            label="Tiempo de Inactividad (min)"
            type="number"
            min="5"
            max="120"
            value={policies?.session?.timeoutMinutes}
            onChange={(e) => handlePolicyChange('session', 'timeoutMinutes', e?.target?.value)}
          />
          <Input
            label="Sesiones Concurrentes Máximas"
            type="number"
            min="1"
            max="10"
            value={policies?.session?.maxConcurrentSessions}
            onChange={(e) => handlePolicyChange('session', 'maxConcurrentSessions', e?.target?.value)}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Checkbox
            label="Reautenticación Requerida"
            description="Solicitar contraseña para acciones críticas"
            checked={policies?.session?.requireReauth}
            onChange={(e) => handlePolicyChange('session', 'requireReauth', e?.target?.checked)}
          />
          <Checkbox
            label="Recordar Dispositivo"
            description="Permitir recordar dispositivos confiables"
            checked={policies?.session?.rememberDevice}
            onChange={(e) => handlePolicyChange('session', 'rememberDevice', e?.target?.checked)}
          />
        </div>
      </div>
      {/* Two-Factor Authentication */}
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Icon name="Shield" size={20} className="text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Autenticación de Dos Factores</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Checkbox
              label="Habilitar 2FA"
              description="Activar autenticación de dos factores"
              checked={policies?.twoFactor?.enabled}
              onChange={(e) => handlePolicyChange('twoFactor', 'enabled', e?.target?.checked)}
            />
            <Checkbox
              label="Obligatorio para Administradores"
              description="Requerir 2FA para roles administrativos"
              checked={policies?.twoFactor?.requiredForAdmins}
              onChange={(e) => handlePolicyChange('twoFactor', 'requiredForAdmins', e?.target?.checked)}
            />
            <Checkbox
              label="Obligatorio para Supervisores"
              description="Requerir 2FA para supervisores"
              checked={policies?.twoFactor?.requiredForSupervisors}
              onChange={(e) => handlePolicyChange('twoFactor', 'requiredForSupervisors', e?.target?.checked)}
            />
          </div>
          <div className="space-y-4">
            <Checkbox
              label="Códigos de Respaldo"
              description="Generar códigos de emergencia"
              checked={policies?.twoFactor?.backupCodes}
              onChange={(e) => handlePolicyChange('twoFactor', 'backupCodes', e?.target?.checked)}
            />
            <Checkbox
              label="Verificación por SMS"
              description="Permitir códigos por mensaje de texto"
              checked={policies?.twoFactor?.smsEnabled}
              onChange={(e) => handlePolicyChange('twoFactor', 'smsEnabled', e?.target?.checked)}
            />
            <Checkbox
              label="Verificación por Email"
              description="Permitir códigos por correo electrónico"
              checked={policies?.twoFactor?.emailEnabled}
              onChange={(e) => handlePolicyChange('twoFactor', 'emailEnabled', e?.target?.checked)}
            />
          </div>
        </div>
      </div>
      {/* API Security */}
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Icon name="Key" size={20} className="text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Seguridad de API</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <Input
            label="Límite de Peticiones/min"
            type="number"
            min="10"
            max="1000"
            value={policies?.api?.requestsPerMinute}
            onChange={(e) => handlePolicyChange('api', 'requestsPerMinute', e?.target?.value)}
          />
          <Input
            label="Expiración Token (horas)"
            type="number"
            min="1"
            max="168"
            value={policies?.api?.tokenExpirationHours}
            onChange={(e) => handlePolicyChange('api', 'tokenExpirationHours', e?.target?.value)}
          />
          <Input
            label="Refresh Token (días)"
            type="number"
            min="1"
            max="90"
            value={policies?.api?.refreshTokenDays}
            onChange={(e) => handlePolicyChange('api', 'refreshTokenDays', e?.target?.value)}
          />
        </div>
        
        <Checkbox
          label="Límite de Velocidad Habilitado"
          description="Aplicar límites de peticiones por minuto"
          checked={policies?.api?.rateLimitEnabled}
          onChange={(e) => handlePolicyChange('api', 'rateLimitEnabled', e?.target?.checked)}
        />
      </div>
      {/* Security Events */}
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Icon name="AlertTriangle" size={20} className="text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Eventos de Seguridad Recientes</h3>
          </div>
          <Button variant="outline" size="sm" iconName="Download">
            Exportar Log
          </Button>
        </div>
        
        <div className="space-y-3">
          {securityEvents?.map((event) => (
            <div key={event.id} className={`p-4 rounded-lg border ${getSeverityColor(event.severity)}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-sm font-medium text-foreground">{event.user}</span>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(event.status)}`}>
                      {event.status === 'active' ? 'Activo' : event.status === 'resolved' ? 'Resuelto' : 'Revisado'}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">{event.details}</p>
                  <p className="text-xs text-muted-foreground">{formatTimestamp(event.timestamp)}</p>
                </div>
                <div className="flex space-x-2">
                  <Button variant="ghost" size="sm" iconName="Eye">
                    Ver
                  </Button>
                  {event.status === 'active' && (
                    <Button variant="outline" size="sm" iconName="Check">
                      Resolver
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SecurityPoliciesTab;