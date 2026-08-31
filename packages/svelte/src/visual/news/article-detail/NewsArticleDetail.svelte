<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { NewsArticleDetailProps } from './types';

	type Props = NewsArticleDetailProps & { children?: Snippet };

	let {
		className,
		title,
		emptyMessage,
		children,
	}: Props = $props();
	const rootClass = $derived(['rd-news-article-detail', 'rd-detail', className].filter(Boolean).join(' '));
</script>

<section class={rootClass} data-testid="rd-news-article-detail">
	<header class="rd-detail__header"><span>{title ?? 'Article'}</span></header>
	{#if children}
		<div class="rd-detail__body">{@render children()}</div>
	{:else}
		<p class="rd-detail__empty">{emptyMessage ?? 'Select a headline in News Results'}</p>
	{/if}
</section>
