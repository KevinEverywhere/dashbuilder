<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { DataTableProps } from './types';

	type Props = DataTableProps & { children?: Snippet };

	let {
		className,
		title,
		rows,
		selectedRowId,
		onRowSelect,
		children,
	}: Props = $props();
	const rootClass = $derived(['rd-table', className].filter(Boolean).join(' '));
	const selectable = $derived(Boolean(onRowSelect));
</script>

<section class={rootClass} data-testid="rd-table">
	<header class="rd-table__header"><span>{title ?? 'Data table'}</span></header>
	<div class="rd-table__scroll">
		<table class="rd-table__table">
			<thead><tr><th>Name</th><th>Status</th><th>Amount</th><th>Date</th></tr></thead>
			<tbody>
				{#each rows ?? [] as row (row.id)}
				<tr
					class="rd-table__row"
					class:rd-table__row--selected={row.id === selectedRowId}
					class:rd-table__row--interactive={selectable}
					aria-selected={row.id === selectedRowId ? 'true' : undefined}
					onclick={selectable ? () => onRowSelect?.(row.id) : undefined}
				>
					<td>{row.name}</td><td>{row.status}</td><td>{row.amount}</td><td>{row.date}</td>
				</tr>
				{/each}
			</tbody>
		</table>
	</div>
	{@render children?.()}
</section>
