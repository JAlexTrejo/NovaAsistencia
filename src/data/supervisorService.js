import { supabase } from '../lib/supabase';

export const supervisorDataService = {
  // Get all supervisors
  async getSupervisors() {
    try {
      const { data, error } = await supabase?.from('usuarios')?.select(`
          id,
          nombre,
          correo,
          telefono,
          obra_id,
          obras:obra_id(id, nombre, direccion)
        `)?.in('rol', ['supervisor', 'admin', 'superadmin'])?.eq('is_active', true)?.order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return {
        success: true,
        data: data || []
      };
    } catch (error) {
      return {
        success: false,
        error: error?.message || 'Error al cargar supervisores'
      };
    }
  },

  // Get employees under a supervisor
  async getEmployeesBySupervisor(supervisorId) {
    try {
      const { data, error } = await supabase?.from('usuarios')?.select(`
          id,
          nombre,
          correo,
          puesto,
          obra_id,
          obras:obra_id(nombre)
        `)?.eq('supervisor_id', supervisorId)?.eq('is_active', true);

      if (error) {
        throw error;
      }

      return {
        success: true,
        data: data || []
      };
    } catch (error) {
      return {
        success: false,
        error: error?.message || 'Error al cargar empleados del supervisor'
      };
    }
  }
};