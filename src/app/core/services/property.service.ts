import { Injectable, signal, computed } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface Building {
  id: string;
  name: string;
  address: string | null;
  master_lease_start: string | null;
  master_lease_end: string | null;
  owner_payment_cycle: number | null;
  deposit_to_owner: number | null;
  created_at?: string;
  updated_at?: string;
}

export type RoomStatus = 'empty' | 'occupied' | 'maintenance';

export interface Room {
  id: string;
  building_id: string;
  room_number: string;
  status: RoomStatus;
  base_price: number | null;
  electricity_unit_price: number | null;
  water_unit_price: number | null;
  wifi_fee: number | null;
  garbage_fee: number | null;
  parking_fee: number | null;
  created_at?: string;
  updated_at?: string;
}

@Injectable({ providedIn: 'root' })
export class PropertyService {
  private readonly supabase = this.supabaseService.client;

  readonly buildings = signal<Building[]>([]);
  readonly rooms = signal<Room[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly buildingsCount = computed(() => this.buildings().length);
  readonly roomsCount = computed(() => this.rooms().length);

  constructor(private readonly supabaseService: SupabaseService) {}

  async loadBuildings(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    const { data, error } = await this.supabase
      .from('buildings')
      .select('*')
      .order('name');
    this.loading.set(false);
    if (error) {
      this.error.set(error.message);
      this.buildings.set([]);
      return;
    }
    this.buildings.set((data as Building[]) ?? []);
  }

  async loadRooms(buildingId?: string): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    let q = this.supabase.from('rooms').select('*').order('room_number');
    if (buildingId) q = q.eq('building_id', buildingId);
    const { data, error } = await q;
    this.loading.set(false);
    if (error) {
      this.error.set(error.message);
      this.rooms.set([]);
      return;
    }
    this.rooms.set((data as Room[]) ?? []);
  }

  async createBuilding(b: Partial<Building>): Promise<{ data: Building | null; error: string | null }> {
    const { data, error } = await this.supabase.from('buildings').insert(b).select().single();
    if (!error) await this.loadBuildings();
    return { data: data as Building | null, error: error?.message ?? null };
  }

  async updateBuilding(id: string, b: Partial<Building>): Promise<{ error: string | null }> {
    const { error } = await this.supabase.from('buildings').update(b).eq('id', id);
    if (!error) await this.loadBuildings();
    return { error: error?.message ?? null };
  }

  async createRoom(r: Partial<Room>): Promise<{ data: Room | null; error: string | null }> {
    const { data, error } = await this.supabase.from('rooms').insert(r).select().single();
    if (!error) await this.loadRooms((r as Room).building_id);
    return { data: data as Room | null, error: error?.message ?? null };
  }

  async updateRoom(id: string, r: Partial<Room>): Promise<{ error: string | null }> {
    const { error } = await this.supabase.from('rooms').update(r).eq('id', id);
    if (!error) await this.loadRooms();
    return { error: error?.message ?? null };
  }

  getRoomsByBuilding(buildingId: string): Room[] {
    return this.rooms().filter((r) => r.building_id === buildingId);
  }
}
