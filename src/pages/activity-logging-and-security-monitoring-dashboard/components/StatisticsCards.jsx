// src/modules/activity-logging-and-security-monitoring-dashboard/components/StatisticsCards.jsx
import React from 'react';
import { Activity, Calendar, AlertTriangle, Users, TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function StatisticsCards({
  statistics = {},
  previousStatistics = {},
  loading = false
}) {
  const {
    totalLogs = 0,
    todayLogs = 0,
    securityAlerts = 0,
    activeUsers = 0
  } = statistics;

  const {
    totalLogs: prevTotalLogs = null,
    todayLogs: prevTodayLogs = null,
    securityAlerts: prevSecurityAlerts = null,
    activeUsers: prevActiveUsers = null
  } = previousStatistics || {};

  // Helpers
  const formatNumber = (num) => {
    const n = Number(num) || 0;
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return `${n}`;
  };

  const getTrendIcon = (current, previous) => {
    if (typeof previous !== 'number') {
      return <Minus className="h-3 w-3 text-gray-500" aria-hidden="true" />;
    }
    if (current > previous) return <TrendingUp className="h-3 w-3 text-green-500" aria-hidden="true" />;
    if (current < previous) return <TrendingDown className="h-3 w-3 text-red-500" aria-hidden="true" />;
    return <Minus className="h-3 w-3 text-gray-500" aria-hidden="true" />;
  };

  const getColorClasses = (color) => {
    const colorMap = {
      blue:   { bg: 'bg-blue-50',   icon: 'text-blue-600',   border: 'border-blue-200',   bar: 'bg-blue-500' },
      green:  { bg: 'bg-green-50',  icon: 'text-green-600',  border: 'border-green-200',  bar: 'bg-green-500' },
      red:    { bg: 'bg-red-50',    icon: 'text-red-600',    border: 'border-red-200',    bar: 'bg-red-500' },
      purple: { bg: 'bg-purple-50', icon: 'text-purple-600', border: 'border-purple-200', bar: 'bg-purple-500' },
      gray:   { bg: 'bg-gray-50',   icon: 'text-gray-600',   border: 'border-gray-200',   bar: 'bg-gray-500' }
    };
    return colorMap[color] || colorMap.gray;
  };

  // Cards config (valor real para progreso; valor formateado para UI)
  const cards = [
    {
      key: 'totalLogs',
      title: 'Total de Registros',
      valueRaw: Number(totalLogs) || 0,
      value: formatNumber(totalLogs),
      icon: Activity,
      color: 'blue',
      description: 'Actividades registradas',
      trend: getTrendIcon(Number(totalLogs) || 0, typeof prevTotalLogs === 'number' ? prevTotalLogs : null)
    },
    {
      key: 'todayLogs',
      title: 'Actividad de Hoy',
      valueRaw: Number(todayLogs) || 0,
      value: formatNumber(todayLogs),
      icon: Calendar,
      color: 'green',
      description: 'Eventos del día actual',
      trend: getTrendIcon(Number(todayLogs) || 0, typeof prevTodayLogs === 'number' ? prevTodayLogs : null)
    },
    {
      key: 'securityAlerts',
      title: 'Alertas de Seguridad',
      valueRaw: Number(securityAlerts) || 0,
      value: formatNumber(securityAlerts),
      icon: AlertTriangle,
      color: (Number(securityAlerts) || 0) > 0 ? 'red' : 'gray',
      description: 'Eventos críticos detectados',
      trend: getTrendIcon(Number(securityAlerts) || 0, typeof prevSecurityAlerts === 'number' ? prevSecurityAlerts : null)
    },
    {
      key: 'activeUsers',
      title: 'Usuarios Activos',
      valueRaw: Number(activeUsers) || 0,
      value: formatNumber(activeUsers),
      icon: Users,
      color: 'purple',
      description: 'Usuarios únicos hoy',
      trend: getTrendIcon(Number(activeUsers) || 0, typeof prevActiveUsers === 'number' ? prevActiveUsers : null)
    }
  ];

  // Skeleton card for loading state
  const SkeletonCard = () => (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-white border border-gray-200">
            <div className="h-5 w-5 bg-gray-200 rounded animate-pulse" />
          </div>
          <div>
            <div className="h-3 w-28 bg-gray-200 rounded animate-pulse" />
            <div className="h-6 w-20 bg-gray-200 rounded mt-2 animate-pulse" />
          </div>
        </div>
        <div className="h-3 w-6 bg-gray-200 rounded animate-pulse" />
      </div>
      <div className="mt-4 h-3 w-40 bg-gray-200 rounded animate-pulse" />
      <div className="mt-3 w-full bg-gray-200 rounded-full h-1.5">
        <div className="h-1.5 rounded-full bg-gray-300 w-1/3 animate-pulse" />
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" role="status" aria-label="Cargando estadísticas">
        {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  return (
    <div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      role="region"
      aria-label="Tarjetas de estadísticas"
    >
      {cards.map((card) => {
        const colors = getColorClasses(card.color);
        const IconCmp = card.icon;

        // Barra de “progreso” visual: mapea el valor a 10–100%
        const pct = (() => {
          const v = Math.max(0, Number(card.valueRaw) || 0);
          // Escala simple: cap a 100 y mínimo 10 para que siempre se vea algo
          const scaled = Math.min(100, v > 0 ? Math.max(10, Math.round((v % 100))) : 10);
          return `${scaled}%`;
        })();

        return (
          <div
            key={card.key}
            className={`${colors.bg} ${colors.border} border rounded-lg p-6 transition-all duration-200 hover:shadow-md`}
            role="group"
            aria-label={card.title}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg bg-white ${colors.border} border`}>
                  <IconCmp className={`h-5 w-5 ${colors.icon}`} aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-600">{card.title}</h3>
                  <p className="text-2xl font-bold text-gray-900 mt-1" aria-live="polite">
                    {card.value}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-1" aria-label="Tendencia">
                {card.trend}
              </div>
            </div>

            <div className="mt-4">
              <p className="text-xs text-gray-500">{card.description}</p>
            </div>

            <div className="mt-3" aria-hidden="true">
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all duration-500 ${colors.bar}`}
                  style={{ width: pct }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
