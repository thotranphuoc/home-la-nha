import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../../core/services/auth.service';

@Component({
    selector: 'app-login',
    imports: [FormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule],
    template: `
    <div class="login-page">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Home La Nha</mat-card-title>
          <mat-card-subtitle>Đăng nhập</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <form (ngSubmit)="onSubmit()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <input matInput type="email" [(ngModel)]="email" name="email" required />
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Mật khẩu</mat-label>
              <input matInput type="password" [(ngModel)]="password" name="password" required />
            </mat-form-field>
            @if (error()) {
              <p class="error">{{ error() }}</p>
            }
            <button mat-flat-button color="primary" type="submit" [disabled]="loading()">
              {{ loading() ? 'Đang đăng nhập...' : 'Đăng nhập' }}
            </button>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
    styles: [`
    .login-page {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 1rem;
    }
    mat-card {
      width: 100%;
      max-width: 360px;
    }
    mat-card-content form {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .full-width { width: 100%; }
    .error { color: #c62828; margin: 0.5rem 0; }
  `]
})
export class LoginComponent {
  email = '';
  password = '';
  loading = signal(false);
  error = signal<string | null>(null);

  constructor(
    private readonly auth: AuthService,
    private readonly router: Router
  ) {}

  async onSubmit(): Promise<void> {
    this.error.set(null);
    this.loading.set(true);
    const { error, role } = await this.auth.signIn(this.email, this.password);
    this.loading.set(false);
    if (error) {
      this.error.set(error.message);
      return;
    }
    if (role === 'admin') {
      this.router.navigate(['/admin']);
    } else {
      this.router.navigate(['/tenant']);
    }
  }
}
