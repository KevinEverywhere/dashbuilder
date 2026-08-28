import { DESTINATION_LIST_TAIL_COUNT, destinationListPinsToTop } from './destination-list-scroll.js';

describe('destination-list-scroll', () => {
  it('pins every city except the last six to the top', () => {
    const total = 30;
    expect(destinationListPinsToTop(0, total)).toBe(true);
    expect(destinationListPinsToTop(23, total)).toBe(true);
    expect(destinationListPinsToTop(24, total)).toBe(false);
    expect(destinationListPinsToTop(29, total)).toBe(false);
    expect(total - DESTINATION_LIST_TAIL_COUNT).toBe(24);
  });

  it('does not pin a missing selection', () => {
    expect(destinationListPinsToTop(-1, 30)).toBe(false);
  });
});
