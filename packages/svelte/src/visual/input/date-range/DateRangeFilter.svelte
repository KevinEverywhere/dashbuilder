<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { DateRangeFilterProps } from './types';

	type Props = DateRangeFilterProps & { children?: Snippet };

	let {
		className,
		label,
		startDate,
		endDate,
		presetLabel,
		granularity,
		onChange,
		children,
	}: Props = $props();
	const rootClass = $derived(['rd-input-date-range', className].filter(Boolean).join(' '));
	const inputType = $derived(granularity === 'month' ? 'month' : 'date');
</script>

<section class={rootClass} data-testid="rd-input-date-range">
	{#if label}<span class="rd-field__label">{label}</span>{/if}
	<div class="rd-date-range__controls">
		<input
			type={inputType}
			class="rd-input"
			value={startDate ?? ''}
			aria-label={`${label ?? 'Date range'} start`}
			onchange={(event) =>
				onChange?.({ startDate: event.currentTarget.value, endDate: endDate ?? '' })}
		/>
		<span class="rd-date-range__sep">to</span>
		<input
			type={inputType}
			class="rd-input"
			value={endDate ?? ''}
			aria-label={`${label ?? 'Date range'} end`}
			onchange={(event) =>
				onChange?.({ startDate: startDate ?? '', endDate: event.currentTarget.value })}
		/>
	</div>
	{#if presetLabel}<span class="rd-date-range__preset">{presetLabel}</span>{/if}
	{@render children?.()}
</section>
