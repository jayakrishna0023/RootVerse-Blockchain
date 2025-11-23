-- ============================================================================
-- UNAVU.IO - COMPLETE CLEAN DATABASE SETUP
-- ============================================================================
-- This script will DROP and RECREATE all tables from scratch
-- Run this ONCE in Supabase SQL Editor to start fresh
-- ============================================================================

-- ============================================================================
-- STEP 1: COMPLETE CLEANUP - DELETE EVERYTHING
-- ============================================================================

-- Drop all existing tables (including any extras)
DROP TABLE IF EXISTS public.supply_chain_events CASCADE;
DROP TABLE IF EXISTS public.sensor_logs CASCADE;
DROP TABLE IF EXISTS public.fisher_reviews CASCADE;
DROP TABLE IF EXISTS public.fisher_profiles CASCADE;
DROP TABLE IF EXISTS public.blockchain_transactions CASCADE;
DROP TABLE IF EXISTS public.qr_codes CASCADE;
DROP TABLE IF EXISTS public.certifications CASCADE;
DROP TABLE IF EXISTS public.quality_tests CASCADE;
DROP TABLE IF EXISTS public.shipments CASCADE;
DROP TABLE IF EXISTS public.retailers CASCADE;
DROP TABLE IF EXISTS public.distributors CASCADE;
DROP TABLE IF EXISTS public.user_sessions CASCADE;
DROP TABLE IF EXISTS public.user_activity_logs CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.fish_entries CASCADE;
DROP TABLE IF EXISTS public.trips CASCADE;
DROP TABLE IF EXISTS public.vessels CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Drop all views if any
DROP VIEW IF EXISTS public.product_summary CASCADE;
DROP VIEW IF EXISTS public.fisher_stats CASCADE;
DROP VIEW IF EXISTS public.vessel_overview CASCADE;

-- Drop all functions if any
DROP FUNCTION IF EXISTS public.update_updated_at_column CASCADE;
DROP FUNCTION IF EXISTS public.calculate_stats CASCADE;

-- Note: Triggers will be dropped automatically with CASCADE when tables are dropped
-- No need to drop them separately

-- Delete all storage objects (if any)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'storage' AND tablename = 'objects') THEN
        DELETE FROM storage.objects WHERE bucket_id IN ('qr-codes', 'vessel-media', 'catch-media', 'fisher-stories', 'product-images', 'vessel-documents', 'owner-proofs');
    END IF;
END $$;

-- ============================================================================
-- STEP 2: CREATE USERS TABLE (Authentication & Authorization)
-- ============================================================================

CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('consumer', 'fisher', 'admin', 'distributor')),
    phone TEXT,
    location TEXT,
    profile_image_url TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast user lookups
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);

-- ============================================================================
-- STEP 3: CREATE VESSELS TABLE (Fisher's Boats)
-- ============================================================================

CREATE TABLE public.vessels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    registration_number TEXT UNIQUE NOT NULL,
    vessel_type TEXT,
    home_port TEXT,
    fishing_license_number TEXT,
    owner_name TEXT,
    owner_contact TEXT,
    owner_email TEXT,
    owner_address TEXT,
    crew_capacity INTEGER,
    storage_capacity_kg NUMERIC,
    engine_power_hp NUMERIC,
    fuel_type TEXT,
    length_m NUMERIC,
    tonnage_gt NUMERIC,
    imo_number TEXT,
    call_sign TEXT,
    vessel_image_url TEXT,
    vessel_documents_url TEXT,
    owner_id_proof_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast vessel lookups
CREATE INDEX idx_vessels_owner_id ON public.vessels(owner_id);
CREATE INDEX idx_vessels_registration ON public.vessels(registration_number);

-- ============================================================================
-- STEP 4: CREATE PRODUCTS TABLE (Main Product Registry)
-- ============================================================================

CREATE TABLE public.products (
    id SERIAL PRIMARY KEY,
    batch_id TEXT UNIQUE NOT NULL,
    
    -- User Linkage (CRITICAL - fisher_id auto-set from logged-in user)
    fisher_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    farmer_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    vessel_id UUID REFERENCES public.vessels(id) ON DELETE SET NULL,
    
    -- Core Product Info (Required)
    product_name TEXT NOT NULL,
    product_type TEXT DEFAULT 'Seafood',
    weight NUMERIC NOT NULL,
    price NUMERIC DEFAULT 0,
    quality_grade TEXT,
    
    -- Fisher/Farmer Details (Display names)
    fisher_name TEXT,
    farmer_name TEXT,
    vessel_name TEXT,
    
    -- Catch/Harvest Details
    catch_location TEXT,
    catch_date TIMESTAMPTZ,
    fishing_method TEXT,
    
    -- Processing Details
    processing_facility TEXT,
    processing_date TIMESTAMPTZ,
    expiry_date TIMESTAMPTZ,
    
    -- Blockchain Data (VeChain Integration)
    blockchain_hash TEXT,
    block_number INTEGER,
    vechain_block_id TEXT,
    gas_used INTEGER DEFAULT 0,
    
    -- QR Code
    qr_code_url TEXT,
    qr_content TEXT,
    qr_signature TEXT,
    
    -- Optional Advanced Fields
    catch_zone TEXT,
    water_depth_m NUMERIC,
    water_temperature_c NUMERIC,
    storage_temperature TEXT,
    packaging_type TEXT,
    cold_chain_required BOOLEAN DEFAULT FALSE,
    sustainability_cert TEXT,
    vessel_image_url TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Critical indexes for fast queries and filtering
CREATE INDEX idx_products_fisher_id ON public.products(fisher_id) WHERE fisher_id IS NOT NULL;
CREATE INDEX idx_products_farmer_id ON public.products(farmer_id) WHERE farmer_id IS NOT NULL;
CREATE INDEX idx_products_vessel_id ON public.products(vessel_id);
CREATE INDEX idx_products_batch_id ON public.products(batch_id);
CREATE INDEX idx_products_created_at ON public.products(created_at DESC);
CREATE INDEX idx_products_blockchain_hash ON public.products(blockchain_hash) WHERE blockchain_hash IS NOT NULL;

-- Auto-update timestamp trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to products table
CREATE TRIGGER update_products_updated_at 
    BEFORE UPDATE ON public.products 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- STEP 5: CREATE USER SESSIONS TABLE (Authentication Sessions)
-- ============================================================================

CREATE TABLE public.user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sessions_token ON public.user_sessions(token);
CREATE INDEX idx_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX idx_sessions_expires ON public.user_sessions(expires_at);

-- ============================================================================
-- STEP 6: CREATE ACTIVITY LOGS TABLE (Audit Trail)
-- ============================================================================

CREATE TABLE public.user_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    details TEXT,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activity_user_id ON public.user_activity_logs(user_id);
CREATE INDEX idx_activity_created ON public.user_activity_logs(created_at DESC);

-- ============================================================================
-- STEP 7: ENABLE ROW LEVEL SECURITY (Optional but Recommended)
-- ============================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vessels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Basic policies (adjust as needed)
CREATE POLICY "Users can view all products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Users can view all vessels" ON public.vessels FOR SELECT USING (true);

-- ============================================================================
-- STEP 8: GRANT PERMISSIONS
-- ============================================================================

GRANT ALL ON public.users TO service_role;
GRANT ALL ON public.vessels TO service_role;
GRANT ALL ON public.products TO service_role;
GRANT ALL ON public.user_sessions TO service_role;
GRANT ALL ON public.user_activity_logs TO service_role;

GRANT USAGE, SELECT ON SEQUENCE public.products_id_seq TO service_role;

-- ============================================================================
-- STEP 9: DELETE OLD STORAGE BUCKETS & CREATE NEW ONES
-- ============================================================================

-- Delete old storage buckets safely (if they exist)
DO $$
BEGIN
    DELETE FROM storage.buckets WHERE id IN ('qr-codes', 'vessel-media', 'catch-media', 'fisher-stories', 'product-images', 'vessel-documents', 'owner-proofs');
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Some buckets may not exist, continuing...';
END $$;

-- Create new optimized storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
('qr-codes', 'qr-codes', true, 1048576, ARRAY['image/png', 'image/jpeg']::text[]),
('vessel-media', 'vessel-media', true, 10485760, ARRAY['image/png', 'image/jpeg', 'image/jpg', 'application/pdf']::text[]),
('catch-media', 'catch-media', true, 10485760, ARRAY['image/png', 'image/jpeg', 'image/jpg']::text[])
ON CONFLICT (id) DO UPDATE SET 
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Drop existing storage policies if any
DO $$
BEGIN
    DROP POLICY IF EXISTS "Public Access" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Policies may not exist, continuing...';
END $$;

-- Create storage policies for public read access
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id IN ('qr-codes', 'vessel-media', 'catch-media'));
CREATE POLICY "Authenticated users can upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id IN ('qr-codes', 'vessel-media', 'catch-media'));

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Check products table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'products' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check vessels table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'vessels' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check foreign key constraints
SELECT
    tc.table_name,
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- Check indexes
SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

SELECT '✅ DATABASE SETUP COMPLETE!' AS status,
       'Tables: users, vessels, products, user_sessions, user_activity_logs' AS tables_created,
       'All foreign keys point to public.users' AS foreign_keys_fixed,
       'Indexes created for fast queries' AS performance_optimized,
       'Ready to use!' AS next_step;
