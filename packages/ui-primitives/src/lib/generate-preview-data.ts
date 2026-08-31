import type {
  PreviewChartPoint,
  PreviewNewsRow,
  PreviewRow,
  PreviewScatterPoint,
  PreviewSelectOption,
} from './preview-types';
import { mapRowsToGlobeMarkers, resolveGlobeFields, type PreviewGlobeMarker } from './map-globe-markers';
import { mapRowsToScatterPoints, resolveScatterFields } from './map-scatter-points';
import {
  BUILTIN_PREVIEW_CONTENT_SLICE,
  clonePreviewContentSlice,
  type PreviewContentSlice,
} from './preview-content';

export interface PreviewBindingInput {
  id: string;
  sourceNodeId: string;
  sourcePortId: string;
  targetNodeId: string;
  targetPortId: string;
}

export interface PreviewNodeInput {
  id: string;
  type: string;
  properties?: Record<string, unknown>;
}

export interface PreviewDomainContext {
  client?: { id: string; name: string };
  project?: { id: string; name: string };
  defaultTimeRange?: string;
}

export interface PreviewDataRequest {
  projectName?: string;
  compositeName?: string;
  dateRangePreset?: string;
  domainContext?: PreviewDomainContext;
  limit?: number;
  nodes?: PreviewNodeInput[];
  bindings?: PreviewBindingInput[];
  /** Override content slice (defaults to preview-content.json). */
  contentSlice?: PreviewContentSlice;
  /** @deprecated Use contentSlice */
  sampleData?: PreviewContentSlice;
}

export interface NodePreviewSlice {
  tableRows?: PreviewRow[];
  newsRows?: PreviewNewsRow[];
  chartPoints?: PreviewChartPoint[];
  scatterPoints?: PreviewScatterPoint[];
  globeMarkers?: PreviewGlobeMarker[];
  dateRangeLabel?: string;
  linkedFromTable?: boolean;
  filteredByDateRange?: boolean;
  selectedRow?: PreviewRow | null;
  selectedNewsRow?: PreviewNewsRow | null;
  linkedToTable?: boolean;
  activeTimePreset?: string;
  skeletonLoading?: boolean;
  skeletonVariant?: string;
  skeletonLines?: number;
  linkedToData?: boolean;
}

export interface PreviewDataBundle {
  tableRows: PreviewRow[];
  newsRows: PreviewNewsRow[];
  chartPoints: PreviewChartPoint[];
  selectOptions: PreviewSelectOption[];
  kpiValue: number;
  kpiDelta: number;
  dateRangeLabel: string;
  nodes: Record<string, NodePreviewSlice>;
}

export type {
  PreviewContentDocument,
  PreviewContentSlice,
  PreviewContentSource,
  PreviewSampleData,
} from './preview-content';
export {
  BUILTIN_PREVIEW_CONTENT,
  BUILTIN_PREVIEW_CONTENT_SLICE,
  BUILTIN_PREVIEW_SAMPLE_DATA,
  clonePreviewContentSlice,
  clonePreviewSampleData,
  flattenPreviewContent,
  formatPreviewRowNames,
  parsePreviewContentDocument,
  parsePreviewSampleData,
  previewContentSourceForTable,
  resolvePreviewContent,
} from './preview-content';

export const PRESET_LABELS: Record<string, string> = {
  'last-7-days': 'Last 7 days',
  'last-30-days': 'Last 30 days',
  qtd: 'Quarter to date',
};

const PRESET_DAYS: Record<string, number> = {
  'last-7-days': 7,
  'last-30-days': 30,
  qtd: 90,
};

function resolveContentSlice(request: PreviewDataRequest): PreviewContentSlice {
  const slice =
    request.contentSlice ?? request.sampleData ?? BUILTIN_PREVIEW_CONTENT_SLICE;
  return clonePreviewContentSlice(slice);
}

export function formatIsoDate(base: Date, offsetDays: number): string {
  const date = new Date(base);
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

function readPreset(node?: PreviewNodeInput, fallback = 'last-7-days'): string {
  const preset = node?.properties?.['preset'];
  return typeof preset === 'string' ? preset : fallback;
}

function readTimePreset(node?: PreviewNodeInput, fallback = 'last-7-days'): string {
  const preset = node?.properties?.['defaultPreset'];
  return typeof preset === 'string' ? preset : fallback;
}

function isTimeFilterType(type: string): boolean {
  return type === 'visual.input.date-range' || type === 'domain.time-preset';
}

function resolveActivePreset(
  request: PreviewDataRequest,
  nodes: PreviewNodeInput[],
  domainPreset: string,
): string {
  if (request.dateRangePreset) {
    return request.dateRangePreset;
  }

  const dateRangeNode = nodes.find((node) => node.type === 'visual.input.date-range');
  if (dateRangeNode) {
    return readPreset(dateRangeNode, domainPreset);
  }

  const timePresetNode = nodes.find((node) => node.type === 'domain.time-preset');
  if (timePresetNode) {
    return readTimePreset(timePresetNode, domainPreset);
  }

  return domainPreset;
}

function filterRowsByPreset(rows: PreviewRow[], preset: string): PreviewRow[] {
  const dayCount = PRESET_DAYS[preset] ?? PRESET_DAYS['last-7-days'];
  return rows.filter((row) => {
    const rowDate = new Date(`${row.date}T00:00:00.000Z`);
    const baseDate = new Date('2026-08-08T12:00:00.000Z');
    const diffDays = Math.floor(
      (baseDate.getTime() - rowDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    return diffDays >= 0 && diffDays < dayCount;
  });
}

function rowsToChartPoints(rows: PreviewRow[]): PreviewChartPoint[] {
  if (rows.length === 0) {
    return [{ label: '—', value: 0 }];
  }

  return rows.slice(0, 5).map((row) => ({
    label: row.date.slice(5),
    value: Math.max(1, Math.round(row.amount / 1000)),
  }));
}

function resolveTableRows(
  content: PreviewContentSlice,
  request: PreviewDataRequest,
): PreviewRow[] {
  const limit = Math.min(Math.max(request.limit ?? content.tableRows.length, 3), 12);
  const clientName = request.domainContext?.client?.name?.trim();
  return content.tableRows.slice(0, limit).map((row, index) => ({
    ...row,
    id: row.id || String(index + 1),
    name: clientName ? `${clientName} — ${row.name}` : row.name,
  }));
}

function resolveNewsRows(content: PreviewContentSlice, request: PreviewDataRequest): PreviewNewsRow[] {
  const limit = Math.min(Math.max(request.limit ?? content.newsRows.length, 4), 12);
  return content.newsRows.slice(0, limit).map((row, index) => ({
    ...row,
    id: row.id || `news-${index + 1}`,
  }));
}

function resolveSelectOptions(
  content: PreviewContentSlice,
  request: PreviewDataRequest,
): PreviewSelectOption[] {
  const projectLabel = request.domainContext?.project?.name ?? request.projectName ?? 'Project';
  return [
    ...content.selectOptions.map((option) => ({ ...option })),
    { label: `${projectLabel} KPI`, value: 'project-kpi' },
  ];
}

function readNodeBoolean(node: PreviewNodeInput | undefined, key: string, fallback: boolean): boolean {
  const value = node?.properties?.[key];
  return typeof value === 'boolean' ? value : fallback;
}

function readNodeNumber(node: PreviewNodeInput | undefined, key: string, fallback: number): number {
  const value = node?.properties?.[key];
  return typeof value === 'number' ? value : fallback;
}

function readNodeString(node: PreviewNodeInput | undefined, key: string, fallback: string): string {
  const value = node?.properties?.[key];
  return typeof value === 'string' ? value : fallback;
}

function resolveSkeletonLoading(
  skeletonNode: PreviewNodeInput,
  nodes: PreviewNodeInput[],
  bindings: PreviewBindingInput[],
): boolean | undefined {
  const loadingBinding = findBindingSource(bindings, skeletonNode.id, 'loading');
  if (!loadingBinding) {
    return undefined;
  }

  const source = nodes.find((node) => node.id === loadingBinding.sourceNodeId);
  if (source?.type === 'visual.input.checkbox') {
    return readNodeBoolean(source, 'defaultChecked', false);
  }

  return undefined;
}

function findBindingSource(
  bindings: PreviewBindingInput[],
  targetNodeId: string,
  targetPortId: string,
): PreviewBindingInput | undefined {
  return bindings.find(
    (binding) =>
      binding.targetNodeId === targetNodeId && binding.targetPortId === targetPortId,
  );
}

function buildDefaultChartPoints(content: PreviewContentSlice): PreviewChartPoint[] {
  return content.chartPoints.map((point) => ({ ...point }));
}

export function resolvePreviewGraph(
  request: PreviewDataRequest = {},
): PreviewDataBundle {
  const nodes = request.nodes ?? [];
  const bindings = request.bindings ?? [];
  const domain = request.domainContext;
  const domainPreset = domain?.defaultTimeRange ?? 'last-7-days';
  const content = resolveContentSlice(request);

  const activePreset = resolveActivePreset(request, nodes, domainPreset);
  const dateRangeLabel = PRESET_LABELS[activePreset] ?? content.dateRangeLabel;

  const baseRows = resolveTableRows(content, request);
  const filteredRows = filterRowsByPreset(baseRows, activePreset);
  const newsRows = resolveNewsRows(content, request);

  const nodeSlices: Record<string, NodePreviewSlice> = {};
  const tableNodes = nodes.filter((node) => node.type === 'visual.table');
  const newsResultsNodes = nodes.filter((node) => node.type === 'visual.news.results-table');
  const chartNodes = nodes.filter(
    (node) =>
      node.type === 'visual.chart.line' ||
      node.type === 'visual.chart.bar' ||
      node.type === 'visual.chart.pie' ||
      node.type === 'visual.display.3d-bar-chart' ||
      node.type === 'visual.display.3d-scatter',
  );

  for (const tableNode of tableNodes) {
    const filterBinding = findBindingSource(bindings, tableNode.id, 'filter');
    const usesDateFilter =
      !!filterBinding &&
      nodes.some(
        (node) =>
          node.id === filterBinding.sourceNodeId && isTimeFilterType(node.type),
      );

    nodeSlices[tableNode.id] = {
      tableRows: usesDateFilter ? filteredRows : baseRows,
      filteredByDateRange: usesDateFilter,
      dateRangeLabel: usesDateFilter ? dateRangeLabel : undefined,
    };
  }

  const primaryTableRows =
    tableNodes.length > 0
      ? (nodeSlices[tableNodes[0].id]?.tableRows ?? filteredRows)
      : filteredRows;

  for (const newsNode of newsResultsNodes) {
    nodeSlices[newsNode.id] = {
      newsRows,
    };
  }

  const primaryNewsRows =
    newsResultsNodes.length > 0
      ? (nodeSlices[newsResultsNodes[0].id]?.newsRows ?? newsRows)
      : newsRows;

  for (const chartNode of chartNodes) {
    const rangeBinding = findBindingSource(bindings, chartNode.id, 'range');
    const rangeFromDateFilter =
      !!rangeBinding &&
      nodes.some(
        (node) =>
          node.id === rangeBinding.sourceNodeId && isTimeFilterType(node.type),
      );

    const linkedFromTable = tableNodes.length > 0;
    const chartRows = linkedFromTable ? primaryTableRows : filteredRows;

    nodeSlices[chartNode.id] = {
      chartPoints: rowsToChartPoints(chartRows),
      scatterPoints:
        chartNode.type === 'visual.display.3d-scatter'
          ? mapRowsToScatterPoints(
              chartRows,
              resolveScatterFields(chartNode.properties),
            )
          : undefined,
      linkedFromTable,
      filteredByDateRange: rangeFromDateFilter,
      dateRangeLabel: rangeFromDateFilter ? dateRangeLabel : undefined,
    };
  }

  const sceneNodes = nodes.filter((node) => node.type === 'visual.display.3d-scene');
  for (const sceneNode of sceneNodes) {
    const dataBinding = findBindingSource(bindings, sceneNode.id, 'data');
    const linkedFromTable =
      tableNodes.length > 0 &&
      (!dataBinding || tableNodes.some((table) => table.id === dataBinding.sourceNodeId));

    const sceneRows = linkedFromTable ? primaryTableRows : filteredRows;

    nodeSlices[sceneNode.id] = {
      chartPoints: rowsToChartPoints(sceneRows),
      scatterPoints: mapRowsToScatterPoints(sceneRows, resolveScatterFields(sceneNode.properties)),
      linkedFromTable,
    };
  }

  const globeNodes = nodes.filter((node) => node.type === 'visual.display.3d-geo-globe');
  for (const globeNode of globeNodes) {
    const dataBinding = findBindingSource(bindings, globeNode.id, 'data');
    const linkedFromTable =
      tableNodes.length > 0 &&
      (!dataBinding || tableNodes.some((table) => table.id === dataBinding.sourceNodeId));

    const globeRows = linkedFromTable ? primaryTableRows : filteredRows;

    nodeSlices[globeNode.id] = {
      globeMarkers: mapRowsToGlobeMarkers(globeRows, resolveGlobeFields(globeNode.properties)),
      linkedFromTable,
    };
  }

  for (const node of nodes) {
    if (node.type === 'visual.input.date-range') {
      nodeSlices[node.id] = {
        dateRangeLabel,
      };
    }
    if (node.type === 'domain.time-preset') {
      nodeSlices[node.id] = {
        dateRangeLabel,
        activeTimePreset: activePreset,
      };
    }
  }

  const detailNodes = nodes.filter((node) => node.type === 'visual.detail');
  for (const detailNode of detailNodes) {
    const rowBinding = findBindingSource(bindings, detailNode.id, 'row');
    const sourceTable = rowBinding
      ? tableNodes.find((table) => table.id === rowBinding.sourceNodeId)
      : undefined;
    const rows = sourceTable
      ? (nodeSlices[sourceTable.id]?.tableRows ?? filteredRows)
      : undefined;

    nodeSlices[detailNode.id] = {
      selectedRow: rows?.[0] ?? null,
      linkedToTable: !!sourceTable,
    };
  }

  const articleNodes = nodes.filter((node) => node.type === 'visual.news.article-detail');
  for (const articleNode of articleNodes) {
    const rowBinding = findBindingSource(bindings, articleNode.id, 'row');
    const sourceResults = rowBinding
      ? newsResultsNodes.find((table) => table.id === rowBinding.sourceNodeId)
      : undefined;
    const rows = sourceResults
      ? (nodeSlices[sourceResults.id]?.newsRows ?? primaryNewsRows)
      : primaryNewsRows;

    nodeSlices[articleNode.id] = {
      selectedNewsRow: rows[0] ?? null,
      linkedToTable: !!sourceResults,
    };
  }

  const hasDataVisuals =
    tableNodes.length > 0 ||
    chartNodes.length > 0 ||
    nodes.some((node) => node.type === 'visual.kpi');

  for (const skeletonNode of nodes.filter((node) => node.type === 'visual.skeleton')) {
    nodeSlices[skeletonNode.id] = {
      skeletonLoading: resolveSkeletonLoading(skeletonNode, nodes, bindings),
      skeletonVariant: readNodeString(skeletonNode, 'variant', 'table'),
      skeletonLines: readNodeNumber(skeletonNode, 'lines', 4),
      linkedToData: hasDataVisuals,
    };
  }

  return {
    tableRows: filteredRows,
    newsRows: primaryNewsRows,
    chartPoints: tableNodes.length
      ? rowsToChartPoints(primaryTableRows)
      : buildDefaultChartPoints(content),
    selectOptions: resolveSelectOptions(content, request),
    kpiValue: content.kpiValue,
    kpiDelta: content.kpiDelta,
    dateRangeLabel,
    nodes: nodeSlices,
  };
}

export function generatePreviewData(
  request: PreviewDataRequest = {},
): PreviewDataBundle {
  return resolvePreviewGraph(request);
}

export function getDefaultPreviewData(): PreviewDataBundle {
  return resolvePreviewGraph();
}
