import React, { useState } from 'react';

export const RetryButton = ({ 
  onRetry, 
  disabled = false, 
  loading = false,
  variant = 'primary',
  size = 'sm',
  children = 'Retry Connection',
  className = ''
}) => {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    if (disabled || loading || isRetrying) return;
    
    setIsRetrying(true);
    try {
      await onRetry?.();
    } catch (error) {
      console.error('Retry failed:', error);
    } finally {
      // Add minimum delay to show loading state
      setTimeout(() => setIsRetrying(false), 1000);
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-blue-600 hover:bg-blue-700 text-white border-transparent';
      case 'secondary':
        return 'bg-gray-200 hover:bg-gray-300 text-gray-800 border-transparent';
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 text-white border-transparent';
      case 'outline':
        return 'bg-transparent hover:bg-gray-50 text-gray-700 border-gray-300';
      default:
        return 'bg-blue-600 hover:bg-blue-700 text-white border-transparent';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'xs':
        return 'px-2 py-1 text-xs';
      case 'sm':
        return 'px-3 py-1.5 text-sm';
      case 'md':
        return 'px-4 py-2 text-sm';
      case 'lg':
        return 'px-6 py-3 text-base';
      default:
        return 'px-3 py-1.5 text-sm';
    }
  };

  const isLoading = loading || isRetrying;

  return (
    <button
      onClick={handleRetry}
      disabled={disabled || isLoading}
      className={`
        inline-flex items-center justify-center
        font-medium rounded-md border
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
        ${getVariantClasses()}
        ${getSizeClasses()}
        ${className}
      `}
    >
      {isLoading && (
        <svg 
          className="animate-spin -ml-1 mr-2 h-4 w-4" 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24"
        >
          <circle 
            className="opacity-25" 
            cx="12" 
            cy="12" 
            r="10" 
            stroke="currentColor" 
            strokeWidth="4"
          ></circle>
          <path 
            className="opacity-75" 
            fill="currentColor" 
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      )}
      {children}
    </button>
  );
};

export default RetryButton;