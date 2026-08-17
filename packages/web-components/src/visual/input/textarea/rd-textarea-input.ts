import { defineRosettaElement } from '../../../lib/element-utils.js';
import { RosettaAtomElement } from '../../../lib/rosetta-atom-element.js';

export const RD_TEXTAREA_INPUT_TAG = 'rd-textarea-input';

export interface TextareaInputProps {
  label?: string;
  placeholder?: string;
  rows?: number;
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
  style?: Record<string, string>;
  children?: unknown;
}

/** @rosettadash/web-components/visual/input/textarea — visual.input.textarea */
export class RdTextareaInputElement extends RosettaAtomElement {
  static readonly tagName = RD_TEXTAREA_INPUT_TAG;

  static get observedAttributes(): string[] {
    return ["label","placeholder","rows","value"];
  }

  protected buildMarkup(): string {
    const label = this.readAttr('label');
    const placeholder = this.readAttr('placeholder');
    const value = this.readAttr('value');
    const rows = this.readNumAttr('rows', 4);
    return `
      <section class="rd-input-textarea" data-testid="rd-input-textarea">
        ${label ? `<span class="rd-field__label">${this.esc(label)}</span>` : ''}
        <textarea class="rd-textarea" data-ref="input" rows="${rows}" placeholder="${this.esc(placeholder)}" aria-label="${this.esc(label || 'Textarea')}">${this.esc(value)}</textarea>
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

export function registerRdTextareaInput(): void {
  defineRosettaElement(RD_TEXTAREA_INPUT_TAG, RdTextareaInputElement);
}
