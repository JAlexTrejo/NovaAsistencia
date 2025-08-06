-- AsistenciaPro Production-Ready Database Schema
-- This migration creates a comprehensive role-based access control system with activity logging

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- 1. CREATE CUSTOM TYPES
-- =============================================

-- Role hierarchy enum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE public.user_role AS ENUM ('user', 'supervisor', 'admin', 'superadmin');
    END IF;
END $$;

-- Activity log action types
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'log_action_type') THEN
        CREATE TYPE public.log_action_type AS ENUM (
            'login', 'logout', 'registration', 'profile_update', 'password_change',
            'role_update', 'bulk_role_update', 'profile_creation', 'otp_verification',
            'check_in', 'check_out', 'config_update', 'screen_access', 
            'role_management_access', 'system_access'
        );
    END IF;
END $$;

-- =============================================
-- 2. UPDATE EXISTING USUARIOS TABLE
-- =============================================

-- First, let's safely update the existing usuarios table to match our new schema
-- Add new columns if they don't exist
DO $$
BEGIN
    -- Add rol_id column for foreign key relationship
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'usuarios' AND column_name = 'rol_id') THEN
        ALTER TABLE public.usuarios ADD COLUMN rol_id INTEGER;
    END IF;
    
    -- Convert existing 'rol' text column to use our enum if needed
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'usuarios' AND column_name = 'rol' AND data_type = 'text') THEN
        -- First, update any invalid roles to 'user'
        UPDATE public.usuarios SET rol = 'user' WHERE rol NOT IN ('user', 'supervisor', 'admin', 'superadmin') OR rol IS NULL;
        
        -- Now safely convert to enum
        ALTER TABLE public.usuarios ALTER COLUMN rol TYPE public.user_role USING rol::public.user_role;
        ALTER TABLE public.usuarios ALTER COLUMN rol SET DEFAULT 'user'::public.user_role;
    END IF;
    
    -- Ensure rol column has a default if it doesn't already
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'usuarios' AND column_name = 'rol' AND column_default IS NOT NULL) THEN
        ALTER TABLE public.usuarios ALTER COLUMN rol SET DEFAULT 'user'::public.user_role;
    END IF;
    
    -- Add is_active column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'usuarios' AND column_name = 'is_active') THEN
        ALTER TABLE public.usuarios ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
    
    -- Add last_login column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'usuarios' AND column_name = 'last_login') THEN
        ALTER TABLE public.usuarios ADD COLUMN last_login TIMESTAMPTZ;
    END IF;
    
    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'usuarios' AND column_name = 'updated_at') THEN
        ALTER TABLE public.usuarios ADD COLUMN updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- =============================================
-- 3. CREATE ROLES REFERENCE TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.roles (
    id SERIAL PRIMARY KEY,
    nombre public.user_role NOT NULL UNIQUE,
    descripcion TEXT NOT NULL,
    nivel INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Insert role hierarchy data
INSERT INTO public.roles (id, nombre, descripcion, nivel) VALUES
    (1, 'user', 'Can view profile, history, and notifications', 1),
    (2, 'supervisor', 'Can view and register attendance for their team', 2),
    (3, 'admin', 'Access to payroll, reports, and incident management', 3),
    (4, 'superadmin', 'Full system access including visual configuration', 4)
ON CONFLICT (nombre) DO UPDATE SET
    descripcion = EXCLUDED.descripcion,
    nivel = EXCLUDED.nivel;

-- Update existing usuarios to link with roles table
UPDATE public.usuarios SET rol_id = (
    SELECT id FROM public.roles WHERE nombre = usuarios.rol
);

-- =============================================
-- 4. CREATE ACTIVITY LOGGING SYSTEM
-- =============================================

CREATE TABLE IF NOT EXISTS public.logs_actividad (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
    rol TEXT NOT NULL,
    accion public.log_action_type NOT NULL,
    modulo TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    ip_address INET,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    fecha TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_logs_actividad_usuario_id ON public.logs_actividad(usuario_id);
CREATE INDEX IF NOT EXISTS idx_logs_actividad_fecha ON public.logs_actividad(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_logs_actividad_accion ON public.logs_actividad(accion);
CREATE INDEX IF NOT EXISTS idx_logs_actividad_modulo ON public.logs_actividad(modulo);

-- =============================================
-- 5. CREATE VISUAL CONFIGURATION SYSTEM
-- =============================================

CREATE TABLE IF NOT EXISTS public.configuracion_aplicacion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    color_primario TEXT DEFAULT '#3B82F6',
    color_secundario TEXT DEFAULT '#10B981',
    color_acento TEXT DEFAULT '#F59E0B',
    logo_url TEXT,
    nombre_empresa TEXT DEFAULT 'AsistenciaPro',
    mensaje_bienvenida TEXT DEFAULT 'Bienvenido a AsistenciaPro - Sistema de Control de Asistencia',
    favicon_url TEXT,
    tema_oscuro BOOLEAN DEFAULT false,
    idioma TEXT DEFAULT 'es',
    timezone TEXT DEFAULT 'America/Mexico_City',
    formato_fecha TEXT DEFAULT 'DD/MM/YYYY',
    formato_hora TEXT DEFAULT '24h',
    actualizado_por UUID REFERENCES public.usuarios(id),
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Insert default configuration
INSERT INTO public.configuracion_aplicacion (id, nombre_empresa, mensaje_bienvenida) VALUES
    (gen_random_uuid(), 'AsistenciaPro', 'Bienvenido a AsistenciaPro - Sistema de Control de Asistencia Profesional')
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 6. CREATE ADDITIONAL SUPPORTING TABLES
-- =============================================

-- Construction sites/obras table (if not exists)
CREATE TABLE IF NOT EXISTS public.obras (
    id SERIAL PRIMARY KEY,
    nombre TEXT NOT NULL,
    direccion TEXT,
    descripcion TEXT,
    activa BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Attendance records table (if not exists)
CREATE TABLE IF NOT EXISTS public.asistencias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE,
    obra_id INTEGER REFERENCES public.obras(id),
    fecha_entrada TIMESTAMPTZ,
    fecha_salida TIMESTAMPTZ,
    horas_trabajadas DECIMAL(5,2),
    ubicacion_entrada POINT,
    ubicacion_salida POINT,
    notas TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Incidents table (if not exists)
CREATE TABLE IF NOT EXISTS public.incidencias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES public.usuarios(id),
    obra_id INTEGER REFERENCES public.obras(id),
    tipo TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    gravedad TEXT DEFAULT 'baja',
    estado TEXT DEFAULT 'pendiente',
    fecha_incidencia TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    resuelto_por UUID REFERENCES public.usuarios(id),
    fecha_resolucion TIMESTAMPTZ,
    notas_resolucion TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_usuarios_rol ON public.usuarios(rol);
CREATE INDEX IF NOT EXISTS idx_usuarios_is_active ON public.usuarios(is_active);
CREATE INDEX IF NOT EXISTS idx_usuarios_obra_id ON public.usuarios(obra_id);
CREATE INDEX IF NOT EXISTS idx_asistencias_usuario_id ON public.asistencias(usuario_id);
CREATE INDEX IF NOT EXISTS idx_asistencias_fecha_entrada ON public.asistencias(fecha_entrada);
CREATE INDEX IF NOT EXISTS idx_incidencias_usuario_id ON public.incidencias(usuario_id);
CREATE INDEX IF NOT EXISTS idx_incidencias_estado ON public.incidencias(estado);

-- =============================================
-- 7. ENABLE ROW LEVEL SECURITY
-- =============================================

ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs_actividad ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracion_aplicacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.obras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asistencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidencias ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 8. CREATE HELPER FUNCTIONS FOR RLS
-- =============================================

-- Function to check if user is admin/superadmin using auth metadata
CREATE OR REPLACE FUNCTION public.is_admin_from_auth()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
SELECT EXISTS (
    SELECT 1 FROM auth.users au
    WHERE au.id = auth.uid() 
    AND (au.raw_user_meta_data->>'role' IN ('admin', 'superadmin')
         OR au.raw_app_meta_data->>'role' IN ('admin', 'superadmin'))
)
$$;

-- Function to check if user is superadmin using auth metadata
CREATE OR REPLACE FUNCTION public.is_superadmin_from_auth()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
SELECT EXISTS (
    SELECT 1 FROM auth.users au
    WHERE au.id = auth.uid() 
    AND (au.raw_user_meta_data->>'role' = 'superadmin'
         OR au.raw_app_meta_data->>'role' = 'superadmin')
)
$$;

-- Function to check user role level (for tables other than usuarios)
CREATE OR REPLACE FUNCTION public.user_has_role_level(required_level INTEGER)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
SELECT EXISTS (
    SELECT 1 FROM public.usuarios u
    JOIN public.roles r ON u.rol = r.nombre
    WHERE u.id = auth.uid() 
    AND r.nivel >= required_level
    AND u.is_active = true
)
$$;

-- =============================================
-- 9. CREATE RLS POLICIES
-- =============================================

-- Policies for usuarios table (Pattern 1: Core User Table)
DROP POLICY IF EXISTS "users_manage_own_usuarios" ON public.usuarios;
CREATE POLICY "users_manage_own_usuarios"
ON public.usuarios
FOR ALL
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Admin users can view all users
DROP POLICY IF EXISTS "admins_view_all_usuarios" ON public.usuarios;
CREATE POLICY "admins_view_all_usuarios"
ON public.usuarios
FOR SELECT
TO authenticated
USING (public.is_admin_from_auth());

-- Policies for roles table (Public read, admin write)
DROP POLICY IF EXISTS "public_can_read_roles" ON public.roles;
CREATE POLICY "public_can_read_roles"
ON public.roles
FOR SELECT
TO public
USING (true);

DROP POLICY IF EXISTS "admins_manage_roles" ON public.roles;
CREATE POLICY "admins_manage_roles"
ON public.roles
FOR ALL
TO authenticated
USING (public.is_admin_from_auth())
WITH CHECK (public.is_admin_from_auth());

-- Policies for logs_actividad (Users see own logs, admins see all)
DROP POLICY IF EXISTS "users_view_own_logs" ON public.logs_actividad;
CREATE POLICY "users_view_own_logs"
ON public.logs_actividad
FOR SELECT
TO authenticated
USING (usuario_id = auth.uid());

DROP POLICY IF EXISTS "admins_view_all_logs" ON public.logs_actividad;
CREATE POLICY "admins_view_all_logs"
ON public.logs_actividad
FOR SELECT
TO authenticated
USING (public.is_admin_from_auth());

DROP POLICY IF EXISTS "users_create_own_logs" ON public.logs_actividad;
CREATE POLICY "users_create_own_logs"
ON public.logs_actividad
FOR INSERT
TO authenticated
WITH CHECK (usuario_id = auth.uid());

-- Policies for configuracion_aplicacion (SuperAdmin only)
DROP POLICY IF EXISTS "superadmin_manage_config" ON public.configuracion_aplicacion;
CREATE POLICY "superadmin_manage_config"
ON public.configuracion_aplicacion
FOR ALL
TO authenticated
USING (public.is_superadmin_from_auth())
WITH CHECK (public.is_superadmin_from_auth());

-- Public can read basic configuration
DROP POLICY IF EXISTS "public_read_config" ON public.configuracion_aplicacion;
CREATE POLICY "public_read_config"
ON public.configuracion_aplicacion
FOR SELECT
TO public
USING (true);

-- Policies for obras (Supervisors and above can manage)
DROP POLICY IF EXISTS "supervisors_manage_obras" ON public.obras;
CREATE POLICY "supervisors_manage_obras"
ON public.obras
FOR ALL
TO authenticated
USING (public.user_has_role_level(2))
WITH CHECK (public.user_has_role_level(2));

-- Policies for asistencias (Users manage own, supervisors manage team)
DROP POLICY IF EXISTS "users_manage_own_asistencias" ON public.asistencias;
CREATE POLICY "users_manage_own_asistencias"
ON public.asistencias
FOR ALL
TO authenticated
USING (usuario_id = auth.uid())
WITH CHECK (usuario_id = auth.uid());

DROP POLICY IF EXISTS "supervisors_view_all_asistencias" ON public.asistencias;
CREATE POLICY "supervisors_view_all_asistencias"
ON public.asistencias
FOR SELECT
TO authenticated
USING (public.user_has_role_level(2));

-- Policies for incidencias (Users create, supervisors manage)
DROP POLICY IF EXISTS "users_manage_own_incidencias" ON public.incidencias;
CREATE POLICY "users_manage_own_incidencias"
ON public.incidencias
FOR ALL
TO authenticated
USING (usuario_id = auth.uid())
WITH CHECK (usuario_id = auth.uid());

DROP POLICY IF EXISTS "supervisors_manage_incidencias" ON public.incidencias;
CREATE POLICY "supervisors_manage_incidencias"
ON public.incidencias
FOR ALL
TO authenticated
USING (public.user_has_role_level(2))
WITH CHECK (public.user_has_role_level(2));

-- =============================================
-- 10. CREATE TRIGGER FUNCTIONS
-- =============================================

-- Function to handle new user creation from auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO public.usuarios (id, correo, nombre, rol, rol_id, telefono, is_active)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'user'::public.user_role),
        CASE 
            WHEN NEW.raw_user_meta_data->>'role' = 'superadmin' THEN 4
            WHEN NEW.raw_user_meta_data->>'role' = 'admin' THEN 3
            WHEN NEW.raw_user_meta_data->>'role' = 'supervisor' THEN 2
            ELSE 1
        END,
        NEW.raw_user_meta_data->>'phone',
        true
    );
    RETURN NEW;
EXCEPTION
    WHEN unique_violation THEN
        -- User already exists, update instead
        UPDATE public.usuarios SET
            correo = NEW.email,
            nombre = COALESCE(NEW.raw_user_meta_data->>'full_name', nombre),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.id;
        RETURN NEW;
    WHEN OTHERS THEN
        -- Log error but don't fail the auth operation
        RAISE NOTICE 'Error creating user profile: %', SQLERRM;
        RETURN NEW;
END;
$$;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

-- =============================================
-- 11. CREATE TRIGGERS
-- =============================================

-- Trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Triggers for updated_at columns
DROP TRIGGER IF EXISTS update_usuarios_updated_at ON public.usuarios;
CREATE TRIGGER update_usuarios_updated_at
    BEFORE UPDATE ON public.usuarios
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_configuracion_updated_at ON public.configuracion_aplicacion;
CREATE TRIGGER update_configuracion_updated_at
    BEFORE UPDATE ON public.configuracion_aplicacion
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_obras_updated_at ON public.obras;
CREATE TRIGGER update_obras_updated_at
    BEFORE UPDATE ON public.obras
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- 12. INSERT SAMPLE DATA FOR TESTING
-- =============================================

DO $$
DECLARE
    admin_uuid UUID := gen_random_uuid();
    supervisor_uuid UUID := gen_random_uuid();
    user_uuid UUID := gen_random_uuid();
    obra1_id INTEGER;
    obra2_id INTEGER;
BEGIN
    -- Create sample construction sites
    INSERT INTO public.obras (nombre, direccion, descripcion) VALUES
        ('Obra Central', 'Av. Principal 123, Ciudad', 'Construcción de edificio principal'),
        ('Obra Norte', 'Calle Norte 456, Ciudad', 'Remodelación de oficinas')
    RETURNING id INTO obra1_id;
    
    SELECT id INTO obra2_id FROM public.obras WHERE nombre = 'Obra Norte';

    -- Create complete auth users with proper metadata
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        created_at, updated_at, raw_user_meta_data, raw_app_meta_data,
        is_sso_user, is_anonymous, confirmation_token, confirmation_sent_at,
        recovery_token, recovery_sent_at, email_change_token_new, email_change,
        email_change_sent_at, email_change_token_current, email_change_confirm_status,
        reauthentication_token, reauthentication_sent_at, phone, phone_change,
        phone_change_token, phone_change_sent_at
    ) VALUES
        (admin_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         'admin@asistenciapro.com', crypt('admin123', gen_salt('bf', 10)), now(), now(), now(),
         '{"full_name": "Administrator", "role": "superadmin"}'::jsonb, 
         '{"provider": "email", "providers": ["email"]}'::jsonb,
         false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null),
        (supervisor_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         'supervisor@asistenciapro.com', crypt('super123', gen_salt('bf', 10)), now(), now(), now(),
         '{"full_name": "Site Supervisor", "role": "supervisor"}'::jsonb,
         '{"provider": "email", "providers": ["email"]}'::jsonb,
         false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null),
        (user_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         'empleado@asistenciapro.com', crypt('user123', gen_salt('bf', 10)), now(), now(), now(),
         '{"full_name": "Empleado Regular", "role": "user"}'::jsonb,
         '{"provider": "email", "providers": ["email"]}'::jsonb,
         false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null)
    ON CONFLICT (id) DO NOTHING;

    -- The trigger will automatically create the corresponding records in usuarios table
    
    -- Update obra assignments
    UPDATE public.usuarios SET obra_id = obra1_id WHERE correo = 'admin@asistenciapro.com';
    UPDATE public.usuarios SET obra_id = obra1_id WHERE correo = 'supervisor@asistenciapro.com';
    UPDATE public.usuarios SET obra_id = obra2_id WHERE correo = 'empleado@asistenciapro.com';

    -- Create sample attendance records
    INSERT INTO public.asistencias (usuario_id, obra_id, fecha_entrada, fecha_salida, horas_trabajadas)
    VALUES
        (admin_uuid, obra1_id, CURRENT_TIMESTAMP - INTERVAL '8 hours', CURRENT_TIMESTAMP, 8.0),
        (supervisor_uuid, obra1_id, CURRENT_TIMESTAMP - INTERVAL '9 hours', CURRENT_TIMESTAMP - INTERVAL '1 hour', 8.0),
        (user_uuid, obra2_id, CURRENT_TIMESTAMP - INTERVAL '8.5 hours', CURRENT_TIMESTAMP - INTERVAL '30 minutes', 8.0);

    -- Create sample activity logs
    INSERT INTO public.logs_actividad (usuario_id, rol, accion, modulo, descripcion) VALUES
        (admin_uuid, 'superadmin', 'login', 'Authentication', 'Administrator logged in'),
        (supervisor_uuid, 'supervisor', 'login', 'Authentication', 'Supervisor logged in'),
        (user_uuid, 'user', 'check_in', 'Attendance', 'Employee checked in'),
        (admin_uuid, 'superadmin', 'system_access', 'System Configuration', 'Accessed system administration panel');

EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'Foreign key error in sample data: %', SQLERRM;
    WHEN unique_violation THEN
        RAISE NOTICE 'Unique constraint error in sample data: %', SQLERRM;
    WHEN OTHERS THEN
        RAISE NOTICE 'Unexpected error in sample data: %', SQLERRM;
END $$;

-- =============================================
-- 13. CREATE UTILITY FUNCTIONS
-- =============================================

-- Function to get user role level
CREATE OR REPLACE FUNCTION public.get_user_role_level(user_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
SELECT COALESCE(r.nivel, 0)
FROM public.usuarios u
LEFT JOIN public.roles r ON u.rol = r.nombre
WHERE u.id = user_id AND u.is_active = true;
$$;

-- Function to log activity (can be called from application)
CREATE OR REPLACE FUNCTION public.log_user_activity(
    p_usuario_id UUID,
    p_accion public.log_action_type,
    p_modulo TEXT,
    p_descripcion TEXT,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    log_id UUID;
    user_role TEXT;
BEGIN
    -- Get user role
    SELECT rol INTO user_role FROM public.usuarios WHERE id = p_usuario_id;
    
    -- Insert log entry
    INSERT INTO public.logs_actividad (usuario_id, rol, accion, modulo, descripcion, metadata)
    VALUES (p_usuario_id, COALESCE(user_role, 'unknown'), p_accion, p_modulo, p_descripcion, p_metadata)
    RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$;

-- Function to get system statistics (for dashboard)
CREATE OR REPLACE FUNCTION public.get_system_stats()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    stats JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total_users', (SELECT COUNT(*) FROM public.usuarios WHERE is_active = true),
        'total_admins', (SELECT COUNT(*) FROM public.usuarios WHERE rol IN ('admin', 'superadmin') AND is_active = true),
        'total_supervisors', (SELECT COUNT(*) FROM public.usuarios WHERE rol = 'supervisor' AND is_active = true),
        'total_regular_users', (SELECT COUNT(*) FROM public.usuarios WHERE rol = 'user' AND is_active = true),
        'unassigned_users', (SELECT COUNT(*) FROM public.usuarios WHERE rol IS NULL AND is_active = true),
        'total_construction_sites', (SELECT COUNT(*) FROM public.obras WHERE activa = true),
        'total_logs_today', (SELECT COUNT(*) FROM public.logs_actividad WHERE DATE(fecha) = CURRENT_DATE),
        'last_activity', (SELECT MAX(fecha) FROM public.logs_actividad)
    ) INTO stats;
    
    RETURN stats;
END;
$$;

-- Function to clean old logs (maintenance)
CREATE OR REPLACE FUNCTION public.cleanup_old_logs(days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.logs_actividad 
    WHERE fecha < CURRENT_TIMESTAMP - (days_to_keep || ' days')::INTERVAL;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Log the cleanup operation
    INSERT INTO public.logs_actividad (usuario_id, rol, accion, modulo, descripcion)
    VALUES (auth.uid(), 'system', 'system_maintenance', 'Database Maintenance', 
            format('Cleaned up %s old log entries older than %s days', deleted_count, days_to_keep));
    
    RETURN deleted_count;
END;
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated, anon;

-- Final success message
DO $$
BEGIN
    RAISE NOTICE 'AsistenciaPro production-ready schema created successfully!';
    RAISE NOTICE 'Test credentials:';
    RAISE NOTICE '  SuperAdmin: admin@asistenciapro.com / admin123';
    RAISE NOTICE '  Supervisor: supervisor@asistenciapro.com / super123';  
    RAISE NOTICE '  User: empleado@asistenciapro.com / user123';
    RAISE NOTICE 'All tables, RLS policies, and sample data have been created.';
END $$;