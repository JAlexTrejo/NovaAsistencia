// src/data/siteDataService.js
import { supabase } from '../lib/supabase';

const ok  = (data) => ({ success: true,  ...data });
const fail = (e)   => ({ success: false, error: e?.message || String(e) || 'Error desconocido' });

function sanitizeSearch(s = '') {
  const raw = String(s).trim();
  if (!raw) return '';
  return raw.replaceAll('%', '\\%').replaceAll(',', ' ');
}

export const siteDataService = {
  /**
   * Lista de obras con filtros, paginación y orden.
   * @param {Object} params
   *  - activa?: boolean (default true)
   *  - search?: string (filtra por nombre/dirección)
   *  - limit?: number (default 100)
   *  - offset?: number (default 0)
   *  - orderBy?: string (default 'created_at')
   *  - order?: 'asc' | 'desc' (default 'desc')
   */
  async getSites(params = {}) {
    try {
      const {
        activa = true,
        search,
        limit = 100,
        offset = 0,
        orderBy = 'created_at',
        order = 'desc',
      } = params;

      let query = supabase
        .from('obras')
        .select(`
          id,
          nombre,
          direccion,
          descripcion,
          activa,
          created_at,
          updated_at
        `);

      if (typeof activa === 'boolean') query = query.eq('activa', activa);

      if (search) {
        const needle = sanitizeSearch(search);
        query = query.or(`nombre.ilike.%${needle}%,direccion.ilike.%${needle}%`);
      }

      query = query
        .order(orderBy, { ascending: String(order).toLowerCase() === 'asc' })
        .range(offset, Math.max(offset + limit - 1, offset));

      const { data, error } = await query;
      if (error) throw error;

      return ok({
        data: data || [],
        page: { offset, limit, returned: data?.length || 0 },
      });
    } catch (error) {
      return fail(error || 'Error al cargar sitios');
    }
  },

  /** Obtener una obra por ID */
  async getSiteById(id) {
    try {
      const { data, error } = await supabase
        .from('obras')
        .select(`
          id,
          nombre,
          direccion,
          descripcion,
          activa,
          created_at,
          updated_at
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return ok({ data });
    } catch (error) {
      return fail(error || 'Error al cargar el sitio');
    }
  },

  /** Crear obra */
  async createSite(siteData) {
    try {
      const payload = {
        nombre: siteData?.nombre,
        direccion: siteData?.direccion,
        descripcion: siteData?.descripcion || null,
        activa: true,
      };

      const { data, error } = await supabase
        .from('obras')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;
      return ok({ data });
    } catch (error) {
      return fail(error || 'Error al crear sitio');
    }
  },

  /** Actualizar obra */
  async updateSite(id, updateData) {
    try {
      const { data, error } = await supabase
        .from('obras')
        .update({ ...updateData, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return ok({ data });
    } catch (error) {
      return fail(error || 'Error al actualizar sitio');
    }
  },

  /** Desactivar (soft delete) */
  async deactivateSite(id) {
    try {
      const { data, error } = await supabase
        .from('obras')
        .update({ activa: false, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return ok({ data });
    } catch (error) {
      return fail(error || 'Error al desactivar sitio');
    }
  },
};
