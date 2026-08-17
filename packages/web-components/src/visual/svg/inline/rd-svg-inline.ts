import { defineRosettaElement } from '../../../lib/element-utils.js';
import { RosettaAtomElement } from '../../../lib/rosetta-atom-element.js';

export const RD_SVG_INLINE_TAG = 'rd-svg-inline';

export interface SvgInlineProps {
  markup?: string;
  width?: number | string;
  height?: number | string;
  className?: string;
  style?: Record<string, string>;
  children?: unknown;
}

/** @rosettadash/web-components/visual/svg/inline — visual.svg.inline */
export class RdSvgInlineElement extends RosettaAtomElement {
  static readonly tagName = RD_SVG_INLINE_TAG;

  static get observedAttributes(): string[] {
    return ["markup","width","height"];
  }

  protected buildMarkup(): string {
    const markup = this.readAttr('markup', '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.2"/></svg>');
    const width = this.readAttr('width', '96');
    const height = this.readAttr('height', '96');
    return `<div class="rd-svg-inline" data-testid="rd-svg-inline" style="width:${width}px;height:${height}px">${markup}</div>`;
  }
}

export function registerRdSvgInline(): void {
  defineRosettaElement(RD_SVG_INLINE_TAG, RdSvgInlineElement);
}
