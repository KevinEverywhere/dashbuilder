<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { DetailPanelProps } from './types';

	type Props = DetailPanelProps & { children?: Snippet };

	let {
		className,
		title,
		emptyMessage,
		children,
	}: Props = $props();
	const rootClass = $derived(['rd-detail', className].filter(Boolean).join(' '));
</script>

<section class={rootClass} data-testid="rd-detail">
	<header class="rd-detail__header"><span>{title ?? 'Details'}</span></header>
	{#if children}
		<div class="rd-detail__body">{@render children()}</div>
	{:else}
		<p class="rd-detail__empty">{emptyMessage ?? 'Select a row to view details'}</p>
	{/if}
</section>
