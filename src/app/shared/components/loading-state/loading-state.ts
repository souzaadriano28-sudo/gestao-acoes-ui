import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-loading-state', standalone: true,
  template: `<div class="loading" role="status" aria-live="polite"><span class="sr-only">{{ label }}</span><div aria-hidden="true"></div><div aria-hidden="true"></div><div aria-hidden="true"></div></div>`,
  styles: ['.loading{display:grid;gap:var(--space-3);min-height:10rem;padding:var(--space-4);border:1px solid var(--color-border);border-radius:var(--radius-lg);background:var(--color-surface)}.loading div{height:1.25rem;border-radius:var(--radius-sm);background:linear-gradient(90deg,var(--color-surface-subtle),var(--color-border),var(--color-surface-subtle));background-size:200% 100%;animation:pulse 1.4s ease-in-out infinite}.loading div:nth-child(2){width:72%}.loading div:nth-child(3){width:88%}@keyframes pulse{to{background-position:-200% 0}}@media(prefers-reduced-motion:reduce){.loading div{animation:none}}'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoadingStateComponent { @Input() label = 'Carregando dados'; }
