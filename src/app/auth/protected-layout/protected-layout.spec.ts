import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../auth.service';
import { AuthStore } from '../auth.store';
import { ProtectedLayoutComponent } from './protected-layout';
import { NotFoundComponent } from '../../shared/pages/not-found/not-found';

describe('ProtectedLayoutComponent', () => {
  const auth = { logout: vi.fn(() => of({ token: 'next', headerName: 'X-CSRF-TOKEN', parameterName: '_csrf' })) };
  const store = { state: () => ({ status: 'authenticated', username: 'atlas' }), setAnonymous: vi.fn() };

  beforeEach(async () => {
    auth.logout.mockClear();
    store.setAnonymous.mockClear();
    await TestBed.configureTestingModule({
      imports: [ProtectedLayoutComponent],
      providers: [provideRouter([{ path: 'dashboard', component: NotFoundComponent }, { path: 'login', component: NotFoundComponent }]), { provide: AuthService, useValue: auth }, { provide: AuthStore, useValue: store }]
    }).compileComponents();
  });

  it('oferece as cinco rotas por rail e barra móvel, skip link e aviso persistente', () => {
    const fixture = TestBed.createComponent(ProtectedLayoutComponent);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('.skip-link')?.getAttribute('href')).toBe('#conteudo');
    expect(root.querySelectorAll('.side-navigation a')).toHaveLength(5);
    expect(root.querySelectorAll('.mobile-navigation a')).toHaveLength(5);
    expect(root.querySelector('.rail')).toBeTruthy();
    expect(root.querySelector('.mobile-navigation')).toBeTruthy();
    expect(root.querySelector('.academic-disclaimer')?.textContent).toContain('nenhuma ordem é enviada');
    const firstLink = root.querySelector('.side-navigation a') as HTMLAnchorElement;
    firstLink.focus();
    expect(document.activeElement).toBe(firstLink);
  });

  it('mantém logout delegado ao serviço e limpa o estado autenticado', () => {
    const fixture = TestBed.createComponent(ProtectedLayoutComponent);
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('.account button') as HTMLButtonElement).click();
    expect(auth.logout).toHaveBeenCalledTimes(1);
    expect(store.setAnonymous).toHaveBeenCalledTimes(1);
  });

  it('configura semântica de rota atual nos links', async () => {
    const fixture = TestBed.createComponent(ProtectedLayoutComponent);
    fixture.detectChanges();
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/dashboard');
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('.side-navigation a.active')?.getAttribute('aria-current')).toBe('page');
  });
});
