import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Availability } from '../../../core/portfolio/portfolio.models';
import { DataStatusComponent } from '../data-status/data-status';
import { DateTimeValueComponent } from '../date-time-value/date-time-value';

@Component({
  selector: 'app-freshness', standalone: true,
  imports: [DataStatusComponent, DateTimeValueComponent],
  template: '<div class="freshness"><app-data-status [availability]="availability" [reason]="reason" /><span>Referência: <app-date-time-value [value]="referenceAt" /></span><span>Coleta: <app-date-time-value [value]="fetchedAt" /></span></div>',
  styles: ['.freshness{display:flex;flex-wrap:wrap;align-items:center;gap:var(--space-2) var(--space-4);font-size:var(--font-size-sm);color:var(--color-text-muted)}'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FreshnessComponent {
  @Input({ required: true }) availability!: Availability;
  @Input() referenceAt: string | null = null;
  @Input() fetchedAt: string | null = null;
  @Input() reason: string | null = null;
}
