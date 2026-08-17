import { defineRosettaElement } from '../../lib/element-utils.js';
import { RosettaAtomElement } from '../../lib/rosetta-atom-element.js';

export const RD_ROLE_GATE_TAG = 'rd-role-gate';

export interface RoleGateProps {
  label?: string;
  allowedRoles?: string[];
  statusText?: string;
  className?: string;
  style?: Record<string, string>;
  children?: unknown;
}

/** @rosettadash/web-components/domain/role-gate — domain.role-gate */
export class RdRoleGateElement extends RosettaAtomElement {
  static readonly tagName = RD_ROLE_GATE_TAG;

  static get observedAttributes(): string[] {
    return ["label","allowed-roles","status-text","current-role"];
  }

  protected buildMarkup(): string {
    const label = this.readAttr('label');
    const status = this.readAttr('status-text', 'Visible');
    const roles = this.parseJsonAttr<string[]>('allowed-roles', []);
    return `
      <section class="rd-role-gate rd-role-gate rd-role-gate--visible" data-testid="rd-role-gate">
        ${label ? `<span class="rd-field__label">${this.esc(label)}</span>` : ''}
        <p class="rd-role-gate__status">${this.esc(status)}</p>
        ${roles.length ? `<code>${this.esc(JSON.stringify(roles))}</code>` : ''}
        <div data-ref="slot"></div>
      </section>`;
  }
}

export function registerRdRoleGate(): void {
  defineRosettaElement(RD_ROLE_GATE_TAG, RdRoleGateElement);
}
