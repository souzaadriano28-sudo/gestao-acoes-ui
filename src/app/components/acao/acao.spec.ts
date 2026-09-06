import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AcaoComponent } from './acao';

describe('AcaoComponent', () => {
  let fixture: ComponentFixture<AcaoComponent>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AcaoComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    fixture = TestBed.createComponent(AcaoComponent);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('não envia cadastro duas vezes enquanto está pendente', () => {
    fixture.detectChanges();
    http.expectOne('/api/acoes').flush([]);
    const component = fixture.componentInstance;
    component.tickerDigitado = 'PETR4';
    component.mercadoSelecionado = 'BRASIL';
    component.adicionarAcao();
    component.adicionarAcao();
    const requests = http.match('/api/acoes');
    expect(requests.length).toBe(1);
    requests[0].flush({ ticker: 'PETR4', mercado: 'BRASIL' }, { status: 201, statusText: 'Created' });
    http.expectOne('/api/acoes').flush([]);
  });

  it('bloqueia atualização repetida e libera o ativo após erro', () => {
    fixture.detectChanges();
    http.expectOne('/api/acoes').flush([{ id: 7, ticker: 'PETR4', mercado: 'BRASIL' }]);
    const component = fixture.componentInstance;

    component.atualizarPreco(7);
    component.atualizarPreco(7);
    const requests = http.match('/api/acoes/7/atualizar-cotacao');
    expect(requests.length).toBe(1);
    expect(component.atualizando.has(7)).toBe(true);
    requests[0].flush({ message: 'provedor indisponível', fieldErrors: [] }, { status: 503, statusText: 'Unavailable' });
    expect(component.atualizando.has(7)).toBe(false);
    expect(component.mensagemErro).toBe('provedor indisponível');
  });

  it('distingue falha inicial e preserva lista antiga como desatualizada', () => {
    fixture.detectChanges();
    http.expectOne('/api/acoes').flush({}, { status: 503, statusText: 'Unavailable' });
    const component = fixture.componentInstance;
    expect(component.cargaFalhou).toBe(true);
    expect(component.dadosDesatualizados).toBe(false);

    component.acoes = [{ id: 1, ticker: 'PETR4', mercado: 'BRASIL' }];
    component.carregarAcoes();
    http.expectOne('/api/acoes').flush({}, { status: 503, statusText: 'Unavailable' });
    expect(component.acoes.length).toBe(1);
    expect(component.dadosDesatualizados).toBe(true);
  });
});
