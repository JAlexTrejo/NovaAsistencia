import React, { createContext, useContext, useEffect, useState } from 'react';
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
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState('')

  useEffect(() => {
    // Get initial session - Use Promise chain
    supabase?.auth?.getSession()?.then(({ data: { session } }) => {
        if (session?.user) {
          setUser(session?.user)
          fetchUserProfile(session?.user?.id)
        } else {
          setLoading(false)
        }
      })?.catch((error) => {
        if (error?.message?.includes('Failed to fetch') || 
            error?.message?.includes('AuthRetryableFetchError')) {
          setAuthError('Cannot connect to authentication service. Your Supabase project may be paused or inactive. Please check your Supabase dashboard and resume your project if needed.')
        } else {
          setAuthError('Failed to load session')
          console.error('Auth session error:', error)
        }
        setLoading(false)
      })

    // Listen for auth changes - NEVER ASYNC callback
    const { data: { subscription } } = supabase?.auth?.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          setUser(session?.user)
          fetchUserProfile(session?.user?.id)  // Fire-and-forget, NO AWAIT
        } else {
          setUser(null)
          setUserProfile(null)
        }
        setLoading(false)
        setAuthError('')
      }
    )

    return () => subscription?.unsubscribe()
  }, [])

  const fetchUserProfile = (userId) => {
    // Use correct table name 'user_profiles' 
    supabase?.from('user_profiles')?.select('*')?.eq('id', userId)?.single()?.then(({ data, error }) => {
      if (error && error?.code === 'PGRST116') {
        // User not found in user_profiles table, try to create profile
        createUserProfile(userId);
        return;
      }
      if (error) {
        setAuthError(`Failed to load user profile: ${error?.message}`);
        setLoading(false);
        return;
      }
      setUserProfile(data);
      setLoading(false);
    })?.catch((error) => {
      if (error?.message?.includes('Failed to fetch')) {
        setAuthError('Cannot connect to database. Your Supabase project may be paused or deleted.');
      } else {
        setAuthError('Failed to load user profile');
        console.error('Profile fetch error:', error);
      }
      setLoading(false);
    });
  }

  const createUserProfile = async (userId) => {
    try {
      // Get user info from auth.users
      const { data: authUser } = await supabase?.auth?.getUser()
      
      if (!authUser?.user) {
        setAuthError('User authentication data not available')
        setLoading(false)
        return
      }

      // Create profile in user_profiles table with correct column names
      const profileData = {
        id: userId,
        email: authUser?.user?.email,
        full_name: authUser?.user?.user_metadata?.full_name || authUser?.user?.email?.split('@')?.[0],
        role: 'user', // Default role - matches schema column name
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
        setLoading(false)
        return
      }

      setUserProfile(data)
      setLoading(false)
      
      // Log activity using correct column names
      await logActivity('profile_creation', 'Authentication', 'User profile created automatically')
      
    } catch (error) {
      console.error('Error in createUserProfile:', error)
      setAuthError('Failed to initialize user profile')
      setLoading(false)
    }
  }

  const logActivity = async (action, module, description, userId = null) => {
    try {
      await supabase?.from('logs_actividad')?.insert({
        usuario_id: userId || user?.id,
        rol: userProfile?.role || 'user',  // Use 'role' column name
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
      
      // Don't set loading to false here - let the auth state change handler do it
      return { success: true, user: data?.user };
    } catch (error) {
      if (error?.message?.includes('Failed to fetch') || 
          error?.message?.includes('AuthRetryableFetchError')) {
        setAuthError('Cannot connect to authentication service. Your Supabase project may be paused or inactive. Please check your Supabase dashboard and resume your project if needed.')
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
        setAuthError('Cannot connect to authentication service. Your Supabase project may be paused or inactive.')
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
        setAuthError('Cannot connect to authentication service. Your Supabase project may be paused or inactive.')
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
        setAuthError('Cannot connect to authentication service. Your Supabase project may be paused or inactive.')
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
      return { success: true }
    } catch (error) {
      setAuthError('Failed to sign out')
      console.error('Signout error:', error)
      return { success: false, error: 'Failed to sign out' }
    }
  }

  const getUserProfile = () => {
    return userProfile
  }

  // Use correct column name 'role' instead of 'rol'
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

  const value = {
    user,
    userProfile,
    loading,
    authError,
    signIn,
    signUp,
    sendOTP,
    verifyOTP,
    signOut,
    getUserProfile,
    fetchUserProfile,
    isAdmin,
    isSuperAdmin,
    isSupervisor,
    hasRole,
    setAuthError
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}