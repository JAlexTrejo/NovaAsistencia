// src/services/attendanceService.js
import { supabase } from '@/lib/supabase';
import { adaptSupabaseError } from '@/utils/errors';

// ===============================
// Columnas explícitas (evitar '*')
// ===============================
const ATT_COLS_BASE = [
  'id',
  'employee_id',
  'site_id',
  'date',
  'clock_in',
  'lunch_start',
  'lunch_end',
  'clock_out',
  'total_hours',
  'overtime_hours', // <-- si no existe, ignora; abajo protegemos su lectura
  'status',
  'notes',
  'updated_at',
].join(',');

const EMP_COLS = [
  'id',
  'employee_id',
  'full_name',
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

// Con relaciones explícitas
const ATT_COLS_WITH_REL = `
  ${ATT_COLS_BASE},
  employees:employee_id(${EMP_COLS}),
  construction_sites:site_id(id,name,location)
`;

// Aceptamos acciones en español y en inglés
const actionToColumn = (action) => {
  const a = String(action || '')?.toLowerCase();
  if (a === 'entrada' || a === 'checkin' || a === 'clock_in') return 'clock_in';
  if (a === 'salida' || a === 'checkout' || a === 'clock_out') return 'clock_out';
  if (a === 'lunch_start' || a === 'inicio_comida') return 'lunch_start';
  if (a === 'lunch_end' || a === 'fin_comida') return 'lunch_end';
  return null;
};

// YYYY-MM-DD consistente con supabase date
const yyyymmdd = (d) => (new Date(d))?.toISOString()?.split('T')?.[0];

// ===============================
// Registro de asistencia (idempotente)
// ===============================
export async function registerAttendance(employeeId, siteId, action, location = null /* "lat,lon" */, registeredBy = null) {
  try {
    const today = yyyymmdd(new Date());

    // 1) Config del sitio (para GPS)
    const { data: site, error: siteError } = await supabase
      ?.from('construction_sites')
      ?.select(SITE_COLS)
      ?.eq('id', siteId)
      ?.maybeSingle();

    if (siteError) return { ok: false, ...adaptSupabaseError(siteError) };
    if (!site) return { ok: false, error: 'Sitio no encontrado', code: 'NOT_FOUND' };

    // 2) Validación GPS (si aplica)
    let locationValidation = { dentro_del_rango: true, distancia_metros: null };
    let locationError = null;

    if (location && site?.gps_enabled && site?.latitude != null && site?.longitude != null) {
      const [userLat, userLon] = String(location)?.split(',')?.map((c) => parseFloat(c?.trim()));
      if (Number.isFinite(userLat) && Number.isFinite(userLon)) {
        const { data: validation, error: vErr } = await supabase?.rpc('validate_location_within_site', {
          employee_lat: userLat,
          employee_lon: userLon,
          site_uuid: siteId,
        });
        if (vErr) {
          locationError = 'No se pudo validar la ubicación GPS';
        } else if (validation && validation?.length > 0) {
          locationValidation = validation?.[0];
          if (!locationValidation?.dentro_del_rango) {
            return {
              ok: false,
              error: `Fuera de la zona permitida. Distancia: ${locationValidation?.distancia_metros}m, Radio: ${locationValidation?.radio_permitido}m.`,
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

    const stamp = new Date()?.toISOString();
    const updatePatch = { [column]: stamp, updated_at: stamp };

    // 4) UPSERT idempotente (UNIQUE (employee_id, date))
    const payload = {
      employee_id: employeeId,
      site_id: siteId,
      date: today,
      ...updatePatch,
    };

    const { data, error } = await supabase
      ?.from('attendance_records')
      ?.upsert(payload, { onConflict: 'employee_id,date' })
      ?.select(ATT_COLS_BASE)
      ?.single();

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
// Registro por supervisor (proxy)
// ===============================
export async function registerAttendanceAsSupervisor(supervisorId, employeeId, siteId, action, supervisorLocation = null) {
  try {
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
    const { data, error } = await supabase?.rpc('validate_location_within_site', {
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
      ?.from('attendance_records')
      ?.select(ATT_COLS_BASE)
      ?.eq('employee_id', employeeId)
      ?.gte('date', yyyymmdd(startDate))
      ?.lte('date', yyyymmdd(endDate))
      ?.order('date', { ascending: false });

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
      ?.from('attendance_records')
      ?.select(ATT_COLS_BASE)
      ?.eq('employee_id', employeeId)
      ?.eq('date', today)
      ?.maybeSingle();

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
      ?.from('attendance_records')
      ?.select(ATT_COLS_BASE)
      ?.gte('date', yyyymmdd(startDate))
      ?.lte('date', yyyymmdd(endDate))
      ?.order('date', { ascending: false });

    if (siteId) query = query?.eq('site_id', siteId);

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
    end?.setDate(end?.getDate() + 6);

    const { data, error } = await supabase
      ?.from('attendance_records')
      ?.select(ATT_COLS_BASE)
      ?.eq('employee_id', employeeId)
      ?.gte('date', yyyymmdd(start))
      ?.lte('date', yyyymmdd(end))
      ?.order('date', { ascending: true });

    if (error) return { ok: false, ...adaptSupabaseError(error) };

    const totalHours = (data || [])?.reduce((sum, r) => sum + (Number(r?.total_hours) || 0), 0);
    const daysWorked = (data || [])?.filter((r) => {
      if (r?.status) return String(r?.status)?.toLowerCase() === 'complete';
      return !!(r?.clock_in && r?.clock_out);
    })?.length;

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

// ===============================
// NUEVO: Listado paginado + joins (para grids)
// ===============================
const SORT_MAP = {
  employee: 'employees.full_name', // requiere join
  date: 'date',
  clockIn: 'clock_in',
  clockOut: 'clock_out',
  totalHours: 'total_hours',
  overtime: 'overtime_hours', // si tu tabla usa otra col, cámbiala aquí
  status: 'status',
};

function normalizeRecordForUI(r = {}) {
  return {
    id: r?.id,
    employeeId: r?.employee_id,
    siteId: r?.site_id,
    date: r?.date,
    clockIn: r?.clock_in,
    lunchStart: r?.lunch_start,
    lunchEnd: r?.lunch_end,
    clockOut: r?.clock_out,
    totalHours: Number(r?.total_hours) || 0,
    overtime: Number(r?.overtime_hours ?? 0) || 0,
    status: r?.status || 'complete',
    notes: r?.notes || null,
    updatedAt: r?.updated_at,

    // joineados para mostrar en UI
    employee: r?.employees?.full_name || 'Empleado',
    employeeCode: r?.employees?.employee_id || null,
    site: r?.construction_sites?.name || '',
    siteLocation: r?.construction_sites?.location || '',
  };
}

/**
 * Lista paginada de asistencia con filtros, orden y joins
 * @param {Object} params
 * @param {number} params.page
 * @param {number} params.pageSize
 * @param {string} params.sortKey - employee|date|clockIn|clockOut|totalHours|overtime|status
 * @param {'asc'|'desc'} params.sortDir
 * @param {string} params.search - busca por nombre de empleado (ilike)
 * @param {string} params.startDate - ISO / Date
 * @param {string} params.endDate - ISO / Date
 * @param {string} params.siteId
 * @param {string} params.employeeId
 * @param {string} params.status
 */
export async function listAttendancePaginated({
  page = 1,
  pageSize = 20,
  sortKey = 'date',
  sortDir = 'desc',
  search = '',
  startDate = null,
  endDate = null,
  siteId = null,
  employeeId = null,
  status = null,
} = {}) {
  try {
    const from = Math.max(0, (page - 1) * pageSize);
    const to = from + pageSize - 1;

    let query = supabase
      ?.from('attendance_records')
      ?.select(ATT_COLS_WITH_REL, { count: 'exact' });

    // Filtros
    if (startDate) query = query?.gte('date', yyyymmdd(startDate));
    if (endDate) query = query?.lte('date', yyyymmdd(endDate));
    if (siteId) query = query?.eq('site_id', siteId);
    if (employeeId) query = query?.eq('employee_id', employeeId);
    if (status) query = query?.eq('status', status);

    // Búsqueda por nombre de empleado (en relación)
    if (search?.trim()) {
      // Nota: Para filtrar relaciones, usar "ilike" sobre el alias de la relación.
      // En Supabase es válido: .ilike('employees.full_name', `%term%`)
      query = query?.ilike('employees.full_name', `%${search.trim()}%`);
    }

    // Orden
    const orderCol = SORT_MAP[sortKey] || 'date';
    const ascending = String(sortDir).toLowerCase() === 'asc';

    // Supabase solo permite order por columnas directas o por relación con sintaxis 'rel.col'
    // Cuando order por relación, hay que pasar "foreignTable" si hace falta; con alias en select suele resolver.
    query = query?.order(orderCol, { ascending, nullsFirst: !ascending });

    // Paginación
    query = query?.range(from, to);

    const { data, error, count } = await query;
    if (error) return { ok: false, ...adaptSupabaseError(error) };

    const totalCount = count || 0;
    const totalPages = Math.max(1, Math.ceil(totalCount / Math.max(1, pageSize)));
    const rows = (data || []).map(normalizeRecordForUI);

    return {
      ok: true,
      data: {
        data: rows,
        page,
        pageSize,
        totalCount,
        totalPages,
      },
    };
  } catch (e) {
    return { ok: false, ...adaptSupabaseError(e) };
  }
}

// ===============================
// Export agrupado
// ===============================
export const attendanceService = {
  getTodayAttendance,
  registerAttendance,
  registerAttendanceAsSupervisor,
  validateLocationForSite,
  getEmployeeAttendance,
  getAllAttendanceRecords,
  getWeeklySummary,
  listAttendancePaginated, // <-- NUEVO
};

export default attendanceService;
