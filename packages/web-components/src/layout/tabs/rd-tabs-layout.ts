import { defineRosettaElement } from '../../lib/element-utils.js';
import { RosettaAtomElement } from '../../lib/rosetta-atom-element.js';

export const RD_TABS_LAYOUT_TAG = 'rd-tabs-layout';

export interface TabsLayoutTab {
  id: string;
  label: string;
}

export interface TabsLayoutProps {
  title?: string;
  tabs?: TabsLayoutTab[];
  activeTabId?: string;
  onTabChange?: (tabId: string) => void;
  className?: string;
  style?: Record<string, string>;
  children?: unknown;
}

/** @rosettadash/web-components/layout/tabs — layout.tabs */
export class RdTabsLayoutElement extends RosettaAtomElement {
  static readonly tagName = RD_TABS_LAYOUT_TAG;

  static get observedAttributes(): string[] {
    return ["title","tabs","active-tab-id"];
  }

  protected buildMarkup(): string {
    const title = this.readAttr('title');
    const active = this.readAttr('active-tab-id');
    const tabs = this.parseJsonAttr<Array<{ id: string; label: string }>>('tabs', []);
    const tabButtons = tabs.map((tab) => `<button type="button" role="tab" class="rd-tabs__tab${tab.id === active ? ' rd-tabs__tab--active' : ''}" data-tab-id="${this.esc(tab.id)}" aria-selected="${tab.id === active ? 'true' : 'false'}">${this.esc(tab.label)}</button>`).join('');
    return `
      <section class="rd-tabs rd-tabs" data-testid="rd-tabs">
        ${title ? `<span class="rd-tabs__title">${this.esc(title)}</span>` : ''}
        <div class="rd-tabs__tabs" role="tablist">${tabButtons}</div>
        <div class="rd-tabs__panel" data-ref="slot"></div>
      </section>`;
  }

  protected override wireEvents(): void {
    this.addEventListener('click', (event) => {
      const target = event.target;
      if (target instanceof HTMLElement && target.dataset['tabId']) {
        this.dispatchDetail('tab-change', { tabId: target.dataset['tabId'] });
      }
    });
  }
}

export function registerRdTabsLayout(): void {
  defineRosettaElement(RD_TABS_LAYOUT_TAG, RdTabsLayoutElement);
}
