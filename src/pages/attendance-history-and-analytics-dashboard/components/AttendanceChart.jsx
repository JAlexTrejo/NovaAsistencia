import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

import Button from '../../../components/ui/Button';

const AttendanceChart = ({ data, chartType, onChartTypeChange }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('week');

  const weeklyData = [
    { name: 'Lun', attendance: 95, late: 5, overtime: 12 },
    { name: 'Mar', attendance: 92, late: 8, overtime: 15 },
    { name: 'Mié', attendance: 98, late: 2, overtime: 8 },
    { name: 'Jue', attendance: 89, late: 11, overtime: 18 },
    { name: 'Vie', attendance: 94, late: 6, overtime: 10 },
    { name: 'Sáb', attendance: 87, late: 13, overtime: 22 }
  ];

  const monthlyTrendData = [
    { month: 'Ene', attendance: 92, productivity: 88 },
    { month: 'Feb', attendance: 94, productivity: 91 },
    { month: 'Mar', attendance: 89, productivity: 85 },
    { month: 'Abr', attendance: 96, productivity: 93 },
    { month: 'May', attendance: 91, productivity: 89 },
    { month: 'Jun', attendance: 93, productivity: 90 }
  ];

  const statusDistribution = [
    { name: 'Completo', value: 78, color: '#059669' },
    { name: 'Tardío', value: 12, color: '#D97706' },
    { name: 'Incompleto', value: 7, color: '#DC2626' },
    { name: 'Horas Extra', value: 3, color: '#2563EB' }
  ];

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

  const renderBarChart = () => (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={weeklyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
        <XAxis 
          dataKey="name" 
          stroke="#64748B"
          fontSize={12}
        />
        <YAxis 
          stroke="#64748B"
          fontSize={12}
        />
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
        <XAxis 
          dataKey="month" 
          stroke="#64748B"
          fontSize={12}
        />
        <YAxis 
          stroke="#64748B"
          fontSize={12}
        />
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
    switch (chartType) {
      case 'line':
        return renderLineChart();
      case 'pie':
        return renderPieChart();
      default:
        return renderBarChart();
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
      {/* Chart Container */}
      <div className="w-full">
        {renderChart()}
      </div>
      {/* Chart Legend for Pie Chart */}
      {chartType === 'pie' && (
        <div className="flex items-center justify-center space-x-6 mt-4">
          {statusDistribution?.map((item, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item?.color }}
              />
              <span className="text-sm text-foreground">{item?.name}</span>
              <span className="text-sm font-medium text-foreground">{item?.value}%</span>
            </div>
          ))}
        </div>
      )}
      {/* Chart Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-border">
        <div className="text-center">
          <div className="text-2xl font-bold text-success">94.2%</div>
          <div className="text-sm text-muted-foreground">Asistencia Promedio</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-warning">6.8%</div>
          <div className="text-sm text-muted-foreground">Tardanzas</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-primary">12.5h</div>
          <div className="text-sm text-muted-foreground">Horas Extra Promedio</div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceChart;