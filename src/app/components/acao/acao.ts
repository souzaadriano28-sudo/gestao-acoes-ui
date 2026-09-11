import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize, Subscription } from 'rxjs';
import { Acao, AcaoService } from '../../services/acao';
import { parseApiError } from '../../services/api-error';
import { AsyncReadFacade, stateData } from '../../shared/state/async-state';
import { AsyncRegionComponent } from '../../shared/components/async-region/async-region';
import { DateTimeValueComponent } from '../../shared/components/date-time-value/date-time-value';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state';
import { ErrorSummaryComponent } from '../../shared/components/error-summary/error-summary';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header';
import { ResponsiveDataListComponent } from '../../shared/components/responsive-data-list/responsive-data-list';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge';
import { formatMoney } from '../../shared/formatters/value-formatters';

const REQUEST_TIMEOUT_MS = 12_000;

@Component({ selector: 'app-acao', standalone: true,
  imports: [ReactiveFormsModule, AsyncRegionComponent, DateTimeValueComponent, EmptyStateComponent, ErrorSummaryComponent,
    PageHeaderComponent, ResponsiveDataListComponent, StatusBadgeComponent],
  templateUrl: './acao.html', styleUrl: './acao.css' })
export class AcaoComponent implements OnInit, OnDestroy {
  readonly facade = new AsyncReadFacade<Acao[]>();
  readonly form = new FormGroup({ ticker: new FormControl('', { nonNullable: true, validators: [Validators.required] }), mercado: new FormControl<'BRASIL' | 'AMERICANO'>('BRASIL', { nonNullable: true, validators: [Validators.required] }) });
  readonly search = new FormControl('', { nonNullable: true });
  salvando = false; consultando = false; previa: Acao | null = null; atualizando = new Set<number>();
  mensagemErro = ''; mensagemSucesso = ''; mensagemInfo = ''; errosCampos: Record<string, string> = {};
  private consulta?: Subscription; private salvar?: Subscription;
  private consultaTimeout?: ReturnType<typeof setTimeout>; private salvarTimeout?: ReturnType<typeof setTimeout>;
  private readonly atualizacoes = new Map<number, Subscription>();
  private readonly atualizacaoTimeouts = new Map<number, ReturnType<typeof setTimeout>>();
  private readonly errosAtualizacao = new Map<number, string>();
  private consultaId = 0; private salvarId = 0; private readonly atualizacaoIds = new Map<number, number>();

  constructor(private readonly service: AcaoService, private readonly changeDetector: ChangeDetectorRef) {}
  ngOnInit(): void { this.load(); }
  ngOnDestroy(): void { this.cancelarConsultaInterna(); ++this.salvarId; this.clearSalvarTimeout(); this.salvar?.unsubscribe(); this.atualizacoes.forEach(subscription => subscription.unsubscribe()); this.atualizacaoTimeouts.forEach(timeoutId => clearTimeout(timeoutId)); this.facade.destroy(); }
  load(): void { this.facade.load(() => this.service.listar(), items => items.length === 0); }
  get acoes(): Acao[] { return stateData(this.facade.state()) ?? []; }
  get visibleActions(): Acao[] { const value = this.search.value.trim().toLocaleUpperCase('pt-BR'); return this.acoes.filter(item => !value || item.ticker.includes(value) || item.nomeEmpresa?.toLocaleUpperCase('pt-BR').includes(value)); }

  consultarAtivo(): void {
    if (this.consultando || this.salvando) return;
    this.clearMessages(); this.previa = null;
    const { ticker, mercado } = this.form.getRawValue(); const normalized = ticker.trim().toLocaleUpperCase('pt-BR');
    this.form.controls.ticker.setValue(normalized, { emitEvent: false });
    const valid = mercado === 'BRASIL' ? /^[A-Z]{4}\d{1,2}$/.test(normalized) : /^[A-Z]{1,5}$/.test(normalized);
    if (!valid) { this.form.controls.ticker.setErrors({ canonical: true }); this.changeDetector.markForCheck(); return; }
    const requestId = ++this.consultaId; this.consultando = true; this.changeDetector.markForCheck();
    this.consultaTimeout = setTimeout(() => { if (requestId !== this.consultaId) return; ++this.consultaId; this.consulta?.unsubscribe(); this.consultando = false; this.mensagemErro = 'A consulta excedeu 12 segundos. Tente novamente.'; this.changeDetector.markForCheck(); }, REQUEST_TIMEOUT_MS);
    this.consulta = this.service.consultar(normalized, mercado).pipe(finalize(() => { if (requestId === this.consultaId) { this.clearConsultaTimeout(); this.consultando = false; this.changeDetector.markForCheck(); } })).subscribe({
      next: preview => { if (requestId === this.consultaId) { this.previa = preview; this.changeDetector.markForCheck(); } },
      error: error => { if (requestId === this.consultaId) { this.mensagemErro = parseApiError(error).message || 'Não foi possível consultar o ativo. Tente novamente.'; this.changeDetector.markForCheck(); } }
    });
  }
  cancelarConsulta(): void { this.cancelarConsultaInterna(); this.previa = null; this.mensagemInfo = 'Consulta cancelada. Nenhum ativo foi cadastrado.'; this.changeDetector.markForCheck(); }

  adicionarAcao(): void {
    if (this.salvando) return;
    this.clearMessages(); const { ticker, mercado } = this.form.getRawValue(); const normalized = ticker.trim().toLocaleUpperCase('pt-BR');
    if (this.previa?.ticker !== normalized || this.previa?.mercado !== mercado) { this.form.controls.ticker.setErrors({ canonical: true }); this.changeDetector.markForCheck(); return; }
    const requestId = ++this.salvarId; this.salvando = true; this.changeDetector.markForCheck();
    this.salvarTimeout = setTimeout(() => { if (requestId !== this.salvarId) return; ++this.salvarId; this.salvar?.unsubscribe(); this.salvando = false; this.mensagemErro = 'O cadastro excedeu 12 segundos. Tente novamente.'; this.changeDetector.markForCheck(); }, REQUEST_TIMEOUT_MS);
    this.salvar = this.service.salvar(normalized, mercado).pipe(finalize(() => { if (requestId === this.salvarId) { this.clearSalvarTimeout(); this.salvando = false; this.changeDetector.markForCheck(); } })).subscribe({
      next: created => { if (requestId !== this.salvarId) return; this.facade.apply([...this.acoes, created], items => items.length === 0); this.form.reset({ ticker: '', mercado }); this.previa = null; this.mensagemSucesso = 'Ativo cadastrado com dados de mercado validados.'; this.changeDetector.markForCheck(); },
      error: error => { if (requestId !== this.salvarId) return; const parsed = parseApiError(error); this.mensagemErro = parsed.message; this.errosCampos = parsed.fields; this.changeDetector.markForCheck(); }
    });
  }

  atualizarPreco(id: number | undefined): void {
    if (!id || this.atualizando.has(id)) return;
    const requestId = (this.atualizacaoIds.get(id) ?? 0) + 1; this.atualizacaoIds.set(id, requestId); this.errosAtualizacao.delete(id); this.atualizando.add(id); this.changeDetector.markForCheck();
    this.atualizacaoTimeouts.set(id, setTimeout(() => { if (requestId !== this.atualizacaoIds.get(id)) return; this.atualizacaoIds.set(id, requestId + 1); this.atualizacoes.get(id)?.unsubscribe(); this.atualizando.delete(id); this.errosAtualizacao.set(id, 'A atualização excedeu 12 segundos. Tente novamente.'); this.changeDetector.markForCheck(); }, REQUEST_TIMEOUT_MS));
    const subscription = this.service.atualizarCotacao(id).pipe(finalize(() => { if (requestId === this.atualizacaoIds.get(id)) { this.clearAtualizacaoTimeout(id); this.atualizando.delete(id); this.changeDetector.markForCheck(); } })).subscribe({
      next: updated => { if (requestId !== this.atualizacaoIds.get(id)) return; this.errosAtualizacao.delete(id); this.facade.apply(this.acoes.map(action => action.id === id ? updated : action), items => items.length === 0); this.changeDetector.markForCheck(); },
      error: error => { if (requestId !== this.atualizacaoIds.get(id)) return; this.errosAtualizacao.set(id, parseApiError(error).message); this.changeDetector.markForCheck(); }
    });
    this.atualizacoes.set(id, subscription);
  }

  erroAtualizacao(id: number | undefined): string { return id ? this.errosAtualizacao.get(id) ?? '' : ''; }
  quoteText(action: Acao): string { return action.cotacaoAtual !== undefined && action.moeda ? formatMoney({ availability: 'AVAILABLE', value: action.cotacaoAtual, currency: action.moeda, reason: null }).text : 'Indisponível'; }
  normalizarEIdentificarMercado(): void { const ticker = this.form.controls.ticker.value.trim().toLocaleUpperCase('pt-BR'); this.form.controls.ticker.setValue(ticker, { emitEvent: false }); if (/^[A-Z]{4}\d{1,2}$/.test(ticker)) this.form.controls.mercado.setValue('BRASIL', { emitEvent: false }); else if (/^[A-Z]{1,5}$/.test(ticker)) this.form.controls.mercado.setValue('AMERICANO', { emitEvent: false }); this.previa = null; this.clearMessages(); this.form.controls.ticker.setErrors(null); this.changeDetector.markForCheck(); }
  marketLabel(): string { const ticker = this.form.controls.ticker.value; return /^[A-Z]{4}\d{1,2}$/.test(ticker) ? 'Brasil (B3)' : /^[A-Z]{1,5}$/.test(ticker) ? 'Estados Unidos' : 'Aguardando ticker'; }
  invalidarPrevia(): void { this.previa = null; }
  private cancelarConsultaInterna(): void { ++this.consultaId; this.clearConsultaTimeout(); this.consulta?.unsubscribe(); this.consulta = undefined; this.consultando = false; }
  private clearConsultaTimeout(): void { if (this.consultaTimeout !== undefined) { clearTimeout(this.consultaTimeout); this.consultaTimeout = undefined; } }
  private clearSalvarTimeout(): void { if (this.salvarTimeout !== undefined) { clearTimeout(this.salvarTimeout); this.salvarTimeout = undefined; } }
  private clearAtualizacaoTimeout(id: number): void { const timeoutId = this.atualizacaoTimeouts.get(id); if (timeoutId !== undefined) clearTimeout(timeoutId); this.atualizacaoTimeouts.delete(id); }
  private clearMessages(): void { this.mensagemErro = ''; this.mensagemSucesso = ''; this.mensagemInfo = ''; this.errosCampos = {}; }
}
