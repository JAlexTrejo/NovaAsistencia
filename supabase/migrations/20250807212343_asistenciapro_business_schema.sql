-- Location: supabase/migrations/20250807212343_asistenciapro_business_schema.sql
-- Schema Analysis: Existing user_profiles, configuracion_aplicacion, logs_actividad 
-- Integration Type: Addition - new business tables referencing existing user_profiles
-- Dependencies: References existing user_profiles table

-- 1. Create Business Enums
CREATE TYPE public.employee_status AS ENUM ('active', 'inactive', 'suspended', 'deleted');
CREATE TYPE public.attendance_status AS ENUM ('present', 'absent', 'late', 'half_day');
CREATE TYPE public.incident_type AS ENUM ('falta', 'permiso', 'retardo', 'incapacidad', 'accidente');
CREATE TYPE public.incident_status AS ENUM ('pendiente', 'aprobado', 'rechazado');

-- 2. Construction Sites
CREATE TABLE public.construction_sites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    location TEXT,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. Employee Profiles (extending user_profiles)
CREATE TABLE public.employee_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    employee_id TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    id_number TEXT,
    birth_date DATE,
    address TEXT,
    emergency_contact TEXT,
    hire_date DATE NOT NULL,
    daily_salary DECIMAL(10,2) DEFAULT 0,
    site_id UUID REFERENCES public.construction_sites(id) ON DELETE SET NULL,
    supervisor_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    status public.employee_status DEFAULT 'active',
    last_attendance_date DATE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);

-- 4. Attendance Records
CREATE TABLE public.attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES public.employee_profiles(id) ON DELETE CASCADE,
    site_id UUID REFERENCES public.construction_sites(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    clock_in TIMESTAMPTZ,
    lunch_start TIMESTAMPTZ,
    lunch_end TIMESTAMPTZ,
    clock_out TIMESTAMPTZ,
    total_hours DECIMAL(4,2) DEFAULT 0,
    overtime_hours DECIMAL(4,2) DEFAULT 0,
    status public.attendance_status DEFAULT 'present',
    notes TEXT,
    location_in TEXT,
    location_out TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 5. Weekly Payroll Estimations  
CREATE TABLE public.payroll_estimations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES public.employee_profiles(id) ON DELETE CASCADE,
    week_start DATE NOT NULL,
    week_end DATE NOT NULL,
    regular_hours DECIMAL(5,2) DEFAULT 0,
    overtime_hours DECIMAL(5,2) DEFAULT 0,
    base_pay DECIMAL(10,2) DEFAULT 0,
    overtime_pay DECIMAL(10,2) DEFAULT 0,
    bonuses DECIMAL(10,2) DEFAULT 0,
    deductions DECIMAL(10,2) DEFAULT 0,
    gross_total DECIMAL(10,2) DEFAULT 0,
    net_total DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 6. Incident Records
CREATE TABLE public.incident_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES public.employee_profiles(id) ON DELETE CASCADE,
    type public.incident_type NOT NULL,
    date DATE NOT NULL,
    description TEXT,
    status public.incident_status DEFAULT 'pendiente',
    approved_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 7. Indexes for Performance
CREATE INDEX idx_employee_profiles_user_id ON public.employee_profiles(user_id);
CREATE INDEX idx_employee_profiles_employee_id ON public.employee_profiles(employee_id);
CREATE INDEX idx_employee_profiles_status ON public.employee_profiles(status);
CREATE INDEX idx_employee_profiles_site_id ON public.employee_profiles(site_id);
CREATE INDEX idx_attendance_records_employee_date ON public.attendance_records(employee_id, date);
CREATE INDEX idx_attendance_records_site_date ON public.attendance_records(site_id, date);
CREATE INDEX idx_payroll_estimations_employee_week ON public.payroll_estimations(employee_id, week_start);
CREATE INDEX idx_incident_records_employee_id ON public.incident_records(employee_id);
CREATE INDEX idx_incident_records_status ON public.incident_records(status);

-- 8. Business Functions
CREATE OR REPLACE FUNCTION public.calculate_weekly_payroll(p_employee_id UUID, p_week_start DATE)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_employee_record RECORD;
    v_attendance_record RECORD;
    v_regular_hours DECIMAL(5,2) := 0;
    v_overtime_hours DECIMAL(5,2) := 0;
    v_base_pay DECIMAL(10,2) := 0;
    v_overtime_pay DECIMAL(10,2) := 0;
    v_gross_total DECIMAL(10,2) := 0;
    v_result JSONB;
BEGIN
    -- Get employee info
    SELECT ep.daily_salary, ep.full_name 
    INTO v_employee_record
    FROM public.employee_profiles ep 
    WHERE ep.id = p_employee_id AND ep.status = 'active';

    IF NOT FOUND THEN
        RETURN '{"error": "Employee not found or inactive"}'::JSONB;
    END IF;

    -- Calculate total hours for the week
    SELECT 
        COALESCE(SUM(ar.total_hours), 0) as total_regular,
        COALESCE(SUM(ar.overtime_hours), 0) as total_overtime
    INTO v_attendance_record
    FROM public.attendance_records ar
    WHERE ar.employee_id = p_employee_id 
    AND ar.date >= p_week_start 
    AND ar.date <= (p_week_start + INTERVAL '6 days')::DATE;

    v_regular_hours := COALESCE(v_attendance_record.total_regular, 0);
    v_overtime_hours := COALESCE(v_attendance_record.total_overtime, 0);

    -- Calculate pay (daily_salary is per day, convert to hourly rate assuming 8 hours/day)
    v_base_pay := (v_employee_record.daily_salary / 8.0) * v_regular_hours;
    v_overtime_pay := (v_employee_record.daily_salary / 8.0) * v_overtime_hours * 1.5;
    v_gross_total := v_base_pay + v_overtime_pay;

    -- Create result JSON
    v_result := jsonb_build_object(
        'employee_name', v_employee_record.full_name,
        'week_start', p_week_start,
        'week_end', (p_week_start + INTERVAL '6 days')::DATE,
        'regular_hours', v_regular_hours,
        'overtime_hours', v_overtime_hours,
        'base_pay', v_base_pay,
        'overtime_pay', v_overtime_pay,
        'bonuses', 0,
        'deductions', 0,
        'gross_total', v_gross_total,
        'net_total', v_gross_total
    );

    -- Update or insert payroll estimation
    INSERT INTO public.payroll_estimations (
        employee_id, week_start, week_end, regular_hours, overtime_hours,
        base_pay, overtime_pay, gross_total, net_total
    ) VALUES (
        p_employee_id, p_week_start, (p_week_start + INTERVAL '6 days')::DATE,
        v_regular_hours, v_overtime_hours, v_base_pay, v_overtime_pay,
        v_gross_total, v_gross_total
    ) ON CONFLICT (employee_id, week_start) DO UPDATE SET
        regular_hours = EXCLUDED.regular_hours,
        overtime_hours = EXCLUDED.overtime_hours,
        base_pay = EXCLUDED.base_pay,
        overtime_pay = EXCLUDED.overtime_pay,
        gross_total = EXCLUDED.gross_total,
        net_total = EXCLUDED.net_total,
        updated_at = CURRENT_TIMESTAMP;

    RETURN v_result;
END;
$$;

-- Function to soft delete employees (SuperAdmin only)
CREATE OR REPLACE FUNCTION public.soft_delete_employee(p_employee_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if employee exists and is not already deleted
    IF NOT EXISTS (
        SELECT 1 FROM public.employee_profiles 
        WHERE id = p_employee_id AND deleted_at IS NULL
    ) THEN
        RETURN '{"success": false, "error": "Employee not found or already deleted"}'::JSONB;
    END IF;

    -- Soft delete employee
    UPDATE public.employee_profiles 
    SET 
        status = 'deleted',
        deleted_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_employee_id;

    -- Log the deletion
    INSERT INTO public.logs_actividad (usuario_id, rol, accion, modulo, descripcion)
    VALUES (
        auth.uid(), 
        'superadmin', 
        'delete',
        'Employee Management', 
        'Employee soft deleted: ' || p_employee_id::TEXT
    );

    RETURN '{"success": true, "message": "Employee deleted successfully"}'::JSONB;
END;
$$;

-- 9. Enable RLS
ALTER TABLE public.construction_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_estimations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incident_records ENABLE ROW LEVEL SECURITY;

-- 10. RLS Policies

-- Pattern 6A: Use auth metadata for admin checks
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

-- Construction Sites - Admin access
CREATE POLICY "admin_full_access_construction_sites"
ON public.construction_sites
FOR ALL
TO authenticated
USING (public.is_admin_from_auth())
WITH CHECK (public.is_admin_from_auth());

-- Employee Profiles - Users can view their own, admins see all
CREATE POLICY "users_view_own_employee_profile"
ON public.employee_profiles
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.is_admin_from_auth());

CREATE POLICY "admin_full_access_employee_profiles"
ON public.employee_profiles
FOR ALL
TO authenticated
USING (public.is_admin_from_auth())
WITH CHECK (public.is_admin_from_auth());

-- Attendance Records - Users manage own, admins see all
CREATE POLICY "users_manage_own_attendance_records"
ON public.attendance_records
FOR ALL
TO authenticated
USING (
    employee_id IN (
        SELECT id FROM public.employee_profiles WHERE user_id = auth.uid()
    )
)
WITH CHECK (
    employee_id IN (
        SELECT id FROM public.employee_profiles WHERE user_id = auth.uid()
    )
);

CREATE POLICY "admin_full_access_attendance_records"
ON public.attendance_records
FOR ALL
TO authenticated
USING (public.is_admin_from_auth())
WITH CHECK (public.is_admin_from_auth());

-- Payroll Estimations - Users view own, admins manage all
CREATE POLICY "users_view_own_payroll_estimations"
ON public.payroll_estimations
FOR SELECT
TO authenticated
USING (
    employee_id IN (
        SELECT id FROM public.employee_profiles WHERE user_id = auth.uid()
    ) OR public.is_admin_from_auth()
);

CREATE POLICY "admin_full_access_payroll_estimations"
ON public.payroll_estimations
FOR ALL
TO authenticated
USING (public.is_admin_from_auth())
WITH CHECK (public.is_admin_from_auth());

-- Incident Records - Users manage own, admins see all
CREATE POLICY "users_manage_own_incident_records"
ON public.incident_records
FOR ALL
TO authenticated
USING (
    employee_id IN (
        SELECT id FROM public.employee_profiles WHERE user_id = auth.uid()
    )
)
WITH CHECK (
    employee_id IN (
        SELECT id FROM public.employee_profiles WHERE user_id = auth.uid()
    )
);

CREATE POLICY "admin_full_access_incident_records"
ON public.incident_records
FOR ALL
TO authenticated
USING (public.is_admin_from_auth())
WITH CHECK (public.is_admin_from_auth());

-- 11. Triggers for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

CREATE TRIGGER update_construction_sites_updated_at
    BEFORE UPDATE ON public.construction_sites
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employee_profiles_updated_at
    BEFORE UPDATE ON public.employee_profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_attendance_records_updated_at
    BEFORE UPDATE ON public.attendance_records
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payroll_estimations_updated_at
    BEFORE UPDATE ON public.payroll_estimations
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_incident_records_updated_at
    BEFORE UPDATE ON public.incident_records
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 12. Mock Data
DO $$
DECLARE
    admin_user_id UUID;
    employee1_user_id UUID := gen_random_uuid();
    employee2_user_id UUID := gen_random_uuid();
    site1_id UUID := gen_random_uuid();
    site2_id UUID := gen_random_uuid();
    emp1_profile_id UUID := gen_random_uuid();
    emp2_profile_id UUID := gen_random_uuid();
BEGIN
    -- Get existing admin user
    SELECT id INTO admin_user_id FROM public.user_profiles 
    WHERE role = 'superadmin' OR is_super_admin = true LIMIT 1;

    -- Create construction sites
    INSERT INTO public.construction_sites (id, name, location, description) VALUES
        (site1_id, 'Obra Central', 'Av. Principal 123, Ciudad de México', 'Construcción de edificio principal'),
        (site2_id, 'Proyecto Norte', 'Calle Norte 456, Guadalajara', 'Complejo residencial');

    -- Create auth users for employees
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        created_at, updated_at, raw_user_meta_data, raw_app_meta_data,
        is_sso_user, is_anonymous, confirmation_token, confirmation_sent_at,
        recovery_token, recovery_sent_at, email_change_token_new, email_change,
        email_change_sent_at, email_change_token_current, email_change_confirm_status,
        reauthentication_token, reauthentication_sent_at, phone, phone_change,
        phone_change_token, phone_change_sent_at
    ) VALUES
        (employee1_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         'juan.perez@asistenciapro.com', crypt('Usuario123!', gen_salt('bf', 10)), now(), now(), now(),
         '{"full_name": "Juan Pérez García", "role": "user"}'::jsonb,
         '{"provider": "email", "providers": ["email"]}'::jsonb,
         false, false, '', null, '', null, '', '', null, '', 0, '', null, '+34600123456', '', '', null),
        (employee2_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         'maria.gonzalez@asistenciapro.com', crypt('Usuario123!', gen_salt('bf', 10)), now(), now(), now(),
         '{"full_name": "María González López", "role": "user"}'::jsonb,
         '{"provider": "email", "providers": ["email"]}'::jsonb,
         false, false, '', null, '', null, '', '', null, '', 0, '', null, '+34600234567', '', '', null)
    ON CONFLICT (id) DO NOTHING;

    -- Create user profiles for employees
    INSERT INTO public.user_profiles (
        id, email, full_name, role, phone, created_at, updated_at
    ) VALUES
        (employee1_user_id, 'juan.perez@asistenciapro.com', 'Juan Pérez García', 'user', '+34600123456', now(), now()),
        (employee2_user_id, 'maria.gonzalez@asistenciapro.com', 'María González López', 'user', '+34600234567', now(), now())
    ON CONFLICT (id) DO NOTHING;

    -- Create employee profiles
    INSERT INTO public.employee_profiles (
        id, user_id, employee_id, full_name, phone, id_number, birth_date, address,
        emergency_contact, hire_date, daily_salary, site_id, supervisor_id, status
    ) VALUES
        (emp1_profile_id, employee1_user_id, 'EMP001', 'Juan Pérez García', '+34600123456', 
         '12345678A', '1985-03-15', 'Calle Mayor 123, Madrid',
         'María Pérez - +34600654321', '2023-01-15', 250.00, site1_id, admin_user_id, 'active'),
        (emp2_profile_id, employee2_user_id, 'EMP002', 'María González López', '+34600234567',
         '23456789B', '1990-07-22', 'Avenida Libertad 45, Barcelona', 
         'Pedro González - +34600765432', '2023-03-10', 230.00, site2_id, admin_user_id, 'active');

    -- Create sample attendance records for current week
    INSERT INTO public.attendance_records (
        employee_id, site_id, date, clock_in, clock_out, total_hours, status
    ) VALUES
        (emp1_profile_id, site1_id, CURRENT_DATE - INTERVAL '1 day',
         CURRENT_DATE - INTERVAL '1 day' + TIME '08:00:00',
         CURRENT_DATE - INTERVAL '1 day' + TIME '17:00:00', 8.0, 'present'),
        (emp2_profile_id, site2_id, CURRENT_DATE - INTERVAL '1 day',
         CURRENT_DATE - INTERVAL '1 day' + TIME '08:30:00',
         CURRENT_DATE - INTERVAL '1 day' + TIME '17:30:00', 8.0, 'late'),
        (emp1_profile_id, site1_id, CURRENT_DATE,
         CURRENT_DATE + TIME '08:00:00',
         null, 0, 'present'),
        (emp2_profile_id, site2_id, CURRENT_DATE,
         CURRENT_DATE + TIME '08:15:00',
         null, 0, 'present');

    -- Calculate initial payroll estimations
    PERFORM public.calculate_weekly_payroll(emp1_profile_id, date_trunc('week', CURRENT_DATE)::DATE);
    PERFORM public.calculate_weekly_payroll(emp2_profile_id, date_trunc('week', CURRENT_DATE)::DATE);

EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'Foreign key error in mock data: %', SQLERRM;
    WHEN unique_violation THEN
        RAISE NOTICE 'Unique constraint error in mock data: %', SQLERRM;
    WHEN OTHERS THEN
        RAISE NOTICE 'Unexpected error in mock data: %', SQLERRM;
END $$;

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated, anon;