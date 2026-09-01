import type { ComponentNode } from '@rosettadash/core';
import { estimateCanvasNodeHeight } from '../canvas/canvas-viewport';

const MARGIN = 24;
const GAP = 24;
const FILTER_WIDTH = 280;
const KPI_WIDTH = 200;
const CONTENT_WIDTH = 400;
const INFRA_WIDTH = 240;

const FILTER_TYPES = new Set([
  'visual.input.date-range',
  'visual.input.select',
  'visual.input.text',
  'visual.input.number',
  'domain.time-preset',
]);

const CHART_TYPES = new Set([
  'visual.chart.line',
  'visual.chart.bar',
  'visual.chart.pie',
]);

const TABLE_TYPES = new Set(['visual.table', 'visual.detail', 'visual.news.results-table']);

const MEDIA_TYPES = new Set([
  'visual.media.video-source',
  'visual.media.equirect-viewport',
  'visual.media.flat-video-viewport',
  'visual.media.live-capture',
  'visual.wasm.media',
]);

export type GuidedLayoutPatch = { x: number; y: number; width: number };

function nodeHeight(node: ComponentNode): number {
  return estimateCanvasNodeHeight(node);
}

/** Dashboard-style grid: domain → filters → KPIs → table|chart → media; infra on the right. */
export function computeGuidedDashboardLayout(
  nodes: ComponentNode[],
): Map<string, GuidedLayoutPatch> {
  const layoutById = new Map<string, GuidedLayoutPatch>();
  if (nodes.length === 0) {
    return layoutById;
  }

  const placed = new Set<string>();
  const take = (predicate: (node: ComponentNode) => boolean): ComponentNode[] =>
    nodes.filter((node) => {
      if (placed.has(node.id) || !predicate(node)) {
        return false;
      }
      placed.add(node.id);
      return true;
    });

  const domain = take((node) => node.type.startsWith('domain.'));
  const filters = take((node) => FILTER_TYPES.has(node.type));
  const kpis = take((node) => node.type === 'visual.kpi');
  const tables = take((node) => TABLE_TYPES.has(node.type));
  const charts = take((node) => CHART_TYPES.has(node.type));
  const media = take((node) => MEDIA_TYPES.has(node.type));
  const infra = take((node) => node.type.startsWith('infra.'));
  const rest = take(() => true);

  let y = MARGIN;
  let mainColumnRight = MARGIN + FILTER_WIDTH;

  const placeColumn = (column: ComponentNode[], width: number): void => {
    if (column.length === 0) {
      return;
    }
    for (const node of column) {
      layoutById.set(node.id, { x: MARGIN, y, width });
      mainColumnRight = Math.max(mainColumnRight, MARGIN + width);
      y += nodeHeight(node) + GAP;
    }
  };

  const placeRow = (row: ComponentNode[], width: number): void => {
    if (row.length === 0) {
      return;
    }
    let x = MARGIN;
    let rowHeight = 0;
    for (const node of row) {
      layoutById.set(node.id, { x, y, width });
      x += width + GAP;
      rowHeight = Math.max(rowHeight, nodeHeight(node));
      mainColumnRight = Math.max(mainColumnRight, x - GAP);
    }
    y += rowHeight + GAP;
  };

  placeColumn(domain, FILTER_WIDTH);
  placeRow(filters, FILTER_WIDTH);
  placeRow(kpis, KPI_WIDTH);

  if (tables.length > 0 && charts.length > 0) {
    const table = tables[0]!;
    const chart = charts[0]!;
    const rowHeight = Math.max(nodeHeight(table), nodeHeight(chart));
    layoutById.set(table.id, { x: MARGIN, y, width: CONTENT_WIDTH });
    layoutById.set(chart.id, {
      x: MARGIN + CONTENT_WIDTH + GAP,
      y,
      width: CONTENT_WIDTH,
    });
    mainColumnRight = Math.max(mainColumnRight, MARGIN + CONTENT_WIDTH * 2 + GAP);
    y += rowHeight + GAP;

    for (const node of tables.slice(1)) {
      layoutById.set(node.id, { x: MARGIN, y, width: CONTENT_WIDTH });
      mainColumnRight = Math.max(mainColumnRight, MARGIN + CONTENT_WIDTH);
      y += nodeHeight(node) + GAP;
    }
    for (const node of charts.slice(1)) {
      layoutById.set(node.id, {
        x: MARGIN + CONTENT_WIDTH + GAP,
        y,
        width: CONTENT_WIDTH,
      });
      mainColumnRight = Math.max(mainColumnRight, MARGIN + CONTENT_WIDTH * 2 + GAP);
      y += nodeHeight(node) + GAP;
    }
  } else {
    placeRow(tables, CONTENT_WIDTH);
    placeRow(charts, CONTENT_WIDTH);
  }

  placeRow(media, CONTENT_WIDTH);
  placeColumn(rest, FILTER_WIDTH);

  if (infra.length > 0) {
    const infraX = mainColumnRight + GAP;
    let infraY = MARGIN;
    for (const node of infra) {
      layoutById.set(node.id, { x: infraX, y: infraY, width: INFRA_WIDTH });
      infraY += nodeHeight(node) + GAP;
    }
  }

  return layoutById;
}

/** Re-layout template nodes using canvas height estimates so previews do not overlap. */
export function layoutTemplateNodes(nodes: ComponentNode[]): ComponentNode[] {
  const layoutById = computeGuidedDashboardLayout(nodes);
  return nodes.map((node) => {
    const patch = layoutById.get(node.id);
    if (!patch) {
      return node;
    }

    const nextLayout = {
      ...(node.layout ?? { x: MARGIN, y: MARGIN, width: FILTER_WIDTH, height: 72 }),
      x: patch.x,
      y: patch.y,
      width: patch.width,
    };
    const withLayout: ComponentNode = { ...node, layout: nextLayout };
    return {
      ...withLayout,
      layout: {
        ...nextLayout,
        height: nodeHeight(withLayout),
      },
    };
  });
}

export interface GuidedBindingSpec {
  sourceNodeId: string;
  sourcePortId: string;
  targetNodeId: string;
  targetPortId: string;
}

/** Compatible wiring for common guided dashboard / media patterns. */
export function computeGuidedBindings(nodes: ComponentNode[]): GuidedBindingSpec[] {
  const specs: GuidedBindingSpec[] = [];
  const byType = (type: string) => nodes.filter((node) => node.type === type);
  const charts = nodes.filter((node) => CHART_TYPES.has(node.type));

  const dateRanges = byType('visual.input.date-range');
  const tables = byType('visual.table');
  const details = byType('visual.detail');
  const postgres = byType('infra.postgresql');

  for (const filter of dateRanges) {
    for (const table of tables) {
      specs.push({
        sourceNodeId: filter.id,
        sourcePortId: 'range',
        targetNodeId: table.id,
        targetPortId: 'filter',
      });
    }
    for (const chart of charts) {
      specs.push({
        sourceNodeId: filter.id,
        sourcePortId: 'range',
        targetNodeId: chart.id,
        targetPortId: 'range',
      });
    }
  }

  for (const pg of postgres) {
    for (const table of tables) {
      specs.push({
        sourceNodeId: pg.id,
        sourcePortId: 'rowset',
        targetNodeId: table.id,
        targetPortId: 'data',
      });
    }
    for (const chart of charts) {
      specs.push({
        sourceNodeId: pg.id,
        sourcePortId: 'rowset',
        targetNodeId: chart.id,
        targetPortId: 'data',
      });
    }
  }

  for (const table of tables) {
    for (const detail of details) {
      specs.push({
        sourceNodeId: table.id,
        sourcePortId: 'selected-row',
        targetNodeId: detail.id,
        targetPortId: 'row',
      });
    }
  }

  const liveCaptures = byType('visual.media.live-capture');
  const videoSources = byType('visual.media.video-source');
  const equirectViewports = byType('visual.media.equirect-viewport');
  const flatViewports = byType('visual.media.flat-video-viewport');
  const wasmMedia = byType('visual.wasm.media');

  for (const capture of liveCaptures) {
    for (const video of videoSources) {
      specs.push({
        sourceNodeId: capture.id,
        sourcePortId: 'capture-blob',
        targetNodeId: video.id,
        targetPortId: 'capture-blob',
      });
    }
  }

  for (const video of videoSources) {
    for (const viewport of [...equirectViewports, ...flatViewports]) {
      specs.push({
        sourceNodeId: video.id,
        sourcePortId: 'metadata',
        targetNodeId: viewport.id,
        targetPortId: 'metadata',
      });
    }
    for (const wasm of wasmMedia) {
      specs.push({
        sourceNodeId: video.id,
        sourcePortId: 'video-file',
        targetNodeId: wasm.id,
        targetPortId: 'input-file',
      });
    }
  }

  for (const viewport of [...equirectViewports, ...flatViewports]) {
    for (const wasm of wasmMedia) {
      specs.push({
        sourceNodeId: viewport.id,
        sourcePortId: 'crop-region',
        targetNodeId: wasm.id,
        targetPortId: 'crop-region',
      });
    }
  }

  return specs;
}
