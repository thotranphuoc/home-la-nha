import { Component, Inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { FinanceService } from '../../../core/services/finance.service';
import { PropertyService } from '../../../core/services/property.service';
import type { Contract } from '../../../core/services/finance.service';

@Component({
  selector: 'app-contract-dialog',
  standalone: true,
  imports: [MatDialogModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data ? 'Sửa hợp đồng thuê' : 'Thêm hợp đồng thuê' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Phòng</mat-label>
          <mat-select formControlName="room_id">
            @for (r of rooms; track r.id) {
              <mat-option [value]="r.id">{{ buildingName(r.building_id) }} - Phòng {{ r.room_number }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Ngày bắt đầu</mat-label>
          <input matInput type="date" formControlName="start_date" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Ngày kết thúc</mat-label>
          <input matInput type="date" formControlName="end_date" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Giá thuê thực (tháng)</mat-label>
          <input matInput type="number" formControlName="actual_rent_price" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Tiền cọc</mat-label>
          <input matInput type="number" formControlName="deposit_amount" />
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Hủy</button>
      <button mat-raised-button color="primary" (click)="submit()" [disabled]="form.invalid">Lưu</button>
    </mat-dialog-actions>
  `,
  styles: [`.full-width { width: 100%; display: block; }`],
})
export class ContractDialogComponent {
  form = this.fb.group({
    room_id: ['', Validators.required],
    start_date: ['', Validators.required],
    end_date: ['', Validators.required],
    actual_rent_price: [0, [Validators.required, Validators.min(0)]],
    deposit_amount: [null as number | null],
  });

  rooms = this.propertyService.rooms();

  constructor(
    private readonly fb: FormBuilder,
    private readonly dialogRef: MatDialogRef<ContractDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Contract | null,
    private readonly financeService: FinanceService,
    private readonly propertyService: PropertyService
  ) {
    if (data) {
      this.form.patchValue({
        room_id: data.room_id,
        start_date: data.start_date,
        end_date: data.end_date,
        actual_rent_price: data.actual_rent_price,
        deposit_amount: data.deposit_amount ?? null,
      });
    }
  }

  buildingName(buildingId: string): string {
    return this.propertyService.buildings().find(b => b.id === buildingId)?.name ?? buildingId;
  }

  submit(): void {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    const payload = {
      room_id: v.room_id!,
      start_date: v.start_date!,
      end_date: v.end_date!,
      actual_rent_price: Number(v.actual_rent_price),
      deposit_amount: v.deposit_amount ?? null,
    };
    if (this.data?.id) {
      this.financeService.updateContract(this.data.id, payload).then(({ error }) => {
        if (!error) this.dialogRef.close(true);
      });
    } else {
      this.financeService.createContract(payload).then(({ error }) => {
        if (!error) this.dialogRef.close(true);
      });
    }
  }
}
