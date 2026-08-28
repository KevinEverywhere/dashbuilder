import { findDestinationListRow, scrollSelectedDestinationIntoList } from '@destination-atlas';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  effect,
  inject,
  input,
  output,
} from '@angular/core';

export type GeoExplorerListPlacement = 'left' | 'right';

export interface DestinationSelectItem {
  id: string;
  label: string;
  meta?: string;
}

@Component({
  selector: 'da-destination-select-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="rd-destination-list" [attr.aria-label]="listTitle()">
      <header class="rd-destination-list__header">
        <h3>{{ listTitle() }}</h3>
        <span class="rd-destination-list__count">{{ items().length }}</span>
      </header>
      <ul class="rd-destination-list__items">
        @for (item of items(); track item.id) {
          <li
            class="rd-destination-list__item"
            [class.rd-destination-list__item--selected]="item.id === selectedId()"
          >
            <button
              type="button"
              class="rd-destination-list__button"
              [attr.data-dest-id]="item.id"
              [attr.aria-current]="item.id === selectedId() ? 'true' : null"
              (click)="select.emit(item.id)"
            >
              <span class="rd-destination-list__label">{{ item.label }}</span>
              @if (item.meta) {
                <span class="rd-destination-list__meta">{{ item.meta }}</span>
              }
            </button>
          </li>
        }
      </ul>
    </section>
  `,
})
export class DestinationSelectListComponent {
  readonly listTitle = input('Destinations');
  readonly items = input<DestinationSelectItem[]>([]);
  readonly selectedId = input<string>();
  readonly select = output<string>();

  private readonly host = inject(ElementRef<HTMLElement>);

  constructor() {
    effect(() => {
      const selectedId = this.selectedId();
      const items = this.items();
      if (!selectedId) {
        return;
      }
      const index = items.findIndex((item) => item.id === selectedId);
      queueMicrotask(() => {
        scrollSelectedDestinationIntoList(
          findDestinationListRow(this.host.nativeElement, selectedId),
          index,
          items.length,
        );
      });
    });
  }
}

@Component({
  selector: 'da-geo-explorer-layout',
  standalone: true,
  imports: [DestinationSelectListComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section
      class="rd-geo-explorer"
      data-testid="rd-geo-explorer"
      [style.--rd-geo-explorer-list-width]="listWidth()"
      [style.--rd-geo-explorer-min-height]="viewportMinHeight()"
    >
      @if (explorerTitle()) {
        <span class="rd-geo-explorer__title">{{ explorerTitle() }}</span>
      }
      <div
        class="rd-geo-explorer__body"
        [class.rd-geo-explorer__body--list-left]="listPlacement() === 'left'"
        [class.rd-geo-explorer__body--list-right]="listPlacement() === 'right'"
      >
        <div class="rd-geo-explorer__viewport">
          <ng-content />
        </div>
        <da-destination-select-list
          class="rd-geo-explorer__list"
          [listTitle]="sidebarTitle()"
          [items]="items()"
          [selectedId]="selectedId()"
          (select)="select.emit($event)"
        />
      </div>
    </section>
  `,
})
export class GeoExplorerLayoutComponent {
  readonly explorerTitle = input<string>();
  readonly sidebarTitle = input('Destinations');
  readonly listPlacement = input<GeoExplorerListPlacement>('right');
  readonly listWidth = input('14rem');
  readonly viewportMinHeight = input('28rem');
  readonly items = input<DestinationSelectItem[]>([]);
  readonly selectedId = input<string>();
  readonly select = output<string>();
}
