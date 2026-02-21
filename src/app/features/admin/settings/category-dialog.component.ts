import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import type { ExpenseCategory, ExpenseCategoryType } from '../../../core/services/expense-categories.service';

export interface CategoryDialogData {
  type: ExpenseCategoryType;
  category?: ExpenseCategory | null;
}

@Component({
  selector: 'app-category-dialog',
  standalone: true,
  imports: [MatDialogModule, FormsModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data.category ? 'Sửa loại chi phí' : 'Thêm loại chi phí' }}</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Mã (slug)</mat-label>
        <input matInput [(ngModel)]="value" [readonly]="!!data.category" placeholder="vd: salary" />
      </mat-form-field>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Nhãn hiển thị</mat-label>
        <input matInput [(ngModel)]="label" placeholder="vd: Lương" />
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Hủy</button>
      <button mat-raised-button color="primary" (click)="submit()">Lưu</button>
    </mat-dialog-actions>
  `,
  styles: [`.full-width { width: 100%; display: block; }`],
})
export class CategoryDialogComponent {
  value: string;
  label: string;

  constructor(
    private readonly ref: MatDialogRef<CategoryDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CategoryDialogData
  ) {
    this.value = data.category?.value ?? '';
    this.label = data.category?.label ?? '';
  }

  submit(): void {
    const v = (this.value ?? '').trim();
    const l = (this.label ?? '').trim();
    if (!l) return;
    if (!this.data.category && !v) return;
    this.ref.close({ value: v, label: l });
  }
}
