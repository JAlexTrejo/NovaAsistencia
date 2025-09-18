// src/services/constructionSiteService.js
import { supabase } from '@/lib/supabase';
import { adaptSupabaseError } from '@/utils/errors';

const ok   = (data) => ({ ok: true, data });
const fail = (e)    => ({ ok: false, ...adaptSupabaseError(e) });

const SITE_COLS = [
  'id',
  'name',
  'location',
  'description',
  'latitude',
  'longitude',
  'allowed_radius_meters',
  'gps_enabled',
  'active',
  'created_at',
  'updated_at',
].join(',');

const PAGE_SIZE = 50;

/** Listar todos los sitios (con paginación y búsqueda opcional por nombre) */
export async function getAllSites({ page = 0, search = '' } = {}) {
  try {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase
      .from('construction_sites')
      .select(SITE_COLS, { count: 'exact' })
      .order('name', { ascending: true })
      .range(from, to);

    if (search) query = query.ilike('name', `%${search}%`);

    const { data, error, count } = await query;
    if (error) return fail(error);
    return ok({ rows: data || [], count: count ?? 0, page, pageSize: PAGE_SIZE });
  } catch (e) {
    return fail(e);
  }
}

/** Obtener un sitio por ID */
export async function getSiteById(siteId) {
  try {
    const { data, error } = await supabase
      .from('construction_sites')
      .select(SITE_COLS)
      .eq('id', siteId)
      .maybeSingle();

    if (error) return fail(error);
    return ok(data);
  } catch (e) {
    return fail(e);
  }
}

/** Crear un sitio (incluye configuración GPS) */
export async function createSite(siteData) {
  try {
    const insert = {
      name: siteData?.name,
      location: siteData?.location ?? null,
      description: siteData?.description ?? null,
      latitude: siteData?.latitude == null ? null : Number(siteData.latitude),
      longitude: siteData?.longitude == null ? null : Number(siteData.longitude),
      allowed_radius_meters:
        siteData?.allowed_radius_meters == null ? 15 : Number(siteData.allowed_radius_meters),
      gps_enabled: siteData?.gps_enabled !== false, // por defecto true
      active: siteData?.active ?? true,
    };

    const { data, error } = await supabase
      .from('construction_sites')
      .insert([insert])
      .select(SITE_COLS)
      .maybeSingle();

    if (error) return fail(error);
    return ok(data);
  } catch (e) {
    return fail(e);
  }
}

/** Actualizar un sitio (incluye campos GPS si vienen en updates) */
export async function updateSite(siteId, updates = {}) {
  try {
    const patch = {};
    if ('name' in updates) patch.name = updates.name;
    if ('location' in updates) patch.location = updates.location;
    if ('description' in updates) patch.description = updates.description;
    if ('latitude' in updates) patch.latitude = updates.latitude == null ? null : Number(updates.latitude);
    if ('longitude' in updates) patch.longitude = updates.longitude == null ? null : Number(updates.longitude);
    if ('allowed_radius_meters' in updates) {
      patch.allowed_radius_meters =
        updates.allowed_radius_meters == null ? null : Number(updates.allowed_radius_meters);
    }
    if ('gps_enabled' in updates) patch.gps_enabled = !!updates.gps_enabled;
    if ('active' in updates) patch.active = !!updates.active;
    if (Object.keys(patch).length === 0) return ok(null);

    const { data, error } = await supabase
      .from('construction_sites')
      .update(patch)
      .eq('id', siteId)
      .select(SITE_COLS)
      .maybeSingle();

    if (error) return fail(error);
    return ok(data);
  } catch (e) {
    return fail(e);
  }
}

/** Actualizar solo la configuración GPS */
export async function updateGPSConfiguration(siteId, gpsConfig = {}) {
  try {
    const patch = {
      latitude: gpsConfig?.latitude == null ? null : Number(gpsConfig.latitude),
      longitude: gpsConfig?.longitude == null ? null : Number(gpsConfig.longitude),
      allowed_radius_meters:
        gpsConfig?.allowed_radius_meters == null ? 15 : Number(gpsConfig.allowed_radius_meters),
      gps_enabled: gpsConfig?.gps_enabled !== false,
    };

    const { data, error } = await supabase
      .from('construction_sites')
      .update(patch)
      .eq('id', siteId)
      .select(SITE_COLS)
      .maybeSingle();

    if (error) return fail(error);
    return ok(data);
  } catch (e) {
    return fail(e);
  }
}

/** Validar si una ubicación está dentro del perímetro del sitio (RPC) */
export async function validateLocationForSite(latitude, longitude, siteId) {
  try {
    const { data, error } = await supabase.rpc('validate_location_within_site', {
      employee_lat: latitude,
      employee_lon: longitude,
      site_uuid: siteId,
    });
    if (error) return fail(error);
    return ok(data?.[0] || { dentro_del_rango: false });
  } catch (e) {
    return fail(e);
  }
}

/** Sitios con asignaciones activas (sin '*' y con join explícito) */
export async function getSitesWithAssignments() {
  try {
    const { data, error } = await supabase
      .from('construction_sites')
      .select(`
        ${SITE_COLS},
        employee_assignments!inner (
          id,
          is_active,
          employee_id
        )
      `)
      .eq('employee_assignments.is_active', true)
      .order('name', { ascending: true });

    if (error) return fail(error);

    return ok(data || []);
  } catch (e) {
    return fail(e);
  }
}

/** Solo sitios con GPS habilitado y coordenadas válidas */
export async function getGPSEnabledSites() {
  try {
    const { data, error } = await supabase
      .from('construction_sites')
      .select(SITE_COLS)
      .eq('gps_enabled', true)
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .order('name', { ascending: true });

    if (error) return fail(error);
    return ok(data || []);
  } catch (e) {
    return fail(e);
  }
}

/** Desactivar sitio (usa columna 'active') */
export async function deactivateSite(siteId) {
  try {
    const { data, error } = await supabase
      .from('construction_sites')
      .update({ active: false })
      .eq('id', siteId)
      .select(SITE_COLS)
      .maybeSingle();

    if (error) return fail(error);
    return ok(data);
  } catch (e) {
    return fail(e);
  }
}

export const constructionSiteService = {
  getAllSites,
  getSiteById,
  createSite,
  updateSite,
  updateGPSConfiguration,
  validateLocationForSite,
  getSitesWithAssignments,
  getGPSEnabledSites,
  deactivateSite,
};

export default constructionSiteService;
