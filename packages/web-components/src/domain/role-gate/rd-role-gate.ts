import { defineRosettaElement } from '../../lib/element-utils.js';
import { RosettaAtomElement } from '../../lib/rosetta-atom-element.js';

export const RD_ROLE_GATE_TAG = 'rd-role-gate';

export interface RoleGateProps {
  label?: string;
  allowedRoles?: string[];
  currentRole?: string;
  statusText?: string;
  hiddenStatusText?: string;
  className?: string;
  style?: Record<string, string>;
  children?: unknown;
}

/** @rosettadash/web-components/domain/role-gate — domain.role-gate */
export class RdRoleGateElement extends RosettaAtomElement {
  static readonly tagName = RD_ROLE_GATE_TAG;

  static get observedAttributes(): string[] {
    return ['label', 'allowed-roles', 'status-text', 'current-role', 'hidden-status-text', 'hide-when-denied'];
  }

  protected buildMarkup(): string {
    const label = this.readAttr('label');
    const status = this.readAttr('status-text', 'Visible');
    const hiddenStatus = this.readAttr('hidden-status-text', 'Hidden for current role');
    const roles = this.parseJsonAttr<string[]>('allowed-roles', []);
    const currentRole = this.readAttr('current-role');
    const hasRoleContext = currentRole.length > 0;
    const visible = !hasRoleContext || roles.length === 0 || roles.includes(currentRole);
    if (!visible && this.readBoolAttr('hide-when-denied')) {
      return '';
    }
    const modifier = visible ? 'rd-role-gate--visible' : 'rd-role-gate--hidden';
    const statusText = visible ? status : hiddenStatus;
    return `
      <section class="rd-role-gate rd-role-gate ${modifier}" data-testid="rd-role-gate">
        ${label ? `<span class="rd-field__label">${this.esc(label)}</span>` : ''}
        <p class="rd-role-gate__status${visible ? '' : ' rd-role-gate__status--hidden'}" data-testid="${visible ? 'rd-role-gate-visible' : 'rd-role-gate-hidden'}">${this.esc(statusText)}</p>
        <div data-ref="slot"${visible ? '' : ' hidden'}></div>
      </section>`;
  }
}

export function registerRdRoleGate(): void {
  defineRosettaElement(RD_ROLE_GATE_TAG, RdRoleGateElement);
}
