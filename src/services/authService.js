// src/services/authService.js
import { supabase } from '@/lib/supabase';
import { adaptSupabaseError } from '@/utils/errors';

// ============================
// Circuit Breaker (perfil)
// ============================
class CircuitBreaker {
  constructor(threshold = 3, resetTimeout = 30000) {
    this.threshold = threshold;
    this.resetTimeout = resetTimeout;
    this.failureCount = 0;
    this.state = 'CLOSED';
    this.nextAttempt = Date.now();
  }
  async call(fn) {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        throw new Error('Circuit breaker is OPEN. Service temporarily unavailable.');
      }
      this.state = 'HALF_OPEN';
    }
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (err) {
      this.onFailure();
      throw err;
    }
  }
  onSuccess() { this.failureCount = 0; this.state = 'CLOSED'; }
  onFailure() {
    this.failureCount++;
    if (this.failureCount >= this.threshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.resetTimeout;
    }
  }
}
const profileCircuitBreaker = new CircuitBreaker(3, 30000);

// ============================
// Helpers
// ============================
const PROFILE_COLS = [
  'id',
  'full_name',
  'email',
  'phone',          // ← nuevo
  'daily_salary',   // ← nuevo
  'role',
  'active',
  'created_at',
  'updated_at',
].join(',');

const ok   = (data) => ({ ok: true,  data });
const fail = (e)    => ({ ok: false, ...adaptSupabaseError(e) });

function classifyError(error) {
  if (!error) return { type: 'unknown', message: 'Unknown error occurred' };
  const message = error?.message || '';
  const code    = error?.code || '';
  if (/Failed to fetch|NetworkError|ERR_NETWORK|TypeError: fetch/i.test(message))
    return { type: 'network', message: 'Sin conexión con el servicio. Inténtalo de nuevo.' };
  if (/Invalid API key|Project not found/i.test(message) || code === 'INVALID_API_KEY')
    return { type: 'configuration', message: 'Error de configuración de base de datos.' };
  if (/row-level security policy|permission denied/i.test(message) || code === 'PGRST301')
    return { type: 'permission', message: 'Acceso denegado por políticas de seguridad.' };
  if (code === 'PGRST116' || /No rows found/i.test(message))
    return { type: 'not_found', message: 'Registro no encontrado.' };
  if (/^PGRST|^22|^23/.test(code))
    return { type: 'database', message: 'Error de base de datos.' };
  return { type: 'unknown', message: message || 'Ocurrió un error inesperado.' };
}

async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (e) {
      const t = classifyError(e).type;
      if (t === 'configuration' || t === 'permission') throw e;
      if (attempt === maxRetries) throw e;
      const ms = baseDelay * Math.pow(2, attempt - 1);
      await new Promise(r => setTimeout(r, ms));
    }
  }
}

// ============================
// authService
// ============================
export const authService = {
  async testConnection() {
    try {
      if (!supabase) return fail({ message: 'Supabase client not initialized' });
      const url = import.meta.env?.VITE_SUPABASE_URL;
      const key = import.meta.env?.VITE_SUPABASE_ANON_KEY;
      if (!url || !key) return fail({ message: 'Missing env: VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY', code: 'CONFIG' });

      // Test auth connection only - no need to query user_profiles
      const { error: sErr } = await supabase.auth.getSession();
      if (sErr) return fail(sErr);

      return ok(true);
    } catch (e) {
      return fail(e);
    }
  },

  async signIn(email, password) {
    try {
      const res = await retryWithBackoff(async () => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        return data;
      });
      return ok({ user: res?.user, session: res?.session });
    } catch (e) {
      const info = classifyError(e);
      return { ok: false, error: info.message, code: info.type };
    }
  },

  async signUp(email, password, fullName, role = 'user', phone = null, dailySalary = 0) {
    try {
      // Creamos el usuario en auth con metadatos útiles
      const res = await retryWithBackoff(async () => {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName, role, phone, daily_salary: dailySalary } },
        });
        if (error) throw error;
        return data;
      });

      // Opcional: crear perfil en user_profiles si tu flujo lo requiere ya (RLS permite Admin; para usuario normal puede fallar)
      // Recomendado: hacerlo desde un job/edge function con service role, o desde un Admin en backoffice.
      // Aquí lo intentamos, pero NO rompemos si falla por RLS.
      if (res?.user?.id) {
        const payload = {
          id: res.user.id,
          email,
          full_name: fullName ?? null,
          phone: phone ?? null,
          daily_salary: Number.isFinite(+dailySalary) ? +dailySalary : 0,
          role,
          active: true,
        };
        const { error: upErr } = await supabase.from('user_profiles').insert([payload]).select('id').maybeSingle();
        if (upErr) {
          // No interrumpimos el alta de auth; solo log
          console.warn('No se pudo crear user_profiles por RLS (probable):', upErr.message);
        }
      }

      return ok({ user: res?.user, session: res?.session });
    } catch (e) {
      const info = classifyError(e);
      return { ok: false, error: info.message, code: info.type };
    }
  },

  async signUpWithPhone(phone, fullName, role = 'user') {
    try {
      const res = await retryWithBackoff(async () => {
        const { data, error } = await supabase.auth.signInWithOtp({
          phone,
          options: { data: { full_name: fullName, role } },
        });
        if (error) throw error;
        return data;
      });
      return ok(res);
    } catch (e) {
      const info = classifyError(e);
      return { ok: false, error: info.message, code: info.type };
    }
  },

  async sendPhoneOTP(phone) {
    try {
      const res = await retryWithBackoff(async () => {
        const { data, error } = await supabase.auth.signInWithOtp({ phone });
        if (error) throw error;
        return data;
      });
      return ok(res);
    } catch (e) {
      const info = classifyError(e);
      return { ok: false, error: info.message, code: info.type };
    }
  },

  async sendEmailOTP(email) {
    try {
      const res = await retryWithBackoff(async () => {
        const { data, error } = await supabase.auth.signInWithOtp({ email });
        if (error) throw error;
        return data;
      });
      return ok(res);
    } catch (e) {
      const info = classifyError(e);
      return { ok: false, error: info.message, code: info.type };
    }
  },

  async verifyOTP({ phone, email, token, type = 'sms' }) {
    try {
      const res = await retryWithBackoff(async () => {
        const verifyData = { token, type };
        if (phone) verifyData.phone = phone; else if (email) verifyData.email = email;
        const { data, error } = await supabase.auth.verifyOtp(verifyData);
        if (error) throw error;
        return data;
      });
      return ok({ user: res?.user, session: res?.session });
    } catch (e) {
      const info = classifyError(e);
      return { ok: false, error: info.message, code: info.type };
    }
  },

  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) return fail(error);
      return ok(true);
    } catch (e) {
      return fail(e);
    }
  },

  async getSession() {
    try {
      const res = await retryWithBackoff(async () => {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        return session || null;
      });
      return ok(res);
    } catch (e) {
      return fail(e);
    }
  },

  // ============================
  // USER PROFILE
  // ============================
  async getUserProfile(userId) {
    if (!userId) return { ok: false, error: 'User ID is required', code: 'VALIDATION' };
    try {
      const data = await profileCircuitBreaker.call(async () => {
        const { data, error } = await supabase
          .from('user_profiles')
          .select(PROFILE_COLS)
          .eq('id', userId)
          .maybeSingle();
        if (error) {
          const info = classifyError(error);
          if (info.type === 'not_found') return null;
          console.error('Profile fetch error:', { userId, info });
          throw new Error(info.message);
        }
        return data || null;
      });
      return ok(data);
    } catch (e) {
      if (String(e?.message || '').includes('Circuit breaker is OPEN')) {
        return { ok: false, error: 'Service temporarily unavailable. Please try again shortly.', code: 'CB_OPEN' };
      }
      return fail(e);
    }
  },

  async createUserProfile(user) {
    try {
      const payload = {
        id: user?.id,
        email: user?.email ?? null,
        full_name: user?.full_name ?? null,
        phone: user?.phone ?? null,                                  // ← nuevo
        daily_salary: Number.isFinite(+user?.daily_salary) ? +user?.daily_salary : 0, // ← nuevo
        role: user?.role ?? 'user',
        active: true,
      };
      const { data, error } = await supabase
        .from('user_profiles')
        .insert([payload])
        .select(PROFILE_COLS)
        .maybeSingle();

      if (error) return fail(error);
      return ok(data);
    } catch (e) {
      return fail(e);
    }
  },

  async updateUserProfile(userId, updates) {
    try {
      const mapped = {};
      if ('email' in updates)        mapped.email = updates.email;
      if ('full_name' in updates)    mapped.full_name = updates.full_name;
      if ('phone' in updates)        mapped.phone = updates.phone; // ← nuevo
      if ('daily_salary' in updates) mapped.daily_salary = Number.isFinite(+updates.daily_salary) ? +updates.daily_salary : 0; // ← nuevo
      if ('role' in updates)         mapped.role = updates.role;
      if ('active' in updates)       mapped.active = !!updates.active;

      const { data, error } = await supabase
        .from('user_profiles')
        .update(mapped)
        .eq('id', userId)
        .select(PROFILE_COLS)
        .maybeSingle();

      if (error) return fail(error);
      return ok(data);
    } catch (e) {
      return fail(e);
    }
  },

  // ============================
  // Auditoría opcional
  // ============================
  async logActivity(action, module, description, userId = null) {
    try {
      await supabase.rpc('log_activity', {
        p_accion: action,
        p_modulo: module,
        p_descripcion: description,
        p_usuario_id: userId,
      });
      return ok(true);
    } catch (e) {
      console.error('Failed to log activity:', { action, module, description, userId, error: e?.message });
      return { ok: false, error: 'Failed to log activity' };
    }
  },

  getCircuitBreakerStatus() {
    return {
      state: profileCircuitBreaker.state,
      failureCount: profileCircuitBreaker.failureCount,
      nextAttempt: profileCircuitBreaker.nextAttempt,
    };
  },
  resetCircuitBreaker() {
    profileCircuitBreaker.failureCount = 0;
    profileCircuitBreaker.state = 'CLOSED';
    profileCircuitBreaker.nextAttempt = Date.now();
  },
};

export default authService;
