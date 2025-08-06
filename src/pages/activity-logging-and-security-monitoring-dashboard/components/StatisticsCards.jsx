import React from 'react';
import { Activity, Calendar, AlertTriangle, Users, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import Icon from '../../../components/AppIcon';


export default function StatisticsCards({ statistics = {} }) {
  const {
    totalLogs = 0,
    todayLogs = 0,
    securityAlerts = 0,
    activeUsers = 0
  } = statistics;

  // Calculate trend indicators (mock data for demo)
  const getTrendIcon = (current, previous) => {
    if (current > previous) return <TrendingUp className="h-3 w-3 text-green-500" />;
    if (current < previous) return <TrendingDown className="h-3 w-3 text-red-500" />;
    return <Minus className="h-3 w-3 text-gray-500" />;
  };

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return `${(num / 1000000)?.toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000)?.toFixed(1)}K`;
    }
    return num?.toString();
  };

  const cards = [
    {
      title: 'Total de Registros',
      value: formatNumber(totalLogs),
      icon: Activity,
      color: 'blue',
      description: 'Actividades registradas',
      trend: getTrendIcon(totalLogs, totalLogs * 0.85) // Mock previous value
    },
    {
      title: 'Actividad de Hoy',
      value: formatNumber(todayLogs),
      icon: Calendar,
      color: 'green',
      description: 'Eventos del día actual',
      trend: getTrendIcon(todayLogs, todayLogs * 0.7) // Mock previous value
    },
    {
      title: 'Alertas de Seguridad',
      value: formatNumber(securityAlerts),
      icon: AlertTriangle,
      color: securityAlerts > 0 ? 'red' : 'gray',
      description: 'Eventos críticos detectados',
      trend: getTrendIcon(securityAlerts, securityAlerts * 1.2) // Mock previous value
    },
    {
      title: 'Usuarios Activos',
      value: formatNumber(activeUsers),
      icon: Users,
      color: 'purple',
      description: 'Usuarios únicos hoy',
      trend: getTrendIcon(activeUsers, activeUsers * 0.9) // Mock previous value
    }
  ];

  const getColorClasses = (color) => {
    const colorMap = {
      blue: {
        bg: 'bg-blue-50',
        icon: 'text-blue-600',
        border: 'border-blue-200'
      },
      green: {
        bg: 'bg-green-50',
        icon: 'text-green-600',
        border: 'border-green-200'
      },
      red: {
        bg: 'bg-red-50',
        icon: 'text-red-600',
        border: 'border-red-200'
      },
      purple: {
        bg: 'bg-purple-50',
        icon: 'text-purple-600',
        border: 'border-purple-200'
      },
      gray: {
        bg: 'bg-gray-50',
        icon: 'text-gray-600',
        border: 'border-gray-200'
      }
    };
    return colorMap?.[color] || colorMap?.gray;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards?.map((card, index) => {
        const colors = getColorClasses(card?.color);
        const Icon = card?.icon;
        
        return (
          <div
            key={index}
            className={`${colors?.bg} ${colors?.border} border rounded-lg p-6 transition-all duration-200 hover:shadow-md`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg bg-white ${colors?.border} border`}>
                  <Icon className={`h-5 w-5 ${colors?.icon}`} />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-600">
                    {card?.title}
                  </h3>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {card?.value}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-1">
                {card?.trend}
              </div>
            </div>
            
            <div className="mt-4">
              <p className="text-xs text-gray-500">
                {card?.description}
              </p>
            </div>
            
            {/* Progress indicator (mock) */}
            <div className="mt-3">
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div 
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    card?.color === 'blue' ? 'bg-blue-500' :
                    card?.color === 'green' ? 'bg-green-500' :
                    card?.color === 'red' ? 'bg-red-500' :
                    card?.color === 'purple'? 'bg-purple-500' : 'bg-gray-500'
                  }`}
                  style={{ 
                    width: `${Math.min(100, Math.max(10, (parseInt(card?.value?.replace(/[KM]/g, '')) || 0) % 100))}%` 
                  }}
                ></div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}