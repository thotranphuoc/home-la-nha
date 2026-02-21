import { Component, OnInit, signal } from '@angular/core';
import { PropertyService } from '../../../core/services/property.service';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { BuildingDialogComponent } from './building-dialog.component';
import type { Building } from '../../../core/services/property.service';

@Component({
  selector: 'app-buildings',
  standalone: true,
  imports: [MatTableModule, MatButtonModule, MatIconModule, MatTooltipModule],
  template: `
    <h1>Quản lý tòa nhà</h1>
    <button mat-raised-button color="primary" (click)="openDialog()">
      <mat-icon>add</mat-icon> Thêm tòa nhà
    </button>
    @if (propertyService.loading()) {
      <p>Đang tải...</p>
    } @else {
      <table mat-table [dataSource]="propertyService.buildings()" class="mat-elevation-z2">
        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef>Tên</th>
          <td mat-cell *matCellDef="let b">{{ b.name }}</td>
        </ng-container>
        <ng-container matColumnDef="address">
          <th mat-header-cell *matHeaderCellDef>Địa chỉ</th>
          <td mat-cell *matCellDef="let b">{{ b.address ?? '-' }}</td>
        </ng-container>
        <ng-container matColumnDef="deposit_to_owner">
          <th mat-header-cell *matHeaderCellDef>Tiền cọc chủ</th>
          <td mat-cell *matCellDef="let b">{{ b.deposit_to_owner ?? '-' }}</td>
        </ng-container>
        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef>Thao tác</th>
          <td mat-cell *matCellDef="let b">
            <button mat-icon-button (click)="openDialog(b)" matTooltip="Sửa"><mat-icon>edit</mat-icon></button>
          </td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
      </table>
    }
  `,
  styles: [`
    table { width: 100%; margin-top: 1rem; }
    button { margin-right: 0.5rem; }
  `],
})
export class BuildingsComponent implements OnInit {
  displayedColumns = ['name', 'address', 'deposit_to_owner', 'actions'];

  constructor(
    readonly propertyService: PropertyService,
    private readonly dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.propertyService.loadBuildings();
  }

  openDialog(building?: Building): void {
    const ref = this.dialog.open(BuildingDialogComponent, {
      width: '480px',
      data: building ?? null,
    });
    ref.afterClosed().subscribe(() => this.propertyService.loadBuildings());
  }
}
