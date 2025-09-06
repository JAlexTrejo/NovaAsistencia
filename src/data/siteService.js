import { supabase } from '../lib/supabase';

export const siteDataService = {
  // Get all construction sites
  async getSites() {
    try {
      const { data, error } = await supabase?.from('obras')?.select(`
          id,
          nombre,
          direccion,
          descripcion,
          activa,
          created_at,
          updated_at
        `)?.eq('activa', true)?.order('created_at', { ascending: false });

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
        error: error?.message || 'Error al cargar sitios'
      };
    }
  },

  // Create new construction site
  async createSite(siteData) {
    try {
      const { data, error } = await supabase?.from('obras')?.insert([{
          nombre: siteData?.nombre,
          direccion: siteData?.direccion,
          descripcion: siteData?.descripcion,
          activa: true
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
        error: error?.message || 'Error al crear sitio'
      };
    }
  },

  // Update construction site
  async updateSite(id, updateData) {
    try {
      const { data, error } = await supabase?.from('obras')?.update({
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
        error: error?.message || 'Error al actualizar sitio'
      };
    }
  }
};