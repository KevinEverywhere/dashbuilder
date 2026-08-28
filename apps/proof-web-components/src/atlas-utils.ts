import {
  DESTINATION_CONTINENT_OPTIONS,
  MOCK_DESTINATIONS,
  historicYearsForPreset,
  type Destination,
} from '@destination-atlas';

export interface LineChartPoint {
  x: string;
  y: number;
}

export interface BarChartBar {
  label: string;
  value: number;
}

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
    region: 'asia',
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
    region: 'south-america',
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
  {
    id: 'n5',
    headline: 'Sydney harbor events drive strong domestic travel',
    source: 'Oceania Brief',
    region: 'oceania',
    published: '2024-11-10',
    summary: 'Waterfront festivals contributed to a 14% lift in regional visitor spend.',
  },
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

/** Sum visitor counts across all destinations by year. */
export function aggregateVisitorTrend(): LineChartPoint[] {
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

export function destinationBarSeries(
  locale: string,
  localize: (dest: Destination, locale: string) => string,
): BarChartBar[] {
  return MOCK_DESTINATIONS.map((dest) => ({
    label: localize(dest, locale),
    value: dest.visitorsCurrent,
  }));
}

export function formatRegionLabel(region: string): string {
  return region
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

const TIME_PRESET_LABELS: Record<string, string> = {
  '1y': '1 year',
  '5y': '5 years',
  all: 'All years',
};

export function historicWindowLabel(preset: string): string {
  return TIME_PRESET_LABELS[preset] ?? preset;
}

export { historicYearsForPreset };

export const REGION_OPTIONS = DESTINATION_CONTINENT_OPTIONS;

export function filterHistoricByPreset(
  dest: Destination,
  preset: string,
): Destination['visitorsHistoric'] {
  const allowed = new Set(historicYearsForPreset(preset));
  return dest.visitorsHistoric.filter((row) => allowed.has(row.year));
}

export function formatMonthLabel(value: string): string {
  if (!value) {
    return '—';
  }
  const [year, month] = value.split('-');
  if (!year || !month) {
    return value;
  }
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
}

export function formatVisitPeriod(start: string, end: string): string {
  if (!start && !end) {
    return 'Any period';
  }
  if (start && end) {
    return `${formatMonthLabel(start)} – ${formatMonthLabel(end)}`;
  }
  return formatMonthLabel(start || end);
}

export function periodColumnLabel(preset: string): string {
  const years = historicYearsForPreset(preset);
  if (years.length === 1) {
    return String(years[0]);
  }
  return `${years[0]}–${years[years.length - 1]}`;
}

export const TIME_PRESETS = [
  { id: '1y', label: '1 year' },
  { id: '5y', label: '5 years' },
  { id: 'all', label: 'All' },
];

