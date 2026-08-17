import { defineRosettaElement } from '../../lib/element-utils.js';
import { RosettaAtomElement } from '../../lib/rosetta-atom-element.js';

export const RD_FLEX_LAYOUT_TAG = 'rd-flex-layout';

export interface FlexLayoutProps {
  title?: string;
  direction?: 'row' | 'column';
  gap?: number | string;
  className?: string;
  style?: Record<string, string>;
  children?: unknown;
}

/** @rosettadash/web-components/layout/flex — layout.flex */
export class RdFlexLayoutElement extends RosettaAtomElement {
  static readonly tagName = RD_FLEX_LAYOUT_TAG;

  static get observedAttributes(): string[] {
    return ["title","direction","gap"];
  }

  protected buildMarkup(): string {
    const title = this.readAttr('title');
    const direction = this.readAttr('direction', 'row');
    const gap = this.readAttr('gap', '12');
    return `
      <section class="rd-flex" data-testid="rd-flex">
        ${title ? `<span class="rd-flex__title">${this.esc(title)}</span>` : ''}
        <div class="rd-flex__flex" data-ref="slot" style="display:flex;flex-direction:${direction};gap:${gap}px"></div>
      </section>`;
  }
}

export function registerRdFlexLayout(): void {
  defineRosettaElement(RD_FLEX_LAYOUT_TAG, RdFlexLayoutElement);
}
