<script lang="ts">
  import FlexLayout from '@rosettadash/svelte/layout/flex';
  import Timer from '@rosettadash/svelte/logic/timer';
  import DetailPanel from '@rosettadash/svelte/visual/detail';
  import GeoMap from '@rosettadash/svelte/visual/display/geo-map';
  import SelectInput from '@rosettadash/svelte/visual/input/select';
  import KpiCard from '@rosettadash/svelte/visual/kpi';
  import StatusBadge from '@rosettadash/svelte/visual/plugin/status-badge';
  import LoadingSkeleton from '@rosettadash/svelte/visual/skeleton';
  import DataTable from '@rosettadash/svelte/visual/table';
  import { loadPredictions, type PredictionSource, type TransitPrediction } from './predictions';
  import { getTransitStop, TRANSIT_STOPS } from './stops';
  import './TransitArrivals.css';

  const REFRESH_MS = 30_000;

  let { className }: { className?: string } = $props();

  let selectedStopId = $state(TRANSIT_STOPS[0].id);
  let predictions = $state.raw<TransitPrediction[]>([]);
  let selectedRowId = $state('');
  let source = $state<PredictionSource>('sample');
  let loading = $state(true);
  let tickCount = $state(0);

  const selectedStop = $derived(getTransitStop(selectedStopId) ?? TRANSIT_STOPS[0]);
  const selectOptions = $derived(TRANSIT_STOPS.map((stop) => ({ value: stop.id, label: stop.label })));
  const markers = $derived([
    {
      id: selectedStop.id,
      lat: selectedStop.lat,
      lng: selectedStop.lng,
      label: selectedStop.label,
    },
  ]);
  const center = $derived(JSON.stringify({ lat: selectedStop.lat, lng: selectedStop.lng }));
  const selectedPrediction = $derived(
    predictions.find((row) => row.id === selectedRowId) ?? predictions[0],
  );
  const tableRows = $derived(
    predictions.map((row) => ({
      id: row.id,
      name: `${row.route} · ${row.headsign}`,
      status: row.status,
      amount: row.minutes,
      date: row.time,
    })),
  );
  const nextMinutes = $derived(predictions[0]?.minutes);
  const rootClass = $derived(['rd-transit-arrivals', className].filter(Boolean).join(' '));
  const badgeTone = $derived(
    loading ? 'neutral' : source === 'live' ? 'success' : 'warning',
  );
  const badgeText = $derived(loading ? 'Updating' : source === 'live' ? 'Live' : 'Sample');

  function handleStopChange(value: string) {
    if (!value || !getTransitStop(value)) {
      return;
    }
    selectedStopId = value;
    predictions = [];
    selectedRowId = '';
    loading = true;
  }

  $effect(() => {
    const stopId = selectedStopId;
    void tickCount;
    const controller = new AbortController();
    loading = true;

    loadPredictions(stopId, controller.signal)
      .then((result) => {
        if (controller.signal.aborted) {
          return;
        }
        predictions = result.rows;
        source = result.source;
        selectedRowId = result.rows[0]?.id ?? '';
        loading = false;
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }
        console.error(error);
        loading = false;
      });

    return () => controller.abort();
  });

  $effect(() => {
    const id = window.setInterval(() => {
      tickCount += 1;
    }, REFRESH_MS);
    return () => window.clearInterval(id);
  });
</script>

<FlexLayout title="Arrivals" direction="column" gap={10} className={rootClass}>
  <SelectInput
    label="Stop"
    options={selectOptions}
    bind:value={selectedStopId}
    onChange={handleStopChange}
  />
  <GeoMap
    className="rd-transit-arrivals__map"
    provider="leaflet"
    center={center}
    zoom={15}
    markers={markers}
    selectedId={selectedStop.id}
    onMarkerSelect={({ id }) => handleStopChange(id)}
  />
  <FlexLayout direction="row" gap={8}>
    <KpiCard
      title="Minutes to next"
      value={nextMinutes === undefined ? '—' : nextMinutes}
      delta={selectedStop.label}
    />
    <StatusBadge statusText={badgeText} tone={badgeTone} />
  </FlexLayout>
  <Timer label="Auto refresh" mode="interval" intervalMs={REFRESH_MS} tickCount={tickCount} />
  {#if loading && predictions.length === 0}
    <LoadingSkeleton lines={4} />
  {:else}
    <DataTable
      title="Predictions"
      rows={tableRows}
      selectedRowId={selectedPrediction?.id}
      onRowSelect={(rowId) => {
        selectedRowId = rowId;
      }}
    />
  {/if}
  <DetailPanel title="Trip" emptyMessage="Select a prediction">
    {#if selectedPrediction}
      <p class="rd-transit-arrivals__detail">
        {selectedPrediction.route} to {selectedPrediction.headsign} · {selectedPrediction.status} ·
        {selectedPrediction.minutes} min · {selectedPrediction.time}
      </p>
    {/if}
  </DetailPanel>
</FlexLayout>
