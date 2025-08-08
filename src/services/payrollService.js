import { supabase } from '../lib/supabase';

export const payrollService = {
  // Calculate weekly payroll for an employee
  async calculateWeeklyPayroll(employeeId, startDate, endDate) {
    try {
      const { data, error } = await supabase
        ?.rpc('calculate_weekly_payroll', {
          p_employee_id: employeeId,
          p_start_date: startDate,
          p_end_date: endDate
        });

      if (error) throw error;

      const result = data?.[0] || {};
      return {
        employeeId: result?.empleado_id,
        workedDays: result?.dias_trabajados || 0,
        regularHours: parseFloat(result?.horas_regulares || 0),
        overtimeHours: parseFloat(result?.horas_extra || 0),
        basePay: parseFloat(result?.salario_base || 0),
        overtimePay: parseFloat(result?.pago_horas_extra || 0),
        grossPay: parseFloat(result?.salario_bruto || 0)
      };
    } catch (error) {
      if (error?.message?.includes('Failed to fetch')) {
        throw new Error('No se puede conectar a la base de datos. Verifica tu conexión.');
      }
      throw new Error(`Error al calcular nómina: ${error?.message}`);
    }
  },

  // Get existing payroll record
  async getPayrollRecord(employeeId, startDate) {
    try {
      const { data, error } = await supabase
        ?.from('nominas')
        ?.select(`
          *,
          empleados:empleado_id (
            codigo_empleado,
            user_profiles:user_id (full_name)
          )
        `)
        ?.eq('empleado_id', employeeId)
        ?.eq('semana_inicio', startDate)
        ?.single();

      if (error && error?.code !== 'PGRST116') throw error;

      return data ? {
        id: data?.id,
        employeeId: data?.empleado_id,
        weekStart: data?.semana_inicio,
        weekEnd: data?.semana_fin,
        workedDays: data?.dias_trabajados,
        regularHours: parseFloat(data?.horas_regulares || 0),
        overtimeHours: parseFloat(data?.horas_extra || 0),
        basePay: parseFloat(data?.salario_base || 0),
        overtimePay: parseFloat(data?.pago_horas_extra || 0),
        bonuses: parseFloat(data?.bonificaciones || 0),
        deductions: parseFloat(data?.deducciones || 0),
        grossPay: parseFloat(data?.salario_bruto || 0),
        netPay: parseFloat(data?.salario_neto || 0),
        processed: data?.procesada,
        processedBy: data?.procesada_por,
        processedAt: data?.procesada_en,
        employee: {
          code: data?.empleados?.codigo_empleado,
          name: data?.empleados?.user_profiles?.full_name
        }
      } : null;
    } catch (error) {
      if (error?.message?.includes('Failed to fetch')) {
        throw new Error('No se puede conectar a la base de datos.');
      }
      throw new Error(`Error al obtener registro de nómina: ${error?.message}`);
    }
  },

  // Save/update payroll record
  async savePayrollRecord(payrollData) {
    try {
      const record = {
        empleado_id: payrollData?.employeeId,
        semana_inicio: payrollData?.weekStart,
        semana_fin: payrollData?.weekEnd,
        dias_trabajados: payrollData?.workedDays,
        horas_regulares: payrollData?.regularHours,
        horas_extra: payrollData?.overtimeHours,
        salario_base: payrollData?.basePay,
        pago_horas_extra: payrollData?.overtimePay,
        bonificaciones: payrollData?.bonuses || 0,
        deducciones: payrollData?.deductions || 0,
        salario_bruto: payrollData?.grossPay,
        salario_neto: payrollData?.netPay,
        procesada: payrollData?.processed || false,
        procesada_por: payrollData?.processedBy,
        procesada_en: payrollData?.processedAt
      };

      const { data, error } = await supabase
        ?.from('nominas')
        ?.upsert(record, {
          onConflict: 'empleado_id,semana_inicio'
        })
        ?.select()
        ?.single();

      if (error) throw error;

      return {
        id: data?.id,
        employeeId: data?.empleado_id,
        weekStart: data?.semana_inicio,
        weekEnd: data?.semana_fin,
        grossPay: parseFloat(data?.salario_bruto || 0),
        netPay: parseFloat(data?.salario_neto || 0),
        processed: data?.procesada
      };
    } catch (error) {
      throw new Error(`Error al guardar nómina: ${error?.message}`);
    }
  },

  // Get payroll adjustments for employee and date range
  async getPayrollAdjustments(employeeId, startDate, endDate) {
    try {
      const { data, error } = await supabase
        ?.from('ajustes_nomina')
        ?.select(`
          *,
          user_profiles:autorizado_por (full_name)
        `)
        ?.eq('empleado_id', employeeId)
        ?.gte('created_at', startDate)
        ?.lte('created_at', endDate + 'T23:59:59')
        ?.order('created_at', { ascending: false });

      if (error) throw error;

      return data?.map(adj => ({
        id: adj?.id,
        type: adj?.tipo,
        category: adj?.categoria,
        amount: parseFloat(adj?.monto),
        description: adj?.descripcion,
        authorizedBy: adj?.user_profiles?.full_name || 'Desconocido',
        createdAt: adj?.created_at
      })) || [];
    } catch (error) {
      throw new Error(`Error al obtener ajustes: ${error?.message}`);
    }
  },

  // Add payroll adjustment
  async addPayrollAdjustment(adjustmentData) {
    try {
      const { data, error } = await supabase
        ?.from('ajustes_nomina')
        ?.insert({
          empleado_id: adjustmentData?.employeeId,
          nomina_id: adjustmentData?.payrollId || null,
          tipo: adjustmentData?.type,
          categoria: adjustmentData?.category,
          monto: adjustmentData?.amount,
          descripcion: adjustmentData?.description,
          autorizado_por: adjustmentData?.authorizedBy
        })
        ?.select()
        ?.single();

      if (error) throw error;

      return {
        id: data?.id,
        type: data?.tipo,
        category: data?.categoria,
        amount: parseFloat(data?.monto),
        description: data?.descripcion
      };
    } catch (error) {
      throw new Error(`Error al agregar ajuste: ${error?.message}`);
    }
  },

  // Process payroll (mark as processed)
  async processPayroll(payrollId, userId) {
    try {
      const { data, error } = await supabase
        ?.from('nominas')
        ?.update({
          procesada: true,
          procesada_por: userId,
          procesada_en: new Date()?.toISOString()
        })
        ?.eq('id', payrollId)
        ?.select()
        ?.single();

      if (error) throw error;

      return {
        id: data?.id,
        processed: data?.procesada,
        processedBy: data?.procesada_por,
        processedAt: data?.procesada_en
      };
    } catch (error) {
      throw new Error(`Error al procesar nómina: ${error?.message}`);
    }
  },

  // Get payroll summary for all employees in date range
  async getPayrollSummary(startDate, endDate) {
    try {
      const { data, error } = await supabase
        ?.from('nominas')
        ?.select(`
          *,
          empleados:empleado_id (
            codigo_empleado,
            user_profiles:user_id (full_name),
            obras:obra_id (nombre)
          )
        `)
        ?.eq('semana_inicio', startDate)
        ?.order('salario_bruto', { ascending: false });

      if (error) throw error;

      return data?.map(record => ({
        id: record?.id,
        employeeId: record?.empleado_id,
        employeeCode: record?.empleados?.codigo_empleado,
        employeeName: record?.empleados?.user_profiles?.full_name,
        site: record?.empleados?.obras?.nombre,
        workedDays: record?.dias_trabajados,
        regularHours: parseFloat(record?.horas_regulares || 0),
        overtimeHours: parseFloat(record?.horas_extra || 0),
        grossPay: parseFloat(record?.salario_bruto || 0),
        netPay: parseFloat(record?.salario_neto || 0),
        processed: record?.procesada
      })) || [];
    } catch (error) {
      throw new Error(`Error al obtener resumen de nómina: ${error?.message}`);
    }
  },

  // Delete payroll adjustment
  async deletePayrollAdjustment(adjustmentId) {
    try {
      const { error } = await supabase
        ?.from('ajustes_nomina')
        ?.delete()
        ?.eq('id', adjustmentId);

      if (error) throw error;

      return true;
    } catch (error) {
      throw new Error(`Error al eliminar ajuste: ${error?.message}`);
    }
  }
};
function getCurrentWeekPayroll(...args) {
  // eslint-disable-next-line no-console
  console.warn('Placeholder: getCurrentWeekPayroll is not implemented yet.', args);
  return null;
}

export { getCurrentWeekPayroll };
function calculateWeeklyPayroll(...args) {
  // eslint-disable-next-line no-console
  console.warn('Placeholder: calculateWeeklyPayroll is not implemented yet.', args);
  return null;
}

export { calculateWeeklyPayroll };
function bulkCalculatePayroll(...args) {
  // eslint-disable-next-line no-console
  console.warn('Placeholder: bulkCalculatePayroll is not implemented yet.', args);
  return null;
}

export { bulkCalculatePayroll };