// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

// 1) Carga segura de variables y mensajes claros
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // Error claro en build y runtime
  throw new Error(
    '[Supabase] Faltan variables VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY. ' +
    'Verifica tu .env (.staging / .production) y docker-compose.'
  );
}

// 2) Fetch con timeout suave para evitar cuelgues (red inestable)
const fetchWithTimeout = (input, init = {}) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 12000); // 12s
  const merged = { ...init, signal: controller.signal };
  return fetch(input, merged).finally(() => clearTimeout(id));
};

// 3) Crear cliente con opciones recomendadas para frontend
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true, // útil si haces magic links / OAuth
    storageKey: 'gyidcrm.auth', // evita colisiones si tienes varios proyectos
  },
  global: {
    // Útil para tracing y para bloquear caches agresivas de proxies
    headers: {
      'X-Client-Info': 'GYID-CRM-Web',
      'Cache-Control': 'no-store',
    },
    fetch: fetchWithTimeout,
  },
  // db: { schema: 'public' }, // si en el futuro usas un schema distinto, descomenta
});

// 4) (Opcional pero útil) Reacciona a cambios de sesión para refrescar perfil
//    Lo usaremos en el Paso 3 cuando centralicemos estado de datos (TanStack/useQuery)
supabase.auth.onAuthStateChange((_event, _session) => {
  // Aquí NO hacemos fetch pesado. Solo notificar si quieres un EventEmitter o Signal.
  // window.dispatchEvent(new CustomEvent('auth:changed'));
});
