import { Component, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FinanceService } from '../../../core/services/finance.service';
import { AuthService } from '../../../core/services/auth.service';
import { MatTableModule } from '@angular/material/table';

@Component({
    selector: 'app-tenant-invoices',
    imports: [MatTableModule, DecimalPipe],
    template: `
    <h1>Thanh toán hóa đơn</h1>
    <p class="instructions">Thanh toán trực tiếp với quản lý (chuyển khoản hoặc tiền mặt theo hướng dẫn của quản lý). Sau khi thanh toán xong, quản lý sẽ đánh dấu hóa đơn là « Đã thanh toán » và bạn có thể xem trạng thái trong bảng dưới đây.</p>
    @if (financeService.loading()) {
      <p>Đang tải...</p>
    } @else {
      <table mat-table [dataSource]="financeService.invoices()">
        <ng-container matColumnDef="month">
          <th mat-header-cell *matHeaderCellDef>Tháng</th>
          <td mat-cell *matCellDef="let i">{{ i.month }}/{{ i.year }}</td>
        </ng-container>
        <ng-container matColumnDef="rent_amount">
          <th mat-header-cell *matHeaderCellDef>Tiền thuê</th>
          <td mat-cell *matCellDef="let i">{{ i.rent_amount | number:'1.0-0' }}</td>
        </ng-container>
        <ng-container matColumnDef="total">
          <th mat-header-cell *matHeaderCellDef>Tổng</th>
          <td mat-cell *matCellDef="let i">{{ financeService.invoiceTotal(i) | number:'1.0-0' }}</td>
        </ng-container>
        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef>Trạng thái</th>
          <td mat-cell *matCellDef="let i">{{ i.status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán' }}</td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="invColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: invColumns;"></tr>
      </table>
    }
  `,
  styles: [`.instructions { color: #555; margin-bottom: 1rem; font-size: 0.95rem; }`]
})
export class TenantInvoicesComponent implements OnInit {
  invColumns = ['month', 'rent_amount', 'total', 'status'];

  constructor(
    readonly financeService: FinanceService,
    private readonly auth: AuthService
  ) {}

  ngOnInit(): void {
    const contractId = this.auth.contractId();
    if (contractId) this.financeService.loadInvoices(contractId);
    else this.financeService.loadInvoices();
  }
}
