import { defineRosettaElement } from '../../../lib/element-utils.js';
import { RosettaAtomElement } from '../../../lib/rosetta-atom-element.js';

export const RD_THREE_GLTF_MODEL_TAG = 'rd-three-gltf-model';

export interface ThreeGltfModelProps {
  title?: string;
  mode?: string;
  className?: string;
  style?: Record<string, string>;
  children?: unknown;
}

/** @rosettadash/web-components/visual/display/3d-gltf-model — visual.display.3d-gltf-model */
export class RdThreeGltfModelElement extends RosettaAtomElement {
  static readonly tagName = RD_THREE_GLTF_MODEL_TAG;

  static get observedAttributes(): string[] {
    return ["title","mode","texture-url","markers","selected-id"];
  }

  protected buildMarkup(): string {
    const title = this.readAttr('title', '3D view');
    const mode = this.readAttr('mode', 'preview');
    return `
      <section class="rd-display-3d-gltf-model" data-testid="rd-display-3d-gltf-model" data-three-mode="${this.esc(mode)}" aria-label="${this.esc(title)}">
        <header class="rd-display-3d-gltf-model__header">${this.esc(title)}</header>
        <div class="rd-display-3d-gltf-model__placeholder" aria-hidden="true">3D preview</div>
        <div data-ref="slot"></div>
      </section>`;
  }
}

export function registerRdThreeGltfModel(): void {
  defineRosettaElement(RD_THREE_GLTF_MODEL_TAG, RdThreeGltfModelElement);
}
