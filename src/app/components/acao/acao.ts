import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
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

@Component({ selector: 'app-acao', standalone: true,
  imports: [ReactiveFormsModule, AsyncRegionComponent, DateTimeValueComponent, EmptyStateComponent, ErrorSummaryComponent,
    PageHeaderComponent, ResponsiveDataListComponent, StatusBadgeComponent],
  templateUrl: './acao.html', styleUrl: './acao.css' })
export class AcaoComponent implements OnInit, OnDestroy {
  readonly facade = new AsyncReadFacade<Acao[]>();
  readonly form = new FormGroup({
    ticker: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    mercado: new FormControl<'BRASIL' | 'AMERICANO'>('BRASIL', { nonNullable: true, validators: [Validators.required] })
  });
  readonly search = new FormControl('', { nonNullable: true });
  salvando = false;
  atualizando = new Set<number>();
  mensagemErro = '';
  mensagemSucesso = '';
  errosCampos: Record<string, string> = {};
  constructor(private readonly service: AcaoService) {}
  ngOnInit(): void { this.load(); }
  ngOnDestroy(): void { this.facade.destroy(); }
  load(): void { this.facade.load(() => this.service.listar(), items => items.length === 0); }
  get acoes(): Acao[] { return stateData(this.facade.state()) ?? []; }
  get visibleActions(): Acao[] { const value = this.search.value.trim().toLocaleUpperCase('pt-BR'); return this.acoes.filter(item => !value || item.ticker.includes(value) || item.nomeEmpresa?.toLocaleUpperCase('pt-BR').includes(value)); }
  adicionarAcao(): void {
    if (this.salvando) return;
    this.clearMessages();
    const { ticker, mercado } = this.form.getRawValue();
    const normalized = ticker.trim().toLocaleUpperCase('pt-BR');
    const valid = mercado === 'BRASIL' ? /^[A-Z]{4}\d{1,2}$/.test(normalized) : /^[A-Z]{1,5}$/.test(normalized);
    if (!valid) { this.form.controls.ticker.setErrors({ canonical: true }); return; }
    this.salvando = true;
    this.service.salvar(normalized, mercado).pipe(finalize(() => this.salvando = false)).subscribe({
      next: () => { this.form.reset({ ticker: '', mercado }); this.mensagemSucesso = 'Ativo cadastrado no catálogo acadêmico.'; this.load(); },
      error: error => { const parsed = parseApiError(error); this.mensagemErro = parsed.message; this.errosCampos = parsed.fields; }
    });
  }
  atualizarPreco(id: number | undefined): void {
    if (!id || this.atualizando.has(id)) return;
    this.clearMessages(); this.atualizando.add(id);
    this.service.atualizarCotacao(id).pipe(finalize(() => this.atualizando.delete(id))).subscribe({
      next: () => { this.mensagemSucesso = 'Cotação atualizada e relida do backend.'; this.load(); },
      error: error => this.mensagemErro = parseApiError(error).message
    });
  }
  quoteText(action: Acao): string { return action.cotacaoAtual !== undefined && action.moeda
    ? formatMoney({ availability: 'AVAILABLE', value: action.cotacaoAtual, currency: action.moeda, reason: null }).text : 'Indisponível'; }
  private clearMessages(): void { this.mensagemErro = ''; this.mensagemSucesso = ''; this.errosCampos = {}; }
}
