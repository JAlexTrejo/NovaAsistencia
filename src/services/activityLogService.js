// src/services/activityLogService.js
import { supabase } from '@/lib/supabase';
import {
  ok,
  fail,
  validateRequired,
  buildPaginatedQuery,
  formatPaginatedResponse,
  buildColumnString,
} from '@/utils/serviceHelpers';

// Columnas explícitas (nunca SELECT *)
const LOG_COLS = [
  'id',
  'usuario_id',
  'rol',
  'accion',
  'modulo',
  'descripcion',
  'ip_address',
  'user_agent',
  'metadata',
  'fecha',
];

// Join explícito para traer datos del usuario
const LOG_USER_JOIN = 'usuarios:usuario_id(id,nombre,correo)';

export const activityLogService = {
  async logAction({ usuarioId, rol, accion, modulo, descripcion, metadata = {} }) {
    try {
      validateRequired(['usuarioId', 'rol', 'accion', 'modulo', 'descripcion'], {
        usuarioId,
        rol,
        accion,
        modulo,
        descripcion,
      });

      const payload = {
        usuario_id: usuarioId,
        rol,
        accion,
        modulo,
        descripcion,
        metadata: typeof metadata === 'object' ? metadata : {},
        ip_address: null, // si capturas IP del servidor, ponla aquí
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
        fecha: new Date().toISOString(),
      };

      const { data, error } = await supabase
        ?.from('logs_actividad')
        ?.insert([payload])
        ?.select(`${buildColumnString(LOG_COLS)}, ${LOG_USER_JOIN}`)
        ?.single();

      if (error) return fail(error);
      return ok(data);
    } catch (e) {
      return fail(e);
    }
  },

  /**
   * Listar logs con filtros, búsqueda y paginación
   * @param {Object} options
   * @param {number} options.page   (1-based)
   * @param {number} options.pageSize
   * @param {string} options.userId
   * @param {string} options.module
   * @param {string} options.action
   * @param {string} options.startDate ISO o YYYY-MM-DD
   * @param {string} options.endDate   ISO o YYYY-MM-DD
   * @param {string} options.q         búsqueda libre (accion/modulo/descripcion)
   */
  async listLogs({
    page = 1,
    pageSize = 20,
    userId = null,
    module = null,
    action = null,
    startDate = null,
    endDate = null,
    q = '',
  } = {}) {
    try {
      let query = supabase
        ?.from('logs_actividad')
        ?.select(`${buildColumnString(LOG_COLS)}, ${LOG_USER_JOIN}`, { count: 'exact' });

      if (userId) query = query?.eq('usuario_id', userId);
      if (module) query = query?.eq('modulo', module);
      if (action) query = query?.eq('accion', action);
      if (startDate) query = query?.gte('fecha', new Date(startDate).toISOString());
      if (endDate) query = query?.lte('fecha', new Date(endDate).toISOString());

      if (q?.trim()) {
        // búsqueda básica en campos de texto comunes
        query = query?.or(
          `accion.ilike.%${q}%,modulo.ilike.%${q}%,descripcion.ilike.%${q}%`
        );
      }

      query = query?.order('fecha', { ascending: false });
      query = buildPaginatedQuery(query, { page, pageSize });

      const { data, error, count } = await query;
      if (error) return fail(error);

      return ok(formatPaginatedResponse(data || [], count ?? 0, page, pageSize));
    } catch (e) {
      return fail(e);
    }
  },

  async getActivityStats(startDate, endDate) {
    try {
      let query = supabase?.from('logs_actividad')?.select('accion, modulo, fecha');

      if (startDate) query = query?.gte('fecha', new Date(startDate).toISOString());
      if (endDate) query = query?.lte('fecha', new Date(endDate).toISOString());

      const { data, error } = await query;
      if (error) return fail(error);

      const stats = {
        totalActions: data?.length || 0,
        actionBreakdown: {},
        moduleBreakdown: {},
        dailyActivity: {},
        topActions: [],
        topModules: [],
      };

      data?.forEach((log) => {
        stats.actionBreakdown[log.accion] = (stats.actionBreakdown[log.accion] || 0) + 1;
        stats.moduleBreakdown[log.modulo] = (stats.moduleBreakdown[log.modulo] || 0) + 1;
        const date = new Date(log.fecha).toISOString().split('T')?.[0];
        stats.dailyActivity[date] = (stats.dailyActivity[date] || 0) + 1;
      });

      stats.topActions = Object.entries(stats.actionBreakdown)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([action, count]) => ({ action, count }));

      stats.topModules = Object.entries(stats.moduleBreakdown)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([module, count]) => ({ module, count }));

      return ok(stats);
    } catch (e) {
      return fail(e);
    }
  },

  async getUserRecentActivity(userId, limit = 10) {
    try {
      validateRequired(['userId'], { userId });

      const { data, error } = await supabase
        ?.from('logs_actividad')
        ?.select(`${buildColumnString(LOG_COLS)}, ${LOG_USER_JOIN}`)
        ?.eq('usuario_id', userId)
        ?.order('fecha', { ascending: false })
        ?.limit(limit);

      if (error) return fail(error);
      return ok(data || []);
    } catch (e) {
      return fail(e);
    }
  },

  async cleanOldLogs(daysToKeep = 90) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      // Para obtener conteo real, encadenamos .select('id')
      const { data, error } = await supabase
        ?.from('logs_actividad')
        ?.delete()
        ?.lt('fecha', cutoffDate.toISOString())
        ?.select('id');

      if (error) return fail(error);

      await this.logAction({
        usuarioId: 'system',
        rol: 'system',
        accion: 'maintenance',
        modulo: 'ActivityLog',
        descripcion: `Cleaned logs older than ${daysToKeep} days`,
        metadata: {
          cutoffDate: cutoffDate.toISOString(),
          deletedCount: data?.length || 0,
        },
      });

      return ok({ deletedCount: data?.length || 0 });
    } catch (e) {
      return fail(e);
    }
  },

  async exportLogs(filters = {}) {
    try {
      const { data: logsResp, ok: isOk, error } = await this.listLogs({
        ...filters,
        pageSize: 10000,
        page: 1,
      });

      if (!isOk) return fail(error || new Error('Failed to list logs for export'));
      if (!logsResp?.data?.length) return fail(new Error('No logs found for export'));

      const exportData = logsResp.data.map((log) => ({
        Timestamp: new Date(log.fecha).toLocaleString(),
        User: log?.usuario_id,
        Role: log?.rol,
        Action: log?.accion,
        Module: log?.modulo,
        Description: log?.descripcion,
        IP: log?.ip_address,
        UserAgent: log?.user_agent,
        Metadata: JSON.stringify(log?.metadata),
      }));

      return ok(exportData);
    } catch (e) {
      return fail(e);
    }
  },
};

export default activityLogService;
