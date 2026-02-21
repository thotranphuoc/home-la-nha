import { Routes } from '@angular/router';
import { TenantShellComponent } from './tenant-shell.component';

export const TENANT_ROUTES: Routes = [
  {
    path: '',
    component: TenantShellComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'profile' },
      { path: 'profile', loadComponent: () => import('./profile/tenant-profile.component').then(m => m.TenantProfileComponent) },
      { path: 'invoices', loadComponent: () => import('./invoices/tenant-invoices.component').then(m => m.TenantInvoicesComponent) },
    ],
  },
];
