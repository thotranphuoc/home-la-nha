import { Component, Inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { PropertyService } from '../../../core/services/property.service';
import type { Room, RoomStatus } from '../../../core/services/property.service';

export interface RoomDialogData {
  room?: Room;
  buildingId?: string;
}

@Component({
  selector: 'app-room-dialog',
  standalone: true,
  imports: [MatDialogModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data?.room ? 'Sửa phòng' : 'Thêm phòng' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Tòa nhà</mat-label>
          <mat-select formControlName="building_id">
            @for (b of propertyService.buildings(); track b.id) {
              <mat-option [value]="b.id">{{ b.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Số phòng</mat-label>
          <input matInput formControlName="room_number" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Trạng thái</mat-label>
          <mat-select formControlName="status">
            <mat-option value="empty">Trống</mat-option>
            <mat-option value="occupied">Đã thuê</mat-option>
            <mat-option value="maintenance">Bảo trì</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Giá gốc</mat-label>
          <input matInput type="number" formControlName="base_price" />
        </mat-form-field>
        <h3 class="section-label">Đơn giá / phí theo phòng</h3>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Đơn giá điện (đồng/kWh)</mat-label>
          <input matInput type="number" formControlName="electricity_unit_price" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Đơn giá nước (đồng/m³)</mat-label>
          <input matInput type="number" formControlName="water_unit_price" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Phí wifi (đồng/tháng)</mat-label>
          <input matInput type="number" formControlName="wifi_fee" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Phí gom rác (đồng/tháng)</mat-label>
          <input matInput type="number" formControlName="garbage_fee" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Phí gửi xe (đồng/tháng)</mat-label>
          <input matInput type="number" formControlName="parking_fee" />
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Hủy</button>
      <button mat-raised-button color="primary" (click)="submit()" [disabled]="form.invalid">Lưu</button>
    </mat-dialog-actions>
  `,
  styles: [`.full-width { width: 100%; display: block; } .section-label { margin: 1rem 0 0.5rem 0; font-size: 0.95rem; }`],
})
export class RoomDialogComponent {
  form = this.fb.group({
    building_id: ['', Validators.required],
    room_number: ['', Validators.required],
    status: ['empty' as RoomStatus, Validators.required],
    base_price: [null as number | null],
    electricity_unit_price: [null as number | null],
    water_unit_price: [null as number | null],
    wifi_fee: [null as number | null],
    garbage_fee: [null as number | null],
    parking_fee: [null as number | null],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly dialogRef: MatDialogRef<RoomDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: RoomDialogData | null,
    readonly propertyService: PropertyService
  ) {
    if (data?.room) {
      this.form.patchValue({
        building_id: data.room.building_id,
        room_number: data.room.room_number,
        status: data.room.status,
        base_price: data.room.base_price ?? null,
        electricity_unit_price: data.room.electricity_unit_price ?? null,
        water_unit_price: data.room.water_unit_price ?? null,
        wifi_fee: data.room.wifi_fee ?? null,
        garbage_fee: data.room.garbage_fee ?? null,
        parking_fee: data.room.parking_fee ?? null,
      });
    } else if (data?.buildingId) {
      this.form.patchValue({ building_id: data.buildingId });
    }
  }

  submit(): void {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    const payload = {
      building_id: v.building_id!,
      room_number: v.room_number!,
      status: v.status!,
      base_price: v.base_price ?? null,
      electricity_unit_price: v.electricity_unit_price ?? null,
      water_unit_price: v.water_unit_price ?? null,
      wifi_fee: v.wifi_fee ?? null,
      garbage_fee: v.garbage_fee ?? null,
      parking_fee: v.parking_fee ?? null,
    };
    if (this.data?.room?.id) {
      this.propertyService.updateRoom(this.data.room.id, payload).then(({ error }) => {
        if (!error) this.dialogRef.close(true);
      });
    } else {
      this.propertyService.createRoom(payload).then(({ error }) => {
        if (!error) this.dialogRef.close(true);
      });
    }
  }
}
