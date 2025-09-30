import React from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './contexts/AuthContext';
import { BrandingProvider } from './components/BrandingProvider';
import Routes from './Routes';
import ErrorBoundary from './components/ErrorBoundary';
import { useStartupHealthCheck } from './hooks/useStartupHealthCheck';

const App = () => {
  // Run startup health check (non-blocking, executes once per session)
  useStartupHealthCheck();

  return (
    <HelmetProvider>
      <ErrorBoundary>
        <AuthProvider>
          <BrandingProvider>
            <Routes />
          </BrandingProvider>
        </AuthProvider>
      </ErrorBoundary>
    </HelmetProvider>
  );
};

export default App;