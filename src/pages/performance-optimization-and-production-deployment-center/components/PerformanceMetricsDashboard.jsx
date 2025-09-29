import React, { useMemo } from 'react';
import { TrendingUp, Zap, Globe, Activity, AlertTriangle, CheckCircle, Monitor, Cpu } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import Icon from '@/components/AppIcon';


const PerformanceMetricsDashboard = ({ performanceData, loading, onRefresh }) => {
  // Mock historical performance data
  const historicalData = useMemo(() => [
    { time: '00:00', performance: 88, accessibility: 85, seo: 90, bundleSize: 1.2 },
    { time: '04:00', performance: 91, accessibility: 87, seo: 92, bundleSize: 1.15 },
    { time: '08:00', performance: 89, accessibility: 86, seo: 91, bundleSize: 1.18 },
    { time: '12:00', performance: 92, accessibility: 88, seo: 89, bundleSize: 1.12 },
    { time: '16:00', performance: 90, accessibility: 89, seo: 93, bundleSize: 1.14 },
    { time: '20:00', performance: 94, accessibility: 90, seo: 94, bundleSize: 1.10 }
  ], []);

  const coreWebVitals = useMemo(() => [
    { name: 'LCP', value: 1.2, unit: 's', threshold: 2.5, status: 'good' },
    { name: 'FID', value: 45, unit: 'ms', threshold: 100, status: 'good' },
    { name: 'CLS', value: 0.05, unit: '', threshold: 0.1, status: 'good' },
    { name: 'FCP', value: 0.9, unit: 's', threshold: 1.8, status: 'good' },
    { name: 'INP', value: 125, unit: 'ms', threshold: 200, status: 'needs-improvement' },
    { name: 'TTFB', value: 0.3, unit: 's', threshold: 0.8, status: 'good' }
  ], []);

  const bundleAnalysis = useMemo(() => {
    if (!performanceData?.performance?.bundleAnalysis) {
      return [
        { name: 'Main Bundle', size: 845, color: '#3B82F6' },
        { name: 'Vendor Bundle', size: 1200, color: '#EF4444' },
        { name: 'Async Chunks', size: 340, color: '#10B981' },
        { name: 'CSS', size: 120, color: '#F59E0B' }
      ];
    }
    
    const analysis = performanceData?.performance?.bundleAnalysis;
    return [
      { name: 'Main Bundle', size: parseInt(analysis?.mainBundle) || 845, color: '#3B82F6' },
      { name: 'Vendor Bundle', size: parseInt(analysis?.vendorBundle) || 1200, color: '#EF4444' },
      { name: 'Duplicates', size: parseInt(analysis?.duplicates) || 45, color: '#F59E0B' }
    ];
  }, [performanceData?.performance?.bundleAnalysis]);

  const getVitalStatus = (vital) => {
    switch (vital?.status) {
      case 'good':
        return { color: 'text-green-600 bg-green-50', icon: CheckCircle };
      case 'needs-improvement':
        return { color: 'text-yellow-600 bg-yellow-50', icon: AlertTriangle };
      case 'poor':
        return { color: 'text-red-600 bg-red-50', icon: AlertTriangle };
      default:
        return { color: 'text-gray-600 bg-gray-50', icon: Activity };
    }
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-gray-600">Loading Performance Metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Lighthouse Scores */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { 
            name: 'Performance', 
            score: performanceData?.performance?.lighthouse?.performance || 92,
            icon: Zap,
            description: 'Loading speed and runtime performance'
          },
          { 
            name: 'Accessibility', 
            score: performanceData?.performance?.lighthouse?.accessibility || 88,
            icon: Globe,
            description: 'Accessibility standards compliance'
          },
          { 
            name: 'Best Practices', 
            score: performanceData?.performance?.lighthouse?.bestPractices || 95,
            icon: CheckCircle,
            description: 'Security and modern web standards'
          },
          { 
            name: 'SEO', 
            score: performanceData?.performance?.lighthouse?.seo || 87,
            icon: TrendingUp,
            description: 'Search engine optimization'
          }
        ]?.map((metric) => {
          const Icon = metric?.icon;
          return (
            <div key={metric?.name} className="bg-white border rounded-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <Icon className="h-6 w-6 text-blue-600" />
                <span className={`text-2xl font-bold ${getScoreColor(metric?.score)}`}>
                  {metric?.score}
                </span>
              </div>
              <h3 className="font-medium text-gray-900 mb-1">{metric?.name}</h3>
              <p className="text-xs text-gray-600">{metric?.description}</p>
            </div>
          );
        })}
      </div>

      {/* Core Web Vitals */}
      <div className="bg-white border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Core Web Vitals</h3>
          <button
            onClick={onRefresh}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            Refresh Metrics
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {coreWebVitals?.map((vital) => {
            const statusConfig = getVitalStatus(vital);
            const StatusIcon = statusConfig?.icon;
            
            return (
              <div key={vital?.name} className="text-center">
                <div className={`inline-flex items-center px-3 py-2 rounded-full ${statusConfig?.color} mb-2`}>
                  <StatusIcon className="h-4 w-4 mr-1" />
                  <span className="text-sm font-medium">{vital?.name}</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {vital?.value}{vital?.unit}
                </p>
                <p className="text-xs text-gray-600">
                  Threshold: {vital?.threshold}{vital?.unit}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Performance Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Trends (24h)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={historicalData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="performance" 
                stroke="#3B82F6" 
                strokeWidth={2} 
                name="Performance"
              />
              <Line 
                type="monotone" 
                dataKey="accessibility" 
                stroke="#10B981" 
                strokeWidth={2} 
                name="Accessibility"
              />
              <Line 
                type="monotone" 
                dataKey="seo" 
                stroke="#F59E0B" 
                strokeWidth={2} 
                name="SEO"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Bundle Size Analysis</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={bundleAnalysis}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => [`${value}KB`, 'Size']} />
              <Bar dataKey="size" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Total Bundle Size: <span className="font-medium">
                {bundleAnalysis?.reduce((sum, item) => sum + item?.size, 0)}KB
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Resource Optimization */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">JavaScript Optimization</h3>
            <Cpu className="h-5 w-5 text-blue-600" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Code Splitting</span>
              <span className="text-sm font-medium text-green-600">Enabled</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Tree Shaking</span>
              <span className="text-sm font-medium text-green-600">Active</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Minification</span>
              <span className="text-sm font-medium text-green-600">Enabled</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Unused Code</span>
              <span className="text-sm font-medium text-yellow-600">12KB</span>
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Asset Optimization</h3>
            <Monitor className="h-5 w-5 text-blue-600" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Image Compression</span>
              <span className="text-sm font-medium text-green-600">WebP</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Lazy Loading</span>
              <span className="text-sm font-medium text-green-600">Active</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">CDN Cache Hit</span>
              <span className="text-sm font-medium text-green-600">94%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Compression</span>
              <span className="text-sm font-medium text-green-600">Brotli</span>
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Network Performance</h3>
            <Activity className="h-5 w-5 text-blue-600" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">HTTP/2</span>
              <span className="text-sm font-medium text-green-600">Enabled</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Keep-Alive</span>
              <span className="text-sm font-medium text-green-600">Active</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Avg Response</span>
              <span className="text-sm font-medium text-green-600">145ms</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">DNS Lookup</span>
              <span className="text-sm font-medium text-green-600">12ms</span>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Recommendations */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Recommendations</h3>
        <div className="space-y-4">
          {[
            {
              type: 'optimization',
              priority: 'high',
              title: 'Reduce JavaScript Bundle Size',
              description: 'Remove unused dependencies and implement better code splitting',
              impact: '+5 performance score',
              effort: 'Medium'
            },
            {
              type: 'optimization',
              priority: 'medium',
              title: 'Optimize Image Loading',
              description: 'Implement progressive JPEG and next-gen formats',
              impact: '+2 performance score',
              effort: 'Low'
            },
            {
              type: 'accessibility',
              priority: 'medium',
              title: 'Improve Color Contrast',
              description: 'Ensure all text meets WCAG AA standards',
              impact: '+3 accessibility score',
              effort: 'Low'
            },
            {
              type: 'seo',
              priority: 'low',
              title: 'Add Structured Data',
              description: 'Implement JSON-LD for better search engine understanding',
              impact: '+4 SEO score',
              effort: 'Medium'
            }
          ]?.map((rec, index) => (
            <div key={index} className="flex items-start space-x-4 p-4 border border-gray-200 rounded-lg">
              <div className={`w-2 h-2 rounded-full mt-2 ${
                rec?.priority === 'high' ? 'bg-red-500' :
                rec?.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
              }`} />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-medium text-gray-900">{rec?.title}</h4>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                      {rec?.impact}
                    </span>
                    <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      {rec?.effort} effort
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-600">{rec?.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PerformanceMetricsDashboard;