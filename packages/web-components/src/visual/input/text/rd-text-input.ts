import { defineRosettaElement } from '../../../lib/element-utils.js';
import { RosettaAtomElement } from '../../../lib/rosetta-atom-element.js';

export const RD_TEXT_INPUT_TAG = 'rd-text-input';

export interface TextInputProps {
  label?: string;
  placeholder?: string;
  required?: boolean;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  className?: string;
  style?: Record<string, string>;
  children?: unknown;
}

/** @rosettadash/web-components/visual/input/text — visual.input.text */
export class RdTextInputElement extends RosettaAtomElement {
  static readonly tagName = RD_TEXT_INPUT_TAG;

  static get observedAttributes(): string[] {
    return ["label","placeholder","required","value","default-value"];
  }

  protected buildMarkup(): string {
    const label = this.readAttr('label');
    const placeholder = this.readAttr('placeholder');
    const value = this.readAttr('value') || this.readAttr('default-value');
    const required = this.hasAttribute('required') ? ' required' : '';
    return `
      <section class="rd-input-text" data-testid="rd-input-text">
        ${label ? `<span class="rd-field__label" id="${this.id || 'rd-input-text'}-label">${this.esc(label)}</span>` : ''}
        <input type="text" class="rd-input" data-ref="input" placeholder="${this.esc(placeholder)}" value="${this.esc(value)}"${required}${label ? ` aria-labelledby="${this.id || 'rd-input-text'}-label"` : ''} />
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

export function registerRdTextInput(): void {
  defineRosettaElement(RD_TEXT_INPUT_TAG, RdTextInputElement);
}
