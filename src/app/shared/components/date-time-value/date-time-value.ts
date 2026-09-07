import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { formatDateTime } from '../../formatters/value-formatters';

@Component({
  selector: 'app-date-time-value',
  standalone: true,
  template: '<time [attr.datetime]="hasValue ? value : null" [attr.aria-label]="formatted.accessibleText">{{ formatted.text }}</time>',
  styles: [':host{color:var(--color-text-muted);font-size:var(--font-size-sm)}'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DateTimeValueComponent {
  @Input() value: string | null = null;
  get formatted() { return formatDateTime(this.value); }
  get hasValue(): boolean { return !!this.value; }
}
