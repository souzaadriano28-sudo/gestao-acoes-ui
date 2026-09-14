import { Signal, WritableSignal, signal } from '@angular/core';
import { Observable, Subscription } from 'rxjs';

export type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading'; previous?: T }
  | { status: 'success'; data: T }
  | { status: 'empty'; data: T }
  | { status: 'stale'; data: T; message: string }
  | { status: 'unavailable'; message: string }
  | { status: 'error'; message: string; previous?: T };

export const asyncState = {
  idle: <T>(): AsyncState<T> => ({ status: 'idle' }),
  loading: <T>(previous?: T): AsyncState<T> => previous === undefined
    ? { status: 'loading' }
    : { status: 'loading', previous },
  success: <T>(data: T): AsyncState<T> => ({ status: 'success', data }),
  empty: <T>(data: T): AsyncState<T> => ({ status: 'empty', data }),
  stale: <T>(data: T, message: string): AsyncState<T> => ({ status: 'stale', data, message }),
  unavailable: <T>(message: string): AsyncState<T> => ({ status: 'unavailable', message }),
  error: <T>(message: string, previous?: T): AsyncState<T> => previous === undefined
    ? { status: 'error', message }
    : { status: 'error', message, previous }
};

export function hasUsableData<T>(state: AsyncState<T>): state is Extract<AsyncState<T>, { data: T }> {
  return state.status === 'success' || state.status === 'empty' || state.status === 'stale';
}

export function stateData<T>(state: AsyncState<T>): T | undefined {
  if (hasUsableData(state)) return state.data;
  if ((state.status === 'loading' || state.status === 'error') && state.previous !== undefined) return state.previous;
  return undefined;
}

/** Controls repeatable reads only. Mutations deliberately remain outside this facade. */
export class AsyncReadFacade<T> {
  private readonly value: WritableSignal<AsyncState<T>> = signal(asyncState.idle<T>());
  private active?: Subscription;
  readonly state: Signal<AsyncState<T>> = this.value.asReadonly();

  load(read: () => Observable<T>, isEmpty: (data: T) => boolean = () => false): void {
    const previous = stateData(this.value());
    this.active?.unsubscribe();
    this.value.set(asyncState.loading(previous));
    this.active = read().subscribe({
      next: data => this.value.set(isEmpty(data) ? asyncState.empty(data) : asyncState.success(data)),
      error: error => {
        const message = readErrorMessage(error);
        this.value.set(previous === undefined ? asyncState.error(message) : asyncState.stale(previous, message));
      }
    });
  }

  /** Applies a confirmed mutation result without a transient second read. */
  apply(data: T, isEmpty: (data: T) => boolean = () => false): void {
    this.active?.unsubscribe();
    this.value.set(isEmpty(data) ? asyncState.empty(data) : asyncState.success(data));
  }

  setUnavailable(message: string): void { this.value.set(asyncState.unavailable(message)); }
  destroy(): void { this.active?.unsubscribe(); }
}

function readErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'error' in error) {
    const body = (error as { error?: unknown }).error;
    if (typeof body === 'object' && body !== null && 'message' in body && typeof body.message === 'string') return body.message;
  }
  return 'Não foi possível atualizar os dados. Tente novamente.';
}
