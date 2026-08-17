import { MOCK_DESTINATIONS, type Destination } from '@destination-atlas';

export interface MockNewsArticle {
  id: string;
  headline: string;
  source: string;
  region: string;
  published: string;
  summary: string;
}

export const MOCK_NEWS: MockNewsArticle[] = [
  {
    id: 'n1',
    headline: 'Tokyo tourism rebounds past pre-pandemic levels',
    source: 'Pacific Travel Daily',
    region: 'asia-pacific',
    published: '2024-11-02',
    summary: 'Visitor arrivals to Tokyo exceeded 2019 totals for the third consecutive quarter.',
  },
  {
    id: 'n2',
    headline: 'Paris museums extend evening hours for Olympic legacy routes',
    source: 'Europe Heritage Wire',
    region: 'europe',
    published: '2024-10-18',
    summary: 'City officials expand late openings along Seine cultural corridors.',
  },
  {
    id: 'n3',
    headline: 'Cusco rail upgrades aim to spread Inca Trail demand',
    source: 'Andes Dispatch',
    region: 'americas',
    published: '2024-09-30',
    summary: 'Peru invests in alternate arrival windows to reduce peak-season crowding.',
  },
  {
    id: 'n4',
    headline: 'Marrakech medina restoration project enters final phase',
    source: 'Maghreb Monitor',
    region: 'africa',
    published: '2024-10-05',
    summary: 'Craft guilds report stronger shoulder-season bookings after infrastructure work.',
  },
];

export const REGION_OPTIONS = [
  { value: 'asia-pacific', label: 'Asia Pacific' },
  { value: 'europe', label: 'Europe' },
  { value: 'americas', label: 'Americas' },
  { value: 'africa', label: 'Africa' },
];

export const TIME_PRESETS = [
  { id: '1y', label: '1 year' },
  { id: '5y', label: '5 years' },
  { id: 'all', label: 'All years' },
];

export function localizedDestinationName(dest: Destination, locale: string): string {
  return dest.labels?.[locale] ?? dest.name;
}

export function computeVisitorDelta(dest: Destination): string {
  const historic = dest.visitorsHistoric;
  if (historic.length < 2) {
    return '—';
  }
  const prev = historic[historic.length - 2]?.visitors ?? 0;
  const current = dest.visitorsCurrent;
  if (!prev) {
    return '—';
  }
  const pct = ((current - prev) / prev) * 100;
  const sign = pct >= 0 ? '+' : '';
  return `${sign}${pct.toFixed(1)}%`;
}

export function aggregateVisitorTrend(): Array<{ x: string; y: number }> {
  const totals = new Map<number, number>();
  for (const dest of MOCK_DESTINATIONS) {
    for (const row of dest.visitorsHistoric) {
      totals.set(row.year, (totals.get(row.year) ?? 0) + row.visitors);
    }
  }
  return [...totals.entries()]
    .sort(([a], [b]) => a - b)
    .map(([year, visitors]) => ({ x: String(year), y: visitors }));
}

export function formatRegionLabel(region: string): string {
  return region
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function filterDestinations(
  locale: string,
  destSearch: string,
  destRegion: string,
): Destination[] {
  return MOCK_DESTINATIONS.filter((dest) => {
    const name = localizedDestinationName(dest, locale).toLowerCase();
    const matchesSearch = !destSearch || name.includes(destSearch.toLowerCase());
    const matchesRegion = !destRegion || dest.region === destRegion;
    return matchesSearch && matchesRegion;
  });
}
