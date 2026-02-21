-- Bổ sung loại CapEx chi tiết (nội thất, thiết bị)
INSERT INTO expense_categories (type, value, label, sort_order) VALUES
  ('capex', 'wardrobe', 'Tủ quần áo', 4),
  ('capex', 'dining_table', 'Bàn ăn', 5),
  ('capex', 'painting', 'Tranh', 6),
  ('capex', 'plants', 'Cây cảnh', 7),
  ('capex', 'kitchen_cabinet', 'Tủ bếp', 8),
  ('capex', 'mattress', 'Nệm', 9),
  ('capex', 'bedding', 'Nệm, gối, chăn', 10),
  ('capex', 'sanitary_equipment', 'Thiết bị vệ sinh', 11),
  ('capex', 'refrigerator', 'Tủ lạnh', 12),
  ('capex', 'water_heater', 'Máy nước nóng', 13),
  ('capex', 'ac', 'Điều hòa', 14),
  ('capex', 'washing_machine', 'Máy giặt', 15),
  ('capex', 'dryer', 'Máy sấy', 16),
  ('capex', 'water_purifier', 'Máy lọc nước', 17),
  ('capex', 'tv', 'Tivi', 18)
ON CONFLICT (type, value) DO NOTHING;
