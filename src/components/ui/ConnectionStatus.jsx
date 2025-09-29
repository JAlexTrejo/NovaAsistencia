import React from 'react';

export const ConnectionStatus = ({ status, message, showDetails = false, onRetry, showRetryButton = false }) => {
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
      case 'failed': case'error': case'disconnected':
        return {
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          borderColor: 'border-red-200',
          icon: '✗',
          label: 'Connection Failed'
        };
      case 'checking': case'loading': case'connecting':
        return {
          color: 'text-blue-600',
          bgColor: 'bg-blue-100',
          borderColor: 'border-blue-200',
          icon: '⟳',
          label: 'Connecting...'
        };
      case 'warning': case'degraded':
        return {
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100',
          borderColor: 'border-yellow-200',
          icon: '⚠',
          label: 'Connection Issues'
        };
      case 'circuit_open':
        return {
          color: 'text-orange-600',
          bgColor: 'bg-orange-100',
          borderColor: 'border-orange-200',
          icon: '⊘',
          label: 'Service Unavailable'
        };
      default:
        return {
          color: 'text-gray-600',
          bgColor: 'bg-gray-100',
          borderColor: 'border-gray-200',
          icon: '?',
          label: 'Unknown Status'
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
      {showRetryButton && onRetry && status === 'failed' && (
        <button
          onClick={onRetry}
          className={`ml-2 text-xs px-2 py-1 rounded ${config?.color} hover:opacity-80 transition-opacity border border-current`}
        >
          Retry
        </button>
      )}
    </div>
  );
};

// Enhanced connection status component with better error messaging
export const NetworkStatus = ({ 
  connectionStatus, 
  errorMessage, 
  isLoading = false, 
  onRetry,
  circuitBreakerState = null,
  className = ""
}) => {
  const getDisplayStatus = () => {
    if (isLoading) return 'checking';
    if (circuitBreakerState === 'OPEN') return 'circuit_open';
    if (connectionStatus === false || errorMessage?.includes('Failed to fetch')) return 'failed';
    if (connectionStatus === true) return 'success';
    return 'warning';
  };

  const getDisplayMessage = () => {
    if (circuitBreakerState === 'OPEN') {
      return 'Service temporarily unavailable. Please wait 30 seconds.';
    }
    if (errorMessage?.includes('Failed to fetch') || errorMessage?.includes('NetworkError')) {
      return 'Cannot connect to database. Check your internet connection.';
    }
    if (errorMessage?.includes('Supabase project may be paused')) {
      return 'Database may be paused. Check Supabase dashboard.';
    }
    if (errorMessage?.includes('Invalid API key')) {
      return 'Configuration error. Contact system administrator.';
    }
    return errorMessage || 'Connection status unknown';
  };

  return (
    <div className={className}>
      <ConnectionStatus 
        status={getDisplayStatus()}
        message={getDisplayMessage()}
        showDetails={true}
        onRetry={onRetry}
        showRetryButton={!!onRetry && getDisplayStatus() === 'failed'}
      />
    </div>
  );
};

export default ConnectionStatus;