import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { AssetService } from '../../../core/services/asset.service';
import { PropertyService } from '../../../core/services/property.service';
import { ExpenseCategoriesService } from '../../../core/services/expense-categories.service';
import type { AssetLog, AssetCategory } from '../../../core/services/asset.service';

@Component({
  selector: 'app-asset-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data ? 'Sửa tài sản' : 'Thêm tài sản' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Tòa nhà</mat-label>
          <mat-select formControlName="building_id">
            @for (b of propertyService.buildings(); track b.id) {
              <mat-option [value]="b.id">{{ b.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Tên tài sản</mat-label>
          <input matInput formControlName="item_name" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Số tiền</mat-label>
          <input matInput type="number" formControlName="amount" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Loại</mat-label>
          <mat-select formControlName="category">
            @for (cat of expenseCategoriesService.getByType('capex'); track cat.value) {
              <mat-option [value]="cat.value">{{ cat.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Ngày mua (YYYY-MM-DD)</mat-label>
          <input matInput type="date" formControlName="purchase_date" />
        </mat-form-field>
        <mat-checkbox formControlName="is_depreciable">Có khấu hao</mat-checkbox>
        @if (form.get('is_depreciable')?.value) {
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Số tháng khấu hao</mat-label>
            <input matInput type="number" formControlName="depreciation_months" />
          </mat-form-field>
        }
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Link hóa đơn</mat-label>
          <input matInput formControlName="invoice_url" />
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Hủy</button>
      <button mat-raised-button color="primary" (click)="submit()" [disabled]="form.invalid">Lưu</button>
    </mat-dialog-actions>
  `,
  styles: [`.full-width { width: 100%; display: block; }`],
})
export class AssetDialogComponent implements OnInit {
  form = this.fb.group({
    building_id: ['', Validators.required],
    item_name: ['', Validators.required],
    amount: [0, [Validators.required, Validators.min(0)]],
    category: ['other' as AssetCategory, Validators.required],
    purchase_date: [''],
    is_depreciable: [false],
    depreciation_months: [null as number | null],
    invoice_url: [''],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly dialogRef: MatDialogRef<AssetDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AssetLog | null,
    readonly assetService: AssetService,
    readonly propertyService: PropertyService,
    readonly expenseCategoriesService: ExpenseCategoriesService
  ) {
    if (data) {
      this.form.patchValue({
        building_id: data.building_id,
        item_name: data.item_name,
        amount: data.amount,
        category: data.category,
        purchase_date: data.purchase_date ?? '',
        is_depreciable: data.is_depreciable,
        depreciation_months: data.depreciation_months ?? null,
        invoice_url: data.invoice_url ?? '',
      });
    }
  }

  ngOnInit(): void {
    this.expenseCategoriesService.load();
  }

  submit(): void {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    const payload = {
      building_id: v.building_id!,
      item_name: v.item_name!,
      amount: Number(v.amount),
      category: v.category!,
      purchase_date: v.purchase_date || null,
      is_depreciable: v.is_depreciable ?? false,
      depreciation_months: v.is_depreciable ? (v.depreciation_months ?? null) : null,
      invoice_url: v.invoice_url || null,
    };
    if (this.data?.id) {
      this.assetService.updateAsset(this.data.id, payload).then(({ error }) => {
        if (!error) this.dialogRef.close(true);
      });
    } else {
      this.assetService.createAsset(payload).then(({ error }) => {
        if (!error) this.dialogRef.close(true);
      });
    }
  }
}
