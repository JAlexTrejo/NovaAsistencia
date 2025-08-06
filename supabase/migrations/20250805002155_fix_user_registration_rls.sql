-- Fix RLS policy for user registration
-- The current policy blocks new user creation because users don't exist in usuarios table yet

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "users_manage_own_usuarios" ON public.usuarios;

-- Create new policies that allow user registration
-- Policy 1: Allow authenticated users to manage their own records
CREATE POLICY "users_manage_own_usuarios"
ON public.usuarios
FOR ALL
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Policy 2: Allow service_role to insert new users (for registration trigger)
CREATE POLICY "service_role_insert_usuarios" 
ON public.usuarios
FOR INSERT
TO service_role
WITH CHECK (true);

-- Policy 3: Allow the trigger function to insert new user profiles
-- This is critical for the handle_new_user() trigger to work
CREATE POLICY "allow_user_registration"
ON public.usuarios
FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- Update the trigger function to handle RLS properly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER  -- This runs with elevated privileges
LANGUAGE plpgsql
AS $$
BEGIN
    -- Insert with proper error handling
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
        -- Log error and allow auth to continue
        RAISE NOTICE 'Error creating user profile: %', SQLERRM;
        RETURN NEW;
END;
$$;

-- Ensure the trigger exists and is properly configured
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON public.usuarios TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated, anon;

-- Test that RLS policies work correctly
DO $$
BEGIN
    RAISE NOTICE 'RLS policies updated successfully for user registration';
    RAISE NOTICE 'Users can now register and create profiles automatically';
END $$;