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
    path: 'trucks',
    loadComponent: () =>
      import('./pages/trucks/trucks.page').then(m => m.TrucksPage),
    canActivate: [authGuard],
  },
  {
    path: 'people',
    loadComponent: () =>
      import('./pages/people/people.page').then(m => m.PeoplePage),
    canActivate: [authGuard],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
