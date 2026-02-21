-- Chi phí triển khai (pre-open / setup) theo tòa nhà
CREATE TABLE setup_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  note TEXT,
  occurred_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_setup_costs_building_id ON setup_costs(building_id);

ALTER TABLE setup_costs ENABLE ROW LEVEL SECURITY;

CREATE POLICY setup_costs_admin_all ON setup_costs FOR ALL USING (public.user_role() = 'admin');
