// src/services/incidentService.js
import { supabase } from '@/lib/supabase';
import { adaptSupabaseError } from '@/utils/errors';

const ok   = (data) => ({ ok: true, data });
const fail = (e)    => ({ ok: false, ...adaptSupabaseError(e) });

// === Configuración de adjuntos ===
// Cambia este nombre si tu bucket se llama distinto en Supabase Storage.
const ATTACHMENTS_BUCKET = 'incident_attachments';

// Normaliza nombres de archivo para ruta segura
function sanitizeFilename(name = '') {
  return String(name)
    .normalize('NFKD')
    .replace(/[^\w.\-]+/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 180); // deja espacio para el prefijo de ruta
}

/**
 * Lista incidentes con filtros + paginación.
 * Filtros soportados:
 *  - status: 'all' | 'pending' | 'approved' | 'rejected'
 *  - search: texto (busca en description)
 *  - employeeId: uuid
 *  - dateFrom, dateTo: 'YYYY-MM-DD'
 *  - page, pageSize
 */
export async function listIncidents({
  status = 'all',
  search = '',
  employeeId = null,
  dateFrom = null,
  dateTo = null,
  page = 0,
  pageSize = 20,
} = {}) {
  try {
    let query = supabase
      .from('incident_records')
      .select(`
        id,
        employee_id,
        type,
        date,
        description,
        status,
        approved_by,
        approved_at,
        created_at,
        updated_at,
        user_profiles:approved_by ( full_name ),
        employee_profiles:employee_id (
          full_name,
          site_id,
          construction_sites:site_id ( name )
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    if (status && status !== 'all') query = query.eq('status', status);
    if (employeeId) query = query.eq('employee_id', employeeId);
    if (search) query = query.ilike('description', `%${search}%`);
    if (dateFrom) query = query.gte('date', dateFrom);
    if (dateTo) query = query.lte('date', dateTo);

    // paginación
    const from = page * pageSize;
    const to = from + pageSize - 1;
    const { data, error, count } = await query.range(from, to);
    if (error) return fail(error);

    const rows = (data || []).map((r) => ({
      id: r?.id,
      employeeId: r?.employee_id,
      employeeName: r?.employee_profiles?.full_name ?? '—',
      site: r?.employee_profiles?.construction_sites?.name ?? '—',
      type: r?.type,
      date: r?.date,
      description: r?.description,
      status: r?.status,
      approvedByName: r?.user_profiles?.full_name ?? null,
      approvedAt: r?.approved_at ?? null,
      createdAt: r?.created_at,
      updatedAt: r?.updated_at,
    }));

    return ok({
      rows,
      count: count ?? rows.length,
      page,
      pageSize,
    });
  } catch (e) {
    return fail(e);
  }
}

/**
 * Obtiene un incidente por ID.
 */
export async function getIncidentById(id) {
  try {
    const { data, error } = await supabase
      .from('incident_records')
      .select(`
        id,
        employee_id,
        type,
        date,
        description,
        status,
        approved_by,
        approved_at,
        created_at,
        updated_at,
        user_profiles:approved_by ( full_name ),
        employee_profiles:employee_id (
          full_name,
          site_id,
          construction_sites:site_id ( name )
        )
      `)
      .eq('id', id)
      .single();

    if (error) return fail(error);

    const result = data && {
      id: data.id,
      employeeId: data.employee_id,
      employeeName: data?.employee_profiles?.full_name ?? '—',
      site: data?.employee_profiles?.construction_sites?.name ?? '—',
      type: data.type,
      date: data.date,
      description: data.description,
      status: data.status,
      approvedByName: data?.user_profiles?.full_name ?? null,
      approvedAt: data?.approved_at ?? null,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    return ok(result);
  } catch (e) {
    return fail(e);
  }
}

/**
 * Crea un incidente.
 * Campos mínimos según esquema:
 *  - employeeId (uuid)
 *  - type (enum definido en DB)
 *  - date (YYYY-MM-DD)
 *  - description (texto)
 * *status* usa default 'pendiente' del enum (según tu schema).
 */
export async function createIncident({ employeeId, type, date, description }) {
  try {
    const payload = {
      employee_id: employeeId,
      type,
      date,
      description,
      // status se deja al default en DB
    };

    const { data, error } = await supabase
      .from('incident_records')
      .insert(payload)
      .select(`id, employee_id, type, date, description, status, created_at`)
      .single();

    if (error) return fail(error);

    return ok({
      id: data?.id,
      employeeId: data?.employee_id,
      type: data?.type,
      date: data?.date,
      description: data?.description,
      status: data?.status,
      createdAt: data?.created_at,
    });
  } catch (e) {
    return fail(e);
  }
}

/**
 * Aprueba un incidente: setea status, approved_by, approved_at.
 */
export async function approveIncident({ incidentId, approvedByUserId }) {
  try {
    const nowIso = new Date().toISOString();
    const { data, error } = await supabase
      .from('incident_records')
      .update({
        status: 'approved',
        approved_by: approvedByUserId,
        approved_at: nowIso,
        updated_at: nowIso,
      })
      .eq('id', incidentId)
      .select('id, status, approved_by, approved_at, updated_at')
      .single();

    if (error) return fail(error);

    return ok({
      id: data?.id,
      status: data?.status,
      approvedBy: data?.approved_by,
      approvedAt: data?.approved_at,
      updatedAt: data?.updated_at,
    });
  } catch (e) {
    return fail(e);
  }
}

/**
 * Rechaza un incidente. (Si quieres persistir el motivo, se concatena en description)
 */
export async function rejectIncident({ incidentId, reason = '' }) {
  try {
    // Leer descripción actual (opcional)
    let current = '';
    {
      const { data, error } = await supabase
        .from('incident_records')
        .select('description')
        .eq('id', incidentId)
        .single();
      if (error && error.code !== 'PGRST116') return fail(error);
      current = data?.description || '';
    }

    const nowIso = new Date().toISOString();
    const { data, error } = await supabase
      .from('incident_records')
      .update({
        status: 'rejected',
        description: reason ? `${current}\n\n[Rechazo]: ${reason}` : current,
        updated_at: nowIso,
      })
      .eq('id', incidentId)
      .select('id, status, description, updated_at')
      .single();

    if (error) return fail(error);

    return ok({
      id: data?.id,
      status: data?.status,
      description: data?.description,
      updatedAt: data?.updated_at,
    });
  } catch (e) {
    return fail(e);
  }
}

/**
 * Sube adjuntos al Storage en la carpeta del incidente.
 * - files: Array<File|Blob> con { name, type, size }
 * Devuelve un arreglo con metadatos mínimos y URLs públicas si el bucket es público.
 */
export async function uploadIncidentAttachments(incidentId, files = []) {
  try {
    if (!incidentId) return fail(new Error('incidentId es requerido'));
    if (!Array.isArray(files) || files.length === 0) return ok([]);

    const bucket = supabase.storage.from(ATTACHMENTS_BUCKET);
    const uploaded = [];

    for (const file of files) {
      const safeName = sanitizeFilename(file?.name || 'file');
      const ext = safeName.includes('.') ? '' : (file?.type?.split('/')[1] ? `.${file.type.split('/')[1]}` : '');
      const path = `${incidentId}/${Date.now()}_${safeName}${ext}`;

      const { error: upErr } = await bucket.upload(path, file, {
        contentType: file?.type || 'application/octet-stream',
        upsert: false,
      });
      if (upErr) return fail(upErr);

      // Intentar obtener URL pública (si el bucket es público)
      let publicUrl = null;
      try {
        const { data: pub } = bucket.getPublicUrl(path);
        publicUrl = pub?.publicUrl || null;
      } catch (_) {
        // ignorar si no es público
      }

      uploaded.push({
        path,
        name: safeName,
        mimeType: file?.type || null,
        size: file?.size ?? null,
        publicUrl,
      });

      // Si llevas un registro en tabla "incident_attachments", descomenta esto:
      // await supabase.from('incident_attachments').insert({
      //   incident_id: incidentId,
      //   path,
      //   name: safeName,
      //   mime_type: file?.type || null,
      //   size: file?.size ?? null,
      // });
    }

    return ok(uploaded);
  } catch (e) {
    return fail(e);
  }
}

/**
 * Lista adjuntos desde Storage para un incidente (por prefijo).
 * Si usas tabla "incident_attachments", puedes migrar esta función a SELECT.
 */
export async function listIncidentAttachments(incidentId) {
  try {
    if (!incidentId) return fail(new Error('incidentId es requerido'));

    const bucket = supabase.storage.from(ATTACHMENTS_BUCKET);
    const { data, error } = await bucket.list(incidentId, { limit: 100, offset: 0 });
    if (error) return fail(error);

    const items = (data || []).map((f) => {
      const path = `${incidentId}/${f.name}`;
      const { data: pub } = bucket.getPublicUrl(path);
      return {
        path,
        name: f.name,
        size: f.metadata?.size ?? null,
        lastModified: f.updated_at ?? null,
        publicUrl: pub?.publicUrl || null,
      };
    });

    return ok(items);
  } catch (e) {
    return fail(e);
  }
}

/**
 * Elimina un adjunto del Storage por path (p.ej. "incidentId/archivo.png").
 */
export async function deleteIncidentAttachment(path) {
  try {
    if (!path) return fail(new Error('path es requerido'));
    const bucket = supabase.storage.from(ATTACHMENTS_BUCKET);
    const { error } = await bucket.remove([path]);
    if (error) return fail(error);

    // Si tienes tabla "incident_attachments", podrías también borrarlo allí:
    // await supabase.from('incident_attachments').delete().eq('path', path);

    return ok(true);
  } catch (e) {
    return fail(e);
  }
}

// --- Agregador para soportar ambos estilos de import ---
const incidentService = {
  listIncidents,
  getIncidentById,
  createIncident,
  approveIncident,
  rejectIncident,
  uploadIncidentAttachments,
  listIncidentAttachments,
  deleteIncidentAttachment,
};

export { incidentService };
export default incidentService;