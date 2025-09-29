// src/data/employeeDataService.js
import { supabase } from '../lib/supabase';

function ok(data)   { return { success: true,  ...data }; }
function fail(err)  { return { success: false, error: err?.message || String(err) || 'Error desconocido' }; }

// Sanea el término de búsqueda para usarlo en ilike (escapa % y ,)
function sanitizeSearch(s = '') {
  const raw = String(s).trim();
  if (!raw) return '';
  // Escapar % y , que rompen el OR encoder
  return raw.replaceAll('%', '\\%').replaceAll(',', ' ');
}

export const employeeDataService = {
  /**
   * Obtiene empleados con filtros, paginación y ordenamiento.
   * @param {Object} filters
   *  - role?: string
   *  - obra_id?: string
   *  - search?: string
   *  - limit?: number (default 100)
   *  - offset?: number (default 0)
   *  - orderBy?: string (default 'created_at')
   *  - order?: 'asc' | 'desc' (default 'desc')
   */
  async getEmployees(filters = {}) {
    try {
      const {
        role,
        obra_id,
        search,
        limit = 100,
        offset = 0,
        orderBy = 'created_at',
        order = 'desc',
      } = filters;

      let query = supabase
        .from('usuarios')
        .select(`
          id,
          correo,
          nombre,
          telefono,
          rol,
          is_active,
          obra_id,
          supervisor_id,
          puesto,
          hourly_rate,
          created_at,
          updated_at,
          obras:obra_id (
            id,
            nombre,
            direccion
          ),
          supervisor:usuarios!supervisor_id (
            id,
            nombre,
            correo
          )
        `)
        .eq('is_active', true);

      if (role)    query = query.eq('rol', role);
      if (obra_id) query = query.eq('obra_id', obra_id);

      if (search) {
        const needle = sanitizeSearch(search);
        // Nota: al usar OR con ilike, evita inyectar comas sin escapar
        query = query.or(`nombre.ilike.%${needle}%,correo.ilike.%${needle}%`);
      }

      // Orden y paginación
      query = query.order(orderBy, { ascending: String(order).toLowerCase() === 'asc' });
      query = query.range(offset, Math.max(offset + limit - 1, offset));

      const { data, error } = await query;
      if (error) throw error;

      const rows = (data || []).map(emp => ({
        id: emp?.id,
        name: emp?.nombre,
        email: emp?.correo,
        phone: emp?.telefono,
        puesto: emp?.puesto || 'No asignado',
        sitio_asignado: emp?.obras?.nombre || 'No asignado',
        supervisor_id: emp?.supervisor_id,
        supervisor: emp?.supervisor ? {
          id: emp.supervisor.id,
          nombre: emp.supervisor.nombre,
          correo: emp.supervisor.correo,
        } : null,
        hourly_rate: Number(emp?.hourly_rate) || 0,
        status: emp?.is_active ? 'active' : 'inactive',
        role: emp?.rol,
        obra_id: emp?.obra_id,
        created_at: emp?.created_at,
        updated_at: emp?.updated_at,
      }));

      // No devolvemos count para evitar lecturas extra caras (si lo necesitas, calcula en UI o añade un RPC/contador dedicado)
      return ok({ data: rows, page: { offset, limit, returned: rows.length } });
    } catch (error) {
      return fail(error || 'Error al cargar empleados');
    }
  },

  // Crear empleado
  async createEmployee(employeeData) {
    try {
      const payload = {
        correo:        employeeData?.email,
        nombre:        employeeData?.name,
        telefono:      employeeData?.phone,
        puesto:        employeeData?.puesto,
        obra_id:       employeeData?.obra_id,
        supervisor_id: employeeData?.supervisor_id,
        hourly_rate:   Number(employeeData?.hourly_rate) || 0,
        rol:           employeeData?.role || 'user',
        is_active:     true,
      };

      const { data, error } = await supabase
        .from('usuarios')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;
      return ok({ data });
    } catch (error) {
      return fail(error || 'Error al crear empleado');
    }
  },

  // Actualizar empleado
  async updateEmployee(id, updateData) {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .update({ ...updateData, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return ok({ data });
    } catch (error) {
      return fail(error || 'Error al actualizar empleado');
    }
  },

  // Borrado lógico
  async deleteEmployee(id) {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return ok({ data });
    } catch (error) {
      return fail(error || 'Error al eliminar empleado');
    }
  },
};
