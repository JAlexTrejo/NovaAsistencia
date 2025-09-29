// src/services/enhancedAttendanceService.js
import { supabase } from '@/lib/supabase';
import { adaptSupabaseError } from '@/utils/errors';

// Servicios de estimaciones de nómina
import {
  getRecentPayrollEstimation as getRecentEstimationSvc,
  recalculateWeeklyEstimation,
  upsertPayrollEstimation,
} from './payrollEstimationsService';

// Servicio central de incidentes (para creación rápida)
import incidentService from '@/services/incidentService';

const ok   = (data) => ({ ok: true, data });
const fail = (e)    => ({ ok: false, ...adaptSupabaseError(e) });

// ------------------------
// Helpers de fecha/semana
// ------------------------
const todayStr = () => new Date()?.toISOString()?.split('T')?.[0];

function getWeekBounds(date = new Date()) {
  const d = new Date(date);
  const day = (d?.getDay() + 6) % 7; // 0 = lunes
  const monday = new Date(d);
  monday?.setDate(d?.getDate() - day);
  monday?.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday?.setDate(monday?.getDate() + 6);

  const toISO = (x) => x?.toISOString()?.slice(0, 10);
  return { start: toISO(monday), end: toISO(sunday) };
}

// ------------------------
// Perfil del trabajador
// ------------------------
export async function getWorkerProfile(userId) {
  try {
    const { data, error } = await supabase?.from('employee_profiles')?.select(`
        id, employee_id, full_name, status, salary_type, daily_salary, hourly_rate,
        site_id,
        supervisor_id,
        construction_sites:site_id ( id, name, location ),
        supervisor:user_profiles!employee_profiles_supervisor_id_fkey ( id, full_name, email, phone ),
        user_profiles:user_id ( id, full_name, email, phone, role )
      `)?.eq('user_id', userId)?.single();

    if (error) return fail(error);
    return ok(data);
  } catch (e) {
    return fail(e);
  }
}

// ------------------------
// Compañeros del mismo sitio
// ------------------------
export async function getSiteCoworkers(siteId, excludeUserId = null) {
  try {
    if (!siteId) return ok([]);

    let query = supabase?.from('employee_profiles')?.select('id, full_name, employee_id, site_id, user_id')?.eq('site_id', siteId);

    if (excludeUserId) query = query?.neq('user_id', excludeUserId);

    const { data, error } = await query?.order('full_name', { ascending: true });
    if (error) return fail(error);

    return ok(data || []);
  } catch (e) {
    return fail(e);
  }
}

// ------------------------
// Estado de hoy
// ------------------------
export async function getTodayAttendanceStatus(employeeId, date = todayStr()) {
  try {
    const { data, error } = await supabase?.from('attendance_records')?.select('*')?.eq('employee_id', employeeId)?.eq('date', date)?.single();

    if (error && error?.code !== 'PGRST116') return fail(error);
    return ok(data || null);
  } catch (e) {
    return fail(e);
  }
}

// ------------------------
// Tarjeta semanal (auto-rango)
// ------------------------
export async function getWeeklyTimecard(employeeId, startDate, endDate) {
  try {
    const range = startDate && endDate ? { start: startDate, end: endDate } : getWeekBounds();

    const { data, error } = await supabase?.from('attendance_records')?.select('id,date,clock_in,lunch_start,lunch_end,clock_out,total_hours,overtime_hours,status,notes')?.eq('employee_id', employeeId)?.gte('date', range?.start)?.lte('date', range?.end)?.order('date', { ascending: true });

    if (error) return fail(error);
    return ok(data || []);
  } catch (e) {
    return fail(e);
  }
}

// ------------------------
// Incidentes recientes del trabajador
// ------------------------
export async function getWorkerIncidents(employeeId, limit = 5) {
  try {
    if (!employeeId) return ok([]);

    const { data, error } = await supabase?.from('incident_records')?.select('id, type, date, description, status, created_at, approved_at')?.eq('employee_id', employeeId)?.order('created_at', { ascending: false })?.limit(limit);

    if (error) return fail(error);

    const rows = (data || [])?.map((r) => ({
      id: r?.id,
      type: r?.type,
      date: r?.date,
      description: r?.description,
      status: r?.status,
      createdAt: r?.created_at,
      approvedAt: r?.approved_at || null,
    }));

    return ok(rows);
  } catch (e) {
    return fail(e);
  }
}

/** Alias usado por algunos componentes */
export async function listRecentIncidents(employeeId, limit = 5) {
  return getWorkerIncidents(employeeId, limit);
}

/** Creación rápida de incidente desde la UI */
export async function createIncidentQuick({ employeeId, type, date, description }) {
  try {
    const res = await incidentService?.createIncident({ employeeId, type, date, description });
    return res?.ok ? ok(res?.data) : res;
  } catch (e) {
    return fail(e);
  }
}

// ------------------------
// Estimado de nómina (semana)
// ------------------------
export async function getRecentPayrollEstimation(employeeId, startDate, endDate) {
  try {
    if (startDate && endDate) {
      const res = await getRecentEstimationSvc(employeeId, {
        targetWeekStart: startDate,
        targetWeekEnd: endDate,
        computeIfMissing: true,
        persistComputed: true,
      });
      return res?.ok ? ok(res?.data) : res;
    }

    const res = await getRecentEstimationSvc(employeeId, {
      computeIfMissing: true,
      persistComputed: true,
    });
    return res?.ok ? ok(res?.data) : res;
  } catch (e) {
    return fail(e);
  }
}

// ======================================================================
// Acciones de asistencia
// ======================================================================
export async function clockIn(employeeId, { siteId = null, location = null, notes = null } = {}) {
  try {
    const today = todayStr();

    const { data: existing, error: exErr } = await supabase?.from('attendance_records')?.select('*')?.eq('employee_id', employeeId)?.eq('date', today)?.single();

    if (exErr && exErr?.code !== 'PGRST116') return fail(exErr);

    if (!existing) {
      const { error } = await supabase?.from('attendance_records')?.insert([{
          employee_id: employeeId,
          site_id: siteId,
          date: today,
          clock_in: new Date()?.toISOString(),
          location_in: location || null,
          notes,
          status: 'present',
        }]);
      if (error) return fail(error);
    } else if (!existing?.clock_in) {
      const { error } = await supabase?.from('attendance_records')?.update({
          clock_in: new Date()?.toISOString(),
          location_in: location || null,
          notes,
          updated_at: new Date()?.toISOString(),
        })?.eq('id', existing?.id);
      if (error) return fail(error);
    }

    return ok(true);
  } catch (e) {
    return fail(e);
  }
}

export async function startLunchBreak(employeeId) {
  try {
    const today = todayStr();
    const { data: rec, error } = await supabase?.from('attendance_records')?.select('*')?.eq('employee_id', employeeId)?.eq('date', today)?.single();
    if (error) return fail(error);

    if (!rec?.lunch_start) {
      const { error: updErr } = await supabase?.from('attendance_records')?.update({ lunch_start: new Date()?.toISOString(), updated_at: new Date()?.toISOString() })?.eq('id', rec?.id);
      if (updErr) return fail(updErr);
    }
    return ok(true);
  } catch (e) {
    return fail(e);
  }
}

export async function endLunchBreak(employeeId) {
  try {
    const today = todayStr();
    const { data: rec, error } = await supabase?.from('attendance_records')?.select('*')?.eq('employee_id', employeeId)?.eq('date', today)?.single();
    if (error) return fail(error);

    if (rec?.lunch_start && !rec?.lunch_end) {
      const { error: updErr } = await supabase?.from('attendance_records')?.update({ lunch_end: new Date()?.toISOString(), updated_at: new Date()?.toISOString() })?.eq('id', rec?.id);
      if (updErr) return fail(updErr);
    }
    return ok(true);
  } catch (e) {
    return fail(e);
  }
}

export async function clockOut(employeeId, { location = null } = {}) {
  try {
    const today = todayStr();
    const { data: rec, error } = await supabase?.from('attendance_records')?.select('*')?.eq('employee_id', employeeId)?.eq('date', today)?.single();
    if (error) return fail(error);

    if (!rec?.clock_out) {
      const { error: updErr } = await supabase?.from('attendance_records')?.update({
          clock_out: new Date()?.toISOString(),
          location_out: location || null,
          updated_at: new Date()?.toISOString(),
        })?.eq('id', rec?.id);
      if (updErr) return fail(updErr);
    }
    return ok(true);
  } catch (e) {
    return fail(e);
  }
}

// --- Agregador para soportar ambos estilos de import ---
const enhancedAttendanceService = {
  // perfil / equipo
  getWorkerProfile,
  getSiteCoworkers,
  // asistencia
  getTodayAttendanceStatus,
  getWeeklyTimecard,
  clockIn,
  startLunchBreak,
  endLunchBreak,
  clockOut,
  // incidentes
  getWorkerIncidents,
  listRecentIncidents,
  createIncidentQuick,
  // estimados nómina
  getRecentPayrollEstimation,
  // (recalculateWeeklyEstimation, upsertPayrollEstimation pueden agregarse si los usas)
};

export { enhancedAttendanceService };
export default enhancedAttendanceService;

// Backward-compatibility alias for older components
export { getTodayAttendanceStatus as getTodayAttendance };