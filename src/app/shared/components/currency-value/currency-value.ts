import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MoneyMetric } from '../../../core/portfolio/portfolio.models';
import { formatMoney } from '../../formatters/value-formatters';

@Component({
  selector: 'app-currency-value',
  standalone: true,
  template: '<span [class.unavailable]="!formatted.available" [attr.aria-label]="formatted.accessibleText">{{ formatted.text }}</span>',
  styles: [':host{font-variant-numeric:tabular-nums}.unavailable{color:var(--color-text-muted);font-style:italic}'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CurrencyValueComponent {
  @Input({ required: true }) metric!: MoneyMetric;
  get formatted() { return formatMoney(this.metric); }
}
