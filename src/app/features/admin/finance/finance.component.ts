import { Component, OnInit, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { FinanceService } from '../../../core/services/finance.service';
import { PropertyService } from '../../../core/services/property.service';
import { OpexService, type OpexLog } from '../../../core/services/opex.service';
import { AssetService } from '../../../core/services/asset.service';
import { SetupCostsService } from '../../../core/services/setup-costs.service';
import { ExpenseCategoriesService } from '../../../core/services/expense-categories.service';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import { InvoiceDialogComponent } from './invoice-dialog.component';
import { AssetDialogComponent } from '../assets/asset-dialog.component';
import type { Invoice } from '../../../core/services/finance.service';
import type { AssetLog } from '../../../core/services/asset.service';

@Component({
  selector: 'app-finance',
  standalone: true,
  imports: [
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatTabsModule,
    DecimalPipe,
  ],
  template: `
    <h1>Thu chi</h1>
    <mat-tab-group class="finance-tabs">
      <mat-tab label="Thu">
        <div class="tab-content">
          <div class="generate-section">
            <h3>Tạo hóa đơn tháng</h3>
            <mat-form-field appearance="outline">
              <mat-label>Hợp đồng (phòng)</mat-label>
              <mat-select [(value)]="selectedContractId">
                <mat-option [value]="null">-- Chọn hợp đồng --</mat-option>
                @for (c of financeService.contracts(); track c.id) {
                  <mat-option [value]="c.id">{{ contractLabel(c) }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Tháng</mat-label>
              <input matInput type="number" min="1" max="12" [(ngModel)]="genMonth" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Năm</mat-label>
              <input matInput type="number" [(ngModel)]="genYear" />
            </mat-form-field>
            <button mat-raised-button color="primary" (click)="generateInvoice()" [disabled]="generating() || !selectedContractId">
              {{ generating() ? 'Đang tạo...' : 'Tạo hóa đơn' }}
            </button>
            @if (genMessage()) {
              <span [class.error]="genError()">{{ genMessage() }}</span>
            }
          </div>
          <p class="invoice-hint">Tổng hóa đơn = Tiền thuê + Điện + Nước + Phí gom rác + Wifi + Phí vệ sinh + Phí gửi xe + Phí khác - Giảm trừ. Bấm <strong>Sửa</strong> để cập nhật hoặc xem chi tiết.</p>
          @if (financeService.loading()) {
            <p>Đang tải...</p>
          } @else {
            <table mat-table [dataSource]="financeService.invoices()" class="mat-elevation-z2">
              <ng-container matColumnDef="contract">
                <th mat-header-cell *matHeaderCellDef>Hợp đồng</th>
                <td mat-cell *matCellDef="let i">{{ contractLabelById(i.contract_id) }}</td>
              </ng-container>
              <ng-container matColumnDef="month">
                <th mat-header-cell *matHeaderCellDef>Tháng</th>
                <td mat-cell *matCellDef="let i">{{ i.month }}/{{ i.year }}</td>
              </ng-container>
              <ng-container matColumnDef="rent_amount">
                <th mat-header-cell *matHeaderCellDef>Tiền thuê</th>
                <td mat-cell *matCellDef="let i">{{ i.rent_amount | number:'1.0-0' }}</td>
              </ng-container>
              <ng-container matColumnDef="electricity_usage">
                <th mat-header-cell *matHeaderCellDef>Điện</th>
                <td mat-cell *matCellDef="let i">{{ i.electricity_usage | number:'1.0-0' }}</td>
              </ng-container>
              <ng-container matColumnDef="water_usage">
                <th mat-header-cell *matHeaderCellDef>Nước</th>
                <td mat-cell *matCellDef="let i">{{ i.water_usage | number:'1.0-0' }}</td>
              </ng-container>
              <ng-container matColumnDef="fee_gom_rac">
                <th mat-header-cell *matHeaderCellDef>Gom rác</th>
                <td mat-cell *matCellDef="let i">{{ otherFee(i, 'gom_rac') | number:'1.0-0' }}</td>
              </ng-container>
              <ng-container matColumnDef="fee_wifi">
                <th mat-header-cell *matHeaderCellDef>Wifi</th>
                <td mat-cell *matCellDef="let i">{{ otherFee(i, 'wifi') | number:'1.0-0' }}</td>
              </ng-container>
              <ng-container matColumnDef="fee_vesinh">
                <th mat-header-cell *matHeaderCellDef>Vệ sinh</th>
                <td mat-cell *matCellDef="let i">{{ otherFee(i, 'vesinh') | number:'1.0-0' }}</td>
              </ng-container>
              <ng-container matColumnDef="fee_guixe">
                <th mat-header-cell *matHeaderCellDef>Gửi xe</th>
                <td mat-cell *matCellDef="let i">{{ otherFee(i, 'guixe') | number:'1.0-0' }}</td>
              </ng-container>
              <ng-container matColumnDef="fee_khac">
                <th mat-header-cell *matHeaderCellDef>Phí khác</th>
                <td mat-cell *matCellDef="let i">{{ otherFee(i, 'khac') | number:'1.0-0' }}</td>
              </ng-container>
              <ng-container matColumnDef="discount_amount">
                <th mat-header-cell *matHeaderCellDef>Giảm trừ</th>
                <td mat-cell *matCellDef="let i">{{ (i.discount_amount ?? 0) | number:'1.0-0' }}</td>
              </ng-container>
              <ng-container matColumnDef="total">
                <th mat-header-cell *matHeaderCellDef>Tổng</th>
                <td mat-cell *matCellDef="let i">{{ financeService.invoiceTotal(i) | number:'1.0-0' }}</td>
              </ng-container>
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Trạng thái</th>
                <td mat-cell *matCellDef="let i">{{ i.status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán' }}</td>
              </ng-container>
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Thao tác</th>
                <td mat-cell *matCellDef="let i">
                  <button mat-icon-button (click)="openEditInvoice(i)" matTooltip="Sửa / Đánh dấu thanh toán"><mat-icon>edit</mat-icon></button>
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="invColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: invColumns;"></tr>
            </table>
            <div class="invoice-summary">
              <strong>Tổng cộng:</strong>
              <span>Tiền thuê {{ totalRent() | number:'1.0-0' }}</span>
              <span>Điện {{ totalElectricity() | number:'1.0-0' }}</span>
              <span>Nước {{ totalWater() | number:'1.0-0' }}</span>
              <span>Gom rác {{ totalGomRac() | number:'1.0-0' }}</span>
              <span>Wifi {{ totalWifi() | number:'1.0-0' }}</span>
              <span>Vệ sinh {{ totalVesinh() | number:'1.0-0' }}</span>
              <span>Gửi xe {{ totalGuixe() | number:'1.0-0' }}</span>
              <span>Phí khác {{ totalKhac() | number:'1.0-0' }}</span>
              <span>Giảm trừ {{ totalDiscount() | number:'1.0-0' }}</span>
              <strong class="grand-total">Tổng thu {{ grandTotal() | number:'1.0-0' }}</strong>
            </div>
          }
        </div>
      </mat-tab>
      <mat-tab label="Quản lý chi phí">
        <div class="tab-content sub-tabs">
          <mat-tab-group class="cost-tabs">
            <mat-tab label="CapEx">
              <div class="cost-tab-content">
                <p class="cost-desc">Tài sản khấu hao (thiết bị, nội thất, sửa chữa…). Sửa tại <strong>Tài sản</strong> hoặc bên dưới.</p>
                <div class="toolbar">
                  <mat-form-field appearance="outline">
                    <mat-label>Tòa nhà</mat-label>
                    <mat-select [value]="capexBuildingId()" (selectionChange)="onCapExBuildingFilter($event.value)">
                      <mat-option [value]="null">Tất cả</mat-option>
                      @for (b of propertyService.buildings(); track b.id) {
                        <mat-option [value]="b.id">{{ b.name }}</mat-option>
                      }
                    </mat-select>
                  </mat-form-field>
                  <button mat-raised-button color="primary" (click)="openAssetDialog()"><mat-icon>add</mat-icon> Thêm tài sản</button>
                </div>
                @if (assetService.loading()) {
                  <p>Đang tải...</p>
                } @else {
                  <table mat-table [dataSource]="filteredAssets()" class="mat-elevation-z2">
                    <ng-container matColumnDef="item_name">
                      <th mat-header-cell *matHeaderCellDef>Tên</th>
                      <td mat-cell *matCellDef="let a">{{ a.item_name }}</td>
                    </ng-container>
                    <ng-container matColumnDef="building">
                      <th mat-header-cell *matHeaderCellDef>Tòa nhà</th>
                      <td mat-cell *matCellDef="let a">{{ buildingName(a.building_id) }}</td>
                    </ng-container>
                    <ng-container matColumnDef="amount">
                      <th mat-header-cell *matHeaderCellDef>Số tiền</th>
                      <td mat-cell *matCellDef="let a">{{ a.amount | number:'1.0-0' }}</td>
                    </ng-container>
                    <ng-container matColumnDef="category">
                      <th mat-header-cell *matHeaderCellDef>Loại</th>
                      <td mat-cell *matCellDef="let a">{{ assetCategoryLabel(a.category) }}</td>
                    </ng-container>
                    <ng-container matColumnDef="depreciation">
                      <th mat-header-cell *matHeaderCellDef>Khấu hao/tháng</th>
                      <td mat-cell *matCellDef="let a">{{ assetService.monthlyDepreciationForAsset(a) | number:'1.0-0' }}</td>
                    </ng-container>
                    <ng-container matColumnDef="actions">
                      <th mat-header-cell *matHeaderCellDef>Thao tác</th>
                      <td mat-cell *matCellDef="let a">
                        <button mat-icon-button (click)="openAssetDialog(a)" matTooltip="Sửa"><mat-icon>edit</mat-icon></button>
                        <button mat-icon-button color="warn" (click)="deleteAsset(a)" matTooltip="Xóa"><mat-icon>delete</mat-icon></button>
                      </td>
                    </ng-container>
                    <tr mat-header-row *matHeaderRowDef="assetColumns"></tr>
                    <tr mat-row *matRowDef="let row; columns: assetColumns;"></tr>
                  </table>
                }
              </div>
            </mat-tab>
            <mat-tab label="Chi phí triển khai">
              <div class="cost-tab-content">
                <p class="cost-desc">Chi phí trước mở cửa / triển khai: nhân công (thi công, lắp đặt, dọn dẹp), giấy phép (đăng ký kinh doanh, hành nghề), hoa hồng lấp đầy (môi giới), sửa chữa cải tạo, nội thất thiết bị ban đầu, marketing, phí pháp lý, điện nước đấu nối, vệ sinh tổng… Chọn loại bên dưới.</p>
                <div class="opex-form">
                  <mat-form-field appearance="outline">
                    <mat-label>Tòa nhà</mat-label>
                    <mat-select [(value)]="setupBuildingId">
                      <mat-option [value]="null">-- Chọn tòa nhà --</mat-option>
                      @for (b of propertyService.buildings(); track b.id) {
                        <mat-option [value]="b.id">{{ b.name }}</mat-option>
                      }
                    </mat-select>
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Loại chi phí</mat-label>
                    <mat-select [(value)]="setupCategory">
                      @for (cat of expenseCategoriesService.getByType('setup'); track cat.value) {
                        <mat-option [value]="cat.value">{{ cat.label }}</mat-option>
                      }
                    </mat-select>
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Ngày phát sinh</mat-label>
                    <input matInput type="date" [(ngModel)]="setupOccurredDate" />
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Số tiền</mat-label>
                    <input matInput type="number" min="0" [(ngModel)]="setupAmount" />
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Ghi chú</mat-label>
                    <input matInput [(ngModel)]="setupNote" placeholder="Chi tiết (tùy chọn)" />
                  </mat-form-field>
                  <button mat-raised-button color="primary" (click)="saveSetupCost()" [disabled]="savingSetup() || !setupBuildingId">
                    {{ savingSetup() ? 'Đang lưu...' : 'Thêm' }}
                  </button>
                </div>
                @if (setupCostsService.loading()) {
                  <p>Đang tải...</p>
                } @else {
                  <table mat-table [dataSource]="setupCostsService.list()" class="mat-elevation-z2">
                    <ng-container matColumnDef="building">
                      <th mat-header-cell *matHeaderCellDef>Tòa nhà</th>
                      <td mat-cell *matCellDef="let s">{{ buildingName(s.building_id) }}</td>
                    </ng-container>
                    <ng-container matColumnDef="category">
                      <th mat-header-cell *matHeaderCellDef>Loại</th>
                      <td mat-cell *matCellDef="let s">{{ expenseCategoriesService.getLabel('setup', s.category) }}</td>
                    </ng-container>
                    <ng-container matColumnDef="occurred_date">
                      <th mat-header-cell *matHeaderCellDef>Ngày</th>
                      <td mat-cell *matCellDef="let s">{{ s.occurred_date }}</td>
                    </ng-container>
                    <ng-container matColumnDef="amount">
                      <th mat-header-cell *matHeaderCellDef>Số tiền</th>
                      <td mat-cell *matCellDef="let s">{{ s.amount | number:'1.0-0' }}</td>
                    </ng-container>
                    <ng-container matColumnDef="note">
                      <th mat-header-cell *matHeaderCellDef>Ghi chú</th>
                      <td mat-cell *matCellDef="let s">{{ s.note || '-' }}</td>
                    </ng-container>
                    <ng-container matColumnDef="actions">
                      <th mat-header-cell *matHeaderCellDef>Thao tác</th>
                      <td mat-cell *matCellDef="let s">
                        <button mat-icon-button color="warn" (click)="deleteSetupCost(s)" matTooltip="Xóa"><mat-icon>delete</mat-icon></button>
                      </td>
                    </ng-container>
                    <tr mat-header-row *matHeaderRowDef="setupColumns"></tr>
                    <tr mat-row *matRowDef="let row; columns: setupColumns;"></tr>
                  </table>
                }
              </div>
            </mat-tab>
            <mat-tab label="Cọc">
              <div class="cost-tab-content">
                <p class="cost-desc">Tài sản tài chính: cọc chủ nhà (theo tòa nhà), cọc khách thuê (theo hợp đồng). Sửa tại <strong>Tòa nhà</strong> / <strong>HĐ khách thuê</strong>.</p>
                <h4>Cọc chủ nhà (deposit_to_owner)</h4>
                <table mat-table [dataSource]="propertyService.buildings()" class="mat-elevation-z2">
                  <ng-container matColumnDef="name">
                    <th mat-header-cell *matHeaderCellDef>Tòa nhà</th>
                    <td mat-cell *matCellDef="let b">{{ b.name }}</td>
                  </ng-container>
                  <ng-container matColumnDef="deposit">
                    <th mat-header-cell *matHeaderCellDef>Cọc chủ (VNĐ)</th>
                    <td mat-cell *matCellDef="let b">{{ (b.deposit_to_owner ?? 0) | number:'1.0-0' }}</td>
                  </ng-container>
                  <tr mat-header-row *matHeaderRowDef="depositBuildingColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: depositBuildingColumns;"></tr>
                </table>
                <h4>Cọc khách thuê (deposit_amount)</h4>
                <table mat-table [dataSource]="financeService.contracts()" class="mat-elevation-z2">
                  <ng-container matColumnDef="contract">
                    <th mat-header-cell *matHeaderCellDef>Hợp đồng</th>
                    <td mat-cell *matCellDef="let c">{{ contractLabel(c) }}</td>
                  </ng-container>
                  <ng-container matColumnDef="deposit">
                    <th mat-header-cell *matHeaderCellDef>Cọc khách (VNĐ)</th>
                    <td mat-cell *matCellDef="let c">{{ (c.deposit_amount ?? 0) | number:'1.0-0' }}</td>
                  </ng-container>
                  <tr mat-header-row *matHeaderRowDef="depositContractColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: depositContractColumns;"></tr>
                </table>
              </div>
            </mat-tab>
            <mat-tab label="OpEx">
              <div class="cost-tab-content">
                <p class="cost-desc">Chi phí vận hành theo tháng (điện nước chung, vệ sinh, bảo trì…).</p>
                <div class="opex-form">
                  <mat-form-field appearance="outline">
                    <mat-label>Tòa nhà</mat-label>
                    <mat-select [(value)]="opexBuildingId">
                      <mat-option [value]="null">-- Tất cả --</mat-option>
                      @for (b of propertyService.buildings(); track b.id) {
                        <mat-option [value]="b.id">{{ b.name }}</mat-option>
                      }
                    </mat-select>
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Loại chi phí</mat-label>
                    <mat-select [(value)]="opexCategory">
                      @for (cat of expenseCategoriesService.getByType('opex'); track cat.value) {
                        <mat-option [value]="cat.value">{{ cat.label }}</mat-option>
                      }
                    </mat-select>
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Tháng</mat-label>
                    <input matInput type="number" min="1" max="12" [(ngModel)]="opexMonth" />
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Năm</mat-label>
                    <input matInput type="number" [(ngModel)]="opexYear" />
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Số tiền</mat-label>
                    <input matInput type="number" min="0" [(ngModel)]="opexAmount" />
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Ghi chú</mat-label>
                    <input matInput [(ngModel)]="opexNote" />
                  </mat-form-field>
                  <button mat-raised-button color="primary" (click)="saveOpex()" [disabled]="savingOpex() || !opexBuildingId">
                    {{ savingOpex() ? 'Đang lưu...' : 'Lưu OpEx' }}
                  </button>
                </div>
                @if (opexService.loading()) {
                  <p>Đang tải OpEx...</p>
                } @else {
                  <table mat-table [dataSource]="opexFiltered()" class="mat-elevation-z2">
                    <ng-container matColumnDef="building">
                      <th mat-header-cell *matHeaderCellDef>Tòa nhà</th>
                      <td mat-cell *matCellDef="let o">{{ buildingName(o.building_id) }}</td>
                    </ng-container>
                    <ng-container matColumnDef="month">
                      <th mat-header-cell *matHeaderCellDef>Tháng/Năm</th>
                      <td mat-cell *matCellDef="let o">{{ o.month }}/{{ o.year }}</td>
                    </ng-container>
                    <ng-container matColumnDef="category">
                      <th mat-header-cell *matHeaderCellDef>Loại</th>
                      <td mat-cell *matCellDef="let o">{{ expenseCategoriesService.getLabel('opex', o.category) }}</td>
                    </ng-container>
                    <ng-container matColumnDef="amount">
                      <th mat-header-cell *matHeaderCellDef>Số tiền</th>
                      <td mat-cell *matCellDef="let o">{{ o.amount | number:'1.0-0' }}</td>
                    </ng-container>
                    <ng-container matColumnDef="note">
                      <th mat-header-cell *matHeaderCellDef>Ghi chú</th>
                      <td mat-cell *matCellDef="let o">{{ o.note || '-' }}</td>
                    </ng-container>
                    <ng-container matColumnDef="actions">
                      <th mat-header-cell *matHeaderCellDef>Thao tác</th>
                      <td mat-cell *matCellDef="let o">
                        <button mat-icon-button color="warn" (click)="deleteOpex(o)" matTooltip="Xóa"><mat-icon>delete</mat-icon></button>
                      </td>
                    </ng-container>
                    <tr mat-header-row *matHeaderRowDef="opexColumns"></tr>
                    <tr mat-row *matRowDef="let row; columns: opexColumns;"></tr>
                  </table>
                }
              </div>
            </mat-tab>
          </mat-tab-group>
        </div>
      </mat-tab>
    </mat-tab-group>
  `,
  styles: [`
    .finance-tabs { margin-top: 0.5rem; }
    .tab-content { padding: 1rem 0; }
    .sub-tabs { padding: 0.5rem 0; }
    .cost-tabs { margin-top: 0.5rem; }
    .cost-tab-content { padding: 1rem 0; }
    .cost-desc { font-size: 0.9rem; color: #555; margin-bottom: 1rem; }
    .toolbar { display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem; }
    .toolbar mat-form-field { min-width: 200px; }
    .generate-section { display: flex; flex-wrap: wrap; align-items: center; gap: 1rem; margin-bottom: 1.5rem; padding: 1rem; background: #f5f5f5; border-radius: 8px; }
    .generate-section h3 { margin: 0; width: 100%; }
    .generate-section mat-form-field { min-width: 160px; }
    .error { color: #c62828; }
    table { width: 100%; margin-bottom: 1.5rem; }
    .cost-tab-content h4 { margin: 1rem 0 0.5rem 0; font-size: 0.95rem; }
    .opex-form { display: flex; flex-wrap: wrap; align-items: center; gap: 1rem; margin-bottom: 1rem; }
    .opex-form mat-form-field { min-width: 120px; }
    .invoice-hint { font-size: 0.9rem; color: #555; margin-bottom: 0.75rem; }
    .invoice-summary { margin-top: 1rem; padding: 0.75rem 1rem; background: #f5f5f5; border-radius: 8px; display: flex; flex-wrap: wrap; align-items: center; gap: 1rem; font-size: 0.95rem; }
    .invoice-summary .grand-total { margin-left: auto; }
  `],
})
export class FinanceComponent implements OnInit {
  invColumns = ['contract', 'month', 'rent_amount', 'electricity_usage', 'water_usage', 'fee_gom_rac', 'fee_wifi', 'fee_vesinh', 'fee_guixe', 'fee_khac', 'discount_amount', 'total', 'status', 'actions'];
  opexColumns = ['building', 'month', 'category', 'amount', 'note', 'actions'];
  assetColumns = ['item_name', 'building', 'amount', 'category', 'depreciation', 'actions'];
  setupColumns = ['building', 'category', 'occurred_date', 'amount', 'note', 'actions'];
  depositBuildingColumns = ['name', 'deposit'];
  depositContractColumns = ['contract', 'deposit'];

  selectedContractId: string | null = null;
  genMonth = new Date().getMonth() + 1;
  genYear = new Date().getFullYear();
  generating = signal(false);
  genMessage = signal('');
  genError = signal(false);

  capexBuildingId = signal<string | null>(null);

  setupBuildingId: string | null = null;
  setupCategory = 'other';
  setupOccurredDate = new Date().toISOString().slice(0, 10);
  setupAmount = 0;
  setupNote = '';
  savingSetup = signal(false);

  opexBuildingId: string | null = null;
  opexCategory = 'other';
  opexMonth = new Date().getMonth() + 1;
  opexYear = new Date().getFullYear();
  opexAmount = 0;
  opexNote = '';
  savingOpex = signal(false);

  constructor(
    readonly financeService: FinanceService,
    readonly propertyService: PropertyService,
    readonly opexService: OpexService,
    readonly assetService: AssetService,
    readonly setupCostsService: SetupCostsService,
    readonly expenseCategoriesService: ExpenseCategoriesService,
    private readonly dialog: MatDialog
  ) {}

  opexFiltered = computed(() => this.opexService.logs());

  otherFee(inv: Invoice, key: string): number {
    const o = inv.other_fees_json && typeof inv.other_fees_json === 'object' ? inv.other_fees_json : {};
    const v = o[key];
    return typeof v === 'number' ? v : Number(v) || 0;
  }

  totalRent = computed(() => this.financeService.invoices().reduce((s, i) => s + Number(i.rent_amount), 0));
  totalElectricity = computed(() => this.financeService.invoices().reduce((s, i) => s + Number(i.electricity_usage), 0));
  totalWater = computed(() => this.financeService.invoices().reduce((s, i) => s + Number(i.water_usage), 0));
  totalGomRac = computed(() => this.financeService.invoices().reduce((s, i) => s + this.otherFee(i, 'gom_rac'), 0));
  totalWifi = computed(() => this.financeService.invoices().reduce((s, i) => s + this.otherFee(i, 'wifi'), 0));
  totalVesinh = computed(() => this.financeService.invoices().reduce((s, i) => s + this.otherFee(i, 'vesinh'), 0));
  totalGuixe = computed(() => this.financeService.invoices().reduce((s, i) => s + this.otherFee(i, 'guixe'), 0));
  totalKhac = computed(() => this.financeService.invoices().reduce((s, i) => s + this.otherFee(i, 'khac'), 0));
  totalDiscount = computed(() => this.financeService.invoices().reduce((s, i) => s + Number(i.discount_amount ?? 0), 0));
  grandTotal = computed(() => this.financeService.invoices().reduce((s, i) => s + this.financeService.invoiceTotal(i), 0));

  filteredAssets = computed(() => {
    const id = this.capexBuildingId();
    const list = this.assetService.assets();
    return id ? list.filter((a) => a.building_id === id) : list;
  });

  onCapExBuildingFilter(id: string | null): void {
    this.capexBuildingId.set(id);
  }

  openAssetDialog(asset?: AssetLog): void {
    const ref = this.dialog.open(AssetDialogComponent, { width: '440px', data: asset ?? null });
    ref.afterClosed().subscribe(() => this.assetService.loadAssets());
  }

  deleteAsset(asset: AssetLog): void {
    if (!confirm('Xóa tài sản "' + asset.item_name + '"?')) return;
    this.assetService.deleteAsset(asset.id).then(() => {});
  }

  assetCategoryLabel(c: string): string {
    return this.expenseCategoriesService.getLabel('capex', c);
  }

  async saveSetupCost(): Promise<void> {
    if (!this.setupBuildingId) return;
    this.savingSetup.set(true);
    await this.setupCostsService.create({
      building_id: this.setupBuildingId,
      category: this.setupCategory,
      amount: this.setupAmount,
      note: this.setupNote || null,
      occurred_date: this.setupOccurredDate,
    });
    this.savingSetup.set(false);
    this.setupAmount = 0;
    this.setupNote = '';
  }

  deleteSetupCost(s: { id: string; note: string | null }): void {
    if (!confirm('Xóa khoản chi phí triển khai này?')) return;
    this.setupCostsService.delete(s.id);
  }

  buildingName(buildingId: string): string {
    return this.propertyService.buildings().find(b => b.id === buildingId)?.name ?? buildingId;
  }

  async deleteOpex(log: OpexLog): Promise<void> {
    if (!confirm('Xóa khoản chi phí này?')) return;
    await this.opexService.deleteOpex(log.id);
  }

  openEditInvoice(invoice: Invoice): void {
    const ref = this.dialog.open(InvoiceDialogComponent, { width: '400px', data: invoice });
    ref.afterClosed().subscribe(() => this.financeService.loadInvoices());
  }

  contractLabel(c: { id: string; room_id: string; actual_rent_price: number }): string {
    const room = this.propertyService.rooms().find(r => r.id === c.room_id);
    const building = room ? this.propertyService.buildings().find(b => b.id === room.building_id) : null;
    const roomNum = room?.room_number ?? c.room_id;
    const buildingName = building?.name ?? '';
    return buildingName ? buildingName + ' - Phòng ' + roomNum + ' (' + c.actual_rent_price + ')' : 'Phòng ' + roomNum;
  }

  contractLabelById(contractId: string): string {
    const c = this.financeService.contracts().find(x => x.id === contractId);
    return c ? this.contractLabel(c) : contractId;
  }

  async ngOnInit(): Promise<void> {
    await this.propertyService.loadBuildings();
    await this.propertyService.loadRooms();
    await this.financeService.loadContracts();
    await this.financeService.loadInvoices();
    await this.opexService.loadOpex();
    await this.assetService.loadAssets();
    await this.setupCostsService.load();
    await this.expenseCategoriesService.load();
  }

  async saveOpex(): Promise<void> {
    if (!this.opexBuildingId) return;
    this.savingOpex.set(true);
    await this.opexService.insertOpex(
      this.opexBuildingId,
      this.opexYear,
      this.opexMonth,
      this.opexCategory,
      this.opexAmount,
      this.opexNote || null
    );
    this.savingOpex.set(false);
  }

  async generateInvoice(): Promise<void> {
    if (!this.selectedContractId) return;
    this.generating.set(true);
    this.genMessage.set('');
    this.genError.set(false);
    const { data, error } = await this.financeService.generateMonthlyInvoice(
      this.selectedContractId,
      this.genYear,
      this.genMonth,
      {}
    );
    this.generating.set(false);
    if (error) {
      this.genMessage.set(error);
      this.genError.set(true);
    } else {
      this.genMessage.set('Đã tạo hóa đơn.');
      await this.financeService.loadInvoices();
    }
  }
}
