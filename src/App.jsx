import React from 'react';

import { BrandingProvider } from './components/BrandingProvider';
import Routes from './Routes';

const App = () => {
  return (
    <BrandingProvider>
      <Routes />
    </BrandingProvider>
  );
};

export default App;