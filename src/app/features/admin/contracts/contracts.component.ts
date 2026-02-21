import { Component, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FinanceService } from '../../../core/services/finance.service';
import { PropertyService } from '../../../core/services/property.service';
import { TenantService } from '../../../core/services/tenant.service';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ContractDialogComponent } from './contract-dialog.component';
import type { Contract } from '../../../core/services/finance.service';

@Component({
  selector: 'app-contracts',
  standalone: true,
  imports: [MatTableModule, MatButtonModule, MatIconModule, MatTooltipModule, DecimalPipe],
  template: `
    <h1>Hợp đồng với khách thuê</h1>
    <button mat-raised-button color="primary" (click)="openDialog()" class="add-btn">
      <mat-icon>add</mat-icon> Thêm hợp đồng
    </button>
    @if (financeService.loading()) {
      <p>Đang tải...</p>
    } @else {
      <table mat-table [dataSource]="financeService.contracts()" class="mat-elevation-z2">
        <ng-container matColumnDef="room">
          <th mat-header-cell *matHeaderCellDef>Phòng</th>
          <td mat-cell *matCellDef="let c">{{ contractRoomLabel(c) }}</td>
        </ng-container>
        <ng-container matColumnDef="tenant">
          <th mat-header-cell *matHeaderCellDef>Khách thuê</th>
          <td mat-cell *matCellDef="let c">{{ tenantName(c.id) }}</td>
        </ng-container>
        <ng-container matColumnDef="start_date">
          <th mat-header-cell *matHeaderCellDef>Từ ngày</th>
          <td mat-cell *matCellDef="let c">{{ c.start_date }}</td>
        </ng-container>
        <ng-container matColumnDef="end_date">
          <th mat-header-cell *matHeaderCellDef>Đến ngày</th>
          <td mat-cell *matCellDef="let c">{{ c.end_date }}</td>
        </ng-container>
        <ng-container matColumnDef="actual_rent_price">
          <th mat-header-cell *matHeaderCellDef>Giá thuê/tháng</th>
          <td mat-cell *matCellDef="let c">{{ c.actual_rent_price | number:'1.0-0' }}</td>
        </ng-container>
        <ng-container matColumnDef="deposit_amount">
          <th mat-header-cell *matHeaderCellDef>Cọc</th>
          <td mat-cell *matCellDef="let c">{{ c.deposit_amount != null ? (c.deposit_amount | number:'1.0-0') : '–' }}</td>
        </ng-container>
        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef>Thao tác</th>
          <td mat-cell *matCellDef="let c">
            <button mat-icon-button (click)="openDialog(c)" matTooltip="Sửa"><mat-icon>edit</mat-icon></button>
          </td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
      </table>
    }
  `,
  styles: [`
    .add-btn { margin-bottom: 1rem; }
    table { width: 100%; }
  `],
})
export class ContractsComponent implements OnInit {
  displayedColumns = ['room', 'tenant', 'start_date', 'end_date', 'actual_rent_price', 'deposit_amount', 'actions'];

  constructor(
    readonly financeService: FinanceService,
    private readonly propertyService: PropertyService,
    private readonly tenantService: TenantService,
    private readonly dialog: MatDialog
  ) {}

  contractRoomLabel(c: Contract): string {
    const room = this.propertyService.rooms().find(r => r.id === c.room_id);
    const building = room ? this.propertyService.buildings().find(b => b.id === room.building_id) : null;
    const roomNum = room?.room_number ?? c.room_id;
    return building ? building.name + ' - Phòng ' + roomNum : 'Phòng ' + roomNum;
  }

  tenantName(contractId: string): string {
    const t = this.tenantService.tenants().find(x => x.contract_id === contractId);
    return t?.full_name ?? '–';
  }

  async ngOnInit(): Promise<void> {
    await this.propertyService.loadBuildings();
    await this.propertyService.loadRooms();
    await this.financeService.loadContracts();
    await this.tenantService.loadAllTenants();
  }

  openDialog(contract?: Contract): void {
    const ref = this.dialog.open(ContractDialogComponent, { width: '420px', data: contract ?? null });
    ref.afterClosed().subscribe(() => {
      this.financeService.loadContracts();
      this.tenantService.loadAllTenants();
    });
  }
}
