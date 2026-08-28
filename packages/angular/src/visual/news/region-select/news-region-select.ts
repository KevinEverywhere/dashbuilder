import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export interface NewsRegionSelectProps {
  label?: string;
  placeholder?: string;
  options?: { value: string; label: string }[];
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
}

/** @rosettadash/angular/visual/news/region-select — visual.news.region-select */
@Component({
  selector: 'rd-news-region-select',
  standalone: true,
  imports: [NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section [attr.data-testid]="'rd-news-region-select'" [ngClass]="rootClass()">
      @if (label()) { <span class="rd-field__label">{{ label() }}</span> }
      <select class="rd-select">
        <option value="" [selected]="!(value() ?? '')">{{ placeholder() ?? 'Select…' }}</option>
        @for (o of options() ?? []; track o.value) {
          <option [value]="o.value" [selected]="o.value === (value() ?? '')">{{ o.label }}</option>
        }
      </select>
      <ng-content />
    </section>
  `,
})
export class NewsRegionSelect {
  readonly className = input<string | undefined>(undefined);
  readonly label = input<string | undefined>(undefined);
  readonly placeholder = input<string | undefined>(undefined);
  readonly value = input<string | undefined>(undefined);

  readonly rootClass = computed(() =>
    ['rd-news-region-select', this.className()].filter(Boolean).join(' '),
  );
}
