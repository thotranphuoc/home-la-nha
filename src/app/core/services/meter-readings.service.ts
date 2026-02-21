import { Injectable, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface MeterReading {
  id: string;
  room_id: string;
  year: number;
  month: number;
  electricity_reading: number;
  water_reading: number;
  note: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface MeterReadingWithUsage extends MeterReading {
  electricity_usage: number | null;
  water_usage: number | null;
}

@Injectable({ providedIn: 'root' })
export class MeterReadingsService {
  private readonly supabase = this.supabaseService.client;

  readonly readings = signal<MeterReading[]>([]);
  readonly loading = signal(false);

  constructor(private readonly supabaseService: SupabaseService) {}

  async loadReadingsByRoomIds(roomIds: string[]): Promise<void> {
    this.loading.set(true);
    if (roomIds.length === 0) {
      this.readings.set([]);
      this.loading.set(false);
      return;
    }
    const { data } = await this.supabase
      .from('meter_readings')
      .select('*')
      .in('room_id', roomIds)
      .order('year', { ascending: false })
      .order('month', { ascending: false });
    this.loading.set(false);
    this.readings.set((data as MeterReading[]) ?? []);
  }

  getReadingsWithUsage(roomId: string): MeterReadingWithUsage[] {
    const list = this.readings().filter((r) => r.room_id === roomId);
    const byPeriod = new Map<string, MeterReading>();
    list.forEach((r) => byPeriod.set(`${r.year}-${r.month}`, r));
    return list.map((r) => {
      const prevMonth = r.month === 1 ? 12 : r.month - 1;
      const prevYear = r.month === 1 ? r.year - 1 : r.year;
      const prev = byPeriod.get(`${prevYear}-${prevMonth}`);
      const prevElectricity = prev != null ? Number(prev.electricity_reading) : 0;
      const prevWater = prev != null ? Number(prev.water_reading) : 0;
      const electricity_usage = Math.max(0, Number(r.electricity_reading) - prevElectricity);
      const water_usage = Math.max(0, Number(r.water_reading) - prevWater);
      return {
        ...r,
        electricity_usage,
        water_usage,
      };
    });
  }

  async upsert(
    roomId: string,
    year: number,
    month: number,
    electricityReading: number,
    waterReading: number,
    note?: string | null
  ): Promise<{ error: string | null }> {
    const { error } = await this.supabase.from('meter_readings').upsert(
      {
        room_id: roomId,
        year,
        month,
        electricity_reading: electricityReading,
        water_reading: waterReading,
        note: note ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'room_id,year,month' }
    );
    return { error: error?.message ?? null };
  }

  async delete(id: string): Promise<{ error: string | null }> {
    const { error } = await this.supabase.from('meter_readings').delete().eq('id', id);
    return { error: error?.message ?? null };
  }
}
