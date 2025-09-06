import { supabase } from '../lib/supabase';

// =============================================
// COMPANIES MANAGEMENT SERVICE
// =============================================

export const companiesService = {
  // Get all companies
  async getAll() {
    try {
      const { data, error } = await supabase
        ?.from('empresas')
        ?.select(`
          id, nombre, rfc, tipo, activo, created_at
        `)
        ?.order('nombre');

      if (error) {
        throw new Error(`Failed to fetch companies: ${error?.message}`);
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error: error?.message };
    }
  },

  // Create new company
  async create(companyData) {
    try {
      const { data, error } = await supabase
        ?.from('empresas')
        ?.insert([{
          nombre: companyData?.nombre,
          rfc: companyData?.rfc || null,
          tipo: companyData?.tipo,
          activo: companyData?.activo ?? true
        }])
        ?.select()
        ?.single();

      if (error) {
        throw new Error(`Failed to create company: ${error?.message}`);
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error: error?.message };
    }
  },

  // Update company
  async update(companyId, companyData) {
    try {
      const { data, error } = await supabase
        ?.from('empresas')
        ?.update({
          nombre: companyData?.nombre,
          rfc: companyData?.rfc,
          tipo: companyData?.tipo,
          activo: companyData?.activo
        })
        ?.eq('id', companyId)
        ?.select()
        ?.single();

      if (error) {
        throw new Error(`Failed to update company: ${error?.message}`);
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error: error?.message };
    }
  },

  // Delete company
  async delete(companyId) {
    try {
      const { error } = await supabase
        ?.from('empresas')
        ?.delete()
        ?.eq('id', companyId);

      if (error) {
        throw new Error(`Failed to delete company: ${error?.message}`);
      }

      return { error: null };
    } catch (error) {
      return { error: error?.message };
    }
  }
};

// =============================================
// DEPENDENCIES MANAGEMENT SERVICE
// =============================================

export const dependenciesService = {
  // Get all dependencies
  async getAll() {
    try {
      const { data, error } = await supabase
        ?.from('dependencias')
        ?.select('*')
        ?.order('nombre');

      if (error) {
        throw new Error(`Failed to fetch dependencies: ${error?.message}`);
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error: error?.message };
    }
  },

  // Create dependency
  async create(dependencyData) {
    try {
      const { data, error } = await supabase
        ?.from('dependencias')
        ?.insert([dependencyData])
        ?.select()
        ?.single();

      if (error) {
        throw new Error(`Failed to create dependency: ${error?.message}`);
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error: error?.message };
    }
  }
};

// =============================================
// OBRAS (PROJECTS) MANAGEMENT SERVICE  
// =============================================

export const obrasService = {
  // Get all obras with financial KPIs
  async getAll() {
    try {
      const { data, error } = await supabase
        ?.from('vw_obras_finanzas')
        ?.select('*')
        ?.order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch obras: ${error?.message}`);
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error: error?.message };
    }
  },

  // Get obra by ID with full financial details
  async getById(obraId) {
    try {
      const { data, error } = await supabase
        ?.from('vw_obras_finanzas')
        ?.select('*')
        ?.eq('obra_id', obraId)
        ?.single();

      if (error) {
        throw new Error(`Failed to fetch obra: ${error?.message}`);
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error: error?.message };
    }
  },

  // Create new obra
  async create(obraData) {
    try {
      const { data, error } = await supabase
        ?.from('obras_financiero')
        ?.insert([{
          clave: obraData?.clave,
          nombre: obraData?.nombre,
          estatus: obraData?.estatus || 'Planeación',
          empresa_id: obraData?.empresa_id,
          dependencia_id: obraData?.dependencia_id || null,
          con_iva: obraData?.con_iva ?? true,
          presupuesto_inicial: obraData?.presupuesto_inicial || 0,
          anticipo: obraData?.anticipo || 0,
          fecha_inicio: obraData?.fecha_inicio || null,
          fecha_fin_compromiso: obraData?.fecha_fin_compromiso || null,
          notas: obraData?.notas || null
        }])
        ?.select()
        ?.single();

      if (error) {
        throw new Error(`Failed to create obra: ${error?.message}`);
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error: error?.message };
    }
  },

  // Update obra
  async update(obraId, obraData) {
    try {
      const { data, error } = await supabase
        ?.from('obras_financiero')
        ?.update(obraData)
        ?.eq('id', obraId)
        ?.select()
        ?.single();

      if (error) {
        throw new Error(`Failed to update obra: ${error?.message}`);
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error: error?.message };
    }
  },

  // Delete obra
  async delete(obraId) {
    try {
      const { error } = await supabase
        ?.from('obras_financiero')
        ?.delete()
        ?.eq('id', obraId);

      if (error) {
        throw new Error(`Failed to delete obra: ${error?.message}`);
      }

      return { error: null };
    } catch (error) {
      return { error: error?.message };
    }
  }
};

// =============================================
// CHANGE ORDERS SERVICE
// =============================================

export const changeOrdersService = {
  // Get change orders by obra ID
  async getByObraId(obraId) {
    try {
      const { data, error } = await supabase
        ?.from('ordenes_cambio')
        ?.select('*')
        ?.eq('obra_id', obraId)
        ?.order('fecha', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch change orders: ${error?.message}`);
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error: error?.message };
    }
  },

  // Create change order
  async create(changeOrderData) {
    try {
      const { data, error } = await supabase
        ?.from('ordenes_cambio')
        ?.insert([changeOrderData])
        ?.select()
        ?.single();

      if (error) {
        throw new Error(`Failed to create change order: ${error?.message}`);
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error: error?.message };
    }
  },

  // Update change order
  async update(changeOrderId, changeOrderData) {
    try {
      const { data, error } = await supabase
        ?.from('ordenes_cambio')
        ?.update(changeOrderData)
        ?.eq('id', changeOrderId)
        ?.select()
        ?.single();

      if (error) {
        throw new Error(`Failed to update change order: ${error?.message}`);
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error: error?.message };
    }
  },

  // Delete change order
  async delete(changeOrderId) {
    try {
      const { error } = await supabase
        ?.from('ordenes_cambio')
        ?.delete()
        ?.eq('id', changeOrderId);

      if (error) {
        throw new Error(`Failed to delete change order: ${error?.message}`);
      }

      return { error: null };
    } catch (error) {
      return { error: error?.message };
    }
  }
};

// =============================================
// INVOICES/REQUISITIONS SERVICE
// =============================================

export const invoicesService = {
  // Get invoices by obra ID
  async getByObraId(obraId) {
    try {
      const { data, error } = await supabase
        ?.from('facturas_ventas')
        ?.select('*')
        ?.eq('obra_id', obraId)
        ?.order('fecha_emision', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch invoices: ${error?.message}`);
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error: error?.message };
    }
  },

  // Create invoice
  async create(invoiceData) {
    try {
      const { data, error } = await supabase
        ?.from('facturas_ventas')
        ?.insert([invoiceData])
        ?.select()
        ?.single();

      if (error) {
        throw new Error(`Failed to create invoice: ${error?.message}`);
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error: error?.message };
    }
  },

  // Update invoice
  async update(invoiceId, invoiceData) {
    try {
      const { data, error } = await supabase
        ?.from('facturas_ventas')
        ?.update(invoiceData)
        ?.eq('id', invoiceId)
        ?.select()
        ?.single();

      if (error) {
        throw new Error(`Failed to update invoice: ${error?.message}`);
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error: error?.message };
    }
  }
};

// =============================================
// PAYMENTS SERVICE
// =============================================

export const paymentsService = {
  // Get payments by obra ID
  async getByObraId(obraId) {
    try {
      const { data, error } = await supabase
        ?.from('pagos_recibidos')
        ?.select(`
          *,
          factura:facturas_ventas(folio, tipo, total)
        `)
        ?.eq('obra_id', obraId)
        ?.order('fecha', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch payments: ${error?.message}`);
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error: error?.message };
    }
  },

  // Create payment
  async create(paymentData) {
    try {
      const { data, error } = await supabase
        ?.from('pagos_recibidos')
        ?.insert([paymentData])
        ?.select()
        ?.single();

      if (error) {
        throw new Error(`Failed to create payment: ${error?.message}`);
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error: error?.message };
    }
  }
};

// =============================================
// EXPENSES SERVICE
// =============================================

export const expensesService = {
  // Get expenses by obra ID
  async getByObraId(obraId) {
    try {
      const { data, error } = await supabase
        ?.from('gastos')
        ?.select(`
          *,
          proveedor:empresas(nombre, rfc)
        `)
        ?.eq('obra_id', obraId)
        ?.order('fecha', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch expenses: ${error?.message}`);
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error: error?.message };
    }
  },

  // Create expense
  async create(expenseData) {
    try {
      const { data, error } = await supabase
        ?.from('gastos')
        ?.insert([expenseData])
        ?.select()
        ?.single();

      if (error) {
        throw new Error(`Failed to create expense: ${error?.message}`);
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error: error?.message };
    }
  }
};

// =============================================
// BUDGET LINE ITEMS SERVICE
// =============================================

export const budgetService = {
  // Get budget items by obra ID
  async getByObraId(obraId) {
    try {
      const { data, error } = await supabase
        ?.from('presupuestos_partidas')
        ?.select('*')
        ?.eq('obra_id', obraId)
        ?.order('partida');

      if (error) {
        throw new Error(`Failed to fetch budget items: ${error?.message}`);
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error: error?.message };
    }
  },

  // Create budget item
  async create(budgetData) {
    try {
      const { data, error } = await supabase
        ?.from('presupuestos_partidas')
        ?.insert([budgetData])
        ?.select()
        ?.single();

      if (error) {
        throw new Error(`Failed to create budget item: ${error?.message}`);
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error: error?.message };
    }
  },

  // Update budget item
  async update(budgetId, budgetData) {
    try {
      const { data, error } = await supabase
        ?.from('presupuestos_partidas')
        ?.update(budgetData)
        ?.eq('id', budgetId)
        ?.select()
        ?.single();

      if (error) {
        throw new Error(`Failed to update budget item: ${error?.message}`);
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error: error?.message };
    }
  }
};

// =============================================
// FINANCIAL ANALYTICS SERVICE
// =============================================

export const financialAnalyticsService = {
  // Get obra financial summary
  async getObraFinancialSummary(obraId) {
    try {
      const { data, error } = await supabase
        ?.from('vw_obras_finanzas')
        ?.select(`
          obra_id, clave, nombre, estatus,
          presupuesto_total, facturado_total, pagado_total,
          por_cobrar, gastos_total, costo_directo,
          utilidad_bruta, utilidad_vs_presupuesto,
          utilidad_pct_real, avance_financiero_pct,
          margen_presupuestado_pct,
          empresa_nombre, dependencia_nombre
        `)
        ?.eq('obra_id', obraId)
        ?.single();

      if (error) {
        throw new Error(`Failed to fetch financial summary: ${error?.message}`);
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error: error?.message };
    }
  },

  // Get overall financial KPIs
  async getOverallKPIs() {
    try {
      const { data, error } = await supabase
        ?.from('vw_obras_finanzas')
        ?.select(`
          presupuesto_total, facturado_total, pagado_total,
          por_cobrar, gastos_total, utilidad_bruta,
          estatus
        `);

      if (error) {
        throw new Error(`Failed to fetch KPIs: ${error?.message}`);
      }

      // Calculate aggregate KPIs
      const kpis = data?.reduce(
        (acc, obra) => ({
          total_presupuesto: acc?.total_presupuesto + (obra?.presupuesto_total || 0),
          total_facturado: acc?.total_facturado + (obra?.facturado_total || 0),
          total_pagado: acc?.total_pagado + (obra?.pagado_total || 0),
          total_por_cobrar: acc?.total_por_cobrar + (obra?.por_cobrar || 0),
          total_gastos: acc?.total_gastos + (obra?.gastos_total || 0),
          total_utilidad: acc?.total_utilidad + (obra?.utilidad_bruta || 0),
          obras_activas: acc?.obras_activas + (obra?.estatus === 'En ejecución' ? 1 : 0),
          obras_total: acc?.obras_total + 1
        }),
        {
          total_presupuesto: 0,
          total_facturado: 0,
          total_pagado: 0,
          total_por_cobrar: 0,
          total_gastos: 0,
          total_utilidad: 0,
          obras_activas: 0,
          obras_total: 0
        }
      );

      return { data: kpis, error: null };
    } catch (error) {
      return { data: null, error: error?.message };
    }
  }
};

// =============================================
// REAL-TIME SUBSCRIPTION SERVICE
// =============================================

export const subscriptionsService = {
  // Subscribe to obra changes
  subscribeToObras(callback) {
    try {
      const channel = supabase
        ?.channel('obras_financial_changes')
        ?.on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'obras_financiero' },
          callback
        )
        ?.subscribe();

      return channel;
    } catch (error) {
      console.error('Failed to subscribe to obra changes:', error);
      return null;
    }
  },

  // Subscribe to financial data changes
  subscribeToFinancialData(obraId, callback) {
    try {
      const channel = supabase
        ?.channel(`financial_changes_${obraId}`)
        ?.on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'facturas_ventas', filter: `obra_id=eq.${obraId}` },
          callback
        )
        ?.on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'pagos_recibidos', filter: `obra_id=eq.${obraId}` },
          callback
        )
        ?.on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'gastos', filter: `obra_id=eq.${obraId}` },
          callback
        )
        ?.subscribe();

      return channel;
    } catch (error) {
      console.error('Failed to subscribe to financial changes:', error);
      return null;
    }
  },

  // Unsubscribe from channel
  unsubscribe(channel) {
    try {
      if (channel) {
        supabase?.removeChannel(channel);
      }
    } catch (error) {
      console.error('Failed to unsubscribe:', error);
    }
  }
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
  subscriptionsService
};