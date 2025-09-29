import { supabase } from '../lib/supabase';
import { adaptSupabaseError } from '../utils/errors.ts';
import { sanitizePagination, sanitizeSorting } from '../utils/serviceHelpers';

/**
 * Production-ready attendance history service
 * Follows { ok, data, error, code } contract
 */
const attendanceHistoryService = {
  /**
   * Get attendance history with filters and pagination
   */
  async getAttendanceHistory(params = {}) {
    try {
      const {
        employeeId,
        startDate,
        endDate,
        page = 0,
        pageSize = 50,
        sortBy = 'date',
        sortDir = 'desc'
      } = params;

      const { offset, limit } = sanitizePagination({ page, pageSize });
      const { sortBy: safeSort, ascending } = sanitizeSorting(
        { sortBy, sortDir }, 
        ['date', 'clock_in', 'clock_out', 'total_hours', 'overtime_hours', 'status']
      );

      let query = supabase?.from('attendance_records')?.select(`
          date,
          clock_in,
          lunch_start,
          lunch_end,
          clock_out,
          total_hours,
          overtime_hours,
          status,
          notes,
          employee_id,
          site_id,
          employee_profiles!inner(full_name, employee_id),
          construction_sites(name, location)
        `, { count: 'exact' })?.order(safeSort, { ascending })?.range(offset, offset + limit - 1);

      // Apply filters
      if (employeeId) {
        query = query?.eq('employee_id', employeeId);
      }

      if (startDate) {
        query = query?.gte('date', startDate);
      }

      if (endDate) {
        query = query?.lte('date', endDate);
      }

      const { data, error, count } = await query;

      if (error) {
        throw error;
      }

      return {
        ok: true,
        data: {
          records: data || [],
          total: count || 0,
          page: Math.floor(offset / limit),
          pageSize: limit,
          totalPages: Math.ceil((count || 0) / limit)
        }
      };
    } catch (e) {
      const adaptedError = adaptSupabaseError(e);
      return {
        ok: false,
        error: adaptedError?.error,
        code: adaptedError?.code
      };
    }
  },

  /**
   * Get attendance summary for date range
   */
  async getAttendanceSummary(employeeId, startDate, endDate) {
    try {
      const { data, error } = await supabase?.from('attendance_records')?.select('total_hours, overtime_hours, status')?.eq('employee_id', employeeId)?.gte('date', startDate)?.lte('date', endDate);

      if (error) {
        throw error;
      }

      const records = data || [];
      const summary = {
        totalDays: records?.length,
        totalHours: records?.reduce((sum, r) => sum + (r?.total_hours || 0), 0),
        overtimeHours: records?.reduce((sum, r) => sum + (r?.overtime_hours || 0), 0),
        presentDays: records?.filter(r => r?.status === 'present')?.length,
        lateDays: records?.filter(r => r?.status === 'late')?.length,
        absentDays: records?.filter(r => r?.status === 'absent')?.length
      };

      return {
        ok: true,
        data: summary
      };
    } catch (e) {
      const adaptedError = adaptSupabaseError(e);
      return {
        ok: false,
        error: adaptedError?.error,
        code: adaptedError?.code
      };
    }
  },

  /**
   * Export attendance records for reporting
   */
  async exportAttendanceRecords(params = {}) {
    try {
      const {
        employeeIds = [],
        startDate,
        endDate,
        format = 'json'
      } = params;

      let query = supabase?.from('attendance_records')?.select(`
          date,
          clock_in,
          lunch_start,
          lunch_end, 
          clock_out,
          total_hours,
          overtime_hours,
          status,
          notes,
          employee_profiles!inner(full_name, employee_id, position),
          construction_sites(name, location)
        `)?.order('date', { ascending: false });

      if (employeeIds?.length > 0) {
        query = query?.in('employee_id', employeeIds);
      }

      if (startDate) {
        query = query?.gte('date', startDate);
      }

      if (endDate) {
        query = query?.lte('date', endDate);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return {
        ok: true,
        data: {
          records: data || [],
          format,
          exportedAt: new Date()?.toISOString(),
          filters: { employeeIds, startDate, endDate }
        }
      };
    } catch (e) {
      const adaptedError = adaptSupabaseError(e);
      return {
        ok: false,
        error: adaptedError?.error,
        code: adaptedError?.code
      };
    }
  }
};

export default attendanceHistoryService;