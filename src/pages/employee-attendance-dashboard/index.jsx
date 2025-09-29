// src/services/incidentService.js
import { supabase } from '@/lib/supabase';
import { adaptSupabaseError } from '../../utils/errors';

const ok   = (data) => ({ ok: true, data });
const fail = (e)    => ({ ok: false, ...adaptSupabaseError(e) });

// ⬇️ NUEVO: listado paginado de incidentes personales
export async function getPersonalIncidents({ employeeId, page = 0, status = 'all', pageSize = 20 }) {
  try {
    if (!employeeId) return ok({ rows: [], count: 0, pageSize });

    let query = supabase
      .from('incident_records') // 👈 acorde a tu esquema público
      .select(`
        id,
        employee_id,
        type,
        date,
        description,
        status,
        approved_by,
        approved_at,
        created_at,
        updated_at,
        user_profiles:approved_by ( id, full_name )
      `, { count: 'exact' })
      .eq('employee_id', employeeId)
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const from = page * pageSize;
    const to   = from + pageSize - 1;

    const { data, error, count } = await query.range(from, to);
    if (error) return fail(error);

    const rows = (data || []).map(r => ({
      id: r.id,
      date: r.date,
      type: r.type,
      description: r.description || '',
      status: r.status,
      approvedBy: r?.user_profiles?.full_name || null,
      approvedAt: r?.approved_at || null,
      createdAt: r?.created_at,
    }));

    return ok({ rows, count: count ?? 0, pageSize });
  } catch (e) {
    return fail(e);
  }
}

// ⬇️ Export por defecto si ya tienes un objeto service; agrega esta función al objeto si lo usas así.
const incidentService = { getPersonalIncidents };
export default incidentService;
