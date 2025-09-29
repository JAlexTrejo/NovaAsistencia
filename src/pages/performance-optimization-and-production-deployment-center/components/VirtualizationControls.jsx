import React, { useState, useCallback, useMemo } from 'react';
import { Monitor, Activity, Settings, Play, Zap, BarChart3, AlertTriangle, CheckCircle, List, Clock, TrendingUp } from 'lucide-react';

const VirtualizationControls = ({ performanceData, onRefresh }) => {
  const [virtualizationSettings, setVirtualizationSettings] = useState({
    enabled: true,
    itemHeight: 50,
    overscan: 5,
    threshold: 200,
    strategy: 'fixed'
  });

  const [testData] = useState({
    totalItems: 10000,
    visibleItems: 20,
    renderTime: '2.3ms',
    memoryUsage: '45MB',
    scrollPerformance: 98
  });

  const virtualizationStrategies = useMemo(() => [
    {
      id: 'fixed',
      name: 'Fixed Height',
      description: 'All items have the same height - fastest performance',
      performance: 'Excellent',
      useCase: 'Simple lists with uniform items'
    },
    {
      id: 'variable',
      name: 'Variable Height',
      description: 'Items can have different heights - measured dynamically',
      performance: 'Good',
      useCase: 'Complex cards or variable content'
    },
    {
      id: 'dynamic',
      name: 'Dynamic Height',
      description: 'Heights calculated on-the-fly - most flexible',
      performance: 'Fair',
      useCase: 'Extremely variable content'
    }
  ], []);

  const performanceMetrics = useMemo(() => [
    {
      name: 'Render Time',
      value: testData?.renderTime,
      status: 'excellent',
      target: '< 5ms',
      description: 'Time to render visible items'
    },
    {
      name: 'Memory Usage',
      value: testData?.memoryUsage,
      status: 'good',
      target: '< 100MB',
      description: 'DOM nodes and JS heap usage'
    },
    {
      name: 'Scroll FPS',
      value: `${testData?.scrollPerformance}`,
      status: 'excellent',
      target: '> 90',
      description: 'Frames per second during scrolling'
    },
    {
      name: 'Visible Items',
      value: `${testData?.visibleItems}/${testData?.totalItems}`,
      status: 'optimal',
      target: '< 50',
      description: 'Rendered vs total items ratio'
    }
  ], [testData]);

  const handleSettingsChange = useCallback((key, value) => {
    setVirtualizationSettings(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const runPerformanceTest = useCallback(async () => {
    console.log('Running virtualization performance test...');
    // Simulate performance test
    await new Promise(resolve => setTimeout(resolve, 2000));
    onRefresh?.();
  }, [onRefresh]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'excellent':
        return 'text-green-600 bg-green-50';
      case 'good':
        return 'text-blue-600 bg-blue-50';
      case 'optimal':
        return 'text-purple-600 bg-purple-50';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50';
      case 'poor':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'excellent': case'good': case'optimal':
        return <CheckCircle className="h-4 w-4" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />;
      case 'poor':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Virtualization Overview */}
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">List Virtualization Control</h3>
            <p className="text-sm text-gray-600 mt-1">
              Optimize large dataset rendering with virtual scrolling and pagination controls
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              virtualizationSettings?.enabled 
                ? 'text-green-600 bg-green-50' :'text-gray-600 bg-gray-50'
            }`}>
              {virtualizationSettings?.enabled ? 'Enabled' : 'Disabled'}
            </div>
            <button
              onClick={() => handleSettingsChange('enabled', !virtualizationSettings?.enabled)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                virtualizationSettings?.enabled 
                  ? 'bg-red-600 text-white hover:bg-red-700' :'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {virtualizationSettings?.enabled ? 'Disable' : 'Enable'}
            </button>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {performanceMetrics?.map((metric) => (
            <div key={metric?.name} className="bg-white border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium ${getStatusColor(metric?.status)}`}>
                  {getStatusIcon(metric?.status)}
                  <span>{metric?.status}</span>
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {metric?.value}
              </div>
              <div className="text-xs text-gray-600 mb-2">
                Target: {metric?.target}
              </div>
              <div className="text-xs text-gray-500">
                {metric?.description}
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Virtualization Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Configuration</h3>
            <Settings className="h-5 w-5 text-gray-400" />
          </div>
          
          <div className="space-y-6">
            {/* Strategy Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Virtualization Strategy
              </label>
              <div className="space-y-2">
                {virtualizationStrategies?.map((strategy) => (
                  <div key={strategy?.id} className="relative">
                    <label className="flex items-start space-x-3 cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <input
                        type="radio"
                        name="strategy"
                        value={strategy?.id}
                        checked={virtualizationSettings?.strategy === strategy?.id}
                        onChange={(e) => handleSettingsChange('strategy', e?.target?.value)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900">{strategy?.name}</span>
                          <span className={`text-xs px-2 py-1 rounded ${
                            strategy?.performance === 'Excellent' ? 'text-green-600 bg-green-50' :
                            strategy?.performance === 'Good'? 'text-blue-600 bg-blue-50' : 'text-yellow-600 bg-yellow-50'
                          }`}>
                            {strategy?.performance}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{strategy?.description}</p>
                        <p className="text-xs text-gray-500 mt-1">Use for: {strategy?.useCase}</p>
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Item Height */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Item Height (px)
              </label>
              <input
                type="number"
                min="20"
                max="200"
                value={virtualizationSettings?.itemHeight}
                onChange={(e) => handleSettingsChange('itemHeight', parseInt(e?.target?.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Average height for fixed strategy, initial estimate for variable
              </p>
            </div>

            {/* Overscan */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Overscan Items
              </label>
              <input
                type="number"
                min="0"
                max="20"
                value={virtualizationSettings?.overscan}
                onChange={(e) => handleSettingsChange('overscan', parseInt(e?.target?.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Extra items to render outside viewport for smoother scrolling
              </p>
            </div>

            {/* Threshold */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Virtualization Threshold
              </label>
              <input
                type="number"
                min="50"
                max="1000"
                step="50"
                value={virtualizationSettings?.threshold}
                onChange={(e) => handleSettingsChange('threshold', parseInt(e?.target?.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Minimum number of items before virtualization is enabled
              </p>
            </div>
          </div>
        </div>

        {/* Performance Testing */}
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Performance Testing</h3>
            <BarChart3 className="h-5 w-5 text-gray-400" />
          </div>

          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Current Configuration</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Strategy:</span>
                  <span className="font-medium capitalize">{virtualizationSettings?.strategy}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Item Height:</span>
                  <span className="font-medium">{virtualizationSettings?.itemHeight}px</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Overscan:</span>
                  <span className="font-medium">{virtualizationSettings?.overscan} items</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Threshold:</span>
                  <span className="font-medium">{virtualizationSettings?.threshold} items</span>
                </div>
              </div>
            </div>

            <button
              onClick={runPerformanceTest}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
            >
              <Play className="h-4 w-4" />
              <span>Run Performance Test</span>
            </button>

            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Test Scenarios</h4>
              
              {[
                { name: 'Small Dataset', items: '< 100 items', recommendation: 'Virtualization not needed' },
                { name: 'Medium Dataset', items: '100-1000 items', recommendation: 'Fixed height virtualization' },
                { name: 'Large Dataset', items: '1000-10000 items', recommendation: 'Variable height with optimization' },
                { name: 'Huge Dataset', items: '> 10000 items', recommendation: 'Server-side pagination + virtualization' }
              ]?.map((scenario, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    index === 2 ? 'bg-blue-500' : 'bg-gray-400'
                  }`} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">{scenario?.name}</span>
                      <span className="text-xs text-gray-500">{scenario?.items}</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">{scenario?.recommendation}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* Implementation Examples */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Implementation Guidelines</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">When to Use Virtualization</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Lists with 200+ items</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Tables with large datasets</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Chat conversations</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Social media feeds</span>
              </div>
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <span>Avoid for small, static lists</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-3">Best Practices</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <Zap className="h-4 w-4 text-blue-500" />
                <span>Use fixed heights when possible</span>
              </div>
              <div className="flex items-center space-x-2">
                <Monitor className="h-4 w-4 text-blue-500" />
                <span>Implement pagination for huge datasets</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-blue-500" />
                <span>Debounce scroll events</span>
              </div>
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                <span>Monitor performance metrics</span>
              </div>
              <div className="flex items-center space-x-2">
                <Activity className="h-4 w-4 text-blue-500" />
                <span>Use React.memo for list items</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start space-x-3">
            <Activity className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 mb-1">Performance Impact</h4>
              <p className="text-sm text-blue-700">
                Proper virtualization can improve performance by 10-100x for large lists, 
                reducing memory usage from GB to MB and maintaining smooth 60fps scrolling.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VirtualizationControls;