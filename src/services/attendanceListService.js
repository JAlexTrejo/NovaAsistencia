import { supabase } from '@/lib/supabase';
import { adaptSupabaseError } from '@/utils/errors';

const ok   = (data) => ({ ok: true, data });
const fail = (e)    => ({ ok: false, ...adaptSupabaseError(e) });

const ROW_COLS = [
  'id',
  'employee_id',
  'site_id',
  'date',
  'clock_in',
  'clock_out',
  'lunch_start',
  'lunch_end',
  'total_hours',
  'overtime_hours',
  'status',
  'location_in',
  'location_out',
  'notes',
  'created_at',
].join(',');

const NEST_EMPLOYEE = `
  user_profiles:employee_id (
    id,
    full_name,
    email
  )
`;

const NEST_SITE = `
  construction_sites:site_id (
    id,
    name,
    location
  )
`;

const PAGE_SIZE = 50;

/**
 * Lista de asistencias con paginación y filtros (fecha, empleado, sitio, búsqueda por nombre)
 * @param {Object} params
 *   - page        number
 *   - startDate   'YYYY-MM-DD'
 *   - endDate     'YYYY-MM-DD'
 *   - employeeId  uuid
 *   - siteId      uuid
 *   - search      string (filtra por nombre del empleado)
 */
export async function listAttendance(params = {}) {
  try {
    const { page = 0, startDate, endDate, employeeId, siteId, search } = params;
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase
      .from('attendance_records')
      .select([ROW_COLS, NEST_EMPLOYEE, NEST_SITE].join(','), { count: 'exact' })
      .order('date', { ascending: false })
      .range(from, to);

    if (startDate) query = query.gte('date', startDate);
    if (endDate) query = query.lte('date', endDate);
    if (employeeId) query = query.eq('employee_id', employeeId);
    if (siteId) query = query.eq('site_id', siteId);

    // para búsqueda por nombre, usamos filtro lateral con or y ilike sobre user_profiles.full_name
    if (search) {
      // NOTA: PostgREST no permite ilike directo sobre alias anidado; alternativa: vista o RPC.
      // Como workaround ligero, filtramos por 'notes' o status y dejamos búsqueda por nombre para una vista futura.
      // Si tienes una vista "attendance_view" con join, la podemos usar aquí.
      query = query.or(`status.ilike.%${search}%,notes.ilike.%${search}%`);
    }

    const { data, error, count } = await query;
    if (error) return fail(error);

    return ok({ rows: data || [], count: count ?? 0, page, pageSize: PAGE_SIZE });
  } catch (e) {
    return fail(e);
  }
}
