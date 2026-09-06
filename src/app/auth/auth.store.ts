import { Injectable, signal } from '@angular/core';
import { catchError, finalize, map, Observable, of, shareReplay, switchMap, tap } from 'rxjs';
import { AuthService } from './auth.service';
import { AuthState, SessionResponse } from './auth.models';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly stateValue = signal<AuthState>({ status: 'initial', username: null });
  readonly state = this.stateValue.asReadonly();
  private sessionRequest?: Observable<boolean>;
  constructor(private readonly auth: AuthService) {}
  ensureSession(): Observable<boolean> {
    if (this.stateValue().status === 'authenticated') return of(true);
    if (this.sessionRequest) return this.sessionRequest;
    this.stateValue.set({ status: 'checking', username: null });
    this.sessionRequest = this.auth.session().pipe(
      switchMap(session => this.auth.fetchCsrf().pipe(map(() => session))),
      tap(session => this.setAuthenticated(session)), map(() => true),
      catchError(() => { this.stateValue.set({ status: 'anonymous', username: null }); return of(false); }),
      finalize(() => { this.sessionRequest = undefined; }), shareReplay(1));
    return this.sessionRequest;
  }
  setAuthenticated(session: SessionResponse): void { this.stateValue.set({ status: 'authenticated', username: session.username }); }
  setAnonymous(): void { this.stateValue.set({ status: 'anonymous', username: null }); }
  setExpired(): void { this.auth.clearCsrf(); this.stateValue.set({ status: 'expired', username: null }); }
}
