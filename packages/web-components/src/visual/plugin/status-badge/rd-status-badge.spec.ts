import { registerRdStatusBadge, RD_STATUS_BADGE_TAG, RdStatusBadgeElement } from './rd-status-badge.js';

describe('rd-status-badge', () => {
  beforeAll(() => {
    registerRdStatusBadge();
  });

  it('registers the custom element', () => {
    expect(customElements.get(RD_STATUS_BADGE_TAG)).toBe(RdStatusBadgeElement);
  });

  it('renders taxonomy-aligned BEM root block', () => {
    const el = document.createElement(RD_STATUS_BADGE_TAG);
    document.body.appendChild(el);
    const root = el.matches('[data-testid="rd-plugin-status-badge"]') ? el : el.querySelector('[data-testid="rd-plugin-status-badge"]');
    expect(root).toBeTruthy();
    el.remove();
  });
});
