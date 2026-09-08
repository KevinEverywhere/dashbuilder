<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { NewsResultsRow, NewsResultsTableProps } from './types';

  type Props = NewsResultsTableProps & {
    rows?: NewsResultsRow[];
    selectedRowId?: string;
    onRowSelect?: (rowId: string) => void;
    /** Headlines open the publisher URL. Default true when `onRowSelect` is omitted. */
    linkHeadlines?: boolean;
    children?: Snippet;
  };

  let {
    className,
    title,
    rows = [],
    selectedRowId,
    onRowSelect,
    linkHeadlines,
    children,
  }: Props = $props();

  const headlineLinks = $derived(linkHeadlines ?? onRowSelect === undefined);

  const rootClass = $derived(['rd-news-results-table', 'rd-table', className].filter(Boolean).join(' '));

  function openRow(row: NewsResultsRow): void {
    if (!headlineLinks) {
      onRowSelect?.(row.id);
      return;
    }
    if (row.url) {
      window.open(row.url, '_blank', 'noopener,noreferrer');
    }
  }
</script>

<section class={rootClass} data-testid="rd-news-results-table">
  <header class="rd-table__header">
    <span>{title ?? 'News results'}</span>
    {#if rows.length}
      <span class="rd-table__count">{rows.length} articles</span>
    {/if}
  </header>
  <div class="rd-table__scroll">
    <table class="rd-table__table">
      <thead>
        <tr>
          <th>Headline</th>
          <th>Source</th>
          <th>Region</th>
          <th>Published</th>
        </tr>
      </thead>
      <tbody>
        {#each rows as row (row.id)}
          <tr
            class={[
              'rd-table__row',
              selectedRowId === row.id ? 'rd-table__row--selected' : '',
              'rd-table__row--interactive',
            ]
              .filter(Boolean)
              .join(' ')}
            aria-selected={selectedRowId === row.id || undefined}
            onclick={() => openRow(row)}
          >
            <td>
              {#if row.url && headlineLinks}
                <a
                  href={row.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="rd-news-results-table__link"
                  onclick={(event) => event.stopPropagation()}
                >
                  {row.headline ?? '—'}
                </a>
              {:else}
                {row.headline ?? '—'}
              {/if}
            </td>
            <td>{row.source ?? '—'}</td>
            <td>{row.region ?? '—'}</td>
            <td>{row.published ?? '—'}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
  {@render children?.()}
</section>
