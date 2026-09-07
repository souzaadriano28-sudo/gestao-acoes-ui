import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-toast-region', standalone: true,
  template: '<div class="sr-only" aria-live="polite" aria-atomic="true">{{ message }}</div>',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ToastRegionComponent { @Input() message = ''; }
