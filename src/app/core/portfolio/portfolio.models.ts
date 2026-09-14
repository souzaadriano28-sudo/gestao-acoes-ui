export type Availability = 'AVAILABLE' | 'STALE' | 'UNAVAILABLE';
export type Market = 'BRASIL' | 'AMERICANO';
export type MovementType = 'COMPRA' | 'VENDA';

export interface MoneyMetric {
  availability: Availability;
  value: number | null;
  currency: string;
  reason: string | null;
}

export interface PercentageMetric {
  availability: Availability;
  value: number | null;
  reason: string | null;
}

export interface QuoteProvenance {
  availability: Availability;
  sourceType: string | null;
  provider: string | null;
  referenceAt: string | null;
  fetchedAt: string | null;
  referenceKind: string | null;
  currency: string;
  reason: string | null;
}

export interface ExchangeProvenance {
  availability: Availability;
  baseCurrency: string;
  quoteCurrency: string;
  rate: number | null;
  sourceType: string | null;
  provider: string | null;
  referenceAt: string | null;
  fetchedAt: string | null;
  referenceKind: string | null;
  reason: string | null;
}

export interface DetailedPosition {
  positionId: number;
  assetId: number;
  ticker: string;
  assetName: string | null;
  market: Market;
  brokerId: number;
  brokerName: string;
  quantity: number;
  nativeCurrency: string;
  averagePrice: MoneyMetric;
  cost: MoneyMetric;
  currentQuote: MoneyMetric;
  marketValue: MoneyMetric;
  unrealizedResult: MoneyMetric;
  unrealizedResultPercentage: PercentageMetric;
  realizedResult: MoneyMetric;
  quoteProvenance: QuoteProvenance;
}

export interface Movement {
  id: number;
  type: MovementType;
  assetId: number;
  ticker: string;
  market: Market;
  brokerId: number;
  brokerName: string;
  quantity: number;
  unitPrice: MoneyMetric;
  recordedAt: string;
  timeBasis: string;
  historicalQuoteProvenance: QuoteProvenance;
}

export interface PageResponse<T> {
  items: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface DashboardReadModel {
  asOf: string;
  presentationCurrency: string;
  positionCount: number;
  patrimony: MoneyMetric;
  cost: MoneyMetric;
  unrealizedResult: MoneyMetric;
  unrealizedResultPercentage: PercentageMetric;
  positions: DetailedPosition[];
  recentMovements: Movement[];
  quoteSources: QuoteProvenance[];
  exchangeSource: ExchangeProvenance;
  nativeCurrencySummaries?: CurrencySummary[];
}

/** Totals calculated by the backend in one native currency; never a cross-currency sum. */
export interface CurrencySummary {
  currency: string;
  patrimony: MoneyMetric;
  cost: MoneyMetric;
  unrealizedResult: MoneyMetric;
  unrealizedResultPercentage: PercentageMetric;
}

export interface PositionQuery {
  page?: number;
  size?: number;
  market?: Market;
  brokerId?: number;
}

export interface MovementQuery {
  page?: number;
  size?: number;
  type?: MovementType;
  ticker?: string;
  brokerId?: number;
  from?: string;
  to?: string;
}
