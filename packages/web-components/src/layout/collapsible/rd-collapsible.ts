import { defineRosettaElement } from '../../lib/element-utils.js';
import { RosettaAtomElement } from '../../lib/rosetta-atom-element.js';

export const RD_COLLAPSIBLE_TAG = 'rd-collapsible';

export interface CollapsibleProps {
  title?: string;
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
    return ["title","open","default-open"];
  }

  protected buildMarkup(): string {
    const title = this.readAttr('title', 'Section');
    const open = this.readBoolAttr('open') || this.readBoolAttr('default-open');
    return `
      <section class="rd-collapsible rd-collapsible${open ? ' rd-collapsible--open' : ''}" data-testid="rd-collapsible">
        <button type="button" class="rd-collapsible__header" aria-expanded="${open ? 'true' : 'false'}"><span>${this.esc(title)}</span></button>
        <div class="rd-collapsible__panel" data-ref="slot"${open ? '' : ' hidden'}></div>
      </section>`;
  }
}

export function registerRdCollapsible(): void {
  defineRosettaElement(RD_COLLAPSIBLE_TAG, RdCollapsibleElement);
}
