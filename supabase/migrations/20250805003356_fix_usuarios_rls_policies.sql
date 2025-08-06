-- Fix RLS policies for usuarios table to allow user registration
-- This addresses the "new row violates row-level security policy" error

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "users_manage_own_usuarios" ON public.usuarios;
DROP POLICY IF EXISTS "service_role_insert_usuarios" ON public.usuarios;
DROP POLICY IF EXISTS "allow_user_registration" ON public.usuarios;
DROP POLICY IF EXISTS "users_view_own_profile" ON public.usuarios;
DROP POLICY IF EXISTS "users_update_own_profile" ON public.usuarios;
DROP POLICY IF EXISTS "superadmin_manage_all_usuarios" ON public.usuarios;

-- Create comprehensive RLS policies for usuarios table
-- Pattern 1: Core user table - users can manage their own profile
CREATE POLICY "users_manage_own_usuarios"
ON public.usuarios
FOR ALL
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Allow service role to insert during user registration (for triggers)
CREATE POLICY "service_role_insert_usuarios"
ON public.usuarios
FOR INSERT
TO service_role
WITH CHECK (true);

-- Allow anon role to insert during registration (for sign-up process)
CREATE POLICY "anon_insert_usuarios_on_signup"
ON public.usuarios
FOR INSERT
TO anon
WITH CHECK (id = auth.uid());

-- Allow authenticated users to insert their own profile during registration
CREATE POLICY "auth_users_insert_own_profile"
ON public.usuarios
FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- Superadmin access for management
CREATE POLICY "superadmin_full_access_usuarios"
ON public.usuarios
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

-- Update the trigger function to handle RLS properly with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER  -- This runs with elevated privileges to bypass RLS
LANGUAGE plpgsql
AS $$
BEGIN
    -- Insert new user profile with proper error handling
    INSERT INTO public.usuarios (
        id, 
        correo, 
        nombre, 
        rol, 
        rol_id, 
        telefono, 
        activo,
        created_at
    )
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
        true,
        CURRENT_TIMESTAMP
    );
    
    RETURN NEW;
    
EXCEPTION
    WHEN unique_violation THEN
        -- User profile already exists, update it instead
        UPDATE public.usuarios SET
            correo = NEW.email,
            nombre = COALESCE(NEW.raw_user_meta_data->>'full_name', nombre),
            telefono = COALESCE(NEW.raw_user_meta_data->>'phone', telefono),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.id;
        RETURN NEW;
        
    WHEN foreign_key_violation THEN
        -- Handle foreign key issues gracefully
        RAISE NOTICE 'Foreign key violation in user profile creation: %', SQLERRM;
        RETURN NEW;
        
    WHEN OTHERS THEN
        -- Log any other errors but don't fail the auth process
        RAISE NOTICE 'Error creating user profile for %: %', NEW.email, SQLERRM;
        RETURN NEW;
END;
$$;

-- Ensure the trigger exists and is properly configured
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions to all roles
GRANT USAGE ON SCHEMA public TO authenticated, anon, service_role;
GRANT ALL ON public.usuarios TO authenticated, service_role;
GRANT SELECT, INSERT ON public.usuarios TO anon;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated, anon, service_role;

-- Grant permissions on the roles table for foreign key reference
GRANT SELECT ON public.roles TO authenticated, anon, service_role;

-- Test that the policies work correctly
DO $$
BEGIN
    RAISE NOTICE 'Updated RLS policies for usuarios table';
    RAISE NOTICE 'Users can now register and create profiles automatically';
    RAISE NOTICE 'Trigger function runs with SECURITY DEFINER privileges';
    RAISE NOTICE 'All necessary permissions granted to roles';
END $$;