-- Location: supabase/migrations/20250806012725_fix_branding_configuration_errors.sql
-- Schema Analysis: configuracion_aplicacion table exists but missing currency columns
-- Integration Type: PARTIAL_EXISTS - extending existing table + adding storage
-- Dependencies: configuracion_aplicacion table

-- Step 1: Add missing currency columns to configuracion_aplicacion table
ALTER TABLE public.configuracion_aplicacion
ADD COLUMN moneda TEXT DEFAULT 'MXN'::TEXT;

ALTER TABLE public.configuracion_aplicacion  
ADD COLUMN simbolo_moneda TEXT DEFAULT '$'::TEXT;

-- Step 2: Create storage bucket for branding assets (logos)
-- Public bucket since company logos are typically displayed publicly
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'branding-assets',
    'branding-assets', 
    true,
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/svg+xml']
);

-- Step 3: Set up RLS policies for branding-assets storage bucket
-- Pattern 2: Public Storage (Read-Only for All) - anyone can view, only authenticated can upload

-- Anyone can view branding assets (including anonymous users)
CREATE POLICY "public_can_view_branding_assets"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'branding-assets');

-- Only authenticated users (admins) can upload branding assets
CREATE POLICY "authenticated_users_upload_branding_assets"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'branding-assets');

-- Only file owner (uploader) can update/delete branding assets
CREATE POLICY "owners_manage_branding_assets"
ON storage.objects
FOR UPDATE, DELETE
TO authenticated
USING (bucket_id = 'branding-assets' AND owner = auth.uid());

-- Step 4: Update existing records with default currency values (if any exist)
-- This ensures existing configurations have proper currency settings
UPDATE public.configuracion_aplicacion 
SET 
    moneda = 'MXN',
    simbolo_moneda = '$'
WHERE moneda IS NULL OR simbolo_moneda IS NULL;

-- Add indexes for better performance on new columns
CREATE INDEX idx_configuracion_aplicacion_moneda ON public.configuracion_aplicacion(moneda);