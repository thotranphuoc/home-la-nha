import { Component, Inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../../core/services/auth.service';

export interface AssignAccountData {
  tenantName: string;
  contractId: string;
}

@Component({
  selector: 'app-assign-account-dialog',
  standalone: true,
  imports: [MatDialogModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Gán tài khoản đăng nhập</h2>
    <mat-dialog-content>
      <p class="hint">Khách thuê: <strong>{{ data.tenantName }}</strong></p>
      <p class="hint">Nhập email tài khoản (Supabase Auth) để gán. User đó cần đã đăng nhập ít nhất một lần để có hồ sơ.</p>
      <form [formGroup]="form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Email đăng nhập</mat-label>
          <input matInput type="email" formControlName="email" placeholder="user@example.com" />
        </mat-form-field>
      </form>
      @if (error()) {
        <p class="error">{{ error() }}</p>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Hủy</button>
      <button mat-raised-button color="primary" (click)="submit()" [disabled]="form.invalid || submitting()">
        {{ submitting() ? 'Đang gán...' : 'Gán' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`.full-width { width: 100%; display: block; } .hint { font-size: 0.9rem; color: #666; margin: 0.5rem 0; } .error { color: #c62828; }`],
})
export class AssignAccountDialogComponent {
  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });
  submitting = signal(false);
  error = signal<string | null>(null);

  constructor(
    private readonly fb: FormBuilder,
    private readonly dialogRef: MatDialogRef<AssignAccountDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AssignAccountData,
    private readonly auth: AuthService
  ) {}

  submit(): void {
    if (this.form.invalid) return;
    this.error.set(null);
    this.submitting.set(true);
    this.auth.assignContractToUserByEmail(this.form.value.email!.trim(), this.data.contractId).then(({ error }) => {
      this.submitting.set(false);
      if (error) this.error.set(error);
      else this.dialogRef.close(true);
    });
  }
}
