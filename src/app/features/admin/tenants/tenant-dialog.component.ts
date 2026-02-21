import { Component, Inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { TenantService } from '../../../core/services/tenant.service';
import { FinanceService } from '../../../core/services/finance.service';
import { PropertyService } from '../../../core/services/property.service';
import type { Contract } from '../../../core/services/finance.service';

@Component({
  selector: 'app-tenant-dialog',
  standalone: true,
  imports: [MatDialogModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Thêm khách thuê</h2>
    <mat-dialog-content>
      <p class="hint">Tạo hồ sơ khách thuê gắn với một hợp đồng. Sau đó dùng "Gán tài khoản" để cho user đăng nhập xem hồ sơ.</p>
      <form [formGroup]="form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Hợp đồng (phòng)</mat-label>
          <mat-select formControlName="contract_id">
            @for (c of financeService.contracts(); track c.id) {
              <mat-option [value]="c.id">{{ contractLabel(c) }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Họ tên</mat-label>
          <input matInput formControlName="full_name" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Số CCCD (tùy chọn)</mat-label>
          <input matInput formControlName="id_number" />
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Hủy</button>
      <button mat-raised-button color="primary" (click)="submit()" [disabled]="form.invalid">Tạo hồ sơ</button>
    </mat-dialog-actions>
  `,
  styles: [`.full-width { width: 100%; display: block; } .hint { font-size: 0.9rem; color: #666; margin-bottom: 1rem; }`],
})
export class TenantDialogComponent {
  form = this.fb.group({
    contract_id: ['', Validators.required],
    full_name: ['', Validators.required],
    id_number: [''],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly dialogRef: MatDialogRef<TenantDialogComponent>,
    @Inject(MAT_DIALOG_DATA) _data: unknown,
    private readonly tenantService: TenantService,
    readonly financeService: FinanceService,
    private readonly propertyService: PropertyService
  ) {}

  contractLabel(c: Contract): string {
    const room = this.propertyService.rooms().find(r => r.id === c.room_id);
    const building = room ? this.propertyService.buildings().find(b => b.id === room.building_id) : null;
    const roomNum = room?.room_number ?? c.room_id;
    return building ? building.name + ' - Phòng ' + roomNum : 'Phòng ' + roomNum;
  }

  submit(): void {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    this.tenantService.createTenant({
      contract_id: v.contract_id!,
      full_name: v.full_name!,
      id_number: v.id_number || null,
    }).then(({ error }) => {
      if (!error) this.dialogRef.close(true);
    });
  }
}
