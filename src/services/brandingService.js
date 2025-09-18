// src/services/brandingService.js
import { supabase } from '@/lib/supabase';
import { adaptSupabaseError } from '@/utils/errors';

const ok   = (data) => ({ ok: true, data });
const fail = (e)    => ({ ok: false, ...adaptSupabaseError(e) });

const BRAND_COLS = [
  'id',
  'brand_name',
  'logo_url',
  'favicon_url',
  'primary_color',
  'secondary_color',
  'updated_by',
  'updated_at',
].join(',');

/** Lee la configuración de marca global (1 fila máx) */
export async function getBranding() {
  try {
    const { data, error } = await supabase
      .from('branding_settings')
      .select(BRAND_COLS)
      .limit(1)
      .maybeSingle();
    if (error) return fail(error);
    return ok(data); // puede ser null si aún no existe
  } catch (e) {
    return fail(e);
  }
}

/** Crea/actualiza la marca (RLS: solo superadmin puede escribir) */
export async function upsertBranding(payload) {
  try {
    const patch = {
      id: payload?.id, // opcional, si ya existe
      brand_name: payload?.brand_name,
      logo_url: payload?.logo_url ?? null,
      favicon_url: payload?.favicon_url ?? null,
      primary_color: payload?.primary_color ?? null,
      secondary_color: payload?.secondary_color ?? null,
    };

    const { data, error } = await supabase
      .from('branding_settings')
      .upsert(patch, { onConflict: 'id' })
      .select(BRAND_COLS)
      .maybeSingle();

    if (error) return fail(error);
    return ok(data);
  } catch (e) {
    return fail(e);
  }
}

/** Subida de logo a Storage (bucket público 'branding') */
export async function uploadLogo(file, keyPrefix = 'logos') {
  try {
    if (!file) return { ok: false, error: 'Archivo inválido', code: 'VALIDATION' };
    const fileExt = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const path = `${keyPrefix}/${fileName}`;

    const { error: upErr } = await supabase.storage.from('branding').upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });
    if (upErr) return fail(upErr);

    const { data: urlData } = supabase.storage.from('branding').getPublicUrl(path);
    return ok({ path, publicUrl: urlData.publicUrl });
  } catch (e) {
    return fail(e);
  }
}

/** Subida de favicon a Storage (bucket público 'branding') */
export async function uploadFavicon(file, keyPrefix = 'favicons') {
  try {
    if (!file) return { ok: false, error: 'Archivo inválido', code: 'VALIDATION' };
    const fileExt = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const path = `${keyPrefix}/${fileName}`;

    const { error: upErr } = await supabase.storage.from('branding').upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });
    if (upErr) return fail(upErr);

    const { data: urlData } = supabase.storage.from('branding').getPublicUrl(path);
    return ok({ path, publicUrl: urlData.publicUrl });
  } catch (e) {
    return fail(e);
  }
}

export default {
  getBranding,
  upsertBranding,
  uploadLogo,
  uploadFavicon,
};
