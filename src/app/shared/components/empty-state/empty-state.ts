import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-empty-state', standalone: true,
  template: '<section class="state" role="status"><span class="symbol" aria-hidden="true">○</span><h2>{{ title }}</h2><p>{{ message }}</p><ng-content /></section>',
  styles: ['.state{text-align:center;padding:var(--space-6) var(--space-4);border:1px dashed var(--color-border-strong);border-radius:var(--radius-lg);background:var(--color-surface)}.symbol{display:grid;place-items:center;width:3rem;height:3rem;margin:auto;border-radius:50%;background:var(--color-action-soft);color:var(--color-action);font-size:var(--font-size-xl)}h2{margin:var(--space-3) 0 var(--space-1);font-size:var(--font-size-lg)}p{max-width:36rem;margin:0 auto;color:var(--color-text-muted)}'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmptyStateComponent {
  @Input() title = 'Nenhum dado encontrado';
  @Input() message = 'Não há informações confirmadas para exibir neste momento.';
}
