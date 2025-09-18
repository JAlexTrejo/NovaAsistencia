import { supabase } from '@/lib/supabase';
import { adaptSupabaseError } from '@/utils/errors';

const ok   = (data) => ({ ok: true, data });
const fail = (e)    => ({ ok: false, ...adaptSupabaseError(e) });

// Columnas explícitas de la tabla incidents
const INC_BASE_COLS = [
  'id',
  'employee_id',
  'type',
  'date',
  'description',
  'status',
  'attachment_urls',
  'attachment_count',
  'approval_comments',
  'approved_by',
  'approved_at',
  'created_at',
  'updated_at',
].join(',');

// Relaciones usadas en vistas (manteniendo tus FKs explícitos)
const NEST_EMPLOYEE = `
  user_profiles!incidents_employee_id_fkey (
    id,
    full_name,
    employee_id
  )
`;

const NEST_APPROVER = `
  approved_by_profile:user_profiles!incidents_approved_by_fkey (
    id,
    full_name
  )
`;

// Nombre del bucket de Storage
const BUCKET = 'incident-attachments';

export const incidentService = {
  /**
   * Crear incidencia con adjuntos (opcional)
   */
  async createIncident(incidentData, attachmentFiles = []) {
    try {
      const payload = {
        employee_id: incidentData?.employee_id,
        type:        incidentData?.type,
        date:        incidentData?.date,
        description: incidentData?.description,
        status:      'pendiente',
        attachment_count: Array.isArray(attachmentFiles) ? attachmentFiles.length : 0,
      };

      const { data: incident, error: insertErr } = await supabase
        .from('incidents')
        .insert([payload])
        .select(INC_BASE_COLS)
        .single();

      if (insertErr) return fail(insertErr);
      if (!incident) return fail(new Error('No se pudo crear la incidencia'));

      // Subir adjuntos si hay
      let urls = [];
      if (attachmentFiles?.length) {
        const up = await this.uploadIncidentAttachments(incident.id, incidentData?.employee_id, attachmentFiles);
        if (!up.ok) {
          // rollback: eliminar incidente si fallan archivos
          await supabase.from('incidents').delete().eq('id', incident.id);
          return up; // { ok: false, error }
        }
        urls = up.data || [];

        // Actualizar URLs y conteo
        const { error: updErr } = await supabase
          .from('incidents')
          .update({ attachment_urls: urls, attachment_count: urls.length })
          .eq('id', incident.id);

        if (updErr) return fail(updErr);
      }

      return ok({ ...incident, attachment_urls: urls, attachment_count: urls.length });
    } catch (e) {
      return fail(e);
    }
  },

  /**
   * Subir adjuntos a Storage
   * Devuelve lista de URLs públicas (o firmadas si activas el bloque alternativo)
   */
  async uploadIncidentAttachments(incidentId, employeeId, files = []) {
    try {
      if (!files.length) return ok([]);

      const uploads = files.map(async (file, idx) => {
        const ext = file?.name?.split('.')?.pop()?.toLowerCase() || 'bin';
        const filename = `${incidentId}_${idx + 1}_${Date.now()}.${ext}`;
        const path = `${employeeId}/${filename}`;

        const { error: upErr } = await supabase
          .storage
          .from(BUCKET)
          .upload(path, file, { cacheControl: '3600', upsert: false });

        if (upErr) throw new Error(`Error subiendo ${file?.name}: ${upErr.message}`);

        // === Opción 1: URL pública (si el bucket es público) ===
        const { data: publicURL } = supabase.storage.from(BUCKET).getPublicUrl(path);
        return publicURL?.publicUrl;

        // === Opción 2 (segura): URL firmada (recomendado para bucket privado) ===
        // const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60); // 1h
        // return signed?.signedUrl;
      });

      const urls = await Promise.all(uploads);
      return ok(urls);
    } catch (e) {
      return fail(e);
    }
  },

  /**
   * Obtener URLs de adjuntos de una incidencia
   */
  async getIncidentAttachments(incidentId) {
    try {
      const { data, error } = await supabase
        .from('incidents')
        .select('attachment_urls, attachment_count')
        .eq('id', incidentId)
        .single();

      if (error) return fail(error);
      return ok(data?.attachment_urls || []);
    } catch (e) {
      return fail(e);
    }
  },

  /**
   * Listado admin con filtros
   */
  async getAllIncidents({ startDate, endDate, status, employeeId } = {}) {
    try {
      let query = supabase
        .from('incidents')
        .select([INC_BASE_COLS, NEST_EMPLOYEE, NEST_APPROVER].join(','))
        .order('created_at', { ascending: false });

      if (startDate)  query = query.gte('date', startDate);
      if (endDate)    query = query.lte('date', endDate);
      if (status && status !== 'all') query = query.eq('status', status);
      if (employeeId) query = query.eq('employee_id', employeeId);

      const { data, error } = await query;
      if (error) return fail(error);
      return ok(data || []);
    } catch (e) {
      return fail(e);
    }
  },

  /**
   * Incidencias por empleado (con rango opcional)
   */
  async getEmployeeIncidents(employeeId, startDate = null, endDate = null) {
    try {
      let query = supabase
        .from('incidents')
        .select([INC_BASE_COLS, NEST_APPROVER].join(','))
        .eq('employee_id', employeeId)
        .order('created_at', { ascending: false });

      if (startDate) query = query.gte('date', startDate);
      if (endDate)   query = query.lte('date', endDate);

      const { data, error } = await query;
      if (error) return fail(error);
      return ok(data || []);
    } catch (e) {
      return fail(e);
    }
  },

  /**
   * Aprobar / rechazar incidencia (con comentarios)
   */
  async updateIncidentStatus(incidentId, status, approvedBy, comments = null) {
    try {
      const update = {
        status,
        approved_by: approvedBy,
        approved_at: new Date().toISOString(),
        updated_at:  new Date().toISOString(),
        ...(comments ? { approval_comments: comments } : {}),
      };

      const { data, error } = await supabase
        .from('incidents')
        .update(update)
        .eq('id', incidentId)
        .select([INC_BASE_COLS, NEST_EMPLOYEE, NEST_APPROVER].join(','))
        .single();

      if (error) return fail(error);
      return ok(data);
    } catch (e) {
      return fail(e);
    }
  },

  /**
   * Incidencias por rango de fechas (opcional por empleado)
   */
  async getIncidentsByDateRange(startDate, endDate, employeeId = null) {
    try {
      let query = supabase
        .from('incidents')
        .select([INC_BASE_COLS, NEST_EMPLOYEE].join(','))
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });

      if (employeeId) query = query.eq('employee_id', employeeId);

      const { data, error } = await query;
      if (error) return fail(error);
      return ok(data || []);
    } catch (e) {
      return fail(e);
    }
  },

  /**
   * Eliminar incidencia (borra adjuntos del bucket si existen)
   * Solo debería permitirse si está 'pendiente' (hazlo cumplir en RLS)
   */
  async deleteIncident(incidentId) {
    try {
      // Buscar para saber qué borrar del bucket
      const { data: inc, error: getErr } = await supabase
        .from('incidents')
        .select('attachment_urls, employee_id')
        .eq('id', incidentId)
        .single();

      if (getErr) return fail(getErr);

      if (Array.isArray(inc?.attachment_urls) && inc.attachment_urls.length > 0) {
        // Mapear las URLs a paths (asumiendo estructura {employee_id}/{filename})
        const paths = inc.attachment_urls.map((url) => {
          const last = url?.split('/')?.pop();
          return `${inc.employee_id}/${last}`;
        });

        const { error: rmErr } = await supabase.storage.from(BUCKET).remove(paths);
        if (rmErr) return fail(rmErr);
      }

      const { error: delErr } = await supabase.from('incidents').delete().eq('id', incidentId);
      if (delErr) return fail(delErr);

      return ok(true);
    } catch (e) {
      return fail(e);
    }
  },

  /**
   * Estadísticas simples por tipo/estado en un rango
   */
  async getIncidentStats(startDate, endDate) {
    try {
      const { data, error } = await supabase
        .from('incidents')
        .select('type, status')
        .gte('date', startDate)
        .lte('date', endDate);

      if (error) return fail(error);

      const stats = {
        total: data?.length || 0,
        byType: {},
        byStatus: {},
        pending: 0,
        approved: 0,
        rejected: 0,
      };

      (data || []).forEach((inc) => {
        stats.byType[inc.type]   = (stats.byType[inc.type] || 0) + 1;
        stats.byStatus[inc.status] = (stats.byStatus[inc.status] || 0) + 1;

        if (inc.status === 'pendiente') stats.pending += 1;
        if (inc.status === 'aprobada')  stats.approved += 1;
        if (inc.status === 'rechazada')  stats.rejected += 1;
      });

      return ok(stats);
    } catch (e) {
      return fail(e);
    }
  },

  /**
   * Atajo para aprobar/rechazar sin comentarios
   */
  async approveIncident(incidentId, approvedBy, decision = 'aprobada') {
    return this.updateIncidentStatus(incidentId, decision, approvedBy);
  },
};

export default incidentService;
