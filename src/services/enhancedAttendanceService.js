import { supabase } from '../lib/supabase';

/**
 * Enhanced Attendance Service for Personalized Worker Dashboard
 * Handles attendance operations specific to individual workers
 */

export const enhancedAttendanceService = {
  /**
   * Get current worker's profile with site and supervisor information
   */
  async getWorkerProfile(userId) {
    try {
      const { data, error } = await supabase?.from('employee_profiles')?.select(`*,construction_sites (id,name,location,description,is_active),supervisor:user_profiles!supervisor_id (id,full_name,email,phone)`)?.eq('user_id', userId)?.eq('status', 'active')?.single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error?.message };
    }
  },

  /**
   * Get coworkers at the same construction site
   */
  async getSiteCoworkers(siteId, excludeUserId) {
    try {
      const { data, error } = await supabase?.from('employee_profiles')?.select(`
          id,
          full_name,
          position,
          phone,
          status,
          user_profiles!user_id (
            id,
            email,
            last_sign_in_at
          )
        `)?.eq('site_id', siteId)?.eq('status', 'active')?.neq('user_id', excludeUserId)?.order('full_name');

      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error) {
      return { success: false, error: error?.message };
    }
  },

  /**
   * Get worker's attendance history with pagination
   */
  async getWorkerAttendanceHistory(employeeId, limit = 30, offset = 0) {
    try {
      const { data, error } = await supabase?.from('attendance_records')?.select(`
          id,
          date,
          clock_in,
          clock_out,
          lunch_start,
          lunch_end,
          total_hours,
          overtime_hours,
          status,
          location_in,
          location_out,
          notes,
          construction_sites (
            name,
            location
          )
        `)?.eq('employee_id', employeeId)?.order('date', { ascending: false })?.range(offset, offset + limit - 1);

      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error) {
      return { success: false, error: error?.message };
    }
  },

  /**
   * Get current attendance status for today
   */
  async getTodayAttendanceStatus(employeeId) {
    try {
      const today = new Date()?.toISOString()?.split('T')?.[0];
      
      const { data, error } = await supabase?.from('attendance_records')?.select('*')?.eq('employee_id', employeeId)?.eq('date', today)?.single();

      if (error && error?.code !== 'PGRST116') throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error?.message };
    }
  },

  /**
   * Clock in for work
   */
  async clockIn(employeeId, location = null, notes = null) {
    try {
      const today = new Date()?.toISOString()?.split('T')?.[0];
      const now = new Date()?.toISOString();
      
      // Check if already clocked in today
      const { data: existingRecord } = await supabase?.from('attendance_records')?.select('id, clock_in')?.eq('employee_id', employeeId)?.eq('date', today)?.single();

      if (existingRecord?.clock_in) {
        return { success: false, error: 'Ya has marcado entrada hoy' };
      }

      let result;
      if (existingRecord) {
        // Update existing record
        result = await supabase?.from('attendance_records')?.update({
            clock_in: now,
            location_in: location,
            status: 'present',
            notes: notes
          })?.eq('id', existingRecord?.id)?.select()?.single();
      } else {
        // Create new record
        result = await supabase?.from('attendance_records')?.insert({
            employee_id: employeeId,
            date: today,
            clock_in: now,
            location_in: location,
            status: 'present',
            notes: notes
          })?.select()?.single();
      }

      if (result?.error) throw result?.error;
      return { success: true, data: result?.data };
    } catch (error) {
      return { success: false, error: error?.message };
    }
  },

  /**
   * Clock out from work
   */
  async clockOut(employeeId, location = null, notes = null) {
    try {
      const today = new Date()?.toISOString()?.split('T')?.[0];
      const now = new Date()?.toISOString();
      
      // Get today's attendance record
      const { data: attendanceRecord, error: fetchError } = await supabase?.from('attendance_records')?.select('*')?.eq('employee_id', employeeId)?.eq('date', today)?.single();

      if (fetchError) throw fetchError;
      if (!attendanceRecord?.clock_in) {
        return { success: false, error: 'Debes marcar entrada primero' };
      }
      if (attendanceRecord?.clock_out) {
        return { success: false, error: 'Ya has marcado salida hoy' };
      }

      // Calculate total hours
      const clockInTime = new Date(attendanceRecord?.clock_in);
      const clockOutTime = new Date(now);
      const totalMilliseconds = clockOutTime - clockInTime;
      
      // Calculate lunch break duration if exists
      let lunchBreakHours = 0;
      if (attendanceRecord?.lunch_start && attendanceRecord?.lunch_end) {
        const lunchStart = new Date(attendanceRecord?.lunch_start);
        const lunchEnd = new Date(attendanceRecord?.lunch_end);
        lunchBreakHours = (lunchEnd - lunchStart) / (1000 * 60 * 60);
      }

      const totalHours = (totalMilliseconds / (1000 * 60 * 60)) - lunchBreakHours;
      const regularHours = Math.min(totalHours, 8);
      const overtimeHours = Math.max(0, totalHours - 8);

      const { data, error } = await supabase?.from('attendance_records')?.update({
          clock_out: now,
          location_out: location,
          total_hours: Math.max(0, totalHours)?.toFixed(2),
          overtime_hours: overtimeHours?.toFixed(2),
          notes: attendanceRecord?.notes ? 
            `${attendanceRecord?.notes}\nSalida: ${notes || 'Sin notas'}` : 
            notes
        })?.eq('id', attendanceRecord?.id)?.select()?.single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error?.message };
    }
  },

  /**
   * Start lunch break
   */
  async startLunchBreak(employeeId) {
    try {
      const today = new Date()?.toISOString()?.split('T')?.[0];
      const now = new Date()?.toISOString();
      
      const { data, error } = await supabase?.from('attendance_records')?.update({
          lunch_start: now
        })?.eq('employee_id', employeeId)?.eq('date', today)?.select()?.single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error?.message };
    }
  },

  /**
   * End lunch break
   */
  async endLunchBreak(employeeId) {
    try {
      const today = new Date()?.toISOString()?.split('T')?.[0];
      const now = new Date()?.toISOString();
      
      const { data, error } = await supabase?.from('attendance_records')?.update({
          lunch_end: now
        })?.eq('employee_id', employeeId)?.eq('date', today)?.select()?.single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error?.message };
    }
  },

  /**
   * Get weekly timecard summary
   */
  async getWeeklyTimecard(employeeId, weekStart = null) {
    try {
      // Default to current week start (Monday)
      let startDate = weekStart;
      if (!startDate) {
        const now = new Date();
        const monday = new Date(now);
        monday?.setDate(now?.getDate() - now?.getDay() + 1);
        startDate = monday?.toISOString()?.split('T')?.[0];
      }
      
      const endDate = new Date(startDate);
      endDate?.setDate(endDate?.getDate() + 6);
      const endDateStr = endDate?.toISOString()?.split('T')?.[0];

      const { data, error } = await supabase?.from('attendance_records')?.select('*')?.eq('employee_id', employeeId)?.gte('date', startDate)?.lte('date', endDateStr)?.order('date');

      if (error) throw error;

      // Calculate weekly totals
      const weeklyData = data || [];
      const totalRegularHours = weeklyData?.reduce((sum, record) => {
        const totalHours = parseFloat(record?.total_hours || 0);
        const overtimeHours = parseFloat(record?.overtime_hours || 0);
        return sum + (totalHours - overtimeHours);
      }, 0);
      
      const totalOvertimeHours = weeklyData?.reduce((sum, record) => {
        return sum + parseFloat(record?.overtime_hours || 0);
      }, 0);

      return { 
        success: true, 
        data: {
          weekStart: startDate,
          weekEnd: endDateStr,
          dailyRecords: weeklyData,
          totalRegularHours: totalRegularHours?.toFixed(2),
          totalOvertimeHours: totalOvertimeHours?.toFixed(2),
          totalHours: (totalRegularHours + totalOvertimeHours)?.toFixed(2)
        }
      };
    } catch (error) {
      return { success: false, error: error?.message };
    }
  },

  /**
   * Get worker's incidents
   */
  async getWorkerIncidents(employeeId, limit = 10) {
    try {
      const { data, error } = await supabase?.from('incident_records')?.select(`
          id,
          type,
          date,
          description,
          status,
          created_at,
          approved_at,
          approved_by_user:user_profiles!approved_by (
            full_name
          )
        `)?.eq('employee_id', employeeId)?.order('created_at', { ascending: false })?.limit(limit);

      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error) {
      return { success: false, error: error?.message };
    }
  },

  /**
   * Submit new incident report
   */
  async submitIncident(employeeId, incidentData) {
    try {
      const { data, error } = await supabase?.from('incident_records')?.insert({
          employee_id: employeeId,
          type: incidentData?.type,
          date: incidentData?.date,
          description: incidentData?.description,
          status: 'pendiente'
        })?.select()?.single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error?.message };
    }
  },

  /**
   * Get worker's recent payroll estimation
   */
  async getRecentPayrollEstimation(employeeId) {
    try {
      const { data, error } = await supabase?.from('payroll_estimations')?.select('*')?.eq('employee_id', employeeId)?.order('week_start', { ascending: false })?.limit(1)?.single();

      if (error && error?.code !== 'PGRST116') throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error?.message };
    }
  }
};

export default enhancedAttendanceService;