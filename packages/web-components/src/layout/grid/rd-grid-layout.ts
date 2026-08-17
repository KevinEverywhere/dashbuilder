import { defineRosettaElement } from '../../lib/element-utils.js';
import { RosettaAtomElement } from '../../lib/rosetta-atom-element.js';

export const RD_GRID_LAYOUT_TAG = 'rd-grid-layout';

export interface GridLayoutProps {
  title?: string;
  columns?: number;
  gap?: number | string;
  className?: string;
  style?: Record<string, string>;
  children?: unknown;
}

/** @rosettadash/web-components/layout/grid — layout.grid */
export class RdGridLayoutElement extends RosettaAtomElement {
  static readonly tagName = RD_GRID_LAYOUT_TAG;

  static get observedAttributes(): string[] {
    return ["title","columns","gap"];
  }

  protected buildMarkup(): string {
    const title = this.readAttr('title');
    const columns = this.readNumAttr('columns', 3);
    const gap = this.readAttr('gap', '12');
    return `
      <section class="rd-grid" data-testid="rd-grid">
        ${title ? `<span class="rd-grid__title">${this.esc(title)}</span>` : ''}
        <div class="rd-grid__grid" data-ref="slot" style="grid-template-columns:repeat(${columns},1fr);gap:${gap}px"></div>
      </section>`;
  }
}

export function registerRdGridLayout(): void {
  defineRosettaElement(RD_GRID_LAYOUT_TAG, RdGridLayoutElement);
}
