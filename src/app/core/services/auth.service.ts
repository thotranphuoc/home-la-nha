import { Injectable, computed, signal } from '@angular/core';
import { User, Session } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';

export type UserRole = 'admin' | 'tenant';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly supabase = this.supabaseService.client;

  readonly currentUser = signal<User | null>(null);
  readonly session = signal<Session | null>(null);
  readonly isLoggedIn = computed(() => !!this.currentUser());
  readonly isLoading = signal(true);

  /** Resolved from profiles; default to tenant if no profile. */
  readonly role = signal<UserRole | null>(null);
  readonly isAdmin = computed(() => this.role() === 'admin');
  /** Tenant's contract_id from profiles (null for admin or if not set). */
  readonly contractId = signal<string | null>(null);

  constructor(private readonly supabaseService: SupabaseService) {
    this.supabase.auth.getSession().then(({ data: { session } }) => {
      this.session.set(session);
      this.currentUser.set(session?.user ?? null);
      if (session?.user) this.loadProfile(session.user);
      this.isLoading.set(false);
    });
    this.supabase.auth.onAuthStateChange((_event, session) => {
      this.session.set(session);
      this.currentUser.set(session?.user ?? null);
      if (session?.user) this.loadProfile(session.user);
      else this.role.set(null);
    });
  }

  /** Load profile; create one if missing (no trigger on auth.users in Supabase). */
  private async loadProfile(user: User): Promise<void> {
    try {
      const userId = user.id;
      const { data } = await this.supabase
        .from('profiles')
        .select('role, contract_id')
        .eq('id', userId)
        .maybeSingle();
      if (data) {
        this.role.set((data.role as UserRole) ?? 'tenant');
        this.contractId.set((data.contract_id as string) ?? null);
        return;
      }
      await this.supabase.from('profiles').insert({
        id: userId,
        email: user.email ?? '',
        full_name: (user.user_metadata?.['full_name'] as string) ?? '',
        role: 'tenant',
      });
      this.role.set('tenant');
      this.contractId.set(null);
    } catch {
      this.role.set('tenant');
      this.contractId.set(null);
    }
  }

  async signIn(email: string, password: string): Promise<{ error: Error | null; role: UserRole }> {
    const { data, error } = await this.supabase.auth.signInWithPassword({ email, password });
    if (error) return { error, role: 'tenant' };
    if (data?.user) await this.loadProfile(data.user);
    return { error: null, role: this.role() ?? 'tenant' };
  }

  async signUp(email: string, password: string): Promise<{ error: Error | null }> {
    const { error } = await this.supabase.auth.signUp({ email, password });
    return { error: error ?? null };
  }

  async signOut(): Promise<void> {
    await this.supabase.auth.signOut();
    this.currentUser.set(null);
    this.session.set(null);
    this.role.set(null);
    this.contractId.set(null);
  }

  /** Admin: gán tài khoản (email) vào hợp đồng để user đó đăng nhập xem hồ sơ khách thuê. */
  async assignContractToUserByEmail(email: string, contractId: string): Promise<{ error: string | null }> {
    const { data, error } = await this.supabase
      .from('profiles')
      .update({ contract_id: contractId })
      .eq('email', email.trim())
      .select('id')
      .maybeSingle();
    if (error) return { error: error.message };
    if (!data) return { error: 'Không tìm thấy tài khoản với email này. User cần đăng nhập ít nhất một lần để tạo hồ sơ.' };
    return { error: null };
  }

  /** Admin: lấy map contract_id -> email (tài khoản đã gán) để hiển thị danh sách. */
  async loadProfileEmailsByContract(): Promise<Record<string, string>> {
    const { data } = await this.supabase
      .from('profiles')
      .select('contract_id, email')
      .not('contract_id', 'is', null);
    const map: Record<string, string> = {};
    for (const row of (data ?? []) as { contract_id: string; email: string }[]) {
      map[row.contract_id] = row.email;
    }
    return map;
  }
}
