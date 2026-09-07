import { Availability, MoneyMetric, PercentageMetric } from '../../core/portfolio/portfolio.models';

export interface FormattedValue {
  text: string;
  accessibleText: string;
  available: boolean;
}

export function formatMoney(metric: MoneyMetric, locale = 'pt-BR'): FormattedValue {
  if (metric.availability === 'UNAVAILABLE' || metric.value === null) return unavailable(metric.reason);
  try {
    const text = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: metric.currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(metric.value);
    return { text, accessibleText: `${availabilityPrefix(metric.availability)}${text}`, available: true };
  } catch {
    return unavailable('Moeda não reconhecida pelo navegador.');
  }
}

export function formatPercentage(metric: PercentageMetric, locale = 'pt-BR'): FormattedValue {
  if (metric.availability === 'UNAVAILABLE' || metric.value === null) return unavailable(metric.reason);
  const text = `${new Intl.NumberFormat(locale, { signDisplay: 'always', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(metric.value)}%`;
  const direction = metric.value > 0 ? 'positivo' : metric.value < 0 ? 'negativo' : 'neutro';
  return { text, accessibleText: `${availabilityPrefix(metric.availability)}Resultado ${direction}: ${text}`, available: true };
}

export function formatDateTime(value: string | null, locale = 'pt-BR', timeZone = 'America/Sao_Paulo'): FormattedValue {
  if (!value) return unavailable('Data e hora não informadas.');
  if (!hasExplicitZone(value)) {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/);
    const text = match ? `${match[3]}/${match[2]}/${match[1]}, ${match[4]}:${match[5]}${match[6] ? `:${match[6]}` : ''}` : value;
    return { text: `${text} · fuso não fornecido`, accessibleText: `${text}, horário informado pelo servidor; fuso não fornecido`, available: true };
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return unavailable('Data e hora inválidas.');
  const text = new Intl.DateTimeFormat(locale, {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit',
    timeZone, timeZoneName: 'short'
  }).format(date);
  return { text, accessibleText: `${text}; fuso de apresentação ${timeZone}`, available: true };
}

export function availabilityLabel(value: Availability): string {
  return value === 'AVAILABLE' ? 'Disponível' : value === 'STALE' ? 'Desatualizado' : 'Indisponível';
}

function hasExplicitZone(value: string): boolean {
  return /(?:Z|[+-]\d{2}:\d{2})$/i.test(value);
}

function availabilityPrefix(value: Availability): string {
  return value === 'STALE' ? 'Dado desatualizado. ' : '';
}

function unavailable(reason: string | null): FormattedValue {
  return { text: 'Indisponível', accessibleText: reason ? `Indisponível. ${reason}` : 'Indisponível.', available: false };
}
