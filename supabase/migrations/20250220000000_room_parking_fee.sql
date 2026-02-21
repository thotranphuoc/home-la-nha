-- Phí gửi xe theo phòng (đồng/tháng)
ALTER TABLE rooms
  ADD COLUMN IF NOT EXISTS parking_fee NUMERIC(15,2);

COMMENT ON COLUMN rooms.parking_fee IS 'Phí gửi xe (đồng/tháng, cố định)';
