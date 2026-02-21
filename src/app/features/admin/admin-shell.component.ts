import { Component } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-admin-shell',
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
      <span class="title">Home La Nha – Admin</span>
    </mat-toolbar>
    <mat-drawer-container class="drawer-container">
      <mat-drawer #drawer mode="over" class="drawer">
        <mat-nav-list>
          <a mat-list-item routerLink="/admin/overview" (click)="drawer.close()">Tổng quan</a>
          <a mat-list-item routerLink="/admin/buildings" (click)="drawer.close()">Tòa nhà</a>
          <a mat-list-item routerLink="/admin/rooms" (click)="drawer.close()">Phòng</a>
          <a mat-list-item routerLink="/admin/master-lease" (click)="drawer.close()">HĐ chủ nhà</a>
          <a mat-list-item routerLink="/admin/contracts" (click)="drawer.close()">HĐ khách thuê</a>
          <a mat-list-item routerLink="/admin/tenants" (click)="drawer.close()">Khách thuê</a>
          <a mat-list-item routerLink="/admin/meter-readings" (click)="drawer.close()">Chỉ số ĐN</a>
          <a mat-list-item routerLink="/admin/finance" (click)="drawer.close()">Thu chi</a>
          <a mat-list-item routerLink="/admin/settings" (click)="drawer.close()">Cấu hình</a>
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
export class AdminShellComponent {
  constructor(
    private readonly auth: AuthService,
    private readonly router: Router
  ) {}

  signOut(): void {
    this.auth.signOut().then(() => this.router.navigate(['/login']));
  }
}
