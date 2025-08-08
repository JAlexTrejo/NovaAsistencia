-- Location: supabase/migrations/20250807212400_asistenciapro_complete_system.sql
-- Schema Analysis: Basic user_profiles, configuracion_aplicacion, logs_actividad exist
-- Integration Type: Complete AsistenciaPro system extension
-- Dependencies: Extends existing user_profiles table

-- Create missing enum types
CREATE TYPE public.user_role AS ENUM ('user', 'supervisor', 'admin', 'superadmin');
CREATE TYPE public.employee_status AS ENUM ('active', 'inactive', 'suspended', 'deleted');
CREATE TYPE public.attendance_status AS ENUM ('present', 'absent', 'late', 'partial');
CREATE TYPE public.incident_type AS ENUM ('accident', 'safety_violation', 'equipment_damage', 'tardiness', 'absence');
CREATE TYPE public.incident_severity AS ENUM ('low', 'medium', 'high', 'critical');

-- Construction sites/obras table
CREATE TABLE public.obras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    direccion TEXT,
    descripcion TEXT,
    fecha_inicio DATE,
    fecha_fin_estimada DATE,
    activa BOOLEAN DEFAULT true,
    supervisor_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Extended employee profiles table
CREATE TABLE public.empleados (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    codigo_empleado TEXT UNIQUE NOT NULL,
    numero_documento TEXT UNIQUE,
    fecha_nacimiento DATE,
    direccion TEXT,
    contacto_emergencia TEXT,
    obra_id UUID REFERENCES public.obras(id) ON DELETE SET NULL,
    supervisor_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    fecha_contratacion DATE DEFAULT CURRENT_DATE,
    salario_diario DECIMAL(10,2) DEFAULT 0.00,
    status public.employee_status DEFAULT 'active'::public.employee_status,
    avatar_url TEXT,
    deleted_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Attendance records table
CREATE TABLE public.asistencias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empleado_id UUID REFERENCES public.empleados(id) ON DELETE CASCADE,
    obra_id UUID REFERENCES public.obras(id) ON DELETE CASCADE,
    fecha DATE NOT NULL,
    hora_entrada TIME,
    hora_salida TIME,
    horas_trabajadas DECIMAL(4,2) DEFAULT 0.00,
    horas_extra DECIMAL(4,2) DEFAULT 0.00,
    status public.attendance_status DEFAULT 'present'::public.attendance_status,
    notas TEXT,
    supervisor_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(empleado_id, fecha)
);

-- Payroll calculations table
CREATE TABLE public.nominas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empleado_id UUID REFERENCES public.empleados(id) ON DELETE CASCADE,
    semana_inicio DATE NOT NULL,
    semana_fin DATE NOT NULL,
    dias_trabajados INTEGER DEFAULT 0,
    horas_regulares DECIMAL(6,2) DEFAULT 0.00,
    horas_extra DECIMAL(6,2) DEFAULT 0.00,
    salario_base DECIMAL(10,2) DEFAULT 0.00,
    pago_horas_extra DECIMAL(10,2) DEFAULT 0.00,
    bonificaciones DECIMAL(10,2) DEFAULT 0.00,
    deducciones DECIMAL(10,2) DEFAULT 0.00,
    salario_bruto DECIMAL(10,2) DEFAULT 0.00,
    salario_neto DECIMAL(10,2) DEFAULT 0.00,
    procesada BOOLEAN DEFAULT false,
    procesada_por UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    procesada_en TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(empleado_id, semana_inicio)
);

-- Payroll adjustments table
CREATE TABLE public.ajustes_nomina (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nomina_id UUID REFERENCES public.nominas(id) ON DELETE CASCADE,
    empleado_id UUID REFERENCES public.empleados(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL CHECK (tipo IN ('bonus', 'deduction')),
    categoria TEXT NOT NULL,
    monto DECIMAL(10,2) NOT NULL,
    descripcion TEXT NOT NULL,
    autorizado_por UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Incidents table
CREATE TABLE public.incidentes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empleado_id UUID REFERENCES public.empleados(id) ON DELETE CASCADE,
    obra_id UUID REFERENCES public.obras(id) ON DELETE CASCADE,
    tipo public.incident_type NOT NULL,
    severidad public.incident_severity DEFAULT 'low'::public.incident_severity,
    titulo TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    fecha_incidente DATE DEFAULT CURRENT_DATE,
    hora_incidente TIME,
    reportado_por UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    estado TEXT DEFAULT 'pending' CHECK (estado IN ('pending', 'investigating', 'resolved', 'closed')),
    resolucion TEXT,
    resuelto_por UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    resuelto_en TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Add role column to existing user_profiles if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='user_profiles' AND column_name='role_enum') THEN
        ALTER TABLE public.user_profiles ADD COLUMN role_enum public.user_role;
        -- Update existing role column data to enum
        UPDATE public.user_profiles SET role_enum = 
            CASE 
                WHEN role = 'superadmin' THEN 'superadmin'::public.user_role
                WHEN role = 'admin' THEN 'admin'::public.user_role
                WHEN role = 'supervisor' THEN 'supervisor'::public.user_role
                ELSE 'user'::public.user_role
            END;
    END IF;
END $$;

-- Update configuracion_aplicacion to include app_name and better branding
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='configuracion_aplicacion' AND column_name='nombre_app') THEN
        ALTER TABLE public.configuracion_aplicacion ADD COLUMN nombre_app TEXT DEFAULT 'AsistenciaPro';
        ALTER TABLE public.configuracion_aplicacion ADD COLUMN logo_principal_url TEXT;
        ALTER TABLE public.configuracion_aplicacion ADD COLUMN logo_login_url TEXT;
        ALTER TABLE public.configuracion_aplicacion ADD COLUMN favicon_url TEXT;
    END IF;
END $$;

-- Essential Indexes
CREATE INDEX idx_obras_supervisor ON public.obras(supervisor_id);
CREATE INDEX idx_obras_activa ON public.obras(activa);
CREATE INDEX idx_empleados_user_id ON public.empleados(user_id);
CREATE INDEX idx_empleados_obra_id ON public.empleados(obra_id);
CREATE INDEX idx_empleados_supervisor ON public.empleados(supervisor_id);
CREATE INDEX idx_empleados_status ON public.empleados(status);
CREATE INDEX idx_empleados_codigo ON public.empleados(codigo_empleado);
CREATE INDEX idx_asistencias_empleado ON public.asistencias(empleado_id);
CREATE INDEX idx_asistencias_fecha ON public.asistencias(fecha);
CREATE INDEX idx_asistencias_obra ON public.asistencias(obra_id);
CREATE INDEX idx_nominas_empleado ON public.nominas(empleado_id);
CREATE INDEX idx_nominas_semana ON public.nominas(semana_inicio, semana_fin);
CREATE INDEX idx_incidentes_empleado ON public.incidentes(empleado_id);
CREATE INDEX idx_incidentes_obra ON public.incidentes(obra_id);
CREATE INDEX idx_incidentes_fecha ON public.incidentes(fecha_incidente);

-- Enable RLS on all tables
ALTER TABLE public.obras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empleados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asistencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nominas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ajustes_nomina ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidentes ENABLE ROW LEVEL SECURITY;

-- Helper function for role-based access using auth metadata
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
SELECT COALESCE(
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()),
    'user'
)
$$;

-- Helper function to check if user is admin or higher
CREATE OR REPLACE FUNCTION public.is_admin_or_higher()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
SELECT public.get_user_role() IN ('admin', 'superadmin')
$$;

-- Helper function to check if user is supervisor or higher
CREATE OR REPLACE FUNCTION public.is_supervisor_or_higher()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
SELECT public.get_user_role() IN ('supervisor', 'admin', 'superadmin')
$$;

-- RLS Policies - Pattern 2: Simple user ownership and role-based access

-- Obras (Construction Sites) policies
CREATE POLICY "admin_full_access_obras"
ON public.obras
FOR ALL
TO authenticated
USING (public.is_admin_or_higher())
WITH CHECK (public.is_admin_or_higher());

CREATE POLICY "supervisor_view_assigned_obras"
ON public.obras
FOR SELECT
TO authenticated
USING (supervisor_id = auth.uid() OR public.is_admin_or_higher());

-- Empleados (Employees) policies
CREATE POLICY "admin_full_access_empleados"
ON public.empleados
FOR ALL
TO authenticated
USING (public.is_admin_or_higher())
WITH CHECK (public.is_admin_or_higher());

CREATE POLICY "supervisor_view_assigned_empleados"
ON public.empleados
FOR SELECT
TO authenticated
USING (supervisor_id = auth.uid() OR public.is_admin_or_higher());

CREATE POLICY "user_view_own_empleado_profile"
ON public.empleados
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Asistencias (Attendance) policies
CREATE POLICY "admin_full_access_asistencias"
ON public.asistencias
FOR ALL
TO authenticated
USING (public.is_admin_or_higher())
WITH CHECK (public.is_admin_or_higher());

CREATE POLICY "supervisor_manage_site_asistencias"
ON public.asistencias
FOR ALL
TO authenticated
USING (supervisor_id = auth.uid() OR public.is_supervisor_or_higher())
WITH CHECK (supervisor_id = auth.uid() OR public.is_supervisor_or_higher());

CREATE POLICY "employee_view_own_asistencias"
ON public.asistencias
FOR SELECT
TO authenticated
USING (empleado_id IN (SELECT id FROM public.empleados WHERE user_id = auth.uid()));

-- Nominas (Payroll) policies
CREATE POLICY "admin_full_access_nominas"
ON public.nominas
FOR ALL
TO authenticated
USING (public.is_admin_or_higher())
WITH CHECK (public.is_admin_or_higher());

CREATE POLICY "employee_view_own_nominas"
ON public.nominas
FOR SELECT
TO authenticated
USING (empleado_id IN (SELECT id FROM public.empleados WHERE user_id = auth.uid()));

-- Ajustes nomina policies
CREATE POLICY "admin_full_access_ajustes_nomina"
ON public.ajustes_nomina
FOR ALL
TO authenticated
USING (public.is_admin_or_higher())
WITH CHECK (public.is_admin_or_higher());

-- Incidentes policies
CREATE POLICY "admin_full_access_incidentes"
ON public.incidentes
FOR ALL
TO authenticated
USING (public.is_admin_or_higher())
WITH CHECK (public.is_admin_or_higher());

CREATE POLICY "supervisor_manage_site_incidentes"
ON public.incidentes
FOR ALL
TO authenticated
USING (reportado_por = auth.uid() OR public.is_supervisor_or_higher())
WITH CHECK (public.is_supervisor_or_higher());

CREATE POLICY "employee_view_own_incidentes"
ON public.incidentes
FOR SELECT
TO authenticated
USING (empleado_id IN (SELECT id FROM public.empleados WHERE user_id = auth.uid()));

-- Functions for soft delete and payroll calculations
CREATE OR REPLACE FUNCTION public.soft_delete_employee(p_employee_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.empleados 
    SET 
        status = 'deleted'::public.employee_status,
        deleted_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_employee_id;
    
    RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.calculate_weekly_payroll(p_employee_id UUID, p_start_date DATE, p_end_date DATE)
RETURNS TABLE(
    empleado_id UUID,
    dias_trabajados INTEGER,
    horas_regulares DECIMAL,
    horas_extra DECIMAL,
    salario_base DECIMAL,
    pago_horas_extra DECIMAL,
    salario_bruto DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_salario_diario DECIMAL;
    v_tarifa_hora_extra DECIMAL;
BEGIN
    -- Get employee's daily salary
    SELECT salario_diario INTO v_salario_diario
    FROM public.empleados
    WHERE id = p_employee_id;
    
    -- Calculate extra hour rate (1.5x regular rate)
    v_tarifa_hora_extra := (v_salario_diario / 8.0) * 1.5;
    
    RETURN QUERY
    SELECT 
        p_employee_id,
        COUNT(*)::INTEGER as dias_trabajados,
        SUM(COALESCE(horas_trabajadas, 0))::DECIMAL as horas_regulares,
        SUM(COALESCE(a.horas_extra, 0))::DECIMAL as horas_extra,
        (COUNT(*) * v_salario_diario)::DECIMAL as salario_base,
        (SUM(COALESCE(a.horas_extra, 0)) * v_tarifa_hora_extra)::DECIMAL as pago_horas_extra,
        (COUNT(*) * v_salario_diario + SUM(COALESCE(a.horas_extra, 0)) * v_tarifa_hora_extra)::DECIMAL as salario_bruto
    FROM public.asistencias a
    WHERE a.empleado_id = p_employee_id
    AND a.fecha BETWEEN p_start_date AND p_end_date
    AND a.status = 'present'::public.attendance_status;
END;
$$;

-- Triggers for automatic updates
CREATE OR REPLACE FUNCTION public.update_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

CREATE TRIGGER update_obras_timestamp
    BEFORE UPDATE ON public.obras
    FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

CREATE TRIGGER update_empleados_timestamp
    BEFORE UPDATE ON public.empleados
    FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

CREATE TRIGGER update_asistencias_timestamp
    BEFORE UPDATE ON public.asistencias
    FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

CREATE TRIGGER update_nominas_timestamp
    BEFORE UPDATE ON public.nominas
    FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

CREATE TRIGGER update_incidentes_timestamp
    BEFORE UPDATE ON public.incidentes
    FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

-- Mock data for testing
DO $$
DECLARE
    admin_user_id UUID := '9b6e7452-95f7-47ab-b52f-38810ad046b8'; -- Existing user from sample
    obra_central_id UUID := gen_random_uuid();
    obra_norte_id UUID := gen_random_uuid();
    empleado1_id UUID := gen_random_uuid();
    empleado2_id UUID := gen_random_uuid();
BEGIN
    -- Update existing user to have proper role
    UPDATE public.user_profiles 
    SET role_enum = 'superadmin'::public.user_role 
    WHERE id = admin_user_id;

    -- Create construction sites
    INSERT INTO public.obras (id, nombre, direccion, descripcion, supervisor_id) VALUES
        (obra_central_id, 'Obra Central', 'Av. Principal 123, Ciudad Central', 'Proyecto de construcción principal', admin_user_id),
        (obra_norte_id, 'Proyecto Norte', 'Calle Norte 456, Zona Norte', 'Desarrollo habitacional', admin_user_id);

    -- Create sample employees
    INSERT INTO public.empleados (id, user_id, codigo_empleado, numero_documento, obra_id, supervisor_id, fecha_contratacion, salario_diario) VALUES
        (empleado1_id, admin_user_id, 'EMP001', '12345678A', obra_central_id, admin_user_id, '2024-01-15', 300.00),
        (empleado2_id, admin_user_id, 'EMP002', '87654321B', obra_norte_id, admin_user_id, '2024-02-01', 280.00);

    -- Create sample attendance records for current week
    INSERT INTO public.asistencias (empleado_id, obra_id, fecha, hora_entrada, hora_salida, horas_trabajadas, horas_extra, supervisor_id) VALUES
        (empleado1_id, obra_central_id, CURRENT_DATE - INTERVAL '2 days', '08:00', '17:00', 8.0, 1.0, admin_user_id),
        (empleado1_id, obra_central_id, CURRENT_DATE - INTERVAL '1 day', '08:00', '16:30', 7.5, 0.0, admin_user_id),
        (empleado2_id, obra_norte_id, CURRENT_DATE - INTERVAL '2 days', '07:30', '16:30', 8.0, 0.5, admin_user_id),
        (empleado2_id, obra_norte_id, CURRENT_DATE - INTERVAL '1 day', '08:00', '17:30', 8.0, 1.5, admin_user_id);

    -- Update app configuration with proper branding
    UPDATE public.configuracion_aplicacion 
    SET 
        nombre_app = 'AsistenciaPro',
        nombre_empresa = 'GY&ID CORPORATIVO',
        mensaje_bienvenida = 'Bienvenido al sistema de gestión de asistencia',
        moneda = 'MXN',
        simbolo_moneda = '$',
        updated_at = CURRENT_TIMESTAMP
    WHERE id = '6756d6c4-b0b5-4c79-b2f9-1e04d24bdde8';

END $$;