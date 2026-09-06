import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-partial-data-state', standalone: true,
  template: '<aside class="partial" role="status"><strong>Dados parciais</strong><span>{{ message }}</span></aside>',
  styles: ['.partial{display:flex;gap:var(--space-2);padding:var(--space-3);border:1px solid var(--color-warning-border);border-radius:var(--radius-md);background:var(--color-warning-soft);color:var(--color-warning-strong)}.partial span{color:inherit}'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PartialDataStateComponent { @Input() message = 'Algumas informações estão indisponíveis. Totais incompletos não são apresentados.'; }
