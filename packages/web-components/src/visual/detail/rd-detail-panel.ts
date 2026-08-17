import { defineRosettaElement } from '../../lib/element-utils.js';
import { RosettaAtomElement } from '../../lib/rosetta-atom-element.js';

export const RD_DETAIL_PANEL_TAG = 'rd-detail-panel';

export interface DetailPanelProps {
  title?: string;
  emptyMessage?: string;
  className?: string;
  style?: Record<string, string>;
  children?: unknown;
}

/** @rosettadash/web-components/visual/detail — visual.detail */
export class RdDetailPanelElement extends RosettaAtomElement {
  static readonly tagName = RD_DETAIL_PANEL_TAG;

  static get observedAttributes(): string[] {
    return ["title","empty-message"];
  }

  protected buildMarkup(): string {
    const title = this.readAttr('title', 'Details');
    const empty = this.readAttr('empty-message', 'Select a row to view details');
    return `
      <section class="rd-detail rd-detail" data-testid="rd-detail">
        <header class="rd-detail__header"><span>${this.esc(title)}</span></header>
        <div class="rd-detail__body"><p class="rd-detail__empty">${this.esc(empty)}</p></div>
        <div data-ref="slot"></div>
      </section>`;
  }
}

export function registerRdDetailPanel(): void {
  defineRosettaElement(RD_DETAIL_PANEL_TAG, RdDetailPanelElement);
}
