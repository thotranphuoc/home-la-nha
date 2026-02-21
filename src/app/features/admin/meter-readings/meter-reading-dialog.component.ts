import { Component, Inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MeterReadingsService } from '../../../core/services/meter-readings.service';
import { PropertyService } from '../../../core/services/property.service';

export interface MeterReadingDialogData {
  buildingId: string | null;
  roomId: string | null;
  year: number | null;
  month: number | null;
  electricityReading: number;
  waterReading: number;
  note: string | null;
}

@Component({
  selector: 'app-meter-reading-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.roomId ? 'Cập nhật' : 'Thêm' }} chỉ số điện, nước</h2>
    <mat-dialog-content>
      <form [formGroup]="form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Phòng</mat-label>
          <mat-select formControlName="roomId">
            <mat-option [value]="null">-- Chọn phòng --</mat-option>
            @for (r of rooms; track r.id) {
              <mat-option [value]="r.id">{{ roomLabel(r) }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Tháng</mat-label>
          <mat-select formControlName="month">
            @for (m of months; track m) {
              <mat-option [value]="m">{{ m }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Năm</mat-label>
          <input matInput type="number" formControlName="year" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Chỉ số điện</mat-label>
          <input matInput type="number" formControlName="electricityReading" step="0.01" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Chỉ số nước</mat-label>
          <input matInput type="number" formControlName="waterReading" step="0.01" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Ghi chú</mat-label>
          <input matInput formControlName="note" />
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Hủy</button>
      <button mat-raised-button color="primary" (click)="submit()" [disabled]="form.invalid || saving">
        {{ saving ? 'Đang lưu...' : 'Lưu' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`.full-width { width: 100%; display: block; }`],
})
export class MeterReadingDialogComponent {
  form = this.fb.group({
    roomId: [null as string | null, Validators.required],
    month: [new Date().getMonth() + 1, [Validators.required, Validators.min(1), Validators.max(12)]],
    year: [new Date().getFullYear(), [Validators.required, Validators.min(2000)]],
    electricityReading: [0, [Validators.required, Validators.min(0)]],
    waterReading: [0, [Validators.required, Validators.min(0)]],
    note: [''],
  });
  saving = false;
  months = Array.from({ length: 12 }, (_, i) => i + 1);
  rooms = this.propertyService.getRoomsByBuilding(this.data.buildingId ?? '');

  constructor(
    private readonly fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: MeterReadingDialogData,
    private readonly dialogRef: MatDialogRef<MeterReadingDialogComponent>,
    private readonly meterReadingsService: MeterReadingsService,
    private readonly propertyService: PropertyService
  ) {
    this.form.patchValue({
      roomId: data.roomId ?? null,
      month: data.month ?? new Date().getMonth() + 1,
      year: data.year ?? new Date().getFullYear(),
      electricityReading: data.electricityReading ?? 0,
      waterReading: data.waterReading ?? 0,
      note: data.note ?? '',
    });
  }

  roomLabel(room: { room_number: string; building_id: string }): string {
    const b = this.propertyService.buildings().find((x) => x.id === room.building_id);
    return b ? `${b.name} - Phòng ${room.room_number}` : `Phòng ${room.room_number}`;
  }

  async submit(): Promise<void> {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    const roomId = v.roomId!;
    this.saving = true;
    const { error } = await this.meterReadingsService.upsert(
      roomId,
      Number(v.year),
      Number(v.month),
      Number(v.electricityReading),
      Number(v.waterReading),
      (v.note as string) || null
    );
    this.saving = false;
    if (!error) this.dialogRef.close(true);
  }
}
