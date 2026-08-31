import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export interface DetailPanelProps {
  title?: string;
  emptyMessage?: string;
  className?: string;
}

/** @rosettadash/angular/visual/detail — visual.detail */
@Component({
  selector: 'rd-detail',
  standalone: true,
  imports: [NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section [attr.data-testid]="'rd-detail'" [ngClass]="rootClass()">
      <header class="rd-detail__header"><span>{{ title() ?? 'Details' }}</span></header>
      <p class="rd-detail__empty">{{ emptyMessage() ?? 'Select a row to view details' }}</p>
      <div class="rd-detail__body">
        <ng-content />
      </div>
    </section>
  `,
})
export class DetailPanel {
  readonly className = input<string | undefined>(undefined);
  readonly title = input<string | undefined>(undefined);
  readonly emptyMessage = input<string | undefined>(undefined);

  readonly rootClass = computed(() =>
    ['rd-detail', this.className()].filter(Boolean).join(' '),
  );
}
