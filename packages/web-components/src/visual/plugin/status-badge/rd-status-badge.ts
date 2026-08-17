import { defineRosettaElement } from '../../../lib/element-utils.js';
import { RosettaAtomElement } from '../../../lib/rosetta-atom-element.js';

export const RD_STATUS_BADGE_TAG = 'rd-status-badge';

export interface StatusBadgeProps {
  statusText?: string;
  tone?: 'success' | 'warning' | 'error' | 'neutral';
  className?: string;
  style?: Record<string, string>;
  children?: unknown;
}

/** @rosettadash/web-components/visual/plugin/status-badge — visual.plugin.status-badge */
export class RdStatusBadgeElement extends RosettaAtomElement {
  static readonly tagName = RD_STATUS_BADGE_TAG;

  static get observedAttributes(): string[] {
    return ["status-text","tone"];
  }

  protected buildMarkup(): string {
    const text = this.readAttr('status-text', 'Active');
    const tone = this.readAttr('tone', 'success');
    return `<span class="rd-plugin-status-badge rd-status-badge--${tone}" data-testid="rd-plugin-status-badge">${this.esc(text)}</span>`;
  }
}

export function registerRdStatusBadge(): void {
  defineRosettaElement(RD_STATUS_BADGE_TAG, RdStatusBadgeElement);
}
