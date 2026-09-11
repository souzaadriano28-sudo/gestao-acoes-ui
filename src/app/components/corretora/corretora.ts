import { ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import {
  BrokerAddressPreview,
  BrokerCnpjPreview,
  Corretora,
  CorretoraService,
  RegulatoryStatus
} from '../../services/corretora';
import { parseApiError } from '../../services/api-error';
import { AsyncReadFacade, stateData } from '../../shared/state/async-state';
import { AsyncRegionComponent } from '../../shared/components/async-region/async-region';
import { DateTimeValueComponent } from '../../shared/components/date-time-value/date-time-value';
import { ErrorSummaryComponent } from '../../shared/components/error-summary/error-summary';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header';
import { ResponsiveDataListComponent } from '../../shared/components/responsive-data-list/responsive-data-list';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge';

@Component({
  selector: 'app-corretora', standalone: true,
  imports: [ReactiveFormsModule, AsyncRegionComponent, DateTimeValueComponent, ErrorSummaryComponent, PageHeaderComponent,
    ResponsiveDataListComponent, StatusBadgeComponent], templateUrl: './corretora.html', styleUrl: './corretora.css'
})
export class CorretoraComponent implements OnInit, OnDestroy {
  @ViewChild('cepInput') cepInput?: ElementRef<HTMLInputElement>;
  readonly facade = new AsyncReadFacade<Corretora[]>();
  readonly form = new FormGroup({
    cnpj: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    cep: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    numero: new FormControl('', { nonNullable: true }),
    complemento: new FormControl('', { nonNullable: true })
  });
  empresa: BrokerCnpjPreview | null = null;
  endereco: BrokerAddressPreview | null = null;
  cnpjConsultado = '';
  cepConsultado = '';
  consultandoCnpj = false;
  consultandoCep = false;
  salvando = false;
  refreshingEvidence = false;
  mensagemErro = '';
  mensagemSucesso = '';
  erroCnpj = '';
  erroCep = '';
  erroCadastro = '';
  errosCampos: Record<string, string> = {};

  constructor(private readonly service: CorretoraService, private readonly cdr: ChangeDetectorRef) {}
  ngOnInit(): void { this.load(); }
  ngOnDestroy(): void { this.facade.destroy(); }
  load(): void { this.facade.load(() => this.service.listar(), items => items.length === 0); }
  get corretoras(): Corretora[] { return stateData(this.facade.state()) ?? []; }
  get canRefreshEvidence(): boolean { return this.corretoras.length > 0; }
  get podeConsultarCep(): boolean { return !!this.empresa?.autorizadaPelaCvm; }
  get podeCadastrar(): boolean {
    return !!this.empresa?.autorizadaPelaCvm && !!this.endereco
      && this.cnpjConsultado === digits(this.form.controls.cnpj.value)
      && this.cepConsultado === digits(this.form.controls.cep.value);
  }

  onCnpjInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const formatted = maskCnpj(input.value);
    this.form.controls.cnpj.setValue(formatted, { emitEvent: false });
    input.value = formatted;
    if (digits(formatted) !== this.cnpjConsultado) this.invalidateCompany();
  }

  consultarCnpj(): void {
    if (this.consultandoCnpj) return;
    this.clearFlowErrors();
    const cnpj = digits(this.form.controls.cnpj.value);
    if (cnpj.length !== 14) {
      this.form.controls.cnpj.setErrors({ format: true }); this.form.controls.cnpj.markAsTouched(); return;
    }
    this.consultandoCnpj = true;
    this.service.consultarCnpj(cnpj).pipe(finalize(() => { this.consultandoCnpj = false; this.cdr.markForCheck(); })).subscribe({
      next: preview => { this.empresa = preview; this.cnpjConsultado = cnpj; this.endereco = null; this.cepConsultado = ''; this.cdr.markForCheck(); },
      error: error => { const parsed = parseApiError(error); this.erroCnpj = parsed.message; this.errosCampos = parsed.fields; this.cdr.markForCheck(); }
    });
  }

  usarCepSugerido(): void {
    if (!this.empresa?.cepSugerido) return;
    const formatted = maskCep(this.empresa.cepSugerido);
    this.form.controls.cep.setValue(formatted);
    this.invalidateAddress();
    queueMicrotask(() => this.cepInput?.nativeElement.focus());
  }

  onCepInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const formatted = maskCep(input.value);
    this.form.controls.cep.setValue(formatted, { emitEvent: false });
    input.value = formatted;
    if (digits(formatted) !== this.cepConsultado) this.invalidateAddress();
  }

  consultarCep(): void {
    if (this.consultandoCep || !this.podeConsultarCep) return;
    this.erroCep = ''; this.erroCadastro = ''; this.mensagemSucesso = '';
    const cep = digits(this.form.controls.cep.value);
    if (cep.length !== 8) {
      this.form.controls.cep.setErrors({ format: true }); this.form.controls.cep.markAsTouched(); return;
    }
    this.consultandoCep = true;
    this.service.consultarCep(cep).pipe(finalize(() => { this.consultandoCep = false; this.cdr.markForCheck(); })).subscribe({
      next: preview => { this.endereco = preview; this.cepConsultado = cep; this.cdr.markForCheck(); },
      error: error => { const parsed = parseApiError(error); this.erroCep = parsed.message; this.errosCampos = parsed.fields; this.cdr.markForCheck(); }
    });
  }

  adicionarCorretora(): void {
    if (this.salvando || !this.podeCadastrar) return;
    this.erroCadastro = ''; this.mensagemSucesso = '';
    this.salvando = true; this.cdr.markForCheck();
    const raw = this.form.getRawValue();
    this.service.salvar({ cnpj: digits(raw.cnpj), cep: digits(raw.cep),
      ...(raw.numero.trim() ? { numero: raw.numero.trim() } : {}),
      ...(raw.complemento.trim() ? { complemento: raw.complemento.trim() } : {})
    }).pipe(finalize(() => { this.salvando = false; this.cdr.markForCheck(); })).subscribe({
      next: created => {
        this.facade.apply([...this.corretoras, created], items => items.length === 0);
        this.form.reset({ cnpj: '', cep: '', numero: '', complemento: '' });
        this.empresa = null; this.endereco = null; this.cnpjConsultado = ''; this.cepConsultado = '';
        this.mensagemSucesso = 'Corretora cadastrada com validação empresarial, regulatória e de endereço.';
        this.cdr.markForCheck();
      },
      error: error => { const parsed = parseApiError(error); this.erroCadastro = parsed.message; this.errosCampos = parsed.fields; this.cdr.markForCheck(); }
    });
  }

  refreshEvidence(): void {
    if (this.refreshingEvidence || !this.canRefreshEvidence) return;
    this.mensagemErro = ''; this.mensagemSucesso = ''; this.refreshingEvidence = true; this.cdr.markForCheck();
    this.service.atualizarEvidencias().pipe(finalize(() => { this.refreshingEvidence = false; this.cdr.markForCheck(); })).subscribe({
      next: () => { this.mensagemSucesso = 'Consulta regulatória concluída; evidências relidas.'; this.load(); this.cdr.markForCheck(); },
      error: error => { this.mensagemErro = parseApiError(error).message; this.cdr.markForCheck(); }
    });
  }

  formatCnpj(value: string): string { const item = digits(value); return item.length === 14 ? maskCnpj(item) : value; }
  formatCep(value: string): string { return maskCep(value); }
  evidenceLabel(status?: RegulatoryStatus): string {
    return ({ NOT_CHECKED: 'Não consultada', VERIFIED: 'Autorizada', NOT_FOUND: 'Não encontrada na fonte', INACTIVE: 'Registro inativo',
      INCOMPATIBLE: 'Categoria incompatível', STALE: 'Evidência desatualizada', UNAVAILABLE: 'Fonte indisponível' } as const)[status ?? 'NOT_CHECKED'];
  }
  evidenceTone(status?: RegulatoryStatus): 'positive' | 'warning' | 'neutral' {
    return status === 'VERIFIED' ? 'positive' : status === 'STALE' || status === 'UNAVAILABLE' || status === 'INACTIVE' ? 'warning' : 'neutral';
  }

  private invalidateCompany(): void {
    this.empresa = null; this.cnpjConsultado = ''; this.invalidateAddress(); this.erroCnpj = ''; this.erroCadastro = '';
  }
  private invalidateAddress(): void { this.endereco = null; this.cepConsultado = ''; this.erroCep = ''; this.erroCadastro = ''; }
  private clearFlowErrors(): void { this.erroCnpj = ''; this.erroCep = ''; this.erroCadastro = ''; this.errosCampos = {}; this.mensagemSucesso = ''; }
}

function digits(value: string): string { return value.replace(/\D/g, ''); }
function maskCnpj(value: string): string {
  const item = digits(value).slice(0, 14);
  return item.replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2}\.\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{2}\.\d{3}\.\d{3})(\d)/, '$1/$2').replace(/^(\d{2}\.\d{3}\.\d{3}\/\d{4})(\d)/, '$1-$2');
}
function maskCep(value: string): string { return digits(value).slice(0, 8).replace(/^(\d{5})(\d)/, '$1-$2'); }
