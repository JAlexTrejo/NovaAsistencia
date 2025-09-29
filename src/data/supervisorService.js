// src/data/supervisorDataService.js
import { supabase } from '../lib/supabase';

const ok   = (data) => ({ success: true,  ...data });
const fail = (e)    => ({ success: false, error: e?.message || String(e) || 'Error desconocido' });

function sanitizeSearch(s = '') {
  const raw = String(s).trim();
  if (!raw) return '';
  return raw.replaceAll('%', '\\%').replaceAll(',', ' ');
}

export const supervisorDataService = {
  /**
   * Lista de supervisores con filtros, paginación y orden.
   * @param {Object} params
   *  - roles?: string[] (default ['supervisor','admin','superadmin'])
   *  - is_active?: boolean (default true)
   *  - obra_id?: string
   *  - search?: string (nombre/correo/telefono)
   *  - limit?: number (default 100)
   *  - offset?: number (default 0)
   *  - orderBy?: string (default 'created_at')
   *  - order?: 'asc'|'desc' (default 'desc')
   */
  async getSupervisors(params = {}) {
    try {
      const {
        roles = ['supervisor', 'admin', 'superadmin'],
        is_active = true,
        obra_id,
        search,
        limit = 100,
        offset = 0,
        orderBy = 'created_at',
        order = 'desc',
      } = params;

      let query = supabase
        .from('usuarios')
        .select(`
          id,
          nombre,
          correo,
          telefono,
          obra_id,
          is_active,
          obras:obra_id (id, nombre, direccion)
        `)
        .in('rol', roles);

      if (typeof is_active === 'boolean') query = query.eq('is_active', is_active);
      if (obra_id) query = query.eq('obra_id', obra_id);

      if (search) {
        const needle = sanitizeSearch(search);
        query = query.or(`nombre.ilike.%${needle}%,correo.ilike.%${needle}%,telefono.ilike.%${needle}%`);
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
      return fail(error || 'Error al cargar supervisores');
    }
  },

  /**
   * Empleados a cargo de un supervisor.
   * @param {string} supervisorId
   * @param {Object} params
   *  - is_active?: boolean (default true)
   *  - obra_id?: string
   *  - search?: string (nombre/correo)
   *  - limit?: number (default 200)
   *  - offset?: number (default 0)
   *  - orderBy?: string (default 'nombre')
   *  - order?: 'asc'|'desc' (default 'asc')
   */
  async getEmployeesBySupervisor(supervisorId, params = {}) {
    try {
      const {
        is_active = true,
        obra_id,
        search,
        limit = 200,
        offset = 0,
        orderBy = 'nombre',
        order = 'asc',
      } = params;

      let query = supabase
        .from('usuarios')
        .select(`
          id,
          nombre,
          correo,
          puesto,
          obra_id,
          is_active,
          obras:obra_id (nombre)
        `)
        .eq('supervisor_id', supervisorId);

      if (typeof is_active === 'boolean') query = query.eq('is_active', is_active);
      if (obra_id) query = query.eq('obra_id', obra_id);

      if (search) {
        const needle = sanitizeSearch(search);
        query = query.or(`nombre.ilike.%${needle}%,correo.ilike.%${needle}%`);
      }

      query = query
        .order(orderBy, { ascending: String(order).toLowerCase() === 'asc' })
        .range(offset, Math.max(offset + limit - 1, offset));

      const { data, error } = await query;
      if (error) throw error;

      return ok({
        data: (data || []).map(r => ({
          id: r.id,
          nombre: r.nombre,
          correo: r.correo,
          puesto: r.puesto || 'No asignado',
          obra: r.obras?.nombre || 'No asignado',
          is_active: !!r.is_active,
        })),
        page: { offset, limit, returned: data?.length || 0 },
      });
    } catch (error) {
      return fail(error || 'Error al cargar empleados del supervisor');
    }
  },
};
