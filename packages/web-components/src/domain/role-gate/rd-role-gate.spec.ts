import { registerRdRoleGate, RD_ROLE_GATE_TAG, RdRoleGateElement } from './rd-role-gate.js';

describe('rd-role-gate', () => {
  beforeAll(() => {
    registerRdRoleGate();
  });

  it('registers the custom element', () => {
    expect(customElements.get(RD_ROLE_GATE_TAG)).toBe(RdRoleGateElement);
  });

  it('renders taxonomy-aligned BEM root block', () => {
    const el = document.createElement(RD_ROLE_GATE_TAG);
    document.body.appendChild(el);
    const root = el.matches('[data-testid="rd-role-gate"]') ? el : el.querySelector('[data-testid="rd-role-gate"]');
    expect(root).toBeTruthy();
    el.remove();
  });

  it('hides slotted content when current-role is not allowed', () => {
    const el = document.createElement(RD_ROLE_GATE_TAG);
    el.setAttribute('allowed-roles', '["admin"]');
    el.setAttribute('current-role', 'viewer');
    el.appendChild(document.createTextNode('secret'));
    document.body.appendChild(el);
    expect(el.querySelector('[data-testid="rd-role-gate-hidden"]')).toBeTruthy();
    expect(el.querySelector('[data-ref="slot"]')?.hasAttribute('hidden')).toBe(true);
    el.remove();
  });

  it('shows slotted content when current-role is allowed', () => {
    const el = document.createElement(RD_ROLE_GATE_TAG);
    el.setAttribute('allowed-roles', '["admin"]');
    el.setAttribute('current-role', 'admin');
    document.body.appendChild(el);
    expect(el.querySelector('[data-testid="rd-role-gate-visible"]')).toBeTruthy();
    expect(el.querySelector('[data-ref="slot"]')?.hasAttribute('hidden')).toBe(false);
    el.remove();
  });
});
