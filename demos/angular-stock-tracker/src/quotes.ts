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

export function formatUsd(value: number): string {
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

export async function fetchStockQuote(symbol: string, signal?: AbortSignal): Promise<StockQuote> {
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
  };
}
