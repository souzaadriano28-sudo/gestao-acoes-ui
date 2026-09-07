import { TestBed } from '@angular/core/testing';
import { AsyncRegionComponent } from './async-region/async-region';
import { CurrencyValueComponent } from './currency-value/currency-value';
import { DataStatusComponent } from './data-status/data-status';
import { QuoteProvenanceComponent } from './quote-provenance/quote-provenance';
import { SummaryCardComponent } from './summary-card/summary-card';
import { ToastRegionComponent } from './toast-region/toast-region';
import { StatusBadgeComponent } from './status-badge/status-badge';
import { asyncState } from '../state/async-state';

describe('shared data components', () => {
  it('renderiza dinheiro indisponível sem zero substituto', async () => {
    await TestBed.configureTestingModule({ imports: [CurrencyValueComponent] }).compileComponents();
    const fixture = TestBed.createComponent(CurrencyValueComponent);
    fixture.componentRef.setInput('metric', { availability: 'UNAVAILABLE', value: null, currency: 'BRL', reason: 'Câmbio ausente' });
    fixture.detectChanges();
    const value = fixture.nativeElement.querySelector('span') as HTMLElement;
    expect(value.textContent).toContain('Indisponível');
    expect(value.getAttribute('aria-label')).toContain('Câmbio ausente');
    expect(value.textContent).not.toContain('0');
  });

  it('expõe estado por texto e símbolo, sem depender apenas de cor', async () => {
    await TestBed.configureTestingModule({ imports: [DataStatusComponent, StatusBadgeComponent] }).compileComponents();
    const fixture = TestBed.createComponent(DataStatusComponent);
    fixture.componentRef.setInput('availability', 'STALE');
    fixture.componentRef.setInput('reason', 'Referência antiga');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('! Desatualizado');
    expect(fixture.nativeElement.textContent).toContain('Referência antiga');
    const generic = TestBed.createComponent(StatusBadgeComponent);
    generic.componentRef.setInput('label', 'Resultado positivo');
    generic.componentRef.setInput('tone', 'positive');
    generic.componentRef.setInput('symbol', '+');
    generic.detectChanges();
    expect(generic.nativeElement.textContent).toContain('+Resultado positivo');
  });

  it('não inventa origem e expõe referência e coleta', async () => {
    await TestBed.configureTestingModule({ imports: [QuoteProvenanceComponent] }).compileComponents();
    const fixture = TestBed.createComponent(QuoteProvenanceComponent);
    fixture.componentRef.setInput('provenance', { availability: 'UNAVAILABLE', sourceType: null, provider: null, referenceAt: null, fetchedAt: null, referenceKind: null, currency: 'BRL', reason: 'LEGACY' });
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Origem não informada');
    expect(text).toContain('Referência');
    expect(text).toContain('Coleta');
  });

  it('reserva região em loading e oferece repetição apenas para leitura com erro', async () => {
    await TestBed.configureTestingModule({ imports: [AsyncRegionComponent] }).compileComponents();
    const fixture = TestBed.createComponent(AsyncRegionComponent);
    fixture.componentRef.setInput('label', 'posições');
    fixture.componentRef.setInput('state', asyncState.loading());
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role=status]')).toBeTruthy();
    fixture.componentRef.setInput('state', asyncState.error('Falha de leitura'));
    let retries = 0;
    fixture.componentInstance.retry.subscribe(() => retries++);
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();
    expect(retries).toBe(1);
    expect(fixture.nativeElement.textContent).toContain('Tentar leitura novamente');
  });

  it('distingue cartão positivo por sinal/texto e mantém anúncio compartilhado', async () => {
    await TestBed.configureTestingModule({ imports: [SummaryCardComponent, ToastRegionComponent] }).compileComponents();
    const card = TestBed.createComponent(SummaryCardComponent);
    card.componentRef.setInput('label', 'Resultado');
    card.componentRef.setInput('kind', 'percentage');
    card.componentRef.setInput('metric', { availability: 'AVAILABLE', value: 1.25, reason: null });
    card.detectChanges();
    expect(card.nativeElement.textContent).toContain('+1,25%');
    expect(card.nativeElement.querySelector('[aria-label]')?.getAttribute('aria-label')).toContain('positivo');

    const toast = TestBed.createComponent(ToastRegionComponent);
    toast.componentRef.setInput('message', 'Dados atualizados');
    toast.detectChanges();
    expect(toast.nativeElement.querySelector('[aria-live=polite]').textContent).toContain('Dados atualizados');
  });
});
