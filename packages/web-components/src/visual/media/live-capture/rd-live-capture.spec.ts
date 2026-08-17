import { registerRdLiveCapture, RD_LIVE_CAPTURE_TAG, RdLiveCaptureElement } from './rd-live-capture.js';

describe('rd-live-capture', () => {
  beforeAll(() => {
    registerRdLiveCapture();
  });

  it('registers the custom element', () => {
    expect(customElements.get(RD_LIVE_CAPTURE_TAG)).toBe(RdLiveCaptureElement);
  });

  it('renders taxonomy-aligned BEM root block', () => {
    const el = document.createElement(RD_LIVE_CAPTURE_TAG);
    document.body.appendChild(el);
    const root = el.matches('[data-testid="rd-media-live-capture"]') ? el : el.querySelector('[data-testid="rd-media-live-capture"]');
    expect(root).toBeTruthy();
    el.remove();
  });
});
