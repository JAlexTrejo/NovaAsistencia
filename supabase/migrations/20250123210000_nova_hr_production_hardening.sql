-- Nova HR Production Hardening Migration
-- Consolidates existing schema and adds production-ready RLS policies
-- Schema Analysis: Uses existing tables from previous migrations
-- Integration Type: Enhancement with production security hardening

-- ✅ Add missing indexes for performance (using correct table/column names from existing schema)
CREATE INDEX IF NOT EXISTS idx_asistencias_empleado_fecha ON public.asistencias(empleado_id, fecha);
CREATE INDEX IF NOT EXISTS idx_asistencias_obra_fecha ON public.asistencias(obra_id, fecha);
CREATE INDEX IF NOT EXISTS idx_incidentes_empleado_fecha ON public.incidentes(empleado_id, fecha_incidente);
CREATE INDEX IF NOT EXISTS idx_nominas_empleado_semana ON public.nominas(empleado_id, semana_inicio);
CREATE INDEX IF NOT EXISTS idx_empleados_status ON public.empleados(status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);

-- ✅ Functions MUST be created BEFORE RLS policies
CREATE OR REPLACE FUNCTION public.is_admin_from_auth()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
SELECT EXISTS (
    SELECT 1 FROM auth.users au
    WHERE au.id = auth.uid() 
    AND (au.raw_user_meta_data->>'role' = 'admin' 
         OR au.raw_user_meta_data->>'role' = 'superadmin'
         OR au.raw_app_meta_data->>'role' = 'admin'
         OR au.raw_app_meta_data->>'role' = 'superadmin')
)
$$;

CREATE OR REPLACE FUNCTION public.is_supervisor_from_auth()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
SELECT EXISTS (
    SELECT 1 FROM auth.users au
    WHERE au.id = auth.uid() 
    AND (au.raw_user_meta_data->>'role' IN ('supervisor', 'admin', 'superadmin')
         OR au.raw_app_meta_data->>'role' IN ('supervisor', 'admin', 'superadmin'))
)
$$;

-- ✅ Helper function for employee access (avoids circular dependency)
CREATE OR REPLACE FUNCTION public.can_access_employee_data(target_employee_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
SELECT EXISTS (
    SELECT 1 FROM public.empleados ep
    JOIN public.user_profiles up ON ep.user_id = up.id
    WHERE ep.id = target_employee_id
    AND (
        up.id = auth.uid() -- Employee accessing their own data
        OR ep.supervisor_id = auth.uid() -- Supervisor access
        OR EXISTS (
            SELECT 1 FROM auth.users au
            WHERE au.id = auth.uid()
            AND (au.raw_user_meta_data->>'role' IN ('admin', 'superadmin')
                 OR au.raw_app_meta_data->>'role' IN ('admin', 'superadmin'))
        ) -- Admin access
    )
)
$$;

-- ✅ RLS Policies using correct patterns
-- Drop existing policies to recreate with proper structure
DROP POLICY IF EXISTS "Enable access for users based on user_id" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable all for authenticated users based on user_id" ON public.user_profiles;

-- Pattern 1: Core user table (user_profiles) - Simple only, no functions
CREATE POLICY "users_manage_own_user_profiles"
ON public.user_profiles
FOR ALL
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Admin access to all user profiles
CREATE POLICY "admin_access_user_profiles"
ON public.user_profiles
FOR ALL
TO authenticated
USING (public.is_admin_from_auth())
WITH CHECK (public.is_admin_from_auth());

-- Pattern 2: Simple user ownership for empleados (employee_profiles)
CREATE POLICY "users_manage_own_empleados"
ON public.empleados
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Supervisor and admin access to employee profiles
CREATE POLICY "supervisor_access_empleados"
ON public.empleados
FOR SELECT
TO authenticated
USING (supervisor_id = auth.uid() OR public.is_admin_from_auth());

-- Pattern 2: Attendance records - employee can see their own, supervisors can see their team
CREATE POLICY "employees_manage_own_asistencias"
ON public.asistencias
FOR ALL
TO authenticated
USING (empleado_id = auth.uid())
WITH CHECK (empleado_id = auth.uid());

CREATE POLICY "supervisors_view_team_asistencias"
ON public.asistencias
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.empleados ep
        WHERE ep.id = asistencias.empleado_id
        AND (ep.supervisor_id = auth.uid() OR public.is_admin_from_auth())
    )
);

-- Pattern 2: Incident records with role-based access
CREATE POLICY "employees_manage_own_incidentes"
ON public.incidentes
FOR ALL
TO authenticated
USING (empleado_id = auth.uid())
WITH CHECK (empleado_id = auth.uid());

CREATE POLICY "supervisors_view_incidentes"
ON public.incidentes
FOR SELECT
TO authenticated
USING (public.is_supervisor_from_auth() OR public.is_admin_from_auth());

CREATE POLICY "supervisors_approve_incidentes"
ON public.incidentes
FOR UPDATE
TO authenticated
USING (public.is_supervisor_from_auth() OR public.is_admin_from_auth())
WITH CHECK (public.is_supervisor_from_auth() OR public.is_admin_from_auth());

-- Pattern 2: Payroll data - highly sensitive (using correct table name: nominas)
CREATE POLICY "employees_view_own_nominas"
ON public.nominas
FOR SELECT
TO authenticated
USING (empleado_id = auth.uid());

CREATE POLICY "admin_manage_nominas"
ON public.nominas
FOR ALL
TO authenticated
USING (public.is_admin_from_auth())
WITH CHECK (public.is_admin_from_auth());

-- Construction sites (obras) - supervisors can view, admins can manage
CREATE POLICY "users_view_obras"
ON public.obras
FOR SELECT
TO authenticated
USING (true); -- All authenticated users can view sites

CREATE POLICY "admin_manage_obras"
ON public.obras
FOR ALL
TO authenticated
USING (public.is_admin_from_auth())
WITH CHECK (public.is_admin_from_auth());

-- Activity logs - admin only
CREATE POLICY "admin_access_logs_actividad"
ON public.logs_actividad
FOR ALL
TO authenticated
USING (public.is_admin_from_auth())
WITH CHECK (public.is_admin_from_auth());

-- Branding settings - superadmin only (using correct table name: configuracion_aplicacion)
CREATE POLICY "superadmin_manage_configuracion_aplicacion"
ON public.configuracion_aplicacion
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

-- ✅ Production data integrity constraints (using correct table names)
ALTER TABLE public.asistencias
ADD CONSTRAINT IF NOT EXISTS unique_empleado_fecha_asistencias UNIQUE (empleado_id, fecha);

-- ✅ Audit trigger for critical operations (using correct table and column names)
CREATE OR REPLACE FUNCTION public.audit_asistencias_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND OLD.horas_trabajadas != NEW.horas_trabajadas THEN
        INSERT INTO public.logs_actividad (
            usuario_id,
            modulo,
            accion,
            descripcion,
            fecha,
            severity
        ) VALUES (
            auth.uid(),
            'attendance',
            'hours_modified',
            format('Employee %s hours changed from %s to %s for date %s', 
                   NEW.empleado_id, OLD.horas_trabajadas, NEW.horas_trabajadas, NEW.fecha),
            now(),
            'medium'
        );
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS asistencias_audit_trigger ON public.asistencias;
CREATE TRIGGER asistencias_audit_trigger
    AFTER UPDATE ON public.asistencias
    FOR EACH ROW
    EXECUTE FUNCTION public.audit_asistencias_changes();

-- ✅ Production performance optimization (using correct table and column names)
CREATE INDEX IF NOT EXISTS idx_asistencias_search ON public.asistencias USING gin(to_tsvector('spanish', notas));

-- Migration completed: Nova HR Production Hardening with enhanced RLS policies, performance indexes, and audit trails