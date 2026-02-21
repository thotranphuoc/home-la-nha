import { Component, OnInit, signal } from '@angular/core';
import { TenantService } from '../../../core/services/tenant.service';
import { PropertyService } from '../../../core/services/property.service';
import { FinanceService } from '../../../core/services/finance.service';
import { AuthService } from '../../../core/services/auth.service';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog } from '@angular/material/dialog';
import { TenantDialogComponent } from './tenant-dialog.component';
import { AssignAccountDialogComponent } from './assign-account-dialog.component';
import { TenantProfileDialogComponent } from './tenant-profile-dialog.component';
import type { Tenant, ResidenceStatus } from '../../../core/services/tenant.service';

@Component({
  selector: 'app-tenants',
  standalone: true,
  imports: [MatTableModule, MatButtonModule, MatIconModule, MatSlideToggleModule, MatTooltipModule, MatSelectModule],
  template: `
    <h1>Quản lý khách thuê</h1>
    <p class="intro">Tạo hồ sơ khách thuê cho từng hợp đồng, sau đó gán email đăng nhập để khách có thể vào Cổng khách thuê (Cập nhật CCCD, Hóa đơn).</p>
    <button mat-raised-button color="primary" (click)="openCreateTenant()" class="add-btn">
      <mat-icon>add</mat-icon> Thêm khách thuê
    </button>
    @if (tenantService.loading()) {
      <p>Đang tải...</p>
    } @else {
      <table mat-table [dataSource]="tenantService.tenants()" class="mat-elevation-z2">
        <ng-container matColumnDef="full_name">
          <th mat-header-cell *matHeaderCellDef>Họ tên</th>
          <td mat-cell *matCellDef="let t">{{ t.full_name }}</td>
        </ng-container>
        <ng-container matColumnDef="id_number">
          <th mat-header-cell *matHeaderCellDef>CCCD (mask)</th>
          <td mat-cell *matCellDef="let t">{{ tenantService.maskIdNumber(t.id_number) }}</td>
        </ng-container>
        <ng-container matColumnDef="contract">
          <th mat-header-cell *matHeaderCellDef>Hợp đồng / Phòng</th>
          <td mat-cell *matCellDef="let t">{{ contractRoomLabel(t.contract_id) }}</td>
        </ng-container>
        <ng-container matColumnDef="account">
          <th mat-header-cell *matHeaderCellDef>Tài khoản đăng nhập</th>
          <td mat-cell *matCellDef="let t">
            {{ accountEmailByContract()[t.contract_id] ?? 'Chưa gán' }}
            @if (!accountEmailByContract()[t.contract_id]) {
              <button mat-icon-button (click)="openAssignAccount(t)" matTooltip="Gán email đăng nhập">
                <mat-icon>link</mat-icon>
              </button>
            }
          </td>
        </ng-container>
        <ng-container matColumnDef="residence_status">
          <th mat-header-cell *matHeaderCellDef>Trạng thái hồ sơ</th>
          <td mat-cell *matCellDef="let t">
            <mat-select [value]="t.residence_status" (selectionChange)="updateResidenceStatus(t.id, $event.value)" class="status-select">
              <mat-option value="pending">Chờ</mat-option>
              <mat-option value="completed">Hoàn thành</mat-option>
            </mat-select>
          </td>
        </ng-container>
        <ng-container matColumnDef="is_locked">
          <th mat-header-cell *matHeaderCellDef>Khóa sửa</th>
          <td mat-cell *matCellDef="let t">
            <mat-slide-toggle
              [checked]="t.is_locked"
              (change)="toggleLock(t.id, $event.checked)"
              matTooltip="{{ t.is_locked ? 'Bật khóa: khách không sửa được hồ sơ' : 'Tắt khóa: khách có thể sửa' }}"
            ></mat-slide-toggle>
          </td>
        </ng-container>
        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef>Thao tác</th>
          <td mat-cell *matCellDef="let t">
            <button mat-button color="primary" (click)="openProfile(t)" matTooltip="Xem / Sửa hồ sơ khách thuê">
              <mat-icon>person</mat-icon> Xem hồ sơ
            </button>
          </td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="tenantColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: tenantColumns;"></tr>
      </table>
    }
  `,
  styles: [`
    .intro { margin-bottom: 1rem; color: #555; font-size: 0.95rem; }
    .add-btn { margin-bottom: 1rem; }
    table { width: 100%; }
    .status-select { min-width: 120px; }
  `],
})
export class TenantsComponent implements OnInit {
  tenantColumns = ['full_name', 'id_number', 'contract', 'account', 'residence_status', 'is_locked', 'actions'];
  accountEmailByContract = signal<Record<string, string>>({});

  constructor(
    readonly tenantService: TenantService,
    private readonly propertyService: PropertyService,
    private readonly financeService: FinanceService,
    private readonly auth: AuthService,
    private readonly dialog: MatDialog
  ) {}

  contractRoomLabel(contractId: string): string {
    const contract = this.financeService.contracts().find(c => c.id === contractId);
    if (!contract) return contractId;
    const room = this.propertyService.rooms().find(r => r.id === contract.room_id);
    const building = room ? this.propertyService.buildings().find(b => b.id === room.building_id) : null;
    const roomNum = room?.room_number ?? contract.room_id;
    return building ? building.name + ' - Phòng ' + roomNum : 'Phòng ' + roomNum;
  }

  async ngOnInit(): Promise<void> {
    await this.propertyService.loadBuildings();
    await this.propertyService.loadRooms();
    await this.financeService.loadContracts();
    await this.tenantService.loadAllTenants();
    const map = await this.auth.loadProfileEmailsByContract();
    this.accountEmailByContract.set(map);
  }

  async refreshAccountEmails(): Promise<void> {
    const map = await this.auth.loadProfileEmailsByContract();
    this.accountEmailByContract.set(map);
  }

  openCreateTenant(): void {
    const ref = this.dialog.open(TenantDialogComponent, { width: '420px', data: null });
    ref.afterClosed().subscribe(() => {
      this.tenantService.loadAllTenants();
    });
  }

  openAssignAccount(tenant: Tenant): void {
    const ref = this.dialog.open(AssignAccountDialogComponent, {
      width: '400px',
      data: { tenantName: tenant.full_name, contractId: tenant.contract_id },
    });
    ref.afterClosed().subscribe(() => this.refreshAccountEmails());
  }

  toggleLock(tenantId: string, isLocked: boolean): void {
    this.tenantService.setLock(tenantId, isLocked).then(({ error }) => {
      if (!error) this.tenantService.loadAllTenants();
    });
  }

  updateResidenceStatus(tenantId: string, status: ResidenceStatus): void {
    this.tenantService.updateTenant(tenantId, { residence_status: status }).then(({ error }) => {
      if (!error) this.tenantService.loadAllTenants();
    });
  }

  openProfile(tenant: Tenant): void {
    const ref = this.dialog.open(TenantProfileDialogComponent, {
      width: '520px',
      maxHeight: '90vh',
      data: { tenant: { ...tenant } },
    });
    ref.afterClosed().subscribe((refreshed) => {
      if (refreshed) this.tenantService.loadAllTenants();
    });
  }
}
