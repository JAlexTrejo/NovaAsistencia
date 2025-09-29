// src/modules/attendance-history-and-analytics-dashboard/components/AttendanceChart.jsx
import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import Button from '../../../components/ui/Button';

const AttendanceChart = ({ data = {}, chartType, onChartTypeChange, loading = false }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('week');

  // Chart options
  const chartTypes = [
    { key: 'bar', label: 'Barras', icon: 'BarChart3' },
    { key: 'line', label: 'Líneas', icon: 'TrendingUp' },
    { key: 'pie', label: 'Circular', icon: 'PieChart' }
  ];
  const periods = [
    { key: 'week', label: 'Semana' },
    { key: 'month', label: 'Mes' },
    { key: 'quarter', label: 'Trimestre' }
  ];

  // Extract datasets depending on period
  const weeklyData = data?.weekly || [];
  const monthlyTrendData = data?.monthly || [];
  const statusDistribution = data?.distribution || [];

  // Insights calculation (example: adjust based on your backend shape)
  const insights = useMemo(() => {
    if (!weeklyData?.length) return { attendance: 0, late: 0, overtime: 0 };
    const total = weeklyData.length;
    const avgAttendance = weeklyData.reduce((s, d) => s + (d.attendance || 0), 0) / total;
    const avgLate = weeklyData.reduce((s, d) => s + (d.late || 0), 0) / total;
    const avgOvertime = weeklyData.reduce((s, d) => s + (d.overtime || 0), 0) / total;
    return {
      attendance: avgAttendance.toFixed(1),
      late: avgLate.toFixed(1),
      overtime: avgOvertime.toFixed(1)
    };
  }, [weeklyData]);

  const renderBarChart = () => (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={weeklyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
        <XAxis dataKey="name" stroke="#64748B" fontSize={12} />
        <YAxis stroke="#64748B" fontSize={12} />
        <Tooltip
          contentStyle={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
        />
        <Bar dataKey="attendance" fill="#2563EB" name="Asistencia %" radius={[4, 4, 0, 0]} />
        <Bar dataKey="late" fill="#D97706" name="Tardanzas %" radius={[4, 4, 0, 0]} />
        <Bar dataKey="overtime" fill="#059669" name="Horas Extra" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );

  const renderLineChart = () => (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={monthlyTrendData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
        <XAxis dataKey="month" stroke="#64748B" fontSize={12} />
        <YAxis stroke="#64748B" fontSize={12} />
        <Tooltip
          contentStyle={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
        />
        <Line
          type="monotone"
          dataKey="attendance"
          stroke="#2563EB"
          strokeWidth={3}
          dot={{ fill: '#2563EB', strokeWidth: 2, r: 6 }}
          name="Asistencia %"
        />
        <Line
          type="monotone"
          dataKey="productivity"
          stroke="#059669"
          strokeWidth={3}
          dot={{ fill: '#059669', strokeWidth: 2, r: 6 }}
          name="Productividad %"
        />
      </LineChart>
    </ResponsiveContainer>
  );

  const renderPieChart = () => (
    <ResponsiveContainer width="100%" height={400}>
      <PieChart>
        <Pie
          data={statusDistribution}
          cx="50%"
          cy="50%"
          outerRadius={120}
          innerRadius={60}
          paddingAngle={2}
          dataKey="value"
        >
          {statusDistribution?.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry?.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
          formatter={(value) => [`${value}%`, 'Porcentaje']}
        />
      </PieChart>
    </ResponsiveContainer>
  );

  const renderChart = () => {
    if (loading) {
      return <div className="h-[400px] flex items-center justify-center text-muted-foreground">Cargando datos...</div>;
    }
    switch (chartType) {
      case 'line': return renderLineChart();
      case 'pie': return renderPieChart();
      default: return renderBarChart();
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      {/* Chart Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Análisis de Asistencia</h3>
          <p className="text-sm text-muted-foreground">Tendencias y patrones de asistencia</p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Period Selector */}
          <div className="flex items-center space-x-2">
            {periods?.map((period) => (
              <Button
                key={period?.key}
                variant={selectedPeriod === period?.key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPeriod(period?.key)}
              >
                {period?.label}
              </Button>
            ))}
          </div>
          
          {/* Chart Type Selector */}
          <div className="flex items-center space-x-2">
            {chartTypes?.map((type) => (
              <Button
                key={type?.key}
                variant={chartType === type?.key ? 'default' : 'outline'}
                size="sm"
                onClick={() => onChartTypeChange(type?.key)}
                iconName={type?.icon}
                iconPosition="left"
              >
                {type?.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="w-full">{renderChart()}</div>

      {/* Legend for Pie */}
      {chartType === 'pie' && statusDistribution?.length > 0 && (
        <div className="flex items-center justify-center space-x-6 mt-4">
          {statusDistribution?.map((item, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item?.color }} />
              <span className="text-sm text-foreground">{item?.name}</span>
              <span className="text-sm font-medium text-foreground">{item?.value}%</span>
            </div>
          ))}
        </div>
      )}

      {/* Insights */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-border">
          <div className="text-center">
            <div className="text-2xl font-bold text-success">{insights.attendance}%</div>
            <div className="text-sm text-muted-foreground">Asistencia Promedio</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-warning">{insights.late}%</div>
            <div className="text-sm text-muted-foreground">Tardanzas</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{insights.overtime}h</div>
            <div className="text-sm text-muted-foreground">Horas Extra Promedio</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceChart;
