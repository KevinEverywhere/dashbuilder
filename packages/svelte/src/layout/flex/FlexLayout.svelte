<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { FlexLayoutProps } from './types';

	type Props = FlexLayoutProps & { children?: Snippet };

	let {
		className,
		title,
		direction,
		gap,
		density,
		children,
	}: Props = $props();
	const flexGap = $derived(typeof gap === 'number' ? gap : 12);
	const rootClass = $derived(
		['rd-flex', density === 'compact' ? 'rd-flex--compact' : '', className].filter(Boolean).join(' '),
	);
</script>

<section class={rootClass} data-testid="rd-flex">
	{#if title}<span class="rd-flex__title">{title}</span>{/if}
	<div class="rd-flex__flex" style:flex-direction={direction ?? 'row'} style:gap="{flexGap}px">{@render children?.()}</div>
</section>
