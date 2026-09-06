import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { AuthStore } from './auth.store';

describe('AuthStore',()=>{
  it('representa verificação, autenticação e expiração somente em memória',()=>{
    const auth={session:()=>of({authenticated:true as const,username:'atlas'}),fetchCsrf:()=>of({token:'x',headerName:'X-CSRF-TOKEN',parameterName:'_csrf'}),clearCsrf:vi.fn()};
    TestBed.configureTestingModule({providers:[AuthStore,{provide:AuthService,useValue:auth}]});const store=TestBed.inject(AuthStore);
    expect(store.state().status).toBe('initial');store.ensureSession().subscribe(ok=>expect(ok).toBe(true));expect(store.state()).toEqual({status:'authenticated',username:'atlas'});store.setExpired();expect(store.state().status).toBe('expired');expect(auth.clearCsrf).toHaveBeenCalled();
  });
  it('converte 401 de sessão em estado anônimo',()=>{TestBed.configureTestingModule({providers:[AuthStore,{provide:AuthService,useValue:{session:()=>throwError(()=>new Error('401')),fetchCsrf:()=>of({})}}]});const store=TestBed.inject(AuthStore);store.ensureSession().subscribe(ok=>expect(ok).toBe(false));expect(store.state().status).toBe('anonymous');});
});
