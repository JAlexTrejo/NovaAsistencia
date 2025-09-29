// src/data/reportDataService.js
import { supabase } from '../lib/supabase';

function ok(data)  { return { success: true,  ...data }; }
function fail(err) { return { success: false, error: err?.message || String(err) || 'Error desconocido' }; }

function sanitizeDate(d) {
  // Acepta Date, número (epoch) o string ISO; devuelve ISO o null
  if (!d) return null;
  try {
    const iso = new Date(d).toISOString();
    return iso;
  } catch { return null; }
}

export const reportDataService = {
  /**
   * Reporte de asistencias con filtros y paginación.
   * @param {Object} filters
   *  - startDate?: string|Date
   *  - endDate?: string|Date
   *  - obra_id?: string
   *  - usuario_id?: string
   *  - limit?: number (default 200)
   *  - offset?: number (default 0)
   *  - orderBy?: string (default 'fecha_entrada')
   *  - order?: 'asc'|'desc' (default 'desc')
   */
  async getAttendanceReport(filters = {}) {
    try {
      const {
        startDate,
        endDate,
        obra_id,
        usuario_id,
        limit = 200,
        offset = 0,
        orderBy = 'fecha_entrada',
        order = 'desc',
      } = filters;

      let query = supabase
        .from('asistencias')
        .select(`
          id,
          fecha_entrada,
          fecha_salida,
          horas_trabajadas,
          usuario_id,
          obra_id,
          usuarios:usuario_id (nombre, correo),
          obras:obra_id (nombre)
        `);

      const sd = sanitizeDate(startDate);
      const ed = sanitizeDate(endDate);

      if (sd) query = query.gte('fecha_entrada', sd);
      if (ed) query = query.lte('fecha_entrada', ed);

      if (obra_id)    query = query.eq('obra_id', obra_id);
      if (usuario_id) query = query.eq('usuario_id', usuario_id);

      query = query.order(orderBy, { ascending: String(order).toLowerCase() === 'asc' })
                   .range(offset, Math.max(offset + limit - 1, offset));

      const { data, error } = await query;
      if (error) throw error;

      return ok({
        data: data || [],
        page: { offset, limit, returned: data?.length || 0 },
      });
    } catch (error) {
      return fail(error || 'Error al generar reporte de asistencia');
    }
  },

  /**
   * Reporte de nómina (básico).
   * Nota: Esto NO calcula nómina completa. Solo trae datos base del empleado.
   * Si necesitas totales por rango de fechas (horas * rate), conviene un RPC.
   * @param {Object} filters
   *  - is_active?: boolean (default true)
   *  - obra_id?: string
   *  - search?: string
   *  - limit?: number (default 200)
   *  - offset?: number (default 0)
   *  - orderBy?: string (default 'nombre')
   *  - order?: 'asc'|'desc' (default 'asc')
   */
  async getPayrollReport(filters = {}) {
    try {
      const {
        is_active = true,
        obra_id,
        search,
        limit = 200,
        offset = 0,
        orderBy = 'nombre',
        order = 'asc',
      } = filters;

      let query = supabase
        .from('usuarios')
        .select(`
          id,
          nombre,
          correo,
          hourly_rate,
          puesto,
          obra_id,
          is_active,
          obras:obra_id (nombre)
        `);

      if (typeof is_active === 'boolean') query = query.eq('is_active', is_active);
      if (obra_id) query = query.eq('obra_id', obra_id);

      if (search) {
        const needle = String(search).trim().replaceAll('%', '\\%').replaceAll(',', ' ');
        query = query.or(`nombre.ilike.%${needle}%,correo.ilike.%${needle}%`);
      }

      query = query.order(orderBy, { ascending: String(order).toLowerCase() === 'asc' })
                   .range(offset, Math.max(offset + limit - 1, offset));

      const { data, error } = await query;
      if (error) throw error;

      return ok({
        data: (data || []).map(r => ({
          id: r.id,
          nombre: r.nombre,
          correo: r.correo,
          puesto: r.puesto || 'No asignado',
          hourly_rate: Number(r.hourly_rate) || 0,
          obra: r.obras?.nombre || 'No asignado',
          is_active: !!r.is_active,
        })),
        page: { offset, limit, returned: data?.length || 0 },
      });
    } catch (error) {
      return fail(error || 'Error al generar reporte de nómina');
    }
  },
};
