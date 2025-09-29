// src/modules/attendance-history-and-analytics-dashboard/components/KPICard.jsx
import React, { useMemo } from 'react';
import Icon from '../../../components/AppIcon';

const KPICard = ({
  title,
  value,
  unit = '',
  icon = 'Activity',
  color = 'primary',
  description,

  // New/optional props
  previousValue,           // number | undefined  → si viene, calculamos tendencia automáticamente
  trend,                   // 'up' | 'down' | 'flat'  → opcional, prioriza si lo envías
  trendValue,              // string | number → opcional (ej: '+4.2%')
  loading = false,         // muestra skeleton
  compact = false,         // reduce paddings y tamaños
  className = '',
  onClick,                 // opcional, para hacer la tarjeta clicable
  formatValue,             // (v) => string  → formato custom del "value"
}) => {
  // Colores (usa tus tokens)
  const colorClasses = {
    primary: 'bg-primary/10 text-primary border-primary/20',
    success: 'bg-success/10 text-success border-success/20',
    warning: 'bg-warning/10 text-warning border-warning/20',
    error:   'bg-error/10 text-error border-error/20',
    gray:    'bg-muted/20 text-muted-foreground border-border/60',
  };

  const containerClasses = [
    'bg-card border border-border rounded-lg',
    compact ? 'p-4' : 'p-6',
    'hover:shadow-md transition-all duration-200',
    onClick ? 'cursor-pointer' : '',
    className,
  ].join(' ');

  // Helpers
  const isNumber = (n) => typeof n === 'number' && !Number.isNaN(n);
  const defaultFormatValue = (v) => isNumber(v) ? Intl.NumberFormat('es-MX').format(v) : (v ?? '—');

  // Cálculo de tendencia si no se pasó explícita
  const computed = useMemo(() => {
    // Si el padre ya mandó trend / trendValue, los respetamos
    if (trend || trendValue != null) {
      return { trend: trend ?? 'flat', trendLabel: String(trendValue ?? '—') };
    }

    if (!isNumber(value) || !isNumber(previousValue)) {
      return { trend: 'flat', trendLabel: '—' };
    }

    if (previousValue === 0) {
      // Evitar división entre cero; si subió desde 0, solo mostramos ▲
      const t = value > 0 ? 'up' : value < 0 ? 'down' : 'flat';
      return { trend: t, trendLabel: t === 'flat' ? '0%' : '—' };
    }

    const delta = value - previousValue;
    const pct = (delta / Math.abs(previousValue)) * 100;
    const rounded = Math.abs(pct) < 0.01 ? 0 : pct; // evita 0.0001%
    const t = rounded > 0 ? 'up' : rounded < 0 ? 'down' : 'flat';
    const label = `${rounded > 0 ? '+' : ''}${rounded.toFixed(1)}%`;
    return { trend: t, trendLabel: label };
  }, [trend, trendValue, value, previousValue]);

  const getTrendIcon = (t) => {
    if (t === 'up') return 'TrendingUp';
    if (t === 'down') return 'TrendingDown';
    return 'Minus';
  };

  const getTrendColor = (t) => {
    if (t === 'up') return 'text-success';
    if (t === 'down') return 'text-error';
    return 'text-muted-foreground';
  };

  // Loading skeleton
  if (loading) {
    return (
      <div
        className={`${containerClasses} animate-pulse`}
        aria-busy="true"
        aria-live="polite"
        aria-label={title ? `Cargando ${title}` : 'Cargando KPI'}
      >
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-lg ${colorClasses[color] || colorClasses.primary}`}>
            <div className="h-6 w-6 bg-muted rounded" />
          </div>
          <div className="h-4 w-16 bg-muted rounded" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-32 bg-muted rounded" />
          <div className="h-7 w-24 bg-muted rounded" />
          <div className="h-3 w-40 bg-muted rounded" />
        </div>
      </div>
    );
  }

  const formattedValue = (formatValue || defaultFormatValue)(value);
  const sizeValueClass = compact ? 'text-xl' : 'text-2xl';

  return (
    <section
      className={containerClasses}
      role="group"
      aria-label={title || 'Indicador'}
      onClick={onClick}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorClasses[color] || colorClasses.primary}`} aria-hidden="true">
          <Icon name={icon} size={compact ? 20 : 24} />
        </div>

        {computed?.trend && (
          <div
            className={`flex items-center space-x-1 ${getTrendColor(computed.trend)}`}
            aria-label={`Tendencia: ${computed.trend === 'up' ? 'alza' : computed.trend === 'down' ? 'baja' : 'sin cambio'} (${computed.trendLabel})`}
          >
            <Icon name={getTrendIcon(computed.trend)} size={16} />
            <span className="text-sm font-medium">{computed.trendLabel}</span>
          </div>
        )}
      </div>

      <div className="space-y-2">
        {title && (
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        )}

        <div className="flex items-baseline space-x-1">
          <span className={`${sizeValueClass} font-bold text-foreground`}>{formattedValue}</span>
          {unit ? <span className="text-sm text-muted-foreground">{unit}</span> : null}
        </div>

        {description ? (
          <p className="text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
    </section>
  );
};

export default KPICard;
