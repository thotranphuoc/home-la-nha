import { Injectable, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';

export type AssetCategory = string;

export interface AssetLog {
  id: string;
  building_id: string;
  item_name: string;
  amount: number;
  category: AssetCategory;
  purchase_date: string | null;
  is_depreciable: boolean;
  depreciation_months: number | null;
  invoice_url: string | null;
  created_at?: string;
  updated_at?: string;
}

@Injectable({ providedIn: 'root' })
export class AssetService {
  private readonly supabase = this.supabaseService.client;

  readonly assets = signal<AssetLog[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  constructor(private readonly supabaseService: SupabaseService) {}

  /** Straight-line: monthly depreciation = amount / depreciation_months */
  monthlyDepreciationForAsset(asset: AssetLog): number {
    if (!asset.is_depreciable || !asset.depreciation_months || asset.depreciation_months <= 0)
      return 0;
    return asset.amount / asset.depreciation_months;
  }

  /** Whether the asset is in depreciation window for the given month. */
  isInDepreciationWindow(asset: AssetLog, year: number, month: number): boolean {
    if (!asset.is_depreciable || !asset.depreciation_months || !asset.purchase_date) return false;
    const purchase = new Date(asset.purchase_date);
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const endDepreciation = new Date(purchase);
    endDepreciation.setMonth(endDepreciation.getMonth() + asset.depreciation_months);
    return purchase <= firstDay && endDepreciation >= lastDay;
  }

  /** Total monthly depreciation for a building in a given month. */
  getMonthlyDepreciation(buildingId: string, year: number, month: number): number {
    return this.assets()
      .filter((a) => a.building_id === buildingId && this.isInDepreciationWindow(a, year, month))
      .reduce((sum, a) => sum + this.monthlyDepreciationForAsset(a), 0);
  }

  async loadAssets(buildingId?: string): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    let q = this.supabase.from('asset_logs').select('*').order('purchase_date', { ascending: false });
    if (buildingId) q = q.eq('building_id', buildingId);
    const { data, error } = await q;
    this.loading.set(false);
    if (error) {
      this.error.set(error.message);
      this.assets.set([]);
      return;
    }
    this.assets.set((data as AssetLog[]) ?? []);
  }

  async createAsset(a: Partial<AssetLog>): Promise<{ data: AssetLog | null; error: string | null }> {
    const { data, error } = await this.supabase.from('asset_logs').insert(a).select().single();
    if (!error && (a as AssetLog).building_id) await this.loadAssets((a as AssetLog).building_id);
    return { data: data as AssetLog | null, error: error?.message ?? null };
  }

  async updateAsset(id: string, a: Partial<AssetLog>): Promise<{ error: string | null }> {
    const { error } = await this.supabase.from('asset_logs').update(a).eq('id', id);
    if (!error) await this.loadAssets();
    return { error: error?.message ?? null };
  }

  async deleteAsset(id: string): Promise<{ error: string | null }> {
    const { error } = await this.supabase.from('asset_logs').delete().eq('id', id);
    if (!error) this.assets.update((list) => list.filter((x) => x.id !== id));
    return { error: error?.message ?? null };
  }
}
