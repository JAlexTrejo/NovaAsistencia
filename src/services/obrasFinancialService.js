import { supabase } from '@/lib/supabase';
import { adaptSupabaseError } from '@/utils/errors';

const ok   = (data) => ({ ok: true, data });
const fail = (e)    => ({ ok: false, ...adaptSupabaseError(e) });

/* ================================
 * COMPANIES MANAGEMENT SERVICE
 * ================================ */

export const companiesService = {
  async getAll() {
    try {
      const { data, error } = await supabase
        .from('empresas')
        .select('id,nombre,rfc,tipo,activo,created_at')
        .order('nombre', { ascending: true });

      if (error) return fail(error);
      return ok(data ?? []);
    } catch (e) {
      return fail(e);
    }
  },

  async create(companyData) {
    try {
      const payload = {
        nombre: companyData?.nombre,
        rfc: companyData?.rfc ?? null,
        tipo: companyData?.tipo,
        activo: companyData?.activo ?? true,
      };

      const { data, error } = await supabase
        .from('empresas')
        .insert([payload])
        .select('id,nombre,rfc,tipo,activo,created_at')
        .single();

      if (error) return fail(error);
      return ok(data);
    } catch (e) {
      return fail(e);
    }
  },

  async update(companyId, companyData) {
    try {
      const payload = {
        nombre: companyData?.nombre,
        rfc: companyData?.rfc ?? null,
        tipo: companyData?.tipo,
        activo: companyData?.activo ?? true,
      };

      const { data, error } = await supabase
        .from('empresas')
        .update(payload)
        .eq('id', companyId)
        .select('id,nombre,rfc,tipo,activo,created_at')
        .single();

      if (error) return fail(error);
      return ok(data);
    } catch (e) {
      return fail(e);
    }
  },

  async delete(companyId) {
    try {
      const { error } = await supabase
        .from('empresas')
        .delete()
        .eq('id', companyId);

      if (error) return fail(error);
      return ok(true);
    } catch (e) {
      return fail(e);
    }
  },
};

/* =================================
 * DEPENDENCIES (DEPENDENCIAS)
 * ================================= */

export const dependenciesService = {
  async getAll() {
    try {
      const { data, error } = await supabase
        .from('dependencias')
        .select('id,nombre,created_at,activo')
        .order('nombre', { ascending: true });

      if (error) return fail(error);
      return ok(data ?? []);
    } catch (e) {
      return fail(e);
    }
  },

  async create(dependencyData) {
    try {
      const payload = {
        nombre: dependencyData?.nombre,
        activo: dependencyData?.activo ?? true,
      };

      const { data, error } = await supabase
        .from('dependencias')
        .insert([payload])
        .select('id,nombre,activo,created_at')
        .single();

      if (error) return fail(error);
      return ok(data);
    } catch (e) {
      return fail(e);
    }
  },
};

/* ================================
 * OBRAS (PROJECTS)
 * ================================ */

const OBRAS_VIEW_COLS = [
  'obra_id',
  'clave',
  'nombre',
  'estatus',
  'empresa_nombre',
  'dependencia_nombre',
  'presupuesto_total',
  'facturado_total',
  'pagado_total',
  'por_cobrar',
  'gastos_total',
  'costo_directo',
  'utilidad_bruta',
  'utilidad_vs_presupuesto',
  'utilidad_pct_real',
  'avance_financiero_pct',
  'margen_presupuestado_pct',
  'created_at',
].join(',');

export const obrasService = {
  // Soporta limit/offset opcionales (paginación)
  async getAll({ limit = null, offset = null } = {}) {
    try {
      let query = supabase
        .from('vw_obras_finanzas')
        .select(OBRAS_VIEW_COLS)
        .order('created_at', { ascending: false });

      if (Number.isInteger(limit) && Number.isInteger(offset)) {
        query = query.range(offset, offset + limit - 1);
      }

      const { data, error } = await query;
      if (error) return fail(error);
      return ok(data ?? []);
    } catch (e) {
      return fail(e);
    }
  },

  async getById(obraId) {
    try {
      const { data, error } = await supabase
        .from('vw_obras_finanzas')
        .select(OBRAS_VIEW_COLS)
        .eq('obra_id', obraId)
        .single();

      if (error) return fail(error);
      return ok(data);
    } catch (e) {
      return fail(e);
    }
  },

  async create(obraData) {
    try {
      const payload = {
        clave: obraData?.clave,
        nombre: obraData?.nombre,
        estatus: obraData?.estatus ?? 'Planeación',
        empresa_id: obraData?.empresa_id,
        dependencia_id: obraData?.dependencia_id ?? null,
        con_iva: obraData?.con_iva ?? true,
        presupuesto_inicial: obraData?.presupuesto_inicial ?? 0,
        anticipo: obraData?.anticipo ?? 0,
        fecha_inicio: obraData?.fecha_inicio ?? null,
        fecha_fin_compromiso: obraData?.fecha_fin_compromiso ?? null,
        notas: obraData?.notas ?? null,
      };

      const { data, error } = await supabase
        .from('obras_financiero')
        .insert([payload])
        .select('id,clave,nombre,estatus,empresa_id,dependencia_id,con_iva,presupuesto_inicial,anticipo,fecha_inicio,fecha_fin_compromiso,notas,created_at')
        .single();

      if (error) return fail(error);
      return ok(data);
    } catch (e) {
      return fail(e);
    }
  },

  async update(obraId, obraData) {
    try {
      const { data, error } = await supabase
        .from('obras_financiero')
        .update(obraData)
        .eq('id', obraId)
        .select('id,clave,nombre,estatus,empresa_id,dependencia_id,con_iva,presupuesto_inicial,anticipo,fecha_inicio,fecha_fin_compromiso,notas,updated_at,created_at')
        .single();

      if (error) return fail(error);
      return ok(data);
    } catch (e) {
      return fail(e);
    }
  },

  async delete(obraId) {
    try {
      const { error } = await supabase
        .from('obras_financiero')
        .delete()
        .eq('id', obraId);

      if (error) return fail(error);
      return ok(true);
    } catch (e) {
      return fail(e);
    }
  },
};

/* ================================
 * CHANGE ORDERS
 * ================================ */

export const changeOrdersService = {
  async getByObraId(obraId, { limit = null, offset = null } = {}) {
    try {
      let query = supabase
        .from('ordenes_cambio')
        .select('id,obra_id,folio,concepto,monto,fecha,estatus,created_at,updated_at')
        .eq('obra_id', obraId)
        .order('fecha', { ascending: false });

      if (Number.isInteger(limit) && Number.isInteger(offset)) {
        query = query.range(offset, offset + limit - 1);
      }

      const { data, error } = await query;
      if (error) return fail(error);
      return ok(data ?? []);
    } catch (e) {
      return fail(e);
    }
  },

  async create(changeOrderData) {
    try {
      const { data, error } = await supabase
        .from('ordenes_cambio')
        .insert([changeOrderData])
        .select('id,obra_id,folio,concepto,monto,fecha,estatus,created_at,updated_at')
        .single();

      if (error) return fail(error);
      return ok(data);
    } catch (e) {
      return fail(e);
    }
  },

  async update(changeOrderId, changeOrderData) {
    try {
      const { data, error } = await supabase
        .from('ordenes_cambio')
        .update(changeOrderData)
        .eq('id', changeOrderId)
        .select('id,obra_id,folio,concepto,monto,fecha,estatus,created_at,updated_at')
        .single();

      if (error) return fail(error);
      return ok(data);
    } catch (e) {
      return fail(e);
    }
  },

  async delete(changeOrderId) {
    try {
      const { error } = await supabase
        .from('ordenes_cambio')
        .delete()
        .eq('id', changeOrderId);

      if (error) return fail(error);
      return ok(true);
    } catch (e) {
      return fail(e);
    }
  },
};

/* ================================
 * INVOICES / REQUISITIONS
 * ================================ */

export const invoicesService = {
  async getByObraId(obraId, { limit = null, offset = null } = {}) {
    try {
      let query = supabase
        .from('facturas_ventas')
        .select('id,obra_id,folio,tipo,subtotal,iva,total,fecha_emision,fecha_vencimiento,estatus,created_at,updated_at')
        .eq('obra_id', obraId)
        .order('fecha_emision', { ascending: false });

      if (Number.isInteger(limit) && Number.isInteger(offset)) {
        query = query.range(offset, offset + limit - 1);
      }

      const { data, error } = await query;
      if (error) return fail(error);
      return ok(data ?? []);
    } catch (e) {
      return fail(e);
    }
  },

  async create(invoiceData) {
    try {
      const { data, error } = await supabase
        .from('facturas_ventas')
        .insert([invoiceData])
        .select('id,obra_id,folio,tipo,subtotal,iva,total,fecha_emision,fecha_vencimiento,estatus,created_at,updated_at')
        .single();

      if (error) return fail(error);
      return ok(data);
    } catch (e) {
      return fail(e);
    }
  },

  async update(invoiceId, invoiceData) {
    try {
      const { data, error } = await supabase
        .from('facturas_ventas')
        .update(invoiceData)
        .eq('id', invoiceId)
        .select('id,obra_id,folio,tipo,subtotal,iva,total,fecha_emision,fecha_vencimiento,estatus,created_at,updated_at')
        .single();

      if (error) return fail(error);
      return ok(data);
    } catch (e) {
      return fail(e);
    }
  },
};

/* ================================
 * PAYMENTS
 * ================================ */

export const paymentsService = {
  async getByObraId(obraId, { limit = null, offset = null } = {}) {
    try {
      let query = supabase
        .from('pagos_recibidos')
        .select(`
          id,
          obra_id,
          factura_id,
          fecha,
          monto,
          metodo,
          referencia,
          comentarios,
          created_at,
          updated_at,
          factura:facturas_ventas(id,folio,tipo,total)
        `)
        .eq('obra_id', obraId)
        .order('fecha', { ascending: false });

      if (Number.isInteger(limit) && Number.isInteger(offset)) {
        query = query.range(offset, offset + limit - 1);
      }

      const { data, error } = await query;
      if (error) return fail(error);
      return ok(data ?? []);
    } catch (e) {
      return fail(e);
    }
  },

  async create(paymentData) {
    try {
      const { data, error } = await supabase
        .from('pagos_recibidos')
        .insert([paymentData])
        .select('id,obra_id,factura_id,fecha,monto,metodo,referencia,comentarios,created_at,updated_at')
        .single();

      if (error) return fail(error);
      return ok(data);
    } catch (e) {
      return fail(e);
    }
  },
};

/* ================================
 * EXPENSES
 * ================================ */

export const expensesService = {
  async getByObraId(obraId, { limit = null, offset = null } = {}) {
    try {
      let query = supabase
        .from('gastos')
        .select(`
          id,
          obra_id,
          empresa_id,
          concepto,
          subtotal,
          iva,
          total,
          fecha,
          estatus,
          comprobante_url,
          created_at,
          updated_at,
          proveedor:empresas(id,nombre,rfc)
        `)
        .eq('obra_id', obraId)
        .order('fecha', { ascending: false });

      if (Number.isInteger(limit) && Number.isInteger(offset)) {
        query = query.range(offset, offset + limit - 1);
      }

      const { data, error } = await query;
      if (error) return fail(error);
      return ok(data ?? []);
    } catch (e) {
      return fail(e);
    }
  },

  async create(expenseData) {
    try {
      const { data, error } = await supabase
        .from('gastos')
        .insert([expenseData])
        .select('id,obra_id,empresa_id,concepto,subtotal,iva,total,fecha,estatus,comprobante_url,created_at,updated_at')
        .single();

      if (error) return fail(error);
      return ok(data);
    } catch (e) {
      return fail(e);
    }
  },
};

/* ================================
 * BUDGET LINE ITEMS
 * ================================ */

export const budgetService = {
  async getByObraId(obraId, { limit = null, offset = null } = {}) {
    try {
      let query = supabase
        .from('presupuestos_partidas')
        .select('id,obra_id,partida,descripcion,unidad,cantidad,precio_unitario,importe,created_at,updated_at')
        .eq('obra_id', obraId)
        .order('partida', { ascending: true });

      if (Number.isInteger(limit) && Number.isInteger(offset)) {
        query = query.range(offset, offset + limit - 1);
      }

      const { data, error } = await query;
      if (error) return fail(error);
      return ok(data ?? []);
    } catch (e) {
      return fail(e);
    }
  },

  async create(budgetData) {
    try {
      const { data, error } = await supabase
        .from('presupuestos_partidas')
        .insert([budgetData])
        .select('id,obra_id,partida,descripcion,unidad,cantidad,precio_unitario,importe,created_at,updated_at')
        .single();

      if (error) return fail(error);
      return ok(data);
    } catch (e) {
      return fail(e);
    }
  },

  async update(budgetId, budgetData) {
    try {
      const { data, error } = await supabase
        .from('presupuestos_partidas')
        .update(budgetData)
        .eq('id', budgetId)
        .select('id,obra_id,partida,descripcion,unidad,cantidad,precio_unitario,importe,created_at,updated_at')
        .single();

      if (error) return fail(error);
      return ok(data);
    } catch (e) {
      return fail(e);
    }
  },
};

/* ================================
 * FINANCIAL ANALYTICS
 * ================================ */

export const financialAnalyticsService = {
  async getObraFinancialSummary(obraId) {
    try {
      const { data, error } = await supabase
        .from('vw_obras_finanzas')
        .select(`
          obra_id,
          clave,
          nombre,
          estatus,
          presupuesto_total,
          facturado_total,
          pagado_total,
          por_cobrar,
          gastos_total,
          costo_directo,
          utilidad_bruta,
          utilidad_vs_presupuesto,
          utilidad_pct_real,
          avance_financiero_pct,
          margen_presupuestado_pct,
          empresa_nombre,
          dependencia_nombre
        `)
        .eq('obra_id', obraId)
        .single();

      if (error) return fail(error);
      return ok(data);
    } catch (e) {
      return fail(e);
    }
  },

  async getOverallKPIs() {
    try {
      const { data, error } = await supabase
        .from('vw_obras_finanzas')
        .select(`
          presupuesto_total,
          facturado_total,
          pagado_total,
          por_cobrar,
          gastos_total,
          utilidad_bruta,
          estatus
        `);

      if (error) return fail(error);

      const kpis = (data || []).reduce(
        (acc, obra) => ({
          total_presupuesto: acc.total_presupuesto + (obra?.presupuesto_total || 0),
          total_facturado:   acc.total_facturado   + (obra?.facturado_total   || 0),
          total_pagado:      acc.total_pagado      + (obra?.pagado_total      || 0),
          total_por_cobrar:  acc.total_por_cobrar  + (obra?.por_cobrar        || 0),
          total_gastos:      acc.total_gastos      + (obra?.gastos_total      || 0),
          total_utilidad:    acc.total_utilidad    + (obra?.utilidad_bruta    || 0),
          obras_activas:     acc.obras_activas     + (obra?.estatus === 'En ejecución' ? 1 : 0),
          obras_total:       acc.obras_total       + 1,
        }),
        {
          total_presupuesto: 0,
          total_facturado: 0,
          total_pagado: 0,
          total_por_cobrar: 0,
          total_gastos: 0,
          total_utilidad: 0,
          obras_activas: 0,
          obras_total: 0,
        }
      );

      return ok(kpis);
    } catch (e) {
      return fail(e);
    }
  },
};

/* ================================
 * REAL-TIME SUBSCRIPTIONS
 * ================================ */

export const subscriptionsService = {
  subscribeToObras(callback) {
    try {
      const channel = supabase
        .channel('obras_financial_changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'obras_financiero' },
          callback
        )
        .subscribe();

      return channel; // usa supabase.removeChannel(channel) en cleanup
    } catch (e) {
      console.error('Failed to subscribe to obra changes:', e);
      return null;
    }
  },

  subscribeToFinancialData(obraId, callback) {
    try {
      const channel = supabase
        .channel(`financial_changes_${obraId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'facturas_ventas', filter: `obra_id=eq.${obraId}` },
          callback
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'pagos_recibidos', filter: `obra_id=eq.${obraId}` },
          callback
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'gastos', filter: `obra_id=eq.${obraId}` },
          callback
        )
        .subscribe();

      return channel;
    } catch (e) {
      console.error('Failed to subscribe to financial changes:', e);
      return null;
    }
  },

  unsubscribe(channel) {
    try {
      if (channel) supabase.removeChannel(channel);
    } catch (e) {
      console.error('Failed to unsubscribe:', e);
    }
  },
};

export default {
  companiesService,
  dependenciesService,
  obrasService,
  changeOrdersService,
  invoicesService,
  paymentsService,
  expensesService,
  budgetService,
  financialAnalyticsService,
  subscriptionsService,
};
