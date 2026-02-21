import { Injectable, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface SetupCost {
  id: string;
  building_id: string;
  category: string;
  amount: number;
  note: string | null;
  occurred_date: string;
  created_at?: string;
  updated_at?: string;
}

@Injectable({ providedIn: 'root' })
export class SetupCostsService {
  private readonly supabase = this.supabaseService.client;

  readonly list = signal<SetupCost[]>([]);
  readonly loading = signal(false);

  constructor(private readonly supabaseService: SupabaseService) {}

  async load(buildingId?: string): Promise<void> {
    this.loading.set(true);
    let q = this.supabase
      .from('setup_costs')
      .select('*')
      .order('occurred_date', { ascending: false });
    if (buildingId) q = q.eq('building_id', buildingId);
    const { data } = await q;
    this.loading.set(false);
    this.list.set((data as SetupCost[]) ?? []);
  }

  async create(c: Partial<SetupCost> & { category?: string }): Promise<{ data: SetupCost | null; error: string | null }> {
    const payload = { ...c, category: c.category ?? 'other' };
    const { data, error } = await this.supabase.from('setup_costs').insert(payload).select().single();
    if (!error) await this.load();
    return { data: data as SetupCost | null, error: error?.message ?? null };
  }

  async update(id: string, c: Partial<SetupCost>): Promise<{ error: string | null }> {
    const { error } = await this.supabase
      .from('setup_costs')
      .update({ ...c, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (!error) await this.load();
    return { error: error?.message ?? null };
  }

  async delete(id: string): Promise<{ error: string | null }> {
    const { error } = await this.supabase.from('setup_costs').delete().eq('id', id);
    if (!error) this.list.update((arr) => arr.filter((x) => x.id !== id));
    return { error: error?.message ?? null };
  }
}
