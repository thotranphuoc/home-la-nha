import { Injectable, signal, computed } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AssetService } from './asset.service';
import { PropertyService } from './property.service';
import { OpexService } from './opex.service';
import { MeterReadingsService } from './meter-readings.service';

export type InvoiceStatus = 'paid' | 'unpaid';

export interface Invoice {
  id: string;
  contract_id: string;
  month: number;
  year: number;
  status: InvoiceStatus;
  rent_amount: number;
  electricity_usage: number;
  water_usage: number;
  other_fees_json: Record<string, number>;
  discount_amount: number;
  discount_reason: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Contract {
  id: string;
  room_id: string;
  start_date: string;
  end_date: string;
  actual_rent_price: number;
  deposit_amount: number | null;
}

@Injectable({ providedIn: 'root' })
export class FinanceService {
  private readonly supabase = this.supabaseService.client;

  readonly invoices = signal<Invoice[]>([]);
  readonly contracts = signal<Contract[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly assetService: AssetService,
    private readonly propertyService: PropertyService,
    private readonly opexService: OpexService,
    private readonly meterReadingsService: MeterReadingsService
  ) {}

  /** Compute electricity/water amounts and wifi/garbage/parking fees from contract's room and meter readings. */
  async computeUtilityAmountsForContract(
    contractId: string,
    year: number,
    month: number
  ): Promise<{ electricityAmount: number; waterAmount: number; wifiFee: number; garbageFee: number; parkingFee: number }> {
    const out = { electricityAmount: 0, waterAmount: 0, wifiFee: 0, garbageFee: 0, parkingFee: 0 };
    const { data: contract } = await this.supabase
      .from('contracts')
      .select('room_id')
      .eq('id', contractId)
      .single();
    const roomId = (contract as { room_id: string } | null)?.room_id;
    if (!roomId) return out;
    const room = this.propertyService.rooms().find((r) => r.id === roomId);
    if (!room) return out;
    out.wifiFee = Number(room.wifi_fee) || 0;
    out.garbageFee = Number(room.garbage_fee) || 0;
    out.parkingFee = Number(room.parking_fee) || 0;
    await this.meterReadingsService.loadReadingsByRoomIds([roomId]);
    const withUsage = this.meterReadingsService.getReadingsWithUsage(roomId);
    const reading = withUsage.find((r) => r.year === year && r.month === month);
    const electricityUnits = reading?.electricity_usage ?? 0;
    const waterUnits = reading?.water_usage ?? 0;
    out.electricityAmount = electricityUnits * (Number(room.electricity_unit_price) || 0);
    out.waterAmount = waterUnits * (Number(room.water_unit_price) || 0);
    return out;
  }

  /** Invoice total = rent + electricity + water + sum(other_fees) - discount */
  invoiceTotal(inv: Invoice): number {
    const other = inv.other_fees_json && typeof inv.other_fees_json === 'object'
      ? Object.values(inv.other_fees_json).reduce((s, v) => s + Number(v), 0)
      : 0;
    return (
      Number(inv.rent_amount) +
      Number(inv.electricity_usage) +
      Number(inv.water_usage) +
      other -
      Number(inv.discount_amount ?? 0)
    );
  }

  /** Total revenue for a building in a month (sum of invoice totals for contracts in that building). */
  async getTotalRevenueForBuilding(buildingId: string, year: number, month: number): Promise<number> {
    const rooms = this.propertyService.getRoomsByBuilding(buildingId);
    const roomIds = rooms.map((r) => r.id);
    const { data: contractList } = await this.supabase
      .from('contracts')
      .select('id')
      .in('room_id', roomIds);
    if (!contractList?.length) return 0;
    const contractIds = contractList.map((c) => c.id);
    const { data: invList } = await this.supabase
      .from('invoices')
      .select('*')
      .in('contract_id', contractIds)
      .eq('year', year)
      .eq('month', month);
    const list = (invList ?? []) as Invoice[];
    return list.reduce((sum, inv) => sum + this.invoiceTotal(inv), 0);
  }

  /** Net Profit = Total Revenue - (Master Lease + OpEx + Monthly Depreciation). */
  async getNetProfit(buildingId: string, year: number, month: number): Promise<number> {
    const { revenue, costs } = await this.getBuildingMonthSummary(buildingId, year, month);
    return revenue - costs;
  }

  /** Revenue, costs (HĐ chủ nhà + OpEx + Khấu hao), and profit for a building in a month. */
  async getBuildingMonthSummary(
    buildingId: string,
    year: number,
    month: number
  ): Promise<{ revenue: number; costs: number; profit: number }> {
    const revenue = await this.getTotalRevenueForBuilding(buildingId, year, month);
    const depreciation = this.assetService.getMonthlyDepreciation(buildingId, year, month);
    const building = this.propertyService.buildings().find((b) => b.id === buildingId);
    let masterLease = 0;
    if (building?.deposit_to_owner != null && building?.owner_payment_cycle != null && building.owner_payment_cycle > 0) {
      masterLease = Number(building.deposit_to_owner) / building.owner_payment_cycle;
    }
    const opex = await this.opexService.getOpexForBuildingMonthAsync(buildingId, year, month);
    const costs = masterLease + opex + depreciation;
    const profit = revenue - costs;
    return { revenue, costs, profit };
  }

  async loadInvoices(contractId?: string): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    let q = this.supabase.from('invoices').select('*').order('year', { ascending: false }).order('month', { ascending: false });
    if (contractId) q = q.eq('contract_id', contractId);
    const { data, error } = await q;
    this.loading.set(false);
    if (error) {
      this.error.set(error.message);
      this.invoices.set([]);
      return;
    }
    this.invoices.set((data as Invoice[]) ?? []);
  }

  async loadContracts(roomId?: string): Promise<void> {
    let q = this.supabase.from('contracts').select('*').order('start_date', { ascending: false });
    if (roomId) q = q.eq('room_id', roomId);
    const { data } = await q;
    this.contracts.set((data as Contract[]) ?? []);
  }

  async createContract(c: Partial<Contract>): Promise<{ data: Contract | null; error: string | null }> {
    const { data, error } = await this.supabase.from('contracts').insert(c).select().single();
    if (!error) await this.loadContracts();
    return { data: data as Contract | null, error: error?.message ?? null };
  }

  async updateContract(id: string, c: Partial<Contract>): Promise<{ error: string | null }> {
    const { error } = await this.supabase.from('contracts').update(c).eq('id', id);
    if (!error) await this.loadContracts();
    return { error: error?.message ?? null };
  }

  async createInvoice(inv: Partial<Invoice>): Promise<{ data: Invoice | null; error: string | null }> {
    const payload = {
      ...inv,
      other_fees_json: inv.other_fees_json ?? {},
    };
    const { data, error } = await this.supabase.from('invoices').insert(payload).select().single();
    if (!error) await this.loadInvoices((inv as Invoice).contract_id);
    return { data: data as Invoice | null, error: error?.message ?? null };
  }

  async updateInvoice(id: string, inv: Partial<Invoice>): Promise<{ error: string | null }> {
    const { error } = await this.supabase.from('invoices').update(inv).eq('id', id);
    if (!error) await this.loadInvoices();
    return { error: error?.message ?? null };
  }

  async generateMonthlyInvoice(contractId: string, year: number, month: number, defaults: Partial<Invoice>): Promise<{ data: Invoice | null; error: string | null }> {
    const { data: existing } = await this.supabase
      .from('invoices')
      .select('id')
      .eq('contract_id', contractId)
      .eq('year', year)
      .eq('month', month)
      .single();
    if (existing) return { data: null, error: 'Invoice already exists for this month' };
    const { data: contract } = await this.supabase.from('contracts').select('actual_rent_price').eq('id', contractId).single();
    const rent = (contract as { actual_rent_price: number } | null)?.actual_rent_price ?? 0;
    const amounts = await this.computeUtilityAmountsForContract(contractId, year, month);
    const other_fees_json: Record<string, number> = {
      gom_rac: amounts.garbageFee,
      vesinh: 0,
      khac: 0,
      wifi: amounts.wifiFee,
      guixe: amounts.parkingFee,
      ...(defaults.other_fees_json ?? {}),
    };
    return this.createInvoice({
      contract_id: contractId,
      year,
      month,
      rent_amount: defaults.rent_amount ?? rent,
      electricity_usage: defaults.electricity_usage ?? amounts.electricityAmount,
      water_usage: defaults.water_usage ?? amounts.waterAmount,
      other_fees_json,
      discount_amount: defaults.discount_amount ?? 0,
      discount_reason: defaults.discount_reason ?? null,
      status: 'unpaid',
      ...defaults,
    });
  }
}
