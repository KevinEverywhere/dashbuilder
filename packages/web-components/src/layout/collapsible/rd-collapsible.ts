import { defineRosettaElement } from '../../lib/element-utils.js';
import { RosettaAtomElement } from '../../lib/rosetta-atom-element.js';

export const RD_COLLAPSIBLE_TAG = 'rd-collapsible';

export interface CollapsibleProps {
  title?: string;
  summary?: string;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  style?: Record<string, string>;
  children?: unknown;
}

/** @rosettadash/web-components/layout/collapsible — layout.collapsible */
export class RdCollapsibleElement extends RosettaAtomElement {
  static readonly tagName = RD_COLLAPSIBLE_TAG;

  static get observedAttributes(): string[] {
    return ['title', 'summary', 'open', 'default-open'];
  }

  protected isOpen(): boolean {
    return this.readBoolAttr('open') || this.readBoolAttr('default-open');
  }

  protected buildMarkup(): string {
    const title = this.readAttr('title', 'Section');
    const summary = this.readAttr('summary');
    const open = this.isOpen();
    return `
      <section class="rd-collapsible${open ? ' is-open' : ''}" data-testid="rd-collapsible">
        <button type="button" class="rd-collapsible__header" aria-expanded="${open ? 'true' : 'false'}">
          <span class="rd-collapsible__titles">
            <span class="rd-collapsible__title">${this.esc(title)}</span>
            ${summary ? `<span class="rd-collapsible__summary">${this.esc(summary)}</span>` : ''}
          </span>
          <span class="rd-collapsible__chevron" aria-hidden="true">${open ? '▾' : '▸'}</span>
        </button>
        <div class="rd-collapsible__panel" data-ref="slot"${open ? '' : ' hidden'}></div>
      </section>`;
  }

  protected override wireEvents(): void {
    this.addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof Element) || !target.closest('.rd-collapsible__header')) {
        return;
      }
      event.preventDefault();
      const next = !this.isOpen();
      if (next) {
        this.setAttribute('open', '');
      } else {
        this.removeAttribute('open');
      }
      this.dispatchDetail('open-change', { open: next });
    });
  }
}

export function registerRdCollapsible(): void {
  defineRosettaElement(RD_COLLAPSIBLE_TAG, RdCollapsibleElement);
}
