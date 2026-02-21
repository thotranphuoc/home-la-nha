-- OpEx: add category, allow multiple rows per building/month
ALTER TABLE opex_logs DROP CONSTRAINT IF EXISTS opex_logs_building_id_year_month_key;

ALTER TABLE opex_logs ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'other';

CREATE INDEX IF NOT EXISTS idx_opex_logs_category ON opex_logs(category);
