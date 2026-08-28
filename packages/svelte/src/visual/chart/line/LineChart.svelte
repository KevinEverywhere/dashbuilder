<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { LineChartPoint, LineChartProps } from './types';

	type Props = LineChartProps & { children?: Snippet };

	const FALLBACK_POINTS: LineChartPoint[] = [
		{ x: '2019', y: 42 },
		{ x: '2020', y: 18 },
		{ x: '2021', y: 12 },
		{ x: '2022', y: 19 },
		{ x: '2023', y: 31 },
		{ x: '2024', y: 36 },
	];

	const CHART_WIDTH = 320;
	const CHART_HEIGHT = 200;
	const PAD_LEFT = 58;
	const PAD_RIGHT = 12;
	const PAD_TOP = 16;
	const PAD_BOTTOM = 36;
	const Y_TICK_X = PAD_LEFT - 6;

	let {
		className,
		title,
		points,
		xAxisLabel,
		yAxisLabel,
		valueFormat,
		children,
	}: Props = $props();

	function defaultFormat(value: number): string {
		if (value >= 1_000_000) {
			return `${(value / 1_000_000).toFixed(1)}M`;
		}
		if (value >= 1_000) {
			return `${(value / 1_000).toFixed(0)}K`;
		}
		return String(Math.round(value));
	}

	const rootClass = $derived(['rd-chart-line', className].filter(Boolean).join(' '));
	const series = $derived(points?.length ? points : FALLBACK_POINTS);
	const format = $derived(valueFormat ?? defaultFormat);
	const values = $derived(series.map((point) => point.y));
	const minY = $derived(Math.min(...values) >= 0 ? 0 : Math.min(...values));
	const maxY = $derived(Math.max(...values));
	const rangeY = $derived(maxY - minY || 1);
	const ticks = $derived.by(() => {
		if (minY === maxY) {
			return [minY];
		}
		const count = 4;
		const step = (maxY - minY) / (count - 1);
		return Array.from({ length: count }, (_, index) => minY + step * index);
	});
	const plotH = CHART_HEIGHT - PAD_TOP - PAD_BOTTOM;
	const coords = $derived.by(() => {
		const plotW = CHART_WIDTH - PAD_LEFT - PAD_RIGHT;
		const lastIndex = Math.max(series.length - 1, 1);
		return series.map((point, index) => {
			const x = PAD_LEFT + (index / lastIndex) * plotW;
			const y = PAD_TOP + plotH - ((point.y - minY) / rangeY) * plotH;
			return { x, y, label: String(point.x) };
		});
	});
	const polyline = $derived(coords.map(({ x, y }) => `${x},${y}`).join(' '));
</script>

<section class={rootClass} data-testid="rd-chart-line" role="img" aria-label={title ?? 'Line chart'}>
	<header class="rd-chart-line__header"><span>{title ?? 'Line chart'}</span></header>
	<div class="rd-chart-line__body">
		<svg viewBox="0 0 {CHART_WIDTH} {CHART_HEIGHT}" class="rd-chart-line__svg" aria-hidden="true">
			{#each ticks as tick (tick)}
				{@const y = PAD_TOP + plotH - ((tick - minY) / rangeY) * plotH}
				<g class="rd-chart-line__tick">
					<line x1={PAD_LEFT} y1={y} x2={CHART_WIDTH - PAD_RIGHT} y2={y} class="rd-chart-line__grid" />
					<text x={Y_TICK_X} y={y + 4} class="rd-chart-line__tick-label">{format(tick)}</text>
				</g>
			{/each}
			<polyline class="rd-chart-line__line" points={polyline} />
			{#each coords as point (point.label)}
				<g class="rd-chart-line__point">
					<circle cx={point.x} cy={point.y} r="3.5" class="rd-chart-line__dot" />
					<text x={point.x} y={CHART_HEIGHT - 10} class="rd-chart-line__x-label">{point.label}</text>
				</g>
			{/each}
			{#if yAxisLabel}
				<text
					x="12"
					y={PAD_TOP + plotH / 2}
					class="rd-chart-line__axis-label rd-chart-line__axis-label--y">{yAxisLabel}</text
				>
			{/if}
			{#if xAxisLabel}
				<text
					x={PAD_LEFT + (CHART_WIDTH - PAD_LEFT - PAD_RIGHT) / 2}
					y={CHART_HEIGHT - 2}
					class="rd-chart-line__axis-label rd-chart-line__axis-label--x">{xAxisLabel}</text
				>
			{/if}
		</svg>
	</div>
	{@render children?.()}
</section>
