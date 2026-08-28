import { TimePreset } from '@rosettadash/react/domain/time-preset';
import { RoleGate } from '@rosettadash/react/domain/role-gate';
import { FilterGrid } from '@rosettadash/react/layout/filter-grid';
import { FlexLayout } from '@rosettadash/react/layout/flex';
import { DateRangeFilter } from '@rosettadash/react/visual/input/date-range';
import { SelectInput } from '@rosettadash/react/visual/input/select';
import { TextInput } from '@rosettadash/react/visual/input/text';
import { DetailPanel, DetailHistoricList, DetailStats } from '@rosettadash/react/visual/detail';
import { FilterSummary } from '@rosettadash/react/visual/filter/filter-summary';
import { DataTable, type DataTableRow } from '@rosettadash/react/visual/table';
import { MOCK_DESTINATIONS, formatVisitorCount, getDestinationById } from '@destination-atlas';
import type { AtlasContext } from '../state/useDestinationAtlasState';
import {
  filterHistoricByPreset,
  formatRegionLabel,
  formatVisitPeriod,
  historicWindowLabel,
  localizedDestinationName,
  periodColumnLabel,
  REGION_OPTIONS,
} from '../lib/atlas-utils';

type Props = Pick<
  AtlasContext,
  | 'locale'
  | 'userRole'
  | 'selectedId'
  | 'setSelectedId'
  | 'destSearch'
  | 'setDestSearch'
  | 'destRegion'
  | 'setDestRegion'
  | 'timePreset'
  | 'setTimePreset'
  | 'visitPeriodStart'
  | 'visitPeriodEnd'
  | 'setVisitPeriod'
  | 'focusDestinationOnMap'
>;

export const DESTINATIONS_SOURCE = `<DestinationsScreen …>
  <FilterGrid>
    <TextInput label="Search" value={destSearch} />
    <SelectInput label="Region" value={destRegion} />
    <DateRangeFilter granularity="month" startDate={visitPeriodStart} endDate={visitPeriodEnd} />
    <TimePreset activePresetId={timePreset} onPresetChange={setTimePreset} />
  </FilterGrid>
  <FilterSummary count={filtered.length} chips={…} hint={…} />
  <FlexLayout itemFlex={[1.4, 1]} stretchItems>
    <DataTable rows={rows} selectedRowId={selectedId} />
    <DetailPanel>
      <DetailStats items={…} compact />
      <DetailHistoricList title={…} items={…} compact />
    </DetailPanel>
  </FlexLayout>
</DestinationsScreen>`;

export function DestinationsScreen({
  locale,
  userRole,
  selectedId,
  setSelectedId,
  destSearch,
  setDestSearch,
  destRegion,
  setDestRegion,
  timePreset,
  setTimePreset,
  visitPeriodStart,
  visitPeriodEnd,
  setVisitPeriod,
  focusDestinationOnMap,
}: Props) {
  const filtered = MOCK_DESTINATIONS.filter((dest) => {
    const name = localizedDestinationName(dest, locale).toLowerCase();
    const matchesSearch = !destSearch || name.includes(destSearch.toLowerCase());
    const matchesRegion = !destRegion || dest.region === destRegion;
    return matchesSearch && matchesRegion;
  });

  const periodLabel = periodColumnLabel(timePreset);
  const rows: DataTableRow[] = filtered.map((dest) => ({
    id: dest.id,
    name: localizedDestinationName(dest, locale),
    status: dest.region,
    amount: formatVisitorCount(dest.visitorsCurrent),
    date: periodLabel,
  }));

  const selected = getDestinationById(selectedId);
  const selectedHistoric = selected ? filterHistoricByPreset(selected, timePreset) : [];
  const filtersActive =
    Boolean(destSearch) ||
    Boolean(destRegion) ||
    timePreset !== '5y' ||
    visitPeriodStart !== '2015-01' ||
    visitPeriodEnd !== '2024-12';

  const filterChips = [
    ...(destSearch ? [{ label: 'Search', value: destSearch }] : []),
    ...(destRegion ? [{ label: 'Region', value: formatRegionLabel(destRegion) }] : []),
    { label: 'Visit period', value: formatVisitPeriod(visitPeriodStart, visitPeriodEnd) },
    { label: 'Historic window', value: historicWindowLabel(timePreset) },
  ];

  const filterHint = filtersActive
    ? `Showing ${filtered.length} match${filtered.length === 1 ? '' : 'es'}. Historic window controls which years appear in the table Period column and detail panel (${periodLabel}).`
    : `Historic window is set to ${historicWindowLabel(timePreset)} — detail panels show visitor totals for ${periodLabel}.`;

  return (
    <section className="da-panel">
      <h2>Destinations</h2>
      <p>Browse and filter mock destination records.</p>
      <div className="da-stack">
        <RoleGate
          label="Destination filters"
          currentRole={userRole}
          allowedRoles={['editor', 'admin']}
          statusText="Editor filters active"
          hiddenStatusText="Filters are available to Editor and Admin roles. Viewer sees the full list."
        >
          <FilterGrid>
            <TextInput
              label="Search"
              placeholder="Destination name…"
              value={destSearch}
              onChange={setDestSearch}
            />
            <SelectInput
              label="Region"
              placeholder="All regions"
              options={REGION_OPTIONS}
              value={destRegion}
              onChange={setDestRegion}
            />
            <DateRangeFilter
              label="Visit period"
              granularity="month"
              startDate={visitPeriodStart}
              endDate={visitPeriodEnd}
              onChange={setVisitPeriod}
            />
            <TimePreset
              label="Historic window"
              presets={[
                { id: '1y', label: '1 year' },
                { id: '5y', label: '5 years' },
                { id: 'all', label: 'All' },
              ]}
              activePresetId={timePreset}
              onPresetChange={setTimePreset}
            />
          </FilterGrid>
        </RoleGate>

        <FilterSummary
          count={filtered.length}
          countNoun="destination"
          chips={filterChips}
          hint={filterHint}
        />

        <FlexLayout direction="row" gap={16} title="Browse destinations" itemFlex={[1.4, 1]} stretchItems>
          <DataTable
            title="Destinations"
            rows={rows}
            selectedRowId={selectedId}
            onRowSelect={userRole === 'viewer' ? undefined : setSelectedId}
            columns={[
              { key: 'name', header: 'Destination' },
              {
                key: 'status',
                header: 'Region',
                format: (value) => formatRegionLabel(String(value ?? '')),
              },
              {
                key: 'amount',
                header: '2024 visitors',
                align: 'right',
                width: '7.5rem',
                format: (value) => formatVisitorCount(Number(value ?? 0)),
              },
              { key: 'date', header: 'Period', align: 'right', width: '9rem' },
            ]}
          />
          <DetailPanel title="Destination detail">
            {userRole === 'viewer' ? (
              <p className="da-detail-body">
                Switch to Editor or Admin to select rows and view destination details.
              </p>
            ) : selected ? (
              <div>
                <p className="rd-detail-card__title">
                  {localizedDestinationName(selected, locale)}
                </p>
                <p className="rd-detail-card__meta">{formatRegionLabel(selected.region)}</p>
                <DetailStats
                  compact
                  items={[
                    {
                      label: 'Current visitors',
                      value: `${formatVisitorCount(selected.visitorsCurrent)} (2024)`,
                    },
                    {
                      label: 'Coordinates',
                      value: `${selected.lat.toFixed(4)}, ${selected.lng.toFixed(4)}`,
                    },
                  ]}
                />
                <DetailHistoricList
                  compact
                  title={`Historic visitors (${historicWindowLabel(timePreset)})`}
                  items={selectedHistoric.map((row) => ({
                    label: String(row.year),
                    value: formatVisitorCount(row.visitors),
                  }))}
                />
                <p className="da-detail-actions">
                  <button
                    type="button"
                    className="rd-button"
                    onClick={() => focusDestinationOnMap(selected.id)}
                  >
                    View on map
                  </button>
                </p>
              </div>
            ) : (
              <p className="da-detail-body">Select a destination row to view details.</p>
            )}
          </DetailPanel>
        </FlexLayout>
      </div>
    </section>
  );
}
