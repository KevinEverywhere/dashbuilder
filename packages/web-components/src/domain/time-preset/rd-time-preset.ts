import { defineRosettaElement } from '../../lib/element-utils.js';
import { RosettaAtomElement } from '../../lib/rosetta-atom-element.js';

export const RD_TIME_PRESET_TAG = 'rd-time-preset';

export interface TimePresetPreset {
  id: string;
  label: string;
}

export interface TimePresetProps {
  label?: string;
  presets?: TimePresetPreset[];
  activePresetId?: string;
  onPresetChange?: (presetId: string) => void;
  className?: string;
  style?: Record<string, string>;
  children?: unknown;
}

/** @rosettadash/web-components/domain/time-preset — domain.time-preset */
export class RdTimePresetElement extends RosettaAtomElement {
  static readonly tagName = RD_TIME_PRESET_TAG;

  static get observedAttributes(): string[] {
    return ["label","presets","active-preset-id"];
  }

  protected buildMarkup(): string {
    const label = this.readAttr('label');
    const active = this.readAttr('active-preset-id');
    const presets = this.parseJsonAttr<Array<{ id: string; label: string }>>('presets', []);
    const buttons = presets.map((p) => `<button type="button" class="rd-time-preset__button${p.id === active ? ' rd-time-preset__button--active' : ''}" data-preset-id="${this.esc(p.id)}">${this.esc(p.label)}</button>`).join('');
    return `
      <section class="rd-time-preset" data-testid="rd-time-preset">
        ${label ? `<span class="rd-field__label">${this.esc(label)}</span>` : ''}
        <div class="rd-time-preset__buttons" role="group" aria-label="${this.esc(label || 'Time presets')}">${buttons}</div>
        <div data-ref="slot"></div>
      </section>`;
  }

  protected override wireEvents(): void {
    this.addEventListener('click', (event) => {
      const target = event.target;
      if (target instanceof HTMLElement && target.dataset['presetId']) {
        this.dispatchDetail('preset-change', { presetId: target.dataset['presetId'] });
      }
    });
  }
}

export function registerRdTimePreset(): void {
  defineRosettaElement(RD_TIME_PRESET_TAG, RdTimePresetElement);
}
