import { defineRosettaElement } from '../../../lib/element-utils.js';
import { RosettaAtomElement } from '../../../lib/rosetta-atom-element.js';

export const RD_NUMBER_INPUT_TAG = 'rd-number-input';

export interface NumberInputProps {
  label?: string;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  value?: number;
  onChange?: (value: number) => void;
  className?: string;
  style?: Record<string, string>;
  children?: unknown;
}

/** @rosettadash/web-components/visual/input/number — visual.input.number */
export class RdNumberInputElement extends RosettaAtomElement {
  static readonly tagName = RD_NUMBER_INPUT_TAG;

  static get observedAttributes(): string[] {
    return ["label","placeholder","min","max","step","value"];
  }

  protected buildMarkup(): string {
    const label = this.readAttr('label');
    const placeholder = this.readAttr('placeholder');
    const value = this.readAttr('value');
    const min = this.getAttribute('min') ?? '';
    const max = this.getAttribute('max') ?? '';
    const step = this.getAttribute('step') ?? '';
    return `
      <section class="rd-input-number" data-testid="rd-input-number">
        ${label ? `<span class="rd-field__label">${this.esc(label)}</span>` : ''}
        <input type="number" class="rd-input" data-ref="input" placeholder="${this.esc(placeholder)}" value="${this.esc(value)}"${min ? ` min="${min}"` : ''}${max ? ` max="${max}"` : ''}${step ? ` step="${step}"` : ''} aria-label="${this.esc(label || 'Number')}" />
        <div data-ref="slot"></div>
      </section>`;
  }

  protected override wireEvents(): void {
    this.addEventListener('input', (event) => {
      const target = event.target;
      if (target instanceof HTMLInputElement && target.matches('[data-ref="input"]')) {
        this.dispatchDetail('value-change', { value: target.value });
      }
    });
  }
}

export function registerRdNumberInput(): void {
  defineRosettaElement(RD_NUMBER_INPUT_TAG, RdNumberInputElement);
}
