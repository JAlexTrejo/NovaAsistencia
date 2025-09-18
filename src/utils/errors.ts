export type AppError = { code?: string; error: string };

export function adaptSupabaseError(e: any): AppError {
  const msg = e?.message || String(e || 'Unknown');
  const code = e?.code || '';

  if (/Failed to fetch|Network|ERR_NETWORK|TypeError: fetch/i.test(msg))
    return { code: 'NETWORK', error: 'Sin conexión con el servicio. Inténtalo de nuevo.' };

  // permisos / RLS
  if (/permission denied|401|403|RLS/i.test(msg))
    return { code: 'FORBIDDEN', error: 'No tienes permisos para esa operación.' };

  // recurso inexistente
  if (/PGRST116|No rows found/i.test(msg))
    return { code: 'NOT_FOUND', error: 'No se encontró la información solicitada.' };

  // validación
  if (/invalid input|violates|constraint/i.test(msg))
    return { code: 'VALIDATION', error: 'Datos inválidos o incompletos.' };

  // config supabase
  if (/Invalid API key|Project not found/i.test(msg))
    return { code: 'CONFIG', error: 'Configuración de base de datos inválida.' };

  return { code: code || 'UNKNOWN', error: 'Ocurrió un error. Intenta de nuevo.' };
}
