import { supabase } from '../lib/supabase';

export const reportDataService = {
  // Get attendance reports
  async getAttendanceReport(filters = {}) {
    try {
      let query = supabase?.from('asistencias')?.select(`
          id,
          fecha_entrada,
          fecha_salida,
          horas_trabajadas,
          usuario_id,
          obra_id,
          usuarios:usuario_id(nombre, correo),
          obras:obra_id(nombre)
        `);

      // Apply date filters
      if (filters?.startDate) {
        query = query?.gte('fecha_entrada', filters?.startDate);
      }

      if (filters?.endDate) {
        query = query?.lte('fecha_entrada', filters?.endDate);
      }

      if (filters?.obra_id) {
        query = query?.eq('obra_id', filters?.obra_id);
      }

      const { data, error } = await query?.order('fecha_entrada', { ascending: false });

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
        error: error?.message || 'Error al generar reporte de asistencia'
      };
    }
  },

  // Get payroll report
  async getPayrollReport(filters = {}) {
    try {
      // This would need to be implemented with proper payroll calculations
      // For now, return basic employee data
      const { data, error } = await supabase?.from('usuarios')?.select(`
          id,
          nombre,
          correo,
          hourly_rate,
          puesto,
          obras:obra_id(nombre)
        `)?.eq('is_active', true);

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
        error: error?.message || 'Error al generar reporte de nómina'
      };
    }
  }
};