import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export interface ScrollRegionProps {
  title?: string;
  maxHeight?: string;
  overlayScrollbar?: boolean;
  className?: string;
}

/** @rosettadash/angular/layout/scroll-region — layout.scroll-region */
@Component({
  selector: 'rd-scroll-region',
  standalone: true,
  imports: [NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section
      [attr.data-testid]="'rd-scroll-region'"
      [ngClass]="rootClass()"
      [class.rd-scroll-region--overlay-scrollbar]="overlayScrollbar() !== false"
      [style.max-height]="maxHeight() ?? null"
      [attr.aria-label]="title() ?? 'Scrollable content'"
    >
      @if (title()) { <header class="rd-scroll-region__header">{{ title() }}</header> }
      <div class="rd-scroll-region__body"><ng-content /></div>
    </section>
  `,
})
export class ScrollRegion {
  readonly className = input<string | undefined>(undefined);
  readonly title = input<string | undefined>(undefined);
  readonly maxHeight = input<string | undefined>(undefined);
  readonly overlayScrollbar = input<boolean | undefined>(undefined);

  readonly rootClass = computed(() =>
    ['rd-scroll-region', this.className()].filter(Boolean).join(' '),
  );
}
