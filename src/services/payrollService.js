// src/services/payrollService.js
import { supabase } from '@/lib/supabase';
import { adaptSupabaseError } from '@/utils/errors';

const ok   = (data) => ({ ok: true, data });
const fail = (e)    => ({ ok: false, ...adaptSupabaseError(e) });

// ------------------------------
// Helpers de fechas (semana lun-dom)
// ------------------------------
export function getWeekBounds(fromDateStr = null) {
  const base = fromDateStr ? new Date(fromDateStr) : new Date();
  const d = new Date(base);
  const day = (d.getDay() + 6) % 7; // lunes = 0
  const monday = new Date(d);
  monday.setDate(d.getDate() - day);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const toISO = (x) => x.toISOString().slice(0, 10);
  return { start: toISO(monday), end: toISO(sunday) };
}

const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

// ---------------------------------------------------------------------
// Capa principal (estimaciones + cálculos semanales basados en asistencia)
// ---------------------------------------------------------------------
export const payrollService = {
  /**
   * Obtiene una estimación semanal guardada (payroll_estimations).
   */
  async getWeeklyEstimation(employeeId, startDate, endDate) {
    try {
      const { data, error } = await supabase
        .from('payroll_estimations')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('week_start', startDate)
        .eq('week_end', endDate)
        .maybeSingle();

      if (error) return fail(error);
      return ok(data || null);
    } catch (e) {
      return fail(e);
    }
  },

  /**
   * Calcula estimación semanal desde attendance_records + employee_profiles
   * SIN escribir en BD. Devuelve objeto listo para upsert en payroll_estimations.
   */
  async calculateFromAttendance(employeeId, startDate, endDate) {
    try {
      // 1) Perfil del empleado (tipo de salario / monto)
      const { data: emp, error: empErr } = await supabase
        .from('employee_profiles')
        .select('id, salary_type, daily_salary, hourly_rate')
        .eq('id', employeeId)
        .single();
      if (empErr) return fail(empErr);
      const salaryType = (emp?.salary_type || 'daily').toLowerCase(); // 'daily' | 'hourly' | 'project'
      const daily = num(emp?.daily_salary);
      const hourly = num(emp?.hourly_rate);

      // 2) Asistencia en el rango
      const { data: att, error: attErr } = await supabase
        .from('attendance_records')
        .select('date, total_hours, overtime_hours, clock_in, clock_out')
        .eq('employee_id', employeeId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true });
      if (attErr) return fail(attErr);

      const rows = att || [];
      const workedDays = rows.filter((r) => r?.clock_in || num(r?.total_hours) > 0).length;
      const regularHours = rows.reduce((s, r) => s + num(r?.total_hours), 0);
      const overtimeHours = rows.reduce((s, r) => s + num(r?.overtime_hours), 0);

      // 3) Reglas de pago simples (puedes sustituidas por RPC si lo prefieres)
      let base_pay = 0;
      let overtime_pay = 0;

      if (salaryType === 'daily') {
        base_pay = daily * workedDays;
        // si además acumulas horas, puedes agregar in/out extras si aplica
        // overtime por horas extra sobre esquema local
        overtime_pay = overtimeHours * (daily / 8) * 1.5; // 1.5x
      } else if (salaryType === 'hourly') {
        base_pay = regularHours * hourly;
        overtime_pay = overtimeHours * hourly * 1.5;
      } else {
        // 'project' -> por ahora considera sólo horas base
        base_pay = daily * workedDays; // fallback razonable
        overtime_pay = overtimeHours * (daily / 8) * 1.5;
      }

      const bonuses = 0;
      const deductions = 0;
      const gross_total = base_pay + overtime_pay + bonuses;
      const net_total = gross_total - deductions;

      return ok({
        employee_id: employeeId,
        week_start: startDate,
        week_end: endDate,
        regular_hours: regularHours,
        overtime_hours: overtimeHours,
        base_pay,
        overtime_pay,
        bonuses,
        deductions,
        gross_total,
        net_total,
        // Extras por si quieres mostrar
        worked_days: workedDays,
        salary_type: salaryType,
      });
    } catch (e) {
      return fail(e);
    }
  },

  /**
   * Upsert de la estimación semanal (payroll_estimations).
   * Usa conflicto (employee_id, week_start, week_end).
   */
  async upsertWeeklyEstimation(estimation) {
    try {
      const payload = {
        employee_id: estimation?.employee_id,
        week_start: estimation?.week_start,
        week_end: estimation?.week_end,
        regular_hours: num(estimation?.regular_hours),
        overtime_hours: num(estimation?.overtime_hours),
        base_pay: num(estimation?.base_pay),
        overtime_pay: num(estimation?.overtime_pay),
        bonuses: num(estimation?.bonuses),
        deductions: num(estimation?.deductions),
        gross_total: num(estimation?.gross_total),
        net_total: num(estimation?.net_total),
      };

      const { data, error } = await supabase
        .from('payroll_estimations')
        .upsert(payload, { onConflict: 'employee_id,week_start,week_end' })
        .select('*')
        .single();

      if (error) return fail(error);
      return ok(data);
    } catch (e) {
      return fail(e);
    }
  },

  /**
   * (Opcional) Persistir cálculo “final” (payroll_calculations) tipo weekly.
   * Útil para “procesar nómina”.
   */
  async upsertWeeklyCalculation(calc, { calculatedBy = null, notes = null } = {}) {
    try {
      const payload = {
        employee_id: calc?.employee_id,
        calculation_date: calc?.calculation_date || new Date().toISOString().slice(0, 10),
        calculation_type: 'weekly',
        regular_hours: num(calc?.regular_hours),
        overtime_hours: num(calc?.overtime_hours),
        base_pay: num(calc?.base_pay),
        overtime_pay: num(calc?.overtime_pay),
        christmas_bonus: num(calc?.christmas_bonus),
        performance_bonus: num(calc?.performance_bonus),
        attendance_bonus: num(calc?.attendance_bonus),
        other_bonuses: num(calc?.other_bonuses),
        tax_deductions: num(calc?.tax_deductions),
        social_security: num(calc?.social_security),
        incident_deductions: num(calc?.incident_deductions),
        other_deductions: num(calc?.other_deductions),
        severance_days_worked: num(calc?.severance_days_worked),
        severance_vacation_days: num(calc?.severance_vacation_days),
        severance_proportional_benefits: num(calc?.severance_proportional_benefits),
        gross_total: num(calc?.gross_total),
        net_total: num(calc?.net_total),
        calculated_by: calculatedBy,
        notes: notes || calc?.notes || null,
      };

      // No tenemos una clave única natural acá; si quisieras evitar duplicados por semana,
      // agrega una unique partial index en DB o guarda “periodo” como notas y realiza upsert con RPC.
      const { data, error } = await supabase
        .from('payroll_calculations')
        .insert(payload)
        .select('*')
        .single();

      if (error) return fail(error);
      return ok(data);
    } catch (e) {
      return fail(e);
    }
  },

  /**
   * Resumen de nómina desde payroll_estimations (rango o semana puntual).
   */
  async getPayrollSummary(startDate, endDate = null) {
    try {
      let query = supabase
        .from('payroll_estimations')
        .select(`
          id,
          employee_id,
          week_start,
          week_end,
          regular_hours,
          overtime_hours,
          base_pay,
          overtime_pay,
          bonuses,
          deductions,
          gross_total,
          net_total,
          employee_profiles:employee_id ( full_name, employee_id:employee_id )
        `)
        .order('gross_total', { ascending: false });

      if (endDate) {
        query = query.gte('week_start', startDate).lte('week_end', endDate);
      } else {
        query = query.eq('week_start', startDate);
      }

      const { data, error } = await query;
      if (error) return fail(error);

      const mapped = (data || []).map((r) => ({
        id: r?.id,
        employeeId: r?.employee_id,
        employeeCode: r?.employee_profiles?.employee_id ?? null,
        employeeName: r?.employee_profiles?.full_name ?? null,
        regularHours: num(r?.regular_hours),
        overtimeHours: num(r?.overtime_hours),
        basePay: num(r?.base_pay),
        overtimePay: num(r?.overtime_pay),
        bonuses: num(r?.bonuses),
        deductions: num(r?.deductions),
        grossPay: num(r?.gross_total),
        netPay: num(r?.net_total),
        weekStart: r?.week_start,
        weekEnd: r?.week_end,
      }));

      return ok(mapped);
    } catch (e) {
      return fail(e);
    }
  },

  /**
   * “Cálculo semanal” compatible con tu página (wrapper que calcula desde asistencia).
   */
  async calculateWeeklyPayroll(employeeId, startDate, endDate) {
    // devolvemos lo calculado (no persiste)
    return this.calculateFromAttendance(employeeId, startDate, endDate);
  },
};

// ===================================================================================
// EXPORTS de compatibilidad (lo que esperan otras partes del frontend)
// ===================================================================================

/**
 * Devuelve resumen de nómina de la semana actual (o rango si pasas ambos).
 */
export async function getCurrentWeekPayroll(startDate = null, endDate = null) {
  const rng = startDate && endDate ? { start: startDate, end: endDate } : getWeekBounds();
  return payrollService.getPayrollSummary(rng.start, rng.end);
}

/**
 * Reexport: cálculo semanal (sin persistir), usado por páginas.
 */
export const calculateWeeklyPayroll = (employeeId, startDate, endDate) =>
  payrollService.calculateWeeklyPayroll(employeeId, startDate, endDate);

/**
 * Cálculo en lote: calcula desde asistencia y guarda/actualiza la estimación semanal.
 */
export async function bulkCalculatePayroll(employeeIds = [], startDate, endDate) {
  const results = [];
  for (const employeeId of employeeIds) {
    try {
      // 1) calcular desde asistencia
      const calc = await payrollService.calculateFromAttendance(employeeId, startDate, endDate);
      if (!calc.ok) {
        results.push({ employeeId, ok: false, ...calc });
        continue;
      }
      // 2) upsert estimación
      const up = await payrollService.upsertWeeklyEstimation(calc.data);
      results.push({ employeeId, ok: up.ok, data: up.data, ...(up.ok ? {} : up) });
    } catch (e) {
      results.push({ employeeId, ok: false, ...adaptSupabaseError(e) });
    }
  }
  return ok(results);
}

export default payrollService;
