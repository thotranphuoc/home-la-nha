-- Chi phí triển khai: thêm loại chi phí (category)
ALTER TABLE setup_costs ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'other';

CREATE INDEX IF NOT EXISTS idx_setup_costs_category ON setup_costs(category);
