import { DashboardReadModel, MoneyMetric, QuoteProvenance } from './portfolio.models';

describe('portfolio API models', () => {
  it('representa zero confirmado separadamente de indisponibilidade', () => {
    const zero: MoneyMetric = { availability: 'AVAILABLE', value: 0, currency: 'BRL', reason: null };
    const missing: MoneyMetric = { availability: 'UNAVAILABLE', value: null, currency: 'BRL', reason: 'EXCHANGE_RATE_UNAVAILABLE' };
    expect(zero.value).toBe(0);
    expect(missing.value).toBeNull();
    expect(missing.reason).toBeTruthy();
  });

  it('mantém proveniência ausente explícita e não presume provedor', () => {
    const provenance: QuoteProvenance = { availability: 'UNAVAILABLE', sourceType: null, provider: null, referenceAt: null, fetchedAt: null, referenceKind: null, currency: 'USD', reason: 'LEGACY_SOURCE_UNAVAILABLE' };
    expect(provenance.provider).toBeNull();
    expect(provenance.currency).toBe('USD');
  });

  it('tipa o dashboard como read model único de métricas financeiras', () => {
    const dashboard = { presentationCurrency: 'BRL', positionCount: 0, positions: [], recentMovements: [], quoteSources: [] } as unknown as DashboardReadModel;
    expect(dashboard.positionCount).toBe(0);
    expect(dashboard.positions).toEqual([]);
  });
});
