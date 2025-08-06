-- Essential schema setup for AsistenciaPro
-- Execute this in your Supabase SQL Editor

-- 1. Create Types
CREATE TYPE public.user_role AS ENUM ('superadmin', 'administrador', 'usuario');
CREATE TYPE public.attendance_status AS ENUM ('entrada', 'inicio_comida', 'fin_comida', 'salida');
CREATE TYPE public.incident_type AS ENUM ('falta', 'permiso', 'retardo', 'incapacidad');
CREATE TYPE public.incident_status AS ENUM ('pendiente', 'aprobada', 'rechazada');
CREATE TYPE public.payroll_status AS ENUM ('borrador', 'calculada', 'pagada');

-- 2. Core Tables
CREATE TABLE public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    role public.user_role DEFAULT 'usuario'::public.user_role,
    employee_id TEXT UNIQUE,
    daily_salary DECIMAL(10,2) DEFAULT 0,
    phone TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.construction_sites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    location TEXT,
    description TEXT,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    allowed_radius_meters INTEGER DEFAULT 15,
    gps_enabled BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.supervisors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.employee_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    site_id UUID REFERENCES public.construction_sites(id) ON DELETE CASCADE,
    supervisor_id UUID REFERENCES public.supervisors(id) ON DELETE SET NULL,
    assigned_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

CREATE TABLE public.attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    site_id UUID REFERENCES public.construction_sites(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    entrada TIMESTAMPTZ,
    inicio_comida TIMESTAMPTZ,
    fin_comida TIMESTAMPTZ,
    salida TIMESTAMPTZ,
    total_hours DECIMAL(4,2) DEFAULT 0,
    is_complete BOOLEAN DEFAULT false,
    location_entrada TEXT,
    location_salida TEXT,
    checkin_realizado_por UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    supervisor_latitude DECIMAL(10,8),
    supervisor_longitude DECIMAL(11,8),
    dentro_del_rango BOOLEAN DEFAULT false,
    distancia_metros DECIMAL(10,2),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    type public.incident_type NOT NULL,
    status public.incident_status DEFAULT 'pendiente'::public.incident_status,
    date DATE NOT NULL,
    description TEXT,
    attachment_urls TEXT[],
    attachment_count INTEGER DEFAULT 0,
    approved_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.payroll_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    week_start DATE NOT NULL,
    week_end DATE NOT NULL,
    days_worked INTEGER DEFAULT 0,
    total_hours DECIMAL(5,2) DEFAULT 0,
    overtime_hours DECIMAL(5,2) DEFAULT 0,
    base_salary DECIMAL(10,2) DEFAULT 0,
    overtime_pay DECIMAL(10,2) DEFAULT 0,
    bonuses DECIMAL(10,2) DEFAULT 0,
    deductions DECIMAL(10,2) DEFAULT 0,
    gross_pay DECIMAL(10,2) DEFAULT 0,
    net_pay DECIMAL(10,2) DEFAULT 0,
    status public.payroll_status DEFAULT 'borrador'::public.payroll_status,
    calculated_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    calculated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key TEXT UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create Indexes
CREATE INDEX idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX idx_user_profiles_employee_id ON public.user_profiles(employee_id);
CREATE INDEX idx_attendance_employee_date ON public.attendance_records(employee_id, date);
CREATE INDEX idx_attendance_site_date ON public.attendance_records(site_id, date);
CREATE INDEX idx_incidents_employee_status ON public.incidents(employee_id, status);
CREATE INDEX idx_payroll_employee_week ON public.payroll_records(employee_id, week_start, week_end);
CREATE INDEX idx_employee_assignments_active ON public.employee_assignments(employee_id, is_active);

-- 4. Create Functions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, role)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'usuario'::public.user_role)
  );  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_admin_from_auth()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
SELECT EXISTS (
    SELECT 1 FROM auth.users au
    WHERE au.id = auth.uid() 
    AND (au.raw_user_meta_data->>'role' IN ('superadmin', 'administrador')
         OR au.raw_app_meta_data->>'role' IN ('superadmin', 'administrador'))
)
$$;

-- 5. Create Trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.construction_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supervisors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS Policies
CREATE POLICY "users_manage_own_user_profiles"
ON public.user_profiles
FOR ALL
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "admin_full_access_construction_sites"
ON public.construction_sites
FOR ALL
TO authenticated
USING (public.is_admin_from_auth())
WITH CHECK (public.is_admin_from_auth());

CREATE POLICY "users_view_assigned_sites"
ON public.construction_sites
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.employee_assignments ea
        WHERE ea.site_id = id AND ea.employee_id = auth.uid() AND ea.is_active = true
    )
);

CREATE POLICY "admin_full_access_supervisors"
ON public.supervisors
FOR ALL
TO authenticated
USING (public.is_admin_from_auth())
WITH CHECK (public.is_admin_from_auth());

CREATE POLICY "admin_full_access_employee_assignments"
ON public.employee_assignments
FOR ALL
TO authenticated
USING (public.is_admin_from_auth())
WITH CHECK (public.is_admin_from_auth());

CREATE POLICY "users_view_own_assignments"
ON public.employee_assignments
FOR SELECT
TO authenticated
USING (employee_id = auth.uid());

CREATE POLICY "users_manage_own_attendance"
ON public.attendance_records
FOR ALL
TO authenticated
USING (employee_id = auth.uid())
WITH CHECK (employee_id = auth.uid());

CREATE POLICY "admin_full_access_attendance"
ON public.attendance_records
FOR ALL
TO authenticated
USING (public.is_admin_from_auth())
WITH CHECK (public.is_admin_from_auth());

CREATE POLICY "users_manage_own_incidents"
ON public.incidents
FOR ALL
TO authenticated
USING (employee_id = auth.uid())
WITH CHECK (employee_id = auth.uid());

CREATE POLICY "admin_full_access_incidents"
ON public.incidents
FOR ALL
TO authenticated
USING (public.is_admin_from_auth())
WITH CHECK (public.is_admin_from_auth());

CREATE POLICY "users_view_own_payroll"
ON public.payroll_records
FOR SELECT
TO authenticated
USING (employee_id = auth.uid());

CREATE POLICY "admin_full_access_payroll"
ON public.payroll_records
FOR ALL
TO authenticated
USING (public.is_admin_from_auth())
WITH CHECK (public.is_admin_from_auth());

CREATE POLICY "admin_only_system_settings"
ON public.system_settings
FOR ALL
TO authenticated
USING (public.is_admin_from_auth())
WITH CHECK (public.is_admin_from_auth());

-- 8. Insert Basic System Settings
INSERT INTO public.system_settings (setting_key, setting_value, description) VALUES
    ('working_hours_start', '08:00', 'Hora de inicio de jornada laboral'),
    ('working_hours_end', '18:00', 'Hora de fin de jornada laboral'),
    ('lunch_duration_minutes', '60', 'Duración del almuerzo en minutos'),
    ('overtime_rate', '1.5', 'Multiplicador para horas extra'),
    ('late_tolerance_minutes', '10', 'Tolerancia para retardos en minutos'),
    ('gps_validation_enabled', 'true', 'Habilitar validación GPS para registros de asistencia'),
    ('default_site_radius_meters', '15', 'Radio por defecto para validación GPS en metros');