export const COINS = [
  { value: 'bitcoin', label: 'Bitcoin (BTC)' },
  { value: 'ethereum', label: 'Ethereum (ETH)' },
  { value: 'solana', label: 'Solana (SOL)' },
  { value: 'cardano', label: 'Cardano (ADA)' },
  { value: 'dogecoin', label: 'Dogecoin (DOGE)' },
] as const;

export type CoinId = (typeof COINS)[number]['value'];

export interface CoinMarket {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volume: number;
}

export interface CoinDay {
  id: string;
  name: string;
  status: string;
  amount: string;
  date: string;
  price: number;
}

export interface CoinChart {
  points: Array<{ x: string; y: number }>;
  days: CoinDay[];
}

export interface CoinQuote {
  market: CoinMarket;
  chart: CoinChart;
}

interface CoinGeckoMarket {
  id?: string;
  symbol?: string;
  name?: string;
  current_price?: number;
  price_change_percentage_24h?: number | null;
  total_volume?: number;
}

interface CoinGeckoChart {
  prices?: Array<[number, number]>;
  total_volumes?: Array<[number, number]>;
}

const COIN_IDS = COINS.map((coin) => coin.value).join(',');
const MARKETS_URL = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${COIN_IDS}`;

export function formatUsd(value: number): string {
  if (value >= 1_000) {
    return value.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });
  }
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: value >= 1 ? 2 : 4,
  });
}

export function formatVolume(value: number): string {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1)}B`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(0)}K`;
  }
  return String(Math.round(value));
}

function parseMarket(row: CoinGeckoMarket): CoinMarket {
  return {
    id: row.id ?? '',
    symbol: (row.symbol ?? '').toUpperCase(),
    name: row.name ?? row.id ?? 'Coin',
    price: row.current_price ?? 0,
    change24h: row.price_change_percentage_24h ?? 0,
    volume: row.total_volume ?? 0,
  };
}

function toDayKey(stamp: number): string {
  return new Date(stamp).toISOString().slice(0, 10);
}

function buildChart(body: CoinGeckoChart): CoinChart {
  const prices = body.prices ?? [];
  const volumes = body.total_volumes ?? [];
  const volumeByDay = new Map<string, number>();
  for (const [stamp, volume] of volumes) {
    volumeByDay.set(toDayKey(stamp), volume);
  }

  const daily = new Map<string, { stamp: number; price: number }>();
  for (const [stamp, price] of prices) {
    daily.set(toDayKey(stamp), { stamp, price });
  }

  const days = [...daily.entries()]
    .sort((a, b) => a[1].stamp - b[1].stamp)
    .map(([day, point], index, list) => {
      const previous = list[index - 1]?.[1].price ?? point.price;
      const up = point.price >= previous;
      return {
        id: day,
        name: day,
        status: up ? 'Up' : 'Down',
        amount: formatUsd(point.price),
        date: formatVolume(volumeByDay.get(day) ?? 0),
        price: point.price,
      };
    });

  const points =
    days.length > 0
      ? days.map((day) => ({ x: day.name.slice(5), y: day.price }))
      : prices.map(([stamp, price]) => ({
          x: new Date(stamp).toISOString().slice(5, 10),
          y: price,
        }));

  return { points, days: [...days].reverse() };
}

export async function fetchCoinMarkets(signal?: AbortSignal): Promise<CoinMarket[]> {
  const response = await fetch(MARKETS_URL, { signal });
  if (!response.ok) {
    throw new Error(`Markets request failed (${response.status})`);
  }
  const body = (await response.json()) as CoinGeckoMarket[];
  return body.map(parseMarket).filter((coin) => coin.id);
}

export async function fetchCoinChart(id: string, signal?: AbortSignal): Promise<CoinChart> {
  const url = `https://api.coingecko.com/api/v3/coins/${encodeURIComponent(id)}/market_chart?vs_currency=usd&days=7`;
  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`Chart request failed (${response.status})`);
  }
  return buildChart((await response.json()) as CoinGeckoChart);
}

export async function fetchCoinQuote(id: string, signal?: AbortSignal): Promise<CoinQuote> {
  const [markets, chart] = await Promise.all([fetchCoinMarkets(signal), fetchCoinChart(id, signal)]);
  const market = markets.find((coin) => coin.id === id);
  if (!market) {
    throw new Error(`No market data for ${id}`);
  }
  return { market, chart };
}
