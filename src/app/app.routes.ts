import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { tenantEditGuard } from './core/guards/tenant.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent) },
  {
    path: 'admin',
    canActivate: [authGuard],
    loadChildren: () => import('./features/admin/admin.routes').then(m => m.ADMIN_ROUTES),
  },
  {
    path: 'tenant',
    canActivate: [authGuard],
    loadChildren: () => import('./features/tenant/tenant.routes').then(m => m.TENANT_ROUTES),
  },
  { path: '**', redirectTo: '/login' },
];
