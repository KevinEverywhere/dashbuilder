<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { DataTableColumn, DataTableProps, DataTableRow } from './types';

	type Props = DataTableProps & { children?: Snippet };

	const DEFAULT_COLUMNS: DataTableColumn[] = [
		{ key: 'name', header: 'Name' },
		{ key: 'status', header: 'Status' },
		{ key: 'amount', header: 'Amount', align: 'right' },
		{ key: 'date', header: 'Date', align: 'right' },
	];

	let {
		className,
		title,
		rows,
		columns,
		selectedRowId,
		onRowSelect,
		children,
	}: Props = $props();
	const rootClass = $derived(['rd-table', className].filter(Boolean).join(' '));
	const selectable = $derived(Boolean(onRowSelect));
	const resolvedColumns = $derived(columns?.length ? columns : DEFAULT_COLUMNS);

	function cellValue(row: DataTableRow, column: DataTableColumn): string {
		const raw = row[column.key];
		if (column.format) {
			return column.format(raw, row);
		}
		if (raw === undefined || raw === null) {
			return '—';
		}
		return String(raw);
	}
</script>

<section class={rootClass} data-testid="rd-table">
	<header class="rd-table__header"><span>{title ?? 'Data table'}</span></header>
	<div class="rd-table__scroll">
		<table class="rd-table__table">
			<thead>
				<tr>
					{#each resolvedColumns as column (column.key)}
						<th
							class={column.align ? `rd-table__cell--${column.align}` : undefined}
							style:width={column.width}
						>
							{column.header}
						</th>
					{/each}
				</tr>
			</thead>
			<tbody>
				{#each rows ?? [] as row (row.id)}
				<tr
					class="rd-table__row"
					class:rd-table__row--selected={row.id === selectedRowId}
					class:rd-table__row--interactive={selectable}
					aria-selected={row.id === selectedRowId ? 'true' : undefined}
					onclick={selectable ? () => onRowSelect?.(row.id) : undefined}
				>
					{#each resolvedColumns as column (column.key)}
						<td
							class={column.align ? `rd-table__cell--${column.align}` : undefined}
							style:width={column.width}
						>
							{cellValue(row, column)}
						</td>
					{/each}
				</tr>
				{/each}
			</tbody>
		</table>
	</div>
	{@render children?.()}
</section>
