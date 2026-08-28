<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { NewsTypeSelectProps } from './types';

	type Props = NewsTypeSelectProps & { children?: Snippet };

	let {
		className,
		label,
		placeholder,
		options,
		value,
		children,
	}: Props = $props();
	const rootClass = $derived(['rd-news-type-select', className].filter(Boolean).join(' '));
</script>

<section class={rootClass} data-testid="rd-news-type-select">
	{#if label}<span class="rd-field__label">{label}</span>{/if}
	<select class="rd-select">
		<option value="" selected={!(value ?? '')}>{placeholder ?? 'Select…'}</option>
		{#each options ?? [] as o (o.value)}<option value={o.value} selected={o.value === (value ?? '')}>{o.label}</option>{/each}
	</select>
	{@render children?.()}
</section>
