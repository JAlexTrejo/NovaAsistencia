import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

import { useAuth } from '../../../contexts/AuthContext';
import brandingService from '../../../services/brandingService';

const BrandingCustomizationTab = () => {
  const { isSuperAdmin } = useAuth();
  const [brandingSettings, setBrandingSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    nombre_empresa: '',
    logo_url: '',
    color_primario: '#3B82F6',
    color_secundario: '#10B981',
    mensaje_bienvenida: '',
    moneda: 'MXN',
    simbolo_moneda: '$'
  });

  useEffect(() => {
    if (isSuperAdmin()) {
      loadBrandingSettings();
    } else {
      setError('Acceso denegado. Solo los SuperAdministradores pueden acceder a esta funcionalidad.');
      setLoading(false);
    }
  }, [isSuperAdmin]);

  const loadBrandingSettings = async () => {
    try {
      setLoading(true);
      setError('');
      const settings = await brandingService?.getActiveBrandingSettings();
      
      if (settings) {
        setBrandingSettings(settings);
        setFormData({
          nombre_empresa: settings?.nombre_empresa || '',
          logo_url: settings?.logo_url || '',
          color_primario: settings?.color_primario || '#3B82F6',
          color_secundario: settings?.color_secundario || '#10B981',
          mensaje_bienvenida: settings?.mensaje_bienvenida || '',
          moneda: settings?.moneda || 'MXN',
          simbolo_moneda: settings?.simbolo_moneda || '$'
        });
      }
    } catch (err) {
      setError(err?.message || 'Error al cargar la configuración de marca');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setHasChanges(true);
    setError('');
    setSuccess('');
  };

  const handleLogoUpload = async (file) => {
    if (!file) return;

    try {
      setUploading(true);
      setError('');

      let result = await brandingService?.uploadBrandingAsset(file, 'logo');
      
      // Update form data with new logo URL
      handleInputChange('logo_url', result?.publicUrl);
      
      setSuccess('Logo subido exitosamente');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err?.message || 'Error al subir el logo');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      
      let result;
      if (brandingSettings?.id) {
        result = await brandingService?.updateBrandingSettings(brandingSettings?.id, formData);
      } else {
        result = await brandingService?.createBrandingSettings(formData);
      }
      
      setBrandingSettings(result);
      setHasChanges(false);
      setSuccess('¡Configuración de marca guardada exitosamente!');
      
      // Apply branding immediately
      brandingService?.applyBrandingSettings(result);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err?.message || 'Error al guardar la configuración de marca');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (brandingSettings) {
      setFormData({
        nombre_empresa: brandingSettings?.nombre_empresa || '',
        logo_url: brandingSettings?.logo_url || '',
        color_primario: brandingSettings?.color_primario || '#3B82F6',
        color_secundario: brandingSettings?.color_secundario || '#10B981',
        mensaje_bienvenida: brandingSettings?.mensaje_bienvenida || '',
        moneda: brandingSettings?.moneda || 'MXN',
        simbolo_moneda: brandingSettings?.simbolo_moneda || '$'
      });
    }
    setHasChanges(false);
    setError('');
    setSuccess('');
  };

  const currencyOptions = [
    { code: 'MXN', symbol: '$', name: 'Peso Mexicano (MXN)' },
    { code: 'USD', symbol: '$', name: 'Dólar Estadounidense (USD)' },
    { code: 'EUR', symbol: '€', name: 'Euro (EUR)' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Icon name="Loader2" size={24} className="animate-spin text-primary mx-auto mb-2" />
          <p className="text-muted-foreground">Cargando configuración de marca...</p>
        </div>
      </div>
    );
  }

  if (!isSuperAdmin()) {
    return (
      <div className="text-center p-8">
        <Icon name="Lock" size={48} className="text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">Acceso Restringido</h3>
        <p className="text-muted-foreground">
          Solo los SuperAdministradores pueden acceder a la personalización de marca.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Action Banner */}
      {hasChanges && (
        <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Icon name="AlertTriangle" size={20} className="text-warning" />
              <span className="text-sm font-medium text-foreground">
                Tienes cambios sin guardar en la configuración de marca
              </span>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={handleReset}>
                Descartar
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Icon name="Loader2" size={16} className="animate-spin mr-2" />
                    Guardando...
                  </>
                ) : (
                  'Guardar Cambios'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="bg-success/10 border border-success/20 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Icon name="CheckCircle" size={20} className="text-success" />
            <span className="text-sm font-medium text-foreground">{success}</span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Icon name="AlertCircle" size={20} className="text-destructive" />
            <span className="text-sm font-medium text-foreground">{error}</span>
          </div>
        </div>
      )}

      {/* Company Identity */}
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Icon name="Building" size={20} className="text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Identidad de la Empresa</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Nombre de la Empresa"
            value={formData?.nombre_empresa}
            onChange={(e) => handleInputChange('nombre_empresa', e?.target?.value)}
            placeholder="Mi Empresa Constructora"
          />
          <div className="md:col-span-2">
            <Input
              label="Mensaje de Bienvenida"
              value={formData?.mensaje_bienvenida}
              onChange={(e) => handleInputChange('mensaje_bienvenida', e?.target?.value)}
              placeholder="Sistema de gestión de asistencia y recursos humanos"
            />
          </div>
        </div>
      </div>

      {/* Logo Upload */}
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Icon name="Image" size={20} className="text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Logo de la Empresa</h3>
        </div>
        
        <div className="space-y-4">
          {formData?.logo_url && (
            <div className="flex items-center justify-center p-4 border-2 border-dashed border-border rounded-lg">
              <img
                src={formData?.logo_url}
                alt="Logo actual"
                className="max-h-32 max-w-full object-contain"
              />
            </div>
          )}
          
          <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleLogoUpload(e?.target?.files?.[0])}
              className="hidden"
              id="logo-upload"
              disabled={uploading}
            />
            <label
              htmlFor="logo-upload"
              className={`cursor-pointer ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Icon name={uploading ? "Loader2" : "Upload"} 
                    size={32} 
                    className={`text-muted-foreground mx-auto mb-2 ${uploading ? 'animate-spin' : ''}`} />
              <p className="text-sm text-primary hover:text-primary/80">
                {uploading ? 'Subiendo logo...' : 'Seleccionar nuevo logo'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Formatos permitidos: JPG, PNG, SVG. Máximo 5MB
              </p>
            </label>
          </div>
        </div>
      </div>

      {/* Brand Colors */}
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Icon name="Palette" size={20} className="text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Colores de Marca</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Color Primario
            </label>
            <div className="flex space-x-2">
              <input
                type="color"
                value={formData?.color_primario}
                onChange={(e) => handleInputChange('color_primario', e?.target?.value)}
                className="w-12 h-10 rounded border border-border cursor-pointer"
              />
              <Input
                value={formData?.color_primario}
                onChange={(e) => handleInputChange('color_primario', e?.target?.value)}
                placeholder="#3B82F6"
                className="flex-1"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Color Secundario
            </label>
            <div className="flex space-x-2">
              <input
                type="color"
                value={formData?.color_secundario}
                onChange={(e) => handleInputChange('color_secundario', e?.target?.value)}
                className="w-12 h-10 rounded border border-border cursor-pointer"
              />
              <Input
                value={formData?.color_secundario}
                onChange={(e) => handleInputChange('color_secundario', e?.target?.value)}
                placeholder="#10B981"
                className="flex-1"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Currency Configuration */}
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Icon name="DollarSign" size={20} className="text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Configuración de Moneda</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Moneda
            </label>
            <select
              value={formData?.moneda}
              onChange={(e) => {
                const selectedCurrency = currencyOptions?.find(c => c?.code === e?.target?.value);
                handleInputChange('moneda', selectedCurrency?.code);
                handleInputChange('simbolo_moneda', selectedCurrency?.symbol);
              }}
              className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              {currencyOptions?.map(currency => (
                <option key={currency?.code} value={currency?.code}>
                  {currency?.name}
                </option>
              ))}
            </select>
          </div>
          
          <Input
            label="Símbolo de Moneda"
            value={formData?.simbolo_moneda}
            onChange={(e) => handleInputChange('simbolo_moneda', e?.target?.value)}
            placeholder="$"
          />
        </div>
        
        <div className="mt-4 p-3 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            Vista previa: <span className="font-semibold text-foreground">
              {formData?.simbolo_moneda}1,234.56 {formData?.moneda}
            </span>
          </p>
        </div>
      </div>

      {/* Save Actions */}
      <div className="flex justify-end space-x-4">
        <Button
          variant="outline"
          onClick={handleReset}
          disabled={!hasChanges || saving}
        >
          Restablecer
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? (
            <>
              <Icon name="Loader2" size={16} className="animate-spin mr-2" />
              Guardando...
            </>
          ) : (
            <>
              <Icon name="Save" size={16} className="mr-2" />
              Guardar Configuración
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default BrandingCustomizationTab;