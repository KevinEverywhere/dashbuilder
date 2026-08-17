export * from './domain/index.js';
export * from './layout/index.js';
export * from './logic/index.js';
export * from './visual/index.js';
export * from './wasm/index.js';
export * from './catalog/index.js';

import { registerRosettaDashDomainElements } from './domain/index.js';
import { registerRosettaDashLayoutElements } from './layout/index.js';
import { registerRosettaDashLogicElements } from './logic/index.js';
import { registerRosettaDashVisualElements } from './visual/index.js';
import { registerRosettaDashWasmElements } from './wasm/index.js';
import { registerRosettaDashCatalogElements } from './catalog/index.js';

import './register-shadow-bases.browser.js';

/** Register all RosettaDash runtime custom elements. */
export function registerRosettaDashElements(): void {
  registerRosettaDashLayoutElements();
  registerRosettaDashDomainElements();
  registerRosettaDashLogicElements();
  registerRosettaDashVisualElements();
  registerRosettaDashWasmElements();
  registerRosettaDashCatalogElements();
}
