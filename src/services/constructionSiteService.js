import { supabase } from '../lib/supabase';

export const constructionSiteService = {
  // Get all construction sites with GPS information
  async getAllSites() {
    try {
      const { data, error } = await supabase
        ?.from('construction_sites')
        ?.select('*')
        ?.order('name', { ascending: true })

      if (error) {
        return { success: false, error: error?.message };
      }

      return { success: true, sites: data }
    } catch (error) {
      return { success: false, error: 'Error al obtener sitios de construcción' }
    }
  },

  // Get site by ID with GPS configuration
  async getSiteById(siteId) {
    try {
      const { data, error } = await supabase
        ?.from('construction_sites')
        ?.select('*')
        ?.eq('id', siteId)
        ?.single()

      if (error) {
        return { success: false, error: error?.message };
      }

      return { success: true, site: data }
    } catch (error) {
      return { success: false, error: 'Error al obtener detalles del sitio' }
    }
  },

  // Create new construction site with GPS coordinates
  async createSite(siteData) {
    try {
      const { data, error } = await supabase
        ?.from('construction_sites')
        ?.insert({
          name: siteData?.name,
          location: siteData?.location,
          description: siteData?.description,
          latitude: siteData?.latitude,
          longitude: siteData?.longitude,
          allowed_radius_meters: siteData?.allowed_radius_meters || 15,
          gps_enabled: siteData?.gps_enabled !== false // Default to true
        })
        ?.select()
        ?.single()

      if (error) {
        return { success: false, error: error?.message };
      }

      return { success: true, site: data }
    } catch (error) {
      return { success: false, error: 'Error al crear sitio de construcción' }
    }
  },

  // Update construction site including GPS settings
  async updateSite(siteId, updates) {
    try {
      const { data, error } = await supabase
        ?.from('construction_sites')
        ?.update({
          ...updates,
          updated_at: new Date()?.toISOString()
        })
        ?.eq('id', siteId)
        ?.select()
        ?.single()

      if (error) {
        return { success: false, error: error?.message };
      }

      return { success: true, site: data }
    } catch (error) {
      return { success: false, error: 'Error al actualizar sitio' }
    }
  },

  // Update GPS configuration for a site
  async updateGPSConfiguration(siteId, gpsConfig) {
    try {
      const { data, error } = await supabase
        ?.from('construction_sites')
        ?.update({
          latitude: gpsConfig?.latitude,
          longitude: gpsConfig?.longitude,
          allowed_radius_meters: gpsConfig?.allowed_radius_meters || 15,
          gps_enabled: gpsConfig?.gps_enabled !== false,
          updated_at: new Date()?.toISOString()
        })
        ?.eq('id', siteId)
        ?.select()
        ?.single()

      if (error) {
        return { success: false, error: error?.message };
      }

      return { success: true, site: data }
    } catch (error) {
      return { success: false, error: 'Error al actualizar configuración GPS' }
    }
  },

  // Validate if a location is within site boundaries
  async validateLocationForSite(latitude, longitude, siteId) {
    try {
      const { data, error } = await supabase
        ?.rpc('validate_location_within_site', {
          employee_lat: latitude,
          employee_lon: longitude,
          site_uuid: siteId
        })

      if (error) {
        return { success: false, error: error?.message };
      }

      return { success: true, validation: data?.[0] || { dentro_del_rango: false } }
    } catch (error) {
      return { success: false, error: 'Error al validar ubicación' }
    }
  },

  // Get sites with current employee assignments
  async getSitesWithAssignments() {
    try {
      const { data, error } = await supabase
        ?.from('construction_sites')
        ?.select(`
          *,
          employee_assignments!inner (
            id,
            is_active,
            user_profiles (
              id,
              full_name,
              employee_id
            )
          )
        `)
        ?.eq('employee_assignments.is_active', true)
        ?.order('name', { ascending: true })

      if (error) {
        return { success: false, error: error?.message };
      }

      return { success: true, sites: data }
    } catch (error) {
      return { success: false, error: 'Error al obtener sitios con asignaciones' }
    }
  },

  // Get GPS-enabled sites only
  async getGPSEnabledSites() {
    try {
      const { data, error } = await supabase
        ?.from('construction_sites')
        ?.select('*')
        ?.eq('gps_enabled', true)
        ?.not('latitude', 'is', null)
        ?.not('longitude', 'is', null)
        ?.order('name', { ascending: true })

      if (error) {
        return { success: false, error: error?.message };
      }

      return { success: true, sites: data }
    } catch (error) {
      return { success: false, error: 'Error al obtener sitios con GPS habilitado' }
    }
  },

  // Deactivate site
  async deactivateSite(siteId) {
    try {
      const { data, error } = await supabase
        ?.from('construction_sites')
        ?.update({ 
          is_active: false,
          updated_at: new Date()?.toISOString()
        })
        ?.eq('id', siteId)
        ?.select()
        ?.single()

      if (error) {
        return { success: false, error: error?.message };
      }

      return { success: true, site: data }
    } catch (error) {
      return { success: false, error: 'Error al desactivar sitio' }
    }
  }
}