import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { QuoteProvenance } from '../../../core/portfolio/portfolio.models';
import { DataStatusComponent } from '../data-status/data-status';
import { DateTimeValueComponent } from '../date-time-value/date-time-value';

@Component({
  selector: 'app-quote-provenance', standalone: true,
  imports: [DataStatusComponent, DateTimeValueComponent],
  template: `<section class="provenance" aria-label="Origem da cotação">
    <div><strong>{{ provenance.provider || 'Origem não informada' }}</strong><app-data-status [availability]="provenance.availability" [reason]="provenance.reason" /></div>
    <dl><div><dt>Referência</dt><dd><app-date-time-value [value]="provenance.referenceAt" /></dd></div><div><dt>Coleta</dt><dd><app-date-time-value [value]="provenance.fetchedAt" /></dd></div></dl>
  </section>`,
  styles: ['.provenance{padding:var(--space-3);border:1px solid var(--color-border);border-radius:var(--radius-md);background:var(--color-surface-subtle)}.provenance>div{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:var(--space-2)}dl{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:var(--space-2);margin:var(--space-2) 0 0}dl div{min-width:0}dt{font-size:var(--font-size-xs);color:var(--color-text-muted)}dd{margin:var(--space-1) 0 0}@media(max-width:420px){dl{grid-template-columns:1fr}}'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QuoteProvenanceComponent { @Input({ required: true }) provenance!: QuoteProvenance; }
