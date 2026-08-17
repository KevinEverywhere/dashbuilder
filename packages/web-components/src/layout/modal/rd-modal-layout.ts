import { defineRosettaElement } from '../../lib/element-utils.js';
import { RosettaAtomElement } from '../../lib/rosetta-atom-element.js';

export const RD_MODAL_LAYOUT_TAG = 'rd-modal-layout';

export interface ModalLayoutProps {
  title?: string;
  body?: string;
  confirmLabel?: string;
  open?: boolean;
  onConfirm?: () => void;
  className?: string;
  style?: Record<string, string>;
  children?: unknown;
}

/** @rosettadash/web-components/layout/modal — layout.modal */
export class RdModalLayoutElement extends RosettaAtomElement {
  static readonly tagName = RD_MODAL_LAYOUT_TAG;

  static get observedAttributes(): string[] {
    return ["title","body","confirm-label","open"];
  }

  protected buildMarkup(): string {
    const title = this.readAttr('title', 'Dialog');
    const body = this.readAttr('body');
    const confirm = this.readAttr('confirm-label', 'Confirm');
    const open = this.readBoolAttr('open', true);
    if (!open) {
      return `<section class="rd-modal" data-testid="rd-modal" hidden></section>`;
    }
    return `
      <section class="rd-modal" data-testid="rd-modal" role="dialog" aria-modal="true" aria-labelledby="rd-modal-title">
        <div class="rd-modal__dialog">
          <span class="rd-modal__title" id="rd-modal-title">${this.esc(title)}</span>
          ${body ? `<p class="rd-modal__body">${this.esc(body)}</p>` : ''}
          <button type="button" class="rd-modal__confirm rd-button" data-ref="confirm">${this.esc(confirm)}</button>
          <div data-ref="slot"></div>
        </div>
      </section>`;
  }

  protected override wireEvents(): void {
    this.addEventListener('click', (event) => {
      const target = event.target;
      if (target instanceof HTMLElement && target.matches('[data-ref="confirm"]')) {
        this.dispatchDetail('confirm', {});
      }
    });
  }
}

export function registerRdModalLayout(): void {
  defineRosettaElement(RD_MODAL_LAYOUT_TAG, RdModalLayoutElement);
}
