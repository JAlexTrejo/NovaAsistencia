import { supabase } from '../lib/supabase';
import { adaptSupabaseError } from '../utils/errors.ts';
import { sanitizePagination, sanitizeSorting } from '../utils/serviceHelpers';

/**
 * Production-ready attendance list service for real-time operations
 */
const attendanceListService = {
  /**
   * Get today's attendance by site
   */
  async listTodayBySite(siteId, options = {}) {
    try {
      const {
        status = null,
        page = 0,
        pageSize = 50
      } = options;

      const today = new Date()?.toISOString()?.split('T')?.[0];
      const { offset, limit } = sanitizePagination({ page, pageSize });

      let query = supabase?.from('attendance_records')?.select(`
          *,
          employee_profiles!inner(
            full_name,
            employee_id,
            position,
            profile_picture_url
          )
        `, { count: 'exact' })?.eq('date', today)?.order('clock_in', { ascending: false, nullsFirst: false })?.range(offset, offset + limit - 1);

      if (siteId && siteId !== 'all') {
        query = query?.eq('site_id', siteId);
      }

      if (status && status !== 'all') {
        query = query?.eq('status', status);
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
          date: today
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
   * Get attendance records by date range
   */
  async listByRange(options = {}) {
    try {
      const {
        siteId = null,
        startDate,
        endDate,
        page = 0,
        pageSize = 50,
        sortBy = 'date',
        sortDir = 'desc'
      } = options;

      const { offset, limit } = sanitizePagination({ page, pageSize });
      const { sortBy: safeSort, ascending } = sanitizeSorting(
        { sortBy, sortDir },
        ['date', 'clock_in', 'clock_out', 'total_hours', 'status']
      );

      let query = supabase?.from('attendance_records')?.select(`
          *,
          employee_profiles!inner(
            full_name,
            employee_id,
            position,
            profile_picture_url
          ),
          construction_sites(name, location)
        `, { count: 'exact' })?.order(safeSort, { ascending })?.range(offset, offset + limit - 1);

      if (siteId && siteId !== 'all') {
        query = query?.eq('site_id', siteId);
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
          totalPages: Math.ceil((count || 0) / limit),
          filters: { siteId, startDate, endDate }
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
   * Get real-time attendance statistics
   */
  async getAttendanceStats(siteId = null) {
    try {
      const today = new Date()?.toISOString()?.split('T')?.[0];

      // Base query for today's attendance
      let baseQuery = supabase?.from('attendance_records')?.select('status', { count: 'exact', head: true })?.eq('date', today);

      if (siteId && siteId !== 'all') {
        baseQuery = baseQuery?.eq('site_id', siteId);
      }

      // Get counts for each status
      const [
        { count: total, error: e1 },
        { count: present, error: e2 },
        { count: late, error: e3 },
        { count: absent, error: e4 }
      ] = await Promise.all([
        baseQuery,
        baseQuery?.eq('status', 'present'),
        baseQuery?.eq('status', 'late'),
        baseQuery?.eq('status', 'absent')
      ]);

      if (e1 || e2 || e3 || e4) {
        throw new Error('Error fetching attendance statistics');
      }

      return {
        ok: true,
        data: {
          total: total || 0,
          present: present || 0,
          late: late || 0,
          absent: absent || 0,
          date: today,
          siteId
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

export default attendanceListService;