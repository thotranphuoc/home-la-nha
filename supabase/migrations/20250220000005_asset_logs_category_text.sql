-- asset_logs.category: ENUM -> TEXT (để dùng expense_categories)
-- Bỏ default phụ thuộc enum trước, đổi kiểu, gán lại default, rồi mới drop type.
ALTER TABLE asset_logs
  ALTER COLUMN category DROP DEFAULT;

ALTER TABLE asset_logs
  ALTER COLUMN category TYPE TEXT USING category::text;

ALTER TABLE asset_logs
  ALTER COLUMN category SET DEFAULT 'other';

DROP TYPE IF EXISTS asset_category;
