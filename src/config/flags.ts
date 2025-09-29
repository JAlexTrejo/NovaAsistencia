// src/config/flags.ts
/**
 * Feature flags for production hardening and staging environments
 * Used to control feature rollouts and enable/disable functionality
 */

export const FLAGS = {
  // Global branding feature flag
  BRAND_GLOBAL: import.meta.env?.VITE_FLAG_BRAND_GLOBAL === '1',
  
  // New RLS policies flag
  NEW_RLS: import.meta.env?.VITE_FLAG_NEW_RLS === '1',
  
  // Production hardening features
  PRODUCTION_MONITORING: import.meta.env?.VITE_FLAG_PRODUCTION_MONITORING === '1',
  
  // Security enhancements
  ENHANCED_SECURITY: import.meta.env?.VITE_FLAG_ENHANCED_SECURITY === '1',
  
  // Error tracking and reporting
  ERROR_TRACKING: import.meta.env?.VITE_FLAG_ERROR_TRACKING === '1',
  
  // Performance monitoring
  PERFORMANCE_MONITORING: import.meta.env?.VITE_FLAG_PERFORMANCE_MONITORING === '1',
  
  // Mock data detection
  MOCK_DATA_DETECTION: import.meta.env?.VITE_FLAG_MOCK_DATA_DETECTION === '1',
  
  // Development features (should be false in production)
  DEBUG_MODE: import.meta.env?.VITE_FLAG_DEBUG_MODE === '1',
  
  // Service health monitoring
  HEALTH_CHECKS: import.meta.env?.VITE_FLAG_HEALTH_CHECKS === '1'
};

// Flag validation for production safety
export function validateFlags() {
  const warnings = [];
  
  // Check for development flags in production
  if (import.meta.env?.PROD && FLAGS?.DEBUG_MODE) {
    warnings?.push('DEBUG_MODE is enabled in production environment');
  }
  
  // Recommend enabling production flags
  if (import.meta.env?.PROD && !FLAGS?.ERROR_TRACKING) {
    warnings?.push('ERROR_TRACKING should be enabled in production');
  }
  
  if (import.meta.env?.PROD && !FLAGS?.HEALTH_CHECKS) {
    warnings?.push('HEALTH_CHECKS should be enabled in production');
  }
  
  return warnings;
}

// Get current flag status for monitoring
export function getFlagStatus() {
  return {
    environment: import.meta.env?.MODE,
    flags: FLAGS,
    warnings: validateFlags()
  };
}

export default FLAGS;