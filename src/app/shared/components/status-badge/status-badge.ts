import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-status-badge', standalone: true,
  template: '<span class="status-badge" [attr.data-tone]="tone"><span aria-hidden="true">{{ symbol }}</span><span>{{ label }}</span></span>',
  styles: ['.status-badge{display:inline-flex;align-items:center;gap:var(--space-1);min-height:var(--target-min);padding:var(--space-1) var(--space-2);border:1px solid transparent;border-radius:var(--radius-pill);font-size:var(--font-size-xs);font-weight:750;white-space:nowrap}.status-badge[data-tone="positive"]{background:var(--color-positive-soft);color:var(--color-positive)}.status-badge[data-tone="negative"]{border-color:var(--color-negative-border);background:var(--color-negative-soft);color:var(--color-negative)}.status-badge[data-tone="warning"]{border-color:var(--color-warning-border);background:var(--color-warning-soft);color:var(--color-warning-strong)}.status-badge[data-tone="neutral"]{background:var(--color-surface-subtle);color:var(--color-text-muted)}'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StatusBadgeComponent {
  @Input({ required: true }) label!: string;
  @Input() tone: 'positive' | 'negative' | 'warning' | 'neutral' = 'neutral';
  @Input() symbol = '•';
}
