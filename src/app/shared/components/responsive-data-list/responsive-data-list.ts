import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-responsive-data-list', standalone: true,
  template: `<section class="data-list" [attr.aria-label]="label"><div class="desktop-table" tabindex="0" role="region" [attr.aria-label]="label + ' — tabela rolável horizontalmente'"><ng-content select="table" /></div><div class="mobile-cards"><ng-content select="[mobile-cards]" /></div></section>`,
  styles: [`:host{display:block;min-width:0;max-width:100%}.data-list{min-width:0;max-width:100%}.desktop-table{max-width:100%;overflow-x:auto;border:1px solid var(--color-border);border-radius:var(--radius-lg);background:var(--color-surface);box-shadow:var(--shadow-sm)}.desktop-table table{width:100%;border-collapse:collapse}.desktop-table :where(th,td){padding:var(--space-3) var(--space-4);border-bottom:1px solid var(--color-border);text-align:left;vertical-align:top}.desktop-table th{background:var(--color-surface-subtle);color:var(--color-text-muted);font-size:var(--font-size-xs);letter-spacing:.04em;text-transform:uppercase}.desktop-table tbody tr{min-height:3.5rem}.desktop-table tbody tr:last-child td{border-bottom:0}.desktop-table tbody tr:hover{background:var(--color-action-soft)}.mobile-cards{display:none}@media(max-width:47.999rem){.desktop-table{display:none}.mobile-cards{display:grid;gap:var(--space-3)}}@media(forced-colors:active){.desktop-table{border:1px solid CanvasText}}`],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ResponsiveDataListComponent { @Input() label = 'Dados'; }
