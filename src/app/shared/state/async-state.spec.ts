import { asyncState, hasUsableData } from './async-state';

describe('asyncState', () => {
  it('produz estados discriminados sem combinações loading/empty/error simultâneas', () => {
    const states = [asyncState.idle<number[]>(), asyncState.loading<number[]>(), asyncState.empty<number[]>([]), asyncState.error<number[]>('Falhou'), asyncState.unavailable<number[]>('Sem fonte')];
    expect(states.map(state => state.status)).toEqual(['idle', 'loading', 'empty', 'error', 'unavailable']);
    expect(states.every(state => Object.keys(state).filter(key => ['status', 'data', 'message', 'previous'].includes(key)).length <= 3)).toBe(true);
  });

  it('preserva dados confirmados somente em success, empty e stale', () => {
    expect(hasUsableData(asyncState.success([1]))).toBe(true);
    expect(hasUsableData(asyncState.empty<number[]>([]))).toBe(true);
    expect(hasUsableData(asyncState.stale([1], 'Atualização falhou'))).toBe(true);
    expect(hasUsableData(asyncState.error<number[]>('Falhou'))).toBe(false);
  });

  it('não contém política de repetição automática de mutações', () => {
    expect(Object.keys(asyncState).sort()).toEqual(['empty', 'error', 'idle', 'loading', 'stale', 'success', 'unavailable']);
  });
});
