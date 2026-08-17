import { defineRosettaElement } from '../../../lib/element-utils.js';
import { RosettaAtomElement } from '../../../lib/rosetta-atom-element.js';

export const RD_WASM_MODULE_TAG = 'rd-wasm-module';

export interface WasmModuleProps {
  moduleLabel?: string;
  exportName?: string;
  className?: string;
  style?: Record<string, string>;
  children?: unknown;
}

/** @rosettadash/web-components/visual/wasm/module — visual.wasm.module */
export class RdWasmModuleElement extends RosettaAtomElement {
  static readonly tagName = RD_WASM_MODULE_TAG;

  static get observedAttributes(): string[] {
    return ["module-label","export-name"];
  }

  protected buildMarkup(): string {
    const moduleLabel = this.readAttr('module-label', 'WASM Module');
    const exportName = this.readAttr('export-name', 'run()');
    return `
      <section class="rd-wasm-module" data-testid="rd-wasm-module">
        <span class="rd-wasm__label">${this.esc(moduleLabel)}</span>
        <code>${this.esc(exportName)}()</code>
        <div data-ref="slot"></div>
      </section>`;
  }
}

export function registerRdWasmModule(): void {
  defineRosettaElement(RD_WASM_MODULE_TAG, RdWasmModuleElement);
}
