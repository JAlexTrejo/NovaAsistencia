-- Location: supabase/migrations/20250804195400_gps_geofencing_enhancements.sql
-- Schema Analysis: Extending existing attendance system with GPS geofencing
-- Integration Type: Enhancement - adding GPS functionality to existing schema
-- Dependencies: construction_sites, attendance_records, incidents, user_profiles

-- 1. Add GPS coordinates and geofencing to construction sites
ALTER TABLE public.construction_sites
ADD COLUMN latitude DECIMAL(10,8),
ADD COLUMN longitude DECIMAL(11,8),
ADD COLUMN allowed_radius_meters INTEGER DEFAULT 15,
ADD COLUMN gps_enabled BOOLEAN DEFAULT true;

-- 2. Enhance attendance records with supervisor tracking and location validation
ALTER TABLE public.attendance_records
ADD COLUMN checkin_realizado_por UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
ADD COLUMN supervisor_latitude DECIMAL(10,8),
ADD COLUMN supervisor_longitude DECIMAL(11,8),
ADD COLUMN dentro_del_rango BOOLEAN DEFAULT false,
ADD COLUMN distancia_metros DECIMAL(10,2);

-- 3. Create storage bucket for incident attachments (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'incident-attachments',
    'incident-attachments', 
    false,
    52428800, -- 50MB limit for medical documents/photos
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'application/pdf', 'image/heic']
);

-- 4. Add multiple file support to incidents table
ALTER TABLE public.incidents
ADD COLUMN attachment_urls TEXT[],
ADD COLUMN attachment_count INTEGER DEFAULT 0;

-- Remove old single file column
ALTER TABLE public.incidents DROP COLUMN IF EXISTS justification_file_url;

-- 5. Create helper function to calculate distance between two GPS points
CREATE OR REPLACE FUNCTION public.calculate_gps_distance(
    lat1 DECIMAL(10,8),
    lon1 DECIMAL(11,8), 
    lat2 DECIMAL(10,8),
    lon2 DECIMAL(11,8)
)
RETURNS DECIMAL(10,2)
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    earth_radius DECIMAL := 6371000; -- Earth radius in meters
    dlat DECIMAL;
    dlon DECIMAL;
    a DECIMAL;
    c DECIMAL;
    distance DECIMAL;
BEGIN
    -- Handle null values
    IF lat1 IS NULL OR lon1 IS NULL OR lat2 IS NULL OR lon2 IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Convert degrees to radians
    dlat := radians(lat2 - lat1);
    dlon := radians(lon2 - lon1);
    
    -- Haversine formula
    a := sin(dlat/2) * sin(dlat/2) + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon/2) * sin(dlon/2);
    c := 2 * atan2(sqrt(a), sqrt(1-a));
    distance := earth_radius * c;
    
    RETURN ROUND(distance, 2);
END;
$$;

-- 6. Create function to validate if location is within site radius
CREATE OR REPLACE FUNCTION public.validate_location_within_site(
    employee_lat DECIMAL(10,8),
    employee_lon DECIMAL(11,8),
    site_uuid UUID
)
RETURNS TABLE(
    dentro_del_rango BOOLEAN,
    distancia_metros DECIMAL(10,2),
    radio_permitido INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    site_lat DECIMAL(10,8);
    site_lon DECIMAL(11,8);
    allowed_radius INTEGER;
    calculated_distance DECIMAL(10,2);
BEGIN
    -- Get site coordinates and radius
    SELECT cs.latitude, cs.longitude, cs.allowed_radius_meters
    INTO site_lat, site_lon, allowed_radius
    FROM public.construction_sites cs
    WHERE cs.id = site_uuid AND cs.gps_enabled = true;
    
    -- If site not found or GPS not enabled
    IF site_lat IS NULL OR site_lon IS NULL THEN
        RETURN QUERY SELECT false, NULL::DECIMAL(10,2), NULL::INTEGER;
        RETURN;
    END IF;
    
    -- Calculate distance
    calculated_distance := public.calculate_gps_distance(employee_lat, employee_lon, site_lat, site_lon);
    
    -- Return validation result
    RETURN QUERY SELECT 
        (calculated_distance <= allowed_radius),
        calculated_distance,
        allowed_radius;
END;
$$;

-- 7. Update attendance calculation trigger to include GPS validation
CREATE OR REPLACE FUNCTION public.update_attendance_hours_with_gps()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    calculated_hours DECIMAL(4,2);
    employee_lat DECIMAL(10,8);
    employee_lon DECIMAL(11,8);
    validation_result RECORD;
BEGIN
    calculated_hours := public.calculate_attendance_hours(
        NEW.entrada,
        NEW.inicio_comida, 
        NEW.fin_comida,
        NEW.salida
    );
    
    NEW.total_hours := calculated_hours;
    NEW.is_complete := (NEW.entrada IS NOT NULL AND NEW.salida IS NOT NULL);
    NEW.updated_at := CURRENT_TIMESTAMP;
    
    -- Parse GPS coordinates from location strings for validation
    IF NEW.location_entrada IS NOT NULL AND NEW.location_entrada LIKE '%,%' THEN
        employee_lat := split_part(NEW.location_entrada, ',', 1)::DECIMAL(10,8);
        employee_lon := split_part(NEW.location_entrada, ',', 2)::DECIMAL(11,8);
        
        -- Validate location against site
        SELECT * INTO validation_result 
        FROM public.validate_location_within_site(employee_lat, employee_lon, NEW.site_id);
        
        NEW.dentro_del_rango := validation_result.dentro_del_rango;
        NEW.distancia_metros := validation_result.distancia_metros;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Replace the existing trigger
DROP TRIGGER IF EXISTS on_attendance_record_change ON public.attendance_records;
CREATE TRIGGER on_attendance_record_change
  BEFORE INSERT OR UPDATE ON public.attendance_records
  FOR EACH ROW EXECUTE FUNCTION public.update_attendance_hours_with_gps();

-- 8. Create indexes for GPS queries
CREATE INDEX idx_construction_sites_gps ON public.construction_sites(latitude, longitude) WHERE gps_enabled = true;
CREATE INDEX idx_attendance_records_location_validation ON public.attendance_records(dentro_del_rango, distancia_metros);
CREATE INDEX idx_attendance_records_supervisor ON public.attendance_records(checkin_realizado_por);

-- 9. RLS Policies for storage bucket
CREATE POLICY "users_view_own_incident_attachments"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'incident-attachments' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "users_upload_incident_attachments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'incident-attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "supervisors_view_team_incident_attachments"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'incident-attachments'
    AND (
        -- Own files
        (storage.foldername(name))[1] = auth.uid()::text
        OR
        -- Admin access
        EXISTS (
            SELECT 1 FROM auth.users au
            WHERE au.id = auth.uid() 
            AND (au.raw_user_meta_data->>'role' IN ('administrador', 'superadmin'))
        )
    )
);

-- 10. Update construction sites with sample GPS coordinates
UPDATE public.construction_sites 
SET 
    latitude = 10.4806, 
    longitude = -66.9036,
    allowed_radius_meters = 25,
    gps_enabled = true
WHERE name = 'Torre Ejecutiva Norte';

UPDATE public.construction_sites 
SET 
    latitude = 10.4696, 
    longitude = -66.8356,
    allowed_radius_meters = 30,
    gps_enabled = true  
WHERE name = 'Residencial Las Flores';

-- 11. Add system settings for GPS configuration
INSERT INTO public.system_settings (setting_key, setting_value, description) VALUES
    ('gps_validation_enabled', 'true', 'Habilitar validación GPS para registros de asistencia'),
    ('default_site_radius_meters', '15', 'Radio por defecto para validación GPS en metros'),
    ('max_allowed_distance_meters', '50', 'Máxima distancia permitida para registros de emergencia'),
    ('gps_accuracy_required_meters', '20', 'Precisión GPS mínima requerida en metros')
ON CONFLICT (setting_key) DO UPDATE SET 
    setting_value = EXCLUDED.setting_value,
    updated_at = CURRENT_TIMESTAMP;