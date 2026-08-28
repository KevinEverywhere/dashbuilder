<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { ScrollRegionProps } from './types';

	type Props = ScrollRegionProps & { children?: Snippet };

	let {
		className,
		title,
		maxHeight,
		overlayScrollbar,
		children,
	}: Props = $props();
	const rootClass = $derived(['rd-scroll-region', className].filter(Boolean).join(' '));
</script>

<section
	class={[rootClass, overlayScrollbar === false ? '' : 'rd-scroll-region--overlay-scrollbar'].filter(Boolean).join(' ')}
	data-testid="rd-scroll-region"
	aria-label={title ?? 'Scrollable content'}
	style={maxHeight ? `max-height: ${maxHeight}` : undefined}
>
	{#if title}<header class="rd-scroll-region__header">{title}</header>{/if}
	<div class="rd-scroll-region__body">{@render children?.()}</div>
</section>
