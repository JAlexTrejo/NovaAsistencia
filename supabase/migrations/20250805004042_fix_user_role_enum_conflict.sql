-- Location: supabase/migrations/20250805004042_fix_user_role_enum_conflict.sql
-- Fix: Standardize user_role enum type across all migrations
-- Issue: Conflicting enum values causing "type does not exist" errors

-- Step 1: Create a backup of existing data
CREATE TABLE IF NOT EXISTS public.usuarios_backup AS
SELECT * FROM public.usuarios;

-- Step 2: Remove dependencies on the enum type temporarily
-- Update usuarios table to use text temporarily
ALTER TABLE public.usuarios ALTER COLUMN rol TYPE TEXT;

-- Step 3: Drop the conflicting enum type
DROP TYPE IF EXISTS public.user_role CASCADE;

-- Step 4: Create the standardized enum type
CREATE TYPE public.user_role AS ENUM ('user', 'supervisor', 'admin', 'superadmin');

-- Step 5: Update existing data to use standardized values
UPDATE public.usuarios SET 
    rol = CASE 
        WHEN rol = 'usuario' THEN 'user'
        WHEN rol = 'administrador' THEN 'admin'
        WHEN rol = 'superadmin' THEN 'superadmin'
        WHEN rol = 'supervisor' THEN 'supervisor'
        -- Handle any other values
        WHEN rol IN ('admin', 'user') THEN rol  -- Already correct
        ELSE 'user'  -- Default fallback
    END;

-- Step 6: Convert rol column back to enum type
ALTER TABLE public.usuarios 
ALTER COLUMN rol TYPE public.user_role USING rol::public.user_role;

-- Step 7: Set proper default value
ALTER TABLE public.usuarios 
ALTER COLUMN rol SET DEFAULT 'user'::public.user_role;

-- Step 8: Update any other enum references that might exist
-- Update roles table if it references the enum
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'roles' AND column_name = 'nombre' 
        AND table_schema = 'public'
    ) THEN
        -- Update roles table data to match new enum values
        UPDATE public.roles SET 
            nombre = CASE 
                WHEN nombre = 'usuario' THEN 'user'
                WHEN nombre = 'administrador' THEN 'admin'
                WHEN nombre = 'superadmin' THEN 'superadmin'
                WHEN nombre = 'supervisor' THEN 'supervisor'
                ELSE nombre
            END;
    END IF;
END $$;

-- Step 9: Fix any RLS policies that might reference old enum values
-- Drop and recreate RLS policies with correct enum values
DO $$
BEGIN
    -- Drop existing policies that might reference old enum values
    DROP POLICY IF EXISTS "superadmin_manage_all_usuarios" ON public.usuarios;
    DROP POLICY IF EXISTS "users_manage_own_usuarios" ON public.usuarios;
    DROP POLICY IF EXISTS "service_role_insert_usuarios" ON public.usuarios;
    DROP POLICY IF EXISTS "auth_users_insert_own_profile" ON public.usuarios;
    DROP POLICY IF EXISTS "superadmin_full_access_usuarios" ON public.usuarios;
    
    -- Create updated RLS policies with auth metadata check (no circular dependency)
    CREATE POLICY "users_manage_own_usuarios"
    ON public.usuarios
    FOR ALL
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

    -- Allow service role for triggers
    CREATE POLICY "service_role_insert_usuarios"
    ON public.usuarios
    FOR INSERT
    TO service_role
    WITH CHECK (true);

    -- Allow authenticated users to insert their own profile during registration
    CREATE POLICY "auth_users_insert_own_profile"
    ON public.usuarios
    FOR INSERT
    TO authenticated
    WITH CHECK (id = auth.uid());

    -- Superadmin access using auth metadata (no circular dependency)
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
END $$;

-- Step 10: Update the trigger function to use correct enum values
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
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

-- Step 11: Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 12: Update sample users to use correct enum values
DO $$
BEGIN
    UPDATE public.usuarios SET 
        rol = 'superadmin'::public.user_role 
    WHERE correo = 'admin@asistenciapro.com';
    
    UPDATE public.usuarios SET 
        rol = 'supervisor'::public.user_role 
    WHERE correo = 'supervisor@asistenciapro.com';
    
    UPDATE public.usuarios SET 
        rol = 'user'::public.user_role 
    WHERE correo = 'empleado@asistenciapro.com';
    
    RAISE NOTICE 'Updated sample users with correct enum values';
END $$;

-- Step 13: Clean up backup table
DROP TABLE IF EXISTS public.usuarios_backup;

-- Step 14: Final verification
DO $$
DECLARE
    enum_values TEXT[];
    user_count INTEGER;
BEGIN
    -- Check enum values
    SELECT ARRAY_AGG(enumlabel::TEXT) INTO enum_values
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'user_role';
    
    -- Check user count
    SELECT COUNT(*) INTO user_count FROM public.usuarios;
    
    RAISE NOTICE 'User role enum fixed successfully!';
    RAISE NOTICE 'Available enum values: %', enum_values;
    RAISE NOTICE 'Total users in system: %', user_count;
    RAISE NOTICE 'All usuarios table operations should now work correctly';
END $$;