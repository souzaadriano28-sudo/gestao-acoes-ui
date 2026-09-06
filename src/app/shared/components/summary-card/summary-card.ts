import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { NgIf } from '@angular/common';
import { MoneyMetric, PercentageMetric } from '../../../core/portfolio/portfolio.models';
import { CurrencyValueComponent } from '../currency-value/currency-value';
import { DataStatusComponent } from '../data-status/data-status';
import { PercentageValueComponent } from '../percentage-value/percentage-value';

@Component({
  selector: 'app-summary-card', standalone: true,
  imports: [CurrencyValueComponent, PercentageValueComponent, DataStatusComponent, NgIf],
  template: `<article><div class="heading"><h2>{{ label }}</h2><app-data-status [availability]="metric.availability" [reason]="metric.reason" /></div><p class="value">@if (kind === 'money') { <app-currency-value [metric]="moneyMetric" /> } @else { <app-percentage-value [metric]="percentageMetric" /> }</p><p class="context" *ngIf="context">{{ context }}</p></article>`,
  styles: ['article{height:100%;padding:var(--space-4);background:var(--color-surface);border:1px solid var(--color-border);border-radius:var(--radius-lg);box-shadow:var(--shadow-sm)}.heading{display:flex;align-items:flex-start;justify-content:space-between;gap:var(--space-2)}h2{margin:0;color:var(--color-text-muted);font-size:var(--font-size-sm)}.value{margin:var(--space-3) 0 0;font-size:var(--font-size-2xl);font-weight:800;letter-spacing:-.02em}.context{margin:var(--space-2) 0 0;color:var(--color-text-muted);font-size:var(--font-size-xs)}'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SummaryCardComponent {
  @Input({ required: true }) label!: string;
  @Input({ required: true }) metric!: MoneyMetric | PercentageMetric;
  @Input() kind: 'money' | 'percentage' = 'money';
  @Input() context = '';
  get moneyMetric(): MoneyMetric { return this.metric as MoneyMetric; }
  get percentageMetric(): PercentageMetric { return this.metric as PercentageMetric; }
}
