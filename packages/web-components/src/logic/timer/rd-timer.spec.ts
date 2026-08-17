import { registerRdTimer, RD_TIMER_TAG, RdTimerElement } from './rd-timer.js';

describe('rd-timer', () => {
  beforeAll(() => {
    registerRdTimer();
  });

  it('registers the custom element', () => {
    expect(customElements.get(RD_TIMER_TAG)).toBe(RdTimerElement);
  });

  it('renders taxonomy-aligned BEM root block', () => {
    const el = document.createElement(RD_TIMER_TAG);
    document.body.appendChild(el);
    const root = el.matches('[data-testid="rd-timer"]') ? el : el.querySelector('[data-testid="rd-timer"]');
    expect(root).toBeTruthy();
    el.remove();
  });
});
