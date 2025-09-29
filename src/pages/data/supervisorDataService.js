// Shim de compatibilidad para filtros (supervisores).
// Expone helpers mínimos y reencamina a servicios reales si existen.

import enhancedEmployeeService from '@/services/enhancedEmployeeService';
import { supabase } from '@/lib/supabase';

// Columnas explícitas básicas si se usa fallback
const SUP_COLS = [
  'id',
  'full_name',
  'email',
  'phone',
  'role',
  'status',
].join(',');

/** Lista de supervisores (datos completos si se requieren) */
async function getSupervisors(params = {}) {
  try {
    if (enhancedEmployeeService?.getSupervisors) {
      const res = await enhancedEmployeeService.getSupervisors(params);
      // normaliza
      return Array.isArray(res) ? res : (res?.data ?? []);
    }

    // Fallback directo: filtra por rol = 'supervisor' si aplica a tu esquema
    const { data, error } = await supabase
      .from('employees')
      .select(SUP_COLS)
      .eq('role', 'supervisor')
      .limit(1000);

    if (error) throw error;
    return data || [];
  } catch (e) {
    console.error('supervisorDataService.getSupervisors error:', e);
    return [];
  }
}

/** Opciones para Selects */
async function getSupervisorOptions(params = {}) {
  try {
    const supList = await getSupervisors(params);
    return (supList || []).map((s) => ({
      value: s?.id,
      label: s?.full_name || s?.name || 'Supervisor',
      email: s?.email || '',
      phone: s?.phone || '',
    }));
  } catch (e) {
    console.error('supervisorDataService.getSupervisorOptions error:', e);
    return [];
  }
}

export const supervisorDataService = {
  getSupervisors,
  getSupervisorOptions,
};

export default supervisorDataService;
