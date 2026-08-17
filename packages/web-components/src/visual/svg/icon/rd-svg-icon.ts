import { defineRosettaElement } from '../../../lib/element-utils.js';
import { RosettaAtomElement } from '../../../lib/rosetta-atom-element.js';

export const RD_SVG_ICON_TAG = 'rd-svg-icon';

export interface SvgIconProps {
  markup?: string;
  title?: string;
  color?: string;
  size?: number | string;
  className?: string;
  style?: Record<string, string>;
  children?: unknown;
}

/** @rosettadash/web-components/visual/svg/icon — visual.svg.icon */
export class RdSvgIconElement extends RosettaAtomElement {
  static readonly tagName = RD_SVG_ICON_TAG;

  static get observedAttributes(): string[] {
    return ["markup","title","color","size"];
  }

  protected buildMarkup(): string {
    const markup = this.readAttr('markup', '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7-6.3-4.6L5.7 21l2.3-7-6-4.6h7.6z" fill="currentColor"/></svg>');
    const size = this.readAttr('size', '28');
    const title = this.readAttr('title');
    return `<span class="rd-svg-icon" data-testid="rd-svg-icon" style="width:${size}px;height:${size}px"${title ? ` title="${this.esc(title)}"` : ''}>${markup}</span>`;
  }
}

export function registerRdSvgIcon(): void {
  defineRosettaElement(RD_SVG_ICON_TAG, RdSvgIconElement);
}
