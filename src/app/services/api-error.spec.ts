import { HttpErrorResponse } from '@angular/common/http';
import { parseApiError } from './api-error';

describe('parseApiError', () => {
  it('preserva mensagem e associa fieldErrors', () => {
    const parsed = parseApiError(new HttpErrorResponse({ status: 422, error: {
      timestamp: '2026-01-01T00:00:00Z', status: 422, code: 'VALIDATION_ERROR',
      error: 'Unprocessable Entity', message: 'Revise os campos', path: '/carteira/comprar',
      fieldErrors: [{ field: 'qtd', message: 'deve ser positiva' }]
    }}));
    expect(parsed.message).toBe('Revise os campos');
    expect(parsed.fields['qtd']).toBe('deve ser positiva');
    expect(parsed.unknownOutcome).toBe(false);
  });

  it('distingue falha de comunicação e resposta inesperada', () => {
    expect(parseApiError(new HttpErrorResponse({ status: 0 })).unknownOutcome).toBe(true);
    expect(parseApiError(new Error('boom')).message).toContain('inesperado');
  });
});
