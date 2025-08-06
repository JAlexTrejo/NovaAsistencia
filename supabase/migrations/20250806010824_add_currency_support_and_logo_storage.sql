-- Location: supabase/migrations/20250806010824_add_currency_support_and_logo_storage.sql
-- Schema Analysis: configuracion_aplicacion table exists with logo_url, nombre_empresa, color_primario, color_secundario
-- Integration Type: extension - adding currency support and storage for logo uploads
-- Dependencies: configuracion_aplicacion, user_profiles

-- Add currency configuration to existing configuracion_aplicacion table
ALTER TABLE public.configuracion_aplicacion
ADD COLUMN IF NOT EXISTS moneda TEXT DEFAULT 'MXN',
ADD COLUMN IF NOT EXISTS simbolo_moneda TEXT DEFAULT '$';

-- Create storage bucket for branding assets (logos)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'branding-assets',
    'branding-assets',
    true,
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- RLS Policy: Anyone can view branding assets (public bucket)
CREATE POLICY "public_can_view_branding_assets"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'branding-assets');

-- RLS Policy: Only authenticated superadmins can upload/manage branding assets
CREATE POLICY "superadmins_manage_branding_assets"
ON storage.objects
FOR ALL
TO authenticated
USING (
    bucket_id = 'branding-assets'
    AND EXISTS (
        SELECT 1 FROM public.user_profiles up
        WHERE up.id = auth.uid() 
        AND up.is_super_admin = true
    )
)
WITH CHECK (
    bucket_id = 'branding-assets'
    AND EXISTS (
        SELECT 1 FROM public.user_profiles up
        WHERE up.id = auth.uid() 
        AND up.is_super_admin = true
    )
);

-- Create or update default configuration with Mexican currency
DO $$
DECLARE
    config_exists BOOLEAN;
    super_admin_id UUID;
BEGIN
    -- Check if configuration exists
    SELECT EXISTS(SELECT 1 FROM public.configuracion_aplicacion) INTO config_exists;
    
    -- Get first superadmin user ID
    SELECT id INTO super_admin_id FROM public.user_profiles WHERE is_super_admin = true LIMIT 1;
    
    -- Insert default configuration if none exists
    IF NOT config_exists THEN
        INSERT INTO public.configuracion_aplicacion (
            nombre_empresa,
            color_primario,
            color_secundario,
            moneda,
            simbolo_moneda,
            mensaje_bienvenida,
            actualizado_por
        ) VALUES (
            'AsistenciaPro',
            '#3B82F6',
            '#10B981',
            'MXN',
            '$',
            'Sistema de gestión de asistencia y recursos humanos',
            super_admin_id
        );
    ELSE
        -- Update existing configuration to use Mexican currency
        UPDATE public.configuracion_aplicacion
        SET 
            moneda = 'MXN',
            simbolo_moneda = '$',
            updated_at = CURRENT_TIMESTAMP,
            actualizado_por = COALESCE(actualizado_por, super_admin_id)
        WHERE moneda IS NULL OR moneda != 'MXN';
    END IF;
END $$;