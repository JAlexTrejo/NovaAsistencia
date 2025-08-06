-- Location: supabase/migrations/20250804210317_add_superadmin_user.sql
-- Schema Analysis: Existing complete schema with user_profiles table
-- Integration Type: Add SuperAdmin user to existing system
-- Dependencies: Existing user_profiles table and auth system

-- Add SuperAdmin user with specific credentials
DO $$
DECLARE
    superadmin_uuid UUID := gen_random_uuid();
BEGIN
    -- Create auth user with complete field structure
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        created_at, updated_at, raw_user_meta_data, raw_app_meta_data,
        is_sso_user, is_anonymous, confirmation_token, confirmation_sent_at,
        recovery_token, recovery_sent_at, email_change_token_new, email_change,
        email_change_sent_at, email_change_token_current, email_change_confirm_status,
        reauthentication_token, reauthentication_sent_at, phone, phone_change,
        phone_change_token, phone_change_sent_at
    ) VALUES
        (superadmin_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         'jose.alejandrotrejoc@gmail.com', crypt('Asdreth3324*', gen_salt('bf', 10)), now(), now(), now(),
         '{"full_name": "José Alejandro Trejo Contreras", "role": "superadmin"}'::jsonb, 
         '{"provider": "email", "providers": ["email"]}'::jsonb,
         false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null);

    -- Update user profile with SuperAdmin details
    UPDATE public.user_profiles SET 
        full_name = 'José Alejandro Trejo Contreras',
        role = 'superadmin'::public.user_role,
        employee_id = 'SUPER001',
        phone = null,
        is_active = true
    WHERE id = superadmin_uuid;

    RAISE NOTICE 'SuperAdmin user created successfully with email: jose.alejandrotrejoc@gmail.com';
    
EXCEPTION
    WHEN unique_violation THEN
        RAISE NOTICE 'SuperAdmin user with this email already exists';
    WHEN OTHERS THEN
        RAISE NOTICE 'Error creating SuperAdmin user: %', SQLERRM;
END $$;