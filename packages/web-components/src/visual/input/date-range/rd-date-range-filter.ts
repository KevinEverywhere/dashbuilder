import { defineRosettaElement } from '../../../lib/element-utils.js';
import { RosettaAtomElement } from '../../../lib/rosetta-atom-element.js';

export const RD_DATE_RANGE_FILTER_TAG = 'rd-date-range';

export interface DateRangeFilterProps {
  label?: string;
  startDate?: string;
  endDate?: string;
  presetLabel?: string;
  granularity?: 'date' | 'month';
  onChange?: (range: { startDate: string; endDate: string }) => void;
  className?: string;
  style?: Record<string, string>;
  children?: unknown;
}

/** @rosettadash/web-components/visual/input/date-range — visual.input.date-range */
export class RdDateRangeFilterElement extends RosettaAtomElement {
  static readonly tagName = RD_DATE_RANGE_FILTER_TAG;

  static get observedAttributes(): string[] {
    return ["label","start-date","end-date","preset-label","granularity"];
  }

  protected buildMarkup(): string {
    const label = this.readAttr('label');
    const startDate = this.readAttr('start-date');
    const endDate = this.readAttr('end-date');
    const presetLabel = this.readAttr('preset-label');
    const inputType = this.readAttr('granularity') === 'month' ? 'month' : 'date';
    return `
      <section class="rd-input-date-range" data-testid="rd-input-date-range">
        ${label ? `<span class="rd-field__label">${this.esc(label)}</span>` : ''}
        <div class="rd-date-range__controls">
          <input type="${inputType}" class="rd-input" data-ref="start" value="${this.esc(startDate)}" aria-label="Start date" />
          <span class="rd-date-range__sep">to</span>
          <input type="${inputType}" class="rd-input" data-ref="end" value="${this.esc(endDate)}" aria-label="End date" />
        </div>
        ${presetLabel ? `<span class="rd-date-range__preset">${this.esc(presetLabel)}</span>` : ''}
        <div data-ref="slot"></div>
      </section>`;
  }

  protected override wireEvents(): void {
    this.addEventListener('change', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement)) return;
      const start = this.querySelector<HTMLInputElement>('[data-ref="start"]')?.value ?? '';
      const end = this.querySelector<HTMLInputElement>('[data-ref="end"]')?.value ?? '';
      this.dispatchDetail('range-change', { startDate: start, endDate: end });
    });
  }
}

export function registerRdDateRangeFilter(): void {
  defineRosettaElement(RD_DATE_RANGE_FILTER_TAG, RdDateRangeFilterElement);
}
