-- Location: supabase/migrations/20250805000620_asistenciapro_production_ready.sql
-- AsistenciaPro Production-Ready Schema with Role-Based Access Control
-- Integration Type: Complete production schema enhancement

-- 1. Create role enum for consistent role management
CREATE TYPE public.user_role AS ENUM ('user', 'supervisor', 'admin', 'superadmin');

-- 2. Create roles table for role management
CREATE TABLE public.roles (
    id SERIAL PRIMARY KEY,
    nombre TEXT NOT NULL UNIQUE,
    descripcion TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Insert default roles
INSERT INTO public.roles (id, nombre, descripcion) VALUES
    (1, 'user', 'Puede ver su perfil, historial, notificaciones'),
    (2, 'supervisor', 'Puede ver y registrar asistencia de su equipo'),
    (3, 'admin', 'Accede a nómina, reportes, incidencias'),
    (4, 'superadmin', 'Tiene acceso total, incluyendo configuración visual');

-- 3. Update usuarios table to include rol_id foreign key
ALTER TABLE public.usuarios 
ADD COLUMN IF NOT EXISTS rol_id INTEGER REFERENCES public.roles(id) DEFAULT 1,
ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS ultimo_acceso TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS foto_perfil_url TEXT;

-- Migrate existing 'rol' data to 'rol_id'
UPDATE public.usuarios SET 
    rol_id = CASE 
        WHEN rol = 'user' THEN 1
        WHEN rol = 'supervisor' THEN 2  
        WHEN rol = 'admin' THEN 3
        WHEN rol = 'superadmin' THEN 4
        ELSE 1
    END
WHERE rol_id IS NULL;

-- 4. Create configuration table for app branding
CREATE TABLE public.configuracion_aplicacion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    color_primario TEXT DEFAULT '#3B82F6',
    color_secundario TEXT DEFAULT '#1E40AF',
    logo_url TEXT,
    nombre_empresa TEXT DEFAULT 'AsistenciaPro',
    mensaje_bienvenida TEXT DEFAULT 'Bienvenido al sistema de gestión de asistencia',
    actualizado_por UUID REFERENCES public.usuarios(id),
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Insert default configuration
INSERT INTO public.configuracion_aplicacion (color_primario, color_secundario, nombre_empresa, mensaje_bienvenida)
VALUES ('#3B82F6', '#1E40AF', 'AsistenciaPro', 'Bienvenido al sistema de gestión de asistencia');

-- 5. Create activity logs table
CREATE TABLE public.logs_actividad (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES public.usuarios(id),
    rol TEXT NOT NULL,
    accion TEXT NOT NULL,
    modulo TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    ip_address INET,
    user_agent TEXT,
    fecha TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 6. Create obras table for construction sites
CREATE TABLE public.obras (
    id SERIAL PRIMARY KEY,
    nombre TEXT NOT NULL,
    direccion TEXT,
    descripcion TEXT,
    activa BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 7. Create asistencias table for attendance tracking
CREATE TABLE public.asistencias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE,
    obra_id INTEGER REFERENCES public.obras(id),
    fecha DATE NOT NULL,
    hora_entrada TIMESTAMPTZ,
    hora_salida TIMESTAMPTZ,
    ubicacion_entrada POINT,
    ubicacion_salida POINT,
    nota TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 8. Create incidencias table for incident management
CREATE TABLE public.incidencias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE,
    obra_id INTEGER REFERENCES public.obras(id),
    tipo TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    estado TEXT DEFAULT 'pendiente',
    fecha_reporte TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    fecha_resolucion TIMESTAMPTZ,
    resuelto_por UUID REFERENCES public.usuarios(id)
);

-- 9. Create indexes for performance
CREATE INDEX idx_usuarios_correo ON public.usuarios(correo);
CREATE INDEX idx_usuarios_rol_id ON public.usuarios(rol_id);
CREATE INDEX idx_logs_actividad_usuario_id ON public.logs_actividad(usuario_id);
CREATE INDEX idx_logs_actividad_fecha ON public.logs_actividad(fecha);
CREATE INDEX idx_logs_actividad_modulo ON public.logs_actividad(modulo);
CREATE INDEX idx_asistencias_usuario_id ON public.asistencias(usuario_id);
CREATE INDEX idx_asistencias_fecha ON public.asistencias(fecha);
CREATE INDEX idx_incidencias_usuario_id ON public.incidencias(usuario_id);
CREATE INDEX idx_incidencias_estado ON public.incidencias(estado);

-- 10. Enable RLS on all tables
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracion_aplicacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs_actividad ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.obras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asistencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidencias ENABLE ROW LEVEL SECURITY;

-- 11. Create RLS policies

-- Usuarios policies - Pattern 1: Core user table
CREATE POLICY "users_view_own_profile"
ON public.usuarios
FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "users_update_own_profile"
ON public.usuarios
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Allow superadmins to view/manage all users
CREATE POLICY "superadmin_manage_all_usuarios"
ON public.usuarios
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.usuarios u
        WHERE u.id = auth.uid() AND u.rol = 'superadmin'
    )
);

-- Roles policies - Public read for role names
CREATE POLICY "public_read_roles"
ON public.roles
FOR SELECT
TO authenticated
USING (true);

-- Configuration policies - Only superadmins can manage
CREATE POLICY "superadmin_manage_configuration"
ON public.configuracion_aplicacion
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.usuarios u
        WHERE u.id = auth.uid() AND u.rol = 'superadmin'
    )
);

CREATE POLICY "all_users_read_configuration"
ON public.configuracion_aplicacion
FOR SELECT
TO authenticated
USING (true);

-- Activity logs policies - Users see own logs, admins see all
CREATE POLICY "users_view_own_logs"
ON public.logs_actividad
FOR SELECT
TO authenticated
USING (usuario_id = auth.uid());

CREATE POLICY "admin_view_all_logs"
ON public.logs_actividad
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.usuarios u
        WHERE u.id = auth.uid() AND u.rol IN ('admin', 'superadmin')
    )
);

CREATE POLICY "system_insert_logs"
ON public.logs_actividad
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Obras policies - Read access for all authenticated users
CREATE POLICY "authenticated_read_obras"
ON public.obras
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "admin_manage_obras"
ON public.obras
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.usuarios u
        WHERE u.id = auth.uid() AND u.rol IN ('admin', 'superadmin')
    )
);

-- Asistencias policies - Users manage own attendance
CREATE POLICY "users_manage_own_asistencias"
ON public.asistencias
FOR ALL
TO authenticated
USING (usuario_id = auth.uid())
WITH CHECK (usuario_id = auth.uid());

CREATE POLICY "supervisor_view_team_asistencias"
ON public.asistencias
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.usuarios u
        WHERE u.id = auth.uid() AND u.rol IN ('supervisor', 'admin', 'superadmin')
    )
);

-- Incidencias policies - Users manage own incidents
CREATE POLICY "users_manage_own_incidencias"
ON public.incidencias
FOR ALL
TO authenticated
USING (usuario_id = auth.uid())
WITH CHECK (usuario_id = auth.uid());

CREATE POLICY "admin_manage_all_incidencias"
ON public.incidencias
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.usuarios u
        WHERE u.id = auth.uid() AND u.rol IN ('admin', 'superadmin')
    )
);

-- 12. Create function for automatic user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.usuarios (id, correo, nombre, rol_id, activo)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        1, -- Default to 'user' role
        true
    );
    RETURN NEW;
EXCEPTION
    WHEN unique_violation THEN
        -- User already exists, do nothing
        RETURN NEW;
END;
$$;

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 13. Create function to log activities
CREATE OR REPLACE FUNCTION public.log_activity(
    p_accion TEXT,
    p_modulo TEXT,
    p_descripcion TEXT,
    p_usuario_id UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_role TEXT;
BEGIN
    -- Get current user role
    SELECT COALESCE(u.rol, 'user') INTO current_user_role
    FROM public.usuarios u
    WHERE u.id = COALESCE(p_usuario_id, auth.uid());

    -- Insert activity log
    INSERT INTO public.logs_actividad (
        usuario_id,
        rol,
        accion,
        modulo,
        descripcion
    )
    VALUES (
        COALESCE(p_usuario_id, auth.uid()),
        current_user_role,
        p_accion,
        p_modulo,
        p_descripcion
    );
EXCEPTION
    WHEN OTHERS THEN
        -- Silently fail to avoid breaking main operations
        NULL;
END;
$$;

-- 14. Create sample data
DO $$
DECLARE
    admin_uuid UUID := gen_random_uuid();
    supervisor_uuid UUID := gen_random_uuid();
    user_uuid UUID := gen_random_uuid();
    obra1_id INTEGER;
    obra2_id INTEGER;
BEGIN
    -- Create auth users
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
         '{"full_name": "Administrador Sistema"}'::jsonb, '{"provider": "email", "providers": ["email"]}'::jsonb,
         false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null),
        (supervisor_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         'supervisor@asistenciapro.com', crypt('supervisor123', gen_salt('bf', 10)), now(), now(), now(),
         '{"full_name": "Supervisor Obra"}'::jsonb, '{"provider": "email", "providers": ["email"]}'::jsonb,
         false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null),
        (user_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         'empleado@asistenciapro.com', crypt('empleado123', gen_salt('bf', 10)), now(), now(), now(),
         '{"full_name": "Empleado Obra"}'::jsonb, '{"provider": "email", "providers": ["email"]}'::jsonb,
         false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null);

    -- Update usuarios with correct roles
    UPDATE public.usuarios SET rol_id = 4, rol = 'superadmin' WHERE id = admin_uuid;
    UPDATE public.usuarios SET rol_id = 2, rol = 'supervisor' WHERE id = supervisor_uuid;
    UPDATE public.usuarios SET rol_id = 1, rol = 'user' WHERE id = user_uuid;

    -- Create sample obras
    INSERT INTO public.obras (nombre, direccion, descripcion) VALUES
        ('Construcción Torre Central', 'Av. Principal 123, Ciudad', 'Edificio residencial de 20 pisos'),
        ('Remodelación Oficinas', 'Calle Comercial 456, Centro', 'Renovación completa de oficinas corporativas')
    RETURNING id INTO obra1_id;

    -- Get the obra IDs
    SELECT id INTO obra1_id FROM public.obras WHERE nombre = 'Construcción Torre Central';
    SELECT id INTO obra2_id FROM public.obras WHERE nombre = 'Remodelación Oficinas';

    -- Update usuarios with obra assignments
    UPDATE public.usuarios SET obra_id = obra1_id WHERE id IN (supervisor_uuid, user_uuid);

    -- Create sample attendance records
    INSERT INTO public.asistencias (usuario_id, obra_id, fecha, hora_entrada, hora_salida) VALUES
        (user_uuid, obra1_id, CURRENT_DATE, CURRENT_TIMESTAMP - INTERVAL '8 hours', CURRENT_TIMESTAMP - INTERVAL '30 minutes'),
        (supervisor_uuid, obra1_id, CURRENT_DATE, CURRENT_TIMESTAMP - INTERVAL '9 hours', CURRENT_TIMESTAMP);

    -- Create sample activity logs
    INSERT INTO public.logs_actividad (usuario_id, rol, accion, modulo, descripcion) VALUES
        (admin_uuid, 'superadmin', 'login', 'Authentication', 'Administrador inició sesión en el sistema'),
        (supervisor_uuid, 'supervisor', 'check_in', 'Attendance', 'Supervisor registró entrada en obra'),
        (user_uuid, 'user', 'profile_update', 'Profile', 'Empleado actualizó información de perfil'),
        (admin_uuid, 'superadmin', 'config_change', 'Configuration', 'Se actualizó la configuración visual del sistema');

END $$;

-- 15. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;