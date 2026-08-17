import { registerRdPersonInvite, RD_PERSON_INVITE_TAG, RdPersonInviteElement } from './rd-person-invite.js';

describe('rd-person-invite', () => {
  beforeAll(() => {
    registerRdPersonInvite();
  });

  it('registers the custom element', () => {
    expect(customElements.get(RD_PERSON_INVITE_TAG)).toBe(RdPersonInviteElement);
  });

  it('renders taxonomy-aligned BEM root block', () => {
    const el = document.createElement(RD_PERSON_INVITE_TAG);
    document.body.appendChild(el);
    const root = el.matches('[data-testid="rd-person-invite"]') ? el : el.querySelector('[data-testid="rd-person-invite"]');
    expect(root).toBeTruthy();
    el.remove();
  });
});
