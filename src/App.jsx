import React from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { BrandingProvider } from './components/BrandingProvider';
import Routes from './Routes';
import ErrorBoundary from './components/ErrorBoundary';

const App = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrandingProvider>
          <Routes />
        </BrandingProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;