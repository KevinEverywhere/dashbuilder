import { registerRdTimePreset, RD_TIME_PRESET_TAG, RdTimePresetElement } from './rd-time-preset.js';

describe('rd-time-preset', () => {
  beforeAll(() => {
    registerRdTimePreset();
  });

  it('registers the custom element', () => {
    expect(customElements.get(RD_TIME_PRESET_TAG)).toBe(RdTimePresetElement);
  });

  it('renders taxonomy-aligned BEM root block', () => {
    const el = document.createElement(RD_TIME_PRESET_TAG);
    document.body.appendChild(el);
    const root = el.matches('[data-testid="rd-time-preset"]') ? el : el.querySelector('[data-testid="rd-time-preset"]');
    expect(root).toBeTruthy();
    el.remove();
  });
});
