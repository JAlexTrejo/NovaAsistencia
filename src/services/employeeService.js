import { supabase } from '../lib/supabase';

export const employeeService = {
  // Get all employees (admin view)
  async getAllEmployees() {
    try {
      const { data, error } = await supabase?.from('employee_profiles')?.select(`
          id,
          employee_id,
          full_name,
          phone,
          daily_salary,
          hourly_rate,
          salary_type,
          status,
          hire_date,
          last_attendance_date,
          profile_picture_url,
          position,
          created_at,
          updated_at,
          deleted_at,
          user_profiles:user_id (
            email,
            role
          ),
          construction_sites:site_id (
            id,
            name,
            location
          ),
          supervisor:supervisor_id (
            full_name,
            email
          )
        `)?.order('created_at', { ascending: false });

      if (error) throw error;
      
      return data || [];
    } catch (error) {
      if (error?.message?.includes('Failed to fetch') || 
          error?.message?.includes('NetworkError') ||
          error?.name === 'TypeError' && error?.message?.includes('fetch')) {
        throw new Error('Cannot connect to database. Your Supabase project may be paused or deleted. Please visit your Supabase dashboard to check project status.');
      }
      throw new Error(`Failed to fetch employees: ${error.message}`);
    }
  },

  // Get employee by ID
  async getEmployeeById(employeeId) {
    try {
      const { data, error } = await supabase?.from('employee_profiles')?.select(`
          id,
          employee_id,
          full_name,
          phone,
          daily_salary,
          hourly_rate,
          salary_type,
          status,
          hire_date,
          last_attendance_date,
          profile_picture_url,
          position,
          address,
          birth_date,
          id_number,
          emergency_contact,
          created_at,
          updated_at,
          deleted_at,
          user_profiles:user_id (
            email,
            role
          ),
          construction_sites:site_id (
            id,
            name,
            location
          ),
          supervisor:supervisor_id (
            full_name,
            email
          )
        `)?.eq('id', employeeId)?.single();

      if (error) throw error;
      
      return data;
    } catch (error) {
      if (error?.message?.includes('Failed to fetch') || 
          error?.message?.includes('NetworkError') ||
          error?.name === 'TypeError' && error?.message?.includes('fetch')) {
        throw new Error('Cannot connect to database. Your Supabase project may be paused or deleted. Please visit your Supabase dashboard to check project status.');
      }
      throw new Error(`Failed to fetch employee: ${error.message}`);
    }
  },

  // Update employee profile
  async updateEmployee(employeeId, updates) {
    try {
      const { data, error } = await supabase?.from('employee_profiles')?.update(updates)?.eq('id', employeeId)?.select(`
          id,
          employee_id,
          full_name,
          phone,
          daily_salary,
          hourly_rate,
          salary_type,
          status,
          hire_date,
          last_attendance_date,
          profile_picture_url,
          position,
          created_at,
          updated_at
        `)?.single();

      if (error) throw error;
      
      return data;
    } catch (error) {
      if (error?.message?.includes('Failed to fetch') || 
          error?.message?.includes('NetworkError') ||
          error?.name === 'TypeError' && error?.message?.includes('fetch')) {
        throw new Error('Cannot connect to database. Your Supabase project may be paused or deleted. Please visit your Supabase dashboard to check project status.');
      }
      throw new Error(`Failed to update employee: ${error.message}`);
    }
  },

  // Get employees by site
  async getEmployeesBySite(siteId) {
    try {
      const { data, error } = await supabase?.from('employee_profiles')?.select(`
          id,
          employee_id,
          full_name,
          phone,
          daily_salary,
          position,
          status,
          user_profiles:user_id (email),
          supervisor:supervisor_id (full_name)
        `)?.eq('site_id', siteId)?.neq('status', 'deleted')?.order('full_name', { ascending: true });

      if (error) {
        return { success: false, error: error?.message };
      }

      return { success: true, employees: data };
    } catch (error) {
      return { success: false, error: 'Failed to fetch site employees' };
    }
  },

  // Get employees by supervisor
  async getEmployeesBySupervisor(supervisorId) {
    try {
      const { data, error } = await supabase?.from('employee_profiles')?.select(`
          id,
          employee_id,
          full_name,
          phone,
          daily_salary,
          position,
          status,
          user_profiles:user_id (email),
          construction_sites:site_id (name, location)
        `)?.eq('supervisor_id', supervisorId)?.neq('status', 'deleted')?.order('full_name', { ascending: true });

      if (error) {
        return { success: false, error: error?.message };
      }

      return { success: true, employees: data };
    } catch (error) {
      return { success: false, error: 'Failed to fetch supervisor employees' };
    }
  },

  // Deactivate employee
  async deactivateEmployee(employeeId) {
    try {
      const { data, error } = await supabase?.from('employee_profiles')?.update({ 
          status: 'inactive',
          updated_at: new Date()?.toISOString()
        })?.eq('id', employeeId)?.select()?.single();

      if (error) {
        return { success: false, error: error?.message };
      }

      return { success: true, employee: data };
    } catch (error) {
      return { success: false, error: 'Failed to deactivate employee' };
    }
  }
};

// Enhanced employee service with deletion functionality
export const deleteEmployee = async (employeeId) => {
  try {
    const { data, error } = await supabase?.rpc('soft_delete_employee', { p_employee_id: employeeId });

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    if (error?.message?.includes('Failed to fetch') || 
        error?.message?.includes('NetworkError') ||
        error?.name === 'TypeError' && error?.message?.includes('fetch')) {
      throw new Error('Cannot connect to database. Your Supabase project may be paused or deleted. Please visit your Supabase dashboard to check project status.');
    }
    throw new Error(`Error al eliminar empleado: ${error.message}`);
  }
};

export const restoreEmployee = async (employeeId) => {
  try {
    const { data, error } = await supabase?.from('employee_profiles')?.update({ 
        status: 'active',
        deleted_at: null,
        updated_at: new Date()?.toISOString()
      })?.eq('id', employeeId)?.select()?.single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    if (error?.message?.includes('Failed to fetch') || 
        error?.message?.includes('NetworkError') ||
        error?.name === 'TypeError' && error?.message?.includes('fetch')) {
      throw new Error('Cannot connect to database. Your Supabase project may be paused or deleted. Please visit your Supabase dashboard to check project status.');
    }
    throw new Error(`Error al restaurar empleado: ${error.message}`);
  }
};

export const getEmployeesWithFilters = async (filters = {}) => {
  try {
    let query = supabase?.from('employee_profiles')?.select(`
        *,
        user_profiles:user_id (email, role),
        construction_sites:site_id (name, location),
        supervisor:supervisor_id (full_name, email)
      `);

    // Apply filters
    if (filters?.status && filters?.status?.length > 0) {
      query = query?.in('status', filters?.status);
    } else {
      // By default, exclude deleted employees unless specifically requested
      if (!filters?.includeDeleted) {
        query = query?.neq('status', 'deleted');
      }
    }

    if (filters?.siteId) {
      query = query?.eq('site_id', filters?.siteId);
    }

    if (filters?.supervisorId) {
      query = query?.eq('supervisor_id', filters?.supervisorId);
    }

    if (filters?.search) {
      query = query?.or(`full_name.ilike.%${filters?.search}%,employee_id.ilike.%${filters?.search}%,id_number.ilike.%${filters?.search}%`);
    }

    if (filters?.hireDateFrom) {
      query = query?.gte('hire_date', filters?.hireDateFrom);
    }

    if (filters?.hireDateTo) {
      query = query?.lte('hire_date', filters?.hireDateTo);
    }

    // Ordering
    const sortColumn = filters?.sortColumn || 'full_name';
    const sortDirection = filters?.sortDirection || 'asc';
    query = query?.order(sortColumn, { ascending: sortDirection === 'asc' });

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    if (error?.message?.includes('Failed to fetch') || 
        error?.message?.includes('NetworkError') ||
        error?.name === 'TypeError' && error?.message?.includes('fetch')) {
      throw new Error('Cannot connect to database. Your Supabase project may be paused or deleted. Please visit your Supabase dashboard to check project status.');
    }
    throw new Error(`Error al cargar empleados: ${error.message}`);
  }
};

export default employeeService;