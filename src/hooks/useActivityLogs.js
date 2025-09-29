// src/hooks/useActivityLogs.js
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

/**
 * Hook para traer logs de actividad con filtros y paginación
 * @param {Object} params
 * @param {string} params.search - texto de búsqueda en descripción, acción o módulo
 * @param {string} params.from - fecha inicio (ISO o YYYY-MM-DD)
 * @param {string} params.to - fecha fin (ISO o YYYY-MM-DD)
 * @param {string} params.modulo - filtrar por módulo específico
 * @param {string} params.accion - filtrar por acción específica
 * @param {number} params.pageSize - número de registros por página
 * @param {number} params.page - página actual (0-indexed)
 */
export function useActivityLogs({ search = '', from, to, modulo, accion, pageSize = 20, page = 0 }) {
  return useQuery({
    queryKey: ['activityLogs', { search, from, to, modulo, accion, pageSize, page }],
    queryFn: async () => {
      let query = supabase
        .from('activity_logs')
        .select(
          `
            id,
            accion,
            modulo,
            descripcion,
            rol,
            fecha,
            ip_address,
            user_agent,
            usuarios:usuario_id (
              id,
              nombre,
              correo
            )
          `,
          { count: 'exact' }
        )
        .order('fecha', { ascending: false });

      if (search) {
        query = query.or(
          `accion.ilike.%${search}%,descripcion.ilike.%${search}%,modulo.ilike.%${search}%`
        );
      }

      if (from) query = query.gte('fecha', from);
      if (to) query = query.lte('fecha', to);
      if (modulo) query = query.eq('modulo', modulo);
      if (accion) query = query.eq('accion', accion);

      // paginación
      const fromRange = page * pageSize;
      const toRange = fromRange + pageSize - 1;
      query = query.range(fromRange, toRange);

      const { data, error, count } = await query;

      if (error) throw error;
      return { data: data || [], count };
    },
    keepPreviousData: true,
  });
}
