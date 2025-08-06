-- Location: supabase/migrations/20250804200805_app_branding_customization.sql
-- Schema Analysis: Extending existing attendance management system with branding customization
-- Integration Type: Extension - adding branding functionality to existing schema
-- Dependencies: system_settings, user_profiles

-- 1. Create storage bucket for branding assets (public access for logos/images)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'branding-assets',
    'branding-assets',
    true,  -- Public access for logos and branding images
    10485760, -- 10MB limit for branding assets
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/svg+xml', 'image/gif']
);

-- 2. Create branding settings table for client-specific customizations
CREATE TABLE public.branding_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_name TEXT NOT NULL DEFAULT 'AsistenciaPro',
    app_name TEXT NOT NULL DEFAULT 'AsistenciaPro',
    app_description TEXT DEFAULT 'Sistema de gestión de asistencia y nómina',
    primary_color TEXT DEFAULT '#3B82F6',
    secondary_color TEXT DEFAULT '#10B981',
    accent_color TEXT DEFAULT '#F59E0B',
    logo_url TEXT,
    logo_small_url TEXT,
    favicon_url TEXT,
    login_background_url TEXT,
    company_name TEXT DEFAULT 'Tu Empresa',
    company_address TEXT,
    company_phone TEXT,
    company_email TEXT,
    company_website TEXT,
    support_email TEXT DEFAULT 'soporte@asistenciapro.com',
    support_phone TEXT,
    footer_text TEXT DEFAULT 'Desarrollado por AsistenciaPro',
    copyright_text TEXT DEFAULT '© 2025 AsistenciaPro. Todos los derechos reservados.',
    privacy_policy_url TEXT,
    terms_of_service_url TEXT,
    custom_css TEXT,
    custom_js TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create branding assets table to track uploaded files
CREATE TABLE public.branding_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branding_settings_id UUID REFERENCES public.branding_settings(id) ON DELETE CASCADE,
    asset_type TEXT NOT NULL CHECK (asset_type IN ('logo', 'logo_small', 'favicon', 'login_background', 'custom_image')),
    asset_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    uploaded_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    uploaded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create indexes for branding tables
CREATE INDEX idx_branding_settings_active ON public.branding_settings(is_active);
CREATE INDEX idx_branding_settings_client ON public.branding_settings(client_name);
CREATE INDEX idx_branding_assets_settings ON public.branding_assets(branding_settings_id);
CREATE INDEX idx_branding_assets_type ON public.branding_assets(asset_type);

-- 5. Enable RLS for branding tables
ALTER TABLE public.branding_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branding_assets ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for branding_settings - SuperAdmin only access
CREATE POLICY "superadmin_full_access_branding_settings"
ON public.branding_settings
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM auth.users au
        WHERE au.id = auth.uid() 
        AND (au.raw_user_meta_data->>'role' = 'superadmin'
             OR au.raw_app_meta_data->>'role' = 'superadmin')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM auth.users au
        WHERE au.id = auth.uid() 
        AND (au.raw_user_meta_data->>'role' = 'superadmin'
             OR au.raw_app_meta_data->>'role' = 'superadmin')
    )
);

-- 7. RLS Policies for branding_assets - SuperAdmin only access  
CREATE POLICY "superadmin_full_access_branding_assets"
ON public.branding_assets
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM auth.users au
        WHERE au.id = auth.uid() 
        AND (au.raw_user_meta_data->>'role' = 'superadmin'
             OR au.raw_app_meta_data->>'role' = 'superadmin')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM auth.users au
        WHERE au.id = auth.uid() 
        AND (au.raw_user_meta_data->>'role' = 'superadmin'
             OR au.raw_app_meta_data->>'role' = 'superadmin')
    )
);

-- 8. RLS Policies for storage bucket - SuperAdmin can manage, public can view
CREATE POLICY "superadmin_manage_branding_assets"
ON storage.objects
FOR ALL
TO authenticated
USING (
    bucket_id = 'branding-assets'
    AND EXISTS (
        SELECT 1 FROM auth.users au
        WHERE au.id = auth.uid() 
        AND (au.raw_user_meta_data->>'role' = 'superadmin'
             OR au.raw_app_meta_data->>'role' = 'superadmin')
    )
)
WITH CHECK (
    bucket_id = 'branding-assets'
    AND EXISTS (
        SELECT 1 FROM auth.users au
        WHERE au.id = auth.uid() 
        AND (au.raw_user_meta_data->>'role' = 'superadmin'
             OR au.raw_app_meta_data->>'role' = 'superadmin')
    )
);

-- 9. Public can view branding assets (for logos, etc.)
CREATE POLICY "public_can_view_branding_assets"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'branding-assets');

-- 10. Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_branding_settings_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    NEW.updated_by = auth.uid();
    RETURN NEW;
END;
$$;

-- 11. Trigger for updating timestamps
CREATE TRIGGER on_branding_settings_update
  BEFORE UPDATE ON public.branding_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_branding_settings_updated_at();

-- 12. Function to get active branding settings
CREATE OR REPLACE FUNCTION public.get_active_branding_settings()
RETURNS TABLE(
    app_name TEXT,
    app_description TEXT,
    primary_color TEXT,
    secondary_color TEXT,
    accent_color TEXT,
    logo_url TEXT,
    company_name TEXT,
    footer_text TEXT,
    copyright_text TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
SELECT 
    bs.app_name,
    bs.app_description,
    bs.primary_color,
    bs.secondary_color,
    bs.accent_color,
    bs.logo_url,
    bs.company_name,
    bs.footer_text,
    bs.copyright_text
FROM public.branding_settings bs
WHERE bs.is_active = true
ORDER BY bs.updated_at DESC
LIMIT 1;
$$;

-- 13. Add branding-related system settings
INSERT INTO public.system_settings (setting_key, setting_value, description) VALUES
    ('branding_enabled', 'true', 'Habilitar sistema de personalización de marca'),
    ('allow_custom_css', 'true', 'Permitir CSS personalizado'),
    ('allow_custom_js', 'false', 'Permitir JavaScript personalizado'),
    ('max_logo_size_mb', '5', 'Tamaño máximo de logo en MB'),
    ('supported_image_formats', 'jpg,jpeg,png,webp,svg', 'Formatos de imagen soportados')
ON CONFLICT (setting_key) DO UPDATE SET 
    setting_value = EXCLUDED.setting_value,
    updated_at = CURRENT_TIMESTAMP;

-- 14. Create default branding settings
DO $$
DECLARE
    superadmin_id UUID;
BEGIN
    -- Get first superadmin user
    SELECT up.id INTO superadmin_id 
    FROM public.user_profiles up 
    WHERE up.role = 'superadmin' 
    LIMIT 1;

    -- Insert default branding settings
    INSERT INTO public.branding_settings (
        client_name,
        app_name,
        app_description,
        company_name,
        created_by,
        updated_by
    ) VALUES (
        'Cliente Demo',
        'AsistenciaPro',
        'Sistema de gestión de asistencia y nómina',
        'Mi Empresa Constructora',
        superadmin_id,
        superadmin_id
    );

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not create default branding settings: %', SQLERRM;
END $$;