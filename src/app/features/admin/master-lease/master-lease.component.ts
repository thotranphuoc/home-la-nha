import { Component, OnInit } from '@angular/core';
import { PropertyService } from '../../../core/services/property.service';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BuildingDialogComponent } from '../buildings/building-dialog.component';
import type { Building } from '../../../core/services/property.service';

@Component({
  selector: 'app-master-lease',
  standalone: true,
  imports: [MatTableModule, MatButtonModule, MatIconModule, MatTooltipModule],
  template: `
    <h1>Hợp đồng với chủ nhà (Master lease)</h1>
    <p>Thông tin hợp đồng thuê tòa nhà từ chủ. Chỉnh sửa tại từng tòa nhà.</p>
    @if (propertyService.loading()) {
      <p>Đang tải...</p>
    } @else {
      <table mat-table [dataSource]="propertyService.buildings()" class="mat-elevation-z2">
        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef>Tòa nhà</th>
          <td mat-cell *matCellDef="let b">{{ b.name }}</td>
        </ng-container>
        <ng-container matColumnDef="address">
          <th mat-header-cell *matHeaderCellDef>Địa chỉ</th>
          <td mat-cell *matCellDef="let b">{{ b.address ?? '-' }}</td>
        </ng-container>
        <ng-container matColumnDef="lease_start">
          <th mat-header-cell *matHeaderCellDef>HĐ từ</th>
          <td mat-cell *matCellDef="let b">{{ b.master_lease_start ?? '-' }}</td>
        </ng-container>
        <ng-container matColumnDef="lease_end">
          <th mat-header-cell *matHeaderCellDef>HĐ đến</th>
          <td mat-cell *matCellDef="let b">{{ b.master_lease_end ?? '-' }}</td>
        </ng-container>
        <ng-container matColumnDef="deposit_to_owner">
          <th mat-header-cell *matHeaderCellDef>Tiền cọc chủ</th>
          <td mat-cell *matCellDef="let b">{{ b.deposit_to_owner ?? '-' }}</td>
        </ng-container>
        <ng-container matColumnDef="payment_cycle">
          <th mat-header-cell *matHeaderCellDef>Chu kỳ trả (tháng)</th>
          <td mat-cell *matCellDef="let b">{{ b.owner_payment_cycle ?? '-' }}</td>
        </ng-container>
        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef>Thao tác</th>
          <td mat-cell *matCellDef="let b">
            <button mat-icon-button (click)="openEdit(b)" matTooltip="Sửa thông tin hợp đồng chủ"><mat-icon>edit</mat-icon></button>
          </td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
      </table>
    }
  `,
  styles: [`table { width: 100%; }`],
})
export class MasterLeaseComponent implements OnInit {
  displayedColumns = ['name', 'address', 'lease_start', 'lease_end', 'deposit_to_owner', 'payment_cycle', 'actions'];

  constructor(
    readonly propertyService: PropertyService,
    private readonly dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.propertyService.loadBuildings();
  }

  openEdit(building: Building): void {
    const ref = this.dialog.open(BuildingDialogComponent, { width: '480px', data: building });
    ref.afterClosed().subscribe(() => this.propertyService.loadBuildings());
  }
}
