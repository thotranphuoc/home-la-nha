-- Đổi tên Phí vệ sinh => Phí gom rác (chi phí thu gom rác mỗi phòng)
ALTER TABLE rooms RENAME COLUMN sanitation_fee TO garbage_fee;

COMMENT ON COLUMN rooms.garbage_fee IS 'Phí gom rác (đồng/tháng, cố định theo phòng)';
