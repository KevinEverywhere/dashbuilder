import { defineRosettaElement } from '../../../lib/element-utils.js';
import { RosettaAtomElement } from '../../../lib/rosetta-atom-element.js';

export const RD_METRIC_CHIP_TAG = 'rd-metric-chip';

export interface MetricChipProps {
  chipLabel?: string;
  chipValue?: string;
  className?: string;
  style?: Record<string, string>;
  children?: unknown;
}

/** @rosettadash/web-components/visual/plugin/metric-chip — visual.plugin.metric-chip */
export class RdMetricChipElement extends RosettaAtomElement {
  static readonly tagName = RD_METRIC_CHIP_TAG;

  static get observedAttributes(): string[] {
    return ["chip-label","chip-value"];
  }

  protected buildMarkup(): string {
    const chipLabel = this.readAttr('chip-label', 'Metric');
    const chipValue = this.readAttr('chip-value', '—');
    return `
      <span class="rd-plugin-metric-chip" data-testid="rd-plugin-metric-chip">
        <span class="rd-metric-chip__label">${this.esc(chipLabel)}</span>
        <span class="rd-metric-chip__value">${this.esc(chipValue)}</span>
      </span>`;
  }
}

export function registerRdMetricChip(): void {
  defineRosettaElement(RD_METRIC_CHIP_TAG, RdMetricChipElement);
}
