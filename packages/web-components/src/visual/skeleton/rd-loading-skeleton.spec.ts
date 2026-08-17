import { registerRdLoadingSkeleton, RD_LOADING_SKELETON_TAG, RdLoadingSkeletonElement } from './rd-loading-skeleton.js';

describe('rd-loading-skeleton', () => {
  beforeAll(() => {
    registerRdLoadingSkeleton();
  });

  it('registers the custom element', () => {
    expect(customElements.get(RD_LOADING_SKELETON_TAG)).toBe(RdLoadingSkeletonElement);
  });

  it('renders taxonomy-aligned BEM root block', () => {
    const el = document.createElement(RD_LOADING_SKELETON_TAG);
    document.body.appendChild(el);
    const root = el.matches('[data-testid="rd-skeleton"]') ? el : el.querySelector('[data-testid="rd-skeleton"]');
    expect(root).toBeTruthy();
    el.remove();
  });
});
