import { defineRosettaElement } from '../../lib/element-utils.js';
import { RosettaAtomElement } from '../../lib/rosetta-atom-element.js';

export const RD_TIMER_TAG = 'rd-timer';

export interface TimerProps {
  label?: string;
  mode?: 'interval' | 'countdown';
  intervalMs?: number;
  tickCount?: number;
  className?: string;
  style?: Record<string, string>;
  children?: unknown;
}

/** @rosettadash/web-components/logic/timer — logic.timer */
export class RdTimerElement extends RosettaAtomElement {
  static readonly tagName = RD_TIMER_TAG;

  static get observedAttributes(): string[] {
    return ["label","mode","interval-ms","tick-count"];
  }

  protected buildMarkup(): string {
    const label = this.readAttr('label');
    const tickCount = this.readAttr('tick-count', '0');
    return `
      <section class="rd-timer" data-testid="rd-timer">
        ${label ? `<span class="rd-timer__label">${this.esc(label)}</span>` : ''}
        <span class="rd-timer__value">${this.esc(tickCount)} ticks</span>
        <div data-ref="slot"></div>
      </section>`;
  }
}

export function registerRdTimer(): void {
  defineRosettaElement(RD_TIMER_TAG, RdTimerElement);
}
