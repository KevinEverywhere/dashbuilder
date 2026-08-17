import { registerRdRoleAssign, RD_ROLE_ASSIGN_TAG, RdRoleAssignElement } from './rd-role-assign.js';

describe('rd-role-assign', () => {
  beforeAll(() => {
    registerRdRoleAssign();
  });

  it('registers the custom element', () => {
    expect(customElements.get(RD_ROLE_ASSIGN_TAG)).toBe(RdRoleAssignElement);
  });

  it('renders taxonomy-aligned BEM root block', () => {
    const el = document.createElement(RD_ROLE_ASSIGN_TAG);
    document.body.appendChild(el);
    const root = el.matches('[data-testid="rd-role-assign"]') ? el : el.querySelector('[data-testid="rd-role-assign"]');
    expect(root).toBeTruthy();
    el.remove();
  });
});
