import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { DashboardReadModel } from './portfolio.models';
import { PortfolioReadService } from './portfolio-read.service';

describe('PortfolioReadService', () => {
  let service: PortfolioReadService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(PortfolioReadService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('consulta o dashboard tipado sem combinar outras listas', () => {
    service.dashboard().subscribe(value => expect(value.presentationCurrency).toBe('BRL'));
    const request = http.expectOne('/api/carteira/dashboard');
    expect(request.request.method).toBe('GET');
    const zero = { availability: 'AVAILABLE' as const, value: 0, currency: 'BRL', reason: null };
    const unavailablePercentage = { availability: 'UNAVAILABLE' as const, value: null, reason: 'EMPTY_PORTFOLIO' };
    const payload: DashboardReadModel = {
      asOf: '2026-09-06T15:00:00Z', presentationCurrency: 'BRL', positionCount: 0,
      patrimony: zero, cost: zero, unrealizedResult: zero, unrealizedResultPercentage: unavailablePercentage,
      positions: [], recentMovements: [], quoteSources: [],
      exchangeSource: { availability: 'UNAVAILABLE', baseCurrency: 'USD', quoteCurrency: 'BRL', rate: null, sourceType: null, provider: null, referenceAt: null, fetchedAt: null, referenceKind: null, reason: 'NOT_REQUIRED' }
    };
    request.flush(payload);
  });

  it('envia somente filtros definidos para posições detalhadas', () => {
    service.detailedPositions({ page: 2, size: 25, market: 'AMERICANO', brokerId: 7 }).subscribe(page => expect(page.items[0].brokerId).toBe(7));
    const request = http.expectOne(value => value.url === '/api/carteira/posicoes/detalhadas');
    expect(request.request.params.keys().sort()).toEqual(['brokerId', 'market', 'page', 'size']);
    expect(request.request.params.get('page')).toBe('2');
    expect(request.request.params.get('market')).toBe('AMERICANO');
    const money = { availability: 'AVAILABLE' as const, value: 10.25, currency: 'USD', reason: null };
    const provenance = { availability: 'UNAVAILABLE' as const, sourceType: null, provider: null, referenceAt: null, fetchedAt: null, referenceKind: null, currency: 'USD', reason: 'LEGACY_SOURCE_UNAVAILABLE' };
    request.flush({ items: [{ positionId: 1, assetId: 2, ticker: 'AAPL', market: 'AMERICANO', brokerId: 7, brokerName: 'Corretora', quantity: 1, nativeCurrency: 'USD', averagePrice: money, cost: money, currentQuote: money, marketValue: money, unrealizedResult: money, quoteProvenance: provenance }], page: 2, size: 25, totalElements: 1, totalPages: 1 });
  });

  it('aceita movimentação com proveniência histórica explicitamente indisponível', () => {
    service.movements().subscribe(page => expect(page.items[0].historicalQuoteProvenance.provider).toBeNull());
    const request = http.expectOne('/api/carteira/movimentacoes');
    expect(request.request.params.keys()).toEqual([]);
    request.flush({ items: [{ id: 1, type: 'COMPRA', assetId: 2, ticker: 'AAPL', market: 'AMERICANO', brokerId: 7, brokerName: 'Corretora', quantity: 1, unitPrice: { availability: 'AVAILABLE', value: 10.25, currency: 'USD', reason: null }, recordedAt: '2026-09-06T12:00:00-03:00', timeBasis: 'OFFSET_DATE_TIME', historicalQuoteProvenance: { availability: 'UNAVAILABLE', sourceType: null, provider: null, referenceAt: null, fetchedAt: null, referenceKind: null, currency: 'USD', reason: 'LEGACY_SOURCE_UNAVAILABLE' } }], page: 0, size: 20, totalElements: 1, totalPages: 1 });
  });

  it('preserva paginação, filtros temporais e envelope de erro do backend', () => {
    let failure: HttpErrorResponse | undefined;
    service.movements({ type: 'VENDA', ticker: 'PETR4', from: '2026-09-01T00:00:00-03:00', to: '2026-09-06T23:59:59-03:00' })
      .subscribe({ error: error => failure = error });
    const request = http.expectOne(value => value.url === '/api/carteira/movimentacoes');
    expect(request.request.params.get('type')).toBe('VENDA');
    expect(request.request.params.get('from')).toBe('2026-09-01T00:00:00-03:00');
    request.flush({ code: 'INVALID_FILTER', message: 'Período inválido', fieldErrors: [] }, { status: 422, statusText: 'Unprocessable Entity' });
    expect(failure?.status).toBe(422);
    expect(failure?.error.code).toBe('INVALID_FILTER');
  });
});
