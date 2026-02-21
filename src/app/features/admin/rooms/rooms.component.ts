import { Component, OnInit, signal } from '@angular/core';
import { PropertyService } from '../../../core/services/property.service';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RoomDialogComponent, type RoomDialogData } from './room-dialog.component';
import type { Room } from '../../../core/services/property.service';

@Component({
  selector: 'app-rooms',
  standalone: true,
  imports: [
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatTooltipModule,
  ],
  template: `
    <h1>Danh sách phòng</h1>
    <div class="toolbar">
      <mat-form-field appearance="outline" class="building-filter">
        <mat-label>Lọc theo tòa nhà</mat-label>
        <mat-select [value]="filterBuildingId()" (selectionChange)="onBuildingFilter($event.value)">
          <mat-option [value]="null">Tất cả</mat-option>
          @for (b of propertyService.buildings(); track b.id) {
            <mat-option [value]="b.id">{{ b.name }}</mat-option>
          }
        </mat-select>
      </mat-form-field>
      <button mat-raised-button color="primary" (click)="openDialog()">
        <mat-icon>add</mat-icon> Thêm phòng
      </button>
    </div>
    @if (propertyService.loading()) {
      <p>Đang tải...</p>
    } @else {
      <table mat-table [dataSource]="filteredRooms()" class="mat-elevation-z2">
        <ng-container matColumnDef="room_number">
          <th mat-header-cell *matHeaderCellDef>Số phòng</th>
          <td mat-cell *matCellDef="let r">{{ r.room_number }}</td>
        </ng-container>
        <ng-container matColumnDef="building">
          <th mat-header-cell *matHeaderCellDef>Tòa nhà</th>
          <td mat-cell *matCellDef="let r">{{ buildingName(r.building_id) }}</td>
        </ng-container>
        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef>Trạng thái</th>
          <td mat-cell *matCellDef="let r">{{ statusLabel(r.status) }}</td>
        </ng-container>
        <ng-container matColumnDef="base_price">
          <th mat-header-cell *matHeaderCellDef>Giá gốc</th>
          <td mat-cell *matCellDef="let r">{{ r.base_price ?? '-' }}</td>
        </ng-container>
        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef>Thao tác</th>
          <td mat-cell *matCellDef="let r">
            <button mat-icon-button (click)="openDialog(r)" matTooltip="Sửa"><mat-icon>edit</mat-icon></button>
          </td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
      </table>
    }
  `,
  styles: [`
    .toolbar { display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem; }
    .building-filter { min-width: 200px; }
    table { width: 100%; }
  `],
})
export class RoomsComponent implements OnInit {
  displayedColumns = ['room_number', 'building', 'status', 'base_price', 'actions'];
  filterBuildingId = signal<string | null>(null);
  filteredRooms = signal<Room[]>([]);

  constructor(
    readonly propertyService: PropertyService,
    private readonly dialog: MatDialog
  ) {}

  buildingName(buildingId: string): string {
    return this.propertyService.buildings().find(b => b.id === buildingId)?.name ?? buildingId;
  }

  statusLabel(s: string): string {
    return s === 'empty' ? 'Trống' : s === 'occupied' ? 'Đã thuê' : 'Bảo trì';
  }

  onBuildingFilter(id: string | null): void {
    this.filterBuildingId.set(id);
    this.applyFilter();
  }

  private applyFilter(): void {
    const id = this.filterBuildingId();
    const list = id
      ? this.propertyService.rooms().filter(r => r.building_id === id)
      : this.propertyService.rooms();
    this.filteredRooms.set(list);
  }

  async ngOnInit(): Promise<void> {
    await this.propertyService.loadBuildings();
    await this.propertyService.loadRooms();
    this.applyFilter();
  }

  openDialog(room?: Room): void {
    const data: RoomDialogData = room ? { room } : { buildingId: this.filterBuildingId() ?? undefined };
    const ref = this.dialog.open(RoomDialogComponent, { width: '400px', data });
    ref.afterClosed().subscribe(() => {
      this.propertyService.loadRooms().then(() => this.applyFilter());
    });
  }
}
