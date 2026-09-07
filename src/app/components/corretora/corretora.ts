import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { Corretora, CorretoraService, RegulatoryStatus } from '../../services/corretora';
import { parseApiError } from '../../services/api-error';
import { AsyncReadFacade, stateData } from '../../shared/state/async-state';
import { AsyncRegionComponent } from '../../shared/components/async-region/async-region';
import { DateTimeValueComponent } from '../../shared/components/date-time-value/date-time-value';
import { ErrorSummaryComponent } from '../../shared/components/error-summary/error-summary';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header';
import { ResponsiveDataListComponent } from '../../shared/components/responsive-data-list/responsive-data-list';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge';

@Component({ selector: 'app-corretora', standalone: true,
  imports: [ReactiveFormsModule, AsyncRegionComponent, DateTimeValueComponent, ErrorSummaryComponent, PageHeaderComponent,
    ResponsiveDataListComponent, StatusBadgeComponent], templateUrl: './corretora.html', styleUrl: './corretora.css' })
export class CorretoraComponent implements OnInit, OnDestroy {
  readonly facade = new AsyncReadFacade<Corretora[]>();
  readonly form = new FormGroup({ cnpj: new FormControl('', { nonNullable: true, validators: [Validators.required] }), cep: new FormControl('', { nonNullable: true, validators: [Validators.required] }) });
  salvando = false; refreshingEvidence = false; mensagemErro = ''; mensagemSucesso = ''; errosCampos: Record<string, string> = {};
  constructor(private readonly service: CorretoraService) {}
  ngOnInit(): void { this.load(); }
  ngOnDestroy(): void { this.facade.destroy(); }
  load(): void { this.facade.load(() => this.service.listar(), items => items.length === 0); }
  get corretoras(): Corretora[] { return stateData(this.facade.state()) ?? []; }
  adicionarCorretora(): void {
    if (this.salvando) return; this.clearMessages();
    const cnpj = digits(this.form.controls.cnpj.value); const cep = digits(this.form.controls.cep.value);
    if (cnpj.length !== 14) this.form.controls.cnpj.setErrors({ format: true });
    if (cep.length !== 8) this.form.controls.cep.setErrors({ format: true });
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.salvando = true;
    this.service.salvar(cnpj, cep).pipe(finalize(() => this.salvando = false)).subscribe({
      next: () => { this.form.reset({ cnpj: '', cep: '' }); this.mensagemSucesso = 'Corretora cadastrada para uso acadêmico.'; this.load(); },
      error: error => { const parsed = parseApiError(error); this.mensagemErro = parsed.message; this.errosCampos = parsed.fields; }
    });
  }
  refreshEvidence(): void {
    if (this.refreshingEvidence) return; this.clearMessages(); this.refreshingEvidence = true;
    this.service.atualizarEvidencias().pipe(finalize(() => this.refreshingEvidence = false)).subscribe({
      next: () => { this.mensagemSucesso = 'Consulta regulatória concluída; evidências relidas.'; this.load(); },
      error: error => this.mensagemErro = parseApiError(error).message
    });
  }
  formatCnpj(value: string): string { const item = digits(value); return item.length === 14 ? item.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5') : value; }
  evidenceLabel(status?: RegulatoryStatus): string { return ({ NOT_CHECKED: 'Não consultada', VERIFIED: 'Evidência encontrada', NOT_FOUND: 'Não encontrada na fonte', STALE: 'Evidência desatualizada', UNAVAILABLE: 'Fonte indisponível' } as const)[status ?? 'NOT_CHECKED']; }
  evidenceTone(status?: RegulatoryStatus): 'positive' | 'warning' | 'neutral' { return status === 'VERIFIED' ? 'positive' : status === 'STALE' || status === 'UNAVAILABLE' ? 'warning' : 'neutral'; }
  private clearMessages(): void { this.mensagemErro = ''; this.mensagemSucesso = ''; this.errosCampos = {}; }
}
function digits(value: string): string { return value.replace(/\D/g, ''); }
