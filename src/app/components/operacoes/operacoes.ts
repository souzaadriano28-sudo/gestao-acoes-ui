import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin, finalize, timeout, TimeoutError } from 'rxjs';
import { Movement, MovementQuery, MovementType, PageResponse } from '../../core/portfolio/portfolio.models';
import { PortfolioReadService } from '../../core/portfolio/portfolio-read.service';
import { Acao, AcaoService } from '../../services/acao';
import { parseApiError } from '../../services/api-error';
import { CarteiraService, TransacaoRequest } from '../../services/carteira';
import { Corretora, CorretoraService } from '../../services/corretora';
import { AsyncReadFacade, stateData } from '../../shared/state/async-state';
import { AsyncRegionComponent } from '../../shared/components/async-region/async-region';
import { CurrencyValueComponent } from '../../shared/components/currency-value/currency-value';
import { DateTimeValueComponent } from '../../shared/components/date-time-value/date-time-value';
import { ErrorSummaryComponent } from '../../shared/components/error-summary/error-summary';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header';
import { PaginationComponent } from '../../shared/components/pagination/pagination';
import { ResponsiveDataListComponent } from '../../shared/components/responsive-data-list/responsive-data-list';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge';

type OperationOutcome = 'idle' | 'success' | 'refused' | 'conflict' | 'unknown' | 'refresh-failed';

@Component({ selector: 'app-operacoes', standalone: true,
  imports: [ReactiveFormsModule, AsyncRegionComponent, CurrencyValueComponent, DateTimeValueComponent, ErrorSummaryComponent,
    PageHeaderComponent, PaginationComponent, ResponsiveDataListComponent, StatusBadgeComponent],
  templateUrl: './operacoes.html', styleUrl: './operacoes.css' })
export class OperacoesComponent implements OnInit, OnDestroy {
  readonly movementsFacade = new AsyncReadFacade<PageResponse<Movement>>();
  readonly form = new FormGroup({
    type: new FormControl<MovementType>('COMPRA', { nonNullable: true }),
    assetId: new FormControl<number | ''>('', { nonNullable: true, validators: [Validators.required] }),
    brokerId: new FormControl<number | ''>('', { nonNullable: true, validators: [Validators.required] }),
    quantity: new FormControl<number | null>(null, { validators: [Validators.required, Validators.min(1), Validators.max(2147483647), Validators.pattern(/^\d+$/)] })
  });
  readonly filters = new FormGroup({
    type: new FormControl<MovementType | ''>('', { nonNullable: true }), ticker: new FormControl('', { nonNullable: true }),
    brokerId: new FormControl<number | ''>('', { nonNullable: true }), from: new FormControl('', { nonNullable: true }), to: new FormControl('', { nonNullable: true })
  });
  assets: Acao[] = []; brokers: Corretora[] = []; choicesLoading = true; choicesError = '';
  page = 0; readonly size = 20; reviewing = false; pending = false; mustReconcile = false;
  outcome: OperationOutcome = 'idle'; message = ''; fieldErrors: Record<string, string> = {};
  private positions: { assetId: number; brokerId: number; quantity: number }[] = [];

  constructor(private readonly portfolio: PortfolioReadService, private readonly operations: CarteiraService,
    private readonly assetsService: AcaoService, private readonly brokersService: CorretoraService) {}
  ngOnInit(): void { this.loadChoices(); this.loadMovements(); this.loadPositions(); }
  ngOnDestroy(): void { this.movementsFacade.destroy(); }
  get movementPage(): PageResponse<Movement> | undefined { return stateData(this.movementsFacade.state()); }
  get selectedAsset(): Acao | undefined { return this.assets.find(item => item.id === Number(this.form.controls.assetId.value)); }
  get selectedBroker(): Corretora | undefined { return this.brokers.find(item => item.id === Number(this.form.controls.brokerId.value)); }
  get availableQuantity(): number | undefined { const asset = this.selectedAsset; const broker = this.selectedBroker; if (!asset?.id || !broker?.id) return undefined; return this.positions.find(item => item.assetId === asset.id && item.brokerId === broker.id)?.quantity; }

  loadChoices(): void { this.choicesLoading = true; this.choicesError = ''; forkJoin({ assets: this.assetsService.listar(), brokers: this.brokersService.listar() }).pipe(finalize(() => this.choicesLoading = false)).subscribe({ next: value => { this.assets = value.assets; this.brokers = value.brokers; }, error: error => this.choicesError = parseApiError(error).message }); }
  loadPositions(): void { this.portfolio.detailedPositions({ page: 0, size: 100 }).subscribe({ next: page => this.positions = page.items.map(item => ({ assetId: item.assetId, brokerId: item.brokerId, quantity: item.quantity })), error: () => undefined }); }
  loadMovements(): void { const raw = this.filters.getRawValue(); const query: MovementQuery = { page: this.page, size: this.size }; if (raw.type) query.type = raw.type; if (raw.ticker.trim()) query.ticker = raw.ticker.trim().toLocaleUpperCase('pt-BR'); if (raw.brokerId) query.brokerId = raw.brokerId; if (raw.from) query.from = new Date(`${raw.from}T00:00:00-03:00`).toISOString(); if (raw.to) query.to = new Date(`${raw.to}T23:59:59-03:00`).toISOString(); this.movementsFacade.load(() => this.portfolio.movements(query), page => page.items.length === 0); }
  applyFilters(): void { this.page = 0; this.loadMovements(); }
  clearFilters(): void { this.filters.reset({ type: '', ticker: '', brokerId: '', from: '', to: '' }); this.applyFilters(); }
  changePage(value: number): void { this.page = value; this.loadMovements(); }
  review(): void { this.clearOutcome(); this.form.markAllAsTouched(); if (this.form.invalid || !this.selectedAsset || !this.selectedBroker) return; this.reviewing = true; }
  cancelReview(): void { if (!this.pending) this.reviewing = false; }
  confirm(): void {
    if (this.pending || this.mustReconcile || !this.reviewing || this.form.invalid || !this.selectedAsset || !this.selectedBroker?.id) return;
    const payload: TransacaoRequest = { ticker: this.selectedAsset.ticker, mercado: this.selectedAsset.mercado,
      qtd: this.form.controls.quantity.value!, corretoraId: this.selectedBroker.id };
    this.pending = true; this.form.disable(); this.clearOutcome();
    const request = this.form.controls.type.value === 'COMPRA' ? this.operations.comprar(payload) : this.operations.vender(payload);
    request.pipe(timeout({ first: 10_000 }), finalize(() => { this.pending = false; this.form.enable(); })).subscribe({
      next: () => { this.outcome = 'success'; this.message = 'Registro simulado confirmado pelo backend. Atualizando as leituras confirmadas…'; this.reviewing = false; this.refreshAfterConfirmation(); },
      error: error => this.handleMutationError(error)
    });
  }
  reconcile(): void {
    this.message = 'Reconciliando posições e histórico antes de permitir nova tentativa…';
    forkJoin({ dashboard: this.portfolio.dashboard(), positions: this.portfolio.detailedPositions({ page: 0, size: 100 }), movements: this.portfolio.movements(this.currentMovementQuery()) }).subscribe({
      next: value => { this.positions = value.positions.items.map(item => ({ assetId: item.assetId, brokerId: item.brokerId, quantity: item.quantity })); this.mustReconcile = false; this.reviewing = false; this.outcome = 'success'; this.message = 'Leituras reconciliadas com o backend. Revise os campos antes de qualquer novo envio.'; this.loadMovements(); },
      error: () => { this.outcome = 'refresh-failed'; this.message = 'Ainda não foi possível reconciliar as leituras. Nenhuma operação foi reenviada.'; }
    });
  }
  private refreshAfterConfirmation(): void { forkJoin({ dashboard: this.portfolio.dashboard(), positions: this.portfolio.detailedPositions({ page: 0, size: 100 }), movements: this.portfolio.movements(this.currentMovementQuery()) }).subscribe({
    next: value => { this.positions = value.positions.items.map(item => ({ assetId: item.assetId, brokerId: item.brokerId, quantity: item.quantity })); this.message = 'Registro simulado concluído e leituras confirmadas pelo backend.'; this.form.controls.quantity.reset(null); this.loadMovements(); },
    error: () => { this.outcome = 'refresh-failed'; this.mustReconcile = true; this.message = 'O registro foi confirmado, mas as leituras não puderam ser atualizadas. Reconcilie os dados; a operação não será reenviada.'; }
  }); }
  private handleMutationError(error: unknown): void { const parsed = parseApiError(error); this.fieldErrors = parsed.fields; this.reviewing = false;
    if (parsed.unknownOutcome || error instanceof TimeoutError) { this.outcome = 'unknown'; this.mustReconcile = true; this.message = 'O servidor não confirmou nem recusou o registro. Reconcilie posições e histórico antes de qualquer nova tentativa.'; return; }
    if (error instanceof HttpErrorResponse && error.status === 409) { this.outcome = 'conflict'; this.mustReconcile = true; this.message = 'Outra operação alterou os dados ao mesmo tempo. Recarregue as leituras antes de tentar novamente.'; return; }
    this.outcome = 'refused'; this.message = parsed.message;
  }
  private currentMovementQuery(): MovementQuery { return { page: this.page, size: this.size }; }
  private clearOutcome(): void { this.outcome = 'idle'; this.message = ''; this.fieldErrors = {}; }
}
