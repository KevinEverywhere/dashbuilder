/** Last N destinations cannot pin to the top of a short sidebar; highlight is the cue. */
export const DESTINATION_LIST_TAIL_COUNT = 6;

export function destinationListPinsToTop(index: number, total: number): boolean {
  return index >= 0 && index < total - DESTINATION_LIST_TAIL_COUNT;
}

export function findDestinationListRow(
  root: ParentNode | null | undefined,
  selectedId: string,
): HTMLElement | null {
  if (!root || !selectedId) {
    return null;
  }
  const button = root.querySelector<HTMLElement>(`[data-dest-id="${CSS.escape(selectedId)}"]`);
  return button?.closest('li') ?? button;
}

export function scrollSelectedDestinationIntoList(
  selectedEl: Element | null | undefined,
  index: number,
  total: number,
): void {
  if (!selectedEl || index < 0) {
    return;
  }
  selectedEl.scrollIntoView({
    behavior: 'smooth',
    block: destinationListPinsToTop(index, total) ? 'start' : 'nearest',
  });
}
