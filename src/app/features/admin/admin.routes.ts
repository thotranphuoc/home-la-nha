import { Routes } from '@angular/router';
import { AdminShellComponent } from './admin-shell.component';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: AdminShellComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'overview' },
      { path: 'overview', loadComponent: () => import('./overview/overview.component').then(m => m.OverviewComponent) },
      { path: 'buildings', loadComponent: () => import('./buildings/buildings.component').then(m => m.BuildingsComponent) },
      { path: 'master-lease', loadComponent: () => import('./master-lease/master-lease.component').then(m => m.MasterLeaseComponent) },
      { path: 'rooms', loadComponent: () => import('./rooms/rooms.component').then(m => m.RoomsComponent) },
      { path: 'contracts', loadComponent: () => import('./contracts/contracts.component').then(m => m.ContractsComponent) },
      { path: 'finance', loadComponent: () => import('./finance/finance.component').then(m => m.FinanceComponent) },
      { path: 'meter-readings', loadComponent: () => import('./meter-readings/meter-readings.component').then(m => m.MeterReadingsComponent) },
      { path: 'tenants', loadComponent: () => import('./tenants/tenants.component').then(m => m.TenantsComponent) },
      { path: 'settings', loadComponent: () => import('./settings/settings.component').then(m => m.SettingsComponent) },
    ],
  },
];
