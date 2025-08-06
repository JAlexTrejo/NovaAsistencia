import { supabase } from '../lib/supabase';

const brandingService = {
  // Get active branding settings from configuracion_aplicacion table
  async getActiveBrandingSettings() {
    const { data, error } = await supabase
      ?.from('configuracion_aplicacion')
      ?.select('*')
      ?.order('updated_at', { ascending: false })
      ?.limit(1)
      ?.single();
    
    if (error && error?.code !== 'PGRST116') throw error;
    return data;
  },

  // Get all branding settings (SuperAdmin only)
  async getAllBrandingSettings() {
    const { data, error } = await supabase
      ?.from('configuracion_aplicacion')
      ?.select('*')
      ?.order('updated_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  // Create new branding settings
  async createBrandingSettings(payload) {
    const session = await supabase?.auth?.getSession();
    const { data, error } = await supabase
      ?.from('configuracion_aplicacion')
      ?.insert({
        nombre_empresa: payload?.nombre_empresa || payload?.company_name,
        logo_url: payload?.logo_url,
        color_primario: payload?.color_primario || payload?.primary_color,
        color_secundario: payload?.color_secundario || payload?.secondary_color,
        mensaje_bienvenida: payload?.mensaje_bienvenida || payload?.welcome_message,
        moneda: payload?.moneda || payload?.currency || 'MXN',
        simbolo_moneda: payload?.simbolo_moneda || payload?.currency_symbol || '$',
        actualizado_por: session?.data?.session?.user?.id,
        updated_at: new Date()?.toISOString()
      })
      ?.select()
      ?.single();
    
    if (error) throw error;
    return data;
  },

  // Update branding settings
  async updateBrandingSettings(id, payload) {
    const session = await supabase?.auth?.getSession();
    const { data, error } = await supabase
      ?.from('configuracion_aplicacion')
      ?.update({
        nombre_empresa: payload?.nombre_empresa || payload?.company_name,
        logo_url: payload?.logo_url,
        color_primario: payload?.color_primario || payload?.primary_color,
        color_secundario: payload?.color_secundario || payload?.secondary_color,
        mensaje_bienvenida: payload?.mensaje_bienvenida || payload?.welcome_message,
        moneda: payload?.moneda || payload?.currency || 'MXN',
        simbolo_moneda: payload?.simbolo_moneda || payload?.currency_symbol || '$',
        actualizado_por: session?.data?.session?.user?.id,
        updated_at: new Date()?.toISOString()
      })
      ?.eq('id', id)
      ?.select()
      ?.single();
    
    if (error) throw error;
    return data;
  },

  // Delete branding settings
  async deleteBrandingSettings(id) {
    const { error } = await supabase
      ?.from('configuracion_aplicacion')
      ?.delete()
      ?.eq('id', id);
    
    if (error) throw error;
  },

  // Upload branding asset (logo)
  async uploadBrandingAsset(file, assetType = 'logo') {
    try {
      const fileExt = file?.name?.split('.')?.pop();
      const fileName = `${assetType}_${Date.now()}.${fileExt}`;
      const filePath = `branding/${fileName}`;

      // Upload file to storage
      const { data: uploadData, error: uploadError } = await supabase?.storage
        ?.from('branding-assets')
        ?.upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase?.storage
        ?.from('branding-assets')
        ?.getPublicUrl(filePath);

      return {
        filePath: filePath,
        publicUrl: urlData?.publicUrl
      };
    } catch (error) {
      throw error;
    }
  },

  // Delete branding asset
  async deleteBrandingAsset(filePath) {
    try {
      const { error: storageError } = await supabase?.storage
        ?.from('branding-assets')
        ?.remove([filePath]);

      if (storageError) {
        console.warn('Storage deletion warning:', storageError?.message);
      }
    } catch (error) {
      throw error;
    }
  },

  // Apply branding colors and currency to UI
  applyBrandingSettings(brandingSettings) {
    if (!brandingSettings) return;

    const root = document.documentElement;
    
    if (brandingSettings?.color_primario) {
      root.style?.setProperty('--color-primary', brandingSettings?.color_primario);
    }
    
    if (brandingSettings?.color_secundario) {
      root.style?.setProperty('--color-secondary', brandingSettings?.color_secundario);
    }

    // Update page title with company name
    if (brandingSettings?.nombre_empresa) {
      document.title = `${brandingSettings?.nombre_empresa} - AsistenciaPro`;
    }

    // Store currency settings globally
    if (brandingSettings?.moneda && brandingSettings?.simbolo_moneda) {
      window.APP_CURRENCY = {
        code: brandingSettings?.moneda,
        symbol: brandingSettings?.simbolo_moneda
      };
    }
  },

  // Get branding for public use (no auth required)
  async getPublicBrandingSettings() {
    try {
      const { data } = await supabase
        ?.from('configuracion_aplicacion')
        ?.select('nombre_empresa, logo_url, color_primario, color_secundario, moneda, simbolo_moneda')
        ?.order('updated_at', { ascending: false })
        ?.limit(1)
        ?.single();
      
      return data || null;
    } catch (error) {
      console.warn('Could not load branding settings:', error?.message);
      return null;
    }
  },

  // Format currency amount using app settings
  formatCurrency(amount, settings = null) {
    const currency = settings || window.APP_CURRENCY || { code: 'MXN', symbol: '$' };
    
    if (typeof amount !== 'number') {
      amount = parseFloat(amount) || 0;
    }

    return `${currency?.symbol}${amount?.toLocaleString('es-MX', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })} ${currency?.code}`;
  }
};

export default brandingService;