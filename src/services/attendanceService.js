import { supabase } from '../lib/supabase';

export const attendanceService = {
  // Register attendance action with enhanced GPS validation
  async registerAttendance(employeeId, siteId, action, location = null, registeredBy = null) {
    try {
      const today = new Date()?.toISOString()?.split('T')?.[0]
      
      // Get site GPS configuration
      const { data: siteData, error: siteError } = await supabase
        ?.from('construction_sites')
        ?.select('latitude, longitude, allowed_radius_meters, gps_enabled')
        ?.eq('id', siteId)
        ?.single()

      if (siteError) {
        return { success: false, error: 'No se pudo verificar la configuración del sitio' };
      }

      // Validate GPS if location provided and site has GPS enabled
      let locationValidation = { dentro_del_rango: true, distancia_metros: null }
      let locationError = null

      if (location && siteData?.gps_enabled && siteData?.latitude && siteData?.longitude) {
        const [userLat, userLon] = location?.split(',')?.map(coord => parseFloat(coord?.trim()))
        
        if (userLat && userLon) {
          // Call validation function
          const { data: validation, error: validationError } = await supabase
            ?.rpc('validate_location_within_site', {
              employee_lat: userLat,
              employee_lon: userLon,
              site_uuid: siteId
            })

          if (validationError) {
            console.log('GPS validation error:', validationError)
            locationError = 'No se pudo validar la ubicación GPS'
          } else if (validation && validation?.length > 0) {
            locationValidation = validation?.[0]
            
            // Check if user is outside allowed area
            if (!locationValidation?.dentro_del_rango) {
              return { 
                success: false, 
                error: `Estás fuera de la zona permitida. Distancia: ${locationValidation?.distancia_metros}m, Radio permitido: ${locationValidation?.radio_permitido}m. No se puede registrar la asistencia.`,
                validation: locationValidation
              };
            }
          }
        } else {
          locationError = 'Coordenadas GPS inválidas'
        }
      }

      // First, get or create today's attendance record
      let { data: existingRecord, error: fetchError } = await supabase
        ?.from('attendance_records')
        ?.select('*')
        ?.eq('employee_id', employeeId)
        ?.eq('date', today)
        ?.single()

      if (fetchError && fetchError?.code !== 'PGRST116') {
        return { success: false, error: fetchError?.message };
      }

      const updateData = {
        [action]: new Date()?.toISOString(),
        updated_at: new Date()?.toISOString()
      }

      // Add location data for entrada/salida
      if (action === 'entrada' && location) {
        updateData.location_entrada = location
      }
      if (action === 'salida' && location) {
        updateData.location_salida = location
      }

      // Add supervisor tracking if registered by someone else
      if (registeredBy && registeredBy !== employeeId) {
        updateData.checkin_realizado_por = registeredBy
        
        // If supervisor has location, save it
        if (location) {
          const [supLat, supLon] = location?.split(',')?.map(coord => parseFloat(coord?.trim()))
          if (supLat && supLon) {
            updateData.supervisor_latitude = supLat
            updateData.supervisor_longitude = supLon
          }
        }
      }

      let result
      if (existingRecord) {
        // Update existing record
        const { data, error } = await supabase
          ?.from('attendance_records')
          ?.update(updateData)
          ?.eq('id', existingRecord?.id)
          ?.select()
          ?.single()
        
        result = { data, error }
      } else {
        // Create new record
        const { data, error } = await supabase
          ?.from('attendance_records')
          ?.insert({
            employee_id: employeeId,
            site_id: siteId,
            date: today,
            ...updateData
          })
          ?.select()
          ?.single()
        
        result = { data, error }
      }

      if (result?.error) {
        return { success: false, error: result?.error?.message };
      }

      return { 
        success: true, 
        record: result?.data,
        locationValidation,
        locationError
      };
    } catch (error) {
      return { success: false, error: 'Error al registrar asistencia' }
    }
  },

  // Get employee's attendance with location validation flags
  async getEmployeeAttendance(employeeId, startDate, endDate) {
    try {
      const { data, error } = await supabase
        ?.from('attendance_records')
        ?.select(`
          *,
          construction_sites (
            name,
            location,
            latitude,
            longitude,
            allowed_radius_meters
          ),
          checkin_realizado_por:user_profiles!checkin_realizado_por (
            full_name,
            employee_id
          )
        `)
        ?.eq('employee_id', employeeId)
        ?.gte('date', startDate)
        ?.lte('date', endDate)
        ?.order('date', { ascending: false })

      if (error) {
        return { success: false, error: error?.message };
      }

      return { success: true, records: data }
    } catch (error) {
      return { success: false, error: 'Error al obtener registros de asistencia' }
    }
  },

  // Get today's attendance status for an employee
  async getTodayAttendance(employeeId) {
    try {
      const today = new Date()?.toISOString()?.split('T')?.[0]
      
      const { data, error } = await supabase
        ?.from('attendance_records')
        ?.select('*')
        ?.eq('employee_id', employeeId)
        ?.eq('date', today)
        ?.single()

      if (error && error?.code !== 'PGRST116') {
        return { success: false, error: error?.message };
      }

      return { success: true, record: data }
    } catch (error) {
      return { success: false, error: 'Error al obtener asistencia de hoy' }
    }
  },

  // Get attendance records for all employees with GPS validation info
  async getAllAttendanceRecords(startDate, endDate, siteId = null) {
    try {
      let query = supabase
        ?.from('attendance_records')
        ?.select(`
          *,
          user_profiles (
            full_name,
            employee_id
          ),
          construction_sites (
            name,
            location,
            latitude,
            longitude,
            allowed_radius_meters
          ),
          checkin_realizado_por:user_profiles!checkin_realizado_por (
            full_name,
            employee_id
          )
        `)
        ?.gte('date', startDate)
        ?.lte('date', endDate)
        ?.order('date', { ascending: false })

      if (siteId) {
        query = query?.eq('site_id', siteId)
      }

      const { data, error } = await query

      if (error) {
        return { success: false, error: error?.message };
      }

      return { success: true, records: data }
    } catch (error) {
      return { success: false, error: 'Error al obtener registros de asistencia' }
    }
  },

  // Get weekly summary for an employee
  async getWeeklySummary(employeeId, weekStart) {
    try {
      const weekEnd = new Date(weekStart)
      weekEnd?.setDate(weekEnd?.getDate() + 6)

      const { data, error } = await supabase
        ?.from('attendance_records')
        ?.select('*')
        ?.eq('employee_id', employeeId)
        ?.gte('date', weekStart?.toISOString()?.split('T')?.[0])
        ?.lte('date', weekEnd?.toISOString()?.split('T')?.[0])
        ?.order('date', { ascending: true })

      if (error) {
        return { success: false, error: error?.message };
      }

      // Calculate weekly totals
      const totalHours = data?.reduce((sum, record) => sum + (record?.total_hours || 0), 0) || 0
      const daysWorked = data?.filter(record => record?.is_complete)?.length || 0

      return { 
        success: true, 
        records: data,
        summary: {
          totalHours,
          daysWorked,
          weekStart: weekStart?.toISOString()?.split('T')?.[0],
          weekEnd: weekEnd?.toISOString()?.split('T')?.[0]
        }
      };
    } catch (error) {
      return { success: false, error: 'Error al obtener resumen semanal' }
    }
  },

  // New method: Register attendance by supervisor
  async registerAttendanceAsSupervisor(supervisorId, employeeId, siteId, action, supervisorLocation = null) {
    try {
      return await this.registerAttendance(employeeId, siteId, action, supervisorLocation, supervisorId)
    } catch (error) {
      return { success: false, error: 'Error al registrar asistencia como supervisor' }
    }
  },

  // New method: Get GPS validation for a location
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
      return { success: false, error: 'Error al validar ubicación GPS' }
    }
  }
};

// Update getAttendanceRecords to use correct table references
export const getAttendanceRecords = async (filters = {}) => {
  try {
    let query = supabase?.from('asistencias')?.select(`
        id,
        usuario_id,
        obra_id,
        fecha,
        hora_entrada,
        hora_salida,
        ubicacion_entrada,
        ubicacion_salida,
        nota,
        created_at,
        usuarios:usuario_id (
          id,
          correo,
          nombre
        ),
        obras:obra_id (
          id,
          nombre,
          direccion
        )
      `);

    // Apply filters
    if (filters?.startDate) {
      query = query?.gte('fecha', filters?.startDate);
    }
    if (filters?.endDate) {
      query = query?.lte('fecha', filters?.endDate);
    }
    if (filters?.employeeId) {
      query = query?.eq('usuario_id', filters?.employeeId);
    }
    if (filters?.obraId) {
      query = query?.eq('obra_id', filters?.obraId);
    }

    const { data, error } = await query?.order('fecha', { ascending: false });

    if (error) throw error;
    
    // Map the data to match expected structure
    return data?.map(record => ({
      id: record?.id,
      usuario_id: record?.usuario_id,
      obra_id: record?.obra_id,
      fecha: record?.fecha,
      hora_entrada: record?.hora_entrada,
      hora_salida: record?.hora_salida,
      ubicacion_entrada: record?.ubicacion_entrada,
      ubicacion_salida: record?.ubicacion_salida,
      nota: record?.nota,
      created_at: record?.created_at,
      employee: record?.usuarios ? {
        id: record?.usuarios?.id,
        email: record?.usuarios?.correo,
        full_name: record?.usuarios?.nombre
      } : null,
      construction_site: record?.obras
    })) || [];
  } catch (error) {
    if (error?.message?.includes('Failed to fetch') || 
        error?.message?.includes('NetworkError') ||
        error?.name === 'TypeError' && error?.message?.includes('fetch')) {
      throw new Error('Cannot connect to database. Your Supabase project may be paused or deleted. Please visit your Supabase dashboard to check project status.');
    }
    throw new Error(`Failed to fetch attendance records: ${error.message}`);
  }
};

// Update getUserAttendanceRecords to use correct table references
export const getUserAttendanceRecords = async (userId, filters = {}) => {
  try {
    let query = supabase?.from('asistencias')?.select(`
        id,
        usuario_id,
        obra_id,
        fecha,
        hora_entrada,
        hora_salida,
        ubicacion_entrada,
        ubicacion_salida,
        nota,
        created_at,
        obras:obra_id (
          id,
          nombre,
          direccion
        )
      `)?.eq('usuario_id', userId);

    // Apply additional filters
    if (filters?.startDate) {
      query = query?.gte('fecha', filters?.startDate);
    }
    if (filters?.endDate) {
      query = query?.lte('fecha', filters?.endDate);
    }

    const { data, error } = await query?.order('fecha', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    if (error?.message?.includes('Failed to fetch') || 
        error?.message?.includes('NetworkError') ||
        error?.name === 'TypeError' && error?.message?.includes('fetch')) {
      throw new Error('Cannot connect to database. Your Supabase project may be paused or deleted. Please visit your Supabase dashboard to check project status.');
    }
    throw new Error(`Failed to fetch user attendance records: ${error.message}`);
  }
};