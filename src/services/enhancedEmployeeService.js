// src/services/enhancedEmployeeService.js
import { supabase } from '@/lib/supabase';

/* -------------------------- Helpers / Sanitizers -------------------------- */
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const isUUID = (v) => /^[0-9a-f-]{36}$/i.test((v || '').trim());
const sanitizeText = (s, max = 64) => (s || '').toString().trim().slice(0, max);

/** Mínimo de caracteres para disparar búsquedas textuales */
const MIN_SEARCH_LEN = 2;

/* ------------------------------- Mapeadores ------------------------------- */
const mapEmployeeRow = (r) => ({
  id: r?.id,
  employeeId: r?.employee_id,
  name: r?.full_name || r?.user_profiles?.full_name || '',
  email: r?.user_profiles?.email || r?.email || '',
  phone: r?.phone || '',
  site: r?.construction_sites?.name || '',
  siteId: r?.site_id || null,
  supervisor: r?.supervisor?.full_name || '',
  supervisorId: r?.supervisor_id || null,
  position: r?.position || '',
  status: r?.status || '',
  dailySalary: r?.daily_salary ?? 0,
  hourlyRate: r?.hourly_rate ?? 0,
  salaryType: r?.salary_type || (r?.hourly_rate ? 'hourly' : 'daily'),
  userId: r?.user_id || null,
  hireDate: r?.hire_date || null,
  address: r?.address || '',
  birthDate: r?.birth_date || null,
  emergencyContact: r?.emergency_contact || '',
  idNumber: r?.id_number || '',
  avatar: r?.profile_picture_url || null,
});

/* -------------------------------- Servicio -------------------------------- */
const enhancedEmployeeService = {
  /**
   * Lista de empleados (paginada) con filtros.
   * Retorna: { rows, count, pageSize }
   *
   * @param {Object} params
   *  - search?: string
   *  - site?: string|'all'
   *  - supervisor?: string|'all'
   *  - status?: string[] (['active','inactive','suspended']) o []
   *  - position?: string|'all'
   *  - hireDateFrom?: 'YYYY-MM-DD'
   *  - hireDateTo?: 'YYYY-MM-DD'
   *  - page?: number (0-index)
   *  - pageSize?: number
   *  - sortBy?: string (columna DB segura)
   *  - sortDir?: 'asc'|'desc'
   */
  async getEmployees(params = {}) {
    const {
      search = '',
      site = 'all',
      supervisor = 'all',
      status = [],
      position = 'all',
      hireDateFrom = '',
      hireDateTo = '',
      page = 0,
      pageSize = 50,
      sortBy = 'created_at',
      sortDir = 'desc',
    } = params;

    // Sanitizar
    const safeSearch = sanitizeText(search, 64);
    const safePage = Math.max(0, parseInt(page, 10) || 0);
    const safePageSize = clamp(parseInt(pageSize, 10) || 50, 10, 200);
    const from = safePage * safePageSize;
    const to = from + safePageSize - 1;

    // Lista de columnas de orden permitido (evita SQLi en RPC)
    const ALLOWED_SORT = new Set([
      'created_at',
      'full_name',
      'employee_id',
      'status',
      'position',
      'hire_date',
      'site_id',
      'supervisor_id',
    ]);
    const orderCol = ALLOWED_SORT.has(sortBy) ? sortBy : 'created_at';
    const orderAsc = String(sortDir).toLowerCase() === 'asc';

    let q = supabase
      .from('employee_profiles')
      .select(
        `
        *,
        user_profiles:user_id (id, full_name, email, role, phone),
        construction_sites:site_id (id, name, location),
        supervisor:supervisor_id (id, full_name, email, phone)
      `,
        { count: 'exact' }
      )
      .neq('status', 'deleted')
      .order(orderCol, { ascending: orderAsc })
      .range(from, to);

    // Filtros
    if (site && site !== 'all') q = q.eq('site_id', site);
    if (supervisor && supervisor !== 'all') q = q.eq('supervisor_id', supervisor);
    if (Array.isArray(status) && status.length > 0) q = q.in('status', status);
    if (position && position !== 'all') q = q.eq('position', position);
    if (hireDateFrom) q = q.gte('hire_date', hireDateFrom);
    if (hireDateTo) q = q.lte('hire_date', hireDateTo);

    // Búsqueda
    if (safeSearch && safeSearch.length >= MIN_SEARCH_LEN) {
      if (isUUID(safeSearch)) {
        // Buscar por id/ user_id si parece UUID
        q = q.or(`id.eq.${safeSearch},user_id.eq.${safeSearch}`);
      } else {
        // Texto en varias columnas
        q = q.or(
          [
            `full_name.ilike.%${safeSearch}%`,
            `employee_id.ilike.%${safeSearch}%`,
            `email.ilike.%${safeSearch}%`,
            `phone.ilike.%${safeSearch}%`,
            `id_number.ilike.%${safeSearch}%`,
          ].join(',')
        );
      }
    }

    const { data, error, count } = await q;
    if (error) throw new Error(`Error fetching employees: ${error.message}`);

    return {
      rows: (data || []).map(mapEmployeeRow),
      count: count ?? 0,
      pageSize: safePageSize,
    };
  },

  /**
   * KPIs rápidos (conteos exactos)
   */
  async getEmployeeStats() {
    const base = supabase.from('employee_profiles').select('*', { count: 'exact', head: true });

    const [{ count: total, error: e1 }, { count: active, error: e2 }, { count: inactive, error: e3 }, { count: suspended, error: e4 }] =
      await Promise.all([
        base.neq('status', 'deleted'),
        base.eq('status', 'active'),
        base.eq('status', 'inactive'),
        base.eq('status', 'suspended'),
      ]);

    if (e1) throw new Error(`Error stats total: ${e1.message}`);
    if (e2) throw new Error(`Error stats active: ${e2.message}`);
    if (e3) throw new Error(`Error stats inactive: ${e3.message}`);
    if (e4) throw new Error(`Error stats suspended: ${e4.message}`);

    return {
      total: total || 0,
      active: active || 0,
      inactive: inactive || 0,
      suspended: suspended || 0,
    };
  },

  /**
   * Detalle por ID (mapeado)
   */
  async getEmployeeById(id) {
    const { data, error } = await supabase
      .from('employee_profiles')
      .select(
        `
        *,
        user_profiles:user_id (id, full_name, email, role, phone),
        construction_sites:site_id (id, name, location),
        supervisor:supervisor_id (id, full_name, email, phone)
      `
      )
      .eq('id', id)
      .single();

    if (error) throw new Error(`Error fetching employee: ${error.message}`);
    return mapEmployeeRow(data);
  },

  /**
   * Crear empleado (campos ampliados)
   */
  async createEmployee(payload) {
    const rec = {
      employee_id: payload?.employeeId || `EMP-${Date.now()}`,
      user_id: payload?.userId || null,
      full_name: payload?.name || payload?.full_name,
      email: payload?.email || null, // si tienes este campo en la tabla, ok; si no, quitar
      phone: payload?.phone || null,
      address: payload?.address || null,
      birth_date: payload?.birthDate || null,
      position: payload?.position || 'albañil',
      status: payload?.status || 'active',
      site_id: payload?.siteId || null,
      supervisor_id: payload?.supervisorId || null,
      salary_type: payload?.salaryType || (payload?.hourlyRate ? 'hourly' : 'daily'),
      daily_salary: payload?.dailySalary ?? 0,
      hourly_rate: payload?.hourlyRate ?? 0,
      hire_date: payload?.hireDate || new Date().toISOString().split('T')[0],
      emergency_contact: payload?.emergencyContact || null,
      id_number: payload?.idNumber || null,
      profile_picture_url: payload?.avatar || null,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase.from('employee_profiles').insert([rec]).select('id').single();
    if (error) throw new Error(`Error creating employee: ${error.message}`);
    return data?.id || true;
  },

  /**
   * Actualizar empleado
   */
  async updateEmployee(id, payload) {
    const patch = {
      full_name: payload?.name ?? payload?.full_name,
      phone: payload?.phone,
      address: payload?.address,
      birth_date: payload?.birthDate,
      position: payload?.position,
      status: payload?.status,
      site_id: payload?.siteId ?? payload?.site_id ?? null,
      supervisor_id: payload?.supervisorId ?? payload?.supervisor_id ?? null,
      salary_type: payload?.salaryType,
      daily_salary: payload?.dailySalary ?? payload?.daily_salary,
      hourly_rate: payload?.hourlyRate ?? payload?.hourly_rate,
      emergency_contact: payload?.emergencyContact,
      id_number: payload?.idNumber,
      profile_picture_url: payload?.avatar ?? payload?.profile_picture_url,
      updated_at: new Date().toISOString(),
    };

    // Limpia campos undefined para no sobreescribir con null accidentalmente
    Object.keys(patch).forEach((k) => patch[k] === undefined && delete patch[k]);

    const { error } = await supabase.from('employee_profiles').update(patch).eq('id', id);
    if (error) throw new Error(`Error updating employee: ${error.message}`);
    return true;
  },

  /**
   * Bulk update por IDs
   */
  async bulkUpdateEmployees(ids = [], patch = {}) {
    if (!Array.isArray(ids) || !ids.length) return true;
    const payload = { ...patch, updated_at: new Date().toISOString() };
    const { error } = await supabase.from('employee_profiles').update(payload).in('id', ids);
    if (error) throw new Error(`Error bulk updating employees: ${error.message}`);
    return true;
  },

  /**
   * Soft delete + log opcional
   */
  async deleteEmployee(id, performedByUserId = null) {
    const { error } = await supabase
      .from('employee_profiles')
      .update({ status: 'deleted', updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw new Error(`Error deleting employee: ${error.message}`);

    if (performedByUserId) {
      // No romper si falla el log
      await supabase
        .from('logs_actividad')
        .insert([
          {
            usuario_id: performedByUserId,
            modulo: 'employees',
            accion: 'delete',
            descripcion: `Soft delete empleado ${id}`,
            fecha: new Date().toISOString(),
            severity: 'medium',
            rol: 'admin',
          },
        ])
        .then(() => {})
        .catch(() => {});
    }
    return true;
  },

  /**
   * Catálogo: sitios de construcción activos
   */
  async getSites() {
    const { data, error } = await supabase
      .from('construction_sites')
      .select('id, name, location, is_active')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) throw new Error(`Error fetching sites: ${error.message}`);
    return data || [];
  },

  /**
   * Catálogo: supervisores (roles elevados)
   */
  async getSupervisors() {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, full_name, email, phone, role')
      .in('role', ['supervisor', 'admin', 'superadmin'])
      .order('full_name', { ascending: true });

    if (error) throw new Error(`Error fetching supervisors: ${error.message}`);
    return data || [];
  },
};

export default enhancedEmployeeService;
