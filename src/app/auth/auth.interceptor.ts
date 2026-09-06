import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { AuthStore } from './auth.store';

const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService); const store = inject(AuthStore); const router = inject(Router);
  const sameOriginApi = request.url.startsWith('/api/');
  let secured = sameOriginApi ? request.clone({ withCredentials: true }) : request;
  const csrf = auth.csrfToken();
  if (sameOriginApi && MUTATING.has(request.method) && csrf) secured = secured.clone({ setHeaders: { [csrf.headerName]: csrf.token } });
  return next(secured).pipe(catchError((error: unknown) => {
    if (sameOriginApi && error instanceof HttpErrorResponse && error.status === 401 && !request.url.endsWith('/auth/login') && !request.url.endsWith('/auth/session')) {
      store.setExpired();
      if (!router.url.startsWith('/login')) void router.navigate(['/login'], { queryParams: { reason: 'expired', returnUrl: safeReturnUrl(router.url) } });
    }
    return throwError(() => error);
  }));
};
export function safeReturnUrl(value: string | null | undefined): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('://')) return '/carteira';
  const path = value.split(/[?#]/, 1)[0];
  return ['/carteira', '/corretoras', '/acoes'].includes(path) ? value : '/carteira';
}
