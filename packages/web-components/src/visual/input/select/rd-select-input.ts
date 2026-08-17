import { defineRosettaElement } from '../../../lib/element-utils.js';
import { RosettaAtomElement } from '../../../lib/rosetta-atom-element.js';

export const RD_SELECT_INPUT_TAG = 'rd-select-input';

export interface SelectInputOption {
  value: string;
  label: string;
}

export interface SelectInputProps {
  label?: string;
  placeholder?: string;
  options?: SelectInputOption[];
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
  style?: Record<string, string>;
  children?: unknown;
}

/** @rosettadash/web-components/visual/input/select — visual.input.select */
export class RdSelectInputElement extends RosettaAtomElement {
  static readonly tagName = RD_SELECT_INPUT_TAG;

  static get observedAttributes(): string[] {
    return ["label","placeholder","options","value"];
  }

  protected buildMarkup(): string {
    const label = this.readAttr('label');
    const placeholder = this.readAttr('placeholder', 'Select…');
    const value = this.readAttr('value');
    const options = this.parseJsonAttr<Array<{ value: string; label: string }>>('options', []);
    const opts = options.map((o) => `<option value="${this.esc(o.value)}"${o.value === value ? ' selected' : ''}>${this.esc(o.label)}</option>`).join('');
    return `
      <section class="rd-input-select" data-testid="rd-input-select">
        ${label ? `<span class="rd-field__label">${this.esc(label)}</span>` : ''}
        <select class="rd-select" data-ref="select" aria-label="${this.esc(label || 'Select')}">
          <option value="">${this.esc(placeholder)}</option>${opts}
        </select>
        <div data-ref="slot"></div>
      </section>`;
  }

  protected override wireEvents(): void {
    this.addEventListener('change', (event) => {
      const target = event.target;
      if (target instanceof HTMLSelectElement && target.matches('[data-ref="select"]')) {
        this.dispatchDetail('value-change', { value: target.value });
      }
    });
  }
}

export function registerRdSelectInput(): void {
  defineRosettaElement(RD_SELECT_INPUT_TAG, RdSelectInputElement);
}
