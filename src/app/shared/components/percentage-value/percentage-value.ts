import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { PercentageMetric } from '../../../core/portfolio/portfolio.models';
import { formatPercentage } from '../../formatters/value-formatters';

@Component({
  selector: 'app-percentage-value',
  standalone: true,
  template: '<span [class]="tone" [attr.aria-label]="formatted.accessibleText">{{ formatted.text }}</span>',
  styles: [':host{font-variant-numeric:tabular-nums}.positive{color:var(--color-positive)}.negative{color:var(--color-negative)}.unavailable{color:var(--color-text-muted);font-style:italic}'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PercentageValueComponent {
  @Input({ required: true }) metric!: PercentageMetric;
  get formatted() { return formatPercentage(this.metric); }
  get tone(): string {
    if (!this.formatted.available || this.metric.value === null) return 'unavailable';
    return this.metric.value > 0 ? 'positive' : this.metric.value < 0 ? 'negative' : 'neutral';
  }
}
