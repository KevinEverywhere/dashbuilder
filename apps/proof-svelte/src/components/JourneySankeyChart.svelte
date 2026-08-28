<script lang="ts">
  export type SankeyNode = { id: string; label: string };
  export type SankeyLink = { source: string; target: string; value: number };

  let {
    title,
    nodes = [],
    links = [],
  }: {
    title?: string;
    nodes?: SankeyNode[];
    links?: SankeyLink[];
  } = $props();

  const FALLBACK_NODES: SankeyNode[] = [
    { id: 'a', label: 'Start' },
    { id: 'b', label: 'Middle' },
    { id: 'c', label: 'End' },
  ];
  const FALLBACK_LINKS: SankeyLink[] = [
    { source: 'a', target: 'b', value: 40 },
    { source: 'b', target: 'c', value: 40 },
  ];

  const WIDTH = 640;
  const HEIGHT = 280;
  const PADDING = 16;
  const NODE_WIDTH = 12;

  const layout = $derived.by(() => {
    const chartNodes = nodes.length ? nodes : FALLBACK_NODES;
    const chartLinks = links.length ? links : FALLBACK_LINKS;
    const columns = new Map<string, number>();
    const incoming = new Set(chartLinks.map((link) => link.target));
    const roots = chartNodes.filter((node) => !incoming.has(node.id));
    const queue = roots.length
      ? roots.map((node) => node.id)
      : ([chartNodes[0]?.id].filter(Boolean) as string[]);

    for (const id of queue) {
      columns.set(id, 0);
    }

    let guard = 0;
    while (guard < chartNodes.length * 2) {
      guard += 1;
      let progressed = false;
      for (const link of chartLinks) {
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

    for (const node of chartNodes) {
      if (!columns.has(node.id)) {
        columns.set(node.id, 0);
      }
    }

    const maxColumn = Math.max(...columns.values(), 0);
    const byColumn = new Map<number, SankeyNode[]>();
    for (const node of chartNodes) {
      const column = columns.get(node.id) ?? 0;
      const list = byColumn.get(column) ?? [];
      list.push(node);
      byColumn.set(column, list);
    }

    const outTotals = new Map<string, number>();
    const inTotals = new Map<string, number>();
    for (const link of chartLinks) {
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
    for (const link of chartLinks) {
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

    return { layoutNodes, paths, maxColumn, xForColumn };
  });
</script>

<section class="rd-chart-sankey" data-testid="rd-chart-sankey" role="img" aria-label={title ?? 'Journey sankey chart'}>
  <header class="rd-chart-sankey__header"><span>{title ?? 'Journey flow'}</span></header>
  <div class="rd-chart-sankey__body">
    <svg viewBox="0 0 {WIDTH} {HEIGHT}" class="rd-chart-sankey__svg" aria-hidden="true">
      {#each layout.paths as path, index (index)}
        <path d={path} class="rd-chart-sankey__link" />
      {/each}
      {#each layout.layoutNodes as node (node.id)}
        <g>
          <rect
            x={layout.xForColumn(node.column)}
            y={node.y}
            width={NODE_WIDTH}
            height={node.height}
            class="rd-chart-sankey__node"
            rx="2"
          />
          <text
            x={layout.xForColumn(node.column) + (node.column === layout.maxColumn ? NODE_WIDTH + 6 : -6)}
            y={node.y + node.height / 2}
            class="rd-chart-sankey__label"
            text-anchor={node.column === layout.maxColumn ? 'start' : 'end'}
            dominant-baseline="middle"
          >
            {node.label}
          </text>
        </g>
      {/each}
    </svg>
  </div>
</section>
