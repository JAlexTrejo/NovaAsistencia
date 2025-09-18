import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [employeeProfile, setEmployeeProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState('')
  const [profileLoading, setProfileLoading] = useState(false)

  // Persist session data to localStorage
  const saveSessionToStorage = useCallback((userData, profileData, employeeData = null) => {
    try {
      const sessionData = {
        user: userData,
        userProfile: profileData,
        employeeProfile: employeeData,
        timestamp: Date.now()
      }
      localStorage.setItem('asistenciapro_session', JSON.stringify(sessionData))
    } catch (error) {
      console.error('Failed to save session to localStorage:', error)
    }
  }, [])

  // Load session data from localStorage
  const loadSessionFromStorage = useCallback(() => {
    try {
      const savedSession = localStorage.getItem('asistenciapro_session')
      if (savedSession) {
        const sessionData = JSON.parse(savedSession)
        // Check if session is less than 24 hours old
        const isValid = (Date.now() - sessionData?.timestamp) < (24 * 60 * 60 * 1000)
        if (isValid) {
          return sessionData
        } else {
          localStorage.removeItem('asistenciapro_session')
        }
      }
    } catch (error) {
      console.error('Failed to load session from localStorage:', error)
      localStorage.removeItem('asistenciapro_session')
    }
    return null
  }, [])

  // Clear session from storage
  const clearSessionFromStorage = useCallback(() => {
    try {
      localStorage.removeItem('asistenciapro_session')
    } catch (error) {
      console.error('Failed to clear session from localStorage:', error)
    }
  }, [])

  // Fetch user profile with enhanced error handling
  const fetchUserProfile = useCallback(async (userId, useCache = false) => {
    if (!userId) {
      console.error('fetchUserProfile called without userId')
      return null
    }

    try {
      // Check cache first if requested
      if (useCache) {
        const cachedSession = loadSessionFromStorage()
        if (cachedSession?.userProfile?.id === userId) {
          setUserProfile(cachedSession?.userProfile)
          setEmployeeProfile(cachedSession?.employeeProfile || null)
          return cachedSession?.userProfile;
        }
      }

      // Fetch fresh user profile data
      const { data: profileData, error: profileError } = await supabase
        ?.from('user_profiles')
        ?.select('*')
        ?.eq('id', userId)
        ?.single()

      if (profileError && profileError?.code === 'PGRST116') {
        // User profile not found - create it
        return await createUserProfile(userId)
      }

      if (profileError) {
        console.error('Profile fetch error:', profileError)
        setAuthError(`Failed to load user profile: ${profileError?.message}`)
        return null
      }

      setUserProfile(profileData)

      // Try to fetch employee profile if user has one
      if (profileData?.role !== 'superadmin' && profileData?.role !== 'admin') {
        try {
          const { data: employeeData, error: empError } = await supabase
            ?.from('employee_profiles')
            ?.select(`
              *,
              construction_site:construction_sites!site_id(
                id, name, address, manager_name, phone
              ),
              supervisor:user_profiles!supervisor_id(
                id, full_name, email, phone
              )
            `)
            ?.eq('user_id', userId)
            ?.eq('status', 'active')
            ?.single()

          if (!empError && employeeData) {
            setEmployeeProfile(employeeData)
            saveSessionToStorage(user, profileData, employeeData)
          } else {
            saveSessionToStorage(user, profileData, null)
          }
        } catch (empErr) {
          console.error('Employee profile fetch error:', empErr)
          saveSessionToStorage(user, profileData, null)
        }
      } else {
        // Admin/superadmin - no employee profile needed
        saveSessionToStorage(user, profileData, null)
      }

      return profileData

    } catch (error) {
      console.error('Error in fetchUserProfile:', error)
      if (error?.message?.includes('Failed to fetch')) {
        setAuthError('Cannot connect to database. Please check your connection.')
      } else {
        setAuthError('Failed to load user profile')
      }
      return null
    }
  }, [user, saveSessionToStorage, loadSessionFromStorage])

  // Create user profile for new users
  const createUserProfile = async (userId) => {
    try {
      const { data: authUser } = await supabase?.auth?.getUser()
      
      if (!authUser?.user) {
        setAuthError('User authentication data not available')
        return null
      }

      const profileData = {
        id: userId,
        email: authUser?.user?.email,
        full_name: authUser?.user?.user_metadata?.full_name || authUser?.user?.email?.split('@')?.[0],
        role: 'user',
        phone: authUser?.user?.user_metadata?.phone || null,
        raw_user_meta_data: authUser?.user?.user_metadata || {},
        raw_app_meta_data: authUser?.user?.app_metadata || {},
        is_super_admin: false,
        is_sso_user: false,
        is_anonymous: false
      }

      const { data, error } = await supabase
        ?.from('user_profiles')
        ?.insert([profileData])
        ?.select()
        ?.single()

      if (error) {
        console.error('Error creating user profile:', error)
        setAuthError(`Failed to create user profile: ${error?.message}`)
        return null
      }

      setUserProfile(data)
      saveSessionToStorage(user, data, null)
      
      // Log activity
      await logActivity('profile_creation', 'Authentication', 'User profile created automatically')
      
      return data
    } catch (error) {
      console.error('Error in createUserProfile:', error)
      setAuthError('Failed to initialize user profile')
      return null
    }
  }

  // Initialize session on app load
  useEffect(() => {
    let isMounted = true

    const initializeSession = async () => {
      try {
        // First check localStorage cache
        const cachedSession = loadSessionFromStorage()
        if (cachedSession && isMounted) {
          setUser(cachedSession?.user)
          setUserProfile(cachedSession?.userProfile)
          setEmployeeProfile(cachedSession?.employeeProfile || null)
          
          // Verify session is still valid with Supabase
          const { data: { session } } = await supabase?.auth?.getSession()
          if (session?.user) {
            // Session is valid, refresh profile data in background
            fetchUserProfile(session?.user?.id, false)
          } else {
            // Session expired, clear cache
            clearSessionFromStorage()
            setUser(null)
            setUserProfile(null)
            setEmployeeProfile(null)
          }
          
          if (isMounted) setLoading(false)
          return
        }

        // No cache, get fresh session
        const { data: { session }, error: sessionError } = await supabase?.auth?.getSession()
        
        if (sessionError) {
          throw sessionError
        }

        if (session?.user && isMounted) {
          setUser(session?.user)
          await fetchUserProfile(session?.user?.id, false)
        }

      } catch (error) {
        console.error('Session initialization error:', error)
        if (error?.message?.includes('Failed to fetch') || 
            error?.message?.includes('AuthRetryableFetchError')) {
          setAuthError('Cannot connect to authentication service. Your Supabase project may be paused.')
        } else {
          setAuthError('Failed to load session')
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    // Listen for auth state changes
    const { data: { subscription } } = supabase?.auth?.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return

        if (session?.user) {
          setUser(session?.user)
          // Fire and forget - don't await
          fetchUserProfile(session?.user?.id, false)
        } else {
          setUser(null)
          setUserProfile(null)
          setEmployeeProfile(null)
          clearSessionFromStorage()
        }
        setLoading(false)
        setAuthError('')
      }
    )

    initializeSession()

    return () => {
      isMounted = false
      subscription?.unsubscribe()
    }
  }, [fetchUserProfile, loadSessionFromStorage, clearSessionFromStorage])

  const logActivity = async (action, module, description, userId = null) => {
    try {
      await supabase?.from('logs_actividad')?.insert({
        usuario_id: userId || user?.id,
        rol: userProfile?.role || 'user',
        accion: action,
        modulo: module,
        descripcion: description
      });
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  }

  const signIn = async (email, password) => {
    try {
      setAuthError('')
      setLoading(true)
      
      const { data, error } = await supabase?.auth?.signInWithPassword({
        email,
        password
      })
      
      if (error) {
        setAuthError(error?.message)
        setLoading(false)
        return { success: false, error: error?.message };
      }
      
      // Log successful login
      await logActivity('login', 'Authentication', 'User logged in successfully', data?.user?.id)
      
      return { success: true, user: data?.user };
    } catch (error) {
      if (error?.message?.includes('Failed to fetch') || 
          error?.message?.includes('AuthRetryableFetchError')) {
        setAuthError('Cannot connect to authentication service. Your Supabase project may be paused.')
      } else {
        setAuthError('Something went wrong. Please try again.')
        console.error('JavaScript error in auth:', error)
      }
      setLoading(false)
      return { success: false, error: authError }
    }
  }

  const signUp = async (email, password, fullName, role = 'user') => {
    try {
      setAuthError('')
      const { data, error } = await supabase?.auth?.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: role
          }
        }
      })
      
      if (error) {
        setAuthError(error?.message)
        return { success: false, error: error?.message };
      }
      
      // Log registration
      await logActivity('registration', 'Authentication', 'New user registered', data?.user?.id)
      
      return { success: true, user: data?.user };
    } catch (error) {
      if (error?.message?.includes('Failed to fetch') || 
          error?.message?.includes('AuthRetryableFetchError')) {
        setAuthError('Cannot connect to authentication service. Your Supabase project may be paused.')
      } else {
        setAuthError('Something went wrong. Please try again.')
        console.error('JavaScript error in signup:', error)
      }
      return { success: false, error: authError }
    }
  }

  const sendOTP = async (phone, email) => {
    try {
      setAuthError('')
      const otpData = {}
      
      if (phone) {
        otpData.phone = phone
      } else if (email) {
        otpData.email = email
      } else {
        setAuthError('Debe proporcionar un teléfono o correo electrónico')
        return { success: false, error: 'Debe proporcionar un teléfono o correo electrónico' }
      }

      const { data, error } = await supabase?.auth?.signInWithOtp(otpData)
      
      if (error) {
        setAuthError(error?.message)
        return { success: false, error: error?.message };
      }
      
      return { success: true, data: data };
    } catch (error) {
      if (error?.message?.includes('Failed to fetch') || 
          error?.message?.includes('AuthRetryableFetchError')) {
        setAuthError('Cannot connect to authentication service. Your Supabase project may be paused.')
      } else {
        setAuthError('Something went wrong. Please try again.')
        console.error('JavaScript error in sendOTP:', error)
      }
      return { success: false, error: authError }
    }
  }

  const verifyOTP = async (phone, email, token, fullName, role = 'user') => {
    try {
      setAuthError('')
      const verifyData = {
        token: token,
        type: phone ? 'sms' : 'email'
      };

      if (phone) {
        verifyData.phone = phone;
      } else if (email) {
        verifyData.email = email;
      }

      const { data, error } = await supabase?.auth?.verifyOtp(verifyData)
      
      if (error) {
        setAuthError(error?.message)
        return { success: false, error: error?.message };
      }
      
      // Log OTP verification
      await logActivity('otp_verification', 'Authentication', 'OTP verified successfully', data?.user?.id)
      
      return { success: true, user: data?.user, session: data?.session };
    } catch (error) {
      if (error?.message?.includes('Failed to fetch') || 
          error?.message?.includes('AuthRetryableFetchError')) {
        setAuthError('Cannot connect to authentication service. Your Supabase project may be paused.')
      } else {
        setAuthError('Something went wrong. Please try again.')
        console.error('JavaScript error in verifyOTP:', error)
      }
      return { success: false, error: authError }
    }
  }

  const signOut = async () => {
    try {
      setAuthError('')
      
      // Log logout before signing out
      await logActivity('logout', 'Authentication', 'User logged out')
      
      const { error } = await supabase?.auth?.signOut()
      if (error) {
        setAuthError(error?.message)
        return { success: false, error: error?.message };
      }
      
      // Clear local storage
      clearSessionFromStorage()
      
      return { success: true }
    } catch (error) {
      setAuthError('Failed to sign out')
      console.error('Signout error:', error)
      return { success: false, error: 'Failed to sign out' }
    }
  }

  // Force refresh user profile from database
  const refreshUserProfile = async () => {
    if (user?.id) {
      setLoading(true)
      await fetchUserProfile(user?.id, false)
      setLoading(false)
    }
  }

  const getUserProfile = () => {
    return userProfile
  }

  const getEmployeeProfile = () => {
    return employeeProfile
  }

  // Enhanced role checking methods
  const isAdmin = () => {
    return userProfile?.role === 'admin' || userProfile?.role === 'superadmin'
  }

  const isSuperAdmin = () => {
    return userProfile?.role === 'superadmin' || userProfile?.is_super_admin === true
  }

  const isSupervisor = () => {
    return userProfile?.role === 'supervisor' || userProfile?.role === 'admin' || userProfile?.role === 'superadmin'
  }

  const hasRole = (requiredRole) => {
    if (!userProfile?.role) return false
    
    const roleHierarchy = {
      'user': 1,
      'supervisor': 2,
      'admin': 3,
      'superadmin': 4
    }
    
    const userLevel = roleHierarchy?.[userProfile?.role] || 0
    const requiredLevel = roleHierarchy?.[requiredRole] || 0
    
    return userLevel >= requiredLevel
  }

  // Get current user context for headers and components
  const getCurrentUserContext = () => {
    if (!userProfile) return null

    return {
      id: userProfile?.id,
      name: userProfile?.full_name || userProfile?.email?.split('@')?.[0],
      email: userProfile?.email,
      role: userProfile?.role,
      phone: userProfile?.phone,
      avatar: null, // Can be enhanced to use profile pictures
      site: employeeProfile?.construction_site?.name || 'No asignado',
      supervisor: employeeProfile?.supervisor?.full_name || 'No asignado',
      position: employeeProfile?.position || 'No asignado',
      employeeId: employeeProfile?.employee_id || null,
      isEmployee: !!employeeProfile
    }
  }

  // Add connection diagnostic method
  const getConnectionStatus = async () => {
    try {
      const { authService } = await import('../services/authService');
      const result = await authService?.testConnection();
      return result;
    } catch (error) {
      return {
        success: false,
        error: error?.message || 'Connection test failed',
        type: 'unknown'
      };
    }
  };

  // Add circuit breaker status
  const getCircuitBreakerStatus = async () => {
    try {
      const { authService } = await import('../services/authService');
      return authService?.getCircuitBreakerStatus();
    } catch (error) {
      return {
        state: 'UNKNOWN',
        failureCount: 0,
        nextAttempt: Date.now()
      };
    }
  };

  // Add circuit breaker reset
  const resetCircuitBreaker = async () => {
    try {
      const { authService } = await import('../services/authService');
      authService?.resetCircuitBreaker();
      setAuthError(''); // Clear errors when manually resetting
      return { success: true };
    } catch (error) {
      return { success: false, error: error?.message };
    }
  };

  const profileOperations = {
    async load(userId) {
      if (!userId) return;
      
      // Prevent multiple simultaneous profile fetches for the same user
      if (profileOperations?._loading === userId) {
        console.log('Profile fetch already in progress for user:', userId);
        return;
      }
      
      profileOperations._loading = userId;
      setProfileLoading(true);
      
      try {
        const { authService } = await import('../services/authService');
        
        // Test connection first if we've had recent errors
        if (authError) {
          const connectionTest = await authService?.testConnection();
          if (!connectionTest?.success) {
            setAuthError(connectionTest?.error);
            return;
          }
        }
        
        // Fetch user profile with enhanced error handling
        const profileData = await authService?.getUserProfile(userId);
        
        if (profileData) {
          setUserProfile(profileData);
          setAuthError(''); // Clear any previous errors
          
          // Try to fetch employee profile if user has one
          if (profileData?.role !== 'superadmin' && profileData?.role !== 'admin') {
            try {
              const { data: employeeData, error: empError } = await supabase
                ?.from('employee_profiles')?.select(`*,construction_site:construction_sites!site_id(id, name, address, manager_name, phone),supervisor:user_profiles!supervisor_id(id, full_name, email, phone)`)?.eq('user_id', userId)?.eq('status', 'active')
                ?.single();

              if (!empError && employeeData) {
                setEmployeeProfile(employeeData);
                saveSessionToStorage(user, profileData, employeeData);
              } else {
                setEmployeeProfile(null);
                saveSessionToStorage(user, profileData, null);
              }
            } catch (empErr) {
              console.error('Employee profile fetch error:', empErr);
              setEmployeeProfile(null);
              saveSessionToStorage(user, profileData, null);
            }
          } else {
            // Admin/superadmin - no employee profile needed
            setEmployeeProfile(null);
            saveSessionToStorage(user, profileData, null);
          }
        } else {
          // Profile doesn't exist, try to create it
          await profileOperations?.createProfile(userId);
        }
        
      } catch (error) {
        console.error('Profile fetch error:', {
          userId,
          message: error?.message,
          stack: error?.stack
        });
        
        // Enhanced error message based on error type
        if (error?.message?.includes('Circuit breaker is OPEN')) {
          setAuthError('Profile service temporarily unavailable. Please wait a moment and try again.');
        } else if (error?.message?.includes('Cannot connect to database')) {
          setAuthError('Cannot connect to database. Your Supabase project may be paused or deleted. Please visit your Supabase dashboard to check project status.');
        } else {
          setAuthError(error?.message || 'Failed to load user profile');
        }
      } finally {
        profileOperations._loading = null;
        setProfileLoading(false);
      }
    },

    async createProfile(userId) {
      try {
        const { data: authUser } = await supabase?.auth?.getUser();
        
        if (!authUser?.user) {
          throw new Error('User authentication data not available');
        }

        const { authService } = await import('../services/authService');
        
        const profileData = await authService?.createUserProfile({
          id: userId,
          email: authUser?.user?.email,
          full_name: authUser?.user?.user_metadata?.full_name || authUser?.user?.email?.split('@')?.[0],
          phone: authUser?.user?.user_metadata?.phone || null,
          role: 'user'
        });

        if (profileData) {
          setUserProfile(profileData);
          saveSessionToStorage(user, profileData, null);
          setAuthError(''); // Clear any previous errors
          
          // Log activity
          await logActivity('profile_creation', 'Authentication', 'User profile created automatically');
        }
        
      } catch (error) {
        console.error('Error creating user profile:', error);
        setAuthError(`Failed to create user profile: ${error?.message}`);
      }
    },
    
    clear() {
      setUserProfile(null);
      setEmployeeProfile(null);
      setProfileLoading(false);
    }
  };

  // ✅ REQUIRED: Protected auth handlers
  const authStateHandlers = {
    // CRITICAL: This MUST remain synchronous
    onChange: (event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (session?.user) {
        profileOperations?.load(session?.user?.id); // Fire-and-forget
      } else {
        profileOperations?.clear();
      }
    }
  };

  const value = {
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
    setAuthError,
    getConnectionStatus,
    getCircuitBreakerStatus,
    resetCircuitBreaker
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}