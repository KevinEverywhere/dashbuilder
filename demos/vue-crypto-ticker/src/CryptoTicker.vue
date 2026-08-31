<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { FlexLayout } from '@rosettadash/vue/layout/flex';
import { LineChart } from '@rosettadash/vue/visual/chart/line';
import { DetailPanel } from '@rosettadash/vue/visual/detail';
import { SelectInput } from '@rosettadash/vue/visual/input/select';
import { KpiCard } from '@rosettadash/vue/visual/kpi';
import { DataTable } from '@rosettadash/vue/visual/table';
import {
  COINS,
  fetchCoinQuote,
  formatUsd,
  type CoinDay,
  type CoinId,
  type CoinQuote,
} from './coins';
import './CryptoTicker.css';

const TABLE_SLOTS = 7;
const DASH = '—';
const SESSION_COLUMNS = [
  { key: 'name', header: 'Day' },
  { key: 'amount', header: 'Close', align: 'right' as const },
  { key: 'status', header: 'Change' },
  { key: 'date', header: 'Volume', align: 'right' as const },
];
const PLACEHOLDER_DAYS: CoinDay[] = Array.from({ length: TABLE_SLOTS }, (_, index) => ({
  id: `slot-${index}`,
  name: '\u00a0',
  status: '\u00a0',
  amount: '\u00a0',
  date: '\u00a0',
  price: 0,
}));

const props = withDefaults(
  defineProps<{
    defaultCoinId?: CoinId;
  }>(),
  { defaultCoinId: 'bitcoin' },
);

const coinId = ref<string>(props.defaultCoinId);
const quote = ref<CoinQuote | null>(null);
const selectedDayId = ref('');

const selectOptions = [...COINS];

const liveQuote = computed(() =>
  quote.value?.market.id === coinId.value ? quote.value : null,
);

const selectedDay = computed<CoinDay | undefined>(() => {
  const days = liveQuote.value?.chart.days ?? [];
  return days.find((day) => day.id === selectedDayId.value) ?? days[0];
});

const tableRows = computed(() => {
  const filled = (liveQuote.value?.chart.days ?? []).slice(0, TABLE_SLOTS);
  return filled.length >= TABLE_SLOTS
    ? filled
    : [...filled, ...PLACEHOLDER_DAYS.slice(filled.length)];
});

const priceLabel = computed(() =>
  liveQuote.value ? formatUsd(liveQuote.value.market.price) : DASH,
);

const deltaLabel = computed(() => {
  if (!liveQuote.value) {
    return DASH;
  }
  const change = liveQuote.value.market.change24h;
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(2)}% 24h`;
});

const coinTitle = computed(() => {
  const label = selectOptions.find((coin) => coin.value === coinId.value)?.label;
  return label ? `${label.split(' (')[0]} price` : 'Price';
});

function onCoin(value: string): void {
  if (value) {
    coinId.value = value;
  }
}

watch(
  coinId,
  (id, _previous, onCleanup) => {
    const controller = new AbortController();
    onCleanup(() => controller.abort());
    fetchCoinQuote(id, controller.signal)
      .then((next) => {
        quote.value = next;
        selectedDayId.value = next.chart.days[0]?.id ?? '';
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }
        console.error(error);
      });
  },
  { immediate: true },
);
</script>

<template>
  <FlexLayout direction="column" :gap="10" class="rd-crypto-ticker">
    <span class="rd-crypto-ticker__title">Crypto ticker</span>
    <FlexLayout direction="row" :gap="8" density="compact" class="rd-crypto-ticker__toolbar">
      <SelectInput label="Coin" :options="selectOptions" :value="coinId" @change="onCoin" />
      <KpiCard :title="coinTitle" :value="priceLabel" :delta="deltaLabel" />
    </FlexLayout>
    <LineChart
      class="rd-crypto-ticker__chart"
      :title="liveQuote ? `${liveQuote.market.symbol} 7d` : '7d'"
      :points="liveQuote?.chart.points ?? []"
      x-axis-label="Day"
      y-axis-label="USD"
      :value-format="formatUsd"
    />
    <DataTable
      title="Daily closes"
      :rows="tableRows"
      :columns="SESSION_COLUMNS"
      :selected-row-id="selectedDay?.id"
      :on-row-select="liveQuote?.chart.days.length ? (id) => (selectedDayId = id) : undefined"
    />
    <DetailPanel class="rd-crypto-ticker__session" title="Session" empty-message="Select a session">
      <dl class="rd-detail-stats rd-detail-stats--compact">
        <div>
          <dt>Coin</dt>
          <dd>{{ liveQuote?.market.name ?? DASH }}</dd>
        </div>
        <div>
          <dt>Date</dt>
          <dd>{{ selectedDay?.name ?? DASH }}</dd>
        </div>
        <div>
          <dt>Close</dt>
          <dd>{{ selectedDay?.amount ?? DASH }}</dd>
        </div>
        <div>
          <dt>Volume</dt>
          <dd>{{ selectedDay?.date ?? DASH }}</dd>
        </div>
        <div>
          <dt>Move</dt>
          <dd>{{ selectedDay?.status ?? DASH }}</dd>
        </div>
      </dl>
    </DetailPanel>
  </FlexLayout>
</template>
