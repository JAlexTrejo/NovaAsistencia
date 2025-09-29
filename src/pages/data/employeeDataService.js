// src/pages/data/employeeDataService.js
// Shim de compatibilidad para EmployeeDetailPanel (y otros).
// Expone helpers comunes y usa Supabase directamente.
// Ajusta nombres de tabla/columnas si tu esquema difiere.

import { supabase } from '@/lib/supabase';

const EMP_TABLE = 'employees'; // cámbialo si tu tabla real es 'user_profiles' u otra

// Mantén columnas explícitas (evita '*')
const EMP_COLS = [
  'id',
  'full_name',
  'email',
  'phone',
  'position',
  'status',
  'site_id',
  'supervisor_id',
  'avatar',
  'hire_date',
  'employee_code',
  'salary_type',
  'hourly_rate',
  'daily_salary',
  'role',
  'updated_at',
  'created_at',
].join(',');

/** Obtiene un empleado por ID */
async function getEmployeeById(id) {
  try {
    const { data, error } = await supabase
      .from(EMP_TABLE)
      .select(EMP_COLS)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data || null;
  } catch (e) {
    console.error('employeeDataService.getEmployeeById error:', e);
    return null;
  }
}

/** Lista empleados (búsqueda/paginación opcional) */
async function listEmployees({ page = 0, pageSize = 50, search = '' } = {}) {
  try {
    let query = supabase.from(EMP_TABLE).select(EMP_COLS, { count: 'exact' });

    if (search?.trim()) {
      const s = search.trim();
      query = query.or(
        `full_name.ilike.%${s}%,email.ilike.%${s}%,employee_code.ilike.%${s}%`
      );
    }

    // Orden por nombre (ajusta si prefieres hire_date desc, etc.)
    query = query.order('full_name', { ascending: true });

    // Paginación
    const from = page * pageSize;
    const to = from + pageSize - 1;
    const { data, error, count } = await query.range(from, to);

    if (error) throw error;
    return {
      rows: data || [],
      count: count ?? 0,
      page,
      pageSize,
    };
  } catch (e) {
    console.error('employeeDataService.listEmployees error:', e);
    return { rows: [], count: 0, page: 0, pageSize: 50 };
  }
}

/** Opciones para Select (id/label) */
async function getEmployeeOptions({ search = '' } = {}) {
  try {
    const { rows } = await listEmployees({ page: 0, pageSize: 500, search });
    return (rows || []).map((e) => ({
      value: e?.id,
      label: e?.full_name || e?.email || 'Empleado',
      email: e?.email || '',
    }));
  } catch (e) {
    console.error('employeeDataService.getEmployeeOptions error:', e);
    return [];
  }
}

/** Actualiza datos del empleado (patch) */
async function updateEmployee(id, patch = {}) {
  try {
    const stamp = new Date().toISOString();
    const payload = { ...patch, updated_at: stamp };

    const { data, error } = await supabase
      .from(EMP_TABLE)
      .update(payload)
      .eq('id', id)
      .select(EMP_COLS)
      .maybeSingle();

    if (error) throw error;
    return data || null;
  } catch (e) {
    console.error('employeeDataService.updateEmployee error:', e);
    return null;
  }
}

/** Asigna sitio al empleado */
async function assignSite(employeeId, siteId) {
  return updateEmployee(employeeId, { site_id: siteId });
}

/** Asigna supervisor al empleado */
async function assignSupervisor(employeeId, supervisorId) {
  return updateEmployee(employeeId, { supervisor_id: supervisorId });
}

/** Cambia estado del empleado */
async function setEmployeeStatus(employeeId, status) {
  return updateEmployee(employeeId, { status });
}

/** Elimina (soft/hard) — por defecto soft */
async function deleteEmployee(employeeId, { hard = false } = {}) {
  try {
    if (hard) {
      const { error } = await supabase.from(EMP_TABLE).delete().eq('id', employeeId);
      if (error) throw error;
      return true;
    }
    const res = await updateEmployee(employeeId, { status: 'inactive' });
    return !!res;
  } catch (e) {
    console.error('employeeDataService.deleteEmployee error:', e);
    return false;
  }
}

export const employeeDataService = {
  getEmployeeById,
  listEmployees,
  getEmployeeOptions,
  updateEmployee,
  assignSite,
  assignSupervisor,
  setEmployeeStatus,
  deleteEmployee,
};

export default employeeDataService;
