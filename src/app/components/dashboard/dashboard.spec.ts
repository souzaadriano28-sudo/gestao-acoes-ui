import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DashboardComponent } from './dashboard';

describe('DashboardComponent', () => {
  let fixture: ComponentFixture<DashboardComponent>; let http: HttpTestingController;
  beforeEach(async () => { await TestBed.configureTestingModule({ imports: [DashboardComponent], providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()] }).compileComponents(); fixture = TestBed.createComponent(DashboardComponent); http = TestBed.inject(HttpTestingController); });
  afterEach(() => http.verify({ ignoreCancelled: true }));
  function start(dashboard = dashboardFixture(), operations = [operation()]): void { fixture.detectChanges(); http.expectOne('/api/carteira/dashboard').flush(dashboard); http.expectOne('/api/operacoes').flush(operations); fixture.detectChanges(); }

  it('mostra valor stale e aviso compacto sem substituí-lo por indisponível', () => { const payload = dashboardFixture('STALE'); start(payload); const text = fixture.nativeElement.textContent as string; expect(text).toContain('R$ 491,20'); expect(text).toContain('Cotação desatualizada'); expect(text).not.toContain('Há dados indisponíveis'); });
  it('mantém indisponível quando não existe valor utilizável', () => { const payload = dashboardFixture('UNAVAILABLE'); start(payload); expect(fixture.nativeElement.textContent).toContain('Indisponível'); });
  it('não alerta por câmbio não necessário em carteira BRL', () => { start(dashboardFixture('AVAILABLE')); const root = fixture.nativeElement as HTMLElement; expect(root.querySelector('.source-disclosure')).toBeTruthy(); expect(root.textContent).not.toContain('Conversão para BRL indisponível'); expect(root.textContent).not.toContain('Há dados indisponíveis'); });
  it('mostra a taxa PTAX, referência e coleta quando o câmbio está disponível', () => {
    start(mixedDashboardWithExchange('AVAILABLE', 5.43219876));
    const exchangeRow = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('.source-row')).find(row => row.textContent?.includes('Câmbio USD/BRL'))!;
    expect(exchangeRow.textContent).toContain('Banco Central — PTAX');
    expect(exchangeRow.textContent).toContain('Disponível');
    expect(exchangeRow.textContent).toContain('1 US$ = R$ 5,43219876');
    expect(exchangeRow.textContent).toContain('Referência');
    expect(exchangeRow.textContent).toContain('Consultado em');
    expect(exchangeRow.textContent).toContain('BRT');
  });
  it('mantém a última taxa PTAX e os horários quando o câmbio está desatualizado', () => {
    start(mixedDashboardWithExchange('STALE', 5.43219876));
    const exchangeRow = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('.source-row')).find(row => row.textContent?.includes('Câmbio USD/BRL'))!;
    expect(exchangeRow.textContent).toContain('Desatualizado');
    expect(exchangeRow.textContent).toContain('1 US$ = R$ 5,43219876');
    expect(exchangeRow.textContent).toContain('Referência');
    expect(exchangeRow.textContent).toContain('Consultado em');
  });
  it('mantém o câmbio indisponível sem inventar taxa ou datas', () => {
    start(mixedDashboardWithExchange('UNAVAILABLE', null));
    const root = fixture.nativeElement as HTMLElement;
    const exchangeRow = Array.from(root.querySelectorAll('.source-row')).find(row => row.textContent?.includes('Câmbio USD/BRL'))!;
    expect(exchangeRow.textContent).toContain('Indisponível');
    expect(exchangeRow.textContent).toContain('—');
    expect(exchangeRow.textContent).not.toContain('1 US$ = R$');
    expect(exchangeRow.textContent).not.toContain('Referência');
    expect(root.textContent?.match(/Sem conversão disponível\. Os valores permanecem separados em BRL e USD\./g)?.length).toBe(1);
  });
  it('usa operações do ledger como fonte de movimentações e formata BRL e USD', () => { start(dashboardFixture(), [operation(), operation({ id: 2, ticker: 'AAPL', moeda: 'USD', precoUnitario: 10.5, valorTotal: 21, tipo: 'COMPRA' })]); const text = fixture.nativeElement.textContent as string; expect(text).toContain('PETR4'); expect(text).toContain('R$ 12,50'); expect(text).toContain('US$'); expect(text).toContain('21,00'); expect(text).toContain('Resultado'); });
  it('mostra resultado realizado somente para venda', () => { start(dashboardFixture(), [operation({ tipo: 'COMPRA' })]); expect((fixture.nativeElement as HTMLElement).querySelector('.movement-panel')?.textContent).not.toContain('Resultado'); });
  it('nomeia a coluna de posições como resultado não realizado sem quebra por palavra', () => { start(); const root = fixture.nativeElement as HTMLElement; const header = root.querySelector('.positions-panel .unrealized-heading') as HTMLElement; expect(header.textContent?.trim()).toBe('Resultado não realizado'); expect(header.classList).toContain('unrealized-heading'); expect(Array.from(root.querySelectorAll('.positions-panel th')).map(item => item.textContent?.trim())).not.toContain('Resultado'); });
  it('preserva preço médio vindo do read model e conteúdo anterior durante refresh', () => { start(); expect(fixture.nativeElement.textContent).toContain('R$ 10,20'); fixture.componentInstance.refresh(); expect(fixture.nativeElement.textContent).toContain('R$ 10,20'); http.expectOne('/api/carteira/dashboard').flush(dashboardFixture()); http.expectOne('/api/operacoes').flush([operation({ ticker: 'VALE3' })]); fixture.detectChanges(); expect(fixture.nativeElement.textContent).toContain('VALE3'); });
  it('mantém a carga inicial somente como leitura, sem PUT de cotação', () => { start(); http.expectNone(request => request.method === 'PUT' && request.url.includes('/atualizar-cotacao')); });
  it('renova um ativo distinto antes da nova leitura e deduplica corretoras', () => { const dashboard = dashboardFixture(); dashboard.positions.push({ ...dashboard.positions[0], positionId: 2, brokerId: 2, brokerName: 'Outra corretora' }); dashboard.positionCount = 2; start(dashboard); fixture.componentInstance.refreshQuotes(); const renewal = http.expectOne('/api/acoes/1/atualizar-cotacao'); expect(renewal.request.method).toBe('PUT'); http.expectNone('/api/carteira/dashboard'); renewal.flush({}); http.expectOne('/api/carteira/dashboard').flush(dashboardFixture()); http.expectOne('/api/operacoes').flush([operation()]); });
  it('renova múltiplos ativos antes de reler dashboard e operações', () => { const dashboard = dashboardFixture(); dashboard.positions.push({ ...dashboard.positions[0], positionId: 2, assetId: 2, ticker: 'AAPL', brokerId: 2, nativeCurrency: 'USD' }); dashboard.positionCount = 2; start(dashboard); fixture.componentInstance.refreshQuotes(); const first = http.expectOne('/api/acoes/1/atualizar-cotacao'); const second = http.expectOne('/api/acoes/2/atualizar-cotacao'); first.flush({}); second.flush({}); http.expectOne('/api/carteira/dashboard').flush(dashboardFixture()); http.expectOne('/api/operacoes').flush([operation()]); });
  it('remove aviso stale quando a releitura posterior retorna AVAILABLE', () => { start(dashboardFixture('STALE')); fixture.componentInstance.refreshQuotes(); http.expectOne('/api/acoes/1/atualizar-cotacao').flush({}); http.expectOne('/api/carteira/dashboard').flush(dashboardFixture('AVAILABLE')); http.expectOne('/api/operacoes').flush([operation()]); fixture.detectChanges(); expect(fixture.nativeElement.textContent).not.toContain('Cotação desatualizada'); });
  it('preserva dados e relê o dashboard após falha parcial de renovação', () => { const dashboard = dashboardFixture(); dashboard.positions.push({ ...dashboard.positions[0], positionId: 2, assetId: 2, ticker: 'AAPL', brokerId: 2 }); start(dashboard); fixture.componentInstance.refreshQuotes(); http.expectOne('/api/acoes/1/atualizar-cotacao').flush({}, { status: 503, statusText: 'Unavailable' }); http.expectOne('/api/acoes/2/atualizar-cotacao').flush({}); expect(fixture.componentInstance.data?.positions).toHaveLength(2); http.expectOne('/api/carteira/dashboard').flush(dashboard); http.expectOne('/api/operacoes').flush([operation()]); fixture.detectChanges(); expect(fixture.nativeElement.textContent).toContain('Algumas cotações não puderam ser atualizadas'); });
  it('encerra timeout de renovação e permite nova tentativa', async () => { start(); fixture.componentInstance.quoteRefreshTimeoutMs = 1; fixture.componentInstance.refreshQuotes(); http.expectOne('/api/acoes/1/atualizar-cotacao'); await new Promise(resolve => setTimeout(resolve, 15)); expect(fixture.componentInstance.refreshingQuotes).toBe(false); http.expectOne('/api/carteira/dashboard').flush(dashboardFixture()); http.expectOne('/api/operacoes').flush([operation()]); fixture.componentInstance.refreshQuotes(); http.expectOne('/api/acoes/1/atualizar-cotacao').flush({}); http.expectOne('/api/carteira/dashboard').flush(dashboardFixture()); http.expectOne('/api/operacoes').flush([operation()]); });
  it('apenas relê quando a carteira está vazia', () => { const empty = dashboardFixture(); empty.positions = []; empty.positionCount = 0; start(empty, []); fixture.componentInstance.refreshQuotes(); http.expectNone(request => request.method === 'PUT'); http.expectOne('/api/carteira/dashboard').flush(empty); http.expectOne('/api/operacoes').flush([]); });
  it('preserva a ordem recebida e mostra somente as cinco operações mais recentes', () => {
    const entries = Array.from({ length: 7 }, (_, index) => operation({ id: index + 1, ticker: `AT${index + 1}`, tipo: index % 2 ? 'COMPRA' : 'VENDA' }));
    start(dashboardFixture(), entries);
    const text = (fixture.nativeElement as HTMLElement).querySelector('.movement-panel')!.textContent!;
    expect(text).toContain('AT1'); expect(text).toContain('AT5'); expect(text).not.toContain('AT6'); expect(text).not.toContain('AT7');
    expect(text.indexOf('AT1')).toBeLessThan(text.indexOf('AT2'));
    expect(text).toContain('Compra'); expect(text).toContain('Venda');
  });
});
function metric(value: number | null, availability: 'AVAILABLE' | 'STALE' | 'UNAVAILABLE' = 'AVAILABLE', currency = 'BRL'): any { return { availability, value, currency, reason: availability === 'STALE' ? 'QUOTE_FRESHNESS_EXCEEDED' : availability === 'UNAVAILABLE' ? 'QUOTE_UNAVAILABLE' : null }; }
function dashboardFixture(status: 'AVAILABLE' | 'STALE' | 'UNAVAILABLE' = 'AVAILABLE'): any { const value = status === 'UNAVAILABLE' ? null : 491.2; return { asOf: '2026-09-12T15:00:00Z', presentationCurrency: 'BRL', positionCount: 1, patrimony: metric(value, status), cost: metric(102, status), unrealizedResult: metric(status === 'UNAVAILABLE' ? null : 389.2, status), unrealizedResultPercentage: { availability: status, value: status === 'UNAVAILABLE' ? null : 381.5686, reason: null }, positions: [{ positionId: 1, assetId: 1, ticker: 'PETR4', assetName: 'Petrobras PN', market: 'BRASIL', brokerId: 1, brokerName: 'Corretora Longa de Investimentos S.A.', quantity: 10, nativeCurrency: 'BRL', averagePrice: metric(10.2), cost: metric(102), currentQuote: metric(49.12, status), marketValue: metric(value, status), unrealizedResult: metric(status === 'UNAVAILABLE' ? null : 389.2, status), unrealizedResultPercentage: { availability: status, value: null, reason: null }, realizedResult: metric(0), quoteProvenance: { availability: status, sourceType: 'MARKET', provider: 'B3', referenceAt: '2026-09-12T14:00:00Z', fetchedAt: '2026-09-12T14:01:00Z', referenceKind: 'MARKET', currency: 'BRL', reason: null } }], recentMovements: [], quoteSources: [], exchangeSource: { availability: 'UNAVAILABLE', baseCurrency: 'USD', quoteCurrency: 'BRL', rate: null, sourceType: null, provider: null, referenceAt: null, fetchedAt: null, referenceKind: null, reason: 'NOT_REQUIRED_FOR_SINGLE_CURRENCY_PORTFOLIO' } }; }
function mixedDashboardWithExchange(availability: 'AVAILABLE' | 'STALE' | 'UNAVAILABLE', rate: number | null): any {
  const dashboard = dashboardFixture();
  dashboard.positionCount = 2;
  dashboard.nativeCurrencySummaries = [
    { currency: 'BRL', patrimony: metric(491.2), cost: metric(102), unrealizedResult: metric(389.2), unrealizedResultPercentage: { availability: 'AVAILABLE', value: 381.5686, reason: null } },
    { currency: 'USD', patrimony: metric(100, 'AVAILABLE', 'USD'), cost: metric(99, 'AVAILABLE', 'USD'), unrealizedResult: metric(1, 'AVAILABLE', 'USD'), unrealizedResultPercentage: { availability: 'AVAILABLE', value: 1.01, reason: null } }
  ];
  dashboard.positions.push({ ...dashboard.positions[0], positionId: 2, assetId: 2, ticker: 'AAPL', brokerId: 2, nativeCurrency: 'USD', averagePrice: metric(99, 'AVAILABLE', 'USD'), cost: metric(99, 'AVAILABLE', 'USD'), currentQuote: metric(100, 'AVAILABLE', 'USD'), marketValue: metric(100, 'AVAILABLE', 'USD'), unrealizedResult: metric(1, 'AVAILABLE', 'USD'), quoteProvenance: { availability: 'AVAILABLE', sourceType: 'MARKET', provider: 'TWELVE_DATA', referenceAt: '2026-09-12T14:00:00Z', fetchedAt: '2026-09-12T14:01:00Z', referenceKind: 'MARKET', currency: 'USD', reason: null } });
  dashboard.exchangeSource = { availability, baseCurrency: 'USD', quoteCurrency: 'BRL', rate, sourceType: 'OFFICIAL_REFERENCE_RATE', provider: 'BANCO_CENTRAL_DO_BRASIL_PTAX', referenceAt: rate === null ? null : '2026-09-12T16:00:00Z', fetchedAt: rate === null ? null : '2026-09-12T16:05:00Z', referenceKind: 'BCB_PTAX_CLOSING_REFERENCE', reason: rate === null ? 'EXCHANGE_RATE_UNAVAILABLE' : availability === 'STALE' ? 'EXCHANGE_FRESHNESS_EXCEEDED' : null };
  return dashboard;
}
function operation(overrides: any = {}): any { return { id: 1, tipo: 'VENDA', ativoId: 1, ticker: 'PETR4', corretoraId: 1, corretora: 'Corretora Longa de Investimentos S.A.', quantidade: 2, moeda: 'BRL', precoUnitario: 12.5, corretagem: 0, taxas: 0, impostos: 0, outrosCustos: 0, valorBruto: 25, valorTotal: 25, resultadoRealizado: 5, dataHora: '2026-09-12T10:00:00', observacao: null, ...overrides }; }
