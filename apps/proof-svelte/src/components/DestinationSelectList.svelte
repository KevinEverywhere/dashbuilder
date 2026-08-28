<script lang="ts">
  import { findDestinationListRow, scrollSelectedDestinationIntoList } from '@destination-atlas';

  export interface DestinationSelectItem {
    id: string;
    label: string;
    meta?: string;
  }

  let {
    listTitle = 'Destinations',
    items,
    selectedId,
    onSelect,
  }: {
    listTitle?: string;
    items: DestinationSelectItem[];
    selectedId?: string;
    onSelect?: (id: string) => void;
  } = $props();
</script>

<section
  class="rd-destination-list"
  aria-label={listTitle}
  {@attach (node) => {
    $effect(() => {
      const id = selectedId;
      const list = items;
      if (!id) {
        return;
      }
      const index = list.findIndex((item) => item.id === id);
      scrollSelectedDestinationIntoList(findDestinationListRow(node, id), index, list.length);
    });
  }}
>
  <header class="rd-destination-list__header">
    <h3>{listTitle}</h3>
    <span class="rd-destination-list__count">{items.length}</span>
  </header>
  <ul class="rd-destination-list__items">
    {#each items as item (item.id)}
      <li
        class="rd-destination-list__item"
        class:rd-destination-list__item--selected={item.id === selectedId}
      >
        <button
          type="button"
          class="rd-destination-list__button"
          data-dest-id={item.id}
          aria-current={item.id === selectedId ? 'true' : undefined}
          onclick={() => onSelect?.(item.id)}
        >
          <span class="rd-destination-list__label">{item.label}</span>
          {#if item.meta}<span class="rd-destination-list__meta">{item.meta}</span>{/if}
        </button>
      </li>
    {/each}
  </ul>
</section>
