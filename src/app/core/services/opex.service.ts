import { Injectable, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface OpexLog {
  id: string;
  building_id: string;
  year: number;
  month: number;
  category: string;
  amount: number;
  note: string | null;
  created_at?: string;
  updated_at?: string;
}

@Injectable({ providedIn: 'root' })
export class OpexService {
  private readonly supabase = this.supabaseService.client;

  readonly logs = signal<OpexLog[]>([]);
  readonly loading = signal(false);

  constructor(private readonly supabaseService: SupabaseService) {}

  async loadOpex(buildingId?: string): Promise<void> {
    this.loading.set(true);
    let q = this.supabase
      .from('opex_logs')
      .select('*')
      .order('year', { ascending: false })
      .order('month', { ascending: false });
    if (buildingId) q = q.eq('building_id', buildingId);
    const { data } = await q;
    this.loading.set(false);
    this.logs.set((data as OpexLog[]) ?? []);
  }

  getOpexForBuildingMonth(buildingId: string, year: number, month: number): number {
    return this.logs()
      .filter((l) => l.building_id === buildingId && l.year === year && l.month === month)
      .reduce((sum, l) => sum + Number(l.amount), 0);
  }

  async getOpexForBuildingMonthAsync(buildingId: string, year: number, month: number): Promise<number> {
    const { data } = await this.supabase
      .from('opex_logs')
      .select('amount')
      .eq('building_id', buildingId)
      .eq('year', year)
      .eq('month', month);
    const rows = (data as { amount: number }[]) ?? [];
    return rows.reduce((sum, r) => sum + Number(r.amount), 0);
  }

  async insertOpex(
    buildingId: string,
    year: number,
    month: number,
    category: string,
    amount: number,
    note?: string | null
  ): Promise<{ error: string | null }> {
    const { error } = await this.supabase.from('opex_logs').insert({
      building_id: buildingId,
      year,
      month,
      category: category || 'other',
      amount,
      note: note ?? null,
      updated_at: new Date().toISOString(),
    });
    if (!error) await this.loadOpex();
    return { error: error?.message ?? null };
  }

  async deleteOpex(id: string): Promise<{ error: string | null }> {
    const { error } = await this.supabase.from('opex_logs').delete().eq('id', id);
    if (!error) await this.loadOpex();
    return { error: error?.message ?? null };
  }
}
