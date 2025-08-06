-- Location: supabase/migrations/20250804193234_asistenciapro_complete_schema.sql
-- Schema Analysis: Fresh project - no existing tables
-- Integration Type: Complete new schema
-- Dependencies: Creating complete attendance management system

-- 1. Extensions & Types
CREATE TYPE public.user_role AS ENUM ('superadmin', 'administrador', 'usuario');
CREATE TYPE public.attendance_status AS ENUM ('entrada', 'inicio_comida', 'fin_comida', 'salida');
CREATE TYPE public.incident_type AS ENUM ('falta', 'permiso', 'retardo', 'incapacidad');
CREATE TYPE public.incident_status AS ENUM ('pendiente', 'aprobada', 'rechazada');
CREATE TYPE public.payroll_status AS ENUM ('borrador', 'calculada', 'pagada');

-- 2. Core Tables
-- Critical intermediary table
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

-- Construction sites management
CREATE TABLE public.construction_sites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    location TEXT,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Supervisors management
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

-- Employee assignments to sites and supervisors
CREATE TABLE public.employee_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    site_id UUID REFERENCES public.construction_sites(id) ON DELETE CASCADE,
    supervisor_id UUID REFERENCES public.supervisors(id) ON DELETE SET NULL,
    assigned_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Attendance records
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
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Incidents management
CREATE TABLE public.incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    type public.incident_type NOT NULL,
    status public.incident_status DEFAULT 'pendiente'::public.incident_status,
    date DATE NOT NULL,
    description TEXT,
    justification_file_url TEXT,
    approved_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Payroll records
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

-- System settings
CREATE TABLE public.system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key TEXT UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. Essential Indexes
CREATE INDEX idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX idx_user_profiles_employee_id ON public.user_profiles(employee_id);
CREATE INDEX idx_attendance_employee_date ON public.attendance_records(employee_id, date);
CREATE INDEX idx_attendance_site_date ON public.attendance_records(site_id, date);
CREATE INDEX idx_incidents_employee_status ON public.incidents(employee_id, status);
CREATE INDEX idx_payroll_employee_week ON public.payroll_records(employee_id, week_start, week_end);
CREATE INDEX idx_employee_assignments_active ON public.employee_assignments(employee_id, is_active);

-- 4. Functions
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

-- Function to calculate hours worked
CREATE OR REPLACE FUNCTION public.calculate_attendance_hours(
    entrada_time TIMESTAMPTZ,
    inicio_comida_time TIMESTAMPTZ,
    fin_comida_time TIMESTAMPTZ,
    salida_time TIMESTAMPTZ
)
RETURNS DECIMAL(4,2)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    total_minutes INTEGER := 0;
    lunch_minutes INTEGER := 0;
BEGIN
    IF entrada_time IS NULL OR salida_time IS NULL THEN
        RETURN 0;
    END IF;
    
    -- Calculate total minutes worked
    total_minutes := EXTRACT(EPOCH FROM (salida_time - entrada_time)) / 60;
    
    -- Subtract lunch time if both times are recorded
    IF inicio_comida_time IS NOT NULL AND fin_comida_time IS NOT NULL THEN
        lunch_minutes := EXTRACT(EPOCH FROM (fin_comida_time - inicio_comida_time)) / 60;
        total_minutes := total_minutes - lunch_minutes;
    ELSE
        -- Assume 1 hour lunch if not recorded and working more than 6 hours
        IF total_minutes > 360 THEN
            total_minutes := total_minutes - 60;
        END IF;
    END IF;
    
    RETURN ROUND(total_minutes / 60.0, 2);
END;
$$;

-- 5. Triggers
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger to update attendance hours
CREATE OR REPLACE FUNCTION public.update_attendance_hours()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    calculated_hours DECIMAL(4,2);
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
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_attendance_record_change
  BEFORE INSERT OR UPDATE ON public.attendance_records
  FOR EACH ROW EXECUTE FUNCTION public.update_attendance_hours();

-- 6. RLS Setup
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.construction_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supervisors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies

-- Pattern 1: Core user table - Simple only, no functions
CREATE POLICY "users_manage_own_user_profiles"
ON public.user_profiles
FOR ALL
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Pattern 6: Role-based access using auth metadata
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

-- Construction sites - Admins can see all, users can see assigned sites
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

-- Supervisors - Admin full access
CREATE POLICY "admin_full_access_supervisors"
ON public.supervisors
FOR ALL
TO authenticated
USING (public.is_admin_from_auth())
WITH CHECK (public.is_admin_from_auth());

-- Employee assignments - Admin full access
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

-- Attendance records - Users can manage their own, admins can see all
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

-- Incidents - Users can manage their own, admins can see all
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

-- Payroll - Users can view their own, admins can manage all
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

-- System settings - Admin only
CREATE POLICY "admin_only_system_settings"
ON public.system_settings
FOR ALL
TO authenticated
USING (public.is_admin_from_auth())
WITH CHECK (public.is_admin_from_auth());

-- 8. Mock Data
DO $$
DECLARE
    admin_uuid UUID := gen_random_uuid();
    employee1_uuid UUID := gen_random_uuid();
    employee2_uuid UUID := gen_random_uuid();
    site1_uuid UUID := gen_random_uuid();
    site2_uuid UUID := gen_random_uuid();
    supervisor1_uuid UUID := gen_random_uuid();
BEGIN
    -- Create auth users with required fields
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
         'admin@asistenciapro.com', crypt('Admin123!', gen_salt('bf', 10)), now(), now(), now(),
         '{"full_name": "Administrador Principal", "role": "administrador"}'::jsonb, 
         '{"provider": "email", "providers": ["email"]}'::jsonb,
         false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null),
        (employee1_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         'empleado1@asistenciapro.com', crypt('Empleado123!', gen_salt('bf', 10)), now(), now(), now(),
         '{"full_name": "Juan Pérez López", "role": "usuario"}'::jsonb,
         '{"provider": "email", "providers": ["email"]}'::jsonb,
         false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null),
        (employee2_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         'empleado2@asistenciapro.com', crypt('Empleado123!', gen_salt('bf', 10)), now(), now(), now(),
         '{"full_name": "María González Ruiz", "role": "usuario"}'::jsonb,
         '{"provider": "email", "providers": ["email"]}'::jsonb,
         false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null);

    -- Update user profiles with employee data
    UPDATE public.user_profiles SET 
        employee_id = 'EMP001',
        daily_salary = 500.00,
        phone = '555-0101'
    WHERE id = employee1_uuid;

    UPDATE public.user_profiles SET 
        employee_id = 'EMP002', 
        daily_salary = 480.00,
        phone = '555-0102'
    WHERE id = employee2_uuid;

    -- Create construction sites
    INSERT INTO public.construction_sites (id, name, location, description) VALUES
        (site1_uuid, 'Torre Ejecutiva Norte', 'Av. Constitución 1234, Guadalajara', 'Edificio de oficinas de 15 pisos'),
        (site2_uuid, 'Residencial Las Flores', 'Fracc. Las Flores, Zapopan', 'Conjunto habitacional de 200 casas');

    -- Create supervisors
    INSERT INTO public.supervisors (id, name, phone, email) VALUES
        (supervisor1_uuid, 'Ing. Carlos Mendoza', '555-0201', 'carlos.mendoza@constructora.com');

    -- Create employee assignments
    INSERT INTO public.employee_assignments (employee_id, site_id, supervisor_id) VALUES
        (employee1_uuid, site1_uuid, supervisor1_uuid),
        (employee2_uuid, site2_uuid, supervisor1_uuid);

    -- Create sample attendance records
    INSERT INTO public.attendance_records (employee_id, site_id, date, entrada, inicio_comida, fin_comida, salida) VALUES
        (employee1_uuid, site1_uuid, CURRENT_DATE - INTERVAL '1 day', 
         CURRENT_DATE - INTERVAL '1 day' + INTERVAL '8 hours',
         CURRENT_DATE - INTERVAL '1 day' + INTERVAL '12 hours',
         CURRENT_DATE - INTERVAL '1 day' + INTERVAL '13 hours',
         CURRENT_DATE - INTERVAL '1 day' + INTERVAL '17 hours'),
        (employee2_uuid, site2_uuid, CURRENT_DATE - INTERVAL '1 day',
         CURRENT_DATE - INTERVAL '1 day' + INTERVAL '7:45 hours',
         CURRENT_DATE - INTERVAL '1 day' + INTERVAL '12 hours',
         CURRENT_DATE - INTERVAL '1 day' + INTERVAL '13 hours',
         CURRENT_DATE - INTERVAL '1 day' + INTERVAL '17:30 hours');

    -- Create system settings
    INSERT INTO public.system_settings (setting_key, setting_value, description) VALUES
        ('working_hours_start', '08:00', 'Hora de inicio de jornada laboral'),
        ('working_hours_end', '18:00', 'Hora de fin de jornada laboral'),
        ('lunch_duration_minutes', '60', 'Duración del almuerzo en minutos'),
        ('overtime_rate', '1.5', 'Multiplicador para horas extra'),
        ('late_tolerance_minutes', '10', 'Tolerancia para retardos en minutos');

END $$;