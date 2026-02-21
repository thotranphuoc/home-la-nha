import { Component, OnInit, signal, computed } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { ExpenseCategoriesService, type ExpenseCategory, type ExpenseCategoryType } from '../../../core/services/expense-categories.service';
import { CategoryDialogComponent } from './category-dialog.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [MatTabsModule, MatTableModule, MatButtonModule, MatIconModule, MatTooltipModule],
  template: `
    <h1>Cấu hình loại chi phí</h1>
    <p class="desc">Chỉnh sửa các loại chi phí dùng trong OpEx, Chi phí triển khai và CapEx (tài sản).</p>
    @if (expenseCategoriesService.loading()) {
      <p>Đang tải...</p>
    } @else {
      <mat-tab-group>
        <mat-tab label="OpEx">
          <div class="tab-content">
            <button mat-raised-button color="primary" (click)="openAdd('opex')">
              <mat-icon>add</mat-icon> Thêm loại
            </button>
            <table mat-table [dataSource]="opexList()" class="mat-elevation-z2">
              <ng-container matColumnDef="value">
                <th mat-header-cell *matHeaderCellDef>Mã</th>
                <td mat-cell *matCellDef="let c">{{ c.value }}</td>
              </ng-container>
              <ng-container matColumnDef="label">
                <th mat-header-cell *matHeaderCellDef>Nhãn hiển thị</th>
                <td mat-cell *matCellDef="let c">{{ c.label }}</td>
              </ng-container>
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Thao tác</th>
                <td mat-cell *matCellDef="let c">
                  <button mat-icon-button (click)="openEdit(c)" matTooltip="Sửa"><mat-icon>edit</mat-icon></button>
                  <button mat-icon-button color="warn" (click)="deleteCat(c)" matTooltip="Xóa"><mat-icon>delete</mat-icon></button>
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="columns"></tr>
              <tr mat-row *matRowDef="let row; columns: columns;"></tr>
            </table>
          </div>
        </mat-tab>
        <mat-tab label="Chi phí triển khai">
          <div class="tab-content">
            <button mat-raised-button color="primary" (click)="openAdd('setup')">
              <mat-icon>add</mat-icon> Thêm loại
            </button>
            <table mat-table [dataSource]="setupList()" class="mat-elevation-z2">
              <ng-container matColumnDef="value">
                <th mat-header-cell *matHeaderCellDef>Mã</th>
                <td mat-cell *matCellDef="let c">{{ c.value }}</td>
              </ng-container>
              <ng-container matColumnDef="label">
                <th mat-header-cell *matHeaderCellDef>Nhãn hiển thị</th>
                <td mat-cell *matCellDef="let c">{{ c.label }}</td>
              </ng-container>
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Thao tác</th>
                <td mat-cell *matCellDef="let c">
                  <button mat-icon-button (click)="openEdit(c)" matTooltip="Sửa"><mat-icon>edit</mat-icon></button>
                  <button mat-icon-button color="warn" (click)="deleteCat(c)" matTooltip="Xóa"><mat-icon>delete</mat-icon></button>
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="columns"></tr>
              <tr mat-row *matRowDef="let row; columns: columns;"></tr>
            </table>
          </div>
        </mat-tab>
        <mat-tab label="CapEx (tài sản)">
          <div class="tab-content">
            <button mat-raised-button color="primary" (click)="openAdd('capex')">
              <mat-icon>add</mat-icon> Thêm loại
            </button>
            <table mat-table [dataSource]="capexList()" class="mat-elevation-z2">
              <ng-container matColumnDef="value">
                <th mat-header-cell *matHeaderCellDef>Mã</th>
                <td mat-cell *matCellDef="let c">{{ c.value }}</td>
              </ng-container>
              <ng-container matColumnDef="label">
                <th mat-header-cell *matHeaderCellDef>Nhãn hiển thị</th>
                <td mat-cell *matCellDef="let c">{{ c.label }}</td>
              </ng-container>
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Thao tác</th>
                <td mat-cell *matCellDef="let c">
                  <button mat-icon-button (click)="openEdit(c)" matTooltip="Sửa"><mat-icon>edit</mat-icon></button>
                  <button mat-icon-button color="warn" (click)="deleteCat(c)" matTooltip="Xóa"><mat-icon>delete</mat-icon></button>
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="columns"></tr>
              <tr mat-row *matRowDef="let row; columns: columns;"></tr>
            </table>
          </div>
        </mat-tab>
      </mat-tab-group>
    }
    @if (message()) {
      <p class="message" [class.error]="messageError()">{{ message() }}</p>
    }
  `,
  styles: [`
    .desc { color: #555; margin-bottom: 1rem; }
    .tab-content { padding: 1rem 0; }
    .tab-content button { margin-bottom: 1rem; }
    table { width: 100%; }
    .message { margin-top: 1rem; }
    .message.error { color: #c62828; }
  `],
})
export class SettingsComponent implements OnInit {
  columns = ['value', 'label', 'actions'];
  message = signal('');
  messageError = signal(false);

  opexList = computed(() => this.expenseCategoriesService.getByType('opex'));
  setupList = computed(() => this.expenseCategoriesService.getByType('setup'));
  capexList = computed(() => this.expenseCategoriesService.getByType('capex'));

  constructor(
    readonly expenseCategoriesService: ExpenseCategoriesService,
    private readonly dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.expenseCategoriesService.load();
  }

  openAdd(type: ExpenseCategoryType): void {
    const ref = this.dialog.open(CategoryDialogComponent, {
      width: '400px',
      data: { type, category: null },
    });
    ref.afterClosed().subscribe((result: { value: string; label: string } | undefined) => {
      if (!result) return;
      this.expenseCategoriesService.create({ type, value: result.value, label: result.label }).then(({ error }) => {
        if (error) {
          this.message.set(error);
          this.messageError.set(true);
        } else {
          this.message.set('Đã thêm.');
          this.messageError.set(false);
        }
        setTimeout(() => this.message.set(''), 3000);
      });
    });
  }

  openEdit(cat: ExpenseCategory): void {
    const ref = this.dialog.open(CategoryDialogComponent, {
      width: '400px',
      data: { type: cat.type, category: cat },
    });
    ref.afterClosed().subscribe((result: { value: string; label: string } | undefined) => {
      if (!result) return;
      this.expenseCategoriesService.update(cat.id, { label: result.label }).then(({ error }) => {
        if (error) {
          this.message.set(error);
          this.messageError.set(true);
        } else {
          this.message.set('Đã cập nhật.');
          this.messageError.set(false);
        }
        setTimeout(() => this.message.set(''), 3000);
      });
    });
  }

  async deleteCat(cat: ExpenseCategory): Promise<void> {
    if (!confirm('Xóa loại "' + cat.label + '"?')) return;
    const { error } = await this.expenseCategoriesService.delete(cat.id);
    if (error) {
      this.message.set(error);
      this.messageError.set(true);
      setTimeout(() => this.message.set(''), 5000);
    } else {
      this.message.set('Đã xóa.');
      this.messageError.set(false);
      setTimeout(() => this.message.set(''), 3000);
    }
  }
}
