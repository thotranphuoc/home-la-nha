-- Chỉ số điện, nước theo phòng theo kỳ (để theo dõi sử dụng, dự đoán, phát hiện bất thường)
CREATE TABLE meter_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  year INT NOT NULL,
  month INT NOT NULL CHECK (month >= 1 AND month <= 12),
  electricity_reading NUMERIC(15,2) NOT NULL DEFAULT 0,
  water_reading NUMERIC(15,2) NOT NULL DEFAULT 0,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(room_id, year, month)
);

CREATE INDEX idx_meter_readings_room_id ON meter_readings(room_id);
CREATE INDEX idx_meter_readings_year_month ON meter_readings(room_id, year, month);

ALTER TABLE meter_readings ENABLE ROW LEVEL SECURITY;

CREATE POLICY meter_readings_admin_all ON meter_readings FOR ALL USING (public.user_role() = 'admin');
