import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthStore } from './auth.store';
import { safeReturnUrl } from './auth.interceptor';

export const authGuard: CanActivateFn = (_route, state) => {
  const store=inject(AuthStore); const router=inject(Router);
  return store.ensureSession().pipe(map(ok => ok ? true : router.createUrlTree(['/login'], { queryParams: { returnUrl: safeReturnUrl(state.url) } })));
};
