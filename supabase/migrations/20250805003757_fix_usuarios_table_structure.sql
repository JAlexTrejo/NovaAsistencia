-- Location: supabase/migrations/20250805003757_fix_usuarios_table_structure.sql
-- Fix: Ensure usuarios table exists with correct structure
-- Issue: Code references 'usuarios' table but migrations created inconsistent structures

-- 1. Create usuarios table if it doesn't exist (primary structure)
CREATE TABLE IF NOT EXISTS public.usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    correo TEXT NOT NULL UNIQUE,
    nombre TEXT NOT NULL,
    telefono TEXT,
    rol public.user_role DEFAULT 'user'::public.user_role,
    rol_id INTEGER REFERENCES public.roles(id) DEFAULT 1,
    obra_id INTEGER REFERENCES public.obras(id),
    activo BOOLEAN DEFAULT true,
    ultimo_acceso TIMESTAMPTZ,
    foto_perfil_url TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. Migrate data from user_profiles to usuarios if user_profiles exists
DO $$
BEGIN
    -- Check if user_profiles table exists and has data
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles' AND table_schema = 'public') THEN
        -- Migrate data from user_profiles to usuarios
        INSERT INTO public.usuarios (id, correo, nombre, telefono, rol, activo, created_at, updated_at)
        SELECT 
            up.id,
            up.email,
            up.full_name,
            up.phone,
            CASE 
                WHEN up.role::text = 'administrador' THEN 'admin'::public.user_role
                WHEN up.role::text = 'superadmin' THEN 'superadmin'::public.user_role
                WHEN up.role::text = 'usuario' THEN 'user'::public.user_role
                ELSE 'user'::public.user_role
            END,
            COALESCE(up.is_active, true),
            up.created_at,
            up.updated_at
        FROM public.user_profiles up
        WHERE NOT EXISTS (
            SELECT 1 FROM public.usuarios u WHERE u.id = up.id
        );
        
        RAISE NOTICE 'Migrated data from user_profiles to usuarios';
    END IF;
END $$;

-- 3. Create essential indexes
CREATE INDEX IF NOT EXISTS idx_usuarios_correo ON public.usuarios(correo);
CREATE INDEX IF NOT EXISTS idx_usuarios_rol ON public.usuarios(rol);
CREATE INDEX IF NOT EXISTS idx_usuarios_activo ON public.usuarios(activo);
CREATE INDEX IF NOT EXISTS idx_usuarios_obra_id ON public.usuarios(obra_id);

-- 4. Enable RLS
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies (drop existing first to avoid conflicts)
DROP POLICY IF EXISTS "users_manage_own_usuarios" ON public.usuarios;
DROP POLICY IF EXISTS "users_view_own_profile" ON public.usuarios;
DROP POLICY IF EXISTS "users_update_own_profile" ON public.usuarios;
DROP POLICY IF EXISTS "superadmin_manage_all_usuarios" ON public.usuarios;
DROP POLICY IF EXISTS "service_role_insert_usuarios" ON public.usuarios;
DROP POLICY IF EXISTS "anon_insert_usuarios_on_signup" ON public.usuarios;
DROP POLICY IF EXISTS "auth_users_insert_own_profile" ON public.usuarios;
DROP POLICY IF EXISTS "superadmin_full_access_usuarios" ON public.usuarios;

-- Pattern 1: Core user table - Simple ownership
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

-- Superadmin access using auth metadata
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

-- 6. Update/Create the user creation trigger function
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

-- 7. Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon, service_role;
GRANT ALL ON public.usuarios TO authenticated, service_role;
GRANT SELECT, INSERT ON public.usuarios TO anon;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated, anon, service_role;

-- 9. Create updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_usuarios_updated_at ON public.usuarios;
CREATE TRIGGER update_usuarios_updated_at
    BEFORE UPDATE ON public.usuarios
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 10. Success message
DO $$
BEGIN
    RAISE NOTICE 'Fixed usuarios table structure and RLS policies';
    RAISE NOTICE 'Table usuarios now exists with proper structure';
    RAISE NOTICE 'All related code should now work correctly';
END $$;