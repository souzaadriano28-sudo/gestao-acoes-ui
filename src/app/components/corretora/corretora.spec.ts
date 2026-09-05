import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CorretoraComponent } from './corretora';

describe('CorretoraComponent', () => {
  let fixture: ComponentFixture<CorretoraComponent>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CorretoraComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    fixture = TestBed.createComponent(CorretoraComponent);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('bloqueia cadastro repetido, associa erro de campo e libera o formulário', () => {
    fixture.detectChanges();
    http.expectOne('http://localhost:8080/corretoras').flush([]);
    const component = fixture.componentInstance;
    component.cnpjCorretora = '11.222.333/0001-81';
    component.cepCorretora = '01001000';

    component.adicionarCorretora();
    component.adicionarCorretora();
    const requests = http.match('http://localhost:8080/corretoras');
    expect(requests.length).toBe(1);
    expect(component.salvando).toBe(true);
    requests[0].flush({ message: 'Revise', fieldErrors: [{ field: 'cnpj', message: 'inválido' }] },
      { status: 422, statusText: 'Unprocessable Entity' });
    expect(component.salvando).toBe(false);
    expect(component.errosCampos['cnpj']).toBe('inválido');
  });

  it('distingue vazio, falha inicial e dados antigos desatualizados', () => {
    fixture.detectChanges();
    http.expectOne('http://localhost:8080/corretoras').flush([]);
    const component = fixture.componentInstance;
    expect(component.corretoras).toEqual([]);
    expect(component.cargaFalhou).toBe(false);

    component.carregarCorretoras();
    http.expectOne('http://localhost:8080/corretoras').flush({}, { status: 503, statusText: 'Unavailable' });
    expect(component.cargaFalhou).toBe(true);
    expect(component.dadosDesatualizados).toBe(false);

    component.corretoras = [{ id: 1, cnpj: '11222333000181', razaoSocial: 'Corretora Teste' }];
    component.carregarCorretoras();
    http.expectOne('http://localhost:8080/corretoras').flush({}, { status: 503, statusText: 'Unavailable' });
    expect(component.corretoras.length).toBe(1);
    expect(component.dadosDesatualizados).toBe(true);
  });
});
