// src/lib/net-tap.js
// Network instrumentation for tracking Supabase API calls

export function wrapGlobalFetchForMetrics() {
  if (window.__fetchWrapped) return;
  window.__fetchWrapped = true;
  
  const orig = window.fetch;
  window.__netCounters = window.__netCounters || { 
    total: 0, 
    byPath: {},
    byPathDetailed: [] // Track timing and stack traces
  };
  
  window.fetch = async (...args) => {
    const startTime = performance.now();
    try {
      const url = String(args[0]);
      
      if (url.includes('/rest/v1/') || url.includes('/rpc/')) {
        window.__netCounters.total++;
        
        // Extract endpoint name
        const key = url.split('/rest/v1/')[1]?.split('?')[0] || 
                    url.split('/rpc/')[1]?.split('?')[0] || 
                    url;
        
        window.__netCounters.byPath[key] = (window.__netCounters.byPath[key] || 0) + 1;
        
        // Store detailed info for debugging
        const method = args[1]?.method || 'GET';
        const callInfo = {
          endpoint: key,
          method,
          timestamp: new Date().toISOString(),
          url: url.substring(0, 200) // Truncate long URLs
        };
        
        window.__netCounters.byPathDetailed.push(callInfo);
        
        // Optional: Log to console in dev mode
        if (import.meta.env.DEV) {
          console.debug('[NET]', method, key, `(#${window.__netCounters.byPath[key]})`);
        }
      }
      
      const response = await orig(...args);
      
      // Track timing
      const duration = performance.now() - startTime;
      if (url.includes('/rest/v1/') || url.includes('/rpc/')) {
        const lastCall = window.__netCounters.byPathDetailed[window.__netCounters.byPathDetailed.length - 1];
        if (lastCall) {
          lastCall.duration = Math.round(duration);
          lastCall.status = response.status;
        }
      }
      
      return response;
    } catch (e) {
      throw e;
    }
  };
}

// Helper to print network stats
export function printNetworkStats() {
  const counters = window.__netCounters;
  if (!counters) {
    console.log('No network counters available. Was wrapGlobalFetchForMetrics() called?');
    return;
  }
  
  console.log('\n=== NETWORK STATS ===');
  console.log('Total Supabase calls:', counters.total);
  console.log('\nCalls by endpoint:');
  console.table(counters.byPath);
  
  // Group by endpoint for detailed view
  const grouped = {};
  counters.byPathDetailed.forEach(call => {
    if (!grouped[call.endpoint]) {
      grouped[call.endpoint] = [];
    }
    grouped[call.endpoint].push(call);
  });
  
  console.log('\nDetailed breakdown:');
  Object.entries(grouped).forEach(([endpoint, calls]) => {
    console.log(`\n${endpoint} (${calls.length} calls):`);
    calls.forEach((call, idx) => {
      console.log(`  ${idx + 1}. ${call.method} - ${call.duration}ms - ${call.status} - ${call.timestamp}`);
    });
  });
  
  console.log('\n=== END STATS ===\n');
}

// Helper to reset counters
export function resetNetworkCounters() {
  window.__netCounters = { 
    total: 0, 
    byPath: {},
    byPathDetailed: []
  };
  console.log('Network counters reset');
}

// Helper to get current counts
export function getNetworkCounts() {
  return window.__netCounters || { total: 0, byPath: {}, byPathDetailed: [] };
}

// Auto-expose to window for easy console access
if (typeof window !== 'undefined') {
  window.printNetStats = printNetworkStats;
  window.resetNetStats = resetNetworkCounters;
  window.getNetCounts = getNetworkCounts;
}
