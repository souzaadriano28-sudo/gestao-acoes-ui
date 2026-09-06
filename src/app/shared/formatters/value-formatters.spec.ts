import { formatDateTime, formatMoney, formatPercentage } from './value-formatters';

describe('value formatters', () => {
  it('formata BRL e USD pela moeda recebida sem somá-las', () => {
    expect(formatMoney({ availability: 'AVAILABLE', value: 1234.5, currency: 'BRL', reason: null }).text).toMatch(/R\$\s*1\.234,50/);
    expect(formatMoney({ availability: 'AVAILABLE', value: 10.25, currency: 'USD', reason: null }).text).toMatch(/US\$\s*10,25/);
  });

  it('não transforma indisponibilidade em zero e anuncia stale', () => {
    expect(formatMoney({ availability: 'UNAVAILABLE', value: null, currency: 'BRL', reason: 'Câmbio ausente' })).toEqual({ text: 'Indisponível', accessibleText: 'Indisponível. Câmbio ausente', available: false });
    expect(formatMoney({ availability: 'STALE', value: 5, currency: 'BRL', reason: 'Antigo' }).accessibleText).toContain('Dado desatualizado');
  });

  it('mantém sinal e significado textual de percentuais', () => {
    expect(formatPercentage({ availability: 'AVAILABLE', value: -2.5, reason: null }).text).toContain('-2,50%');
    expect(formatPercentage({ availability: 'AVAILABLE', value: -2.5, reason: null }).accessibleText).toContain('negativo');
  });

  it('converte instantes com offset para o fuso declarado e não presume fuso legado', () => {
    const instant = formatDateTime('2026-09-06T15:00:00Z');
    expect(instant.accessibleText).toContain('America/Sao_Paulo');
    const legacy = formatDateTime('2026-09-06T12:00:00');
    expect(legacy.text).toContain('fuso não fornecido');
    expect(legacy.text).toContain('12:00:00');
  });
});
