-- Location: supabase/migrations/20250807221645_add_job_positions_and_enhancements.sql
-- Schema Analysis: Existing payroll system with employee_profiles, attendance_records, payroll_estimations
-- Integration Type: Enhancement - Adding missing job positions and enhanced payroll features
-- Dependencies: employee_profiles, user_profiles, payroll_estimations

-- 1. Add job position enum type
CREATE TYPE public.job_position AS ENUM (
    'albañil',
    'ayudante',
    'supervisor',
    'administrativo',
    'electricista',
    'plomero',
    'pintor',
    'carpintero',
    'soldador',
    'operador_maquinaria'
);

-- 2. Add position column to employee_profiles
ALTER TABLE public.employee_profiles 
ADD COLUMN position public.job_position DEFAULT 'albañil'::public.job_position;

-- Add hourly rate support (alongside existing daily_salary)
ALTER TABLE public.employee_profiles 
ADD COLUMN hourly_rate NUMERIC(10,2) DEFAULT 0;

-- Add salary type to distinguish between daily and hourly workers
ALTER TABLE public.employee_profiles 
ADD COLUMN salary_type TEXT DEFAULT 'daily' CHECK (salary_type IN ('daily', 'hourly', 'project'));

-- Add profile picture support
ALTER TABLE public.employee_profiles 
ADD COLUMN profile_picture_url TEXT;

-- 3. Add enhanced payroll calculations table for bonuses and deductions
CREATE TABLE public.payroll_calculations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES public.employee_profiles(id) ON DELETE CASCADE,
    calculation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    calculation_type TEXT NOT NULL CHECK (calculation_type IN ('weekly', 'christmas_bonus', 'severance')),
    
    -- Base calculations
    regular_hours NUMERIC(5,2) DEFAULT 0,
    overtime_hours NUMERIC(5,2) DEFAULT 0,
    base_pay NUMERIC(10,2) DEFAULT 0,
    overtime_pay NUMERIC(10,2) DEFAULT 0,
    
    -- Bonuses
    christmas_bonus NUMERIC(10,2) DEFAULT 0,
    performance_bonus NUMERIC(10,2) DEFAULT 0,
    attendance_bonus NUMERIC(10,2) DEFAULT 0,
    other_bonuses NUMERIC(10,2) DEFAULT 0,
    
    -- Deductions
    tax_deductions NUMERIC(10,2) DEFAULT 0,
    social_security NUMERIC(10,2) DEFAULT 0,
    incident_deductions NUMERIC(10,2) DEFAULT 0,
    other_deductions NUMERIC(10,2) DEFAULT 0,
    
    -- Severance calculations
    severance_days_worked NUMERIC(5,2) DEFAULT 0,
    severance_vacation_days NUMERIC(5,2) DEFAULT 0,
    severance_proportional_benefits NUMERIC(10,2) DEFAULT 0,
    
    -- Totals
    gross_total NUMERIC(10,2) DEFAULT 0,
    net_total NUMERIC(10,2) DEFAULT 0,
    
    -- Metadata
    calculated_by UUID REFERENCES public.user_profiles(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create indexes for performance
CREATE INDEX idx_employee_profiles_position ON public.employee_profiles(position);
CREATE INDEX idx_employee_profiles_salary_type ON public.employee_profiles(salary_type);
CREATE INDEX idx_payroll_calculations_employee_date ON public.payroll_calculations(employee_id, calculation_date);
CREATE INDEX idx_payroll_calculations_type ON public.payroll_calculations(calculation_type);

-- 5. Enable RLS on new table
ALTER TABLE public.payroll_calculations ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies
CREATE POLICY "users_view_own_payroll_calculations"
ON public.payroll_calculations
FOR SELECT
TO authenticated
USING (
    employee_id IN (
        SELECT id FROM public.employee_profiles 
        WHERE user_id = auth.uid()
    )
    OR is_admin_from_auth()
);

CREATE POLICY "admin_full_access_payroll_calculations"
ON public.payroll_calculations
FOR ALL
TO authenticated
USING (is_admin_from_auth())
WITH CHECK (is_admin_from_auth());

-- 7. Add trigger for updated_at
CREATE TRIGGER update_payroll_calculations_updated_at
    BEFORE UPDATE ON public.payroll_calculations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 8. Enhanced payroll calculation function
CREATE OR REPLACE FUNCTION public.calculate_comprehensive_payroll(
    p_employee_id UUID,
    p_period_start DATE,
    p_period_end DATE DEFAULT NULL,
    p_calculation_type TEXT DEFAULT 'weekly'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_employee RECORD;
    v_attendance RECORD;
    v_result JSONB;
    v_regular_hours DECIMAL(5,2) := 0;
    v_overtime_hours DECIMAL(5,2) := 0;
    v_base_pay DECIMAL(10,2) := 0;
    v_overtime_pay DECIMAL(10,2) := 0;
    v_christmas_bonus DECIMAL(10,2) := 0;
    v_severance_total DECIMAL(10,2) := 0;
    v_gross_total DECIMAL(10,2) := 0;
    v_net_total DECIMAL(10,2) := 0;
    v_end_date DATE;
BEGIN
    -- Set default end date if not provided
    v_end_date := COALESCE(p_period_end, p_period_start + INTERVAL '6 days');
    
    -- Get employee information
    SELECT 
        ep.full_name,
        ep.daily_salary,
        ep.hourly_rate,
        ep.salary_type,
        ep.position,
        ep.hire_date
    INTO v_employee
    FROM public.employee_profiles ep
    WHERE ep.id = p_employee_id AND ep.status = 'active';
    
    IF NOT FOUND THEN
        RETURN '{"error": "Employee not found or inactive"}'::JSONB;
    END IF;
    
    -- Calculate attendance totals for the period
    SELECT 
        COALESCE(SUM(ar.total_hours), 0) as total_regular,
        COALESCE(SUM(ar.overtime_hours), 0) as total_overtime
    INTO v_attendance
    FROM public.attendance_records ar
    WHERE ar.employee_id = p_employee_id 
    AND ar.date >= p_period_start 
    AND ar.date <= v_end_date;
    
    v_regular_hours := COALESCE(v_attendance.total_regular, 0);
    v_overtime_hours := COALESCE(v_attendance.total_overtime, 0);
    
    -- Calculate base pay based on salary type
    IF v_employee.salary_type = 'hourly' THEN
        v_base_pay := v_employee.hourly_rate * v_regular_hours;
        v_overtime_pay := v_employee.hourly_rate * v_overtime_hours * 1.5;
    ELSE
        -- Daily salary converted to hourly (8 hours per day)
        v_base_pay := (v_employee.daily_salary / 8.0) * v_regular_hours;
        v_overtime_pay := (v_employee.daily_salary / 8.0) * v_overtime_hours * 1.5;
    END IF;
    
    -- Calculate Christmas bonus (if requested)
    IF p_calculation_type = 'christmas_bonus' THEN
        -- Assuming 15 days of salary as Christmas bonus
        v_christmas_bonus := v_employee.daily_salary * 15;
    END IF;
    
    -- Calculate severance (if requested)
    IF p_calculation_type = 'severance' THEN
        DECLARE
            v_years_worked DECIMAL(5,2);
            v_pending_vacation_days DECIMAL(5,2) := 0;
        BEGIN
            -- Calculate years worked
            v_years_worked := EXTRACT(EPOCH FROM (CURRENT_DATE - v_employee.hire_date)) / (365.25 * 24 * 3600);
            
            -- Basic severance: 1 month per year worked (minimum 3 months)
            v_severance_total := GREATEST(v_employee.daily_salary * 90, v_employee.daily_salary * 30 * v_years_worked);
            
            -- Add vacation days not taken (simplified calculation)
            v_pending_vacation_days := GREATEST(0, (v_years_worked * 12) - 0); -- Assuming no vacation tracking yet
            v_severance_total := v_severance_total + (v_employee.daily_salary * v_pending_vacation_days);
        END;
    END IF;
    
    -- Calculate totals
    v_gross_total := v_base_pay + v_overtime_pay + v_christmas_bonus + v_severance_total;
    v_net_total := v_gross_total; -- Simplified - no tax calculations yet
    
    -- Build result JSON
    v_result := jsonb_build_object(
        'employee_id', p_employee_id,
        'employee_name', v_employee.full_name,
        'position', v_employee.position,
        'salary_type', v_employee.salary_type,
        'calculation_type', p_calculation_type,
        'period_start', p_period_start,
        'period_end', v_end_date,
        'regular_hours', v_regular_hours,
        'overtime_hours', v_overtime_hours,
        'base_pay', v_base_pay,
        'overtime_pay', v_overtime_pay,
        'christmas_bonus', v_christmas_bonus,
        'severance_total', v_severance_total,
        'gross_total', v_gross_total,
        'net_total', v_net_total,
        'calculated_at', CURRENT_TIMESTAMP
    );
    
    -- Store calculation in database
    INSERT INTO public.payroll_calculations (
        employee_id, calculation_date, calculation_type,
        regular_hours, overtime_hours, base_pay, overtime_pay,
        christmas_bonus, severance_proportional_benefits,
        gross_total, net_total, calculated_by
    ) VALUES (
        p_employee_id, p_period_start, p_calculation_type,
        v_regular_hours, v_overtime_hours, v_base_pay, v_overtime_pay,
        v_christmas_bonus, v_severance_total,
        v_gross_total, v_net_total, auth.uid()
    ) ON CONFLICT (employee_id, calculation_date, calculation_type) DO UPDATE SET
        regular_hours = EXCLUDED.regular_hours,
        overtime_hours = EXCLUDED.overtime_hours,
        base_pay = EXCLUDED.base_pay,
        overtime_pay = EXCLUDED.overtime_pay,
        christmas_bonus = EXCLUDED.christmas_bonus,
        severance_proportional_benefits = EXCLUDED.severance_proportional_benefits,
        gross_total = EXCLUDED.gross_total,
        net_total = EXCLUDED.net_total,
        updated_at = CURRENT_TIMESTAMP;
    
    RETURN v_result;
END;
$function$;

-- 9. Add some sample position data to existing employees (if any exist)
DO $$
BEGIN
    -- Update existing employees with positions if they exist
    UPDATE public.employee_profiles 
    SET position = 'albañil'::public.job_position
    WHERE position IS NULL;
    
    -- Add sample positions variety
    UPDATE public.employee_profiles 
    SET position = 'supervisor'::public.job_position
    WHERE id IN (
        SELECT id FROM public.employee_profiles 
        WHERE supervisor_id IS NULL 
        LIMIT 2
    );
    
    RAISE NOTICE 'Job positions added successfully';
END $$;