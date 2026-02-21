import { Component, Inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { PropertyService } from '../../../core/services/property.service';
import type { Building } from '../../../core/services/property.service';

@Component({
  selector: 'app-building-dialog',
  standalone: true,
  imports: [MatDialogModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data ? 'Sửa tòa nhà' : 'Thêm tòa nhà' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Tên tòa nhà</mat-label>
          <input matInput formControlName="name" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Địa chỉ</mat-label>
          <input matInput formControlName="address" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Master lease bắt đầu (YYYY-MM-DD)</mat-label>
          <input matInput type="date" formControlName="master_lease_start" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Master lease kết thúc (YYYY-MM-DD)</mat-label>
          <input matInput type="date" formControlName="master_lease_end" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Chu kỳ trả chủ (tháng)</mat-label>
          <input matInput type="number" formControlName="owner_payment_cycle" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Tiền cọc gửi chủ</mat-label>
          <input matInput type="number" formControlName="deposit_to_owner" />
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
export class BuildingDialogComponent {
  form = this.fb.group({
    name: ['', Validators.required],
    address: [''],
    master_lease_start: [''],
    master_lease_end: [''],
    owner_payment_cycle: [null as number | null],
    deposit_to_owner: [null as number | null],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly dialogRef: MatDialogRef<BuildingDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Building | null,
    private readonly propertyService: PropertyService
  ) {
    if (data) {
      this.form.patchValue({
        name: data.name,
        address: data.address ?? '',
        master_lease_start: data.master_lease_start ?? '',
        master_lease_end: data.master_lease_end ?? '',
        owner_payment_cycle: data.owner_payment_cycle ?? null,
        deposit_to_owner: data.deposit_to_owner ?? null,
      });
    }
  }

  submit(): void {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    const payload = {
      name: v.name!,
      address: v.address || null,
      master_lease_start: v.master_lease_start || null,
      master_lease_end: v.master_lease_end || null,
      owner_payment_cycle: v.owner_payment_cycle ?? null,
      deposit_to_owner: v.deposit_to_owner ?? null,
    };
    if (this.data?.id) {
      this.propertyService.updateBuilding(this.data.id, payload).then(({ error }) => {
        if (!error) this.dialogRef.close(true);
      });
    } else {
      this.propertyService.createBuilding(payload).then(({ error }) => {
        if (!error) this.dialogRef.close(true);
      });
    }
  }
}
