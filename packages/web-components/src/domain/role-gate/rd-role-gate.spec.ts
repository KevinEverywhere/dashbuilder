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
});
