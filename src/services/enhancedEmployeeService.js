import { supabase } from '@/lib/supabase';
import { adaptSupabaseError } from '@/utils/errors';

// helpers de respuesta
const ok   = (data) => ({ ok: true, data });
const fail = (e)    => ({ ok: false, ...adaptSupabaseError(e) });

// columnas base (sin datos sensibles innecesarios)
const EMP_BASE_COLS = [
  'id',
  'employee_id',
  'full_name',
  'phone',
  'id_number',
  'birth_date',
  'address',
  'emergency_contact',
  'site_id',
  'supervisor_id',
  'user_id',
  'hire_date',
  'position',
  'status',
  'daily_salary',
  'hourly_rate',
  'salary_type',
  'last_attendance_date',
  'profile_picture_url',
  'created_at',
  'updated_at',
  'deleted_at',
].join(',');

// anidados (solo lo que pide la UI)
const NEST_SITE = `
  construction_sites:site_id (
    id,
    name,
    address,
    location
  )
`;

const NEST_SUPERVISOR = `
  user_profiles:supervisor_id (
    id,
    full_name,
    email,
    phone
  )
`;

const NEST_USER = `
  user_profiles:user_id (
    id,
    full_name,
    email,
    phone
  )
`;

const PAGE_SIZE = 50;

class EnhancedEmployeeService {
  /**
   * Listado con filtros y paginación opcional
   * filters = {
   *   search?: string,       // busca en full_name, employee_id, id_number
   *   siteId?: string,
   *   supervisorId?: string,
   *   status?: string[]      // ['active','inactive',...]
   *   position?: string,
   *   hireDateFrom?: 'YYYY-MM-DD',
   *   hireDateTo?:   'YYYY-MM-DD',
   *   page?: number          // 0-based
   * }
   */
  async getEmployees(filters = {}) {
    try {
      const {
        search,
        siteId,
        supervisorId,
        status,
        position,
        hireDateFrom,
        hireDateTo,
        page,
      } = filters;

      const hasPagination = Number.isInteger(page);

      let query = supabase
        .from('employee_profiles')
        .select([EMP_BASE_COLS, NEST_SITE, NEST_SUPERVISOR, NEST_USER].join(','), {
          count: hasPagination ? 'exact' : null,
        })
        .is('deleted_at', null) // soft delete
        .order('created_at', { ascending: false });

      if (search) {
        // búsqueda en columnas del propio registro
        query = query.or(
          `full_name.ilike.%${search}%,employee_id.ilike.%${search}%,id_number.ilike.%${search}%`
        );
      }
      if (siteId) {
        query = query.eq('site_id', siteId);
      }
      if (supervisorId) {
        query = query.eq('supervisor_id', supervisorId);
      }
      if (status && status.length > 0) {
        query = query.in('status', status);
      }
      if (position && position !== 'all') {
        query = query.eq('position', position);
      }
      if (hireDateFrom) {
        query = query.gte('hire_date', hireDateFrom);
      }
      if (hireDateTo) {
        query = query.lte('hire_date', hireDateTo);
      }

      if (hasPagination) {
        const from = page * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;
        query = query.range(from, to);
      }

      const { data, error, count } = await query;
      if (error) return fail(error);

      // Normalización mínima para la UI actual
      const rows =
        (data || []).map((employee) => ({
          id: employee.id,
          employeeId: employee.employee_id,
          name: employee.full_name,
          email: employee.user_profiles?.email || '',
          phone: employee.phone || employee.user_profiles?.phone || '',
          idNumber: employee.id_number || '',
          birthDate: employee.birth_date || '',
          address: employee.address || '',
          emergencyContact: employee.emergency_contact || '',
          site: employee.construction_sites?.name || 'No asignado',
          supervisor: employee.user_profiles?.full_name || 'No asignado',
          hireDate: employee.hire_date,
          status: employee.status,
          position: employee.position,
          dailySalary: Number(employee.daily_salary) || 0,
          hourlyRate: Number(employee.hourly_rate) || 0,
          salaryType: employee.salary_type || 'daily',
          lastAttendance: employee.last_attendance_date,
          avatar: employee.profile_picture_url || null,
          // raw ids
          siteId: employee.site_id,
          supervisorId: employee.supervisor_id,
          userId: employee.user_id,
          createdAt: employee.created_at,
          updatedAt: employee.updated_at,
        })) || [];

      return hasPagination
        ? ok({ rows, count: count ?? rows.length, page, pageSize: PAGE_SIZE })
        : ok(rows);
    } catch (e) {
      return fail(e);
    }
  }

  // Detalle por ID
  async getEmployeeById(employeeId) {
    try {
      const { data, error } = await supabase
        .from('employee_profiles')
        .select([EMP_BASE_COLS, NEST_SITE, NEST_SUPERVISOR, NEST_USER].join(','))
        .eq('id', employeeId)
        .is('deleted_at', null)
        .single();

      if (error) return fail(error);
      if (!data) return fail(new Error('Employee not found'));

      const emp = {
        id: data.id,
        employeeId: data.employee_id,
        name: data.full_name,
        email: data.user_profiles?.email || '',
        phone: data.phone || data.user_profiles?.phone || '',
        idNumber: data.id_number || '',
        birthDate: data.birth_date || '',
        address: data.address || '',
        emergencyContact: data.emergency_contact || '',
        site: data.construction_sites?.name || 'No asignado',
        supervisor: data.user_profiles?.full_name || 'No asignado',
        hireDate: data.hire_date,
        status: data.status,
        position: data.position,
        dailySalary: Number(data.daily_salary) || 0,
        hourlyRate: Number(data.hourly_rate) || 0,
        salaryType: data.salary_type || 'daily',
        lastAttendance: data.last_attendance_date,
        avatar: data.profile_picture_url || null,
        siteId: data.site_id,
        supervisorId: data.supervisor_id,
        userId: data.user_id,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      return ok(emp);
    } catch (e) {
      return fail(e);
    }
  }

  // Crear
  async createEmployee(employeeData) {
    try {
      const payload = {
        employee_id:   employeeData?.employeeId,
        full_name:     employeeData?.name,
        phone:         employeeData?.phone,
        id_number:     employeeData?.idNumber,
        birth_date:    employeeData?.birthDate,
        address:       employeeData?.address,
        emergency_contact: employeeData?.emergencyContact,
        site_id:       employeeData?.siteId,
        supervisor_id: employeeData?.supervisorId,
        hire_date:     employeeData?.hireDate,
        position:      employeeData?.position,
        daily_salary:  employeeData?.dailySalary ?? 0,
        hourly_rate:   employeeData?.hourlyRate ?? 0,
        salary_type:   employeeData?.salaryType || 'daily',
        status:        'active',
        user_id:       employeeData?.userId || null,
      };

      const { data, error } = await supabase
        .from('employee_profiles')
        .insert([payload])
        .select(EMP_BASE_COLS)
        .single();

      if (error) return fail(error);
      return ok(data);
    } catch (e) {
      return fail(e);
    }
  }

  // Actualizar
  async updateEmployee(employeeId, updates) {
    try {
      const updateData = {};
      if (updates?.name !== undefined)            updateData.full_name = updates.name;
      if (updates?.phone !== undefined)           updateData.phone = updates.phone;
      if (updates?.idNumber !== undefined)        updateData.id_number = updates.idNumber;
      if (updates?.birthDate !== undefined)       updateData.birth_date = updates.birthDate;
      if (updates?.address !== undefined)         updateData.address = updates.address;
      if (updates?.emergencyContact !== undefined)updateData.emergency_contact = updates.emergencyContact;
      if (updates?.siteId !== undefined)          updateData.site_id = updates.siteId;
      if (updates?.supervisorId !== undefined)    updateData.supervisor_id = updates.supervisorId;
      if (updates?.hireDate !== undefined)        updateData.hire_date = updates.hireDate;
      if (updates?.position !== undefined)        updateData.position = updates.position;
      if (updates?.dailySalary !== undefined)     updateData.daily_salary = updates.dailySalary;
      if (updates?.hourlyRate !== undefined)      updateData.hourly_rate = updates.hourlyRate;
      if (updates?.salaryType !== undefined)      updateData.salary_type = updates.salaryType;
      if (updates?.status !== undefined)          updateData.status = updates.status;

      const { data, error } = await supabase
        .from('employee_profiles')
        .update(updateData)
        .eq('id', employeeId)
        .select(EMP_BASE_COLS)
        .single();

      if (error) return fail(error);
      return ok(data);
    } catch (e) {
      return fail(e);
    }
  }

  // Soft delete (RPC coherente con tus otros servicios: p_employee_id)
  async deleteEmployee(employeeId, deletedByUserId) {
    try {
      const { data, error } = await supabase.rpc('soft_delete_employee', {
        p_employee_id: employeeId,
        // si tu función admite quién borró, úsalo; si no, quítalo:
        // p_deleted_by: deletedByUserId
      });
      if (error) return fail(error);
      return ok(data);
    } catch (e) {
      return fail(e);
    }
  }

  // Stats básicas
  async getEmployeeStats() {
    try {
      const { data, error } = await supabase
        .from('employee_profiles')
        .select('status, position')
        .is('deleted_at', null);

      if (error) return fail(error);

      const stats = {
        total: data?.length || 0,
        active: data?.filter((e) => e.status === 'active')?.length || 0,
        inactive: data?.filter((e) => e.status === 'inactive')?.length || 0,
        suspended: data?.filter((e) => e.status === 'suspended')?.length || 0,
        positions: {},
      };

      data?.forEach((e) => {
        if (e?.position) {
          stats.positions[e.position] = (stats.positions[e.position] || 0) + 1;
        }
      });

      return ok(stats);
    } catch (e) {
      return fail(e);
    }
  }

  // Sitios para filtros (ligero)
  async getSites() {
    try {
      const { data, error } = await supabase
        .from('construction_sites')
        .select('id, name, address, is_active')
        .order('name', { ascending: true });

      if (error) return fail(error);
      return ok(data || []);
    } catch (e) {
      return fail(e);
    }
  }

  // Supervisores para filtros (ligero)
  async getSupervisors() {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, full_name, email, phone, role')
        .in('role', ['supervisor', 'admin', 'superadmin'])
        .order('full_name', { ascending: true });

      if (error) return fail(error);
      return ok(data || []);
    } catch (e) {
      return fail(e);
    }
  }

  // Bulk update por IDs
  async bulkUpdateEmployees(employeeIds, updates) {
    try {
      const { data, error } = await supabase
        .from('employee_profiles')
        .update(updates)
        .in('id', employeeIds)
        .select(EMP_BASE_COLS);

      if (error) return fail(error);
      return ok(data);
    } catch (e) {
      return fail(e);
    }
  }

  // Obtener perfil de empleado por user_id (para vincular auth → empleado)
  async getEmployeeByUserId(userId) {
    try {
      const { data, error } = await supabase
        .from('employee_profiles')
        .select([EMP_BASE_COLS, NEST_SITE, NEST_SUPERVISOR].join(','))
        .eq('user_id', userId)
        .is('deleted_at', null)
        .single();

      // Si no existe, no es error fatal en algunas vistas
      if (error) {
        if (error.code === 'PGRST116') return ok(null);
        return fail(error);
      }

      return ok(data);
    } catch (e) {
      return fail(e);
    }
  }

  // Autocomplete / búsqueda rápida
  async searchEmployees(searchTerm, limit = 10) {
    try {
      if (!searchTerm || searchTerm.length < 2) {
        return ok([]);
      }

      const { data, error } = await supabase
        .from('employee_profiles')
        .select(
          [
            'id',
            'employee_id',
            'full_name',
            'site_id',
            // traer nombre del sitio para mostrar
            'construction_sites:site_id(name)',
          ].join(',')
        )
        .or(`full_name.ilike.%${searchTerm}%,employee_id.ilike.%${searchTerm}%`)
        .is('deleted_at', null)
        .eq('status', 'active')
        .order('full_name', { ascending: true })
        .limit(limit);

      if (error) return fail(error);

      const rows =
        (data || []).map((emp) => ({
          id: emp.id,
          employeeId: emp.employee_id,
          name: emp.full_name,
          site: emp.construction_sites?.name || 'No asignado',
        })) || [];

      return ok(rows);
    } catch (e) {
      return fail(e);
    }
  }
}

export default new EnhancedEmployeeService();
