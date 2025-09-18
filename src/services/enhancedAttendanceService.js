// src/services/enhancedAttendanceService.js
import { supabase } from '@/lib/supabase';
import { adaptSupabaseError } from '@/utils/errors';

const ok   = (data) => ({ ok: true, data });
const fail = (e)    => ({ ok: false, ...adaptSupabaseError(e) });

const ATT_COLS = [
  'id',
  'employee_id',
  'site_id',
  'date',
  'clock_in',
  'lunch_start',
  'lunch_end',
  'clock_out',
  'total_hours',
  'overtime_hours',
  'status',
  'location_in',
  'location_out',
  'notes',
  'updated_at',
].join(',');

const SITE_NEST_MIN = `
  construction_sites (
    id,
    name,
    location,
    description,
    active
  )
`;

const SUPERVISOR_NEST = `
  supervisor:user_profiles!supervisor_id (
    id,
    full_name,
    email,
    phone
  )
`;

// ===============================
// Perfil del trabajador
// ===============================
export async function getWorkerProfile(userId) {
  try {
    const { data, error } = await supabase
      .from('employee_profiles')
      .select(
        [
          // columnas explícitas del empleado (lo necesario para el dashboard)
          'id',
          'user_id',
          'employee_id',
          'full_name',
          'position',
          'phone',
          'daily_salary',
          'site_id',
          'supervisor_id',
          'status',
          'active',
          SITE_NEST_MIN,
          SUPERVISOR_NEST,
        ].join(',')
      )
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    if (error) return fail(error);
    return ok(data);
  } catch (e) {
    return fail(e);
  }
}

// ===============================
// Compañeros del mismo sitio
// ===============================
export async function getSiteCoworkers(siteId, excludeUserId) {
  try {
    const { data, error } = await supabase
      .from('employee_profiles')
      .select(`
        id,
        full_name,
        position,
        phone,
        status,
        user_profiles!user_id (
          id,
          email,
          last_sign_in_at
        )
      `)
      .eq('site_id', siteId)
      .eq('status', 'active')
      .neq('user_id', excludeUserId)
      .order('full_name', { ascending: true });

    if (error) return fail(error);
    return ok(data || []);
  } catch (e) {
    return fail(e);
  }
}

// ===============================
// Historial con paginación
// ===============================
export async function getWorkerAttendanceHistory(employeeId, { limit = 30, offset = 0 } = {}) {
  try {
    const { data, error } = await supabase
      .from('attendance_records')
      .select(
        [
          ATT_COLS,
          `
          construction_sites (
            name,
            location
          )
        `,
        ].join(',')
      )
      .eq('employee_id', employeeId)
      .order('date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) return fail(error);
    return ok(data || []);
  } catch (e) {
    return fail(e);
  }
}

// ===============================
// Estado de hoy
// ===============================
export async function getTodayAttendanceStatus(employeeId) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('attendance_records')
      .select(ATT_COLS)
      .eq('employee_id', employeeId)
      .eq('date', today)
      .maybeSingle(); // NOTA: si no hay fila no es error

    if (error) return fail(error);
    return ok(data || null);
  } catch (e) {
    return fail(e);
  }
}

// Helpers de tiempo
const isoNow = () => new Date().toISOString();
const isoDate = () => new Date().toISOString().split('T')[0];
const to2 = (n) => Number((+n).toFixed(2));

// ===============================
// Clock-in (idempotente)
// ===============================
export async function clockIn(employeeId, { location = null, notes = null } = {}) {
  try {
    const today = isoDate();
    const now = isoNow();

    // Intentamos UPSERT para evitar carreras y duplicados
    const upsertPayload = {
      employee_id: employeeId,
      date: today,
      clock_in: now,
      location_in: location,
      status: 'present',
      notes,
      updated_at: now,
    };

    const { data, error } = await supabase
      .from('attendance_records')
      .upsert(upsertPayload, { onConflict: 'employee_id,date', ignoreDuplicates: false })
      .select(ATT_COLS)
      .maybeSingle();

    if (error) {
      // Si ya existía con clock_in, devolvemos mensaje claro
      if (/duplicate key value|conflict/i.test(error.message)) {
        return { ok: false, error: 'Ya has marcado entrada hoy.', code: 'DUP' };
      }
      return fail(error);
    }

    // Si ya tenía clock_in previo, avisamos
    if (data?.clock_in && data.clock_in !== now) {
      return { ok: false, error: 'Ya has marcado entrada hoy.', code: 'ALREADY_IN' };
    }

    return ok(data);
  } catch (e) {
    return fail(e);
  }
}

// ===============================
// Clock-out
// ===============================
export async function clockOut(employeeId, { location = null, notes = null } = {}) {
  try {
    const today = isoDate();
    const now = isoNow();

    const { data: rec, error: fErr } = await supabase
      .from('attendance_records')
      .select(ATT_COLS)
      .eq('employee_id', employeeId)
      .eq('date', today)
      .maybeSingle();

    if (fErr) return fail(fErr);
    if (!rec?.clock_in) return { ok: false, error: 'Debes marcar entrada primero.', code: 'NO_IN' };
    if (rec?.clock_out) return { ok: false, error: 'Ya has marcado salida hoy.', code: 'ALREADY_OUT' };

    const start = new Date(rec.clock_in).getTime();
    const end = new Date(now).getTime();
    const totalMs = Math.max(0, end - start);

    let lunchMs = 0;
    if (rec?.lunch_start && rec?.lunch_end) {
      lunchMs = Math.max(0, new Date(rec.lunch_end) - new Date(rec.lunch_start));
    }

    const totalHours = (totalMs - lunchMs) / (1000 * 60 * 60);
    const overtime = Math.max(0, totalHours - 8);

    const payload = {
      clock_out: now,
      location_out: location,
      total_hours: to2(totalHours),
      overtime_hours: to2(overtime),
      notes: rec?.notes ? `${rec.notes}\nSalida: ${notes || 'Sin notas'}` : notes,
      updated_at: now,
    };

    const { data, error } = await supabase
      .from('attendance_records')
      .update(payload)
      .eq('id', rec.id)
      .select(ATT_COLS)
      .maybeSingle();

    if (error) return fail(error);
    return ok(data);
  } catch (e) {
    return fail(e);
  }
}

// ===============================
// Inicio/fin de comida
// ===============================
export async function startLunchBreak(employeeId) {
  try {
    const today = isoDate();
    const now = isoNow();

    const { data, error } = await supabase
      .from('attendance_records')
      .update({ lunch_start: now, updated_at: now })
      .eq('employee_id', employeeId)
      .eq('date', today)
      .select(ATT_COLS)
      .maybeSingle();

    if (error) return fail(error);
    return ok(data);
  } catch (e) {
    return fail(e);
  }
}

export async function endLunchBreak(employeeId) {
  try {
    const today = isoDate();
    const now = isoNow();

    const { data, error } = await supabase
      .from('attendance_records')
      .update({ lunch_end: now, updated_at: now })
      .eq('employee_id', employeeId)
      .eq('date', today)
      .select(ATT_COLS)
      .maybeSingle();

    if (error) return fail(error);
    return ok(data);
  } catch (e) {
    return fail(e);
  }
}

// ===============================
// Resumen semanal
// ===============================
export async function getWeeklyTimecard(employeeId, weekStart = null) {
  try {
    let start = weekStart ? new Date(weekStart) : new Date();
    if (!weekStart) {
      const dow = start.getDay(); // 0 = domingo
      const mondayOffset = (dow + 6) % 7; // días desde lunes
      start.setDate(start.getDate() - mondayOffset);
    }
    const end = new Date(start);
    end.setDate(end.getDate() + 6);

    const s = start.toISOString().split('T')[0];
    const e = end.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('attendance_records')
      .select(ATT_COLS)
      .eq('employee_id', employeeId)
      .gte('date', s)
      .lte('date', e)
      .order('date', { ascending: true });

    if (error) return fail(error);

    const rows = data || [];
    const totalRegular = rows.reduce((acc, r) => {
      const th = Number(r.total_hours || 0);
      const ot = Number(r.overtime_hours || 0);
      return acc + Math.max(0, th - ot);
    }, 0);
    const totalOT = rows.reduce((acc, r) => acc + Number(r.overtime_hours || 0), 0);

    return ok({
      weekStart: s,
      weekEnd: e,
      dailyRecords: rows,
      totalRegularHours: to2(totalRegular),
      totalOvertimeHours: to2(totalOT),
      totalHours: to2(totalRegular + totalOT),
    });
  } catch (e) {
    return fail(e);
  }
}

// ===============================
// Incidentes del trabajador
// ===============================
export async function getWorkerIncidents(employeeId, limit = 10) {
  try {
    const { data, error } = await supabase
      .from('incident_records')
      .select(`
        id,
        type,
        date,
        description,
        status,
        created_at,
        approved_at,
        approved_by_user:user_profiles!approved_by (
          full_name
        )
      `)
      .eq('employee_id', employeeId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) return fail(error);
    return ok(data || []);
  } catch (e) {
    return fail(e);
  }
}

export async function submitIncident(employeeId, incident) {
  try {
    const payload = {
      employee_id: employeeId,
      type: incident?.type,
      date: incident?.date,
      description: incident?.description,
      status: 'pendiente',
    };
    const { data, error } = await supabase
      .from('incident_records')
      .insert([payload])
      .select('id, employee_id, type, date, description, status, created_at')
      .maybeSingle();

    if (error) return fail(error);
    return ok(data);
  } catch (e) {
    return fail(e);
  }
}

// ===============================
// Estimación de nómina reciente
// ===============================
export async function getRecentPayrollEstimation(employeeId) {
  try {
    const { data, error } = await supabase
      .from('payroll_estimations')
      .select(`
        id,
        employee_id,
        week_start,
        week_end,
        currency,
        total_regular_hours,
        total_overtime_hours,
        bonuses,
        deductions,
        net_pay,
        created_at
      `)
      .eq('employee_id', employeeId)
      .order('week_start', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) return fail(error);
    return ok(data || null);
  } catch (e) {
    return fail(e);
  }
}

export const enhancedAttendanceService = {
  getWorkerProfile,
  getSiteCoworkers,
  getWorkerAttendanceHistory,
  getTodayAttendanceStatus,
  clockIn,
  clockOut,
  startLunchBreak,
  endLunchBreak,
  getWeeklyTimecard,
  getWorkerIncidents,
  submitIncident,
  getRecentPayrollEstimation,
};

export default enhancedAttendanceService;
