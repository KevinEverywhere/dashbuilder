import { defineRosettaElement } from '../../lib/element-utils.js';
import { RosettaAtomElement } from '../../lib/rosetta-atom-element.js';

export const RD_KPI_CARD_TAG = 'rd-kpi-card';

export interface KpiCardProps {
  title?: string;
  value?: string | number;
  delta?: string;
  format?: 'number' | 'currency' | 'percent';
  className?: string;
  style?: Record<string, string>;
  children?: unknown;
}

/** @rosettadash/web-components/visual/kpi — visual.kpi */
export class RdKpiCardElement extends RosettaAtomElement {
  static readonly tagName = RD_KPI_CARD_TAG;

  static get observedAttributes(): string[] {
    return ["title","value","delta","format"];
  }

  protected buildMarkup(): string {
    const title = this.readAttr('title', 'Metric');
    const value = this.readAttr('value', '—');
    const delta = this.readAttr('delta');
    return `
      <article class="rd-kpi" data-testid="rd-kpi">
        <span class="rd-kpi__title">${this.esc(title)}</span>
        <span class="rd-kpi__value">${this.esc(value)}</span>
        ${delta ? `<span class="rd-kpi__delta">${this.esc(delta)}</span>` : ''}
        <div data-ref="slot"></div>
      </article>`;
  }
}

export function registerRdKpiCard(): void {
  defineRosettaElement(RD_KPI_CARD_TAG, RdKpiCardElement);
}
