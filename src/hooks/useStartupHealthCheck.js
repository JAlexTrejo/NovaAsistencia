// src/hooks/useStartupHealthCheck.js
import { useEffect, useRef } from 'react';
import { authService } from '@/services/authService';

// Global flag to ensure health check runs only once per session
let healthCheckExecuted = false;
let healthCheckResults = null;

/**
 * Startup health check hook
 * - Runs only ONCE per browser session (not per component mount)
 * - Non-blocking: executes asynchronously without blocking UI
 * - Caches results to avoid repeated API calls
 * - Logs warnings to console for debugging
 */
export function useStartupHealthCheck() {
  const hasRun = useRef(false);

  useEffect(() => {
    // Skip if already executed globally or already executed in this component
    if (healthCheckExecuted || hasRun.current) return;
    
    hasRun.current = true;
    healthCheckExecuted = true;

    // Run async health check without blocking
    (async () => {
      try {
        const results = {
          timestamp: new Date().toISOString(),
          connection: null,
          rpcs: null,
          status: 'checking'
        };

        // Test 1: Connection and DB access
        const connTest = await authService.testConnection();
        results.connection = connTest;

        if (!connTest.ok) {
          console.warn('⚠️ [Startup Health Check] Connection test failed:', connTest.error);
          results.status = 'warning';
        }

        // Test 2: Critical RPCs availability
        const rpcTest = await authService.validateCriticalRPCs();
        results.rpcs = rpcTest;

        if (rpcTest.ok && !rpcTest.data?.allAvailable) {
          console.warn('⚠️ [Startup Health Check] Some RPCs are missing:', rpcTest.data?.rpcs);
          results.status = 'warning';
        }

        // Overall status
        if (results.status !== 'warning') {
          results.status = 'healthy';
          console.log('✅ [Startup Health Check] All systems operational', {
            auth: connTest.data?.auth,
            database: connTest.data?.database,
            rls: connTest.data?.rls_active,
            rpcs: rpcTest.data?.rpcs
          });
        }

        // Cache results
        healthCheckResults = results;

      } catch (error) {
        console.error('❌ [Startup Health Check] Unexpected error:', error);
        healthCheckResults = {
          timestamp: new Date().toISOString(),
          status: 'error',
          error: error?.message || 'Unknown error'
        };
      }
    })();

    // Cleanup function (no-op, but good practice)
    return () => {
      // Don't reset flags - we want this to run only once per session
    };
  }, []); // Empty deps - run once on mount

  return healthCheckResults;
}

// Export utility to get cached results
export function getHealthCheckResults() {
  return healthCheckResults;
}

// Export utility to reset (useful for testing or manual re-checks)
export function resetHealthCheck() {
  healthCheckExecuted = false;
  healthCheckResults = null;
}
