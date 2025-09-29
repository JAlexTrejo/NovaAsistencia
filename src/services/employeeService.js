// src/services/employeeService.js
import { supabase } from '@/lib/supabase';
import { adaptSupabaseError } from '@/utils/errors';

const ok   = (data) => ({ ok: true, data });
const fail = (e)    => ({ ok: false, ...adaptSupabaseError(e) });

const EMP_BASE_COLS = [
  'id',
  'user_id',
  'employee_id',
  'full_name',
  'phone',
  'id_number',
  'birth_date',
  'address',
  'emergency_contact',
  'hire_date',
  'daily_salary',
  'site_id',
  'supervisor_id',
  'status',
  'last_attendance_date',
  'created_at',
  'updated_at',
  'deleted_at',
  'position',
  'hourly_rate',
  'salary_type',
  'profile_picture_url',
  'active',
].join(',');

const USER_NEST = `
  user_profiles:user_id (
    full_name,
    email,
    phone,
    daily_salary,
    role
  )
`;

const SITE_NEST = `
  construction_sites:site_id (
    id,
    name,
    location
  )
`;

const SUPERVISOR_NEST = `
  supervisor:supervisor_id (
    full_name,
    email
  )
`;

const PAGE_SIZE = 50;

/** Listado con paginación (vista admin) */
export async function listEmployees(page = 0) {
  try {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, error, count } = await supabase
      .from('employee_profiles')
      .select(
        `${EMP_BASE_COLS}, ${USER_NEST}, ${SITE_NEST}, ${SUPERVISOR_NEST}`,
        { count: 'planned' } // suficiente para UI y más barato
      )
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) return fail(error);
    return ok({ rows: data || [], count: count ?? 0, page, pageSize: PAGE_SIZE });
  } catch (e) {
    return fail(e);
  }
}

/** Detalle por ID */
export async function getEmployeeById(employeeId) {
  try {
    const { data, error } = await supabase
      .from('employee_profiles')
      .select(`${EMP_BASE_COLS}, ${USER_NEST}, ${SITE_NEST}, ${SUPERVISOR_NEST}`)
      .eq('id', employeeId)
      .maybeSingle();

    if (error) return fail(error);
    return ok(data);
  } catch (e) {
    return fail(e);
  }
}

/** Actualizar empleado (solo columnas permitidas) */
export async function updateEmployee(employeeId, updates = {}) {
  try {
    const patch = {};
    if ('full_name' in updates)          patch.full_name = updates.full_name;
    if ('phone' in updates)              patch.phone = updates.phone;
    if ('id_number' in updates)          patch.id_number = updates.id_number;
    if ('birth_date' in updates)         patch.birth_date = updates.birth_date;
    if ('address' in updates)            patch.address = updates.address;
    if ('emergency_contact' in updates)  patch.emergency_contact = updates.emergency_contact;
    if ('hire_date' in updates)          patch.hire_date = updates.hire_date;
    if ('daily_salary' in updates)       patch.daily_salary = Number.isFinite(+updates.daily_salary) ? +updates.daily_salary : 0;
    if ('hourly_rate' in updates)        patch.hourly_rate = Number.isFinite(+updates.hourly_rate) ? +updates.hourly_rate : 0;
    if ('salary_type' in updates)        patch.salary_type = updates.salary_type; // 'daily' | 'hourly' | 'project'
    if ('site_id' in updates)            patch.site_id = updates.site_id;
    if ('supervisor_id' in updates)      patch.supervisor_id = updates.supervisor_id;
    if ('status' in updates)             patch.status = updates.status; // enum employee_status
    if ('position' in updates)           patch.position = updates.position; // enum job_position
    if ('profile_picture_url' in updates)patch.profile_picture_url = updates.profile_picture_url;
    if ('active' in updates)             patch.active = !!updates.active;

    if (Object.keys(patch).length === 0) return ok(null);

    const { data, error } = await supabase
      .from('employee_profiles')
      .update(patch)
      .eq('id', employeeId)
      .select(`${EMP_BASE_COLS}, ${USER_NEST}, ${SITE_NEST}, ${SUPERVISOR_NEST}`)
      .maybeSingle();

    if (error) return fail(error);
    return ok(data);
  } catch (e) {
    return fail(e);
  }
}

/** Empleados por sitio */
export async function getEmployeesBySite(siteId) {
  try {
    const { data, error } = await supabase
      .from('employee_profiles')
      .select(`${EMP_BASE_COLS}, ${USER_NEST}, ${SUPERVISOR_NEST}`)
      .eq('site_id', siteId)
      .neq('status', 'deleted')
      .order('full_name', { ascending: true });

    if (error) return fail(error);
    return ok(data || []);
  } catch (e) {
    return fail(e);
  }
}

/**
 * Empleados por supervisor:
 * 1) Via employee_assignments (más seguro con RLS)
 * 2) Fallback a columna supervisor_id si no hay asignaciones
 */
export async function getEmployeesBySupervisor(supervisorId) {
  try {
    // 1) assignments
    let { data, error } = await supabase
      .from('employee_assignments')
      .select(`
        id,
        is_active,
        site_id,
        employee:employee_id (
          ${EMP_BASE_COLS},
          ${USER_NEST},
          ${SITE_NEST},
          ${SUPERVISOR_NEST}
        )
      `)
      .eq('supervisor_id', supervisorId)
      .eq('is_active', true)
      .order('id', { ascending: true });

    if (error) return fail(error);

    let employees = (data || []).map(r => r.employee).filter(Boolean);

    // 2) fallback
    if (!employees.length) {
      const res = await supabase
        .from('employee_profiles')
        .select(`${EMP_BASE_COLS}, ${USER_NEST}, ${SITE_NEST}, ${SUPERVISOR_NEST}`)
        .eq('supervisor_id', supervisorId)
        .neq('status', 'deleted')
        .order('full_name', { ascending: true });

      if (res.error) return fail(res.error);
      employees = res.data || [];
    }

    return ok(employees);
  } catch (e) {
    return fail(e);
  }
}

/** Desactivar (status + active) */
export async function deactivateEmployee(employeeId) {
  try {
    const { data, error } = await supabase
      .from('employee_profiles')
      .update({ status: 'inactive', active: false, updated_at: new Date().toISOString() })
      .eq('id', employeeId)
      .select(`${EMP_BASE_COLS}, ${USER_NEST}, ${SITE_NEST}, ${SUPERVISOR_NEST}`)
      .maybeSingle();

    if (error) return fail(error);
    return ok(data);
  } catch (e) {
    return fail(e);
  }
}

/** Restaurar (status + active) */
export async function restoreEmployee(employeeId) {
  try {
    const { data, error } = await supabase
      .from('employee_profiles')
      .update({ status: 'active', active: true, deleted_at: null, updated_at: new Date().toISOString() })
      .eq('id', employeeId)
      .select(`${EMP_BASE_COLS}, ${USER_NEST}, ${SITE_NEST}, ${SUPERVISOR_NEST}`)
      .maybeSingle();

    if (error) return fail(error);
    return ok(data);
  } catch (e) {
    return fail(e);
  }
}

/** Borrado lógico vía RPC existente (si la usas) */
export async function deleteEmployee(employeeId) {
  try {
    const { data, error } = await supabase.rpc('soft_delete_employee', { p_employee_id: employeeId });
    if (error) return fail(error);
    return ok(data);
  } catch (e) {
    return fail(e);
  }
}

/** Listado con filtros (status, sitio, supervisor, fechas, búsqueda) */
export async function getEmployeesWithFilters(filters = {}) {
  try {
    let query = supabase
      .from('employee_profiles')
      .select(`${EMP_BASE_COLS}, ${USER_NEST}, ${SITE_NEST}, ${SUPERVISOR_NEST}`);

    // status
    if (filters.status && filters.status.length > 0) {
      query = query.in('status', filters.status);
    } else if (!filters.includeDeleted) {
      query = query.neq('status', 'deleted');
    }

    if (filters.siteId)       query = query.eq('site_id', filters.siteId);
    if (filters.supervisorId) query = query.eq('supervisor_id', filters.supervisorId);

    // fechas de contratación
    if (filters.hireDateFrom) query = query.gte('hire_date', filters.hireDateFrom);
    if (filters.hireDateTo)   query = query.lte('hire_date', filters.hireDateTo);

    // orden
    const sortColumn = filters.sortColumn || 'full_name';
    const sortAsc = (filters.sortDirection || 'asc').toLowerCase() === 'asc';
    query = query.order(sortColumn, { ascending: sortAsc });

    let { data, error } = await query;
    if (error) return fail(error);

    // búsqueda local
    if (filters.search && data?.length) {
      const needle = String(filters.search).trim().toLowerCase();
      data = data.filter(r =>
        String(r.full_name || '').toLowerCase().includes(needle) ||
        String(r.employee_id || '').toLowerCase().includes(needle) ||
        String(r.id_number || '').toLowerCase().includes(needle)
      );
    }

    return ok(data || []);
  } catch (e) {
    return fail(e);
  }
}

/**
 * Obtiene todos los empleados (sin paginación dura).
 * Soporta búsqueda básica (full_name/email) y límite configurable.
 */
export async function getAllEmployees({ search = '', limit = 1000, offset = 0 } = {}) {
  try {
    let query = supabase
      .from('employee_profiles')
      .select(
        `${EMP_BASE_COLS}, ${USER_NEST}, ${SITE_NEST}, ${SUPERVISOR_NEST}`,
        { count: 'planned' } // evita el costo de exact
      )
      .neq('status', 'deleted')
      .order('full_name', { ascending: true });

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,user_profiles.email.ilike.%${search}%`);
    }

    const { data, error, count } = await query.range(offset, offset + limit - 1);
    if (error) return fail(error);

    return ok({ rows: data || [], count: count ?? (data?.length || 0) });
  } catch (e) {
    return fail(e);
  }
}

// --- Agregador para soportar ambos estilos de import ---
const employeeService = {
  listEmployees,
  getEmployeeById,
  updateEmployee,
  getEmployeesBySite,
  getEmployeesBySupervisor,
  deactivateEmployee,
  restoreEmployee,
  deleteEmployee,
  getEmployeesWithFilters,
  getAllEmployees,
};

export { employeeService };
export default employeeService;
