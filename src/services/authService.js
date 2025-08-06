import { supabase } from '../lib/supabase';

export const authService = {
  // Sign in with email and password
  async signIn(email, password) {
    try {
      const { data, error } = await supabase?.auth?.signInWithPassword({
        email,
        password
      })
      
      if (error) {
        return { success: false, error: error?.message };
      }
      
      return { success: true, user: data?.user };
    } catch (error) {
      return { success: false, error: 'Network error. Please check your connection.' }
    }
  },

  // Sign up new user
  async signUp(email, password, fullName, role = 'user') {
    try {
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
        return { success: false, error: error?.message };
      }
      
      return { success: true, user: data?.user };
    } catch (error) {
      return { success: false, error: 'Network error. Please check your connection.' }
    }
  },

  // Sign up with phone OTP
  async signUpWithPhone(phone, fullName, role = 'user') {
    try {
      const { data, error } = await supabase?.auth?.signInWithOtp({
        phone: phone,
        options: {
          data: {
            full_name: fullName,
            role: role
          }
        }
      })
      
      if (error) {
        return { success: false, error: error?.message };
      }
      
      return { success: true, data: data };
    } catch (error) {
      return { success: false, error: 'Network error. Please check your connection.' }
    }
  },

  // Send OTP to phone
  async sendPhoneOTP(phone) {
    try {
      const { data, error } = await supabase?.auth?.signInWithOtp({
        phone: phone
      })
      
      if (error) {
        return { success: false, error: error?.message };
      }
      
      return { success: true, data: data };
    } catch (error) {
      return { success: false, error: 'Network error. Please check your connection.' }
    }
  },

  // Send OTP to email
  async sendEmailOTP(email) {
    try {
      const { data, error } = await supabase?.auth?.signInWithOtp({
        email: email
      })
      
      if (error) {
        return { success: false, error: error?.message };
      }
      
      return { success: true, data: data };
    } catch (error) {
      return { success: false, error: 'Network error. Please check your connection.' }
    }
  },

  // Verify OTP
  async verifyOTP(phone, email, token, type = 'sms') {
    try {
      const verifyData = {
        token: token,
        type: type
      };

      if (phone) {
        verifyData.phone = phone;
      } else if (email) {
        verifyData.email = email;
      }

      const { data, error } = await supabase?.auth?.verifyOtp(verifyData)
      
      if (error) {
        return { success: false, error: error?.message };
      }
      
      return { success: true, user: data?.user, session: data?.session };
    } catch (error) {
      return { success: false, error: 'Network error. Please check your connection.' }
    }
  },

  // Sign out
  async signOut() {
    try {
      const { error } = await supabase?.auth?.signOut()
      if (error) {
        return { success: false, error: error?.message };
      }
      return { success: true }
    } catch (error) {
      return { success: false, error: 'Failed to sign out' }
    }
  },

  // Get current session
  getSession: async () => {
    try {
      const { data: { session }, error } = await supabase?.auth?.getSession();
      if (error) throw error;
      return session;
    } catch (error) {
      throw new Error(`Failed to get session: ${error.message}`);
    }
  },

  // Get user profile - FIXED: Use user_profiles table instead of usuarios
  getUserProfile: async (userId) => {
    try {
      const { data, error } = await supabase
        ?.from('user_profiles')
        ?.select('*')?.eq('id', userId)?.single();
      
      if (error) {
        // Handle case where profile doesn't exist yet
        if (error?.code === 'PGRST116') {
          return null;
        }
        throw error;
      }
      
      return data;
    } catch (error) {
      if (error?.message?.includes('Failed to fetch') || 
          error?.message?.includes('NetworkError') ||
          error?.name === 'TypeError' && error?.message?.includes('fetch')) {
        throw new Error('Cannot connect to database. Your Supabase project may be paused or deleted. Please visit your Supabase dashboard to check project status.');
      }
      throw new Error(`Failed to get user profile: ${error.message}`);
    }
  },

  // Update user profile - FIXED: Use user_profiles table
  createUserProfile: async (userData) => {
    try {
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
      
      if (error) throw error;
      return data;
    } catch (error) {
      if (error?.message?.includes('Failed to fetch') || 
          error?.message?.includes('NetworkError') ||
          error?.name === 'TypeError' && error?.message?.includes('fetch')) {
        throw new Error('Cannot connect to database. Your Supabase project may be paused or deleted. Please visit your Supabase dashboard to check project status.');
      }
      throw new Error(`Failed to create user profile: ${error.message}`);
    }
  },

  // Update user profile - FIXED: Use user_profiles table with correct column names
  updateUserProfile: async (userId, updates) => {
    try {
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
      
      if (error) throw error;
      return data;
    } catch (error) {
      if (error?.message?.includes('Failed to fetch') || 
          error?.message?.includes('NetworkError') ||
          error?.name === 'TypeError' && error?.message?.includes('fetch')) {
        throw new Error('Cannot connect to database. Your Supabase project may be paused or deleted. Please visit your Supabase dashboard to check project status.');
      }
      throw new Error(`Failed to update user profile: ${error.message}`);
    }
  },

  // Log activity
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
      console.error('Failed to log activity:', error);
      return { success: false, error: 'Failed to log activity' };
    }
  }
}

export default authService