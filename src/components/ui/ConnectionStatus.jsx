import React from 'react';

export const ConnectionStatus = ({ status, message, showDetails = false }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'success': case'connected':
        return {
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          borderColor: 'border-green-200',
          icon: '✓',
          label: 'Connected'
        };
      case 'failed': case'error':
        return {
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          borderColor: 'border-red-200',
          icon: '✗',
          label: 'Connection Error'
        };
      case 'checking': case'loading':
        return {
          color: 'text-blue-600',
          bgColor: 'bg-blue-100',
          borderColor: 'border-blue-200',
          icon: '⟳',
          label: 'Checking...'
        };
      case 'warning':
        return {
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100',
          borderColor: 'border-yellow-200',
          icon: '⚠',
          label: 'Warning'
        };
      default:
        return {
          color: 'text-gray-600',
          bgColor: 'bg-gray-100',
          borderColor: 'border-gray-200',
          icon: '?',
          label: 'Unknown'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className={`inline-flex items-center space-x-2 px-3 py-2 rounded-lg ${config?.bgColor} ${config?.borderColor} border`}>
      <span className={`${config?.color} font-medium`}>
        {config?.icon}
      </span>
      <span className={`text-sm font-medium ${config?.color}`}>
        {config?.label}
      </span>
      {showDetails && message && (
        <span className={`text-xs ${config?.color} opacity-75`}>
          - {message}
        </span>
      )}
    </div>
  );
};

export default ConnectionStatus;