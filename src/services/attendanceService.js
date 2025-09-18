// src/services/attendanceService.js
import { supabase } from '@/lib/supabase';
import { adaptSupabaseError } from '@/utils/errors';

// Helper: lista de columnas explícitas (evitar '*')
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
  'status',
  'notes',
  'updated_at',
].join(',');

const SITE_COLS = [
  'id',
  'name',
  'location',
  'latitude',
  'longitude',
  'allowed_radius_meters',
  'gps_enabled',
  'active',
].join(',');

// Aceptamos acciones en español y en inglés
const actionToColumn = (action) => {
  const a = String(action || '').toLowerCase();
  if (a === 'entrada' || a === 'checkin' || a === 'clock_in') return 'clock_in';
  if (a === 'salida' || a === 'checkout' || a === 'clock_out') return 'clock_out';
  if (a === 'lunch_start' || a === 'inicio_comida') return 'lunch_start';
  if (a === 'lunch_end' || a === 'fin_comida') return 'lunch_end';
  return null;
};

// Formatea YYYY-MM-DD (zona UTC para consistencia con Supabase date)
const yyyymmdd = (d) => (new Date(d)).toISOString().split('T')[0];

// ===============================
// Registro de asistencia (idempotente)
// ===============================
export async function registerAttendance(employeeId, siteId, action, location = null /* "lat,lon" */, registeredBy = null) {
  try {
    const today = yyyymmdd(new Date());

    // 1) Config del sitio (para GPS)
    const { data: site, error: siteError } = await supabase
      .from('construction_sites')
      .select(SITE_COLS)
      .eq('id', siteId)
      .maybeSingle();

    if (siteError) return { ok: false, ...adaptSupabaseError(siteError) };
    if (!site) return { ok: false, error: 'Sitio no encontrado', code: 'NOT_FOUND' };

    // 2) Validación GPS (si aplica)
    let locationValidation = { dentro_del_rango: true, distancia_metros: null };
    let locationError = null;

    if (location && site.gps_enabled && site.latitude != null && site.longitude != null) {
      const [userLat, userLon] = String(location).split(',').map((c) => parseFloat(c.trim()));
      if (Number.isFinite(userLat) && Number.isFinite(userLon)) {
        const { data: validation, error: vErr } = await supabase.rpc('validate_location_within_site', {
          employee_lat: userLat,
          employee_lon: userLon,
          site_uuid: siteId,
        });
        if (vErr) {
          locationError = 'No se pudo validar la ubicación GPS';
        } else if (validation && validation.length > 0) {
          locationValidation = validation[0];
          if (!locationValidation.dentro_del_rango) {
            return {
              ok: false,
              error: `Fuera de la zona permitida. Distancia: ${locationValidation.distancia_metros}m, Radio: ${locationValidation.radio_permitido}m.`,
              code: 'GPS_OUT_OF_RANGE',
              validation: locationValidation,
            };
          }
        }
      } else {
        locationError = 'Coordenadas GPS inválidas';
      }
    }

    // 3) Construir parche de acción
    const column = actionToColumn(action);
    if (!column) return { ok: false, error: 'Acción de asistencia no válida', code: 'VALIDATION' };

    const stamp = new Date().toISOString();
    const updatePatch = { [column]: stamp, updated_at: stamp };

    // 4) UPSERT idempotente (UNIQUE (employee_id, date))
    const payload = {
      employee_id: employeeId,
      site_id: siteId,
      date: today,
      ...updatePatch,
    };

    const { data, error } = await supabase
      .from('attendance_records')
      .upsert(payload, { onConflict: 'employee_id,date' })
      .select(ATT_COLS)
      .single();

    if (error) return { ok: false, ...adaptSupabaseError(error) };

    return {
      ok: true,
      data,
      validation: locationValidation,
      locationError, // null si todo bien o string si no se pudo validar (no bloquea)
    };
  } catch (e) {
    return { ok: false, ...adaptSupabaseError(e) };
  }
}

// ===============================
// Registro por supervisor (proxy al registro normal)
// ===============================
export async function registerAttendanceAsSupervisor(supervisorId, employeeId, siteId, action, supervisorLocation = null) {
  try {
    // En esta versión no persistimos supervisorId ni su ubicación
    // (se puede extender cuando agreguemos columnas para auditoría)
    return await registerAttendance(employeeId, siteId, action, supervisorLocation, supervisorId);
  } catch (e) {
    return { ok: false, ...adaptSupabaseError(e) };
  }
}

// ===============================
// Validar ubicación para un sitio
// ===============================
export async function validateLocationForSite(latitude, longitude, siteId) {
  try {
    const { data, error } = await supabase.rpc('validate_location_within_site', {
      employee_lat: latitude,
      employee_lon: longitude,
      site_uuid: siteId,
    });
    if (error) return { ok: false, ...adaptSupabaseError(error) };
    return { ok: true, data: data?.[0] || { dentro_del_rango: false } };
  } catch (e) {
    return { ok: false, ...adaptSupabaseError(e) };
  }
}

// ===============================
// Historial por empleado (rango)
// ===============================
export async function getEmployeeAttendance(employeeId, startDate, endDate) {
  try {
    const { data, error } = await supabase
      .from('attendance_records')
      .select(ATT_COLS)
      .eq('employee_id', employeeId)
      .gte('date', yyyymmdd(startDate))
      .lte('date', yyyymmdd(endDate))
      .order('date', { ascending: false });

    if (error) return { ok: false, ...adaptSupabaseError(error) };
    return { ok: true, data };
  } catch (e) {
    return { ok: false, ...adaptSupabaseError(e) };
  }
}

// ===============================
// Asistencia de hoy (empleado)
// ===============================
export async function getTodayAttendance(employeeId) {
  try {
    const today = yyyymmdd(new Date());
    const { data, error } = await supabase
      .from('attendance_records')
      .select(ATT_COLS)
      .eq('employee_id', employeeId)
      .eq('date', today)
      .maybeSingle();

    if (error) return { ok: false, ...adaptSupabaseError(error) };
    return { ok: true, data };
  } catch (e) {
    return { ok: false, ...adaptSupabaseError(e) };
  }
}

// ===============================
// Registros globales (con filtros)
// ===============================
export async function getAllAttendanceRecords(startDate, endDate, siteId = null) {
  try {
    let query = supabase
      .from('attendance_records')
      .select(ATT_COLS)
      .gte('date', yyyymmdd(startDate))
      .lte('date', yyyymmdd(endDate))
      .order('date', { ascending: false });

    if (siteId) query = query.eq('site_id', siteId);

    const { data, error } = await query;
    if (error) return { ok: false, ...adaptSupabaseError(error) };
    return { ok: true, data };
  } catch (e) {
    return { ok: false, ...adaptSupabaseError(e) };
  }
}

// ===============================
// Resumen semanal (empleado)
// ===============================
export async function getWeeklySummary(employeeId, weekStart /* Date o ISO */) {
  try {
    const start = new Date(weekStart);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);

    const { data, error } = await supabase
      .from('attendance_records')
      .select(ATT_COLS)
      .eq('employee_id', employeeId)
      .gte('date', yyyymmdd(start))
      .lte('date', yyyymmdd(end))
      .order('date', { ascending: true });

    if (error) return { ok: false, ...adaptSupabaseError(error) };

    const totalHours = (data || []).reduce((sum, r) => sum + (Number(r.total_hours) || 0), 0);
    const daysWorked = (data || []).filter((r) => {
      if (r.status) return String(r.status).toLowerCase() === 'complete';
      // fallback: si no hay status, considera día completo si tiene clock_in y clock_out
      return !!(r.clock_in && r.clock_out);
    }).length;

    return {
      ok: true,
      data: {
        records: data,
        summary: {
          totalHours,
          daysWorked,
          weekStart: yyyymmdd(start),
          weekEnd: yyyymmdd(end),
        },
      },
    };
  } catch (e) {
    return { ok: false, ...adaptSupabaseError(e) };
  }
}
