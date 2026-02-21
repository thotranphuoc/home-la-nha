-- Thêm loại OpEx: Thuê nhà (trả chủ nhà)
INSERT INTO expense_categories (type, value, label, sort_order) VALUES
  ('opex', 'master_lease', 'Thuê nhà (trả chủ nhà)', 0)
ON CONFLICT (type, value) DO NOTHING;
