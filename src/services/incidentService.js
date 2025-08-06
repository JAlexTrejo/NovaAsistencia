import { supabase } from '../lib/supabase';

export const incidentService = {
  // Create new incident with file attachments
  async createIncident(incidentData, attachmentFiles = []) {
    try {
      const { data: incident, error: incidentError } = await supabase
        ?.from('incidents')
        ?.insert({
          employee_id: incidentData?.employee_id,
          type: incidentData?.type,
          date: incidentData?.date,
          description: incidentData?.description,
          status: 'pendiente',
          attachment_count: attachmentFiles?.length || 0
        })
        ?.select()
        ?.single()

      if (incidentError) {
        return { success: false, error: incidentError?.message };
      }

      // Upload attachments if provided
      let uploadedUrls = []
      if (attachmentFiles?.length > 0) {
        const uploadResult = await this.uploadIncidentAttachments(
          incident?.id, 
          incidentData?.employee_id, 
          attachmentFiles
        )
        
        if (!uploadResult?.success) {
          // Delete incident if file upload fails
          await supabase?.from('incidents')?.delete()?.eq('id', incident?.id)
          return { success: false, error: uploadResult?.error };
        }
        
        uploadedUrls = uploadResult?.urls || []
        
        // Update incident with attachment URLs
        const { error: updateError } = await supabase
          ?.from('incidents')
          ?.update({ 
            attachment_urls: uploadedUrls,
            attachment_count: uploadedUrls?.length 
          })
          ?.eq('id', incident?.id)

        if (updateError) {
          return { success: false, error: updateError?.message };
        }
      }

      return { 
        success: true, 
        incident: { 
          ...incident, 
          attachment_urls: uploadedUrls,
          attachment_count: uploadedUrls?.length 
        } 
      };
    } catch (error) {
      return { success: false, error: 'Error al crear incidencia' }
    }
  },

  // Upload incident attachments to Supabase Storage
  async uploadIncidentAttachments(incidentId, employeeId, files) {
    try {
      const uploadPromises = files?.map(async (file, index) => {
        const fileExt = file?.name?.split('.')?.pop()
        const fileName = `${incidentId}_${index + 1}_${Date.now()}.${fileExt}`
        const filePath = `${employeeId}/${fileName}`

        const { data, error } = await supabase?.storage
          ?.from('incident-attachments')
          ?.upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          })

        if (error) {
          throw new Error(`Error uploading ${file?.name}: ${error?.message}`)
        }

        // Get public URL
        const { data: urlData } = supabase?.storage
          ?.from('incident-attachments')
          ?.getPublicUrl(filePath)

        return urlData?.publicUrl
      })

      const urls = await Promise.all(uploadPromises)
      return { success: true, urls }
    } catch (error) {
      return { success: false, error: error?.message || 'Error al subir archivos' }
    }
  },

  // Get incident attachments
  async getIncidentAttachments(incidentId) {
    try {
      const { data, error } = await supabase
        ?.from('incidents')
        ?.select('attachment_urls, attachment_count')
        ?.eq('id', incidentId)
        ?.single()

      if (error) {
        return { success: false, error: error?.message };
      }

      return { success: true, attachments: data?.attachment_urls || [] }
    } catch (error) {
      return { success: false, error: 'Error al obtener archivos adjuntos' }
    }
  },

  // Get all incidents (admin view)
  async getAllIncidents(startDate = null, endDate = null, status = null, employeeId = null) {
    try {
      let query = supabase
        ?.from('incidents')
        ?.select(`
          *,
          user_profiles!incidents_employee_id_fkey (
            full_name,
            employee_id
          ),
          approved_by_profile:user_profiles!incidents_approved_by_fkey (
            full_name
          )
        `)
        ?.order('created_at', { ascending: false })

      if (startDate) {
        query = query?.gte('date', startDate)
      }
      if (endDate) {
        query = query?.lte('date', endDate)
      }
      if (status && status !== 'all') {
        query = query?.eq('status', status)
      }
      if (employeeId) {
        query = query?.eq('employee_id', employeeId)
      }

      const { data, error } = await query

      if (error) {
        return { success: false, error: error?.message };
      }

      return { success: true, incidents: data }
    } catch (error) {
      return { success: false, error: 'Error al obtener incidencias' }
    }
  },

  // Get employee's incidents
  async getEmployeeIncidents(employeeId, startDate = null, endDate = null) {
    try {
      let query = supabase
        ?.from('incidents')
        ?.select(`
          *,
          approved_by_profile:user_profiles!incidents_approved_by_fkey (
            full_name
          )
        `)
        ?.eq('employee_id', employeeId)
        ?.order('created_at', { ascending: false })

      if (startDate) {
        query = query?.gte('date', startDate)
      }
      if (endDate) {
        query = query?.lte('date', endDate)
      }

      const { data, error } = await query

      if (error) {
        return { success: false, error: error?.message };
      }

      return { success: true, incidents: data }
    } catch (error) {
      return { success: false, error: 'Error al obtener incidencias del empleado' }
    }
  },

  // Approve or reject incident
  async updateIncidentStatus(incidentId, status, approvedBy, comments = null) {
    try {
      const updateData = {
        status,
        approved_by: approvedBy,
        approved_at: new Date()?.toISOString(),
        updated_at: new Date()?.toISOString()
      }

      if (comments) {
        updateData.approval_comments = comments
      }

      const { data, error } = await supabase?.from('incidents')?.update(updateData)?.eq('id', incidentId)?.select(`
          *,
          user_profiles (
            full_name,
            employee_id
          ),
          approved_by_profile:user_profiles!incidents_approved_by_fkey (
            full_name
          )
        `)?.single()

      if (error) {
        return { success: false, error: error?.message };
      }

      return { success: true, incident: data }
    } catch (error) {
      return { success: false, error: 'Failed to update incident status' }
    }
  },

  // Get incidents by date range
  async getIncidentsByDateRange(startDate, endDate, employeeId = null) {
    try {
      let query = supabase?.from('incidents')?.select(`
          *,
          user_profiles (
            full_name,
            employee_id
          )
        `)?.gte('date', startDate)?.lte('date', endDate)?.order('date', { ascending: false })

      if (employeeId) {
        query = query?.eq('employee_id', employeeId)
      }

      const { data, error } = await query

      if (error) {
        return { success: false, error: error?.message };
      }

      return { success: true, incidents: data }
    } catch (error) {
      return { success: false, error: 'Failed to fetch incidents by date range' }
    }
  },

  // Delete incident (only for pending incidents)
  async deleteIncident(incidentId) {
    try {
      // First, get incident details to delete attachments
      const { data: incident } = await supabase
        ?.from('incidents')
        ?.select('attachment_urls, employee_id')
        ?.eq('id', incidentId)
        ?.single()

      // Delete attachments from storage
      if (incident?.attachment_urls?.length > 0) {
        const filePaths = incident?.attachment_urls?.map(url => {
          const urlParts = url?.split('/')
          return `${incident?.employee_id}/${urlParts?.[urlParts?.length - 1]}`
        })

        await supabase?.storage
          ?.from('incident-attachments')
          ?.remove(filePaths)
      }

      // Delete incident record
      const { error } = await supabase
        ?.from('incidents')
        ?.delete()
        ?.eq('id', incidentId)

      if (error) {
        return { success: false, error: error?.message };
      }

      return { success: true }
    } catch (error) {
      return { success: false, error: 'Failed to delete incident' }
    }
  },

  // Get incident statistics
  async getIncidentStats(startDate, endDate) {
    try {
      const { data, error } = await supabase?.from('incidents')?.select('type, status')?.gte('date', startDate)?.lte('date', endDate)

      if (error) {
        return { success: false, error: error?.message };
      }

      // Calculate statistics
      const stats = {
        total: data?.length || 0,
        byType: {},
        byStatus: {},
        pending: 0,
        approved: 0,
        rejected: 0
      }

      data?.forEach(incident => {
        // Count by type
        stats.byType[incident.type] = (stats?.byType?.[incident?.type] || 0) + 1
        
        // Count by status
        stats.byStatus[incident.status] = (stats?.byStatus?.[incident?.status] || 0) + 1
        
        // Count specific statuses
        if (incident?.status === 'pendiente') stats.pending++
        if (incident?.status === 'aprobada') stats.approved++
        if (incident?.status === 'rechazada') stats.rejected++
      })

      return { success: true, stats }
    } catch (error) {
      return { success: false, error: 'Failed to fetch incident statistics' }
    }
  },

  // Approve incident
  async approveIncident(incidentId, approvedBy, decision = 'aprobada') {
    try {
      const { data, error } = await supabase
        ?.from('incidents')
        ?.update({
          status: decision,
          approved_by: approvedBy,
          approved_at: new Date()?.toISOString(),
          updated_at: new Date()?.toISOString()
        })
        ?.eq('id', incidentId)
        ?.select()
        ?.single()

      if (error) {
        return { success: false, error: error?.message };
      }

      return { success: true, incident: data }
    } catch (error) {
      return { success: false, error: 'Error al aprobar incidencia' }
    }
  }
}