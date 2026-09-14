import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, catchError, forkJoin, map, of, takeUntil, timeout } from 'rxjs';
import { DetailedPosition, Market, PageResponse, PositionQuery } from '../../core/portfolio/portfolio.models';
import { PortfolioReadService } from '../../core/portfolio/portfolio-read.service';
import { AcaoService } from '../../services/acao';
import { Corretora, CorretoraService } from '../../services/corretora';
import { AsyncReadFacade, stateData } from '../../shared/state/async-state';
import { AsyncRegionComponent } from '../../shared/components/async-region/async-region';
import { CurrencyValueComponent } from '../../shared/components/currency-value/currency-value';
import { DataStatusComponent } from '../../shared/components/data-status/data-status';
import { DateTimeValueComponent } from '../../shared/components/date-time-value/date-time-value';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header';
import { PaginationComponent } from '../../shared/components/pagination/pagination';
import { PercentageValueComponent } from '../../shared/components/percentage-value/percentage-value';

type PositionSort = 'ticker' | 'broker' | 'quantity';

@Component({
  selector: 'app-carteira', standalone: true,
  imports: [ReactiveFormsModule, AsyncRegionComponent, CurrencyValueComponent, DataStatusComponent, DateTimeValueComponent, EmptyStateComponent,
    PageHeaderComponent, PaginationComponent, PercentageValueComponent],
  templateUrl: './carteira.html', styleUrl: './carteira.css'
})
export class CarteiraComponent implements OnInit, OnDestroy {
  readonly facade = new AsyncReadFacade<PageResponse<DetailedPosition>>();
  readonly filters = new FormGroup({
    search: new FormControl('', { nonNullable: true }),
    market: new FormControl<Market | ''>('', { nonNullable: true }),
    brokerId: new FormControl<number | ''>('', { nonNullable: true }),
    sort: new FormControl<PositionSort>('ticker', { nonNullable: true })
  });
  brokers: Corretora[] = [];
  brokerLoadFailed = false;
  filtersExpanded = false;
  page = 0;
  readonly size = 20;
  refreshingQuotes = false;
  refreshMessage = '';
  quoteRefreshTimeoutMs = 12_000;
  private readonly destroyed$ = new Subject<void>();

  constructor(private readonly reads: PortfolioReadService, private readonly brokerService: CorretoraService, private readonly assets: AcaoService,
    private readonly route: ActivatedRoute, private readonly router: Router, private readonly changeDetector: ChangeDetectorRef) {}

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    const market = params.get('market');
    this.page = Math.max(0, Number(params.get('page')) || 0);
    this.filters.patchValue({ search: params.get('search') ?? '', market: market === 'BRASIL' || market === 'AMERICANO' ? market : '',
      brokerId: positiveNumber(params.get('brokerId')), sort: asSort(params.get('sort')) }, { emitEvent: false });
    this.loadBrokers();
    this.load();
  }
  ngOnDestroy(): void { this.destroyed$.next(); this.destroyed$.complete(); this.facade.destroy(); }
  load(): void {
    const value = this.filters.getRawValue();
    const query: PositionQuery = { page: this.page, size: this.size };
    if (value.market) query.market = value.market;
    if (value.brokerId) query.brokerId = value.brokerId;
    this.facade.load(() => this.reads.detailedPositions(query), result => result.items.length === 0);
    void this.router.navigate([], { relativeTo: this.route, replaceUrl: true, queryParams: {
      page: this.page || null, search: value.search || null, market: value.market || null,
      brokerId: value.brokerId || null, sort: value.sort === 'ticker' ? null : value.sort
    }, queryParamsHandling: 'merge' });
  }
  applyFilters(): void { this.page = 0; this.load(); }
  refreshQuotes(): void {
    if (this.refreshingQuotes) return;
    const assetIds = [...new Set((this.response?.items ?? []).map(position => position.assetId))];
    this.refreshMessage = '';
    if (!assetIds.length) { this.load(); return; }
    this.refreshingQuotes = true;
    this.changeDetector.markForCheck();
    forkJoin(assetIds.map(id => this.assets.atualizarCotacao(id).pipe(
      timeout({ first: this.quoteRefreshTimeoutMs }), map(() => true), catchError(() => of(false))
    ))).pipe(takeUntil(this.destroyed$)).subscribe({ next: outcomes => {
      this.refreshingQuotes = false;
      if (outcomes.some(outcome => !outcome)) this.refreshMessage = 'Algumas cotações não puderam ser atualizadas. As posições foram relidas.';
      this.load();
      this.changeDetector.markForCheck();
    } });
  }
  clearFilters(): void { this.filters.reset({ search: '', market: '', brokerId: '', sort: 'ticker' }); this.applyFilters(); }
  toggleFilters(): void { this.filtersExpanded = !this.filtersExpanded; }
  changePage(page: number): void { this.page = page; this.load(); }
  private loadBrokers(): void { this.brokerService.listar().subscribe({ next: value => { this.brokers = value; this.brokerLoadFailed = false; this.changeDetector.markForCheck(); }, error: () => { this.brokerLoadFailed = true; this.changeDetector.markForCheck(); } }); }
  get response(): PageResponse<DetailedPosition> | undefined { return stateData(this.facade.state()); }
  get activeFilterCount(): number { const value = this.filters.getRawValue(); return [value.search, value.market, value.brokerId, value.sort !== 'ticker'].filter(Boolean).length; }
  get visiblePositions(): DetailedPosition[] {
    const value = this.filters.getRawValue();
    const term = value.search.trim().toLocaleUpperCase('pt-BR');
    return [...(this.response?.items ?? [])].filter(item => !term || item.ticker.includes(term) || item.brokerName.toLocaleUpperCase('pt-BR').includes(term))
      .sort((a, b) => value.sort === 'quantity' ? b.quantity - a.quantity : value.sort === 'broker'
        ? a.brokerName.localeCompare(b.brokerName, 'pt-BR') : a.ticker.localeCompare(b.ticker, 'pt-BR'));
  }
  resultLabel(position: DetailedPosition): string {
    const value = position.unrealizedResult.value;
    return value === null || position.unrealizedResult.availability === 'UNAVAILABLE'
      ? 'Indisponível' : value > 0 ? 'Ganho' : value < 0 ? 'Perda' : 'Sem variação';
  }
}

function positiveNumber(value: string | null): number | '' { const parsed = Number(value); return Number.isInteger(parsed) && parsed > 0 ? parsed : ''; }
function asSort(value: string | null): PositionSort { return value === 'broker' || value === 'quantity' ? value : 'ticker'; }
