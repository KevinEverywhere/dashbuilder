<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { BarChartBar, BarChartProps } from './types';

	type Props = BarChartProps & { children?: Snippet };

	const FALLBACK_BARS: BarChartBar[] = [
		{ label: 'A', value: 40 },
		{ label: 'B', value: 65 },
		{ label: 'C', value: 55 },
		{ label: 'D', value: 80 },
		{ label: 'E', value: 48 },
	];

	let {
		className,
		title,
		bars,
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

	const rootClass = $derived(['rd-chart-bar', className].filter(Boolean).join(' '));
	const series = $derived(bars?.length ? bars : FALLBACK_BARS);
	const format = $derived(valueFormat ?? defaultFormat);
	const maxValue = $derived(Math.max(...series.map((bar) => bar.value), 1));
	const ticks = $derived.by(() => {
		const max = maxValue;
		if (max <= 0) {
			return [0];
		}
		const count = 4;
		const step = max / (count - 1);
		return Array.from({ length: count }, (_, index) => step * index);
	});
</script>

<section class={rootClass} data-testid="rd-chart-bar" role="img" aria-label={title ?? 'Bar chart'}>
	<header class="rd-chart-bar__header"><span>{title ?? 'Bar chart'}</span></header>
	<div class="rd-chart-bar__body">
		<div class="rd-chart-bar__y-axis" aria-hidden="true">
			<div class="rd-chart-bar__y-ticks">
				{#each [...ticks].reverse() as tick (tick)}
					<span class="rd-chart-bar__y-tick">{format(tick)}</span>
				{/each}
			</div>
			{#if yAxisLabel}<span class="rd-chart-bar__y-label">{yAxisLabel}</span>{/if}
		</div>
		<div class="rd-chart-bar__plot">
			<div class="rd-chart-bar__grid-lines" aria-hidden="true">
				{#each ticks as tick (tick)}
					<span class="rd-chart-bar__grid-line" style:bottom={`${(tick / maxValue) * 100}%`}></span>
				{/each}
			</div>
			<div class="rd-chart-bar__bars">
				{#each series as bar (bar.label)}
					<div class="rd-chart-bar__bar-group">
						<div class="rd-chart-bar__bar-wrap">
							<div
								class="rd-chart-bar__bar"
								style:height={`${(bar.value / maxValue) * 100}%`}
								title={`${bar.label}: ${format(bar.value)}`}
							></div>
						</div>
						<span class="rd-chart-bar__x-label">{bar.label}</span>
						<span class="rd-chart-bar__value">{format(bar.value)}</span>
					</div>
				{/each}
			</div>
		</div>
	</div>
	{@render children?.()}
</section>
