import React, { useState, useEffect } from 'react';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';

const SessionTimeout = ({ isVisible, onExtend, onLogout, timeLeft = 300 }) => {
  const [countdown, setCountdown] = useState(timeLeft);

  useEffect(() => {
    if (!isVisible) return;

    setCountdown(timeLeft);
    
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isVisible, timeLeft, onLogout]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds?.toString()?.padStart(2, '0')}`;
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-lg shadow-xl border border-border p-8 max-w-md w-full">
        {/* Warning Icon */}
        <div className="flex items-center justify-center w-16 h-16 bg-warning rounded-full mx-auto mb-6">
          <Icon name="Clock" size={32} color="white" />
        </div>

        {/* Title and Message */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Sesión por Expirar
          </h2>
          <p className="text-muted-foreground">
            Su sesión expirará automáticamente por inactividad en:
          </p>
        </div>

        {/* Countdown Timer */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-warning/10 rounded-full mb-4">
            <span className="text-2xl font-bold text-warning">
              {formatTime(countdown)}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Tiempo restante antes del cierre automático
          </p>
        </div>

        {/* Security Information */}
        <div className="mb-6 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-start space-x-2">
            <Icon name="Shield" size={16} className="text-primary mt-0.5" />
            <div className="text-sm text-foreground">
              <p className="font-medium mb-1">Medida de Seguridad</p>
              <p className="text-muted-foreground">
                Esta advertencia aparece para proteger su información personal y mantener 
                la seguridad del sistema.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="default"
            size="lg"
            onClick={onExtend}
            iconName="RefreshCw"
            iconPosition="left"
          >
            Extender Sesión
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={onLogout}
            iconName="LogOut"
            iconPosition="left"
          >
            Cerrar Sesión
          </Button>
        </div>

        {/* Additional Information */}
        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            Al extender la sesión, tendrá 30 minutos adicionales de actividad.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SessionTimeout;