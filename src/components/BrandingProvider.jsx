import React, { createContext, useContext, useState, useEffect } from 'react';
import brandingService from '../services/brandingService';

const BrandingContext = createContext({});

export const useBranding = () => {
  const context = useContext(BrandingContext);
  if (!context) {
    throw new Error('useBranding must be used within a BrandingProvider');
  }
  return context;
};

// Cache flag to prevent repeated API calls
let brandingLoaded = false;
let cachedBranding = null;

export const BrandingProvider = ({ children }) => {
  const [branding, setBranding] = useState({
    nombre_empresa: 'AsistenciaPro',
    logo_url: null,
    color_primario: '#3B82F6',
    color_secundario: '#10B981',
    moneda: 'MXN',
    simbolo_moneda: '$',
    mensaje_bienvenida: 'Sistema de gestión de asistencia y recursos humanos'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only load once per session
    if (!brandingLoaded) {
      loadBrandingSettings();
    } else if (cachedBranding) {
      setBranding(cachedBranding);
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, []);

  const loadBrandingSettings = async () => {
    try {
      setLoading(true);
      const settings = await brandingService?.getPublicBrandingSettings();
      if (settings) {
        setBranding(prevBranding => ({
          ...prevBranding,
          ...settings
        }));
        cachedBranding = { ...settings };
        brandingLoaded = true;
        
        // Apply branding to the UI
        brandingService?.applyBrandingSettings(settings);
      } else {
        // No settings found, mark as loaded to prevent retries
        brandingLoaded = true;
      }
    } catch (error) {
      console.warn('Could not load branding settings:', error?.message);
      // Mark as loaded even on error to prevent repeated failed attempts
      brandingLoaded = true;
    } finally {
      setLoading(false);
    }
  };

  const updateBranding = (newBranding) => {
    setBranding(prevBranding => ({
      ...prevBranding,
      ...newBranding
    }));
    
    // Apply new branding settings
    brandingService?.applyBrandingSettings(newBranding);
  };

  const formatCurrency = (amount) => {
    return brandingService?.formatCurrency(amount, {
      code: branding?.moneda,
      symbol: branding?.simbolo_moneda
    });
  };

  // Add missing footer text functions
  const getFooterText = () => {
    return branding?.mensaje_bienvenida || 'Sistema de gestión de asistencia y recursos humanos';
  };

  const getCopyrightText = () => {
    const currentYear = new Date()?.getFullYear();
    const companyName = branding?.nombre_empresa || 'AsistenciaPro';
    return `© ${currentYear} ${companyName}. Todos los derechos reservados.`;
  };

  const value = {
    branding,
    brandingSettings: branding, // Add alias for backward compatibility
    loading,
    updateBranding,
    formatCurrency,
    refreshBranding: loadBrandingSettings,
    getFooterText,
    getCopyrightText
  };

  return (
    <BrandingContext.Provider value={value}>
      {children}
    </BrandingContext.Provider>
  );
};

export default BrandingProvider;