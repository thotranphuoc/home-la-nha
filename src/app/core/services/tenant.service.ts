import { Injectable, signal, computed } from '@angular/core';
import { SupabaseService } from './supabase.service';

export type ResidenceStatus = 'pending' | 'completed';

export interface Tenant {
  id: string;
  contract_id: string;
  full_name: string;
  id_number: string | null;
  id_card_front_url: string | null;
  id_card_back_url: string | null;
  residence_status: ResidenceStatus;
  is_locked: boolean;
  ocr_data: Record<string, unknown> | null;
  created_at?: string;
  updated_at?: string;
}

export interface OcrData {
  id_number?: string;
  full_name?: string;
  dob?: string;
  gender?: string;
  nationality?: string;
  place_of_origin?: string;   // Quê quán
  place_of_residence?: string; // Nơi thường trú
  date_of_issue?: string;     // Ngày cấp
  place_of_issue?: string;    // Nơi cấp
  date_of_expiry?: string;    // Ngày hết hạn
  id_card_front_rotation?: number;
  id_card_back_rotation?: number;
  phone?: string;             // Số điện thoại
  social_media?: SocialMediaEntry[];  // MXH: Facebook+URL, Zalo+SĐT, ...
  email?: string;
  occupation?: string;        // Nghề nghiệp
  vehicle_plate?: string;      // Biển số xe
  vehicle_color?: string;     // Màu xe
  vehicle_type?: string;      // Loại xe: xăng, điện, ...
  vehicle_brand?: string;     // Hiệu xe
  [key: string]: unknown;
}

export type SocialMediaType = 'facebook' | 'zalo' | 'other';
export interface SocialMediaEntry {
  type: SocialMediaType;
  value: string;
}

@Injectable({ providedIn: 'root' })
export class TenantService {
  private readonly supabase = this.supabaseService.client;

  readonly tenant = signal<Tenant | null>(null);
  readonly tenants = signal<Tenant[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly isLocked = computed(() => this.tenant()?.is_locked ?? false);

  constructor(private readonly supabaseService: SupabaseService) {}

  async loadTenantByContract(contractId: string): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    const { data, error } = await this.supabase
      .from('tenants')
      .select('*')
      .eq('contract_id', contractId)
      .maybeSingle();
    this.loading.set(false);
    if (error) {
      this.error.set(error.message);
      this.tenant.set(null);
      return;
    }
    this.tenant.set((data as Tenant) ?? null);
  }

  async loadAllTenants(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    const { data, error } = await this.supabase.from('tenants').select('*').order('full_name');
    this.loading.set(false);
    if (error) {
      this.error.set(error.message);
      this.tenants.set([]);
      return;
    }
    this.tenants.set((data as Tenant[]) ?? []);
  }

  /** Load a single tenant by id (for admin view). */
  async loadTenantById(id: string): Promise<Tenant | null> {
    const { data, error } = await this.supabase.from('tenants').select('*').eq('id', id).maybeSingle();
    if (error) return null;
    return data as Tenant | null;
  }

  async createTenant(t: Partial<Tenant>): Promise<{ data: Tenant | null; error: string | null }> {
    const { data, error } = await this.supabase.from('tenants').insert(t).select().single();
    if (!error) await this.loadAllTenants();
    return { data: data as Tenant | null, error: error?.message ?? null };
  }

  async updateTenant(id: string, t: Partial<Tenant>): Promise<{ error: string | null }> {
    const { error } = await this.supabase.from('tenants').update(t).eq('id', id);
    if (!error) {
      const current = this.tenant();
      if (current?.id === id) this.tenant.set({ ...current, ...t });
      await this.loadAllTenants();
    }
    return { error: error?.message ?? null };
  }

  /** Reload single tenant by contract (e.g. after upload to refresh UI). */
  async reloadTenantByContract(contractId: string): Promise<void> {
    await this.loadTenantByContract(contractId);
  }

  async setLock(tenantId: string, isLocked: boolean): Promise<{ error: string | null }> {
    return this.updateTenant(tenantId, { is_locked: isLocked });
  }

  /** Upload file to id-cards bucket; path: {tenantId}/{front|back}.{ext} */
  async uploadIdCard(tenantId: string, file: File, side: 'front' | 'back'): Promise<{ path: string | null; error: string | null }> {
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `${tenantId}/${side}.${ext}`;
    const { data, error } = await this.supabase.storage.from('id-cards').upload(path, file, { upsert: true });
    if (error) return { path: null, error: error.message };
    const savedPath = (data as { path?: string } | null)?.path ?? path;
    return { path: savedPath, error: null };
  }

  /** Create a short-lived signed URL for viewing an ID card (e.g. 60s). */
  async getSignedUrl(storagePath: string, expiresIn = 60): Promise<{ url: string | null; error: string | null }> {
    const { data, error } = await this.supabase.storage.from('id-cards').createSignedUrl(storagePath, expiresIn);
    if (error) return { url: null, error: error.message };
    return { url: data?.signedUrl ?? null, error: null };
  }

  maskIdNumber(idNumber: string | null): string {
    if (!idNumber || idNumber.length < 6) return '***';
    return idNumber.slice(0, 3) + '***' + idNumber.slice(-3);
  }
}
