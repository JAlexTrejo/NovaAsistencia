import { supabase } from '../lib/supabase';

class EnhancedEmployeeService {
  // Get all employees with optional filters
  async getEmployees(filters = {}) {
    try {
      let query = supabase?.from('employee_profiles')?.select(`
          *,
          construction_site:construction_sites!site_id(
            id, name, address, manager_name, phone
          ),
          supervisor:user_profiles!supervisor_id(
            id, full_name, email, phone
          ),
          user_profile:user_profiles!user_id(
            id, full_name, email, phone
          )
        `)?.is('deleted_at', null)?.order('created_at', { ascending: false });

      // Apply filters
      if (filters?.search) {
        query = query?.or(`full_name.ilike.%${filters?.search}%,employee_id.ilike.%${filters?.search}%,email.ilike.%${filters?.search}%`);
      }

      if (filters?.site && filters?.site !== 'all') {
        query = query?.eq('construction_site.name', filters?.site);
      }

      if (filters?.supervisor && filters?.supervisor !== 'all') {
        query = query?.eq('supervisor.full_name', filters?.supervisor);
      }

      if (filters?.status && filters?.status?.length > 0) {
        query = query?.in('status', filters?.status);
      }

      if (filters?.position && filters?.position !== 'all') {
        query = query?.eq('position', filters?.position);
      }

      if (filters?.hireDateFrom) {
        query = query?.gte('hire_date', filters?.hireDateFrom);
      }

      if (filters?.hireDateTo) {
        query = query?.lte('hire_date', filters?.hireDateTo);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching employees:', error);
        throw new Error(`Failed to fetch employees: ${error?.message}`);
      }

      // Transform data to match component expectations
      return data?.map(employee => ({
        id: employee?.id,
        employeeId: employee?.employee_id,
        name: employee?.full_name,
        email: employee?.user_profile?.email || '',
        phone: employee?.phone || employee?.user_profile?.phone || '',
        idNumber: employee?.id_number || '',
        birthDate: employee?.birth_date || '',
        address: employee?.address || '',
        emergencyContact: employee?.emergency_contact || '',
        site: employee?.construction_site?.name || 'No asignado',
        supervisor: employee?.supervisor?.full_name || 'No asignado',
        hireDate: employee?.hire_date,
        status: employee?.status,
        position: employee?.position,
        dailySalary: Number(employee?.daily_salary) || 0,
        hourlyRate: Number(employee?.hourly_rate) || 0,
        salaryType: employee?.salary_type || 'daily',
        lastAttendance: employee?.last_attendance_date,
        avatar: employee?.profile_picture_url || null,
        // Additional fields for detail view
        siteId: employee?.site_id,
        supervisorId: employee?.supervisor_id,
        userId: employee?.user_id,
        createdAt: employee?.created_at,
        updatedAt: employee?.updated_at
      })) || [];

    } catch (error) {
      console.error('Error in getEmployees:', error);
      throw error;
    }
  }

  // Get single employee by ID
  async getEmployeeById(employeeId) {
    try {
      const { data, error } = await supabase?.from('employee_profiles')?.select(`
          *,
          construction_site:construction_sites!site_id(
            id, name, address, manager_name, phone
          ),
          supervisor:user_profiles!supervisor_id(
            id, full_name, email, phone
          ),
          user_profile:user_profiles!user_id(
            id, full_name, email, phone
          )
        `)?.eq('id', employeeId)?.is('deleted_at', null)?.single();

      if (error) {
        if (error?.code === 'PGRST116') {
          throw new Error('Employee not found');
        }
        throw new Error(`Failed to fetch employee: ${error?.message}`);
      }

      // Transform data
      return {
        id: data?.id,
        employeeId: data?.employee_id,
        name: data?.full_name,
        email: data?.user_profile?.email || '',
        phone: data?.phone || data?.user_profile?.phone || '',
        idNumber: data?.id_number || '',
        birthDate: data?.birth_date || '',
        address: data?.address || '',
        emergencyContact: data?.emergency_contact || '',
        site: data?.construction_site?.name || 'No asignado',
        supervisor: data?.supervisor?.full_name || 'No asignado',
        hireDate: data?.hire_date,
        status: data?.status,
        position: data?.position,
        dailySalary: Number(data?.daily_salary) || 0,
        hourlyRate: Number(data?.hourly_rate) || 0,
        salaryType: data?.salary_type || 'daily',
        lastAttendance: data?.last_attendance_date,
        avatar: data?.profile_picture_url || null,
        // Additional fields
        siteId: data?.site_id,
        supervisorId: data?.supervisor_id,
        userId: data?.user_id,
        createdAt: data?.created_at,
        updatedAt: data?.updated_at
      };

    } catch (error) {
      console.error('Error in getEmployeeById:', error);
      throw error;
    }
  }

  // Create new employee
  async createEmployee(employeeData) {
    try {
      const { data, error } = await supabase?.from('employee_profiles')?.insert([{
          employee_id: employeeData?.employeeId,
          full_name: employeeData?.name,
          phone: employeeData?.phone,
          id_number: employeeData?.idNumber,
          birth_date: employeeData?.birthDate,
          address: employeeData?.address,
          emergency_contact: employeeData?.emergencyContact,
          site_id: employeeData?.siteId,
          supervisor_id: employeeData?.supervisorId,
          hire_date: employeeData?.hireDate,
          position: employeeData?.position,
          daily_salary: employeeData?.dailySalary || 0,
          hourly_rate: employeeData?.hourlyRate || 0,
          salary_type: employeeData?.salaryType || 'daily',
          status: 'active',
          user_id: employeeData?.userId || null
        }])?.select()?.single();

      if (error) {
        console.error('Error creating employee:', error);
        throw new Error(`Failed to create employee: ${error?.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in createEmployee:', error);
      throw error;
    }
  }

  // Update employee
  async updateEmployee(employeeId, updates) {
    try {
      const updateData = {};

      // Map frontend field names to database column names
      if (updates?.name !== undefined) updateData.full_name = updates?.name;
      if (updates?.phone !== undefined) updateData.phone = updates?.phone;
      if (updates?.idNumber !== undefined) updateData.id_number = updates?.idNumber;
      if (updates?.birthDate !== undefined) updateData.birth_date = updates?.birthDate;
      if (updates?.address !== undefined) updateData.address = updates?.address;
      if (updates?.emergencyContact !== undefined) updateData.emergency_contact = updates?.emergencyContact;
      if (updates?.siteId !== undefined) updateData.site_id = updates?.siteId;
      if (updates?.supervisorId !== undefined) updateData.supervisor_id = updates?.supervisorId;
      if (updates?.hireDate !== undefined) updateData.hire_date = updates?.hireDate;
      if (updates?.position !== undefined) updateData.position = updates?.position;
      if (updates?.dailySalary !== undefined) updateData.daily_salary = updates?.dailySalary;
      if (updates?.hourlyRate !== undefined) updateData.hourly_rate = updates?.hourlyRate;
      if (updates?.salaryType !== undefined) updateData.salary_type = updates?.salaryType;
      if (updates?.status !== undefined) updateData.status = updates?.status;

      const { data, error } = await supabase?.from('employee_profiles')?.update(updateData)?.eq('id', employeeId)?.select()?.single();

      if (error) {
        console.error('Error updating employee:', error);
        throw new Error(`Failed to update employee: ${error?.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in updateEmployee:', error);
      throw error;
    }
  }

  // Soft delete employee
  async deleteEmployee(employeeId, userId) {
    try {
      // Use the soft delete function
      const { data, error } = await supabase?.rpc('soft_delete_employee', {
          employee_uuid: employeeId,
          deleted_by_user: userId
        });

      if (error) {
        console.error('Error deleting employee:', error);
        throw new Error(`Failed to delete employee: ${error?.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in deleteEmployee:', error);
      throw error;
    }
  }

  // Get employee statistics
  async getEmployeeStats() {
    try {
      const { data, error } = await supabase?.from('employee_profiles')?.select('status, position')?.is('deleted_at', null);

      if (error) {
        throw new Error(`Failed to fetch employee stats: ${error?.message}`);
      }

      const stats = {
        total: data?.length || 0,
        active: data?.filter(emp => emp?.status === 'active')?.length || 0,
        inactive: data?.filter(emp => emp?.status === 'inactive')?.length || 0,
        suspended: data?.filter(emp => emp?.status === 'suspended')?.length || 0,
        positions: {}
      };

      // Count by positions
      data?.forEach(emp => {
        if (emp?.position) {
          stats.positions[emp?.position] = (stats?.positions?.[emp?.position] || 0) + 1;
        }
      });

      return stats;
    } catch (error) {
      console.error('Error in getEmployeeStats:', error);
      throw error;
    }
  }

  // Get unique sites for filters
  async getSites() {
    try {
      const { data, error } = await supabase?.from('construction_sites')?.select('id, name, address')?.order('name');

      if (error) {
        throw new Error(`Failed to fetch sites: ${error?.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error in getSites:', error);
      throw error;
    }
  }

  // Get supervisors for filters
  async getSupervisors() {
    try {
      const { data, error } = await supabase?.from('user_profiles')?.select('id, full_name, email')?.in('role', ['supervisor', 'admin', 'superadmin'])?.order('full_name');

      if (error) {
        throw new Error(`Failed to fetch supervisors: ${error?.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error in getSupervisors:', error);
      throw error;
    }
  }

  // Bulk update employees
  async bulkUpdateEmployees(employeeIds, updates) {
    try {
      const { data, error } = await supabase?.from('employee_profiles')?.update(updates)?.in('id', employeeIds)?.select();

      if (error) {
        throw new Error(`Failed to bulk update employees: ${error?.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in bulkUpdateEmployees:', error);
      throw error;
    }
  }

  // Get employee by user ID
  async getEmployeeByUserId(userId) {
    try {
      const { data, error } = await supabase?.from('employee_profiles')?.select(`
          *,
          construction_site:construction_sites!site_id(
            id, name, address, manager_name, phone
          ),
          supervisor:user_profiles!supervisor_id(
            id, full_name, email, phone
          )
        `)?.eq('user_id', userId)?.is('deleted_at', null)?.single();

      if (error) {
        if (error?.code === 'PGRST116') {
          return null; // Employee profile not found
        }
        throw new Error(`Failed to fetch employee profile: ${error?.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in getEmployeeByUserId:', error);
      throw error;
    }
  }

  // Search employees with real-time suggestions
  async searchEmployees(searchTerm, limit = 10) {
    try {
      if (!searchTerm || searchTerm?.length < 2) {
        return [];
      }

      const { data, error } = await supabase?.from('employee_profiles')?.select(`
          id,
          employee_id,
          full_name,
          construction_site:construction_sites!site_id(name)
        `)?.or(`full_name.ilike.%${searchTerm}%,employee_id.ilike.%${searchTerm}%`)?.is('deleted_at', null)?.eq('status', 'active')?.limit(limit);

      if (error) {
        throw new Error(`Failed to search employees: ${error?.message}`);
      }

      return data?.map(emp => ({
        id: emp?.id,
        employeeId: emp?.employee_id,
        name: emp?.full_name,
        site: emp?.construction_site?.name || 'No asignado'
      })) || [];

    } catch (error) {
      console.error('Error in searchEmployees:', error);
      throw error;
    }
  }
}

export default new EnhancedEmployeeService();