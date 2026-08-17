import { defineRosettaElement } from '../../../lib/element-utils.js';
import { RosettaAtomElement } from '../../../lib/rosetta-atom-element.js';

export const RD_WASM_WORKER_HOST_TAG = 'rd-wasm-worker-host';

export interface WasmWorkerHostProps {
  workerLabel?: string;
  workerStatus?: string;
  className?: string;
  style?: Record<string, string>;
  children?: unknown;
}

/** @rosettadash/web-components/visual/wasm/worker-host — visual.wasm.worker-host */
export class RdWasmWorkerHostElement extends RosettaAtomElement {
  static readonly tagName = RD_WASM_WORKER_HOST_TAG;

  static get observedAttributes(): string[] {
    return ["worker-label","worker-status"];
  }

  protected buildMarkup(): string {
    const workerLabel = this.readAttr('worker-label', 'Worker');
    const workerStatus = this.readAttr('worker-status', 'Idle');
    return `
      <section class="rd-wasm-worker-host" data-testid="rd-wasm-worker-host">
        <span class="rd-wasm__label">${this.esc(workerLabel)}</span>
        <span class="rd-wasm__status">${this.esc(workerStatus)}</span>
        <div data-ref="slot"></div>
      </section>`;
  }
}

export function registerRdWasmWorkerHost(): void {
  defineRosettaElement(RD_WASM_WORKER_HOST_TAG, RdWasmWorkerHostElement);
}
