<script lang="ts">
  export type VennSet = { id: string; label: string; count: number; color?: string };
  export type VennOverlap = { setIds: string[]; count: number; label?: string };

  let {
    title,
    sets = [],
    overlaps = [],
  }: {
    title?: string;
    sets?: VennSet[];
    overlaps?: VennOverlap[];
  } = $props();

  const DEFAULT_COLORS = ['#3b82f6', '#f59e0b', '#10b981'];
  const FALLBACK_SETS: VennSet[] = [
    { id: 'a', label: 'Set A', count: 100 },
    { id: 'b', label: 'Set B', count: 80 },
  ];
  const FALLBACK_OVERLAPS: VennOverlap[] = [{ setIds: ['a', 'b'], count: 25 }];

  const chartSets = $derived(sets.length ? sets : FALLBACK_SETS);
  const chartOverlaps = $derived(overlaps.length ? overlaps : FALLBACK_OVERLAPS);
  const threeWay = $derived(chartSets.length >= 3);
</script>

<section class="rd-chart-venn" data-testid="rd-chart-venn" role="img" aria-label={title ?? 'Venn overlap chart'}>
  <header class="rd-chart-venn__header"><span>{title ?? 'Overlap diagram'}</span></header>
  <div class="rd-chart-venn__body">
    <svg viewBox="0 0 420 260" class="rd-chart-venn__svg" aria-hidden="true">
      {#if threeWay}
        <circle cx="150" cy="120" r="72" class="rd-chart-venn__circle" style:fill={chartSets[0]?.color ?? DEFAULT_COLORS[0]} />
        <circle cx="270" cy="120" r="72" class="rd-chart-venn__circle" style:fill={chartSets[1]?.color ?? DEFAULT_COLORS[1]} />
        <circle cx="210" cy="170" r="72" class="rd-chart-venn__circle" style:fill={chartSets[2]?.color ?? DEFAULT_COLORS[2]} />
        <text x="95" y="75" class="rd-chart-venn__set-label">{chartSets[0]?.label}</text>
        <text x="300" y="75" class="rd-chart-venn__set-label">{chartSets[1]?.label}</text>
        <text x="210" y="230" class="rd-chart-venn__set-label" text-anchor="middle">{chartSets[2]?.label}</text>
      {:else}
        <circle cx="155" cy="130" r="78" class="rd-chart-venn__circle" style:fill={chartSets[0]?.color ?? DEFAULT_COLORS[0]} />
        <circle cx="265" cy="130" r="78" class="rd-chart-venn__circle" style:fill={chartSets[1]?.color ?? DEFAULT_COLORS[1]} />
        <text x="105" y="130" class="rd-chart-venn__set-label">{chartSets[0]?.label}</text>
        <text x="315" y="130" class="rd-chart-venn__set-label" text-anchor="end">{chartSets[1]?.label}</text>
      {/if}
    </svg>
    <ul class="rd-chart-venn__legend">
      {#each chartSets as set, index (set.id)}
        <li>
          <span
            class="rd-chart-venn__swatch"
            style:background={set.color ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
          ></span>
          <span>{set.label}</span>
          <strong>{set.count.toLocaleString()}</strong>
        </li>
      {/each}
      {#each chartOverlaps as overlap (overlap.setIds.join('-'))}
        <li>
          <span class="rd-chart-venn__swatch rd-chart-venn__swatch--overlap"></span>
          <span>{overlap.label ?? overlap.setIds.join(' ∩ ')}</span>
          <strong>{overlap.count.toLocaleString()}</strong>
        </li>
      {/each}
    </ul>
  </div>
</section>
