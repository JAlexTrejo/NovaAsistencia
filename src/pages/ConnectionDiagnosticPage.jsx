import React, { useState, useEffect } from 'react';
import { ConnectionStatus } from '../components/ui/ConnectionStatus';
import { RetryButton } from '../components/ui/RetryButton';
import NavigationHeader from '../components/ui/NavigationHeader';
import BrandedHeader from '../components/ui/BrandedHeader';
import { useAuth } from '../contexts/AuthContext';

const ConnectionDiagnosticPage = () => {
  const [connectionStatus, setConnectionStatus] = useState('checking');
  const [diagnosticResults, setDiagnosticResults] = useState({});
  const [retryCount, setRetryCount] = useState(0);
  const { authError, user } = useAuth();

  useEffect(() => {
    performDiagnostics();
  }, [retryCount]);

  const performDiagnostics = async () => {
    setConnectionStatus('checking');
    const results = {};

    try {
      // Test 1: Basic connectivity
      try {
        const response = await fetch('https://httpbin.org/get', { 
          method: 'GET',
          timeout: 10000 
        });
        results.internetConnection = response?.ok ? 'success' : 'failed';
      } catch (error) {
        results.internetConnection = 'failed';
      }

      // Test 2: Supabase URL reachability
      try {
        const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL;
        if (!supabaseUrl) {
          results.supabaseConfig = 'missing_config';
        } else {
          const response = await fetch(`${supabaseUrl}/rest/v1/`, {
            method: 'HEAD',
            timeout: 15000
          });
          results.supabaseReachability = response?.ok ? 'success' : 'failed';
        }
      } catch (error) {
        results.supabaseReachability = 'failed';
      }

      // Test 3: Authentication service
      try {
        const { supabase } = await import('../lib/supabase');
        const { error } = await supabase?.auth?.getSession();
        results.authService = error ? 'failed' : 'success';
      } catch (error) {
        results.authService = 'failed';
      }

      // Test 4: Database connectivity (simple health check)
      try {
        const { supabase } = await import('../lib/supabase');
        const { error } = await supabase?.from('user_profiles')?.select('count')?.limit(1);
        results.databaseConnection = error ? 'failed' : 'success';
      } catch (error) {
        results.databaseConnection = 'failed';
      }

      setDiagnosticResults(results);
      
      // Determine overall status
      const hasFailures = Object.values(results)?.some(status => status === 'failed' || status === 'missing_config');
      setConnectionStatus(hasFailures ? 'failed' : 'success');

    } catch (error) {
      console.error('Diagnostic error:', error);
      setConnectionStatus('failed');
      setDiagnosticResults({ general: 'failed' });
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  const getDiagnosticStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <span className="text-green-600">✓</span>;
      case 'failed':
        return <span className="text-red-600">✗</span>;
      case 'missing_config':
        return <span className="text-yellow-600">⚠</span>;
      default:
        return <span className="text-gray-400">-</span>;
    }
  };

  const getDiagnosticMessage = (test, status) => {
    const messages = {
      internetConnection: {
        success: 'Internet connectivity is working',
        failed: 'No internet connection detected'
      },
      supabaseReachability: {
        success: 'Supabase server is reachable',
        failed: 'Cannot reach Supabase server - project may be paused or deleted'
      },
      authService: {
        success: 'Authentication service is working',
        failed: 'Authentication service is not responding'
      },
      databaseConnection: {
        success: 'Database connection is working',
        failed: 'Cannot connect to database - check RLS policies and table permissions'
      },
      supabaseConfig: {
        missing_config: 'Supabase configuration is missing from environment variables'
      }
    };

    return messages?.[test]?.[status] || 'Status unknown';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NavigationHeader title="Connection Diagnostics" subtitle="System connectivity analysis and troubleshooting" />
      <BrandedHeader />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              Connection Diagnostics
            </h1>
            <ConnectionStatus status={connectionStatus} message={connectionStatus === 'checking' ? 'Running diagnostics...' : connectionStatus === 'success' ? 'All systems operational' : 'Connection issues detected'} />
          </div>

          {/* User Context */}
          {user && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="text-sm font-medium text-blue-800 mb-2">Current User</h3>
              <p className="text-blue-700">
                {user?.email} (ID: {user?.id})
              </p>
            </div>
          )}

          {/* Auth Error Display */}
          {authError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="text-sm font-medium text-red-800 mb-2">Authentication Error</h3>
              <p className="text-red-700">{authError}</p>
            </div>
          )}

          {/* Diagnostic Results */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">Diagnostic Results</h2>
            
            {Object.entries(diagnosticResults)?.length === 0 && connectionStatus === 'checking' ? (
              <div className="flex items-center space-x-3 py-4">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <span className="text-gray-600">Running diagnostics...</span>
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(diagnosticResults)?.map(([test, status]) => (
                  <div key={test} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getDiagnosticStatusIcon(status)}
                      <span className="font-medium text-gray-800">
                        {test?.replace(/([A-Z])/g, ' $1')?.replace(/^./, str => str?.toUpperCase())}
                      </span>
                    </div>
                    <span className={`text-sm ${
                      status === 'success' ? 'text-green-600' : 
                      status === 'failed' ? 'text-red-600' : 'text-yellow-600'
                    }`}>
                      {getDiagnosticMessage(test, status)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Troubleshooting Recommendations */}
          {connectionStatus === 'failed' && (
            <div className="mt-8 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="text-lg font-semibold text-yellow-800 mb-4">Troubleshooting Recommendations</h3>
              <ul className="space-y-2 text-yellow-700">
                {diagnosticResults?.internetConnection === 'failed' && (
                  <li>• Check your internet connection and try again</li>
                )}
                {diagnosticResults?.supabaseReachability === 'failed' && (
                  <li>• Your Supabase project may be paused - check your Supabase dashboard</li>
                )}
                {diagnosticResults?.authService === 'failed' && (
                  <li>• Verify your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables</li>
                )}
                {diagnosticResults?.databaseConnection === 'failed' && (
                  <li>• Check RLS policies and table permissions in your Supabase dashboard</li>
                )}
                {diagnosticResults?.supabaseConfig === 'missing_config' && (
                  <li>• Add missing Supabase configuration to your .env file</li>
                )}
                <li>• Try refreshing the page or clearing your browser cache</li>
                <li>• Contact your system administrator if problems persist</li>
              </ul>
            </div>
          )}

          {/* Environment Info */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Environment Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Supabase URL:</span>
                <span className="ml-2 text-gray-600">
                  {import.meta.env?.VITE_SUPABASE_URL ? '✓ Configured' : '✗ Missing'}
                </span>
              </div>
              <div>
                <span className="font-medium">Supabase Key:</span>
                <span className="ml-2 text-gray-600">
                  {import.meta.env?.VITE_SUPABASE_ANON_KEY ? '✓ Configured' : '✗ Missing'}
                </span>
              </div>
              <div>
                <span className="font-medium">Retry Attempts:</span>
                <span className="ml-2 text-gray-600">{retryCount}</span>
              </div>
              <div>
                <span className="font-medium">Browser:</span>
                <span className="ml-2 text-gray-600">{navigator?.userAgent?.split(' ')?.[0] || 'Unknown'}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex space-x-4">
            <RetryButton 
              onClick={handleRetry} 
              disabled={connectionStatus === 'checking'}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            />
            <button
              onClick={() => window.location?.reload()}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Refresh Page
            </button>
            {user && (
              <button
                onClick={() => window.location.href = '/admin/system'}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Back to Dashboard
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConnectionDiagnosticPage;