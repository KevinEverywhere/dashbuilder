import { defineRosettaElement } from '../../lib/element-utils.js';
import { RosettaAtomElement } from '../../lib/rosetta-atom-element.js';

export const RD_LOADING_SKELETON_TAG = 'rd-loading-skeleton';

export interface LoadingSkeletonProps {
  lines?: number;
  className?: string;
  style?: Record<string, string>;
  children?: unknown;
}

/** @rosettadash/web-components/visual/skeleton — visual.skeleton */
export class RdLoadingSkeletonElement extends RosettaAtomElement {
  static readonly tagName = RD_LOADING_SKELETON_TAG;

  static get observedAttributes(): string[] {
    return ["lines"];
  }

  protected buildMarkup(): string {
    const lines = this.readNumAttr('lines', 4);
    const rows = Array.from({ length: lines }, (_, i) => `<span class="rd-skeleton__line${i === 2 ? ' rd-skeleton__line--short' : ''}"></span>`).join('');
    return `
      <section class="rd-skeleton" data-testid="rd-skeleton">${rows}<div data-ref="slot"></div></section>`;
  }
}

export function registerRdLoadingSkeleton(): void {
  defineRosettaElement(RD_LOADING_SKELETON_TAG, RdLoadingSkeletonElement);
}
