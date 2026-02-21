-- Home La Nha: initial schema + RLS
-- Run in Supabase SQL Editor or via: supabase db push

-- Enums
CREATE TYPE room_status AS ENUM ('empty', 'occupied', 'maintenance');
CREATE TYPE residence_status AS ENUM ('pending', 'completed');
CREATE TYPE invoice_status AS ENUM ('paid', 'unpaid');
CREATE TYPE asset_category AS ENUM ('furniture', 'appliance', 'renovation', 'other');
CREATE TYPE user_role AS ENUM ('admin', 'tenant');

-- Profiles (links auth.users to role + optional contract for tenants)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  role user_role NOT NULL DEFAULT 'tenant',
  contract_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Buildings
CREATE TABLE buildings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  master_lease_start DATE,
  master_lease_end DATE,
  owner_payment_cycle INT,
  deposit_to_owner NUMERIC(15,2),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Rooms
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  room_number TEXT NOT NULL,
  status room_status NOT NULL DEFAULT 'empty',
  base_price NUMERIC(15,2),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Contracts
CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  actual_rent_price NUMERIC(15,2) NOT NULL,
  deposit_amount NUMERIC(15,2),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add FK from profiles to contracts (for tenants)
ALTER TABLE profiles ADD CONSTRAINT fk_profiles_contract
  FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE SET NULL;

-- Tenants
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  id_number TEXT,
  id_card_front_url TEXT,
  id_card_back_url TEXT,
  residence_status residence_status NOT NULL DEFAULT 'pending',
  is_locked BOOLEAN NOT NULL DEFAULT false,
  ocr_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Asset logs
CREATE TABLE asset_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  amount NUMERIC(15,2) NOT NULL,
  category asset_category NOT NULL DEFAULT 'other',
  purchase_date DATE,
  is_depreciable BOOLEAN NOT NULL DEFAULT false,
  depreciation_months INT,
  invoice_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Invoices
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  month INT NOT NULL CHECK (month >= 1 AND month <= 12),
  year INT NOT NULL,
  status invoice_status NOT NULL DEFAULT 'unpaid',
  rent_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  electricity_usage NUMERIC(15,2) NOT NULL DEFAULT 0,
  water_usage NUMERIC(15,2) NOT NULL DEFAULT 0,
  other_fees_json JSONB DEFAULT '{}',
  discount_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  discount_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(contract_id, month, year)
);

-- Indexes for RLS and common queries
CREATE INDEX idx_rooms_building_id ON rooms(building_id);
CREATE INDEX idx_contracts_room_id ON contracts(room_id);
CREATE INDEX idx_tenants_contract_id ON tenants(contract_id);
CREATE INDEX idx_asset_logs_building_id ON asset_logs(building_id);
CREATE INDEX idx_invoices_contract_id ON invoices(contract_id);
CREATE INDEX idx_invoices_year_month ON invoices(contract_id, year, month);

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Helpers in public schema (auth schema is not writable in Supabase SQL Editor)
CREATE OR REPLACE FUNCTION public.user_role()
RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.my_contract_id()
RETURNS UUID AS $$
  SELECT contract_id FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Profiles: users can read/update own row; insert via trigger
CREATE POLICY profiles_select_own ON profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY profiles_update_own ON profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY profiles_insert_own ON profiles FOR INSERT WITH CHECK (id = auth.uid());
-- Admin can do anything on profiles (for unlock/assign contract)
CREATE POLICY profiles_admin_all ON profiles FOR ALL USING (public.user_role() = 'admin');

-- Buildings: admin all; tenant read-only none (tenants don't list buildings)
CREATE POLICY buildings_admin_all ON buildings FOR ALL USING (public.user_role() = 'admin');

-- Rooms: admin all
CREATE POLICY rooms_admin_all ON rooms FOR ALL USING (public.user_role() = 'admin');

-- Contracts: admin all; tenant can only read their own contract
CREATE POLICY contracts_admin_all ON contracts FOR ALL USING (public.user_role() = 'admin');
CREATE POLICY contracts_tenant_select ON contracts FOR SELECT USING (id = public.my_contract_id());

-- Tenants: admin all; tenant can select/update own tenant row (by contract)
CREATE POLICY tenants_admin_all ON tenants FOR ALL USING (public.user_role() = 'admin');
CREATE POLICY tenants_tenant_select ON tenants FOR SELECT USING (contract_id = public.my_contract_id());
CREATE POLICY tenants_tenant_update ON tenants FOR UPDATE USING (contract_id = public.my_contract_id());

-- Asset logs: admin only
CREATE POLICY asset_logs_admin_all ON asset_logs FOR ALL USING (public.user_role() = 'admin');

-- Invoices: admin all; tenant can only select invoices for their contract
CREATE POLICY invoices_admin_all ON invoices FOR ALL USING (public.user_role() = 'admin');
CREATE POLICY invoices_tenant_select ON invoices FOR SELECT USING (contract_id = public.my_contract_id());

-- Note: Cannot create trigger on auth.users from SQL Editor (permission denied).
-- Create profile from app on first login, or add user in Dashboard then insert profile manually.

-- Storage: Create bucket "id-cards" (private) in Supabase Dashboard > Storage.
-- Then add policy: authenticated users can INSERT/SELECT/UPDATE objects in "id-cards".
-- Serve images via short-lived signed URLs in the app (e.g. createSignedUrl).
