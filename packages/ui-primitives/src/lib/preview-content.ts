import type {
  PreviewChartPoint,
  PreviewNewsRow,
  PreviewRow,
  PreviewSelectOption,
} from './preview-types';
import rawPreviewContent from '../../preview-content.json';

export type PreviewContentSourceKind = 'rowset' | 'chart' | 'metric' | 'options';

export interface PreviewContentSource {
  kind: PreviewContentSourceKind;
  label: string;
  table?: string;
  collection?: string;
  connectionEnvKey?: string;
  derivedFrom?: string;
}

export interface PreviewContentColumn {
  key: string;
  header: string;
  numeric?: boolean;
}

/** Flat runtime slice consumed by preview renderers (maps 1:1 to rowset ports). */
export interface PreviewContentSlice {
  tableRows: PreviewRow[];
  newsRows: PreviewNewsRow[];
  chartPoints: PreviewChartPoint[];
  selectOptions: PreviewSelectOption[];
  kpiValue: number;
  kpiDelta: number;
  dateRangeLabel: string;
}

/** Authoring document — edit preview-content.json */
export interface PreviewContentDocument {
  version: 1;
  description?: string;
  sources: Record<string, PreviewContentSource>;
  datasets: {
    orders?: { columns?: PreviewContentColumn[]; rows: PreviewRow[] };
    news?: { rows: PreviewNewsRow[] };
    revenueChart?: { points: PreviewChartPoint[] };
    dashboardMetrics?: { kpiValue: number; kpiDelta: number };
    filters?: { selectOptions: PreviewSelectOption[]; dateRangeLabel: string };
  };
}

/** @deprecated Use PreviewContentSlice */
export type PreviewSampleData = PreviewContentSlice;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function readNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function parsePreviewRow(value: unknown, index: number): PreviewRow | null {
  if (!isRecord(value)) {
    return null;
  }
  return {
    id: readString(value['id'], String(index + 1)),
    name: readString(value['name'], `Row ${index + 1}`),
    status: readString(value['status'], '—'),
    amount: readNumber(value['amount']),
    date: readString(value['date'], '2026-08-01'),
  };
}

function parsePreviewNewsRow(value: unknown, index: number): PreviewNewsRow | null {
  if (!isRecord(value)) {
    return null;
  }
  return {
    id: readString(value['id'], `news-${index + 1}`),
    headline: readString(value['headline'], 'Headline'),
    source: readString(value['source'], 'Wire'),
    region: readString(value['region'], 'Global'),
    publishedAt: readString(value['publishedAt'], '2026-08-01'),
    summary: readString(value['summary'], ''),
    url: readString(value['url'], 'https://example.com/news'),
  };
}

function parseChartPoint(value: unknown, index: number): PreviewChartPoint | null {
  if (!isRecord(value)) {
    return null;
  }
  return {
    label: readString(value['label'], `P${index + 1}`),
    value: readNumber(value['value']),
  };
}

function parseSelectOption(value: unknown, index: number): PreviewSelectOption | null {
  if (!isRecord(value)) {
    return null;
  }
  const label = readString(value['label']);
  if (!label) {
    return null;
  }
  return {
    label,
    value: readString(value['value'], `option-${index + 1}`),
  };
}

function parseSource(value: unknown): PreviewContentSource | null {
  if (!isRecord(value)) {
    return null;
  }
  const kind = readString(value['kind']);
  if (!['rowset', 'chart', 'metric', 'options'].includes(kind)) {
    return null;
  }
  const label = readString(value['label']);
  if (!label) {
    return null;
  }
  return {
    kind: kind as PreviewContentSourceKind,
    label,
    table: readString(value['table']) || undefined,
    collection: readString(value['collection']) || undefined,
    connectionEnvKey: readString(value['connectionEnvKey']) || undefined,
    derivedFrom: readString(value['derivedFrom']) || undefined,
  };
}

const EMPTY_DOCUMENT: PreviewContentDocument = {
  version: 1,
  sources: {},
  datasets: {},
};

function parseRowsArray(raw: unknown): PreviewRow[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.map((row, index) => parsePreviewRow(row, index)).filter((row): row is PreviewRow => row !== null);
}

function parseNewsArray(raw: unknown): PreviewNewsRow[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .map((row, index) => parsePreviewNewsRow(row, index))
    .filter((row): row is PreviewNewsRow => row !== null);
}

function parseChartArray(raw: unknown): PreviewChartPoint[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .map((point, index) => parseChartPoint(point, index))
    .filter((point): point is PreviewChartPoint => point !== null);
}

function parseOptionsArray(raw: unknown): PreviewSelectOption[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .map((option, index) => parseSelectOption(option, index))
    .filter((option): option is PreviewSelectOption => option !== null);
}

function isLegacyFlatContent(raw: Record<string, unknown>): boolean {
  return Array.isArray(raw['tableRows']) && !isRecord(raw['datasets']);
}

function flattenLegacyContent(raw: Record<string, unknown>): PreviewContentSlice {
  return {
    tableRows: parseRowsArray(raw['tableRows']),
    newsRows: parseNewsArray(raw['newsRows']),
    chartPoints: parseChartArray(raw['chartPoints']),
    selectOptions: parseOptionsArray(raw['selectOptions']),
    kpiValue: readNumber(raw['kpiValue']),
    kpiDelta: readNumber(raw['kpiDelta']),
    dateRangeLabel: readString(raw['dateRangeLabel'], 'Last 7 days'),
  };
}

export function flattenPreviewContent(document: PreviewContentDocument): PreviewContentSlice {
  const orders = document.datasets.orders;
  const news = document.datasets.news;
  const chart = document.datasets.revenueChart;
  const metrics = document.datasets.dashboardMetrics;
  const filters = document.datasets.filters;

  return {
    tableRows: orders?.rows.map((row) => ({ ...row })) ?? [],
    newsRows: news?.rows.map((row) => ({ ...row })) ?? [],
    chartPoints: chart?.points.map((point) => ({ ...point })) ?? [],
    selectOptions: filters?.selectOptions.map((option) => ({ ...option })) ?? [],
    kpiValue: metrics?.kpiValue ?? 0,
    kpiDelta: metrics?.kpiDelta ?? 0,
    dateRangeLabel: filters?.dateRangeLabel ?? 'Last 7 days',
  };
}

export function parsePreviewContentDocument(raw: unknown): PreviewContentDocument {
  if (!isRecord(raw)) {
    return { ...EMPTY_DOCUMENT };
  }

  if (isLegacyFlatContent(raw)) {
    const slice = flattenLegacyContent(raw);
    return {
      version: 1,
      description: 'Imported from legacy flat preview JSON',
      sources: {
        orders: {
          kind: 'rowset',
          label: 'Orders',
          table: 'orders',
          connectionEnvKey: 'DATABASE_URL',
        },
      },
      datasets: {
        orders: { rows: slice.tableRows },
        news: { rows: slice.newsRows },
        revenueChart: { points: slice.chartPoints },
        dashboardMetrics: { kpiValue: slice.kpiValue, kpiDelta: slice.kpiDelta },
        filters: {
          selectOptions: slice.selectOptions,
          dateRangeLabel: slice.dateRangeLabel,
        },
      },
    };
  }

  const sources: Record<string, PreviewContentSource> = {};
  if (isRecord(raw['sources'])) {
    for (const [key, value] of Object.entries(raw['sources'])) {
      const parsed = parseSource(value);
      if (parsed) {
        sources[key] = parsed;
      }
    }
  }

  const datasetsRaw = isRecord(raw['datasets']) ? raw['datasets'] : {};
  const ordersRaw = isRecord(datasetsRaw['orders']) ? datasetsRaw['orders'] : {};
  const newsRaw = isRecord(datasetsRaw['news']) ? datasetsRaw['news'] : {};
  const chartRaw = isRecord(datasetsRaw['revenueChart']) ? datasetsRaw['revenueChart'] : {};
  const metricsRaw = isRecord(datasetsRaw['dashboardMetrics'])
    ? datasetsRaw['dashboardMetrics']
    : {};
  const filtersRaw = isRecord(datasetsRaw['filters']) ? datasetsRaw['filters'] : {};

  return {
    version: 1,
    description: readString(raw['description']) || undefined,
    sources,
    datasets: {
      orders: {
        rows: parseRowsArray(ordersRaw['rows']),
      },
      news: {
        rows: parseNewsArray(newsRaw['rows']),
      },
      revenueChart: {
        points: parseChartArray(chartRaw['points']),
      },
      dashboardMetrics: {
        kpiValue: readNumber(metricsRaw['kpiValue']),
        kpiDelta: readNumber(metricsRaw['kpiDelta']),
      },
      filters: {
        selectOptions: parseOptionsArray(filtersRaw['selectOptions']),
        dateRangeLabel: readString(filtersRaw['dateRangeLabel'], 'Last 7 days'),
      },
    },
  };
}

export function resolvePreviewContent(raw: unknown): {
  document: PreviewContentDocument;
  slice: PreviewContentSlice;
} {
  const document = parsePreviewContentDocument(raw);
  return {
    document,
    slice: flattenPreviewContent(document),
  };
}

export const BUILTIN_PREVIEW_CONTENT: PreviewContentDocument = parsePreviewContentDocument(
  rawPreviewContent,
);

export const BUILTIN_PREVIEW_CONTENT_SLICE: PreviewContentSlice = flattenPreviewContent(
  BUILTIN_PREVIEW_CONTENT,
);

/** @deprecated Use BUILTIN_PREVIEW_CONTENT_SLICE */
export const BUILTIN_PREVIEW_SAMPLE_DATA = BUILTIN_PREVIEW_CONTENT_SLICE;

export function clonePreviewContentSlice(slice: PreviewContentSlice): PreviewContentSlice {
  return {
    tableRows: slice.tableRows.map((row) => ({ ...row })),
    newsRows: slice.newsRows.map((row) => ({ ...row })),
    chartPoints: slice.chartPoints.map((point) => ({ ...point })),
    selectOptions: slice.selectOptions.map((option) => ({ ...option })),
    kpiValue: slice.kpiValue,
    kpiDelta: slice.kpiDelta,
    dateRangeLabel: slice.dateRangeLabel,
  };
}

/** @deprecated Use clonePreviewContentSlice */
export const clonePreviewSampleData = clonePreviewContentSlice;

/** @deprecated Use resolvePreviewContent */
export function parsePreviewSampleData(raw: unknown): PreviewContentSlice {
  return resolvePreviewContent(raw).slice;
}

export function formatPreviewRowNames(rows: readonly PreviewRow[], max = 3): string {
  const names = rows
    .slice(0, max)
    .map((row) => row.name.trim())
    .filter(Boolean);
  return names.join(', ');
}

export function previewContentSourceForTable(
  document: PreviewContentDocument,
  tableName: string,
): PreviewContentSource | undefined {
  return Object.values(document.sources).find(
    (source) => source.table?.toLowerCase() === tableName.toLowerCase(),
  );
}
