import React, { useState, useEffect } from 'react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Icon from '../../../components/AppIcon';

const TwoFactorAuth = ({ userRole, onVerify, onCancel, isLoading }) => {
  const [verificationCode, setVerificationCode] = useState('');
  const [method, setMethod] = useState('sms'); // 'sms' or 'authenticator'
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [error, setError] = useState('');

  const mockCodes = {
    sms: '123456',
    authenticator: '789012'
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds?.toString()?.padStart(2, '0')}`;
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    
    if (!verificationCode) {
      setError('El código de verificación es requerido');
      return;
    }

    if (verificationCode !== mockCodes?.[method]) {
      setError(`Código incorrecto. Use: ${mockCodes?.[method]}`);
      return;
    }

    onVerify(verificationCode);
  };

  const handleResendCode = () => {
    setTimeLeft(300);
    setError('');
    // Simulate code resend
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-card rounded-lg shadow-lg border border-border p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center w-16 h-16 bg-warning rounded-full mx-auto mb-4">
            <Icon name="Shield" size={32} color="white" />
          </div>
          <h2 className="text-2xl font-semibold text-foreground mb-2">Verificación en Dos Pasos</h2>
          <p className="text-muted-foreground">
            Se requiere verificación adicional para roles administrativos
          </p>
        </div>

        {/* Method Selection */}
        <div className="mb-6">
          <p className="text-sm font-medium text-foreground mb-3">Método de verificación:</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setMethod('sms')}
              className={`p-3 rounded-lg border transition-all duration-150 ease-out-cubic ${
                method === 'sms' ?'border-primary bg-primary/10 text-primary' :'border-border bg-background text-muted-foreground hover:bg-muted'
              }`}
            >
              <Icon name="Smartphone" size={20} className="mx-auto mb-1" />
              <span className="text-xs font-medium">SMS</span>
            </button>
            <button
              type="button"
              onClick={() => setMethod('authenticator')}
              className={`p-3 rounded-lg border transition-all duration-150 ease-out-cubic ${
                method === 'authenticator' ?'border-primary bg-primary/10 text-primary' :'border-border bg-background text-muted-foreground hover:bg-muted'
              }`}
            >
              <Icon name="Key" size={20} className="mx-auto mb-1" />
              <span className="text-xs font-medium">App</span>
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="mb-6 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-start space-x-2">
            <Icon name="Info" size={16} className="text-primary mt-0.5" />
            <div className="text-sm text-foreground">
              {method === 'sms' ? (
                <p>Hemos enviado un código de 6 dígitos a su teléfono móvil registrado.</p>
              ) : (
                <p>Abra su aplicación de autenticación y ingrese el código de 6 dígitos.</p>
              )}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-error/10 border border-error/20 rounded-lg">
            <div className="flex items-center space-x-2">
              <Icon name="AlertCircle" size={16} className="text-error" />
              <p className="text-sm text-error">{error}</p>
            </div>
          </div>
        )}

        {/* Verification Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Código de Verificación"
            type="text"
            placeholder="000000"
            value={verificationCode}
            onChange={(e) => {
              setVerificationCode(e?.target?.value?.replace(/\D/g, '')?.slice(0, 6));
              setError('');
            }}
            error={error}
            maxLength={6}
            required
          />

          {/* Timer */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Código válido por: <span className="font-medium text-warning">{formatTime(timeLeft)}</span>
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              type="submit"
              variant="default"
              size="lg"
              fullWidth
              loading={isLoading}
              disabled={verificationCode?.length !== 6 || timeLeft === 0}
              iconName="Shield"
              iconPosition="right"
            >
              Verificar Código
            </Button>

            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="outline"
                size="default"
                onClick={handleResendCode}
                disabled={timeLeft > 240} // Allow resend after 1 minute
                iconName="RefreshCw"
                iconPosition="left"
              >
                Reenviar
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="default"
                onClick={onCancel}
                iconName="ArrowLeft"
                iconPosition="left"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </form>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            ¿No recibió el código? Verifique su configuración de mensajes o contacte al administrador.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TwoFactorAuth;