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
