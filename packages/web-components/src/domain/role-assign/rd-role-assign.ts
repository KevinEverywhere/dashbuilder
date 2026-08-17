import { defineRosettaElement } from '../../lib/element-utils.js';
import { RosettaAtomElement } from '../../lib/rosetta-atom-element.js';

export const RD_ROLE_ASSIGN_TAG = 'rd-role-assign';

export interface RoleAssignProps {
  summary?: string;
  roleOptions?: { value: string; label: string }[];
  onConfirm?: (role: string) => void;
  className?: string;
  style?: Record<string, string>;
  children?: unknown;
}

/** @rosettadash/web-components/domain/role-assign — domain.role-assign */
export class RdRoleAssignElement extends RosettaAtomElement {
  static readonly tagName = RD_ROLE_ASSIGN_TAG;

  static get observedAttributes(): string[] {
    return ["summary","role-options"];
  }

  protected buildMarkup(): string {
    const summary = this.readAttr('summary');
    const options = this.parseJsonAttr<Array<{ value: string; label: string }>>('role-options', []);
    const opts = options.map((o) => `<option value="${this.esc(o.value)}">${this.esc(o.label)}</option>`).join('');
    return `
      <section class="rd-role-assign" data-testid="rd-role-assign">
        <span class="rd-field__label">Assign role</span>
        ${summary ? `<p class="rd-onboarding__summary">${this.esc(summary)}</p>` : ''}
        <select class="rd-select" data-ref="role" aria-label="Role">${opts}</select>
        <button type="button" class="rd-button" data-ref="confirm">Confirm access</button>
        <div data-ref="slot"></div>
      </section>`;
  }

  protected override wireEvents(): void {
    this.addEventListener('click', (event) => {
      const target = event.target;
      if (target instanceof HTMLElement && target.matches('[data-ref="confirm"]')) {
        const role = this.querySelector<HTMLSelectElement>('[data-ref="role"]')?.value ?? '';
        this.dispatchDetail('confirm', { role });
      }
    });
  }
}

export function registerRdRoleAssign(): void {
  defineRosettaElement(RD_ROLE_ASSIGN_TAG, RdRoleAssignElement);
}
