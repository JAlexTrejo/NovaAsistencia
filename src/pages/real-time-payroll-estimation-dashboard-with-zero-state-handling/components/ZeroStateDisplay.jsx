import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import CurrencyDisplay from '../../../components/ui/CurrencyDisplay';

const ZeroStateDisplay = ({ 
  type = 'no-data', 
  title, 
  description, 
  actionLabel, 
  onAction, 
  loading = false 
}) => {
  const getIconName = () => {
    switch (type) {
      case 'no-employees': return 'Users';
      case 'no-data': return 'Calculator';
      case 'calculating': return 'Loader2';
      default: return 'AlertCircle';
    }
  };

  const getZeroStateCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {[
        { label: 'Horas Regulares', value: 0, icon: 'Clock' },
        { label: 'Horas Extra', value: 0, icon: 'Clock4' },
        { label: 'Bonificaciones', value: 0, icon: 'TrendingUp' },
        { label: 'Total Estimado', value: 0, icon: 'DollarSign' }
      ]?.map((item, index) => (
        <div key={index} className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {item?.label}
              </p>
              <div className="text-2xl font-bold text-foreground">
                {item?.label?.includes('Horas') ? (
                  `${item?.value?.toFixed(1)}h`
                ) : (
                  <CurrencyDisplay amount={item?.value} />
                )}
              </div>
            </div>
            <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
              <Icon name={item?.icon} size={16} className="text-muted-foreground" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="text-center py-12">
      {/* Zero State Cards for no-data type */}
      {type === 'no-data' && getZeroStateCards()}
      {/* Main Zero State Content */}
      <div className="max-w-md mx-auto">
        <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
          <Icon 
            name={getIconName()} 
            size={32} 
            className={`text-muted-foreground ${type === 'calculating' ? 'animate-spin' : ''}`} 
          />
        </div>
        
        <h3 className="text-xl font-semibold text-foreground mb-3">
          {title}
        </h3>
        
        <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
          {description}
        </p>

        {/* Zero Values Example for no-data state */}
        {type === 'no-data' && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Vista Previa de Estimación
            </h4>
            <div className="text-center space-y-1">
              <div className="text-lg font-medium text-gray-900">
                Empleado Ejemplo
              </div>
              <div className="text-sm text-gray-500">
                Horas trabajadas: 0h • Horas extra: 0h
              </div>
              <div className="text-lg font-bold text-green-600">
                <CurrencyDisplay amount={0} />
              </div>
              <div className="text-xs text-gray-400">
                Se actualizará automáticamente con datos reales
              </div>
            </div>
          </div>
        )}
        
        {actionLabel && onAction && (
          <Button
            onClick={onAction}
            disabled={loading}
            iconName={loading ? 'Loader2' : 'Plus'}
            className={loading ? 'animate-spin' : ''}
          >
            {loading ? 'Cargando...' : actionLabel}
          </Button>
        )}

        {/* Additional Help Text */}
        {type === 'no-data' && (
          <div className="mt-8 text-xs text-muted-foreground">
            <p>
              💡 <strong>Tip:</strong> Los valores cambiarán automáticamente cuando se registren datos de asistencia
            </p>
          </div>
        )}
      </div>
      {/* Status Cards for Troubleshooting */}
      {type === 'no-employees' && (
        <div className="mt-8 max-w-2xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { 
              title: '1. Registrar Empleados', 
              description: 'Agregue empleados al sistema',
              icon: 'UserPlus',
              status: 'pending'
            },
            { 
              title: '2. Asignar Proyectos', 
              description: 'Asigne empleados a proyectos activos',
              icon: 'Building',
              status: 'disabled'
            },
            { 
              title: '3. Registrar Asistencia', 
              description: 'Los empleados registran entrada/salida',
              icon: 'Clock',
              status: 'disabled'
            }
          ]?.map((step, index) => (
            <div key={index} className="p-4 border rounded-lg bg-white">
              <div className="flex items-center space-x-3 mb-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step?.status === 'pending' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
                }`}>
                  <Icon name={step?.icon} size={16} />
                </div>
                <h4 className="text-sm font-medium text-gray-900">
                  {step?.title}
                </h4>
              </div>
              <p className="text-xs text-gray-500">
                {step?.description}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ZeroStateDisplay;