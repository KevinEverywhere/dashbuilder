import { defineRosettaElement } from '../../lib/element-utils.js';
import { RosettaAtomElement } from '../../lib/rosetta-atom-element.js';

export const RD_SCROLL_REGION_TAG = 'rd-scroll-region';

export interface ScrollRegionProps {
  title?: string;
  maxHeight?: string;
  overlayScrollbar?: boolean;
  className?: string;
  style?: Record<string, string>;
  children?: unknown;
}

/** @rosettadash/web-components/layout/scroll-region — layout.scroll-region */
export class RdScrollRegionElement extends RosettaAtomElement {
  static readonly tagName = RD_SCROLL_REGION_TAG;

  static get observedAttributes(): string[] {
    return ["title","max-height","overlay-scrollbar"];
  }

  protected buildMarkup(): string {
    const title = this.readAttr('title');
    const maxHeight = this.readAttr('max-height');
    const overlay = this.readBoolAttr('overlay-scrollbar', true);
    const overlayClass = overlay ? ' rd-scroll-region--overlay-scrollbar' : '';
    const heightStyle = maxHeight ? ` style="max-height:${this.esc(maxHeight)}"` : '';
    return `
      <section class="rd-scroll-region rd-scroll-region${overlayClass}" data-testid="rd-scroll-region" aria-label="${this.esc(title || 'Scrollable content')}"${heightStyle}>
        ${title ? `<header class="rd-scroll-region__header">${this.esc(title)}</header>` : ''}
        <div class="rd-scroll-region__body" data-ref="slot"></div>
      </section>`;
  }
}

export function registerRdScrollRegion(): void {
  defineRosettaElement(RD_SCROLL_REGION_TAG, RdScrollRegionElement);
}
