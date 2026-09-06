import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from './auth.service';

describe('AuthService',()=>{
  let service:AuthService;let http:HttpTestingController;
  beforeEach(()=>{TestBed.configureTestingModule({providers:[provideHttpClient(),provideHttpClientTesting()]});service=TestBed.inject(AuthService);http=TestBed.inject(HttpTestingController);});
  afterEach(()=>http.verify());
  it('mantém CSRF somente em memória e renova depois do login',()=>{
    service.login('admin','secret-value').subscribe(session=>expect(session.username).toBe('admin'));
    http.expectOne('/api/auth/csrf').flush({token:'before',headerName:'X-CSRF-TOKEN',parameterName:'_csrf'});
    const login=http.expectOne('/api/auth/login');expect(login.request.method).toBe('POST');expect(login.request.body).toEqual({username:'admin',password:'secret-value'});login.flush({authenticated:true,username:'admin'});
    http.expectOne('/api/auth/csrf').flush({token:'after',headerName:'X-CSRF-TOKEN',parameterName:'_csrf'});
    expect(service.csrfToken()?.token).toBe('after');
    expect(localStorage.length).toBe(0);expect(sessionStorage.length).toBe(0);
  });
  it('faz logout por POST e prepara novo CSRF',()=>{service.fetchCsrf().subscribe();http.expectOne('/api/auth/csrf').flush({token:'one',headerName:'X-CSRF-TOKEN',parameterName:'_csrf'});service.logout().subscribe();const logout=http.expectOne('/api/auth/logout');expect(logout.request.method).toBe('POST');logout.flush(null);http.expectOne('/api/auth/csrf').flush({token:'two',headerName:'X-CSRF-TOKEN',parameterName:'_csrf'});});
});
