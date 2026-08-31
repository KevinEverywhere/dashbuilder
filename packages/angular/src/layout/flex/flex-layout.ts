import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type FlexDensity = 'comfortable' | 'compact';

export interface FlexLayoutProps {
  title?: string;
  direction?: 'row' | 'column';
  gap?: number | string;
  density?: FlexDensity;
  className?: string;
}

/** @rosettadash/angular/layout/flex — layout.flex */
@Component({
  selector: 'rd-flex',
  standalone: true,
  imports: [NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section [attr.data-testid]="'rd-flex'" [ngClass]="rootClass()">
      @if (title()) { <span class="rd-flex__title">{{ title() }}</span> }
      <div class="rd-flex__flex" [style.flex-direction]="direction() ?? 'row'" [style.gap.px]="flexGap()"><ng-content /></div>
    </section>
  `,
})
export class FlexLayout {
  readonly className = input<string | undefined>(undefined);
  readonly title = input<string | undefined>(undefined);
  readonly direction = input<'row' | 'column' | undefined>(undefined);
  readonly gap = input<number | string | undefined>(undefined);
  readonly density = input<FlexDensity | undefined>(undefined);

  readonly rootClass = computed(() =>
    [
      'rd-flex',
      this.density() === 'compact' ? 'rd-flex--compact' : '',
      this.className(),
    ]
      .filter(Boolean)
      .join(' '),
  );
  flexGap(): number {
    const gap = this.gap();
    return typeof gap === 'number' ? gap : 12;
  }
}
