import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { authInterceptor, safeReturnUrl } from './auth.interceptor';
import { AuthService } from './auth.service';

describe('authInterceptor',()=>{
  let http:HttpTestingController;let client:HttpClient;let auth:AuthService;
  beforeEach(()=>{TestBed.configureTestingModule({providers:[provideRouter([]),provideHttpClient(withInterceptors([authInterceptor])),provideHttpClientTesting()]});http=TestBed.inject(HttpTestingController);client=TestBed.inject(HttpClient);auth=TestBed.inject(AuthService);});afterEach(()=>http.verify());
  it('envia cookie e CSRF apenas para mutação same-origin da API',()=>{auth.fetchCsrf().subscribe();http.expectOne('/api/auth/csrf').flush({token:'memory-only',headerName:'X-CSRF-TOKEN',parameterName:'_csrf'});client.post('/api/carteira/comprar',{}).subscribe();const own=http.expectOne('/api/carteira/comprar');expect(own.request.withCredentials).toBe(true);expect(own.request.headers.get('X-CSRF-TOKEN')).toBe('memory-only');own.flush({});client.post('https://example.invalid/x',{}).subscribe();const external=http.expectOne('https://example.invalid/x');expect(external.request.withCredentials).toBe(false);expect(external.request.headers.has('X-CSRF-TOKEN')).toBe(false);external.flush({});});
  it('aceita apenas retornos internos conhecidos',()=>{expect(safeReturnUrl('/acoes?x=1')).toBe('/acoes?x=1');expect(safeReturnUrl('/dashboard')).toBe('/dashboard');expect(safeReturnUrl('/operacoes')).toBe('/operacoes');expect(safeReturnUrl('https://evil.invalid')).toBe('/dashboard');expect(safeReturnUrl('//evil.invalid')).toBe('/dashboard');expect(safeReturnUrl('/login')).toBe('/dashboard');});
});
