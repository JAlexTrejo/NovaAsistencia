// Shim de compatibilidad para filtros (sitios).
// Expone helpers mínimos y reencamina a servicios reales si existen.

import { supabase } from '@/lib/supabase';
import { getAllSites } from '@/services/constructionSiteService';

// Columnas explícitas para sitios (no usar *)
const SITE_COLS = [
  'id',
  'name',
  'location',
  'latitude',
  'longitude',
  'allowed_radius_meters',
  'gps_enabled',
  'is_active',
  'code',
  'progress',
].join(',');

/** Devuelve lista de sitios (para UIs que necesiten datos completos) */
async function getSites(params = {}) {
  try {
    // Si tienes un service con paginado/búsqueda:
    if (typeof getAllSites === 'function') {
      const res = await getAllSites({ page: 0, search: undefined, ...params });
      // normaliza según tu servicio getAllSites
      const rows = res?.rows ?? res?.data ?? res ?? [];
      return rows;
    }

    // Fallback directo a supabase
    const { data, error } = await supabase
      .from('construction_sites')
      .select(SITE_COLS)
      .limit(1000);

    if (error) throw error;
    return data || [];
  } catch (e) {
    console.error('siteDataService.getSites error:', e);
    return [];
  }
}

/** Devuelve opciones id/label para Selects */
async function getSiteOptions(params = {}) {
  try {
    const sites = await getSites(params);
    return (sites || []).map((s) => ({
      value: s?.id,
      label: s?.name || 'Sitio',
      location: s?.location ?? '',
      active: !!s?.is_active,
    }));
  } catch (e) {
    console.error('siteDataService.getSiteOptions error:', e);
    return [];
  }
}

export const siteDataService = {
  getSites,
  getSiteOptions,
};

export default siteDataService;
