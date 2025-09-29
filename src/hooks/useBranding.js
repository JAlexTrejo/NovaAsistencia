import { useEffect, useState, useCallback } from 'react';
import { getBranding } from '@/services/brandingService';
import { applyBrandingTheme } from '@/utils/applyBrandingTheme';

export function useBranding(applyTheme = true) {
  const [branding, setBranding] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    const res = await getBranding();
    if (!res?.ok) { setError(res?.error); setLoading(false); return; }
    setBranding(res?.data);
    if (applyTheme) applyBrandingTheme(res?.data);
    setLoading(false);
  }, [applyTheme]);

  useEffect(() => { load(); }, [load]);

  return { branding, loading, error, reloadBranding: load };
}