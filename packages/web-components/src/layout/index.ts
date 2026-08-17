export * from './accordion/index.js';
export * from './accordion-link-list/index.js';
export * from './grid/index.js';
export * from './flex/index.js';
export * from './tabs/index.js';
export * from './modal/index.js';
export * from './collapsible/index.js';

import { registerLayoutAccordion } from './accordion/index.js';
import { registerLayoutAccordionLinkList } from './accordion-link-list/index.js';
import { registerRdGridLayout } from './grid/index.js';
import { registerRdFlexLayout } from './flex/index.js';
import { registerRdTabsLayout } from './tabs/index.js';
import { registerRdModalLayout } from './modal/index.js';
import { registerRdCollapsible } from './collapsible/index.js';

export function registerRosettaDashLayoutElements(): void {
  registerLayoutAccordion();
  registerLayoutAccordionLinkList();
  registerRdGridLayout();
  registerRdFlexLayout();
  registerRdTabsLayout();
  registerRdModalLayout();
  registerRdCollapsible();
}
