import { defineRosettaElement } from '../../../lib/element-utils.js';
import { RosettaAtomElement } from '../../../lib/rosetta-atom-element.js';

export const RD_THREE_SCENE_POINT_CLOUD_TAG = 'rd-three-scene';

export interface ThreeScenePointCloudProps {
  title?: string;
  mode?: string;
  className?: string;
  style?: Record<string, string>;
  children?: unknown;
}

/** @rosettadash/web-components/visual/display/3d-scene — visual.display.3d-scene */
export class RdThreeScenePointCloudElement extends RosettaAtomElement {
  static readonly tagName = RD_THREE_SCENE_POINT_CLOUD_TAG;

  static get observedAttributes(): string[] {
    return ["title","mode","texture-url","markers","selected-id"];
  }

  protected buildMarkup(): string {
    const title = this.readAttr('title', '3D view');
    const mode = this.readAttr('mode', 'preview');
    return `
      <section class="rd-display-3d-scene" data-testid="rd-display-3d-scene" data-three-mode="${this.esc(mode)}" aria-label="${this.esc(title)}">
        <header class="rd-display-3d-scene__header">${this.esc(title)}</header>
        <div class="rd-display-3d-scene__placeholder" aria-hidden="true">3D preview</div>
        <div data-ref="slot"></div>
      </section>`;
  }
}

export function registerRdThreeScenePointCloud(): void {
  defineRosettaElement(RD_THREE_SCENE_POINT_CLOUD_TAG, RdThreeScenePointCloudElement);
}
