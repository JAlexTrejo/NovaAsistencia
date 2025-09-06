import { supabase } from '../lib/supabase';

export const employeeDataService = {
  // Get all employees with detailed information
  async getEmployees(filters = {}) {
    try {
      let query = supabase?.from('usuarios')?.select(`
          id,
          correo,
          nombre,
          telefono,
          rol,
          is_active,
          obra_id,
          supervisor_id,
          puesto,
          hourly_rate,
          created_at,
          updated_at,
          obras:obra_id(id, nombre, direccion),
          supervisor:usuarios!supervisor_id(id, nombre, correo)
        `)?.eq('is_active', true);

      // Apply filters
      if (filters?.role) {
        query = query?.eq('rol', filters?.role);
      }
      
      if (filters?.obra_id) {
        query = query?.eq('obra_id', filters?.obra_id);
      }

      if (filters?.search) {
        query = query?.or(`nombre.ilike.%${filters?.search}%,correo.ilike.%${filters?.search}%`);
      }

      const { data, error } = await query?.order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return {
        success: true,
        data: data?.map(emp => ({
          id: emp?.id,
          name: emp?.nombre,
          email: emp?.correo,
          phone: emp?.telefono,
          puesto: emp?.puesto || 'No asignado',
          sitio_asignado: emp?.obras?.nombre || 'No asignado',
          supervisor_id: emp?.supervisor_id,
          hourly_rate: emp?.hourly_rate || 0,
          status: emp?.is_active ? 'active' : 'inactive',
          role: emp?.rol,
          obra_id: emp?.obra_id,
          created_at: emp?.created_at,
          updated_at: emp?.updated_at
        })) || []
      };
    } catch (error) {
      return {
        success: false,
        error: error?.message || 'Error al cargar empleados'
      };
    }
  },

  // Create new employee
  async createEmployee(employeeData) {
    try {
      const { data, error } = await supabase?.from('usuarios')?.insert([{
          correo: employeeData?.email,
          nombre: employeeData?.name,
          telefono: employeeData?.phone,
          puesto: employeeData?.puesto,
          obra_id: employeeData?.obra_id,
          supervisor_id: employeeData?.supervisor_id,
          hourly_rate: employeeData?.hourly_rate || 0,
          rol: employeeData?.role || 'user',
          is_active: true
        }])?.select()?.single();

      if (error) {
        throw error;
      }

      return {
        success: true,
        data: data
      };
    } catch (error) {
      return {
        success: false,
        error: error?.message || 'Error al crear empleado'
      };
    }
  },

  // Update employee
  async updateEmployee(id, updateData) {
    try {
      const { data, error } = await supabase?.from('usuarios')?.update({
          ...updateData,
          updated_at: new Date()?.toISOString()
        })?.eq('id', id)?.select()?.single();

      if (error) {
        throw error;
      }

      return {
        success: true,
        data: data
      };
    } catch (error) {
      return {
        success: false,
        error: error?.message || 'Error al actualizar empleado'
      };
    }
  },

  // Delete employee (soft delete)
  async deleteEmployee(id) {
    try {
      const { data, error } = await supabase?.from('usuarios')?.update({ 
          is_active: false,
          updated_at: new Date()?.toISOString()
        })?.eq('id', id)?.select()?.single();

      if (error) {
        throw error;
      }

      return {
        success: true,
        data: data
      };
    } catch (error) {
      return {
        success: false,
        error: error?.message || 'Error al eliminar empleado'
      };
    }
  }
};