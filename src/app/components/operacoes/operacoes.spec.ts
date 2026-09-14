import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Observable } from 'rxjs';
import { vi } from 'vitest';
import { OperacoesComponent } from './operacoes';
import { OperacaoService } from '../../services/operacao';

describe('OperacoesComponent', () => {
  let fixture: ComponentFixture<OperacoesComponent>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OperacoesComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    fixture = TestBed.createComponent(OperacoesComponent);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); http.verify({ ignoreCancelled: true }); });

  function operation(overrides: Record<string, unknown> = {}) {
    return { id: 11, tipo: 'VENDA', ativoId: 1, ticker: 'PETR4', corretoraId: 7,
      corretora: 'Corretora com nome muito longo para teste', quantidade: 2, moeda: 'BRL',
      precoUnitario: 12.5, corretagem: .5, taxas: 0, impostos: 0, outrosCustos: 0,
      valorBruto: 25, valorTotal: 24.5, resultadoRealizado: 4.5,
      dataHora: '2026-09-12T10:30:00', observacao: 'nota', ...overrides };
  }
  function preview(overrides: Record<string, unknown> = {}) {
    return { quantidadeAnterior: 4, precoMedioAnterior: 10, custoAnterior: 40,
      valorBruto: 25, custos: .5, valorTotal: 24.5, quantidadeProjetada: 2,
      precoMedioProjetado: 10, custoProjetado: 20, resultadoRealizadoProjetado: 4.5, moeda: 'BRL', ...overrides };
  }
  function start(twoAssets = false): void {
    fixture.detectChanges();
    http.expectOne('/api/acoes').flush([
      { id: 1, ticker: 'PETR4', mercado: 'BRASIL', moeda: 'BRL' },
      ...(twoAssets ? [{ id: 2, ticker: 'AAPL', mercado: 'AMERICANO', moeda: 'USD' }] : [])
    ]);
    http.expectOne('/api/corretoras').flush([{ id: 7, razaoSocial: 'Corretora com nome muito longo para teste' }]);
    http.expectOne(request => request.url === '/api/operacoes').flush([operation()]);
    http.expectOne(request => request.url === '/api/carteira/posicoes/detalhadas').flush({ items: [], page: 0, size: 100, totalElements: 0, totalPages: 0 });
    fixture.detectChanges();
  }
  function selectAsset(id = 1): void {
    fixture.componentInstance.openCreate();
    fixture.componentInstance.form.controls.assetId.setValue(id);
    fixture.detectChanges();
  }

  function fillModalForPreview(type: 'COMPRA' | 'VENDA' = 'COMPRA'): void {
    const component = fixture.componentInstance;
    component.openCreate();
    component.form.patchValue({ type, assetId: 1, brokerId: 7, quantity: 2, unitPrice: '12.50' });
    http.expectOne(request => request.url === '/api/acoes/consulta').flush({ cotacaoAtual: 12.5, quoteProvider: 'BRAPI' });
    component.markPriceDirty();
  }

  it('inicia sem formulário e abre modal acessível', () => {
    start(); const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('.operation-modal')).toBeNull();
    fixture.componentInstance.openCreate(); fixture.detectChanges();
    expect(root.querySelector('[role="dialog"]')).toBeTruthy();
  });

  it('restaura o foco ao botão de origem ao fechar o modal', () => {
    start(); const root = fixture.nativeElement as HTMLElement;
    const addButton = root.querySelector('app-page-header button') as HTMLButtonElement;
    addButton.click(); fixture.detectChanges();
    fixture.componentInstance.closeModal(); fixture.detectChanges();
    expect(document.activeElement).toBe(addButton);
  });

  it('mantém período oculto e Atualizar no cabeçalho do card', () => {
    start(); const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('input[type="date"]')).toBeNull();
    expect(root.querySelector('.card-header')?.textContent).toContain('Atualizar');
  });

  it('fecha a expansão inicialmente e abre detalhes na própria linha pelo chevron', () => {
    start(); const root = fixture.nativeElement as HTMLElement;
    const chevron = root.querySelector('[aria-label="Ver detalhes da operação"]') as HTMLButtonElement;
    expect(chevron.getAttribute('aria-expanded')).toBe('false');
    chevron.click(); fixture.detectChanges();
    expect(chevron.getAttribute('aria-expanded')).toBe('true');
    expect(root.querySelector('.detail-row td')?.getAttribute('colspan')).toBe('7');
    expect(root.querySelector('.detail-row')?.textContent).toContain('Resultado realizado');
  });

  it('fecha detalhes com Escape e não mostra resultado na grade principal', () => {
    start(); const root = fixture.nativeElement as HTMLElement;
    (root.querySelector('[aria-label="Ver detalhes da operação"]') as HTMLButtonElement).click(); fixture.detectChanges();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); fixture.detectChanges();
    expect(root.querySelector('.detail-row')).toBeNull();
    expect(Array.from(root.querySelectorAll('thead th')).map(header => header.textContent?.trim())).not.toContain('Resultado');
    expect(root.textContent).not.toContain('Mais ações');
  });

  it('abre edição e exclusão a partir dos detalhes, preservando preço histórico', () => {
    start(); const root = fixture.nativeElement as HTMLElement;
    (root.querySelector('[aria-label="Ver detalhes da operação"]') as HTMLButtonElement).click(); fixture.detectChanges();
    (Array.from(root.querySelectorAll('.detail-actions button')).find(button => button.textContent === 'Editar') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(fixture.componentInstance.modalOpen).toBe(true);
    expect(fixture.componentInstance.form.controls.unitPrice.value).toBe(12.5);
    fixture.componentInstance.closeModal();
    fixture.componentInstance.requestDelete(11); fixture.detectChanges();
    expect(root.querySelector('[role="alertdialog"]')).toBeTruthy();
  });

  it('preenche preço negociado com duas casas e encerra o loading da cotação', () => {
    start(); selectAsset();
    expect(fixture.componentInstance.quoteInfo).toBe('Consultando cotação…');
    http.expectOne(request => request.url === '/api/acoes/consulta').flush({ cotacaoAtual: 49.12, quoteProvider: 'BRAPI', quoteReferenceAt: '2026-09-12T22:06:00Z' });
    fixture.detectChanges();
    expect(fixture.componentInstance.form.controls.unitPrice.value).toBe('49.12');
    expect(fixture.componentInstance.quoteInfo).toContain('BRAPI · 12/09/2026 19:06:00 BRT');
    expect(fixture.componentInstance.quoteInfo).toContain('Ajuste para o preço negociado.');
    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain('Consultando cotação…');
  });

  it('mantém o preenchimento manual após erro ou timeout da cotação', () => {
    start(); selectAsset();
    http.expectOne(request => request.url === '/api/acoes/consulta').flush('erro', { status: 500, statusText: 'Erro' });
    fixture.componentInstance.form.controls.unitPrice.setValue('31.40');
    expect(fixture.componentInstance.quoteInfo).toContain('Informe o preço negociado.');
    expect(fixture.componentInstance.form.controls.unitPrice.value).toBe('31.40');
  });

  it('encerra feedback de cotação em timeout e mantém o campo manual', async () => {
    start();
    fixture.componentInstance.quoteTimeoutMs = 1;
    fixture.componentInstance.form.controls.assetId.setValue('');
    fixture.componentInstance.form.controls.assetId.setValue(1);
    http.expectOne(request => request.url === '/api/acoes/consulta');
    await new Promise(resolve => setTimeout(resolve, 15)); fixture.detectChanges();
    expect(fixture.componentInstance.quoteInfo).toContain('Informe o preço negociado.');
  });

  it('ignora cotação tardia e de ativo anterior sem sobrescrever preço manual', () => {
    start(true); selectAsset(1);
    const petr = http.expectOne(request => request.url === '/api/acoes/consulta');
    fixture.componentInstance.form.controls.assetId.setValue(2);
    const aapl = http.expectOne(request => request.url === '/api/acoes/consulta');
    petr.flush({ cotacaoAtual: 49.12, quoteProvider: 'BRAPI' });
    fixture.componentInstance.form.controls.unitPrice.setValue('190.50');
    fixture.componentInstance.markPriceDirty();
    aapl.flush({ cotacaoAtual: 191, quoteProvider: 'BRAPI' }); fixture.detectChanges();
    expect(fixture.componentInstance.form.controls.unitPrice.value).toBe('190.50');
  });

  it('preserva preço histórico no modo edição sem consultar cotação', () => {
    start(); fixture.componentInstance.beginEdit(operation() as any); fixture.detectChanges();
    expect(fixture.componentInstance.form.controls.unitPrice.value).toBe(12.5);
    http.expectNone(request => request.url === '/api/acoes/consulta');
  });

  it('mostra revisão com dados anteriores e projetados entregues pelo DTO', () => {
    start(); fixture.componentInstance.openCreate();
    fixture.componentInstance.form.patchValue({ type: 'VENDA', assetId: 1, brokerId: 7, quantity: 2, unitPrice: '12.50' });
    http.expectOne(request => request.url === '/api/acoes/consulta').flush({ cotacaoAtual: 12.5, quoteProvider: 'BRAPI' });
    fixture.componentInstance.markPriceDirty(); fixture.componentInstance.review();
    http.expectOne('/api/operacoes/previa').flush(preview());
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Dados da operação'); expect(text).toContain('Impacto na posição');
    expect(text).toContain('Quantidade anterior'); expect(text).toContain('Quantidade projetada');
    expect(text).toContain('Resultado realizado nesta venda'); expect(text).toContain('Ganho');
  });

  it('finaliza uma prévia recusada sem deixar o modal em carregamento', () => {
    start(); fixture.componentInstance.openCreate();
    fixture.componentInstance.form.patchValue({ assetId: 1, brokerId: 7, quantity: 2, unitPrice: '12.50' });
    http.expectOne(request => request.url === '/api/acoes/consulta').flush({ cotacaoAtual: 12.5, quoteProvider: 'BRAPI' });
    fixture.componentInstance.markPriceDirty(); fixture.componentInstance.review();
    http.expectOne('/api/operacoes/previa').flush({ message: 'Dados inválidos' }, { status: 422, statusText: 'Unprocessable' });
    fixture.detectChanges();
    expect(fixture.componentInstance.pending).toBe(false);
    expect(fixture.componentInstance.reviewing).toBe(false);
  });

  it('mostra saldo insuficiente no modal, preserva o formulário e permite corrigir a quantidade', async () => {
    start();
    const component = fixture.componentInstance;
    component.openCreate();
    component.form.patchValue({ type: 'VENDA', assetId: 1, brokerId: 7, quantity: 9, unitPrice: '12.50' });
    http.expectOne(request => request.url === '/api/acoes/consulta').flush({ cotacaoAtual: 12.5, quoteProvider: 'BRAPI' });
    component.markPriceDirty();
    component.review();

    http.expectOne('/api/operacoes/previa').flush({
      code: 'INSUFFICIENT_POSITION',
      message: 'A operação produz posição negativa na ordem cronológica.'
    }, { status: 422, statusText: 'Unprocessable Entity' });
    fixture.detectChanges();

    const page = fixture.nativeElement as HTMLElement;
    const modal = page.querySelector('.operation-modal') as HTMLElement;
    const alert = modal.querySelector('[role="alert"]') as HTMLElement;
    const reviewButton = Array.from(modal.querySelectorAll('button')).find(button => button.textContent?.includes('Revisar')) as HTMLButtonElement;

    expect(component.modalOpen).toBe(true);
    expect(alert.textContent).toContain('Você não possui ações suficientes nessa corretora.');
    expect(page.textContent).not.toContain('A operação produz posição negativa na ordem cronológica.');
    expect(component.form.controls.quantity.value).toBe(9);
    expect(component.form.controls.unitPrice.value).toBe('12.50');
    expect(reviewButton.disabled).toBe(false);

    component.form.controls.quantity.setValue(2);
    await fixture.whenStable();

    expect(component.modalError).toBe('');
  });

  it('finaliza exclusão confirmada e preserva o estado sem pendência', () => {
    start(); const component = fixture.componentInstance;
    component.requestDelete(11); component.confirmDelete(11);
    http.expectOne('/api/operacoes/11').flush(null);
    http.expectOne(request => request.url === '/api/carteira/posicoes/detalhadas').flush({ items: [], page: 0, size: 100, totalElements: 0, totalPages: 0 });
    fixture.detectChanges();
    expect(component.pendingRowId).toBeUndefined();
    expect(component.history).toEqual([]);
  });

  it('mantém histórico durante atualização, envia filtros e formata BRL/USD', () => {
    start(); const root = fixture.nativeElement as HTMLElement;
    fixture.componentInstance.filters.patchValue({ ticker: 'petr4', type: 'VENDA', brokerId: 7 });
    fixture.componentInstance.applyFilters();
    expect(root.textContent).toContain('PETR4');
    const request = http.expectOne(request => request.url === '/api/operacoes');
    expect(request.request.params.get('ticker')).toBe('PETR4');
    expect(request.request.params.get('tipo')).toBe('VENDA');
    request.flush([operation({ moeda: 'USD', precoUnitario: 10, valorTotal: 20 })]); fixture.detectChanges();
    expect(root.textContent).toContain('US$');
  });

  it('encerra o timeout da prévia no modal, preserva campos e reabilita Revisar', async () => {
    vi.useFakeTimers();
    start();
    const component = fixture.componentInstance;
    fillModalForPreview('VENDA');
    component.review();
    http.expectOne('/api/operacoes/previa');

    await vi.advanceTimersByTimeAsync(12_000);
    fixture.detectChanges();

    const modal = (fixture.nativeElement as HTMLElement).querySelector('.operation-modal') as HTMLElement;
    const reviewButton = Array.from(modal.querySelectorAll('button')).find(button => button.textContent?.includes('Revisar')) as HTMLButtonElement;
    expect(component.pending).toBe(false);
    expect(component.modalOpen).toBe(true);
    expect(component.reviewing).toBe(false);
    expect(component.form.controls.quantity.value).toBe(2);
    expect(component.form.controls.unitPrice.value).toBe('12.50');
    expect(modal.querySelector('[role="alert"]')?.textContent).toContain('O servidor não confirmou nem recusou o registro.');
    expect(reviewButton.disabled).toBe(false);
  });

  it('ignora uma resposta de prévia emitida depois do timeout', async () => {
    vi.useFakeTimers();
    start();
    const component = fixture.componentInstance;
    const operations = TestBed.inject(OperacaoService);
    let emitLateResponse!: () => void;
    vi.spyOn(operations, 'preview').mockReturnValue(new Observable(observer => {
      emitLateResponse = () => observer.next(preview() as any);
    }));
    fillModalForPreview();
    component.review();

    await vi.advanceTimersByTimeAsync(12_000);
    emitLateResponse();
    await vi.advanceTimersByTimeAsync(0);
    fixture.detectChanges();

    expect(component.modalOpen).toBe(true);
    expect(component.pending).toBe(false);
    expect(component.reviewing).toBe(false);
    expect(component.preview).toBeUndefined();
    expect(component.message).toBe('');
    expect(component.history).toEqual([operation()]);
  });

  it('limpa o estado assíncrono do modal ao fechar e reabrir depois de uma falha', () => {
    start();
    const component = fixture.componentInstance;
    fillModalForPreview();
    component.review();
    http.expectOne('/api/operacoes/previa').flush({ message: 'Falha temporária' }, { status: 503, statusText: 'Unavailable' });
    fixture.detectChanges();

    expect(component.modalError).toContain('Falha temporária');
    component.closeModal();
    component.openCreate();
    fixture.detectChanges();

    const page = fixture.nativeElement as HTMLElement;
    expect(component.modalOpen).toBe(true);
    expect(component.pending).toBe(false);
    expect(component.reviewing).toBe(false);
    expect(component.modalError).toBe('');
    expect(page.querySelector('.message-slot')?.textContent?.trim()).toBe('');
    expect(page.querySelector('.operation-modal [role="alert"]')?.textContent?.trim()).toBe('');
  });

  it('permite uma nova prévia manual bem-sucedida depois de uma falha sem retry automático', () => {
    start();
    const component = fixture.componentInstance;
    const operations = TestBed.inject(OperacaoService);
    const previewSpy = vi.spyOn(operations, 'preview');
    fillModalForPreview();
    component.review();
    http.expectOne('/api/operacoes/previa').flush({ message: 'Falha temporária' }, { status: 503, statusText: 'Unavailable' });
    fixture.detectChanges();
    expect(previewSpy).toHaveBeenCalledTimes(1);

    component.review();
    http.expectOne('/api/operacoes/previa').flush(preview());
    fixture.detectChanges();

    expect(previewSpy).toHaveBeenCalledTimes(2);
    expect(component.pending).toBe(false);
    expect(component.reviewing).toBe(true);
    expect(component.preview).toEqual(preview());
  });

  it('mantém a revisão no modal quando a confirmação é rejeitada', () => {
    start();
    const component = fixture.componentInstance;
    fillModalForPreview('VENDA');
    component.review();
    http.expectOne('/api/operacoes/previa').flush(preview());
    fixture.detectChanges();
    component.confirm();
    http.expectOne('/api/operacoes').flush({ message: 'Não foi possível confirmar o registro.' }, { status: 422, statusText: 'Unprocessable Entity' });
    fixture.detectChanges();

    const page = fixture.nativeElement as HTMLElement;
    const modal = page.querySelector('.operation-modal') as HTMLElement;
    const confirmButton = Array.from(modal.querySelectorAll('button')).find(button => button.textContent?.includes('Confirmar registro')) as HTMLButtonElement;
    expect(component.modalOpen).toBe(true);
    expect(component.reviewing).toBe(true);
    expect(component.form.controls.quantity.value).toBe(2);
    expect(component.preview).toEqual(preview());
    expect(modal.querySelector('[role="alert"]')?.textContent).toContain('Não foi possível confirmar o registro.');
    expect(confirmButton.disabled).toBe(false);
    expect(page.querySelector('.message-slot')?.textContent?.trim()).toBe('');

    component.confirm();
    const confirmed = operation({ id: 12, quantidade: 2, valorTotal: 24.5 });
    http.expectOne('/api/operacoes').flush(confirmed);
    http.expectOne('/api/carteira/dashboard').flush({});
    http.expectOne(request => request.url === '/api/carteira/posicoes/detalhadas').flush({ items: [], page: 0, size: 100, totalElements: 0, totalPages: 0 });
    http.expectOne(request => request.url === '/api/operacoes').flush([confirmed]);
    fixture.detectChanges();

    expect(component.reviewing).toBe(false);
    expect(component.history).toEqual([confirmed]);
  });
});
