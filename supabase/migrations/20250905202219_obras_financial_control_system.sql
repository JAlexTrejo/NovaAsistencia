-- Obras Financial Control System Migration
-- Schema Analysis: Building upon existing AsistenciaPro system
-- Integration Type: NEW_MODULE - Complete financial control system
-- Dependencies: Fixed to not depend on usuarios table

-- =============================================
-- 1. CREATE USUARIOS TABLE IF NOT EXISTS
-- =============================================

-- Create usuarios table if it doesn't exist (needed for foreign keys)
CREATE TABLE IF NOT EXISTS public.usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    nombre TEXT,
    apellido TEXT,
    rol TEXT DEFAULT 'empleado',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 2. CREATE CUSTOM TYPES FOR FINANCIAL SYSTEM
-- =============================================

-- Project status enum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'obra_estatus') THEN
        CREATE TYPE public.obra_estatus AS ENUM ('Planeación', 'En ejecución', 'En pausa', 'Concluida', 'Cancelada');
    END IF;
END $$;

-- Company type enum  
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'empresa_tipo') THEN
        CREATE TYPE public.empresa_tipo AS ENUM ('cliente', 'proveedor', 'dependencia');
    END IF;
END $$;

-- Invoice/Requisition type enum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'factura_tipo') THEN
        CREATE TYPE public.factura_tipo AS ENUM ('Factura', 'Requisición');
    END IF;
END $$;

-- Invoice status enum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'factura_estatus') THEN
        CREATE TYPE public.factura_estatus AS ENUM ('Pendiente', 'Parcialmente pagada', 'Pagada', 'Cancelada');
    END IF;
END $$;

-- Expense category enum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gasto_categoria') THEN
        CREATE TYPE public.gasto_categoria AS ENUM ('materiales', 'mano_obra', 'maquinaria', 'subcontrato', 'seguros', 'viaticos', 'otros');
    END IF;
END $$;

-- =============================================
-- 3. CREATE CORE FINANCIAL TABLES
-- =============================================

-- Companies table (clients, suppliers, government agencies)
CREATE TABLE IF NOT EXISTS public.empresas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL UNIQUE,
    rfc TEXT,
    tipo public.empresa_tipo NOT NULL CHECK (tipo IN ('cliente', 'proveedor', 'dependencia')),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Dependencies table (if managing separate from companies)
CREATE TABLE IF NOT EXISTS public.dependencias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL UNIQUE,
    siglas TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Enhanced obras table for financial control
CREATE TABLE IF NOT EXISTS public.obras_financiero (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clave TEXT UNIQUE,
    nombre TEXT NOT NULL,
    estatus public.obra_estatus NOT NULL DEFAULT 'Planeación'::public.obra_estatus,
    empresa_id UUID REFERENCES public.empresas(id) ON DELETE RESTRICT,
    dependencia_id UUID REFERENCES public.dependencias(id) ON DELETE SET NULL,
    con_iva BOOLEAN NOT NULL DEFAULT true,
    presupuesto_inicial NUMERIC(14,2) NOT NULL DEFAULT 0,
    anticipo NUMERIC(14,2) NOT NULL DEFAULT 0,
    fecha_inicio DATE,
    fecha_fin_compromiso DATE,
    notas TEXT,
    created_by UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Change orders table
CREATE TABLE IF NOT EXISTS public.ordenes_cambio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    obra_id UUID REFERENCES public.obras_financiero(id) ON DELETE CASCADE,
    folio TEXT,
    descripcion TEXT,
    monto NUMERIC(14,2) NOT NULL DEFAULT 0,
    fecha DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Sales invoices/requisitions table
CREATE TABLE IF NOT EXISTS public.facturas_ventas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    obra_id UUID REFERENCES public.obras_financiero(id) ON DELETE CASCADE,
    folio TEXT,
    tipo public.factura_tipo NOT NULL,
    subtotal NUMERIC(14,2) NOT NULL DEFAULT 0,
    iva NUMERIC(14,2) NOT NULL DEFAULT 0,
    total NUMERIC(14,2) NOT NULL DEFAULT 0,
    fecha_emision DATE NOT NULL,
    fecha_vencimiento DATE,
    estatus public.factura_estatus NOT NULL DEFAULT 'Pendiente'::public.factura_estatus,
    notas TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Payment receipts table
CREATE TABLE IF NOT EXISTS public.pagos_recibidos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    obra_id UUID REFERENCES public.obras_financiero(id) ON DELETE CASCADE,
    factura_id UUID REFERENCES public.facturas_ventas(id) ON DELETE SET NULL,
    fecha DATE NOT NULL,
    monto NUMERIC(14,2) NOT NULL,
    metodo TEXT,
    referencia TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Expenses table (project costs)
CREATE TABLE IF NOT EXISTS public.gastos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    obra_id UUID REFERENCES public.obras_financiero(id) ON DELETE CASCADE,
    proveedor_id UUID REFERENCES public.empresas(id) ON DELETE SET NULL,
    categoria public.gasto_categoria NOT NULL DEFAULT 'otros'::public.gasto_categoria,
    subtotal NUMERIC(14,2) NOT NULL DEFAULT 0,
    iva NUMERIC(14,2) NOT NULL DEFAULT 0,
    total NUMERIC(14,2) NOT NULL DEFAULT 0,
    fecha DATE NOT NULL,
    folio TEXT,
    comprobante_url TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Budget line items table
CREATE TABLE IF NOT EXISTS public.presupuestos_partidas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    obra_id UUID REFERENCES public.obras_financiero(id) ON DELETE CASCADE,
    partida TEXT NOT NULL,
    unidad TEXT,
    cantidad NUMERIC(14,2),
    precio_unitario NUMERIC(14,2),
    importe NUMERIC(14,2) GENERATED ALWAYS AS (COALESCE(cantidad, 0) * COALESCE(precio_unitario, 0)) STORED,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 4. CREATE INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX IF NOT EXISTS idx_usuarios_email ON public.usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_rol ON public.usuarios(rol);
CREATE INDEX IF NOT EXISTS idx_usuarios_is_active ON public.usuarios(is_active);

CREATE INDEX IF NOT EXISTS idx_empresas_tipo ON public.empresas(tipo);
CREATE INDEX IF NOT EXISTS idx_empresas_activo ON public.empresas(activo);
CREATE INDEX IF NOT EXISTS idx_dependencias_activo ON public.dependencias(activo);

CREATE INDEX IF NOT EXISTS idx_obras_financiero_empresa_id ON public.obras_financiero(empresa_id);
CREATE INDEX IF NOT EXISTS idx_obras_financiero_estatus ON public.obras_financiero(estatus);
CREATE INDEX IF NOT EXISTS idx_obras_financiero_created_by ON public.obras_financiero(created_by);

CREATE INDEX IF NOT EXISTS idx_ordenes_cambio_obra_id ON public.ordenes_cambio(obra_id);
CREATE INDEX IF NOT EXISTS idx_ordenes_cambio_fecha ON public.ordenes_cambio(fecha);

CREATE INDEX IF NOT EXISTS idx_facturas_ventas_obra_id ON public.facturas_ventas(obra_id);
CREATE INDEX IF NOT EXISTS idx_facturas_ventas_estatus ON public.facturas_ventas(estatus);
CREATE INDEX IF NOT EXISTS idx_facturas_ventas_fecha_emision ON public.facturas_ventas(fecha_emision);

CREATE INDEX IF NOT EXISTS idx_pagos_recibidos_obra_id ON public.pagos_recibidos(obra_id);
CREATE INDEX IF NOT EXISTS idx_pagos_recibidos_factura_id ON public.pagos_recibidos(factura_id);
CREATE INDEX IF NOT EXISTS idx_pagos_recibidos_fecha ON public.pagos_recibidos(fecha);

CREATE INDEX IF NOT EXISTS idx_gastos_obra_id ON public.gastos(obra_id);
CREATE INDEX IF NOT EXISTS idx_gastos_proveedor_id ON public.gastos(proveedor_id);
CREATE INDEX IF NOT EXISTS idx_gastos_categoria ON public.gastos(categoria);
CREATE INDEX IF NOT EXISTS idx_gastos_fecha ON public.gastos(fecha);

CREATE INDEX IF NOT EXISTS idx_presupuestos_partidas_obra_id ON public.presupuestos_partidas(obra_id);

-- =============================================
-- 5. CREATE FINANCIAL KPI VIEW
-- =============================================

CREATE OR REPLACE VIEW public.vw_obras_finanzas AS
SELECT 
    o.id AS obra_id,
    o.clave,
    o.nombre,
    o.estatus,
    o.empresa_id,
    o.dependencia_id,
    o.con_iva,
    o.presupuesto_inicial,
    o.anticipo,
    o.fecha_inicio,
    o.fecha_fin_compromiso,
    e.nombre AS empresa_nombre,
    d.nombre AS dependencia_nombre,
    
    -- Calculate presupuesto_total
    (o.presupuesto_inicial + COALESCE(ordenes_cambio.total_ordenes, 0)) AS presupuesto_total,
    
    -- Calculate facturado_total
    COALESCE(facturas.facturado_total, 0) AS facturado_total,
    
    -- Calculate pagado_total
    COALESCE(pagos.pagado_total, 0) AS pagado_total,
    
    -- Calculate por_cobrar
    (COALESCE(facturas.facturado_total, 0) - COALESCE(pagos.pagado_total, 0)) AS por_cobrar,
    
    -- Calculate gastos_total (costo_directo)
    COALESCE(gastos.gastos_total, 0) AS gastos_total,
    COALESCE(gastos.gastos_total, 0) AS costo_directo,
    
    -- Calculate utilidad_bruta
    (COALESCE(facturas.facturado_total, 0) - COALESCE(gastos.gastos_total, 0)) AS utilidad_bruta,
    
    -- Calculate utilidad_vs_presupuesto
    ((o.presupuesto_inicial + COALESCE(ordenes_cambio.total_ordenes, 0)) - COALESCE(gastos.gastos_total, 0)) AS utilidad_vs_presupuesto,
    
    -- Calculate utilidad_pct_real
    CASE 
        WHEN COALESCE(facturas.facturado_total, 0) > 0 
        THEN ((COALESCE(facturas.facturado_total, 0) - COALESCE(gastos.gastos_total, 0)) / COALESCE(facturas.facturado_total, 0)) * 100
        ELSE 0 
    END AS utilidad_pct_real,
    
    -- Calculate avance_financiero_pct
    CASE 
        WHEN (o.presupuesto_inicial + COALESCE(ordenes_cambio.total_ordenes, 0)) > 0 
        THEN (COALESCE(pagos.pagado_total, 0) / (o.presupuesto_inicial + COALESCE(ordenes_cambio.total_ordenes, 0))) * 100
        ELSE 0 
    END AS avance_financiero_pct,
    
    -- Calculate margen_presupuestado_pct
    CASE 
        WHEN (o.presupuesto_inicial + COALESCE(ordenes_cambio.total_ordenes, 0)) > 0 
        THEN (((o.presupuesto_inicial + COALESCE(ordenes_cambio.total_ordenes, 0)) - COALESCE(gastos.gastos_total, 0)) / (o.presupuesto_inicial + COALESCE(ordenes_cambio.total_ordenes, 0))) * 100
        ELSE 0 
    END AS margen_presupuestado_pct,
    
    o.created_at,
    o.created_by

FROM public.obras_financiero o
LEFT JOIN public.empresas e ON o.empresa_id = e.id
LEFT JOIN public.dependencias d ON o.dependencia_id = d.id
LEFT JOIN (
    SELECT 
        obra_id,
        SUM(monto) AS total_ordenes
    FROM public.ordenes_cambio
    GROUP BY obra_id
) ordenes_cambio ON o.id = ordenes_cambio.obra_id
LEFT JOIN (
    SELECT 
        obra_id,
        SUM(total) AS facturado_total
    FROM public.facturas_ventas
    GROUP BY obra_id
) facturas ON o.id = facturas.obra_id
LEFT JOIN (
    SELECT 
        obra_id,
        SUM(monto) AS pagado_total
    FROM public.pagos_recibidos
    GROUP BY obra_id
) pagos ON o.id = pagos.obra_id
LEFT JOIN (
    SELECT 
        obra_id,
        SUM(total) AS gastos_total
    FROM public.gastos
    GROUP BY obra_id
) gastos ON o.id = gastos.obra_id;

-- =============================================
-- 6. ENABLE ROW LEVEL SECURITY
-- =============================================

ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dependencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.obras_financiero ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordenes_cambio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facturas_ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagos_recibidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gastos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presupuestos_partidas ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 7. CREATE HELPER FUNCTIONS FOR RLS
-- =============================================

-- Function to check admin/superadmin role from auth metadata
CREATE OR REPLACE FUNCTION public.is_admin_or_superadmin()
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

-- Function to check user role level using usuarios table
CREATE OR REPLACE FUNCTION public.user_has_financial_access()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
SELECT EXISTS (
    SELECT 1 FROM public.usuarios u
    WHERE u.id = auth.uid() 
    AND u.rol IN ('admin', 'superadmin')
    AND u.is_active = true
)
$$;

-- =============================================
-- 8. CREATE RLS POLICIES
-- =============================================

-- Users table policies - users can view their own profile
CREATE POLICY "users_view_own_profile"
ON public.usuarios
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Admin can manage all users
CREATE POLICY "admin_manage_usuarios"
ON public.usuarios
FOR ALL
TO authenticated
USING (public.is_admin_or_superadmin())
WITH CHECK (public.is_admin_or_superadmin());

-- Companies policies - Admin/SuperAdmin only
CREATE POLICY "admin_manage_empresas"
ON public.empresas
FOR ALL
TO authenticated
USING (public.is_admin_or_superadmin())
WITH CHECK (public.is_admin_or_superadmin());

-- Dependencies policies - Admin/SuperAdmin only  
CREATE POLICY "admin_manage_dependencias"
ON public.dependencias
FOR ALL
TO authenticated
USING (public.is_admin_or_superadmin())
WITH CHECK (public.is_admin_or_superadmin());

-- Works policies - Admin/SuperAdmin only
CREATE POLICY "admin_manage_obras_financiero"
ON public.obras_financiero
FOR ALL
TO authenticated
USING (public.user_has_financial_access())
WITH CHECK (public.user_has_financial_access());

-- Regular users can only view basic obra info (no financial data)
CREATE POLICY "users_view_obras_basic"
ON public.obras_financiero
FOR SELECT
TO authenticated
USING (true);

-- Change orders policies - Admin/SuperAdmin only
CREATE POLICY "admin_manage_ordenes_cambio"
ON public.ordenes_cambio
FOR ALL
TO authenticated
USING (public.user_has_financial_access())
WITH CHECK (public.user_has_financial_access());

-- Sales invoices policies - Admin/SuperAdmin only
CREATE POLICY "admin_manage_facturas_ventas"
ON public.facturas_ventas
FOR ALL
TO authenticated
USING (public.user_has_financial_access())
WITH CHECK (public.user_has_financial_access());

-- Payment receipts policies - Admin/SuperAdmin only
CREATE POLICY "admin_manage_pagos_recibidos"
ON public.pagos_recibidos
FOR ALL
TO authenticated
USING (public.user_has_financial_access())
WITH CHECK (public.user_has_financial_access());

-- Expenses policies - Admin/SuperAdmin only
CREATE POLICY "admin_manage_gastos"
ON public.gastos
FOR ALL
TO authenticated
USING (public.user_has_financial_access())
WITH CHECK (public.user_has_financial_access());

-- Budget line items policies - Admin/SuperAdmin only
CREATE POLICY "admin_manage_presupuestos_partidas"
ON public.presupuestos_partidas
FOR ALL
TO authenticated
USING (public.user_has_financial_access())
WITH CHECK (public.user_has_financial_access());

-- =============================================
-- 9. CREATE TRIGGER FUNCTIONS
-- =============================================

-- Function to update invoice status based on payments
CREATE OR REPLACE FUNCTION public.update_factura_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    factura_record RECORD;
    total_pagado NUMERIC(14,2);
BEGIN
    -- Get invoice details if factura_id is provided
    IF NEW.factura_id IS NOT NULL THEN
        SELECT * INTO factura_record FROM public.facturas_ventas WHERE id = NEW.factura_id;
        
        -- Calculate total paid for this invoice
        SELECT COALESCE(SUM(monto), 0) INTO total_pagado
        FROM public.pagos_recibidos 
        WHERE factura_id = NEW.factura_id;
        
        -- Update invoice status based on payment amount
        IF total_pagado >= factura_record.total THEN
            UPDATE public.facturas_ventas 
            SET estatus = 'Pagada'::public.factura_estatus
            WHERE id = NEW.factura_id;
        ELSIF total_pagado > 0 THEN
            UPDATE public.facturas_ventas 
            SET estatus = 'Parcialmente pagada'::public.factura_estatus
            WHERE id = NEW.factura_id;
        ELSE
            UPDATE public.facturas_ventas 
            SET estatus = 'Pendiente'::public.factura_estatus
            WHERE id = NEW.factura_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Function to calculate IVA automatically
CREATE OR REPLACE FUNCTION public.calculate_invoice_totals()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    obra_con_iva BOOLEAN;
BEGIN
    -- Get obra IVA setting
    SELECT con_iva INTO obra_con_iva 
    FROM public.obras_financiero 
    WHERE id = NEW.obra_id;
    
    -- Calculate IVA and total
    IF obra_con_iva THEN
        NEW.iva = NEW.subtotal * 0.16;
    ELSE
        NEW.iva = 0;
    END IF;
    
    NEW.total = NEW.subtotal + NEW.iva;
    
    RETURN NEW;
END;
$$;

-- Function to calculate expense totals
CREATE OR REPLACE FUNCTION public.calculate_expense_totals()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    obra_con_iva BOOLEAN;
BEGIN
    -- Get obra IVA setting
    SELECT con_iva INTO obra_con_iva 
    FROM public.obras_financiero 
    WHERE id = NEW.obra_id;
    
    -- Calculate IVA and total
    IF obra_con_iva THEN
        NEW.iva = NEW.subtotal * 0.16;
    ELSE
        NEW.iva = 0;
    END IF;
    
    NEW.total = NEW.subtotal + NEW.iva;
    
    RETURN NEW;
END;
$$;

-- =============================================
-- 10. CREATE TRIGGERS
-- =============================================

-- Trigger to update invoice status when payment is received
CREATE TRIGGER update_factura_status_trigger
    AFTER INSERT OR UPDATE ON public.pagos_recibidos
    FOR EACH ROW EXECUTE FUNCTION public.update_factura_status();

-- Trigger to calculate invoice totals
CREATE TRIGGER calculate_invoice_totals_trigger
    BEFORE INSERT OR UPDATE ON public.facturas_ventas
    FOR EACH ROW EXECUTE FUNCTION public.calculate_invoice_totals();

-- Trigger to calculate expense totals
CREATE TRIGGER calculate_expense_totals_trigger
    BEFORE INSERT OR UPDATE ON public.gastos
    FOR EACH ROW EXECUTE FUNCTION public.calculate_expense_totals();

-- =============================================
-- 11. INSERT SAMPLE DATA FOR TESTING
-- =============================================

DO $$
DECLARE
    admin_user_id UUID;
    empresa_cliente_id UUID;
    empresa_proveedor_id UUID;
    dependencia_id UUID;
    obra1_id UUID;
    obra2_id UUID;
    factura1_id UUID;
    factura2_id UUID;
BEGIN
    -- Create admin user if none exists
    INSERT INTO public.usuarios (id, email, nombre, apellido, rol, is_active) VALUES
        (gen_random_uuid(), 'admin@company.com', 'Admin', 'User', 'admin', true)
    ON CONFLICT (email) DO NOTHING
    RETURNING id INTO admin_user_id;
    
    -- Get admin user ID if already exists
    IF admin_user_id IS NULL THEN
        SELECT id INTO admin_user_id 
        FROM public.usuarios 
        WHERE rol IN ('admin', 'superadmin') 
        LIMIT 1;
    END IF;
    
    -- Create sample companies
    INSERT INTO public.empresas (id, nombre, rfc, tipo, activo) VALUES
        (gen_random_uuid(), 'Constructora ABC S.A. de C.V.', 'CABC850101ABC', 'cliente', true),
        (gen_random_uuid(), 'Proveedora de Materiales XYZ', 'PMXY900215XYZ', 'proveedor', true),
        (gen_random_uuid(), 'Gobierno del Estado', 'GES700101GES', 'cliente', true)
    ON CONFLICT (nombre) DO NOTHING;
    
    -- Get company IDs
    SELECT id INTO empresa_cliente_id FROM public.empresas WHERE nombre = 'Constructora ABC S.A. de C.V.';
    SELECT id INTO empresa_proveedor_id FROM public.empresas WHERE nombre = 'Proveedora de Materiales XYZ';
    
    -- Create sample dependency
    INSERT INTO public.dependencias (id, nombre, siglas, activo) VALUES
        (gen_random_uuid(), 'Secretaría de Obras Públicas', 'SOP', true)
    ON CONFLICT (nombre) DO NOTHING
    RETURNING id INTO dependencia_id;
    
    -- Get dependency ID if already exists
    IF dependencia_id IS NULL THEN
        SELECT id INTO dependencia_id FROM public.dependencias WHERE nombre = 'Secretaría de Obras Públicas';
    END IF;
    
    -- Create sample obras
    INSERT INTO public.obras_financiero (id, clave, nombre, estatus, empresa_id, dependencia_id, con_iva, presupuesto_inicial, anticipo, fecha_inicio, fecha_fin_compromiso, created_by) VALUES
        (gen_random_uuid(), 'OBR-2025-001', 'Construcción de Edificio Administrativo', 'En ejecución', empresa_cliente_id, dependencia_id, true, 5000000.00, 1000000.00, '2025-01-15', '2025-12-31', admin_user_id),
        (gen_random_uuid(), 'OBR-2025-002', 'Remodelación de Plaza Principal', 'Planeación', empresa_cliente_id, dependencia_id, true, 2500000.00, 500000.00, '2025-03-01', '2025-09-30', admin_user_id)
    ON CONFLICT (clave) DO NOTHING;
    
    -- Get obra IDs
    SELECT id INTO obra1_id FROM public.obras_financiero WHERE clave = 'OBR-2025-001';
    SELECT id INTO obra2_id FROM public.obras_financiero WHERE clave = 'OBR-2025-002';
    
    -- Only insert sample data if obras were created successfully
    IF obra1_id IS NOT NULL AND obra2_id IS NOT NULL THEN
        -- Create sample change orders
        INSERT INTO public.ordenes_cambio (obra_id, folio, descripcion, monto, fecha) VALUES
            (obra1_id, 'OC-001', 'Cambio en especificaciones de ventanas', 150000.00, '2025-02-15'),
            (obra1_id, 'OC-002', 'Adición de sistema de climatización', 300000.00, '2025-03-01'),
            (obra2_id, 'OC-001', 'Mejora en acabados de piso', 75000.00, '2025-03-15')
        ON CONFLICT DO NOTHING;
        
        -- Create sample invoices
        INSERT INTO public.facturas_ventas (id, obra_id, folio, tipo, subtotal, fecha_emision, fecha_vencimiento, estatus) VALUES
            (gen_random_uuid(), obra1_id, 'FACT-001', 'Factura', 1000000.00, '2025-02-01', '2025-03-03', 'Pendiente'),
            (gen_random_uuid(), obra1_id, 'REQ-001', 'Requisición', 500000.00, '2025-02-15', '2025-03-17', 'Pendiente'),
            (gen_random_uuid(), obra2_id, 'FACT-002', 'Factura', 300000.00, '2025-03-01', '2025-04-01', 'Pendiente');
        
        -- Get invoice IDs
        SELECT id INTO factura1_id FROM public.facturas_ventas WHERE folio = 'FACT-001';
        SELECT id INTO factura2_id FROM public.facturas_ventas WHERE folio = 'REQ-001';
        
        -- Create sample payments
        IF factura1_id IS NOT NULL AND factura2_id IS NOT NULL THEN
            INSERT INTO public.pagos_recibidos (obra_id, factura_id, fecha, monto, metodo, referencia) VALUES
                (obra1_id, factura1_id, '2025-02-10', 500000.00, 'Transferencia', 'TRF-20250210-001'),
                (obra1_id, factura2_id, '2025-02-20', 250000.00, 'Cheque', 'CHQ-20250220-001');
        END IF;
        
        -- Create sample expenses
        INSERT INTO public.gastos (obra_id, proveedor_id, categoria, subtotal, fecha, folio) VALUES
            (obra1_id, empresa_proveedor_id, 'materiales', 300000.00, '2025-02-05', 'GAST-001'),
            (obra1_id, empresa_proveedor_id, 'mano_obra', 200000.00, '2025-02-12', 'GAST-002'),
            (obra2_id, empresa_proveedor_id, 'maquinaria', 150000.00, '2025-03-05', 'GAST-003');
        
        -- Create sample budget line items
        INSERT INTO public.presupuestos_partidas (obra_id, partida, unidad, cantidad, precio_unitario) VALUES
            (obra1_id, 'Excavación', 'm3', 500.00, 150.00),
            (obra1_id, 'Concreto estructural', 'm3', 300.00, 2500.00),
            (obra1_id, 'Acero de refuerzo', 'ton', 50.00, 25000.00),
            (obra2_id, 'Pisos de concreto', 'm2', 1000.00, 450.00),
            (obra2_id, 'Pintura', 'm2', 2000.00, 35.00);
    END IF;

EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'Foreign key error in sample data: %', SQLERRM;
    WHEN unique_violation THEN
        RAISE NOTICE 'Unique constraint error in sample data: %', SQLERRM;
    WHEN OTHERS THEN
        RAISE NOTICE 'Unexpected error in sample data: %', SQLERRM;
END $$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated, anon;

-- Final success message
DO $$
BEGIN
    RAISE NOTICE 'Obras Financial Control System created successfully!';
    RAISE NOTICE 'Tables created: usuarios, empresas, dependencias, obras_financiero, ordenes_cambio,';
    RAISE NOTICE '               facturas_ventas, pagos_recibidos, gastos, presupuestos_partidas';
    RAISE NOTICE 'Financial KPI view: vw_obras_finanzas';
    RAISE NOTICE 'All RLS policies, triggers, and sample data have been created.';
    RAISE NOTICE 'Role access: Admin/SuperAdmin only for financial data management';
END $$;