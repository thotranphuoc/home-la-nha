-- Đơn giá điện, nước, wifi, vệ sinh theo phòng
ALTER TABLE rooms
  ADD COLUMN IF NOT EXISTS electricity_unit_price NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS water_unit_price NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS wifi_fee NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS sanitation_fee NUMERIC(15,2);

COMMENT ON COLUMN rooms.electricity_unit_price IS 'Đơn giá điện (đồng/kWh hoặc đồng/số)';
COMMENT ON COLUMN rooms.water_unit_price IS 'Đơn giá nước (đồng/m³ hoặc đồng/số)';
COMMENT ON COLUMN rooms.wifi_fee IS 'Phí wifi (đồng/tháng, cố định)';
COMMENT ON COLUMN rooms.sanitation_fee IS 'Phí vệ sinh (đồng/tháng, cố định)';
