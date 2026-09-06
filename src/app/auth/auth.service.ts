import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, switchMap, tap } from 'rxjs';
import { CsrfResponse, SessionResponse } from './auth.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly baseUrl = '/api/auth';
  private readonly csrf = signal<CsrfResponse | null>(null);
  readonly csrfToken = this.csrf.asReadonly();
  constructor(private readonly http: HttpClient) {}
  fetchCsrf(): Observable<CsrfResponse> {
    return this.http.get<CsrfResponse>(`${this.baseUrl}/csrf`).pipe(tap(value => this.csrf.set(value)));
  }
  login(username: string, password: string): Observable<SessionResponse> {
    const ensure = this.csrf() ? new Observable<CsrfResponse>(subscriber => { subscriber.next(this.csrf()!); subscriber.complete(); }) : this.fetchCsrf();
    return ensure.pipe(switchMap(() => this.http.post<SessionResponse>(`${this.baseUrl}/login`, { username, password })),
      tap(() => this.csrf.set(null)), switchMap(session => this.fetchCsrf().pipe(switchMap(() => [session]))));
  }
  session(): Observable<SessionResponse> { return this.http.get<SessionResponse>(`${this.baseUrl}/session`); }
  logout(): Observable<CsrfResponse> {
    return this.http.post<void>(`${this.baseUrl}/logout`, {}).pipe(tap(() => this.csrf.set(null)), switchMap(() => this.fetchCsrf()));
  }
  clearCsrf(): void { this.csrf.set(null); }
}
