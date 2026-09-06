import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-error-summary', standalone: true,
  template: `<section class="error" role="alert" tabindex="-1"><div><strong>{{ title }}</strong><p>{{ message }}</p></div>@if (retryable) { <button type="button" (click)="retry.emit()">Tentar leitura novamente</button> }</section>`,
  styles: ['.error{display:flex;align-items:center;justify-content:space-between;gap:var(--space-4);padding:var(--space-4);border:1px solid var(--color-negative-border);border-radius:var(--radius-md);background:var(--color-negative-soft);color:var(--color-negative-strong)}strong{display:block}p{margin:var(--space-1) 0 0}button{min-height:var(--target-comfortable);padding:var(--space-2) var(--space-3);border:1px solid currentColor;border-radius:var(--radius-sm);background:var(--color-surface);color:inherit;font-weight:700}@media(max-width:560px){.error{align-items:stretch;flex-direction:column}}'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ErrorSummaryComponent {
  @Input() title = 'Não foi possível carregar os dados';
  @Input({ required: true }) message!: string;
  @Input() retryable = true;
  @Output() readonly retry = new EventEmitter<void>();
}
