import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { NgIf } from '@angular/common';
import { Availability } from '../../../core/portfolio/portfolio.models';
import { availabilityLabel } from '../../formatters/value-formatters';

@Component({
  selector: 'app-data-status',
  standalone: true,
  template: '<span class="badge" [attr.data-status]="availability"><span aria-hidden="true">{{ symbol }}</span> {{ label }}</span><span class="sr-only" *ngIf="reason">. {{ reason }}</span>',
  imports: [NgIf],
  styles: ['.badge{display:inline-flex;align-items:center;gap:var(--space-1);min-height:var(--target-min);padding:var(--space-1) var(--space-2);border:1px solid currentColor;border-radius:var(--radius-pill);font-size:var(--font-size-xs);font-weight:700}.badge[data-status="AVAILABLE"]{color:var(--color-positive)}.badge[data-status="STALE"]{color:var(--color-warning)}.badge[data-status="UNAVAILABLE"]{color:var(--color-negative)}'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DataStatusComponent {
  @Input({ required: true }) availability!: Availability;
  @Input() reason: string | null = null;
  get label(): string { return availabilityLabel(this.availability); }
  get symbol(): string { return this.availability === 'AVAILABLE' ? '✓' : this.availability === 'STALE' ? '!' : '×'; }
}
