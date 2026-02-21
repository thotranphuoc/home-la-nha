import { Component, OnInit, signal, computed } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { PropertyService } from '../../../core/services/property.service';
import { MeterReadingsService, type MeterReadingWithUsage } from '../../../core/services/meter-readings.service';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog } from '@angular/material/dialog';
import { MeterReadingDialogComponent } from './meter-reading-dialog.component';

@Component({
  selector: 'app-meter-readings',
  standalone: true,
  imports: [
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatSelectModule,
    DecimalPipe,
  ],
  template: `
    <h1>Chỉ số điện, nước theo phòng</h1>
    <p class="intro">Quản lý chỉ số công tơ điện, nước từng phòng theo kỳ. Dữ liệu dùng để theo dõi mức sử dụng, dự đoán và phát hiện bất thường.</p>
    <div class="toolbar">
      <mat-form-field appearance="outline">
        <mat-label>Tòa nhà</mat-label>
        <mat-select [value]="selectedBuildingId()" (valueChange)="onBuildingChange($event)">
          <mat-option [value]="null">-- Tất cả --</mat-option>
          @for (b of propertyService.buildings(); track b.id) {
            <mat-option [value]="b.id">{{ b.name }}</mat-option>
          }
        </mat-select>
      </mat-form-field>
      <button mat-raised-button color="primary" (click)="openAdd()" [disabled]="!selectedBuildingId()">
        <mat-icon>add</mat-icon> Thêm chỉ số
      </button>
    </div>
    @if (meterReadingsService.loading()) {
      <p>Đang tải...</p>
    } @else {
      <table mat-table [dataSource]="tableRows()" class="mat-elevation-z2">
        <ng-container matColumnDef="room">
          <th mat-header-cell *matHeaderCellDef>Phòng</th>
          <td mat-cell *matCellDef="let row">{{ row.roomLabel }}</td>
        </ng-container>
        <ng-container matColumnDef="period">
          <th mat-header-cell *matHeaderCellDef>Kỳ</th>
          <td mat-cell *matCellDef="let row">{{ row.month }}/{{ row.year }}</td>
        </ng-container>
        <ng-container matColumnDef="electricity_reading">
          <th mat-header-cell *matHeaderCellDef>Chỉ số điện</th>
          <td mat-cell *matCellDef="let row">{{ row.electricity_reading | number:'1.2-2' }}</td>
        </ng-container>
        <ng-container matColumnDef="water_reading">
          <th mat-header-cell *matHeaderCellDef>Chỉ số nước</th>
          <td mat-cell *matCellDef="let row">{{ row.water_reading | number:'1.2-2' }}</td>
        </ng-container>
        <ng-container matColumnDef="electricity_usage">
          <th mat-header-cell *matHeaderCellDef>Điện dùng</th>
          <td mat-cell *matCellDef="let row">
            {{ row.electricity_usage != null ? (row.electricity_usage | number:'1.2-2') : '–' }}
          </td>
        </ng-container>
        <ng-container matColumnDef="water_usage">
          <th mat-header-cell *matHeaderCellDef>Nước dùng</th>
          <td mat-cell *matCellDef="let row">
            {{ row.water_usage != null ? (row.water_usage | number:'1.2-2') : '–' }}
          </td>
        </ng-container>
        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef>Thao tác</th>
          <td mat-cell *matCellDef="let row">
            <button mat-icon-button (click)="openEdit(row)" matTooltip="Sửa"><mat-icon>edit</mat-icon></button>
          </td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="columns"></tr>
        <tr mat-row *matRowDef="let r; columns: columns;"></tr>
      </table>
      @if (tableRows().length === 0) {
        <p class="empty">Chưa có chỉ số nào. Chọn tòa nhà và bấm « Thêm chỉ số ».</p>
      }
    }
  `,
  styles: [`
    .intro { color: #555; margin-bottom: 1rem; font-size: 0.95rem; }
    .toolbar { display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem; flex-wrap: wrap; }
    .toolbar mat-form-field { min-width: 200px; }
    table { width: 100%; }
    .empty { color: #666; margin-top: 1rem; }
  `],
})
export class MeterReadingsComponent implements OnInit {
  columns = ['room', 'period', 'electricity_reading', 'water_reading', 'electricity_usage', 'water_usage', 'actions'];
  selectedBuildingId = signal<string | null>(null);

  constructor(
    readonly propertyService: PropertyService,
    readonly meterReadingsService: MeterReadingsService,
    private readonly dialog: MatDialog
  ) {}

  tableRows = computed(() => {
    const buildingId = this.selectedBuildingId();
    const rooms = buildingId
      ? this.propertyService.getRoomsByBuilding(buildingId)
      : this.propertyService.rooms();
    const roomIds = rooms.map((r) => r.id);
    const roomLabels = new Map(rooms.map((r) => {
      const b = this.propertyService.buildings().find((x) => x.id === r.building_id);
      return [r.id, b ? `${b.name} - Phòng ${r.room_number}` : `Phòng ${r.room_number}`];
    }));
    const rows: (MeterReadingWithUsage & { roomLabel: string })[] = [];
    roomIds.forEach((roomId) => {
      const withUsage = this.meterReadingsService.getReadingsWithUsage(roomId);
      withUsage.forEach((r) => {
        rows.push({ ...r, roomLabel: roomLabels.get(roomId) ?? roomId });
      });
    });
    rows.sort((a, b) => {
      const c = b.year - a.year;
      if (c !== 0) return c;
      return b.month - a.month;
    });
    return rows;
  });

  async ngOnInit(): Promise<void> {
    await this.propertyService.loadBuildings();
    await this.propertyService.loadRooms();
    const bid = this.selectedBuildingId();
    if (bid) await this.meterReadingsService.loadReadingsByRoomIds(this.propertyService.getRoomsByBuilding(bid).map((r) => r.id));
    else await this.meterReadingsService.loadReadingsByRoomIds(this.propertyService.rooms().map((r) => r.id));
  }

  onBuildingChange(buildingId: string | null): void {
    this.selectedBuildingId.set(buildingId);
    const roomIds = buildingId
      ? this.propertyService.getRoomsByBuilding(buildingId).map((r) => r.id)
      : this.propertyService.rooms().map((r) => r.id);
    this.meterReadingsService.loadReadingsByRoomIds(roomIds);
  }

  openAdd(): void {
    const buildingId = this.selectedBuildingId();
    const ref = this.dialog.open(MeterReadingDialogComponent, {
      width: '400px',
      data: {
        buildingId,
        roomId: null,
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        electricityReading: 0,
        waterReading: 0,
        note: null,
      } as import('./meter-reading-dialog.component').MeterReadingDialogData,
    });
    ref.afterClosed().subscribe((ok) => {
      if (ok) this.reload();
    });
  }

  openEdit(row: MeterReadingWithUsage & { roomLabel: string }): void {
    const room = this.propertyService.rooms().find((r) => r.id === row.room_id);
    const buildingId = room?.building_id ?? null;
    const ref = this.dialog.open(MeterReadingDialogComponent, {
      width: '400px',
      data: {
        buildingId,
        roomId: row.room_id,
        year: row.year,
        month: row.month,
        electricityReading: row.electricity_reading,
        waterReading: row.water_reading,
        note: row.note,
      } as import('./meter-reading-dialog.component').MeterReadingDialogData,
    });
    ref.afterClosed().subscribe((ok) => {
      if (ok) this.reload();
    });
  }

  private reload(): void {
    const buildingId = this.selectedBuildingId();
    const roomIds = buildingId
      ? this.propertyService.getRoomsByBuilding(buildingId).map((r) => r.id)
      : this.propertyService.rooms().map((r) => r.id);
    this.meterReadingsService.loadReadingsByRoomIds(roomIds);
  }
}
