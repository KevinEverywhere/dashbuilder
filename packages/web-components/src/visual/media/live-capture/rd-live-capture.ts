import { defineRosettaElement } from '../../../lib/element-utils.js';
import { RosettaAtomElement } from '../../../lib/rosetta-atom-element.js';

export const RD_LIVE_CAPTURE_TAG = 'rd-live-capture';

export interface LiveCaptureProps {
  label?: string;
  onStart?: () => void;
  className?: string;
  style?: Record<string, string>;
  children?: unknown;
}

/** @rosettadash/web-components/visual/media/live-capture — visual.media.live-capture */
export class RdLiveCaptureElement extends RosettaAtomElement {
  static readonly tagName = RD_LIVE_CAPTURE_TAG;

  static get observedAttributes(): string[] {
    return ["label"];
  }

  protected buildMarkup(): string {
    const label = this.readAttr('label', 'Live capture');
    return `
      <section class="rd-media-live-capture" data-testid="rd-media-live-capture">
        <span class="rd-media__label">${this.esc(label)}</span>
        <button type="button" class="rd-button" data-ref="start">Start camera</button>
        <div data-ref="slot"></div>
      </section>`;
  }
}

export function registerRdLiveCapture(): void {
  defineRosettaElement(RD_LIVE_CAPTURE_TAG, RdLiveCaptureElement);
}
