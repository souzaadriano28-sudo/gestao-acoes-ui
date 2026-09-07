import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-partial-data-state', standalone: true,
  template: '<aside class="partial" role="status"><strong>Dados parciais</strong><span>{{ message }}</span></aside>',
  styles: ['.partial{display:flex;align-items:flex-start;gap:var(--space-2);padding:var(--space-3) var(--space-4);border:1px solid var(--color-warning-border);border-left-width:4px;border-radius:var(--radius-md);background:var(--color-warning-soft);color:var(--color-warning-strong);font-size:var(--font-size-sm)}.partial strong{flex:0 0 auto;white-space:nowrap}.partial span{min-width:0;color:inherit}@media(max-width:30rem){.partial{flex-direction:column}.partial strong{white-space:normal}}'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PartialDataStateComponent { @Input() message = 'Algumas informações estão indisponíveis. Totais incompletos não são apresentados.'; }
