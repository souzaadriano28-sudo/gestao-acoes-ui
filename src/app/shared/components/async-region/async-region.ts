import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { AsyncState } from '../../state/async-state';
import { EmptyStateComponent } from '../empty-state/empty-state';
import { ErrorSummaryComponent } from '../error-summary/error-summary';
import { LoadingStateComponent } from '../loading-state/loading-state';
import { PartialDataStateComponent } from '../partial-data-state/partial-data-state';

@Component({
  selector: 'app-async-region', standalone: true,
  imports: [EmptyStateComponent, ErrorSummaryComponent, LoadingStateComponent, PartialDataStateComponent],
  template: `<section [attr.aria-busy]="state.status === 'loading'" [attr.aria-label]="label">
    @switch (state.status) {
      @case ('idle') { }
      @case ('loading') { <app-loading-state [label]="'Carregando ' + label" /> }
      @case ('empty') { <app-empty-state [title]="emptyTitle" [message]="emptyMessage"><ng-content select="[empty-action]" /></app-empty-state> }
      @case ('unavailable') { <app-error-summary title="Dados indisponíveis" [message]="state.message" [retryable]="true" (retry)="retry.emit()" /> }
      @case ('error') { <app-error-summary [message]="state.message" [retryable]="true" (retry)="retry.emit()" /> @if (state.previous !== undefined) { <app-partial-data-state message="A atualização falhou; os últimos dados confirmados permanecem visíveis." /><ng-content /> } }
      @case ('stale') { <app-partial-data-state [message]="state.message" /><ng-content /> }
      @default { <ng-content /> }
    }
  </section>`,
  styles: [':host{display:block}section{display:grid;gap:var(--space-3)}'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AsyncRegionComponent<T = unknown> {
  @Input({ required: true }) state!: AsyncState<T>;
  @Input() label = 'região de dados';
  @Input() emptyTitle = 'Nenhum dado encontrado';
  @Input() emptyMessage = 'Não há informações confirmadas para exibir.';
  @Output() readonly retry = new EventEmitter<void>();
}
