import { supabase } from '../lib/supabase';

// Circuit breaker to prevent excessive failed requests
class CircuitBreaker {
  constructor(threshold = 3, resetTimeout = 30000) {
    this.threshold = threshold;
    this.resetTimeout = resetTimeout;
    this.failureCount = 0;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
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
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  onFailure() {
    this.failureCount++;
    if (this.failureCount >= this.threshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.resetTimeout;
    }
  }
}

const profileCircuitBreaker = new CircuitBreaker(3, 30000); // 3 failures, 30 second reset

export const authService = {
  // Enhanced error classification
  classifyError(error) {
    if (!error) return { type: 'unknown', message: 'Unknown error occurred' };

    const message = error?.message || '';
    const code = error?.code || '';

    // Network connectivity issues
    if (message?.includes('Failed to fetch') || 
        message?.includes('NetworkError') ||
        message?.includes('ERR_NETWORK') ||
        error?.name === 'TypeError' && message?.includes('fetch')) {
      return {
        type: 'network',
        message: 'Cannot connect to database. Your Supabase project may be paused, deleted, or experiencing connectivity issues.',
        userAction: 'Check your internet connection and verify your Supabase project status.',
        technicalDetails: message
      };
    }

    // Supabase project issues
    if (message?.includes('Invalid API key') || 
        message?.includes('Project not found') ||
        code === 'INVALID_API_KEY') {
      return {
        type: 'configuration',
        message: 'Database configuration error. Please check your environment settings.',
        userAction: 'Contact your system administrator.',
        technicalDetails: message
      };
    }

    // RLS policy issues
    if (message?.includes('row-level security policy') ||
        code === 'PGRST301'|| message?.includes('permission denied')) {
      return {
        type: 'permission',
        message: 'Access denied. You may not have permission to view this profile.',
        userAction: 'Contact your administrator if you believe this is an error.',
        technicalDetails: message
      };
    }

    // Record not found
    if (code === 'PGRST116') {
      return {
        type: 'not_found',
        message: 'Profile not found.',
        userAction: 'Profile will be created automatically.',
        technicalDetails: message
      };
    }

    // Database/SQL errors
    if (code?.startsWith('PGRST') || code?.startsWith('22') || code?.startsWith('23')) {
      return {
        type: 'database',
        message: 'Database error occurred.',
        userAction: 'Please try again. Contact support if the issue persists.',
        technicalDetails: `${code}: ${message}`
      };
    }

    return {
      type: 'unknown',
      message: message || 'An unexpected error occurred.',
      userAction: 'Please try again.',
      technicalDetails: message
    };
  },

  // Enhanced retry mechanism with exponential backoff
  async retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        const errorInfo = this.classifyError(error);
        
        // Don't retry certain error types
        if (['configuration', 'permission']?.includes(errorInfo?.type)) {
          throw error;
        }

        if (attempt === maxRetries) {
          console.error(`Final retry attempt failed:`, errorInfo);
          throw error;
        }

        // Exponential backoff: 1s, 2s, 4s
        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.warn(`Retry attempt ${attempt}/${maxRetries} after ${delay}ms:`, errorInfo?.technicalDetails);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  },

  // Enhanced connection test
  async testConnection() {
    try {
      // Test 1: Basic Supabase client initialization
      if (!supabase) {
        return { 
          success: false, 
          error: 'Supabase client not initialized',
          type: 'configuration'
        };
      }

      // Test 2: Environment variables
      const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env?.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        return {
          success: false,
          error: 'Missing Supabase configuration. Please check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
          type: 'configuration'
        };
      }

      // Test 3: Simple auth health check
      const { error: sessionError } = await supabase?.auth?.getSession();
      if (sessionError) {
        throw sessionError;
      }

      // Test 4: Database connectivity with a simple query
      const { error: dbError } = await supabase
        ?.from('user_profiles')
        ?.select('count')
        ?.limit(1);
      
      if (dbError) {
        throw dbError;
      }

      return { success: true };

    } catch (error) {
      const errorInfo = this.classifyError(error);
      return {
        success: false,
        error: errorInfo?.message,
        type: errorInfo?.type,
        userAction: errorInfo?.userAction,
        technicalDetails: errorInfo?.technicalDetails
      };
    }
  },

  // Sign in with enhanced error handling
  async signIn(email, password) {
    try {
      return await this.retryWithBackoff(async () => {
        const { data, error } = await supabase?.auth?.signInWithPassword({
          email,
          password
        });
        
        if (error) {
          const errorInfo = this.classifyError(error);
          return { success: false, error: errorInfo?.message, details: errorInfo };
        }
        
        return { success: true, user: data?.user };
      });
    } catch (error) {
      const errorInfo = this.classifyError(error);
      return { success: false, error: errorInfo?.message, details: errorInfo };
    }
  },

  // Sign up with enhanced error handling
  async signUp(email, password, fullName, role = 'user') {
    try {
      return await this.retryWithBackoff(async () => {
        const { data, error } = await supabase?.auth?.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              role: role
            }
          }
        });
        
        if (error) {
          const errorInfo = this.classifyError(error);
          return { success: false, error: errorInfo?.message, details: errorInfo };
        }
        
        return { success: true, user: data?.user };
      });
    } catch (error) {
      const errorInfo = this.classifyError(error);
      return { success: false, error: errorInfo?.message, details: errorInfo };
    }
  },

  // Sign up with phone OTP
  async signUpWithPhone(phone, fullName, role = 'user') {
    try {
      return await this.retryWithBackoff(async () => {
        const { data, error } = await supabase?.auth?.signInWithOtp({
          phone: phone,
          options: {
            data: {
              full_name: fullName,
              role: role
            }
          }
        });
        
        if (error) {
          const errorInfo = this.classifyError(error);
          return { success: false, error: errorInfo?.message, details: errorInfo };
        }
        
        return { success: true, data: data };
      });
    } catch (error) {
      const errorInfo = this.classifyError(error);
      return { success: false, error: errorInfo?.message, details: errorInfo };
    }
  },

  // Enhanced OTP methods
  async sendPhoneOTP(phone) {
    try {
      return await this.retryWithBackoff(async () => {
        const { data, error } = await supabase?.auth?.signInWithOtp({
          phone: phone
        });
        
        if (error) {
          const errorInfo = this.classifyError(error);
          return { success: false, error: errorInfo?.message, details: errorInfo };
        }
        
        return { success: true, data: data };
      });
    } catch (error) {
      const errorInfo = this.classifyError(error);
      return { success: false, error: errorInfo?.message, details: errorInfo };
    }
  },

  async sendEmailOTP(email) {
    try {
      return await this.retryWithBackoff(async () => {
        const { data, error } = await supabase?.auth?.signInWithOtp({
          email: email
        });
        
        if (error) {
          const errorInfo = this.classifyError(error);
          return { success: false, error: errorInfo?.message, details: errorInfo };
        }
        
        return { success: true, data: data };
      });
    } catch (error) {
      const errorInfo = this.classifyError(error);
      return { success: false, error: errorInfo?.message, details: errorInfo };
    }
  },

  async verifyOTP(phone, email, token, type = 'sms') {
    try {
      return await this.retryWithBackoff(async () => {
        const verifyData = {
          token: token,
          type: type
        };

        if (phone) {
          verifyData.phone = phone;
        } else if (email) {
          verifyData.email = email;
        }

        const { data, error } = await supabase?.auth?.verifyOtp(verifyData);
        
        if (error) {
          const errorInfo = this.classifyError(error);
          return { success: false, error: errorInfo?.message, details: errorInfo };
        }
        
        return { success: true, user: data?.user, session: data?.session };
      });
    } catch (error) {
      const errorInfo = this.classifyError(error);
      return { success: false, error: errorInfo?.message, details: errorInfo };
    }
  },

  // Sign out with enhanced error handling
  async signOut() {
    try {
      const { error } = await supabase?.auth?.signOut();
      if (error) {
        const errorInfo = this.classifyError(error);
        return { success: false, error: errorInfo?.message, details: errorInfo };
      }
      return { success: true };
    } catch (error) {
      const errorInfo = this.classifyError(error);
      return { success: false, error: errorInfo?.message, details: errorInfo };
    }
  },

  // Get current session with enhanced error handling
  getSession: async () => {
    try {
      return await this.retryWithBackoff(async () => {
        const { data: { session }, error } = await supabase?.auth?.getSession();
        if (error) {
          const errorInfo = this.classifyError(error);
          throw new Error(errorInfo.message);
        }
        return session;
      });
    } catch (error) {
      const errorInfo = this.classifyError(error);
      throw new Error(errorInfo.message);
    }
  },

  // Enhanced profile fetching with circuit breaker
  getUserProfile: async (userId) => {
    if (!userId) {
      throw new Error('User ID is required to fetch profile');
    }

    try {
      return await profileCircuitBreaker?.call(async () => {
        const { data, error } = await supabase
          ?.from('user_profiles')
          ?.select('*')
          ?.eq('id', userId)
          ?.single();
        
        if (error) {
          const errorInfo = authService?.classifyError(error);
          
          // Handle case where profile doesn't exist yet
          if (errorInfo?.type === 'not_found') {
            return null;
          }
          
          // Log structured error for debugging
          console.error('Profile fetch error:', {
            userId,
            errorType: errorInfo?.type,
            message: errorInfo?.message,
            technicalDetails: errorInfo?.technicalDetails,
            userAction: errorInfo?.userAction
          });
          
          throw new Error(errorInfo.message);
        }
        
        return data;
      });
    } catch (error) {
      // If circuit breaker is open, provide a more user-friendly message
      if (error?.message?.includes('Circuit breaker is OPEN')) {
        throw new Error('Service temporarily unavailable. Please wait a moment and try again.');
      }
      throw error;
    }
  },

  // Create user profile with enhanced error handling
  createUserProfile: async (userData) => {
    try {
      return await this.retryWithBackoff(async () => {
        const { data, error } = await supabase?.from('user_profiles')?.insert([{
            id: userData?.id,
            email: userData?.email,
            full_name: userData?.full_name,
            phone: userData?.phone,
            role: userData?.role || 'usuario',
            employee_id: userData?.employee_id,
            daily_salary: userData?.daily_salary || 0,
            is_active: true
          }])?.select()?.single();
        
        if (error) {
          const errorInfo = this.classifyError(error);
          throw new Error(errorInfo.message);
        }
        
        return data;
      });
    } catch (error) {
      const errorInfo = this.classifyError(error);
      throw new Error(errorInfo.message);
    }
  },

  // Update user profile with enhanced error handling
  updateUserProfile: async (userId, updates) => {
    try {
      return await this.retryWithBackoff(async () => {
        // Use the correct column names for user_profiles table
        const mappedUpdates = {};
        if (updates?.email) mappedUpdates.email = updates?.email;
        if (updates?.full_name) mappedUpdates.full_name = updates?.full_name;
        if (updates?.phone) mappedUpdates.phone = updates?.phone;
        if (updates?.role) mappedUpdates.role = updates?.role;
        if (updates?.is_active !== undefined) mappedUpdates.is_active = updates?.is_active;
        if (updates?.employee_id) mappedUpdates.employee_id = updates?.employee_id;
        if (updates?.daily_salary !== undefined) mappedUpdates.daily_salary = updates?.daily_salary;

        const { data, error } = await supabase?.from('user_profiles')?.update(mappedUpdates)?.eq('id', userId)?.select()?.single();
        
        if (error) {
          const errorInfo = this.classifyError(error);
          throw new Error(errorInfo.message);
        }
        
        return data;
      });
    } catch (error) {
      const errorInfo = this.classifyError(error);
      throw new Error(errorInfo.message);
    }
  },

  // Enhanced activity logging with error handling
  async logActivity(action, module, description, userId = null) {
    try {
      await supabase?.rpc('log_activity', {
        p_accion: action,
        p_modulo: module,
        p_descripcion: description,
        p_usuario_id: userId
      });
      return { success: true };
    } catch (error) {
      // Activity logging failures should not break the main flow
      console.error('Failed to log activity:', {
        action,
        module,
        description,
        userId,
        error: error?.message
      });
      return { success: false, error: 'Failed to log activity' };
    }
  },

  // Get circuit breaker status for monitoring
  getCircuitBreakerStatus() {
    return {
      state: profileCircuitBreaker?.state,
      failureCount: profileCircuitBreaker?.failureCount,
      nextAttempt: profileCircuitBreaker?.nextAttempt
    };
  },

  // Reset circuit breaker manually
  resetCircuitBreaker() {
    profileCircuitBreaker.failureCount = 0;
    profileCircuitBreaker.state = 'CLOSED';
    profileCircuitBreaker.nextAttempt = Date.now();
  }
};

export default authService;