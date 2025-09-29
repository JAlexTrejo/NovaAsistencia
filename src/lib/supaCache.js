// src/lib/supaCache.js
const CACHE = new Map();       // key -> { t, ttl, data }
const INFLIGHT = new Map();    // key -> Promise

function keyFrom(parts) {
  return JSON.stringify(parts, (_, v) => (v instanceof Date ? v.toISOString() : v));
}

/**
 * selectCached: evita duplicar llamadas idénticas y cachea por TTL.
 * @param {(supabase) => Promise<{ data, error }>} fetcher función que hace el .from().select(...)
 * @param {object} kParts partes para la cache key (tabla, cols, filtros, etc.)
 * @param {number} ttlMs tiempo en ms (p.ej. 15s)
 */
export async function selectCached(fetcher, kParts, ttlMs = 15000) {
  const k = keyFrom(kParts);
  const now = Date.now();

  // cache hit fresco
  const cached = CACHE.get(k);
  if (cached && now - cached.t < cached.ttl) {
    return { data: cached.data, error: null, fromCache: true };
  }

  // dedupe: si ya hay una llamada en vuelo con la misma key, espera esa
  if (INFLIGHT.has(k)) {
    return INFLIGHT.get(k);
  }

  const p = (async () => {
    try {
      const { supabase } = await import('@/lib/supabase');
      const { data, error } = await fetcher(supabase);
      if (!error) {
        CACHE.set(k, { t: now, ttl: ttlMs, data });
      }
      return { data, error, fromCache: false };
    } finally {
      INFLIGHT.delete(k);
    }
  })();

  INFLIGHT.set(k, p);
  return p;
}

/** Limpia manualmente una clave específica */
export function invalidateCached(kParts) {
  CACHE.delete(keyFrom(kParts));
}

/** Limpia toda la caché (si cambias de sesión, por ejemplo) */
export function clearSupaCache() {
  CACHE.clear();
  INFLIGHT.clear();
}
