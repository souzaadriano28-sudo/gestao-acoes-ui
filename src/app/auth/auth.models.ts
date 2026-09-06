export interface CsrfResponse { token: string; headerName: string; parameterName: string; }
export interface SessionResponse { authenticated: true; username: string; }
export type AuthState =
  | { status: 'initial' | 'checking' | 'anonymous' | 'expired'; username: null }
  | { status: 'authenticated'; username: string };
export interface AuthFailure { code?: string; message?: string; }
