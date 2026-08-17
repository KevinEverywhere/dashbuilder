import { defineRosettaElement } from '../../lib/element-utils.js';
import { RosettaAtomElement } from '../../lib/rosetta-atom-element.js';

export const RD_PERSON_INVITE_TAG = 'rd-person-invite';

export interface PersonInviteProps {
  emailPlaceholder?: string;
  onInvite?: (email: string) => void;
  className?: string;
  style?: Record<string, string>;
  children?: unknown;
}

/** @rosettadash/web-components/domain/person-invite — domain.person-invite */
export class RdPersonInviteElement extends RosettaAtomElement {
  static readonly tagName = RD_PERSON_INVITE_TAG;

  static get observedAttributes(): string[] {
    return ["email-placeholder"];
  }

  protected buildMarkup(): string {
    const placeholder = this.readAttr('email-placeholder', 'name@company.com');
    return `
      <section class="rd-person-invite" data-testid="rd-person-invite">
        <span class="rd-field__label">Invite team member</span>
        <input type="email" class="rd-input" data-ref="email" placeholder="${this.esc(placeholder)}" aria-label="Email address" />
        <button type="button" class="rd-button" data-ref="invite">Send invite</button>
        <div data-ref="slot"></div>
      </section>`;
  }

  protected override wireEvents(): void {
    this.addEventListener('click', (event) => {
      const target = event.target;
      if (target instanceof HTMLElement && target.matches('[data-ref="invite"]')) {
        const email = this.querySelector<HTMLInputElement>('[data-ref="email"]')?.value ?? '';
        this.dispatchDetail('invite', { email });
      }
    });
  }
}

export function registerRdPersonInvite(): void {
  defineRosettaElement(RD_PERSON_INVITE_TAG, RdPersonInviteElement);
}
