import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AcaoService } from './acao';

describe('AcaoService', () => {
  let service: AcaoService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(AcaoService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lista ações pelo endpoint atual', () => {
    service.listar().subscribe(value => expect(value[0].ticker).toBe('PETR4'));
    const request = http.expectOne('/api/acoes');
    expect(request.request.method).toBe('GET');
    request.flush([{ ticker: 'PETR4', mercado: 'BRASIL' }]);
  });

  it('cadastra mantendo o payload atual', () => {
    service.salvar('AAPL', 'AMERICANO').subscribe();
    const request = http.expectOne('/api/acoes');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ ticker: 'AAPL', mercado: 'AMERICANO' });
    request.flush({ ticker: 'AAPL', mercado: 'AMERICANO' }, { status: 201, statusText: 'Created' });
  });
});
