import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { FlexLayout } from '@rosettadash/angular/layout/flex';
import { DetailPanel } from '@rosettadash/angular/visual/detail';
import { MOCK_DESTINATIONS, formatVisitorCount, getDestinationById } from '@destination-atlas';
import { roleAllows } from '../lib/roles';
import {
  filterHistoricByPreset,
  formatRegionLabel,
  formatVisitPeriod,
  historicWindowLabel,
  localizedDestinationName,
  periodColumnLabel,
  REGION_OPTIONS,
} from '../lib/atlas-utils';
import { AtlasStateService } from '../services/atlas-state.service';
import { RoleGatePanelComponent } from '../components/role-gate-panel.component';
import {
  DaBoundSelectInputComponent,
  DaBoundTextInputComponent,
} from '../components/proof-form-fields.component';
import {
  FilterSummaryComponent,
  TimePresetButtonsComponent,
} from '../components/filter-summary.component';

const TIME_PRESETS = [
  { id: '1y', label: '1 year' },
  { id: '5y', label: '5 years' },
  { id: 'all', label: 'All' },
];

@Component({
  selector: 'da-destinations-screen',
  standalone: true,
  imports: [
    FlexLayout,
    DetailPanel,
    RoleGatePanelComponent,
    DaBoundTextInputComponent,
    DaBoundSelectInputComponent,
    FilterSummaryComponent,
    TimePresetButtonsComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="da-panel">
      <h2>Destinations</h2>
      <p>Browse and filter mock destination records.</p>
      <div class="da-stack">
        <da-role-gate-panel
          [gateLabel]="'Destination filters'"
          [currentRole]="atlas.userRole()"
          [allowedRoles]="['editor', 'admin']"
          statusText="Editor filters active"
          hiddenStatusText="Filters are available to Editor and Admin roles. Viewer sees the full list."
        >
          <section class="rd-filter-grid">
            <da-bound-text-input
              [fieldLabel]="'Search'"
              placeholder="Destination name…"
              [value]="atlas.destSearch()"
              (valueChange)="atlas.destSearch.set($event)"
            />
            <da-bound-select-input
              [fieldLabel]="'Region'"
              placeholder="All regions"
              [options]="regionOptions"
              [value]="atlas.destRegion()"
              (valueChange)="atlas.destRegion.set($event)"
            />
            <section class="rd-input-date-range">
              <span class="rd-field__label">Visit period</span>
              <div class="rd-date-range__controls">
                <input
                  type="month"
                  class="rd-input rd-date-range__input"
                  aria-label="Visit period start"
                  [value]="atlas.visitPeriodStart()"
                  (change)="onVisitStartChange($event)"
                />
                <span class="rd-date-range__sep">to</span>
                <input
                  type="month"
                  class="rd-input rd-date-range__input"
                  aria-label="Visit period end"
                  [value]="atlas.visitPeriodEnd()"
                  (change)="onVisitEndChange($event)"
                />
              </div>
            </section>
            <da-time-preset-buttons
              [fieldLabel]="'Historic window'"
              [presets]="timePresets"
              [activePresetId]="atlas.timePreset()"
              (presetChange)="atlas.timePreset.set($event)"
            />
          </section>
        </da-role-gate-panel>

        <da-filter-summary
          [count]="filtered().length"
          countNoun="destination"
          [chips]="filterChips()"
          [hint]="filterHint()"
        />

        <rd-flex direction="row" [gap]="16" title="Browse destinations">
          <div style="flex: 1.4; min-width: 0">
          <section class="rd-table da-destinations-table">
            <header class="rd-table__header"><span>Destinations</span></header>
            <div class="rd-table__scroll">
            <table class="rd-table__table">
              <thead>
                <tr>
                  <th>Destination</th>
                  <th>Region</th>
                  <th style="text-align: right">2024 visitors</th>
                  <th style="text-align: right">Period</th>
                </tr>
              </thead>
              <tbody>
                @for (row of tableRows(); track row.id) {
                  <tr
                    [class.rd-table__row--selected]="row.id === atlas.selectedId()"
                    [class.da-table-row--clickable]="canSelectRows()"
                    (click)="selectRow(row.id)"
                  >
                    <td>{{ row.name }}</td>
                    <td>{{ formatRegion(row.status) }}</td>
                    <td style="text-align: right">{{ formatCount(row.amount) }}</td>
                    <td style="text-align: right">{{ row.date }}</td>
                  </tr>
                }
              </tbody>
            </table>
            </div>
          </section>
          </div>

          <div style="flex: 1; min-width: 0">
          <rd-detail title="Destination detail">
            @if (!canSelectRows()) {
              <p class="da-detail-body">
                Switch to Editor or Admin to select rows and view destination details.
              </p>
            } @else if (selected(); as dest) {
              <div>
                <p class="rd-detail-card__title">{{ destTitle(dest) }}</p>
                <p class="rd-detail-card__meta">{{ formatRegion(dest.region) }}</p>
                <dl class="rd-detail-stats rd-detail-stats--compact">
                  <div>
                    <dt>Current visitors</dt>
                    <dd>{{ formatCount(dest.visitorsCurrent) }} (2024)</dd>
                  </div>
                  <div>
                    <dt>Coordinates</dt>
                    <dd>{{ dest.lat.toFixed(4) }}, {{ dest.lng.toFixed(4) }}</dd>
                  </div>
                </dl>
                <section class="rd-detail-historic rd-detail-historic--compact">
                  <h4>Historic visitors ({{ historicLabel() }})</h4>
                  <ul>
                    @for (row of selectedHistoric(); track row.year) {
                      <li>
                        <span>{{ row.year }}</span>
                        <strong>{{ formatCount(row.visitors) }}</strong>
                      </li>
                    }
                  </ul>
                </section>
                <p class="da-detail-actions">
                  <button type="button" class="rd-button" (click)="atlas.focusDestinationOnMap(dest.id)">
                    View on map
                  </button>
                </p>
              </div>
            } @else {
              <p class="da-detail-body">Select a destination row to view details.</p>
            }
          </rd-detail>
          </div>
        </rd-flex>
      </div>
    </section>
  `,
})
export class DestinationsScreenComponent {
  readonly atlas = inject(AtlasStateService);

  readonly regionOptions = REGION_OPTIONS;
  readonly timePresets = TIME_PRESETS;
  readonly formatCount = formatVisitorCount;

  readonly filtered = computed(() => {
    const locale = this.atlas.locale();
    const search = this.atlas.destSearch().toLowerCase();
    const region = this.atlas.destRegion();
    return MOCK_DESTINATIONS.filter((dest) => {
      const name = localizedDestinationName(dest, locale).toLowerCase();
      const matchesSearch = !search || name.includes(search);
      const matchesRegion = !region || dest.region === region;
      return matchesSearch && matchesRegion;
    });
  });

  readonly periodLabel = computed(() => periodColumnLabel(this.atlas.timePreset()));

  readonly tableRows = computed(() =>
    this.filtered().map((dest) => ({
      id: dest.id,
      name: localizedDestinationName(dest, this.atlas.locale()),
      status: dest.region,
      amount: dest.visitorsCurrent,
      date: this.periodLabel(),
    })),
  );

  readonly selected = computed(() => getDestinationById(this.atlas.selectedId()));

  readonly selectedHistoric = computed(() => {
    const dest = this.selected();
    return dest ? filterHistoricByPreset(dest, this.atlas.timePreset()) : [];
  });

  readonly filtersActive = computed(
    () =>
      Boolean(this.atlas.destSearch()) ||
      Boolean(this.atlas.destRegion()) ||
      this.atlas.timePreset() !== '5y' ||
      this.atlas.visitPeriodStart() !== '2015-01' ||
      this.atlas.visitPeriodEnd() !== '2024-12',
  );

  readonly filterChips = computed(() => [
    ...(this.atlas.destSearch() ? [{ label: 'Search', value: this.atlas.destSearch() }] : []),
    ...(this.atlas.destRegion()
      ? [{ label: 'Region', value: formatRegionLabel(this.atlas.destRegion()) }]
      : []),
    {
      label: 'Visit period',
      value: formatVisitPeriod(this.atlas.visitPeriodStart(), this.atlas.visitPeriodEnd()),
    },
    { label: 'Historic window', value: historicWindowLabel(this.atlas.timePreset()) },
  ]);

  readonly filterHint = computed(() => {
    const count = this.filtered().length;
    const period = this.periodLabel();
    if (this.filtersActive()) {
      return `Showing ${count} match${count === 1 ? '' : 'es'}. Historic window controls which years appear in the table Period column and detail panel (${period}).`;
    }
    return `Historic window is set to ${historicWindowLabel(this.atlas.timePreset())} — detail panels show visitor totals for ${period}.`;
  });

  canSelectRows(): boolean {
    return roleAllows(this.atlas.userRole(), ['editor', 'admin']);
  }

  formatRegion(value: string | undefined): string {
    return formatRegionLabel(String(value ?? ''));
  }

  destTitle(dest: NonNullable<ReturnType<typeof getDestinationById>>): string {
    return localizedDestinationName(dest, this.atlas.locale());
  }

  historicLabel(): string {
    return historicWindowLabel(this.atlas.timePreset());
  }

  selectRow(id: string): void {
    if (this.canSelectRows()) {
      this.atlas.setSelectedId(id);
    }
  }

  onVisitStartChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.atlas.setVisitPeriod({ startDate: value, endDate: this.atlas.visitPeriodEnd() });
  }

  onVisitEndChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.atlas.setVisitPeriod({ startDate: this.atlas.visitPeriodStart(), endDate: value });
  }
}
