<script module lang="ts">
  export const DESTINATIONS_SOURCE = `<DestinationsScreen …>
  <FilterGrid>…</FilterGrid>
  <DataTable rows={rows} />
  <DetailPanel>…</DetailPanel>
</DestinationsScreen>`;
</script>

<script lang="ts">
  import FlexLayout from '@rosettadash/svelte/layout/flex';
  import DateRangeFilter from '@rosettadash/svelte/visual/input/date-range';
  import DetailPanel from '@rosettadash/svelte/visual/detail';
  import DataTable from '@rosettadash/svelte/visual/table';
  import type { DataTableRow } from '@rosettadash/svelte/visual/table';
  import { MOCK_DESTINATIONS, formatVisitorCount, getDestinationById } from '@destination-atlas';
  import BoundSelectInput from '../components/BoundSelectInput.svelte';
  import BoundTextInput from '../components/BoundTextInput.svelte';
  import FilterSummary from '../components/FilterSummary.svelte';
  import RoleGatePanel from '../components/RoleGatePanel.svelte';
  import TimePresetButtons from '../components/TimePresetButtons.svelte';
  import type { AtlasUserRole } from '../lib/roles';
  import {
    filterHistoricByPreset,
    formatRegionLabel,
    formatVisitPeriod,
    historicWindowLabel,
    localizedDestinationName,
    periodColumnLabel,
    REGION_OPTIONS,
  } from '../lib/atlas-utils';

  let {
    locale,
    userRole,
    selectedId,
    destSearch,
    destRegion,
    timePreset,
    visitPeriodStart,
    visitPeriodEnd,
    onSelectedIdChange,
    onDestSearchChange,
    onDestRegionChange,
    onTimePresetChange,
    onVisitPeriodChange,
    onFocusDestinationOnMap,
  }: {
    locale: string;
    userRole: AtlasUserRole;
    selectedId: string;
    destSearch: string;
    destRegion: string;
    timePreset: string;
    visitPeriodStart: string;
    visitPeriodEnd: string;
    onSelectedIdChange?: (id: string) => void;
    onDestSearchChange?: (value: string) => void;
    onDestRegionChange?: (value: string) => void;
    onTimePresetChange?: (preset: string) => void;
    onVisitPeriodChange?: (range: { startDate: string; endDate: string }) => void;
    onFocusDestinationOnMap?: (id: string) => void;
  } = $props();

  const filtered = $derived(
    MOCK_DESTINATIONS.filter((dest) => {
      const name = localizedDestinationName(dest, locale).toLowerCase();
      const matchesSearch = !destSearch || name.includes(destSearch.toLowerCase());
      const matchesRegion = !destRegion || dest.region === destRegion;
      return matchesSearch && matchesRegion;
    }),
  );

  const periodLabel = $derived(periodColumnLabel(timePreset));

  const rows = $derived<DataTableRow[]>(
    filtered.map((dest) => ({
      id: dest.id,
      name: localizedDestinationName(dest, locale),
      status: dest.region,
      amount: formatVisitorCount(dest.visitorsCurrent),
      date: periodLabel,
    })),
  );

  const selected = $derived(getDestinationById(selectedId));
  const selectedHistoric = $derived(
    selected ? filterHistoricByPreset(selected, timePreset) : [],
  );

  const filterChips = $derived([
    ...(destSearch ? [{ label: 'Search', value: destSearch }] : []),
    ...(destRegion ? [{ label: 'Region', value: formatRegionLabel(destRegion) }] : []),
    { label: 'Visit period', value: formatVisitPeriod(visitPeriodStart, visitPeriodEnd) },
    { label: 'Historic window', value: historicWindowLabel(timePreset) },
  ]);
</script>

<section class="da-panel">
  <h2>Destinations</h2>
  <p>Browse and filter mock destination records.</p>
  <div class="da-stack">
    <RoleGatePanel
      gateLabel="Destination filters"
      currentRole={userRole}
      allowedRoles={['editor', 'admin']}
      statusText="Editor filters active"
      hiddenStatusText="Filters are available to Editor and Admin roles. Viewer sees the full list."
    >
      <div class="da-stack da-stack--2">
        <div class="rd-filter-grid">
          <BoundTextInput
            fieldLabel="Search"
            placeholder="Destination name…"
            value={destSearch}
            onValueChange={(value) => onDestSearchChange?.(value)}
          />
          <BoundSelectInput
            fieldLabel="Region"
            placeholder="All regions"
            options={REGION_OPTIONS}
            value={destRegion}
            onValueChange={(value) => onDestRegionChange?.(value)}
          />
          <DateRangeFilter
            label="Visit period"
            granularity="month"
            startDate={visitPeriodStart}
            endDate={visitPeriodEnd}
            onChange={(range) => onVisitPeriodChange?.(range)}
          />
          <TimePresetButtons
            fieldLabel="Historic window"
            presets={[
              { id: '1y', label: '1 year' },
              { id: '5y', label: '5 years' },
              { id: 'all', label: 'All' },
            ]}
            activePresetId={timePreset}
            onPresetChange={(preset) => onTimePresetChange?.(preset)}
          />
        </div>
      </div>
    </RoleGatePanel>

    <FilterSummary
      count={filtered.length}
      countNoun="destination"
      chips={filterChips}
      hint={`Historic window: ${historicWindowLabel(timePreset)} (${periodLabel}).`}
    />

    <FlexLayout direction="row" gap={16} title="Browse destinations">
      <DataTable
        title="Destinations"
        {rows}
        selectedRowId={selectedId}
        onRowSelect={userRole === 'viewer' ? undefined : (id) => onSelectedIdChange?.(id)}
      />
      <DetailPanel title="Destination detail">
        {#if userRole === 'viewer'}
          <p class="da-detail-body">
            Switch to Editor or Admin to select rows and view destination details.
          </p>
        {:else if selected}
          <p class="rd-detail-card__title">{localizedDestinationName(selected, locale)}</p>
          <p class="rd-detail-card__meta">{formatRegionLabel(selected.region)}</p>
          <dl class="rd-detail-stats rd-detail-stats--compact">
            <div>
              <dt>Current visitors</dt>
              <dd>{formatVisitorCount(selected.visitorsCurrent)} (2024)</dd>
            </div>
            <div>
              <dt>Coordinates</dt>
              <dd>{selected.lat.toFixed(4)}, {selected.lng.toFixed(4)}</dd>
            </div>
          </dl>
          <section class="rd-detail-historic rd-detail-historic--compact">
            <h4>Historic visitors ({historicWindowLabel(timePreset)})</h4>
            <ul>
              {#each selectedHistoric as row (row.year)}
                <li>
                  <span>{row.year}</span>
                  <strong>{formatVisitorCount(row.visitors)}</strong>
                </li>
              {/each}
            </ul>
          </section>
          <p class="da-detail-actions">
            <button type="button" class="rd-button" onclick={() => onFocusDestinationOnMap?.(selected.id)}>
              View on map
            </button>
          </p>
        {:else}
          <p class="da-detail-body">Select a destination row to view details.</p>
        {/if}
      </DetailPanel>
    </FlexLayout>
  </div>
</section>
