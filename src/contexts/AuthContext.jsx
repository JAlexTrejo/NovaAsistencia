// src/contexts/AuthContext.jsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [employeeProfile, setEmployeeProfile] = useState(null);

  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  // Anti-duplicado / control de concurrencia
  const inFlightRef = useRef(null);      // { userId, promise }
  const lastLoadRef = useRef(0);         // timestamp
  const authChangeTimerRef = useRef(null);

  // ---------- localStorage helpers ----------
  const saveSessionToStorage = useCallback((userData, profileData, employeeData = null) => {
    try {
      const sessionData = {
        user: userData,
        userProfile: profileData,
        employeeProfile: employeeData,
        timestamp: Date.now(),
      };
      localStorage.setItem('asistenciapro_session', JSON.stringify(sessionData));
    } catch (e) {
      console.error('Failed to save session:', e);
    }
  }, []);

  const loadSessionFromStorage = useCallback(() => {
    try {
      const saved = localStorage.getItem('asistenciapro_session');
      if (!saved) return null;
      const sessionData = JSON.parse(saved);
      const isValid = Date.now() - sessionData?.timestamp < 24 * 60 * 60 * 1000;
      if (isValid) return sessionData;
      localStorage.removeItem('asistenciapro_session');
    } catch (e) {
      console.error('Failed to load session:', e);
      localStorage.removeItem('asistenciapro_session');
    }
    return null;
  }, []);

  const clearSessionFromStorage = useCallback(() => {
    try { localStorage.removeItem('asistenciapro_session'); } catch {}
  }, []);
  // ------------------------------------------

  // --------- Carga de perfil (ÚNICA fuente de verdad) ---------
  const fetchUserProfile = useCallback(
    async (userId, { useCache = false } = {}) => {
      if (!userId) return null;

      // Throttle: evita repetición si fue hace < 500ms y es el mismo usuario
      const now = Date.now();
      if (now - lastLoadRef.current < 500 && userProfile?.id === userId) return userProfile;

      // Deduper: si ya hay un fetch en curso para el mismo user, espera ese
      if (inFlightRef.current?.userId === userId) {
        try {
          return await inFlightRef.current.promise;
        } catch {
          // continúa a intentar de nuevo
        }
      }

      setProfileLoading(true);
      setAuthError('');

      const run = async () => {
        try {
          // Cache primero si procede
          if (useCache) {
            const cached = loadSessionFromStorage();
            if (cached?.userProfile?.id === userId) {
              setUserProfile(cached.userProfile);
              setEmployeeProfile(cached.employeeProfile || null);
              return cached.userProfile;
            }
          }

          // Consulta mínima SIN count
          const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('id, full_name, email, phone, role, is_super_admin')
            .eq('id', userId)
            .single();

          if (profileError) throw profileError;

          setUserProfile(profile);

          // Si no es admin, intenta traer su employee_profile activo
          if (profile.role !== 'superadmin' && profile.role !== 'admin') {
            const { data: employeeData, error: empError } = await supabase
              .from('employee_profiles')
              .select(`
                *,
                construction_site:construction_sites!site_id (id, name, address, manager_name, phone),
                supervisor:user_profiles!supervisor_id (id, full_name, email, phone)
              `)
              .eq('user_id', userId)
              .eq('status', 'active')
              .maybeSingle();

            if (!empError) {
              setEmployeeProfile(employeeData || null);
              saveSessionToStorage(user, profile, employeeData || null);
            } else {
              setEmployeeProfile(null);
              saveSessionToStorage(user, profile, null);
            }
          } else {
            setEmployeeProfile(null);
            saveSessionToStorage(user, profile, null);
          }

          return profile;
        } catch (err) {
          console.error('fetchUserProfile error:', err);
          setAuthError(err?.message || 'Failed to load user profile.');
          setEmployeeProfile(null);
          return null;
        } finally {
          lastLoadRef.current = Date.now();
          setProfileLoading(false);
        }
      };

      const promise = run();
      inFlightRef.current = { userId, promise };
      const result = await promise;
      if (inFlightRef.current?.userId === userId) inFlightRef.current = null;
      return result;
    },
    [loadSessionFromStorage, saveSessionToStorage, user, userProfile]
  );
  // ------------------------------------------------------------

  // --------- Inicialización de sesión ----------
  useEffect(() => {
    let isMounted = true;

    const boot = async () => {
      try {
        // 1) Intenta cache
        const cached = loadSessionFromStorage();
        if (cached?.user && isMounted) {
          setUser(cached.user);
          setUserProfile(cached.userProfile);
          setEmployeeProfile(cached.employeeProfile || null);
          setLoading(false);
        }

        // 2) Pide sesión actual (no llama fetchUserProfile aquí; lo hará onAuthStateChange)
        const { data: { session }, error } = await supabase.auth.getSession();
        if (!isMounted) return;
        if (error) throw error;

        setUser(session?.user ?? null);
        setLoading(false);
      } catch (e) {
        console.error('Session init error:', e);
        setAuthError('Failed to load session. Please refresh the page.');
        setLoading(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;

      // Debounce del SDK (algunas veces dispara múltiples eventos cercanos)
      if (authChangeTimerRef.current) clearTimeout(authChangeTimerRef.current);
      authChangeTimerRef.current = setTimeout(async () => {
        setUser(session?.user ?? null);
        if (session?.user?.id) {
          await fetchUserProfile(session.user.id, { useCache: true });
        } else {
          setUserProfile(null);
          setEmployeeProfile(null);
          clearSessionFromStorage();
        }
      }, 120);
    });

    boot();

    return () => {
      isMounted = false;
      subscription?.unsubscribe?.();
      if (authChangeTimerRef.current) clearTimeout(authChangeTimerRef.current);
    };
  }, [fetchUserProfile, loadSessionFromStorage, clearSessionFromStorage]);
  // --------------------------------------------

  // --------- Operaciones de perfil públicas (stab. con useCallback) ---------
  const refreshUserProfile = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    await fetchUserProfile(user.id, { useCache: false });
    setLoading(false);
  }, [user?.id, fetchUserProfile]);

  const logActivity = useCallback(
    async (action, module, description, userId = null) => {
      try {
        await supabase.from('logs_actividad').insert({
          usuario_id: userId || user?.id,
          rol: userProfile?.role || 'user',
          accion: action,
          modulo: module,
          descripcion: description,
        });
      } catch (e) {
        console.error('Failed to log activity:', e);
      }
    },
    [user?.id, userProfile?.role]
  );

  const signIn = useCallback(
    async (email, password) => {
      try {
        setAuthError('');
        setLoading(true);
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await logActivity('login', 'Authentication', 'User logged in successfully', data?.user?.id);
        return { success: true, user: data?.user };
      } catch (e) {
        setAuthError(e?.message || 'Something went wrong.');
        return { success: false, error: e?.message };
      } finally {
        setLoading(false);
      }
    },
    [logActivity]
  );

  const signUp = useCallback(
    async (email, password, fullName, role = 'user') => {
      try {
        setAuthError('');
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName, role } },
        });
        if (error) throw error;
        await logActivity('registration', 'Authentication', 'New user registered', data?.user?.id);
        return { success: true, user: data?.user };
      } catch (e) {
        setAuthError(e?.message || 'Something went wrong.');
        return { success: false, error: e?.message };
      }
    },
    [logActivity]
  );

  const sendOTP = useCallback(async (phone, email) => {
    try {
      setAuthError('');
      const otpData = phone ? { phone } : email ? { email } : null;
      if (!otpData) return { success: false, error: 'Debe proporcionar un teléfono o correo electrónico' };
      const { data, error } = await supabase.auth.signInWithOtp(otpData);
      if (error) throw error;
      return { success: true, data };
    } catch (e) {
      setAuthError(e?.message || 'Something went wrong.');
      return { success: false, error: e?.message };
    }
  }, []);

  const verifyOTP = useCallback(
    async (phone, email, token, fullName, role = 'user') => {
      try {
        setAuthError('');
        const verifyData = { token, type: phone ? 'sms' : 'email', ...(phone ? { phone } : { email }) };
        const { data, error } = await supabase.auth.verifyOtp(verifyData);
        if (error) throw error;
        await logActivity('otp_verification', 'Authentication', 'OTP verified successfully', data?.user?.id);
        return { success: true, user: data?.user, session: data?.session };
      } catch (e) {
        setAuthError(e?.message || 'Something went wrong.');
        return { success: false, error: e?.message };
      }
    },
    [logActivity]
  );

  const resetPassword = useCallback(async (email, redirectTo) => {
    try {
      setAuthError('');
      if (!email) return { success: false, error: 'Debes ingresar un correo' };
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectTo || `${window.location.origin}/auth/reset`,
      });
      if (error) throw error;
      return { success: true, data };
    } catch (e) {
      return { success: false, error: e?.message || 'No se pudo enviar el enlace de restablecimiento' };
    }
  }, []);

  const updatePassword = useCallback(async (newPassword) => {
    try {
      setAuthError('');
      if (!newPassword) return { success: false, error: 'Ingresa una contraseña válida' };
      const { data, error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      try { await logActivity('password_update', 'Authentication', 'User updated password'); } catch {}
      return { success: true, data };
    } catch (e) {
      return { success: false, error: e?.message || 'No se pudo actualizar la contraseña' };
    }
  }, [logActivity]);

  const signOut = useCallback(async () => {
    try {
      setAuthError('');
      await logActivity('logout', 'Authentication', 'User logged out');
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      clearSessionFromStorage();
      return { success: true };
    } catch (e) {
      setAuthError(e?.message || 'Failed to sign out');
      return { success: false, error: e?.message || 'Failed to sign out' };
    }
  }, [logActivity, clearSessionFromStorage]);
  // ---------------------------------------------------------------------------------------

  const getUserProfile = useCallback(() => userProfile, [userProfile]);
  const getEmployeeProfile = useCallback(() => employeeProfile, [employeeProfile]);

  // Roles (callbacks estables)
  const isAdmin = useCallback(
    () => userProfile?.role === 'admin' || userProfile?.role === 'superadmin',
    [userProfile?.role]
  );
  const isSuperAdmin = useCallback(
    () => userProfile?.role === 'superadmin' || userProfile?.is_super_admin === true,
    [userProfile?.role, userProfile?.is_super_admin]
  );
  const isSupervisor = useCallback(
    () => ['supervisor', 'admin', 'superadmin'].includes(userProfile?.role),
    [userProfile?.role]
  );
  const hasRole = useCallback((requiredRole) => {
    if (!userProfile?.role) return false;
    const rank = { user: 1, supervisor: 2, admin: 3, superadmin: 4 };
    return (rank[userProfile.role] || 0) >= (rank[requiredRole] || 0);
  }, [userProfile?.role]);

  const getCurrentUserContext = useCallback(() => {
    if (!userProfile) return null;
    return {
      id: userProfile.id,
      name: userProfile.full_name || userProfile.email?.split('@')?.[0],
      email: userProfile.email,
      role: userProfile.role,
      phone: userProfile.phone,
      avatar: null,
      site: employeeProfile?.construction_site?.name || 'No asignado',
      supervisor: employeeProfile?.supervisor?.full_name || 'No asignado',
      position: employeeProfile?.position || 'No asignado',
      employeeId: employeeProfile?.employee_id || null,
      isEmployee: !!employeeProfile,
    };
  }, [userProfile, employeeProfile]);

  const getConnectionStatus = useCallback(async () => {
    try {
      // test mínimo contra auth (sin tocar user_profiles)
      const { data, error } = await supabase.auth.getSession();
      if (error) return { success: false, error: error.message, type: 'auth' };
      return { success: true };
    } catch (e) {
      return { success: false, error: e?.message || 'Connection test failed', type: 'unknown' };
    }
  }, []);

  // ⚠️ IMPORTANTE: memoiza el valor del Context para que NO cambie en cada render
  const value = useMemo(
    () => ({
      user,
      userProfile,
      employeeProfile,
      loading,
      profileLoading,
      authError,
      // auth ops
      signIn,
      signUp,
      sendOTP,
      verifyOTP,
      resetPassword,
      updatePassword,
      signOut,
      // profile ops
      getUserProfile,
      getEmployeeProfile,
      fetchUserProfile,
      refreshUserProfile,
      getCurrentUserContext,
      // roles
      isAdmin,
      isSuperAdmin,
      isSupervisor,
      hasRole,
      // misc
      setAuthError,
      getConnectionStatus,
    }),
    [
      user,
      userProfile,
      employeeProfile,
      loading,
      profileLoading,
      authError,
      signIn,
      signUp,
      sendOTP,
      verifyOTP,
      resetPassword,
      updatePassword,
      signOut,
      getUserProfile,
      getEmployeeProfile,
      fetchUserProfile,
      refreshUserProfile,
      getCurrentUserContext,
      isAdmin,
      isSuperAdmin,
      isSupervisor,
      hasRole,
      getConnectionStatus,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
