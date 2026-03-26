import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { filter, map, take } from 'rxjs';

/** Protects app pages — redirects to /login if not authenticated */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.loading$.pipe(
    filter(loading => !loading),
    take(1),
    map(() => {
      if (auth['userSubject'].value) return true;
      return router.createUrlTree(['/login']);
    }),
  );
};

/** Protects login page — redirects to / if already authenticated */
export const loginGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.loading$.pipe(
    filter(loading => !loading),
    take(1),
    map(() => {
      if (!auth['userSubject'].value) return true;
      return router.createUrlTree(['/']);
    }),
  );
};
