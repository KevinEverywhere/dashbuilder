import { defineRosettaElement } from '../../../lib/element-utils.js';
import { RosettaAtomElement } from '../../../lib/rosetta-atom-element.js';

export const RD_CHECKBOX_INPUT_TAG = 'rd-checkbox-input';

export interface CheckboxInputProps {
  label?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  className?: string;
  style?: Record<string, string>;
  children?: unknown;
}

/** @rosettadash/web-components/visual/input/checkbox — visual.input.checkbox */
export class RdCheckboxInputElement extends RosettaAtomElement {
  static readonly tagName = RD_CHECKBOX_INPUT_TAG;

  static get observedAttributes(): string[] {
    return ["label","checked","default-checked"];
  }

  protected buildMarkup(): string {
    const label = this.readAttr('label');
    const checked = this.readBoolAttr('checked') || this.readBoolAttr('default-checked');
    return `
      <label class="rd-input-checkbox rd-field--checkbox" data-testid="rd-input-checkbox">
        <input type="checkbox" class="rd-checkbox" data-ref="input"${checked ? ' checked' : ''} aria-label="${this.esc(label || 'Checkbox')}" />
        ${label ? `<span class="rd-field__label">${this.esc(label)}</span>` : ''}
        <span data-ref="slot"></span>
      </label>`;
  }

  protected override wireEvents(): void {
    this.addEventListener('change', (event) => {
      const target = event.target;
      if (target instanceof HTMLInputElement && target.matches('[data-ref="input"]')) {
        this.dispatchDetail('checked-change', { checked: target.checked });
      }
    });
  }
}

export function registerRdCheckboxInput(): void {
  defineRosettaElement(RD_CHECKBOX_INPUT_TAG, RdCheckboxInputElement);
}
