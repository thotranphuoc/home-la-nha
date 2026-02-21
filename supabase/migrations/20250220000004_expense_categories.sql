-- Cấu hình loại chi phí (OpEx, Setup, CapEx)
CREATE TABLE expense_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('opex', 'setup', 'capex')),
  value TEXT NOT NULL,
  label TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  UNIQUE(type, value)
);

CREATE INDEX idx_expense_categories_type ON expense_categories(type);

ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY expense_categories_admin_all ON expense_categories FOR ALL USING (public.user_role() = 'admin');

-- Seed OpEx (sort_order 0..16)
INSERT INTO expense_categories (type, value, label, sort_order) VALUES
  ('opex', 'salary', 'Lương', 0),
  ('opex', 'electricity', 'Điện', 1),
  ('opex', 'water', 'Nước', 2),
  ('opex', 'cleaning', 'Vệ sinh', 3),
  ('opex', 'repairs', 'Sửa chữa', 4),
  ('opex', 'marketing', 'Marketing', 5),
  ('opex', 'hospitality', 'Tiếp khách', 6),
  ('opex', 'tax', 'Thuế', 7),
  ('opex', 'insurance', 'Bảo hiểm', 8),
  ('opex', 'management_fee', 'Phí quản lý', 9),
  ('opex', 'telecom', 'Internet / Viễn thông', 10),
  ('opex', 'office_supplies', 'Văn phòng phẩm', 11),
  ('opex', 'legal', 'Phí pháp lý', 12),
  ('opex', 'maintenance', 'Bảo trì', 13),
  ('opex', 'security', 'An ninh', 14),
  ('opex', 'advertising', 'Quảng cáo', 15),
  ('opex', 'other', 'Khác', 16)
ON CONFLICT (type, value) DO NOTHING;

-- Seed Setup (sort_order 0..9)
INSERT INTO expense_categories (type, value, label, sort_order) VALUES
  ('setup', 'labour', 'Nhân công (thi công, lắp đặt, dọn dẹp)', 0),
  ('setup', 'permits', 'Giấy phép (đăng ký kinh doanh, hành nghề)', 1),
  ('setup', 'fill_commission', 'Hoa hồng lấp đầy (môi giới)', 2),
  ('setup', 'renovation', 'Sửa chữa, cải tạo', 3),
  ('setup', 'furniture_equipment', 'Nội thất, thiết bị ban đầu', 4),
  ('setup', 'marketing_preopen', 'Marketing, quảng cáo trước mở cửa', 5),
  ('setup', 'legal', 'Phí pháp lý, tư vấn (HĐ thuê nhà chính)', 6),
  ('setup', 'utilities_setup', 'Điện nước, đấu nối hạ tầng', 7),
  ('setup', 'cleaning_setup', 'Vệ sinh, dọn dẹp tổng', 8),
  ('setup', 'other', 'Khác', 9)
ON CONFLICT (type, value) DO NOTHING;

-- Seed CapEx (sort_order 0..3)
INSERT INTO expense_categories (type, value, label, sort_order) VALUES
  ('capex', 'furniture', 'Nội thất', 0),
  ('capex', 'appliance', 'Thiết bị', 1),
  ('capex', 'renovation', 'Sửa chữa', 2),
  ('capex', 'other', 'Khác', 3)
ON CONFLICT (type, value) DO NOTHING;
