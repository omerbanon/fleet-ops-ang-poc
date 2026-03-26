import type { Routes } from '@angular/router';
import { authGuard, loginGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.page').then(m => m.LoginPage),
    canActivate: [loginGuard],
  },
  {
    path: '',
    loadComponent: () =>
      import('./pages/dashboard/dashboard.page').then(m => m.DashboardPage),
    canActivate: [authGuard],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
