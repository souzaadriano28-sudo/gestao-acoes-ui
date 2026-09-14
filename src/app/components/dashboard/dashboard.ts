import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Subject, catchError, forkJoin, map, of, takeUntil, timeout } from 'rxjs';
import { Availability, CurrencySummary, DashboardReadModel, DetailedPosition, ExchangeProvenance } from '../../core/portfolio/portfolio.models';
import { PortfolioReadService } from '../../core/portfolio/portfolio-read.service';
import { AcaoService } from '../../services/acao';
import { OperacaoService, OperationDTO } from '../../services/operacao';
import { AsyncReadFacade, stateData } from '../../shared/state/async-state';
import { AsyncRegionComponent } from '../../shared/components/async-region/async-region';
import { CurrencyValueComponent } from '../../shared/components/currency-value/currency-value';
import { DateTimeValueComponent } from '../../shared/components/date-time-value/date-time-value';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header';
import { ResponsiveDataListComponent } from '../../shared/components/responsive-data-list/responsive-data-list';
import { DataStatusComponent } from '../../shared/components/data-status/data-status';
import { AtlasIconComponent } from '../../shared/components/atlas-icon/atlas-icon';

@Component({
  selector: 'app-dashboard', standalone: true,
  imports: [RouterLink, AsyncRegionComponent, CurrencyValueComponent, DateTimeValueComponent, EmptyStateComponent,
    PageHeaderComponent, ResponsiveDataListComponent,
    DataStatusComponent, AtlasIconComponent],
  templateUrl: './dashboard.html', styleUrl: './dashboard.css'
})
export class DashboardComponent implements OnInit, OnDestroy {
  readonly facade = new AsyncReadFacade<DashboardReadModel>();
  readonly operationsFacade = new AsyncReadFacade<OperationDTO[]>();
  refreshingQuotes = false;
  refreshMessage = '';
  quoteRefreshTimeoutMs = 12_000;
  private readonly destroyed$ = new Subject<void>();
  constructor(private readonly reads: PortfolioReadService, private readonly operations: OperacaoService, private readonly assets: AcaoService, private readonly changeDetector: ChangeDetectorRef) {}
  ngOnInit(): void { this.refresh(); }
  ngOnDestroy(): void { this.destroyed$.next(); this.destroyed$.complete(); this.facade.destroy(); this.operationsFacade.destroy(); }
  refresh(): void { this.facade.load(() => this.reads.dashboard()); this.operationsFacade.load(() => this.operations.list(), entries => entries.length === 0); }
  refreshQuotes(): void {
    if (this.refreshingQuotes) return;
    const assetIds = [...new Set((this.data?.positions ?? []).map(position => position.assetId))];
    this.refreshMessage = '';
    if (!assetIds.length) { this.refresh(); return; }
    this.refreshingQuotes = true;
    this.changeDetector.markForCheck();
    forkJoin(assetIds.map(id => this.assets.atualizarCotacao(id).pipe(
      timeout({ first: this.quoteRefreshTimeoutMs }), map(() => true), catchError(() => of(false))
    ))).pipe(takeUntil(this.destroyed$)).subscribe({ next: outcomes => {
      this.refreshingQuotes = false;
      if (outcomes.some(outcome => !outcome)) this.refreshMessage = 'Algumas cotações não puderam ser atualizadas. Os dados foram relidos.';
      this.refresh();
      this.changeDetector.markForCheck();
    } });
  }
  get data(): DashboardReadModel | undefined { return stateData(this.facade.state()); }
  get hasPartialData(): boolean {
    const data = this.data;
    if (!data || data.positionCount === 0) return false;
    return [...data.quoteSources].some(item => item.availability === 'UNAVAILABLE' && !this.isExpectedAbsence(item.reason));
  }
  get qualityAvailability(): Availability {
    const data = this.data;
    if (this.facade.state().status === 'stale') return 'STALE';
    if (!data) return 'UNAVAILABLE';
    const states = [data.patrimony, data.cost, data.unrealizedResult, data.unrealizedResultPercentage,
      data.exchangeSource, ...data.quoteSources].filter(item => !this.isExpectedAbsence(item.reason));
    if (states.some(item => item.availability === 'UNAVAILABLE')) return 'UNAVAILABLE';
    if (states.some(item => item.availability === 'STALE')) return 'STALE';
    return 'AVAILABLE';
  }
  get qualitySummary(): string {
    return this.qualityAvailability === 'AVAILABLE' ? 'Fontes atualizadas'
      : this.qualityAvailability === 'STALE' ? 'Há dados desatualizados' : 'Há dados indisponíveis';
  }
  isMixedCurrency(dashboard: DashboardReadModel): boolean { return (dashboard.nativeCurrencySummaries?.length ?? 0) > 1; }
  nativeSummaries(dashboard: DashboardReadModel): CurrencySummary[] { return dashboard.nativeCurrencySummaries ?? []; }
  nativeMetric(summary: CurrencySummary, metric: 'patrimony' | 'cost' | 'unrealizedResult') { return summary[metric]; }
  hasUsableExchangeRate(exchange: ExchangeProvenance): boolean { return exchange.rate !== null && exchange.availability !== 'UNAVAILABLE'; }
  exchangeRateText(exchange: ExchangeProvenance): string { return exchange.rate === null ? '—' : `1 ${exchange.baseCurrency === 'USD' ? 'US$' : exchange.baseCurrency} = R$ ${new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 8 }).format(exchange.rate)}`; }
  exchangeLabel(dashboard: DashboardReadModel): string { return dashboard.exchangeSource.provider ? `PTAX · ${dashboard.exchangeSource.provider}` : 'Conversão para BRL indisponível'; }
  exchangeReason(reason: string | null): string {
    if (!reason) return '';
    if (reason.includes('FRESHNESS')) return 'Referência de câmbio desatualizada.';
    if (reason.includes('PROVIDER')) return 'A fonte de câmbio está temporariamente indisponível.';
    return 'Conversão para BRL indisponível.';
  }
  nativeTotalsUsable(dashboard: DashboardReadModel): boolean { return this.nativeSummaries(dashboard).every(summary => summary.patrimony.value !== null && summary.cost.value !== null); }
  sourcePositions(dashboard: DashboardReadModel): DetailedPosition[] {
    const latest = new Map<string, DetailedPosition>();
    for (const position of dashboard.positions) {
      const key = `${position.assetId}:${position.quoteProvenance.provider ?? ''}`;
      const current = latest.get(key);
      if (!current || (position.quoteProvenance.fetchedAt ?? '') > (current.quoteProvenance.fetchedAt ?? '')) latest.set(key, position);
    }
    return [...latest.values()];
  }
  private isExpectedAbsence(reason: string | null): boolean {
    return reason === 'EMPTY_PORTFOLIO' || reason === 'NOT_REQUIRED' || reason === 'NOT_REQUIRED_FOR_EMPTY_PORTFOLIO' || reason === 'NOT_REQUIRED_FOR_SINGLE_CURRENCY_PORTFOLIO';
  }
  positionKey(position: DetailedPosition): number { return position.positionId; }
  get recentOperations(): OperationDTO[] { return (stateData(this.operationsFacade.state()) ?? []).slice(0, 5); }
  operationKey(operation: OperationDTO): number { return operation.id; }
  totalCosts(operation: OperationDTO): number { return operation.corretagem + operation.taxas + operation.impostos + operation.outrosCustos; }
  money(value: number, currency: string) { return { availability: 'AVAILABLE' as const, value, currency, reason: null }; }
}
