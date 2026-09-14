import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { forkJoin, finalize, Subscription, timeout, TimeoutError } from 'rxjs';
import { PortfolioReadService } from '../../core/portfolio/portfolio-read.service';
import { Acao, AcaoService } from '../../services/acao';
import { parseApiError } from '../../services/api-error';
import { OperacaoService, OperationDTO, OperationHistoryQuery, OperationPreviewDTO, OperationRequestDTO, OperationType } from '../../services/operacao';
import { Corretora, CorretoraService } from '../../services/corretora';
import { AsyncReadFacade, stateData } from '../../shared/state/async-state';
import { AsyncRegionComponent } from '../../shared/components/async-region/async-region';
import { CurrencyValueComponent } from '../../shared/components/currency-value/currency-value';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header';
import { formatDateTime } from '../../shared/formatters/value-formatters';

type OperationOutcome = 'idle' | 'success' | 'refused' | 'conflict' | 'unknown' | 'refresh-failed';

@Component({ selector: 'app-operacoes', standalone: true,
  imports: [ReactiveFormsModule, AsyncRegionComponent, CurrencyValueComponent, PageHeaderComponent],
  templateUrl: './operacoes.html', styleUrl: './operacoes.css' })
export class OperacoesComponent implements OnInit, OnDestroy {
  readonly operationsFacade = new AsyncReadFacade<OperationDTO[]>();
  readonly form = new FormGroup({
    type: new FormControl<OperationType>('COMPRA', { nonNullable: true }), assetId: new FormControl<number | ''>('', { nonNullable: true, validators: [Validators.required] }), brokerId: new FormControl<number | ''>('', { nonNullable: true, validators: [Validators.required] }),
    quantity: new FormControl<number | null>(null, { validators: [Validators.required, Validators.min(1), Validators.max(2147483647), Validators.pattern(/^\d+$/)] }), dateTime: new FormControl(new Date().toISOString().slice(0, 16), { nonNullable: true, validators: [Validators.required] }), unitPrice: new FormControl<string | number>('', { nonNullable: true, validators: [decimalInput(true)] }),
    brokerage: new FormControl<string | number>('0', { nonNullable: true, validators: [decimalInput(false)] }), fees: new FormControl<string | number>('0', { nonNullable: true, validators: [decimalInput(false)] }), taxes: new FormControl<string | number>('0', { nonNullable: true, validators: [decimalInput(false)] }), otherCosts: new FormControl<string | number>('0', { nonNullable: true, validators: [decimalInput(false)] }), note: new FormControl('', { nonNullable: true })
  });
  readonly filters = new FormGroup({ type: new FormControl<OperationType | ''>('', { nonNullable: true }), ticker: new FormControl('', { nonNullable: true }), brokerId: new FormControl<number | ''>('', { nonNullable: true }), from: new FormControl('', { nonNullable: true }), to: new FormControl('', { nonNullable: true }) });
  assets: Acao[] = []; brokers: Corretora[] = []; choicesLoading = true; choicesError = '';
  reviewing = false; pending = false; mustReconcile = false; filtersExpanded = false; costsExpanded = false; modalOpen = false; detailId?: number; editing?: OperationDTO; deleteConfirmationId?: number; pendingRowId?: number; rowErrors: Record<number, string> = {}; quoteInfo = ''; quoteTimeoutMs = 12_000; private quotedAssetId?: number; private priceDirty = false; private quoteRevision = 0; private modalOrigin?: HTMLElement;
  outcome: OperationOutcome = 'idle'; message = ''; modalError = ''; fieldErrors: Record<string, string> = {}; preview?: OperationPreviewDTO;
  private submissionKey = ''; private positions: { assetId: number; brokerId: number; quantity: number }[] = []; private previewRevision = 0; private previewRequestActive = false; private readonly formChanges: Subscription;

  constructor(private readonly portfolio: PortfolioReadService, private readonly operations: OperacaoService, private readonly assetsService: AcaoService, private readonly brokersService: CorretoraService, private readonly changeDetector: ChangeDetectorRef) {
    this.formChanges = this.form.valueChanges.subscribe(() => {
      if (this.modalError) this.modalError = '';
      if (this.reviewing || this.previewRequestActive) { this.previewRevision++; this.preview = undefined; this.reviewing = false; this.previewRequestActive = false; this.changeDetector.markForCheck(); }
      const asset = this.selectedAsset; if (!this.editing && !asset) { this.quoteRevision++; this.quotedAssetId = undefined; this.quoteInfo = ''; } else if (!this.editing && asset?.id && this.quotedAssetId !== asset.id) { this.quotedAssetId = asset.id; this.quoteRevision++; this.loadQuote(asset, this.quoteRevision); }
    });
  }
  ngOnInit(): void { this.loadChoices(); this.loadOperations(); this.loadPositions(); }
  ngOnDestroy(): void { this.formChanges.unsubscribe(); this.operationsFacade.destroy(); }
  get history(): OperationDTO[] | undefined { return stateData(this.operationsFacade.state()); }
  get selectedAsset(): Acao | undefined { return this.assets.find(item => item.id === Number(this.form.controls.assetId.value)); }
  get selectedBroker(): Corretora | undefined { return this.brokers.find(item => item.id === Number(this.form.controls.brokerId.value)); }
  get activeFilterCount(): number { return Object.values(this.filters.getRawValue()).filter(Boolean).length; }
  get formTitle(): string { return this.editing ? 'Editar registro' : 'Registrar operação'; }
  operationDateTime(value: string | null): string { return formatDateTime(value).text.replace(',', ''); }
  isRowPending(id: number): boolean { return this.pendingRowId === id; }
  totalCosts(operation: OperationDTO): number { return operation.corretagem + operation.taxas + operation.impostos + operation.outrosCustos; }
  money(value: number | string | null | undefined, currency: string | undefined) { return { availability: 'AVAILABLE' as const, value: value === null || value === undefined || value === '' ? null : Number(value), currency: currency ?? 'BRL', reason: null }; }
  markPriceDirty(): void { this.priceDirty = true; }
  blockDecimalNotation(event: KeyboardEvent): void { if (['e', 'E', '+', '-'].includes(event.key)) event.preventDefault(); }
  fieldValidation(controlName: 'unitPrice' | 'brokerage' | 'fees' | 'taxes' | 'otherCosts'): string { const control = this.form.controls[controlName]; return control.touched && control.invalid ? (controlName === 'unitPrice' ? 'Informe um preço decimal maior que zero.' : 'Informe custo decimal igual ou maior que zero.') : ''; }
  get hasOptionalData(): boolean { const v=this.form.getRawValue(); return !!([v.brokerage, v.fees, v.taxes, v.otherCosts].some(value => !isZeroDecimal(value)) || v.note.trim()); }

  loadChoices(): void { this.choicesLoading = true; this.choicesError = ''; this.changeDetector.markForCheck(); forkJoin({ assets: this.assetsService.listar(), brokers: this.brokersService.listar() }).pipe(finalize(() => { this.choicesLoading = false; this.changeDetector.markForCheck(); })).subscribe({ next: value => { this.assets = value.assets; this.brokers = value.brokers; this.changeDetector.markForCheck(); }, error: error => { this.choicesError = parseApiError(error).message; this.changeDetector.markForCheck(); } }); }
  loadPositions(): void { this.portfolio.detailedPositions({ page: 0, size: 100 }).subscribe({ next: page => { this.positions = page.items.map(item => ({ assetId: item.assetId, brokerId: item.brokerId, quantity: item.quantity })); this.changeDetector.markForCheck(); }, error: () => undefined }); }
  loadOperations(): void { this.operationsFacade.load(() => this.operations.list(this.currentOperationQuery()), entries => entries.length === 0); this.changeDetector.markForCheck(); }
  applyFilters(): void { this.loadOperations(); }
  clearFilters(): void { this.filters.reset({ type: '', ticker: '', brokerId: '', from: '', to: '' }); this.loadOperations(); }
  toggleFilters(): void { this.filtersExpanded = !this.filtersExpanded; }
  toggleDetails(id: number): void { this.detailId = this.detailId === id ? undefined : id; this.changeDetector.markForCheck(); }
  @HostListener('document:keydown.escape') closeDetailsOnEscape(): void { this.detailId = undefined; }
  openCreate(event?: Event): void { this.cancelEdit(); this.modalOrigin = event?.currentTarget as HTMLElement | undefined; this.modalOpen = true; this.focusModal(); }
  closeModal(): void { if (this.pending) return; this.modalError = ''; this.cancelEdit(); this.modalOpen = false; this.modalOrigin?.focus(); this.modalOrigin = undefined; }
  onModalKeydown(event: KeyboardEvent): void { if (event.key === 'Escape') { event.preventDefault(); this.closeModal(); return; } if (event.key !== 'Tab') return; const nodes = Array.from((event.currentTarget as HTMLElement).querySelectorAll<HTMLElement>('button:not([disabled]),input:not([disabled]),select:not([disabled]),summary,[href]')); if (!nodes.length) return; const first = nodes[0], last = nodes[nodes.length - 1]; if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); } }

  beginEdit(operation: OperationDTO): void {
    if (this.pending || this.pendingRowId !== undefined) return;
    this.previewRevision++; this.preview = undefined; this.reviewing = false; this.editing = operation; this.clearOutcome();
    this.quoteRevision++; this.form.reset({ type: operation.tipo, assetId: operation.ativoId, brokerId: operation.corretoraId, quantity: operation.quantidade, dateTime: operation.dataHora, unitPrice: operation.precoUnitario, brokerage: operation.corretagem, fees: operation.taxas, taxes: operation.impostos, otherCosts: operation.outrosCustos, note: operation.observacao ?? '' });
    this.costsExpanded = this.hasOptionalData; this.modalOpen = true; this.form.markAsPristine(); this.changeDetector.markForCheck(); this.focusModal();
  }
  cancelEdit(): void { if (this.pending) return; this.editing = undefined; this.preview = undefined; this.reviewing = false; this.previewRevision++; this.quoteRevision++; this.quotedAssetId = undefined; this.priceDirty = false; this.clearOutcome(); this.form.reset(newOperationForm()); this.changeDetector.markForCheck(); }
  review(): void {
    this.clearOutcome(); this.modalError = ''; this.form.markAllAsTouched(); if (this.form.invalid || !this.selectedAsset || !this.selectedBroker) { this.modalError = 'Revise os campos destacados antes de continuar.'; return; }
    if (!this.editing) this.submissionKey = crypto.randomUUID(); this.pending = true; this.previewRequestActive = true; const revision = ++this.previewRevision; const call = this.editing ? this.operations.previewUpdate(this.editing.id, this.payload()) : this.operations.preview(this.payload());
    call.pipe(timeout({ first: 12_000 }), finalize(() => { this.previewRequestActive = false; this.pending = false; this.changeDetector.markForCheck(); })).subscribe({ next: value => { if (revision !== this.previewRevision) return; this.preview = value; this.reviewing = true; this.changeDetector.markForCheck(); }, error: error => { if (revision === this.previewRevision) this.handleMutationError(error, 'preview'); } });
  }
  cancelReview(): void { if (!this.pending) { this.previewRevision++; this.preview = undefined; this.reviewing = false; this.changeDetector.markForCheck(); } }
  confirm(): void {
    if (this.pending || this.mustReconcile || !this.reviewing || this.form.invalid || !this.selectedAsset || !this.selectedBroker?.id) return;
    this.pending = true; this.form.disable({ emitEvent: false }); this.clearOutcome(); this.modalError = ''; const request = this.editing ? this.operations.update(this.editing.id, this.payload()) : this.operations.create(this.payload());
    request.pipe(timeout({ first: 12_000 }), finalize(() => { this.pending = false; this.form.enable({ emitEvent: false }); this.changeDetector.markForCheck(); })).subscribe({ next: value => { if (this.editing) { this.replaceHistory(value); this.editing = undefined; this.preview = undefined; this.reviewing = false; this.message = 'Registro editado e confirmado pelo backend.'; this.loadPositions(); this.resetNewForm(); } else { this.outcome = 'success'; this.message = 'Registro histórico confirmado pelo backend. Atualizando as leituras confirmadas…'; this.reviewing = false; this.refreshAfterConfirmation(); } }, error: error => this.handleMutationError(error, 'confirmation') });
  }
  requestDelete(id: number): void { if (this.pending || this.pendingRowId !== undefined) return; this.deleteConfirmationId = id; delete this.rowErrors[id]; this.changeDetector.markForCheck(); }
  cancelDelete(id: number): void { if (this.deleteConfirmationId === id && !this.isRowPending(id)) { this.deleteConfirmationId = undefined; this.changeDetector.markForCheck(); } }
  confirmDelete(id: number): void {
    if (this.deleteConfirmationId !== id || this.isRowPending(id)) return;
    this.pendingRowId = id; delete this.rowErrors[id]; const token = ++this.previewRevision;
    this.operations.delete(id).pipe(timeout({ first: 12_000 }), finalize(() => { if (this.pendingRowId === id) { this.pendingRowId = undefined; this.changeDetector.markForCheck(); } })).subscribe({ next: () => { if (token !== this.previewRevision) return; const existing = this.history ?? []; this.operationsFacade.apply(existing.filter(item => item.id !== id), entries => entries.length === 0); this.deleteConfirmationId = undefined; this.loadPositions(); this.changeDetector.markForCheck(); }, error: error => { if (token !== this.previewRevision) return; this.rowErrors[id] = parseApiError(error).message; this.deleteConfirmationId = undefined; this.changeDetector.markForCheck(); } });
  }
  reconcile(): void { this.message = 'Reconciliando posições e histórico antes de permitir nova tentativa…'; forkJoin({ dashboard: this.portfolio.dashboard(), positions: this.portfolio.detailedPositions({ page: 0, size: 100 }), operations: this.operations.list(this.currentOperationQuery()) }).subscribe({ next: value => { this.positions = value.positions.items.map(item => ({ assetId: item.assetId, brokerId: item.brokerId, quantity: item.quantity })); this.operationsFacade.apply(value.operations, entries => entries.length === 0); this.mustReconcile = false; this.reviewing = false; this.outcome = 'success'; this.message = 'Leituras reconciliadas com o backend. Revise os campos antes de qualquer novo envio.'; this.changeDetector.markForCheck(); }, error: () => { this.outcome = 'refresh-failed'; this.message = 'Ainda não foi possível reconciliar as leituras. Nenhuma operação foi reenviada.'; this.changeDetector.markForCheck(); } }); }

  private refreshAfterConfirmation(): void { forkJoin({ dashboard: this.portfolio.dashboard(), positions: this.portfolio.detailedPositions({ page: 0, size: 100 }), operations: this.operations.list(this.currentOperationQuery()) }).subscribe({ next: value => { this.positions = value.positions.items.map(item => ({ assetId: item.assetId, brokerId: item.brokerId, quantity: item.quantity })); this.operationsFacade.apply(value.operations, entries => entries.length === 0); this.message = 'Registro histórico concluído e leituras confirmadas pelo backend.'; this.resetNewForm(); this.changeDetector.markForCheck(); }, error: () => { this.outcome = 'refresh-failed'; this.mustReconcile = true; this.message = 'O registro foi confirmado, mas as leituras não puderam ser atualizadas. Reconcilie os dados; a operação não será reenviada.'; this.changeDetector.markForCheck(); } }); }
  private loadQuote(asset: Acao, revision: number): void { this.quoteInfo = 'Consultando cotação…'; this.changeDetector.markForCheck(); this.assetsService.consultar(asset.ticker, asset.mercado).pipe(timeout({ first: this.quoteTimeoutMs })).subscribe({ next: quote => { if (revision !== this.quoteRevision || this.editing || this.selectedAsset?.id !== asset.id) return; if (!this.priceDirty && this.form.controls.unitPrice.pristine && quote.cotacaoAtual !== undefined && quote.cotacaoAtual !== null) this.form.controls.unitPrice.setValue(this.quotePrice(quote.cotacaoAtual)); this.quoteInfo = quote.quoteProvider ? `${this.quoteLabel(quote.quoteProvider, quote.quoteReferenceAt)} · Ajuste para o preço negociado.` : 'Cotação sugerida. Ajuste para o preço negociado.'; this.changeDetector.markForCheck(); }, error: () => { if (revision !== this.quoteRevision || this.editing || this.selectedAsset?.id !== asset.id) return; this.quoteInfo = 'Cotação indisponível. Informe o preço negociado.'; this.changeDetector.markForCheck(); } }); }
  private quotePrice(value: number): string { const [integer, fraction = ''] = String(value).split('.'); return `${integer}.${(fraction + '00').slice(0, 2)}`; }
  private quoteLabel(provider: string, referenceAt?: string | null): string { if (!referenceAt) return provider; const reference = new Date(referenceAt); if (Number.isNaN(reference.getTime())) return provider; return `${provider} · ${new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'America/Sao_Paulo', timeZoneName: 'short' }).format(reference).replace(',', '')}`; }
  private replaceHistory(updated: OperationDTO): void { const existing = this.history ?? []; this.operationsFacade.apply(existing.map(item => item.id === updated.id ? updated : item), entries => entries.length === 0); }
  private resetNewForm(): void { this.quoteRevision++; this.quotedAssetId = undefined; this.priceDirty = false; this.form.reset(newOperationForm()); }
  private handleMutationError(error: unknown, context: 'preview' | 'confirmation'): void { const parsed = parseApiError(error); this.fieldErrors = parsed.fields; if (context === 'preview') this.reviewing = false; const body = error instanceof HttpErrorResponse && error.error && typeof error.error === 'object' ? error.error as { code?: string; message?: string } : undefined; const insufficientPosition = body?.code === 'INSUFFICIENT_POSITION' || body?.message === 'A operação produz posição negativa na ordem cronológica.'; let message = insufficientPosition ? 'Você não possui ações suficientes nessa corretora.' : parsed.message; if (parsed.unknownOutcome || error instanceof TimeoutError) { this.outcome = 'unknown'; this.mustReconcile = true; message = 'O servidor não confirmou nem recusou o registro. Reconcilie as leituras antes de tentar novamente.'; } else if (error instanceof HttpErrorResponse && error.status === 409) { this.outcome = 'conflict'; this.mustReconcile = true; message = 'Outra operação alterou os dados ao mesmo tempo. Recarregue as leituras antes de tentar novamente.'; } else this.outcome = 'refused'; if (this.modalOpen) { this.modalError = message; return; } this.message = message; }
  private currentOperationQuery(): OperationHistoryQuery { const raw = this.filters.getRawValue(); const query: OperationHistoryQuery = {}; if (raw.type) query.tipo = raw.type; if (raw.ticker.trim()) query.ticker = raw.ticker.trim().toLocaleUpperCase('pt-BR'); if (raw.brokerId) query.corretoraId = raw.brokerId; if (raw.from) query.de = `${raw.from}T00:00:00`; if (raw.to) query.ate = `${raw.to}T23:59:59`; return query; }
  private payload(): OperationRequestDTO { const a = this.selectedAsset!; return { tipo: this.form.controls.type.value, ativoId: a.id!, corretoraId: this.selectedBroker!.id!, dataHora: this.form.controls.dateTime.value, quantidade: this.form.controls.quantity.value!, moeda: a.moeda!, precoUnitario: decimalPayload(this.form.controls.unitPrice.value), corretagem: decimalPayload(this.form.controls.brokerage.value), taxas: decimalPayload(this.form.controls.fees.value), impostos: decimalPayload(this.form.controls.taxes.value), outrosCustos: decimalPayload(this.form.controls.otherCosts.value), observacao: this.form.controls.note.value || undefined, idempotencyKey: this.editing ? undefined : this.submissionKey }; }
  private clearOutcome(): void { this.outcome = 'idle'; this.message = ''; this.fieldErrors = {}; }
  private focusModal(): void { setTimeout(() => document.querySelector<HTMLElement>('.operation-modal [autofocus]')?.focus()); }
}

function decimalInput(positive: boolean): ValidatorFn { return (control: AbstractControl<string | number>): ValidationErrors | null => { const value = String(control.value).trim(); if (!value) return positive ? { required: true } : null; if (!/^\d+(?:[.,]\d+)?$/.test(value)) return { decimal: true }; return positive && isZeroDecimal(value) ? { positive: true } : null; }; }
function isZeroDecimal(value: string | number): boolean { return /^0*(?:[.,]0*)?$/.test(String(value).trim()); }
function decimalPayload(value: string | number): string { return String(value).trim().replace(',', '.'); }
function newOperationForm() { return { type: 'COMPRA' as OperationType, assetId: '' as const, brokerId: '' as const, quantity: null, dateTime: new Date().toISOString().slice(0, 16), unitPrice: '', brokerage: '0', fees: '0', taxes: '0', otherCosts: '0', note: '' }; }
