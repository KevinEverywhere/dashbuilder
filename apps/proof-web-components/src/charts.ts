import { escapeHtml } from './geo-explorer.js';

export interface SankeyNode {
  id: string;
  label: string;
}

export interface SankeyLink {
  source: string;
  target: string;
  value: number;
}

export interface VennSet {
  id: string;
  label: string;
  count: number;
  color?: string;
}

export interface VennOverlap {
  setIds: string[];
  count: number;
  label?: string;
}

const WIDTH = 640;
const HEIGHT = 280;
const PADDING = 16;
const NODE_WIDTH = 12;
const DEFAULT_VENN_COLORS = ['#3b82f6', '#f59e0b', '#10b981'];

export function sankeyChartMarkup(
  title: string,
  nodes: SankeyNode[],
  links: SankeyLink[],
): string {
  const columns = new Map<string, number>();
  const incoming = new Set(links.map((link) => link.target));
  const roots = nodes.filter((node) => !incoming.has(node.id));
  const queue = roots.length ? roots.map((node) => node.id) : ([nodes[0]?.id].filter(Boolean) as string[]);
  for (const id of queue) {
    columns.set(id, 0);
  }

  let guard = 0;
  while (guard < nodes.length * 2) {
    guard += 1;
    let progressed = false;
    for (const link of links) {
      const sourceCol = columns.get(link.source);
      if (sourceCol === undefined) {
        continue;
      }
      const nextCol = sourceCol + 1;
      const existing = columns.get(link.target);
      if (existing === undefined || nextCol > existing) {
        columns.set(link.target, nextCol);
        progressed = true;
      }
    }
    if (!progressed) {
      break;
    }
  }

  for (const node of nodes) {
    if (!columns.has(node.id)) {
      columns.set(node.id, 0);
    }
  }

  const maxColumn = Math.max(...columns.values(), 0);
  const byColumn = new Map<number, SankeyNode[]>();
  for (const node of nodes) {
    const column = columns.get(node.id) ?? 0;
    const list = byColumn.get(column) ?? [];
    list.push(node);
    byColumn.set(column, list);
  }

  const outTotals = new Map<string, number>();
  const inTotals = new Map<string, number>();
  for (const link of links) {
    outTotals.set(link.source, (outTotals.get(link.source) ?? 0) + link.value);
    inTotals.set(link.target, (inTotals.get(link.target) ?? 0) + link.value);
  }

  type LayoutNode = SankeyNode & { column: number; y: number; height: number };
  const layoutNodes: LayoutNode[] = [];
  for (const [column, columnNodes] of byColumn.entries()) {
    const totalValue = columnNodes.reduce(
      (sum, node) => sum + Math.max(outTotals.get(node.id) ?? 0, inTotals.get(node.id) ?? 0, 1),
      0,
    );
    let yCursor = PADDING;
    for (const node of columnNodes) {
      const nodeValue = Math.max(outTotals.get(node.id) ?? 0, inTotals.get(node.id) ?? 0, 1);
      const height = Math.max(((HEIGHT - PADDING * 2) * nodeValue) / totalValue, 18);
      layoutNodes.push({ ...node, column, y: yCursor, height });
      yCursor += height + 10;
    }
  }

  const nodeMap = new Map(layoutNodes.map((node) => [node.id, node]));
  const xForColumn = (column: number) =>
    PADDING + (column / Math.max(maxColumn, 1)) * (WIDTH - PADDING * 2 - NODE_WIDTH);

  const paths: string[] = [];
  for (const link of links) {
    const source = nodeMap.get(link.source);
    const target = nodeMap.get(link.target);
    if (!source || !target) {
      continue;
    }
    const sourceTotal = outTotals.get(link.source) ?? link.value;
    const linkHeight = Math.max((source.height * link.value) / sourceTotal, 4);
    const x1 = xForColumn(source.column) + NODE_WIDTH;
    const x2 = xForColumn(target.column);
    const y1 = source.y + source.height / 2 - linkHeight / 2;
    const y2 = target.y + target.height / 2 - linkHeight / 2;
    const midX = (x1 + x2) / 2;
    paths.push(
      `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2} L ${x2} ${y2 + linkHeight} C ${midX} ${y2 + linkHeight}, ${midX} ${y1 + linkHeight}, ${x1} ${y1 + linkHeight} Z`,
    );
  }

  const pathMarkup = paths.map((d) => `<path d="${d}" class="rd-chart-sankey__link" />`).join('');
  const nodeMarkup = layoutNodes
    .map((node) => {
      const x = xForColumn(node.column);
      const anchor = node.column === maxColumn ? 'start' : 'end';
      const tx = x + (node.column === maxColumn ? NODE_WIDTH + 6 : -6);
      return `
        <g>
          <rect x="${x}" y="${node.y}" width="${NODE_WIDTH}" height="${node.height}" class="rd-chart-sankey__node" rx="2" />
          <text x="${tx}" y="${node.y + node.height / 2}" class="rd-chart-sankey__label" text-anchor="${anchor}" dominant-baseline="middle">${escapeHtml(node.label)}</text>
        </g>`;
    })
    .join('');

  return `
    <section class="rd-chart-sankey" data-testid="rd-chart-sankey" role="img" aria-label="${escapeHtml(title)}">
      <header class="rd-chart-sankey__header"><span>${escapeHtml(title)}</span></header>
      <div class="rd-chart-sankey__body">
        <svg viewBox="0 0 ${WIDTH} ${HEIGHT}" class="rd-chart-sankey__svg" aria-hidden="true">
          ${pathMarkup}${nodeMarkup}
        </svg>
      </div>
    </section>`;
}

export function vennChartMarkup(title: string, sets: VennSet[], overlaps: VennOverlap[]): string {
  const threeWay = sets.length >= 3;
  const circles = threeWay
    ? `
      <circle cx="150" cy="120" r="72" class="rd-chart-venn__circle" style="fill:${sets[0]?.color ?? DEFAULT_VENN_COLORS[0]}" />
      <circle cx="270" cy="120" r="72" class="rd-chart-venn__circle" style="fill:${sets[1]?.color ?? DEFAULT_VENN_COLORS[1]}" />
      <circle cx="210" cy="170" r="72" class="rd-chart-venn__circle" style="fill:${sets[2]?.color ?? DEFAULT_VENN_COLORS[2]}" />
      <text x="95" y="75" class="rd-chart-venn__set-label">${escapeHtml(sets[0]?.label ?? '')}</text>
      <text x="300" y="75" class="rd-chart-venn__set-label">${escapeHtml(sets[1]?.label ?? '')}</text>
      <text x="210" y="230" class="rd-chart-venn__set-label" text-anchor="middle">${escapeHtml(sets[2]?.label ?? '')}</text>`
    : `
      <circle cx="155" cy="130" r="78" class="rd-chart-venn__circle" style="fill:${sets[0]?.color ?? DEFAULT_VENN_COLORS[0]}" />
      <circle cx="265" cy="130" r="78" class="rd-chart-venn__circle" style="fill:${sets[1]?.color ?? DEFAULT_VENN_COLORS[1]}" />
      <text x="105" y="130" class="rd-chart-venn__set-label">${escapeHtml(sets[0]?.label ?? '')}</text>
      <text x="315" y="130" class="rd-chart-venn__set-label" text-anchor="end">${escapeHtml(sets[1]?.label ?? '')}</text>`;

  const legend = [
    ...sets.map(
      (set, index) => `
        <li>
          <span class="rd-chart-venn__swatch" style="background:${set.color ?? DEFAULT_VENN_COLORS[index % DEFAULT_VENN_COLORS.length]}"></span>
          <span>${escapeHtml(set.label)}</span>
          <strong>${set.count.toLocaleString()}</strong>
        </li>`,
    ),
    ...overlaps.map(
      (overlap) => `
        <li>
          <span class="rd-chart-venn__swatch rd-chart-venn__swatch--overlap"></span>
          <span>${escapeHtml(overlap.label ?? overlap.setIds.join(' ∩ '))}</span>
          <strong>${overlap.count.toLocaleString()}</strong>
        </li>`,
    ),
  ].join('');

  return `
    <section class="rd-chart-venn" data-testid="rd-chart-venn" role="img" aria-label="${escapeHtml(title)}">
      <header class="rd-chart-venn__header"><span>${escapeHtml(title)}</span></header>
      <div class="rd-chart-venn__body">
        <svg viewBox="0 0 420 260" class="rd-chart-venn__svg" aria-hidden="true">${circles}</svg>
        <ul class="rd-chart-venn__legend">${legend}</ul>
      </div>
    </section>`;
}
