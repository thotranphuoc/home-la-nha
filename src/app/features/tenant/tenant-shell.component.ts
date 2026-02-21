import { Component } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-tenant-shell',
  imports: [
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatSidenavModule,
    MatListModule,
    RouterLink,
    RouterOutlet,
  ],
  template: `
    <mat-toolbar color="primary" class="toolbar">
      <button mat-icon-button (click)="drawer.toggle()" aria-label="Menu">
        <mat-icon>menu</mat-icon>
      </button>
      <span class="title">Home La Nha – Cổng khách thuê</span>
    </mat-toolbar>
    <mat-drawer-container class="drawer-container">
      <mat-drawer #drawer mode="over" class="drawer">
        <mat-nav-list>
          <a mat-list-item routerLink="/tenant/profile" (click)="drawer.close()">Cập nhật CCCD</a>
          <a mat-list-item routerLink="/tenant/invoices" (click)="drawer.close()">Thanh toán hóa đơn</a>
          <mat-divider></mat-divider>
          <a mat-list-item (click)="signOut(); drawer.close()">Đăng xuất</a>
        </mat-nav-list>
      </mat-drawer>
      <mat-drawer-content class="content">
        <router-outlet />
      </mat-drawer-content>
    </mat-drawer-container>
  `,
  styles: [`
    .toolbar { position: sticky; top: 0; z-index: 10; }
    .title { margin-left: 0.5rem; font-size: 1.1rem; }
    .drawer-container { min-height: calc(100vh - 64px); }
    .drawer { width: 240px; }
    .content { padding: 1rem; }
  `],
})
export class TenantShellComponent {
  constructor(
    private readonly auth: AuthService,
    private readonly router: Router
  ) {}

  signOut(): void {
    this.auth.signOut().then(() => this.router.navigate(['/login']));
  }
}
