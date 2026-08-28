import { registerRdCollapsible, RD_COLLAPSIBLE_TAG, RdCollapsibleElement } from './rd-collapsible.js';

describe('rd-collapsible', () => {
  beforeAll(() => {
    registerRdCollapsible();
  });

  it('registers the custom element', () => {
    expect(customElements.get(RD_COLLAPSIBLE_TAG)).toBe(RdCollapsibleElement);
  });

  it('renders taxonomy-aligned BEM root block', () => {
    const el = document.createElement(RD_COLLAPSIBLE_TAG);
    document.body.appendChild(el);
    const root = el.matches('[data-testid="rd-collapsible"]') ? el : el.querySelector('[data-testid="rd-collapsible"]');
    expect(root).toBeTruthy();
    el.remove();
  });

  it('toggles the panel and dispatches open-change', () => {
    const el = document.createElement(RD_COLLAPSIBLE_TAG);
    el.setAttribute('title', 'Integration keys (BYOK)');
    el.innerHTML = '<p>vault</p>';
    document.body.appendChild(el);
    const header = el.querySelector('.rd-collapsible__header') as HTMLButtonElement;
    const panel = el.querySelector('.rd-collapsible__panel') as HTMLElement;
    const events: boolean[] = [];
    el.addEventListener('open-change', (event) => {
      events.push((event as CustomEvent<{ open: boolean }>).detail.open);
    });

    expect(header.getAttribute('aria-expanded')).toBe('false');
    expect(panel.hidden).toBe(true);
    expect(el.querySelector('.rd-collapsible__chevron')?.textContent).toBe('▸');

    header.click();
    expect(el.hasAttribute('open')).toBe(true);
    expect(el.querySelector('.rd-collapsible__header')?.getAttribute('aria-expanded')).toBe('true');
    expect((el.querySelector('.rd-collapsible__panel') as HTMLElement).hidden).toBe(false);
    expect(el.querySelector('.rd-collapsible__chevron')?.textContent).toBe('▾');
    expect(el.textContent).toContain('vault');
    expect(events).toEqual([true]);

    (el.querySelector('.rd-collapsible__header') as HTMLButtonElement).click();
    expect(el.hasAttribute('open')).toBe(false);
    expect(events).toEqual([true, false]);
    el.remove();
  });
});
