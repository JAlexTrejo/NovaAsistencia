import { supabase } from '../lib/supabase';

export const enhancedEmployeeService = {
  // Get all employees with enhanced data
  async getAllEmployeesWithPayroll(startDate, endDate) {
    try {
      const { data: empleadosData, error: empleadosError } = await supabase
        ?.from('empleados')
        ?.select(`
          id,
          codigo_empleado,
          salario_diario,
          status,
          deleted_at,
          user_profiles:user_id (
            id,
            full_name,
            email,
            phone
          ),
          obras:obra_id (
            id,
            nombre
          ),
          supervisor:supervisor_id (
            full_name
          )
        `)
        ?.neq('status', 'deleted')
        ?.order('user_profiles(full_name)', { ascending: true });

      if (empleadosError) throw empleadosError;

      // Calculate payroll data for each employee
      const employeesWithPayroll = await Promise.all(
        empleadosData?.map(async (emp) => {
          const payrollData = await this.calculateEmployeePayroll(emp?.id, startDate, endDate);
          
          return {
            id: emp?.id,
            employeeCode: emp?.codigo_empleado,
            name: emp?.user_profiles?.full_name || 'Sin nombre',
            email: emp?.user_profiles?.email,
            phone: emp?.user_profiles?.phone,
            dailySalary: parseFloat(emp?.salario_diario || 0),
            status: emp?.status,
            site: emp?.obras?.nombre || 'Sin asignar',
            siteId: emp?.obras?.id,
            supervisor: emp?.supervisor?.full_name || 'Sin supervisor',
            isDeleted: !!emp?.deleted_at,
            ...payrollData
          };
        }) || []
      );

      return employeesWithPayroll;
    } catch (error) {
      if (error?.message?.includes('Failed to fetch')) {
        throw new Error('No se puede conectar a la base de datos. Verifica tu conexión.');
      }
      throw new Error(`Error al cargar empleados: ${error?.message}`);
    }
  },

  // Calculate payroll for a single employee
  async calculateEmployeePayroll(employeeId, startDate, endDate) {
    try {
      const { data, error } = await supabase
        ?.rpc('calculate_weekly_payroll', {
          p_employee_id: employeeId,
          p_start_date: startDate,
          p_end_date: endDate
        });

      if (error) {
        console.error('Error calculating payroll for employee:', employeeId, error);
        return {
          workedDays: 0,
          regularHours: 0,
          overtimeHours: 0,
          basePay: 0,
          overtimePay: 0,
          grossPay: 0,
          bonuses: 0,
          deductions: 0,
          netPay: 0
        };
      }

      const result = data?.[0] || {};
      return {
        workedDays: result?.dias_trabajados || 0,
        regularHours: parseFloat(result?.horas_regulares || 0),
        overtimeHours: parseFloat(result?.horas_extra || 0),
        basePay: parseFloat(result?.salario_base || 0),
        overtimePay: parseFloat(result?.pago_horas_extra || 0),
        grossPay: parseFloat(result?.salario_bruto || 0),
        bonuses: 0, // Will be calculated from adjustments
        deductions: 0, // Will be calculated from adjustments
        netPay: parseFloat(result?.salario_bruto || 0)
      };
    } catch (error) {
      console.error('Error in calculateEmployeePayroll:', error);
      return {
        workedDays: 0,
        regularHours: 0,
        overtimeHours: 0,
        basePay: 0,
        overtimePay: 0,
        grossPay: 0,
        bonuses: 0,
        deductions: 0,
        netPay: 0
      };
    }
  },

  // Soft delete an employee
  async deleteEmployee(employeeId, userId) {
    try {
      const { data, error } = await supabase
        ?.rpc('soft_delete_employee', {
          p_employee_id: employeeId
        });

      if (error) throw error;

      // Log the deletion activity
      await supabase?.from('logs_actividad')?.insert({
        usuario_id: userId,
        rol: 'admin',
        accion: 'employee_deleted',
        modulo: 'Employee Management',
        descripcion: `Empleado eliminado: ${employeeId}`
      });

      return { success: true, data };
    } catch (error) {
      throw new Error(`Error al eliminar empleado: ${error?.message}`);
    }
  },

  // Restore a deleted employee
  async restoreEmployee(employeeId, userId) {
    try {
      const { data, error } = await supabase
        ?.from('empleados')
        ?.update({
          status: 'active',
          deleted_at: null,
          updated_at: new Date()?.toISOString()
        })
        ?.eq('id', employeeId)
        ?.select()
        ?.single();

      if (error) throw error;

      // Log the restoration activity
      await supabase?.from('logs_actividad')?.insert({
        usuario_id: userId,
        rol: 'admin',
        accion: 'employee_restored',
        modulo: 'Employee Management',
        descripcion: `Empleado restaurado: ${employeeId}`
      });

      return {
        id: data?.id,
        status: data?.status,
        deleted_at: data?.deleted_at
      };
    } catch (error) {
      throw new Error(`Error al restaurar empleado: ${error?.message}`);
    }
  },

  // Get deleted employees
  async getDeletedEmployees() {
    try {
      const { data, error } = await supabase
        ?.from('empleados')
        ?.select(`
          id,
          codigo_empleado,
          deleted_at,
          user_profiles:user_id (
            full_name,
            email
          ),
          obras:obra_id (nombre)
        `)
        ?.eq('status', 'deleted')
        ?.order('deleted_at', { ascending: false });

      if (error) throw error;

      return data?.map(emp => ({
        id: emp?.id,
        employeeCode: emp?.codigo_empleado,
        name: emp?.user_profiles?.full_name,
        email: emp?.user_profiles?.email,
        site: emp?.obras?.nombre,
        deletedAt: emp?.deleted_at
      })) || [];
    } catch (error) {
      throw new Error(`Error al obtener empleados eliminados: ${error?.message}`);
    }
  },

  // Create new employee
  async createEmployee(employeeData, userId) {
    try {
      // First create user profile if needed
      const userProfileData = {
        email: employeeData?.email,
        full_name: employeeData?.fullName,
        phone: employeeData?.phone,
        role: 'user'
      };

      const { data: userProfile, error: userError } = await supabase
        ?.from('user_profiles')
        ?.insert(userProfileData)
        ?.select()
        ?.single();

      if (userError) throw userError;

      // Then create employee record
      const { data: employee, error: employeeError } = await supabase
        ?.from('empleados')
        ?.insert({
          user_id: userProfile?.id,
          codigo_empleado: employeeData?.employeeCode,
          numero_documento: employeeData?.idNumber,
          fecha_nacimiento: employeeData?.birthDate,
          direccion: employeeData?.address,
          contacto_emergencia: employeeData?.emergencyContact,
          obra_id: employeeData?.siteId,
          supervisor_id: employeeData?.supervisorId,
          fecha_contratacion: employeeData?.hireDate,
          salario_diario: employeeData?.dailySalary,
          status: 'active'
        })
        ?.select()
        ?.single();

      if (employeeError) throw employeeError;

      // Log the creation activity
      await supabase?.from('logs_actividad')?.insert({
        usuario_id: userId,
        rol: 'admin',
        accion: 'employee_created',
        modulo: 'Employee Management',
        descripcion: `Nuevo empleado creado: ${employeeData?.fullName}`
      });

      return {
        id: employee?.id,
        employeeCode: employee?.codigo_empleado,
        name: userProfile?.full_name,
        email: userProfile?.email
      };
    } catch (error) {
      throw new Error(`Error al crear empleado: ${error?.message}`);
    }
  },

  // Update employee
  async updateEmployee(employeeId, updateData, userId) {
    try {
      // Update employee record
      const employeeUpdates = {};
      if (updateData?.employeeCode) employeeUpdates.codigo_empleado = updateData?.employeeCode;
      if (updateData?.idNumber) employeeUpdates.numero_documento = updateData?.idNumber;
      if (updateData?.birthDate) employeeUpdates.fecha_nacimiento = updateData?.birthDate;
      if (updateData?.address) employeeUpdates.direccion = updateData?.address;
      if (updateData?.emergencyContact) employeeUpdates.contacto_emergencia = updateData?.emergencyContact;
      if (updateData?.siteId !== undefined) employeeUpdates.obra_id = updateData?.siteId;
      if (updateData?.supervisorId !== undefined) employeeUpdates.supervisor_id = updateData?.supervisorId;
      if (updateData?.hireDate) employeeUpdates.fecha_contratacion = updateData?.hireDate;
      if (updateData?.dailySalary !== undefined) employeeUpdates.salario_diario = updateData?.dailySalary;
      if (updateData?.status) employeeUpdates.status = updateData?.status;

      if (Object.keys(employeeUpdates)?.length > 0) {
        employeeUpdates.updated_at = new Date()?.toISOString();

        const { data: employee, error: employeeError } = await supabase
          ?.from('empleados')
          ?.update(employeeUpdates)
          ?.eq('id', employeeId)
          ?.select()
          ?.single();

        if (employeeError) throw employeeError;
      }

      // Update user profile if needed
      const userUpdates = {};
      if (updateData?.fullName) userUpdates.full_name = updateData?.fullName;
      if (updateData?.email) userUpdates.email = updateData?.email;
      if (updateData?.phone) userUpdates.phone = updateData?.phone;

      if (Object.keys(userUpdates)?.length > 0) {
        const { error: userError } = await supabase
          ?.from('empleados')
          ?.select('user_id')
          ?.eq('id', employeeId)
          ?.single()
          ?.then(({ data, error }) => {
            if (error) throw error;
            return supabase
              ?.from('user_profiles')
              ?.update(userUpdates)
              ?.eq('id', data?.user_id);
          });

        if (userError) throw userError;
      }

      // Log the update activity
      await supabase?.from('logs_actividad')?.insert({
        usuario_id: userId,
        rol: 'admin',
        accion: 'employee_updated',
        modulo: 'Employee Management',
        descripcion: `Empleado actualizado: ${employeeId}`
      });

      return { success: true };
    } catch (error) {
      throw new Error(`Error al actualizar empleado: ${error?.message}`);
    }
  },

  // Bulk operations
  async bulkDeleteEmployees(employeeIds, userId) {
    try {
      const { data, error } = await supabase
        ?.from('empleados')
        ?.update({
          status: 'deleted',
          deleted_at: new Date()?.toISOString(),
          updated_at: new Date()?.toISOString()
        })
        ?.in('id', employeeIds);

      if (error) throw error;

      // Log the bulk deletion
      await supabase?.from('logs_actividad')?.insert({
        usuario_id: userId,
        rol: 'admin',
        accion: 'bulk_employee_deletion',
        modulo: 'Employee Management',
        descripcion: `Eliminación masiva de ${employeeIds?.length} empleados`
      });

      return { success: true, deletedCount: employeeIds?.length };
    } catch (error) {
      throw new Error(`Error en eliminación masiva: ${error?.message}`);
    }
  }
};