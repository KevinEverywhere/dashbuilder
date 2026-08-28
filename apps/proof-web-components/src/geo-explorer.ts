import { findDestinationListRow, scrollSelectedDestinationIntoList } from '@destination-atlas';

export type GeoExplorerListPlacement = 'left' | 'right';

export interface DestinationSelectItem {
  id: string;
  label: string;
  meta?: string;
}

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (ch) => {
    switch (ch) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      default:
        return '&#39;';
    }
  });
}

export function destinationListMarkup(
  items: DestinationSelectItem[],
  selectedId: string,
  listTitle = 'Destinations',
): string {
  const rows = items
    .map((item) => {
      const selected = item.id === selectedId;
      return `
        <li class="rd-destination-list__item${selected ? ' rd-destination-list__item--selected' : ''}">
          <button
            type="button"
            class="rd-destination-list__button"
            data-dest-id="${escapeHtml(item.id)}"
            ${selected ? 'aria-current="true"' : ''}
          >
            <span class="rd-destination-list__label">${escapeHtml(item.label)}</span>
            ${item.meta ? `<span class="rd-destination-list__meta">${escapeHtml(item.meta)}</span>` : ''}
          </button>
        </li>`;
    })
    .join('');

  return `
    <section class="rd-destination-list" aria-label="${escapeHtml(listTitle)}">
      <header class="rd-destination-list__header">
        <h3>${escapeHtml(listTitle)}</h3>
        <span class="rd-destination-list__count">${items.length}</span>
      </header>
      <ul class="rd-destination-list__items">${rows}</ul>
    </section>`;
}

export function geoExplorerMarkup(
  viewportHtml: string,
  items: DestinationSelectItem[],
  selectedId: string,
  listPlacement: GeoExplorerListPlacement,
): string {
  const listClass =
    listPlacement === 'left'
      ? 'rd-geo-explorer__body rd-geo-explorer__body--list-left'
      : 'rd-geo-explorer__body rd-geo-explorer__body--list-right';
  return `
    <section class="rd-geo-explorer" data-testid="rd-geo-explorer">
      <div class="${listClass}">
        <div class="rd-geo-explorer__viewport">${viewportHtml}</div>
        <div class="rd-geo-explorer__list">${destinationListMarkup(items, selectedId)}</div>
      </div>
    </section>`;
}

export function syncDestinationListSelection(root: ParentNode, selectedId: string): void {
  root.querySelectorAll<HTMLButtonElement>('[data-dest-id]').forEach((button) => {
    const selected = button.dataset.destId === selectedId;
    button.closest('li')?.classList.toggle('rd-destination-list__item--selected', selected);
    if (selected) {
      button.setAttribute('aria-current', 'true');
    } else {
      button.removeAttribute('aria-current');
    }
  });
}

export function scrollDestinationListToSelection(
  root: ParentNode,
  items: ReadonlyArray<{ id: string }>,
  selectedId: string,
): void {
  const index = items.findIndex((item) => item.id === selectedId);
  scrollSelectedDestinationIntoList(findDestinationListRow(root, selectedId), index, items.length);
}
