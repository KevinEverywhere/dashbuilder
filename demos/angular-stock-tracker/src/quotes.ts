export const STOCK_SYMBOLS = [
  { value: 'AAPL', label: 'Apple (AAPL)' },
  { value: 'MSFT', label: 'Microsoft (MSFT)' },
  { value: 'GOOGL', label: 'Alphabet (GOOGL)' },
  { value: 'AMZN', label: 'Amazon (AMZN)' },
  { value: 'NVDA', label: 'NVIDIA (NVDA)' },
  { value: 'META', label: 'Meta (META)' },
] as const;

export interface QuoteDay {
  id: string;
  name: string;
  status: string;
  amount: string;
  date: string;
}

export interface StockQuote {
  symbol: string;
  price: number;
  previousClose: number;
  change: number;
  changePercent: number;
  currency: string;
  days: QuoteDay[];
  sample: boolean;
}

interface YahooChartResponse {
  chart?: {
    result?: Array<{
      meta?: {
        regularMarketPrice?: number;
        chartPreviousClose?: number;
        currency?: string;
        symbol?: string;
      };
      timestamp?: number[];
      indicators?: {
        quote?: Array<{
          close?: Array<number | null>;
          volume?: Array<number | null>;
        }>;
      };
    }>;
    error?: { description?: string };
  };
}

interface SampleSeed {
  price: number;
  previousClose: number;
  sessions: Array<{ close: number; volume: string }>;
}

const SAMPLE_SEEDS: Record<string, SampleSeed> = {
  AAPL: {
    price: 227.42,
    previousClose: 224.88,
    sessions: [
      { close: 227.42, volume: '48M' },
      { close: 224.88, volume: '41M' },
      { close: 225.61, volume: '39M' },
      { close: 222.8, volume: '44M' },
      { close: 223.41, volume: '36M' },
      { close: 221.1, volume: '40M' },
    ],
  },
  MSFT: {
    price: 428.15,
    previousClose: 431.2,
    sessions: [
      { close: 428.15, volume: '22M' },
      { close: 431.2, volume: '19M' },
      { close: 429.74, volume: '18M' },
      { close: 426.05, volume: '21M' },
      { close: 424.9, volume: '17M' },
      { close: 422.33, volume: '20M' },
    ],
  },
  GOOGL: {
    price: 172.64,
    previousClose: 170.1,
    sessions: [
      { close: 172.64, volume: '28M' },
      { close: 170.1, volume: '24M' },
      { close: 169.42, volume: '23M' },
      { close: 171.08, volume: '26M' },
      { close: 168.55, volume: '22M' },
      { close: 167.91, volume: '25M' },
    ],
  },
  AMZN: {
    price: 186.22,
    previousClose: 184.55,
    sessions: [
      { close: 186.22, volume: '35M' },
      { close: 184.55, volume: '31M' },
      { close: 183.4, volume: '29M' },
      { close: 185.12, volume: '33M' },
      { close: 182.77, volume: '27M' },
      { close: 181.95, volume: '30M' },
    ],
  },
  NVDA: {
    price: 118.4,
    previousClose: 121.05,
    sessions: [
      { close: 118.4, volume: '62M' },
      { close: 121.05, volume: '58M' },
      { close: 119.88, volume: '54M' },
      { close: 122.31, volume: '61M' },
      { close: 120.14, volume: '49M' },
      { close: 117.62, volume: '53M' },
    ],
  },
  META: {
    price: 512.3,
    previousClose: 508.8,
    sessions: [
      { close: 512.3, volume: '16M' },
      { close: 508.8, volume: '14M' },
      { close: 510.22, volume: '13M' },
      { close: 506.41, volume: '15M' },
      { close: 504.9, volume: '12M' },
      { close: 501.75, volume: '14M' },
    ],
  },
};

export function formatUsd(value: number): string {
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

function weekdayDates(count: number): string[] {
  const dates: string[] = [];
  const cursor = new Date();
  cursor.setHours(12, 0, 0, 0);
  while (dates.length < count) {
    const weekday = cursor.getDay();
    if (weekday !== 0 && weekday !== 6) {
      dates.push(cursor.toISOString().slice(0, 10));
    }
    cursor.setDate(cursor.getDate() - 1);
  }
  return dates;
}

function daysFromSessions(sessions: SampleSeed['sessions']): QuoteDay[] {
  const dates = weekdayDates(sessions.length);
  return sessions.map((session, index, list) => {
    const older = list[index + 1]?.close ?? session.close;
    return {
      id: `sample-${dates[index]}`,
      name: dates[index] ?? '',
      status: session.close >= older ? 'Up' : 'Down',
      amount: session.close.toFixed(2),
      date: session.volume,
    };
  });
}

/** Known-area quote so the widget is never an empty 429 box. */
export function sampleQuote(symbol: string): StockQuote {
  const seed = SAMPLE_SEEDS[symbol] ?? SAMPLE_SEEDS.AAPL;
  const change = seed.price - seed.previousClose;
  return {
    symbol,
    price: seed.price,
    previousClose: seed.previousClose,
    change,
    changePercent: seed.previousClose ? (change / seed.previousClose) * 100 : 0,
    currency: 'USD',
    days: daysFromSessions(seed.sessions),
    sample: true,
  };
}

export async function fetchStockQuote(symbol: string, signal?: AbortSignal): Promise<StockQuote> {
  try {
    const params = new URLSearchParams({ interval: '1d', range: '1mo' });
    const response = await fetch(`/finance/v8/finance/chart/${encodeURIComponent(symbol)}?${params}`, {
      signal,
    });
    if (!response.ok) {
      throw new Error(`Quote request failed (${response.status})`);
    }
    const body = (await response.json()) as YahooChartResponse;
    const result = body.chart?.result?.[0];
    if (!result) {
      throw new Error(body.chart?.error?.description ?? 'No quote data');
    }
    const price = result.meta?.regularMarketPrice ?? 0;
    const previousClose = result.meta?.chartPreviousClose ?? price;
    const change = price - previousClose;
    const timestamps = result.timestamp ?? [];
    const closes = result.indicators?.quote?.[0]?.close ?? [];
    const volumes = result.indicators?.quote?.[0]?.volume ?? [];
    const days: QuoteDay[] = timestamps
      .map((stamp, index) => {
        const close = closes[index];
        if (close == null) {
          return null;
        }
        const earlier = closes.slice(0, index).filter((value): value is number => value != null);
        const prev = earlier.at(-1) ?? close;
        const up = close >= (prev ?? close);
        return {
          id: String(stamp),
          name: new Date(stamp * 1000).toISOString().slice(0, 10),
          status: up ? 'Up' : 'Down',
          amount: close.toFixed(2),
          date: volumes[index] ? `${Math.round((volumes[index] ?? 0) / 1_000_000)}M` : '—',
        };
      })
      .filter((day): day is QuoteDay => day !== null)
      .slice(-6)
      .reverse();

    return {
      symbol: result.meta?.symbol ?? symbol,
      price,
      previousClose,
      change,
      changePercent: previousClose ? (change / previousClose) * 100 : 0,
      currency: result.meta?.currency ?? 'USD',
      days,
      sample: false,
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error;
    }
    return sampleQuote(symbol);
  }
}
