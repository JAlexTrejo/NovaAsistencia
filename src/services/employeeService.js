import { supabase } from '../lib/supabase';

export const employeeService = {
  // Get all employees (admin view)
  async getAllEmployees() {
    try {
      const { data, error } = await // Using 'usuarios' table
      supabase?.from('usuarios')?.select(`
          id,
          correo,
          nombre,
          telefono,
          rol,
          activo,
          obra_id,
          created_at,
          updated_at,
          obras:obra_id (
            id,
            nombre,
            direccion
          )
        `)?.order('created_at', { ascending: false });

      if (error) throw error;
      
      // Map the data to match expected structure
      return data?.map(employee => ({
        id: employee?.id,
        email: employee?.correo,
        full_name: employee?.nombre,
        phone: employee?.telefono,
        role: employee?.rol,
        is_active: employee?.activo,
        obra_id: employee?.obra_id,
        created_at: employee?.created_at,
        updated_at: employee?.updated_at,
        construction_site: employee?.obras
      })) || [];
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
      const { data, error } = await // Using 'usuarios' table
      supabase?.from('usuarios')?.select(`
          id,
          correo,
          nombre,
          telefono,
          rol,
          activo,
          obra_id,
          created_at,
          updated_at,
          obras:obra_id (
            id,
            nombre,
            direccion
          )
        `)?.eq('id', employeeId)?.single();

      if (error) throw error;
      
      // Map the data to match expected structure
      return {
        id: data?.id,
        email: data?.correo,
        full_name: data?.nombre,
        phone: data?.telefono,
        role: data?.rol,
        is_active: data?.activo,
        obra_id: data?.obra_id,
        created_at: data?.created_at,
        updated_at: data?.updated_at,
        construction_site: data?.obras
      };
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
      // Map the field names to match the usuarios table structure
      const mappedUpdates = {};
      if (updates?.email) mappedUpdates.correo = updates?.email;
      if (updates?.full_name) mappedUpdates.nombre = updates?.full_name;
      if (updates?.phone) mappedUpdates.telefono = updates?.phone;
      if (updates?.role) mappedUpdates.rol = updates?.role;
      if (updates?.is_active !== undefined) mappedUpdates.activo = updates?.is_active;
      if (updates?.obra_id !== undefined) mappedUpdates.obra_id = updates?.obra_id;

      const { data, error } = await // Using 'usuarios' table
      supabase?.from('usuarios')?.update(mappedUpdates)?.eq('id', employeeId)?.select(`
          id,
          correo,
          nombre,
          telefono,
          rol,
          activo,
          obra_id,
          created_at,
          updated_at
        `)?.single();

      if (error) throw error;
      
      // Map the response back to expected structure
      return {
        id: data?.id,
        email: data?.correo,
        full_name: data?.nombre,
        phone: data?.telefono,
        role: data?.rol,
        is_active: data?.activo,
        obra_id: data?.obra_id,
        created_at: data?.created_at,
        updated_at: data?.updated_at
      };
    } catch (error) {
      if (error?.message?.includes('Failed to fetch') || 
          error?.message?.includes('NetworkError') ||
          error?.name === 'TypeError' && error?.message?.includes('fetch')) {
        throw new Error('Cannot connect to database. Your Supabase project may be paused or deleted. Please visit your Supabase dashboard to check project status.');
      }
      throw new Error(`Failed to update employee: ${error.message}`);
    }
  },

  // Assign employee to site and supervisor
  async assignEmployee(employeeId, siteId, supervisorId) {
    try {
      // First, deactivate any existing assignments
      await supabase?.from('employee_assignments')?.update({ is_active: false })?.eq('employee_id', employeeId)

      // Create new assignment
      const { data, error } = await supabase?.from('employee_assignments')?.insert({
          employee_id: employeeId,
          site_id: siteId,
          supervisor_id: supervisorId,
          is_active: true
        })?.select(`
          *,
          construction_sites (
            name,
            location
          ),
          supervisors (
            name,
            phone
          )
        `)?.single()

      if (error) {
        return { success: false, error: error?.message };
      }

      return { success: true, assignment: data }
    } catch (error) {
      return { success: false, error: 'Failed to assign employee' }
    }
  },

  // Get employees by site
  async getEmployeesBySite(siteId) {
    try {
      const { data, error } = await supabase?.from('employee_assignments')?.select(`
          *,
          user_profiles (
            id,
            full_name,
            employee_id,
            phone,
            daily_salary
          ),
          supervisors (
            name,
            phone
          )
        `)?.eq('site_id', siteId)?.eq('is_active', true)?.order('user_profiles(full_name)', { ascending: true })

      if (error) {
        return { success: false, error: error?.message };
      }

      return { success: true, assignments: data }
    } catch (error) {
      return { success: false, error: 'Failed to fetch site employees' }
    }
  },

  // Get employees by supervisor
  async getEmployeesBySupervisor(supervisorId) {
    try {
      const { data, error } = await supabase?.from('employee_assignments')?.select(`
          *,
          user_profiles (
            id,
            full_name,
            employee_id,
            phone,
            daily_salary
          ),
          construction_sites (
            name,
            location
          )
        `)?.eq('supervisor_id', supervisorId)?.eq('is_active', true)?.order('user_profiles(full_name)', { ascending: true })

      if (error) {
        return { success: false, error: error?.message };
      }

      return { success: true, assignments: data }
    } catch (error) {
      return { success: false, error: 'Failed to fetch supervisor employees' }
    }
  },

  // Deactivate employee
  async deactivateEmployee(employeeId) {
    try {
      const { data, error } = await supabase?.from('user_profiles')?.update({ 
          is_active: false,
          updated_at: new Date()?.toISOString()
        })?.eq('id', employeeId)?.select()?.single()

      if (error) {
        return { success: false, error: error?.message };
      }

      // Also deactivate assignments
      await supabase?.from('employee_assignments')?.update({ is_active: false })?.eq('employee_id', employeeId)

      return { success: true, employee: data }
    } catch (error) {
      return { success: false, error: 'Failed to deactivate employee' }
    }
  }
}