<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { FlexLayout } from '@rosettadash/vue/layout/flex';
import { LineChart } from '@rosettadash/vue/visual/chart/line';
import { DetailPanel } from '@rosettadash/vue/visual/detail';
import { SelectInput } from '@rosettadash/vue/visual/input/select';
import { KpiCard } from '@rosettadash/vue/visual/kpi';
import { StatusBadge } from '@rosettadash/vue/visual/plugin/status-badge';
import { LoadingSkeleton } from '@rosettadash/vue/visual/skeleton';
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

const props = withDefaults(
  defineProps<{
    defaultCoinId?: CoinId;
  }>(),
  { defaultCoinId: 'bitcoin' },
);

const coinId = ref<string>(props.defaultCoinId);
const quote = ref<CoinQuote | null>(null);
const selectedDayId = ref('');
const status = ref<'loading' | 'ready' | 'error'>('loading');
const errorMessage = ref('');

const selectOptions = [...COINS];

const selectedDay = computed<CoinDay | undefined>(() => {
  const days = quote.value?.chart.days ?? [];
  return days.find((day) => day.id === selectedDayId.value) ?? days[0];
});

const priceLabel = computed(() =>
  status.value === 'ready' && quote.value ? formatUsd(quote.value.market.price) : '—',
);

const deltaLabel = computed(() => {
  if (status.value !== 'ready' || !quote.value) {
    return undefined;
  }
  const change = quote.value.market.change24h;
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(2)}% 24h`;
});

const badgeText = computed(() => {
  if (status.value === 'loading') {
    return 'Updating';
  }
  if (status.value === 'error') {
    return 'Unavailable';
  }
  const change = quote.value?.market.change24h ?? 0;
  if (Math.abs(change) < 0.15) {
    return 'Flat 24h';
  }
  return change >= 0 ? `Up ${change.toFixed(2)}%` : `Down ${Math.abs(change).toFixed(2)}%`;
});

const badgeTone = computed(() => {
  if (status.value === 'loading') {
    return 'neutral' as const;
  }
  if (status.value === 'error') {
    return 'error' as const;
  }
  const change = quote.value?.market.change24h ?? 0;
  if (Math.abs(change) < 0.15) {
    return 'warning' as const;
  }
  return change >= 0 ? ('success' as const) : ('error' as const);
});

const emptyMessage = computed(() =>
  status.value === 'error' ? errorMessage.value || 'Markets unavailable' : 'Select a session',
);

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
    status.value = 'loading';
    errorMessage.value = '';
    fetchCoinQuote(id, controller.signal)
      .then((next) => {
        quote.value = next;
        selectedDayId.value = next.chart.days[0]?.id ?? '';
        status.value = 'ready';
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }
        quote.value = null;
        selectedDayId.value = '';
        status.value = 'error';
        errorMessage.value = error instanceof Error ? error.message : 'Markets request failed';
      });
  },
  { immediate: true },
);
</script>

<template>
  <FlexLayout title="Crypto ticker" direction="column" :gap="10" class="rd-crypto-ticker">
    <SelectInput label="Coin" :options="selectOptions" :value="coinId" @change="onCoin" />
    <FlexLayout direction="row" :gap="8">
      <KpiCard :title="`${coinId} price`" :value="priceLabel" :delta="deltaLabel" />
      <StatusBadge :status-text="badgeText" :tone="badgeTone" />
    </FlexLayout>
    <template v-if="status === 'loading'">
      <LoadingSkeleton :lines="4" />
    </template>
    <template v-else>
      <LineChart
        v-if="quote"
        :title="`${quote.market.symbol} 7d`"
        :points="quote.chart.points"
        x-axis-label="Day"
        y-axis-label="USD"
        :value-format="formatUsd"
      />
      <DataTable
        title="Daily closes"
        :rows="quote?.chart.days ?? []"
        :selected-row-id="selectedDay?.id"
        :on-row-select="(id) => (selectedDayId = id)"
      />
    </template>
    <DetailPanel title="Session" :empty-message="emptyMessage">
      <dl v-if="status === 'ready' && quote && selectedDay" class="rd-detail-stats">
        <div>
          <dt>Coin</dt>
          <dd>{{ quote.market.name }}</dd>
        </div>
        <div>
          <dt>Date</dt>
          <dd>{{ selectedDay.name }}</dd>
        </div>
        <div>
          <dt>Close</dt>
          <dd>{{ selectedDay.amount }}</dd>
        </div>
        <div>
          <dt>Volume</dt>
          <dd>{{ selectedDay.date }}</dd>
        </div>
        <div>
          <dt>Move</dt>
          <dd>{{ selectedDay.status }}</dd>
        </div>
      </dl>
    </DetailPanel>
  </FlexLayout>
</template>
