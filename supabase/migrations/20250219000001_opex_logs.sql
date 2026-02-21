-- OpEx (operating expenses) per building per month
CREATE TABLE opex_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  year INT NOT NULL,
  month INT NOT NULL CHECK (month >= 1 AND month <= 12),
  amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(building_id, year, month)
);

CREATE INDEX idx_opex_logs_building_year_month ON opex_logs(building_id, year, month);

ALTER TABLE opex_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY opex_logs_admin_all ON opex_logs FOR ALL USING (public.user_role() = 'admin');
