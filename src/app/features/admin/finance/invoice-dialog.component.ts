import { Component, Inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { FinanceService } from '../../../core/services/finance.service';
import { PropertyService } from '../../../core/services/property.service';
import type { Invoice, InvoiceStatus } from '../../../core/services/finance.service';

@Component({
  selector: 'app-invoice-dialog',
  standalone: true,
  imports: [MatDialogModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Sửa hóa đơn {{ data.month }}/{{ data.year }}</h2>
    <mat-dialog-content>
      <p class="hint">Điện, nước, Phí gom rác, wifi, gửi xe lấy từ phòng; Phí vệ sinh (lau dọn theo giờ) và Phí khác nhập tay nếu có.</p>
      @if (loadingAutoFill()) {
        <p class="loading-hint">Đang lấy số liệu từ chỉ số và phòng...</p>
      }
      <form [formGroup]="form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Tiền thuê phòng</mat-label>
          <input matInput type="number" formControlName="rent_amount" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Điện (số tiền)</mat-label>
          <input matInput type="number" formControlName="electricity_usage" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Nước (số tiền)</mat-label>
          <input matInput type="number" formControlName="water_usage" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Phí gom rác</mat-label>
          <input matInput type="number" formControlName="fee_gom_rac" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Wifi</mat-label>
          <input matInput type="number" formControlName="fee_wifi" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Phí vệ sinh (lau dọn theo giờ)</mat-label>
          <input matInput type="number" formControlName="fee_vesinh" placeholder="Phát sinh" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Phí gửi xe</mat-label>
          <input matInput type="number" formControlName="fee_guixe" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Phí khác</mat-label>
          <input matInput type="number" formControlName="fee_khac" placeholder="Sửa chữa, lắp đặt..." />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Giảm trừ</mat-label>
          <input matInput type="number" formControlName="discount_amount" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Lý do giảm trừ</mat-label>
          <input matInput formControlName="discount_reason" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Trạng thái</mat-label>
          <mat-select formControlName="status">
            <mat-option value="unpaid">Chưa thanh toán</mat-option>
            <mat-option value="paid">Đã thanh toán</mat-option>
          </mat-select>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Hủy</button>
      <button mat-raised-button color="primary" (click)="submit()" [disabled]="form.invalid">Lưu</button>
    </mat-dialog-actions>
  `,
  styles: [`.full-width { width: 100%; display: block; } .hint, .loading-hint { font-size: 0.85rem; color: #666; margin-bottom: 0.5rem; }`],
})
export class InvoiceDialogComponent implements OnInit {
  readonly loadingAutoFill = signal(false);

  form = this.fb.group({
    rent_amount: [0, [Validators.required, Validators.min(0)]],
    electricity_usage: [0, [Validators.required, Validators.min(0)]],
    water_usage: [0, [Validators.required, Validators.min(0)]],
    fee_gom_rac: [0, [Validators.min(0)]],
    fee_wifi: [0, [Validators.min(0)]],
    fee_vesinh: [0, [Validators.min(0)]],
    fee_guixe: [0, [Validators.min(0)]],
    fee_khac: [0, [Validators.min(0)]],
    discount_amount: [0, [Validators.required, Validators.min(0)]],
    discount_reason: [''],
    status: ['unpaid' as InvoiceStatus, Validators.required],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly dialogRef: MatDialogRef<InvoiceDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Invoice,
    private readonly financeService: FinanceService,
    private readonly propertyService: PropertyService
  ) {
    const other = data.other_fees_json ?? {};
    this.form.patchValue({
      rent_amount: data.rent_amount,
      electricity_usage: data.electricity_usage,
      water_usage: data.water_usage,
      fee_gom_rac: typeof other['gom_rac'] === 'number' ? other['gom_rac'] : (typeof other['rac'] === 'number' ? other['rac'] : 0),
      fee_wifi: typeof other['wifi'] === 'number' ? other['wifi'] : 0,
      fee_vesinh: typeof other['vesinh'] === 'number' ? other['vesinh'] : 0,
      fee_guixe: typeof other['guixe'] === 'number' ? other['guixe'] : 0,
      fee_khac: typeof other['khac'] === 'number' ? other['khac'] : 0,
      discount_amount: data.discount_amount ?? 0,
      discount_reason: data.discount_reason ?? '',
      status: data.status,
    });
  }

  ngOnInit(): void {
    this.loadAndFillFromMeterAndRoom();
  }

  private async loadAndFillFromMeterAndRoom(): Promise<void> {
    this.loadingAutoFill.set(true);
    try {
      const contract = this.financeService.contracts().find((c) => c.id === this.data.contract_id);
      if (!contract) return;
      let room = this.propertyService.rooms().find((r) => r.id === contract.room_id);
      if (!room) {
        await this.propertyService.loadRooms();
        room = this.propertyService.rooms().find((r) => r.id === contract.room_id);
      }
      if (!room) return;
      const amounts = await this.financeService.computeUtilityAmountsForContract(
        this.data.contract_id,
        this.data.year,
        this.data.month
      );
      this.form.patchValue({
        electricity_usage: amounts.electricityAmount,
        water_usage: amounts.waterAmount,
        fee_gom_rac: amounts.garbageFee,
        fee_wifi: amounts.wifiFee,
        fee_guixe: amounts.parkingFee,
      });
    } finally {
      this.loadingAutoFill.set(false);
    }
  }

  submit(): void {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    const other = this.data.other_fees_json ?? {};
    const other_fees_json: Record<string, number> = {
      ...other,
      gom_rac: Number(v.fee_gom_rac) || 0,
      wifi: Number(v.fee_wifi) || 0,
      vesinh: Number(v.fee_vesinh) || 0,
      guixe: Number(v.fee_guixe) || 0,
      khac: Number(v.fee_khac) || 0,
    };
    this.financeService.updateInvoice(this.data.id, {
      rent_amount: Number(v.rent_amount),
      electricity_usage: Number(v.electricity_usage),
      water_usage: Number(v.water_usage),
      other_fees_json,
      discount_amount: Number(v.discount_amount),
      discount_reason: v.discount_reason || null,
      status: v.status!,
    }).then(({ error }) => {
      if (!error) this.dialogRef.close(true);
    });
  }
}
