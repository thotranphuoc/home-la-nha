import { Injectable, signal, computed } from '@angular/core';
import { SupabaseService } from './supabase.service';

export type ExpenseCategoryType = 'opex' | 'setup' | 'capex';

export interface ExpenseCategory {
  id: string;
  type: ExpenseCategoryType;
  value: string;
  label: string;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

@Injectable({ providedIn: 'root' })
export class ExpenseCategoriesService {
  private readonly supabase = this.supabaseService.client;

  readonly categories = signal<ExpenseCategory[]>([]);
  readonly loading = signal(false);

  constructor(private readonly supabaseService: SupabaseService) {}

  async load(): Promise<void> {
    this.loading.set(true);
    const { data } = await this.supabase
      .from('expense_categories')
      .select('*')
      .order('type')
      .order('sort_order')
      .order('value');
    this.loading.set(false);
    this.categories.set((data as ExpenseCategory[]) ?? []);
  }

  getByType(type: ExpenseCategoryType): ExpenseCategory[] {
    return this.categories().filter((c) => c.type === type);
  }

  getLabel(type: ExpenseCategoryType, value: string): string {
    const c = this.categories().find((x) => x.type === type && x.value === value);
    return c?.label ?? value;
  }

  async create(c: {
    type: ExpenseCategoryType;
    value: string;
    label: string;
    sort_order?: number;
  }): Promise<{ data: ExpenseCategory | null; error: string | null }> {
    const maxOrder = this.categories()
      .filter((x) => x.type === c.type)
      .reduce((max, x) => Math.max(max, x.sort_order), -1);
    const payload = {
      type: c.type,
      value: c.value.trim(),
      label: c.label.trim(),
      sort_order: c.sort_order ?? maxOrder + 1,
    };
    const { data, error } = await this.supabase
      .from('expense_categories')
      .insert(payload)
      .select()
      .single();
    if (!error) await this.load();
    return { data: data as ExpenseCategory | null, error: error?.message ?? null };
  }

  async update(
    id: string,
    updates: { label?: string; sort_order?: number }
  ): Promise<{ error: string | null }> {
    const body: Record<string, unknown> = {};
    if (updates['label'] !== undefined) body['label'] = (updates['label'] as string).trim();
    if (updates['sort_order'] !== undefined) body['sort_order'] = updates['sort_order'];
    if (Object.keys(body).length === 0) return { error: null };
    const { error } = await this.supabase
      .from('expense_categories')
      .update(body)
      .eq('id', id);
    if (!error) await this.load();
    return { error: error?.message ?? null };
  }

  private async countUsage(type: ExpenseCategoryType, value: string): Promise<number> {
    if (type === 'opex') {
      const { count } = await this.supabase
        .from('opex_logs')
        .select('*', { count: 'exact', head: true })
        .eq('category', value);
      return count ?? 0;
    }
    if (type === 'setup') {
      const { count } = await this.supabase
        .from('setup_costs')
        .select('*', { count: 'exact', head: true })
        .eq('category', value);
      return count ?? 0;
    }
    if (type === 'capex') {
      const { count } = await this.supabase
        .from('asset_logs')
        .select('*', { count: 'exact', head: true })
        .eq('category', value);
      return count ?? 0;
    }
    return 0;
  }

  async delete(id: string): Promise<{ error: string | null }> {
    const cat = this.categories().find((c) => c.id === id);
    if (!cat) return { error: 'Không tìm thấy loại chi phí' };
    const used = await this.countUsage(cat.type, cat.value);
    if (used > 0) {
      return {
        error: `Loại này đang được sử dụng (${used} bản ghi). Không thể xóa.`,
      };
    }
    const { error } = await this.supabase.from('expense_categories').delete().eq('id', id);
    if (!error) await this.load();
    return { error: error?.message ?? null };
  }
}
