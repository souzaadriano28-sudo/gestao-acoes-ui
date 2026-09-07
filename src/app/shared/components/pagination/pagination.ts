import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-pagination', standalone: true,
  template: `<nav class="pagination" [attr.aria-label]="label"><button type="button" (click)="change(page - 1)" [disabled]="page <= 0">Anterior</button><span aria-live="polite">Página {{ page + 1 }} de {{ pageCount }}</span><button type="button" (click)="change(page + 1)" [disabled]="page + 1 >= pageCount">Próxima</button></nav>`,
  styles: [`.pagination{display:flex;align-items:center;justify-content:flex-end;gap:var(--space-3);margin-top:var(--space-4)}button{min-height:var(--target-comfortable);padding:0 var(--space-4);border:1px solid var(--color-border-strong);border-radius:var(--radius-sm);background:var(--color-surface);color:var(--color-action);font-weight:750}button:hover:not(:disabled){border-color:var(--color-action);background:var(--color-action-soft)}span{color:var(--color-text-muted);font-size:var(--font-size-sm)}@media(max-width:24rem){.pagination{display:grid;grid-template-columns:1fr 1fr}.pagination span{grid-column:1/-1;grid-row:1;text-align:center}}`],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaginationComponent {
  @Input() page = 0;
  @Input() totalPages = 0;
  @Input() label = 'Paginação';
  @Output() readonly pageChange = new EventEmitter<number>();
  get pageCount(): number { return Math.max(this.totalPages, 1); }
  change(page: number): void { if (page >= 0 && page < this.totalPages && page !== this.page) this.pageChange.emit(page); }
}
