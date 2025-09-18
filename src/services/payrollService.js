import { supabase } from '@/lib/supabase';
import { adaptSupabaseError } from '@/utils/errors';

const ok   = (data) => ({ ok: true, data });
const fail = (e)    => ({ ok: false, ...adaptSupabaseError(e) });

export const payrollService = {
  // --------------------------------------------
  // 1) Cálculo semanal (RPC)
  // --------------------------------------------
  async calculateWeeklyPayroll(employeeId, startDate, endDate) {
    try {
      const { data, error } = await supabase.rpc('calculate_weekly_payroll', {
        p_employee_id: employeeId,
        p_start_date: startDate,
        p_end_date: endDate,
      });

      if (error) return fail(error);

      const r = (data && data[0]) || {};
      const mapped = {
        employeeId: r?.empleado_id ?? employeeId,
        workedDays: Number(r?.dias_trabajados ?? 0),
        regularHours: Number(r?.horas_regulares ?? 0),
        overtimeHours: Number(r?.horas_extra ?? 0),
        basePay: Number(r?.salario_base ?? 0),
        overtimePay: Number(r?.pago_horas_extra ?? 0),
        grossPay: Number(r?.salario_bruto ?? 0),
      };
      return ok(mapped);
    } catch (e) {
      return fail(e);
    }
  },

  // --------------------------------------------
  // 2) Obtener registro de nómina (por empleado + semana)
  // --------------------------------------------
  async getPayrollRecord(employeeId, startDate) {
    try {
      const { data, error } = await supabase
        .from('nominas')
        .select(`
          id,
          empleado_id,
          semana_inicio,
          semana_fin,
          dias_trabajados,
          horas_regulares,
          horas_extra,
          salario_base,
          pago_horas_extra,
          bonificaciones,
          deducciones,
          salario_bruto,
          salario_neto,
          procesada,
          procesada_por,
          procesada_en,
          empleados:empleado_id (
            codigo_empleado,
            user_profiles:user_id ( full_name )
          )
        `)
        .eq('empleado_id', employeeId)
        .eq('semana_inicio', startDate)
        .single();

      // Si no existe (PGRST116), devolvemos ok con null
      if (error) {
        if (error.code === 'PGRST116') return ok(null);
        return fail(error);
      }

      const mapped = {
        id: data?.id,
        employeeId: data?.empleado_id,
        weekStart: data?.semana_inicio,
        weekEnd: data?.semana_fin,
        workedDays: Number(data?.dias_trabajados ?? 0),
        regularHours: Number(data?.horas_regulares ?? 0),
        overtimeHours: Number(data?.horas_extra ?? 0),
        basePay: Number(data?.salario_base ?? 0),
        overtimePay: Number(data?.pago_horas_extra ?? 0),
        bonuses: Number(data?.bonificaciones ?? 0),
        deductions: Number(data?.deducciones ?? 0),
        grossPay: Number(data?.salario_bruto ?? 0),
        netPay: Number(data?.salario_neto ?? 0),
        processed: !!data?.procesada,
        processedBy: data?.procesada_por,
        processedAt: data?.procesada_en,
        employee: {
          code: data?.empleados?.codigo_empleado ?? null,
          name: data?.empleados?.user_profiles?.full_name ?? null,
        },
      };

      return ok(mapped);
    } catch (e) {
      return fail(e);
    }
  },

  // --------------------------------------------
  // 3) Guardar/actualizar nómina (upsert)
  // --------------------------------------------
  async savePayrollRecord(payrollData) {
    try {
      const payload = {
        empleado_id: payrollData?.employeeId,
        semana_inicio: payrollData?.weekStart,
        semana_fin: payrollData?.weekEnd,
        dias_trabajados: payrollData?.workedDays,
        horas_regulares: payrollData?.regularHours,
        horas_extra: payrollData?.overtimeHours,
        salario_base: payrollData?.basePay,
        pago_horas_extra: payrollData?.overtimePay,
        bonificaciones: payrollData?.bonuses ?? 0,
        deducciones: payrollData?.deductions ?? 0,
        salario_bruto: payrollData?.grossPay,
        salario_neto: payrollData?.netPay,
        procesada: payrollData?.processed ?? false,
        procesada_por: payrollData?.processedBy ?? null,
        procesada_en: payrollData?.processedAt ?? null,
      };

      const { data, error } = await supabase
        .from('nominas')
        .upsert(payload, { onConflict: 'empleado_id,semana_inicio' })
        .select('id,empleado_id,semana_inicio,semana_fin,salario_bruto,salario_neto,procesada,procesada_por,procesada_en')
        .single();

      if (error) return fail(error);

      const mapped = {
        id: data?.id,
        employeeId: data?.empleado_id,
        weekStart: data?.semana_inicio,
        weekEnd: data?.semana_fin,
        grossPay: Number(data?.salario_bruto ?? 0),
        netPay: Number(data?.salario_neto ?? 0),
        processed: !!data?.procesada,
        processedBy: data?.procesada_por ?? null,
        processedAt: data?.procesada_en ?? null,
      };

      return ok(mapped);
    } catch (e) {
      return fail(e);
    }
  },

  // --------------------------------------------
  // 4) Ajustes de nómina (listar)
  // --------------------------------------------
  async getPayrollAdjustments(employeeId, startDate, endDate) {
    try {
      const { data, error } = await supabase
        .from('ajustes_nomina')
        .select(`
          id,
          empleado_id,
          nomina_id,
          tipo,
          categoria,
          monto,
          descripcion,
          autorizado_por,
          created_at,
          user_profiles:autorizado_por ( full_name )
        `)
        .eq('empleado_id', employeeId)
        .gte('created_at', startDate)
        .lte('created_at', `${endDate}T23:59:59`)
        .order('created_at', { ascending: false });

      if (error) return fail(error);

      const mapped = (data || []).map((adj) => ({
        id: adj?.id,
        type: adj?.tipo,
        category: adj?.categoria,
        amount: Number(adj?.monto ?? 0),
        description: adj?.descripcion,
        authorizedBy: adj?.user_profiles?.full_name || 'Desconocido',
        createdAt: adj?.created_at,
        payrollId: adj?.nomina_id ?? null,
      }));

      return ok(mapped);
    } catch (e) {
      return fail(e);
    }
  },

  // --------------------------------------------
  // 5) Agregar ajuste
  // --------------------------------------------
  async addPayrollAdjustment(adjustmentData) {
    try {
      const insert = {
        empleado_id: adjustmentData?.employeeId,
        nomina_id: adjustmentData?.payrollId ?? null,
        tipo: adjustmentData?.type,
        categoria: adjustmentData?.category,
        monto: adjustmentData?.amount,
        descripcion: adjustmentData?.description,
        autorizado_por: adjustmentData?.authorizedBy,
      };

      const { data, error } = await supabase
        .from('ajustes_nomina')
        .insert(insert)
        .select('id,tipo,categoria,monto,descripcion,nomina_id,empleado_id,autorizado_por,created_at')
        .single();

      if (error) return fail(error);

      const mapped = {
        id: data?.id,
        type: data?.tipo,
        category: data?.categoria,
        amount: Number(data?.monto ?? 0),
        description: data?.descripcion,
        payrollId: data?.nomina_id ?? null,
        employeeId: data?.empleado_id ?? null,
        authorizedBy: data?.autorizado_por ?? null,
        createdAt: data?.created_at ?? null,
      };

      return ok(mapped);
    } catch (e) {
      return fail(e);
    }
  },

  // --------------------------------------------
  // 6) Marcar nómina como procesada
  // --------------------------------------------
  async processPayroll(payrollId, userId) {
    try {
      const { data, error } = await supabase
        .from('nominas')
        .update({
          procesada: true,
          procesada_por: userId,
          procesada_en: new Date().toISOString(),
        })
        .eq('id', payrollId)
        .select('id,procesada,procesada_por,procesada_en')
        .single();

      if (error) return fail(error);

      const mapped = {
        id: data?.id,
        processed: !!data?.procesada,
        processedBy: data?.procesada_por ?? null,
        processedAt: data?.procesada_en ?? null,
      };

      return ok(mapped);
    } catch (e) {
      return fail(e);
    }
  },

  // --------------------------------------------
  // 7) Resumen de nómina (por semana)
  //    Si pasas endDate, filtramos por rango; si no, por semana_inicio == startDate
  // --------------------------------------------
  async getPayrollSummary(startDate, endDate = null) {
    try {
      let query = supabase
        .from('nominas')
        .select(`
          id,
          empleado_id,
          semana_inicio,
          semana_fin,
          dias_trabajados,
          horas_regulares,
          horas_extra,
          salario_bruto,
          salario_neto,
          procesada,
          empleados:empleado_id (
            codigo_empleado,
            user_profiles:user_id ( full_name ),
            obras:obra_id ( nombre )
          )
        `)
        .order('salario_bruto', { ascending: false });

      if (endDate) {
        query = query.gte('semana_inicio', startDate).lte('semana_fin', endDate);
      } else {
        query = query.eq('semana_inicio', startDate);
      }

      const { data, error } = await query;
      if (error) return fail(error);

      const mapped = (data || []).map((r) => ({
        id: r?.id,
        employeeId: r?.empleado_id,
        employeeCode: r?.empleados?.codigo_empleado ?? null,
        employeeName: r?.empleados?.user_profiles?.full_name ?? null,
        site: r?.empleados?.obras?.nombre ?? null,
        workedDays: Number(r?.dias_trabajados ?? 0),
        regularHours: Number(r?.horas_regulares ?? 0),
        overtimeHours: Number(r?.horas_extra ?? 0),
        grossPay: Number(r?.salario_bruto ?? 0),
        netPay: Number(r?.salario_neto ?? 0),
        processed: !!r?.procesada,
        weekStart: r?.semana_inicio,
        weekEnd: r?.semana_fin,
      }));

      return ok(mapped);
    } catch (e) {
      return fail(e);
    }
  },

  // --------------------------------------------
  // 8) Eliminar ajuste
  // --------------------------------------------
  async deletePayrollAdjustment(adjustmentId) {
    try {
      const { error } = await supabase
        .from('ajustes_nomina')
        .delete()
        .eq('id', adjustmentId);

      if (error) return fail(error);
      return ok(true);
    } catch (e) {
      return fail(e);
    }
  },
};

export default payrollService;
