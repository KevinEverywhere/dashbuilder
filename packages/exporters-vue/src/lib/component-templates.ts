import type { IRComponent } from '@rosettadash/core';
import { VueExportError } from './types';
import {
  generateEquirectViewport,
  generateLiveCapture,
  generateVideoSource,
  generateWasmMediaEquirect,
} from './media-component-templates';
import {
  generateThreeBarChart,
  generateThreeScatterPlot,
  generateThreeScenePointCloud,
  generateThreeGltfModel,
  generateThreeGeoGlobe,
} from './three-visual-templates';
import { joinLines } from './utils';

const SUPPORTED_TYPES = new Set([
  'visual.input.text',
  'visual.input.select',
  'visual.input.number',
  'visual.input.checkbox',
  'visual.input.textarea',
  'visual.input.date-range',
  'domain.time-preset',
  'visual.table',
  'visual.detail',
  'visual.skeleton',
  'visual.kpi',
  'visual.chart.line',
  'visual.chart.bar',
  'visual.chart.pie',
  'visual.display.3d-bar-chart',
  'visual.display.3d-scatter',
  'visual.display.3d-scene',
  'visual.display.3d-gltf-model',
  'visual.display.3d-geo-globe',
  'visual.svg.inline',
  'visual.svg.icon',
  'infra.wasm.asset',
  'visual.wasm.worker-host',
  'visual.wasm.module',
  'visual.wasm.media',
  'visual.media.video-source',
  'visual.media.equirect-viewport',
  'visual.media.live-capture',
  'domain.role-gate',
  'domain.person-invite',
  'domain.role-assign',
  'logic.timer',
  'visual.news.language-select',
  'visual.news.region-select',
  'visual.news.type-select',
  'visual.news.search-box',
  'visual.news.results-table',
  'visual.news.article-detail',
]);

export function generateComponentFile(component: IRComponent, exportName: string): string {
  if (!SUPPORTED_TYPES.has(component.type)) {
    throw new VueExportError(`Unsupported Vue export component type: ${component.type}`);
  }

  switch (component.type) {
    case 'visual.input.text':
      return generateTextInput(exportName);
    case 'visual.input.select':
      return generateSelectInput(exportName);
    case 'visual.input.number':
      return generateNumberInput(exportName);
    case 'visual.input.checkbox':
      return generateCheckboxInput(exportName);
    case 'visual.input.textarea':
      return generateTextareaInput(exportName);
    case 'visual.input.date-range':
      return generateDateRangeFilter(exportName);
    case 'domain.time-preset':
      return generateTimePreset(exportName);
    case 'visual.table':
      return generateDataTable(exportName);
    case 'visual.detail':
      return generateDetailPanel(exportName);
    case 'visual.skeleton':
      return generateSkeleton(exportName);
    case 'visual.kpi':
      return generateKpiCard(exportName);
    case 'visual.chart.line':
      return generateLineChart(exportName);
    case 'visual.chart.bar':
      return generateBarChart(exportName);
    case 'visual.chart.pie':
      return generatePieChart(exportName);
    case 'visual.display.3d-bar-chart':
      return generateThreeBarChart(exportName);
    case 'visual.display.3d-scatter':
      return generateThreeScatterPlot(exportName);
    case 'visual.display.3d-scene':
      return generateThreeScenePointCloud(exportName);
    case 'visual.display.3d-gltf-model':
      return generateThreeGltfModel(exportName);
    case 'visual.display.3d-geo-globe':
      return generateThreeGeoGlobe(exportName);
    case 'visual.svg.inline':
      return generateSvgInline(exportName);
    case 'visual.svg.icon':
      return generateSvgIcon(exportName);
    case 'infra.wasm.asset':
      return generateWasmAsset(exportName);
    case 'visual.wasm.worker-host':
      return generateWasmWorkerHost(exportName);
    case 'visual.wasm.module':
      return generateWasmModule(exportName);
    case 'visual.wasm.media':
      return component.properties?.['operation'] === 'equirect-extract'
        ? generateWasmMediaEquirect(exportName)
        : generateWasmMedia(exportName);
    case 'visual.media.video-source':
      return generateVideoSource(exportName);
    case 'visual.media.equirect-viewport':
      return generateEquirectViewport(exportName);
    case 'visual.media.live-capture':
      return generateLiveCapture(exportName);
    case 'domain.role-gate':
      return generateRoleGate(exportName);
    case 'domain.person-invite':
      return generatePersonInvite(exportName);
    case 'domain.role-assign':
      return generateRoleAssign(exportName);
    case 'logic.timer':
      return generateTimer(exportName);
    case 'visual.news.language-select':
    case 'visual.news.region-select':
    case 'visual.news.type-select':
      return generateSelectInput(exportName);
    case 'visual.news.search-box':
      return generateTextInput(exportName);
    case 'visual.news.results-table':
      return generateDataTable(exportName);
    case 'visual.news.article-detail':
      return generateDetailPanel(exportName);
    default:
      throw new VueExportError(`Missing Vue template for ${component.type}`);
  }
}

function generateTextInput(name: string): string {
  return joinLines([
    `<script setup lang="ts">`,
    `const model = defineModel<string>({ default: '' });`,
    `defineProps<{ id?: string; placeholder?: string; required?: boolean }>();`,
    `</script>`,
    ``,
    `<template>`,
    `  <label class="field" :for="id">`,
    `    <input`,
    `      class="input"`,
    `      type="text"`,
    `      :id="id"`,
    `      :placeholder="placeholder"`,
    `      :required="required"`,
    `      v-model="model"`,
    `    />`,
    `  </label>`,
    `</template>`,
    ``,
  ]);
}

function generateNumberInput(name: string): string {
  return joinLines([
    `<script setup lang="ts">`,
    `const model = defineModel<number>({ default: 0 });`,
    `withDefaults(`,
    `  defineProps<{ id?: string; placeholder?: string; required?: boolean; min?: number; max?: number; step?: number }>(),`,
    `  { placeholder: 'enter placeholder here', max: 100, step: 1 },`,
    `);`,
    `</script>`,
    ``,
    `<template>`,
    `  <label class="field" :for="id">`,
    `    <input class="input" type="number" :id="id" :placeholder="placeholder" :required="required" :min="min" :max="max" :step="step" v-model.number="model" />`,
    `  </label>`,
    `</template>`,
    ``,
  ]);
}

function generateCheckboxInput(name: string): string {
  return joinLines([
    `<script setup lang="ts">`,
    `const model = defineModel<boolean>({ default: false });`,
    `withDefaults(defineProps<{ id?: string; label?: string; defaultChecked?: boolean }>(), { label: '', defaultChecked: false });`,
    `</script>`,
    ``,
    `<template>`,
    `  <label class="field field--checkbox" :for="id">`,
    `    <input class="checkbox" type="checkbox" :id="id" v-model="model" />`,
    `    <span v-if="label">{{ label }}</span>`,
    `  </label>`,
    `</template>`,
    ``,
  ]);
}

function generateTextareaInput(name: string): string {
  return joinLines([
    `<script setup lang="ts">`,
    `const model = defineModel<string>({ default: '' });`,
    `withDefaults(`,
    `  defineProps<{ id?: string; placeholder?: string; required?: boolean; rows?: number }>(),`,
    `  { placeholder: 'enter placeholder here', required: false, rows: 4 },`,
    `);`,
    `</script>`,
    ``,
    `<template>`,
    `  <label class="field" :for="id">`,
    `    <textarea class="textarea" :id="id" :placeholder="placeholder" :required="required" :rows="rows" v-model="model" />`,
    `  </label>`,
    `</template>`,
    ``,
  ]);
}

function generateSelectInput(name: string): string {
  return joinLines([
    `<script setup lang="ts">`,
    `import type { Row } from '../types';`,
    `const model = defineModel<string>({ default: '' });`,
    `withDefaults(`,
    `  defineProps<{ id?: string; placeholder?: string; options?: Row[] }>(),`,
    `  { placeholder: 'Select…', options: () => [] },`,
    `);`,
    `</script>`,
    ``,
    `<template>`,
    `  <label class="field" :for="id">`,
    `    <select class="select" :id="id" v-model="model">`,
    `      <option value="">{{ placeholder }}</option>`,
    `      <option`,
    `        v-for="(option, index) in options"`,
    `        :key="String(option.id ?? index)"`,
    `        :value="String(option.id ?? option.label ?? index)"`,
    `      >`,
    `        {{ option.label ?? option.id ?? index }}`,
    `      </option>`,
    `    </select>`,
    `  </label>`,
    `</template>`,
    ``,
  ]);
}

function generateDateRangeFilter(name: string): string {
  return joinLines([
    `<script setup lang="ts">`,
    `import { computed } from 'vue';`,
    `import type { DateRange } from '../types';`,
    `const model = defineModel<DateRange>();`,
    `const props = withDefaults(defineProps<{ id?: string; preset?: string }>(), {`,
    `  preset: 'last-7-days',`,
    `});`,
    `const current = computed(() => model.value ?? defaultRangeForPreset(props.preset));`,
    `function onStartChange(start: string) {`,
    `  model.value = { ...current.value, start };`,
    `}`,
    `function onEndChange(end: string) {`,
    `  model.value = { ...current.value, end };`,
    `}`,
    `function defaultRangeForPreset(preset: string): DateRange {`,
    `  const end = new Date();`,
    `  const start = new Date(end);`,
    `  if (preset === 'last-30-days') start.setDate(end.getDate() - 30);`,
    `  else if (preset === 'qtd') start.setMonth(Math.floor(end.getMonth() / 3) * 3, 1);`,
    `  else start.setDate(end.getDate() - 7);`,
    `  return { start: formatDate(start), end: formatDate(end) };`,
    `}`,
    `function formatDate(date: Date): string {`,
    `  return date.toISOString().slice(0, 10);`,
    `}`,
    `</script>`,
    ``,
    `<template>`,
    `  <div class="date-range" :id="id">`,
    `    <label class="field">`,
    `      <span>Start</span>`,
    `      <input class="input" type="date" :value="current.start" @input="onStartChange(($event.target as HTMLInputElement).value)" />`,
    `    </label>`,
    `    <label class="field">`,
    `      <span>End</span>`,
    `      <input class="input" type="date" :value="current.end" @input="onEndChange(($event.target as HTMLInputElement).value)" />`,
    `    </label>`,
    `  </div>`,
    `</template>`,
    ``,
  ]);
}

function generateTimePreset(name: string): string {
  return joinLines([
    `<script setup lang="ts">`,
    `import { ref } from 'vue';`,
    `import type { DateRange } from '../types';`,
    `const model = defineModel<DateRange>();`,
    `const props = withDefaults(`,
    `  defineProps<{ id?: string; label?: string; defaultPreset?: string }>(),`,
    `  { label: 'Period', defaultPreset: 'last-7-days' },`,
    `);`,
    `const presets = [`,
    `  { id: 'last-7-days', label: 'Last 7 days' },`,
    `  { id: 'last-30-days', label: 'Last 30 days' },`,
    `  { id: 'qtd', label: 'Quarter to date' },`,
    `] as const;`,
    `const activePreset = ref<string | null>(null);`,
    `function isActive(preset: string) {`,
    `  return (activePreset.value ?? props.defaultPreset) === preset;`,
    `}`,
    `function selectPreset(preset: string) {`,
    `  activePreset.value = preset;`,
    `  model.value = defaultRangeForPreset(preset);`,
    `}`,
    `function defaultRangeForPreset(preset: string): DateRange {`,
    `  const end = new Date();`,
    `  const start = new Date(end);`,
    `  if (preset === 'last-30-days') start.setDate(end.getDate() - 30);`,
    `  else if (preset === 'qtd') start.setMonth(Math.floor(end.getMonth() / 3) * 3, 1);`,
    `  else start.setDate(end.getDate() - 7);`,
    `  return { start: formatDate(start), end: formatDate(end) };`,
    `}`,
    `function formatDate(date: Date): string {`,
    `  return date.toISOString().slice(0, 10);`,
    `}`,
    `</script>`,
    ``,
    `<template>`,
    `  <div class="time-preset" :id="id">`,
    `    <span class="time-preset__label">{{ label }}</span>`,
    `    <div class="time-preset__buttons">`,
    `      <button`,
    `        v-for="preset in presets"`,
    `        :key="preset.id"`,
    `        type="button"`,
    `        class="time-preset__button"`,
    `        :class="{ 'time-preset__button--active': isActive(preset.id) }"`,
    `        @click="selectPreset(preset.id)"`,
    `      >`,
    `        {{ preset.label }}`,
    `      </button>`,
    `    </div>`,
    `  </div>`,
    `</template>`,
    ``,
  ]);
}

function generateDataTable(name: string): string {
  return joinLines([
    `<script setup lang="ts">`,
    `import { computed } from 'vue';`,
    `import type { DateRange, Row } from '../types';`,
    `import { isNumericFieldKey } from '../presentation/numeric-fields';`,
    `const props = withDefaults(`,
    `  defineProps<{`,
    `    id?: string;`,
    `    data?: Row[];`,
    `    filter?: DateRange;`,
    `    pageSize?: number;`,
    `    sortable?: boolean;`,
    `    filterable?: boolean;`,
    `    selectedRow?: Row;`,
    `  }>(),`,
    `  { data: () => [], pageSize: 25, sortable: true, filterable: true },`,
    `);`,
    `const emit = defineEmits<{ selectRow: [row: Row] }>();`,
    `const rows = computed(() => filterRows(props.data ?? [], props.filter).slice(0, props.pageSize));`,
    `const columns = computed(() => {`,
    `  const first = rows.value[0];`,
    `  return first ? Object.keys(first) : ['id', 'label', 'value'];`,
    `});`,
    `function filterRows(data: Row[], filter?: DateRange): Row[] {`,
    `  if (!filter) return data;`,
    `  return data.filter((row) => {`,
    `    const value = String(row.date ?? row.createdAt ?? '');`,
    `    if (!value) return true;`,
    `    return value >= filter.start && value <= filter.end;`,
    `  });`,
    `}`,
    `</script>`,
    ``,
    `<template>`,
    `  <section class="table-card" :id="id" :data-sortable="sortable" :data-filterable="filterable">`,
    `    <table class="table">`,
    `      <thead>`,
    `        <tr>`,
    `          <th v-for="column in columns" :key="column" :class="{ 'table-cell--numeric': isNumericFieldKey(column) }">{{ column }}</th>`,
    `        </tr>`,
    `      </thead>`,
    `      <tbody>`,
    `        <tr`,
    `          v-for="(row, index) in rows"`,
    `          :key="String(row.id ?? index)"`,
    `          :class="selectedRow?.id === row.id ? 'table-row table-row--selected' : 'table-row'"`,
    `          @click="emit('selectRow', row)"`,
    `        >`,
    `          <td v-for="column in columns" :key="column" :class="{ 'table-cell--numeric': isNumericFieldKey(column) }">{{ row[column] ?? '' }}</td>`,
    `        </tr>`,
    `      </tbody>`,
    `    </table>`,
    `  </section>`,
    `</template>`,
    ``,
  ]);
}

function generateDetailPanel(name: string): string {
  return joinLines([
    `<script setup lang="ts">`,
    `import { computed } from 'vue';`,
    `import type { Row } from '../types';`,
    `import { isNumericFieldKey } from '../presentation/numeric-fields';`,
    `const props = withDefaults(`,
    `  defineProps<{`,
    `    id?: string;`,
    `    title?: string;`,
    `    emptyMessage?: string;`,
    `    row?: Row;`,
    `  }>(),`,
    `  { title: 'Details', emptyMessage: 'Select a row to view details' },`,
    `);`,
    `const fields = computed(() => {`,
    `  if (!props.row) return [] as Array<{ key: string; value: string }>;`,
    `  return Object.entries(props.row).map(([key, value]) => ({`,
    `    key,`,
    `    value: String(value ?? ''),`,
    `  }));`,
    `});`,
    `</script>`,
    ``,
    `<template>`,
    `  <section class="detail-panel" :id="id">`,
    `    <h3>{{ title }}</h3>`,
    `    <p v-if="fields.length === 0" class="detail-panel__empty">{{ emptyMessage }}</p>`,
    `    <dl v-else class="detail-panel__fields">`,
    `      <div v-for="field in fields" :key="field.key" class="detail-panel__field">`,
    `        <dt>{{ field.key }}</dt>`,
    `        <dd :class="{ 'detail-panel__value--numeric': isNumericFieldKey(field.key) }">{{ field.value }}</dd>`,
    `      </div>`,
    `    </dl>`,
    `  </section>`,
    `</template>`,
    ``,
  ]);
}

function generateSkeleton(name: string): string {
  return joinLines([
    `<script setup lang="ts">`,
    `import { computed } from 'vue';`,
    `const props = withDefaults(`,
    `  defineProps<{`,
    `    id?: string;`,
    `    loading?: boolean;`,
    `    variant?: 'table' | 'chart' | 'kpi' | 'card';`,
    `    lines?: number;`,
    `  }>(),`,
    `  { loading: true, variant: 'table', lines: 4 },`,
    `);`,
    `const lineIndexes = computed(() => {`,
    `  const count = Math.max(1, Math.min(props.lines ?? 4, 8));`,
    `  return Array.from({ length: count }, (_, index) => index);`,
    `});`,
    `</script>`,
    ``,
    `<template>`,
    `  <div v-if="loading" class="skeleton" :class="\`skeleton--\${variant}\`" :id="id" aria-busy="true">`,
    `    <template v-if="variant === 'chart'">`,
    `      <div class="skeleton__chart-block" />`,
    `      <div class="skeleton__legend">`,
    `        <span v-for="line in lineIndexes" :key="line" class="skeleton__line skeleton__line--short" />`,
    `      </div>`,
    `    </template>`,
    `    <template v-else-if="variant === 'kpi'">`,
    `      <span class="skeleton__line skeleton__line--title" />`,
    `      <span class="skeleton__line skeleton__line--value" />`,
    `    </template>`,
    `    <template v-else>`,
    `      <span v-for="line in lineIndexes" :key="line" class="skeleton__line" />`,
    `    </template>`,
    `  </div>`,
    `</template>`,
    ``,
  ]);
}

function generateKpiCard(name: string): string {
  return joinLines([
    `<script setup lang="ts">`,
    `withDefaults(`,
    `  defineProps<{`,
    `    id?: string;`,
    `    title?: string;`,
    `    format?: 'number' | 'currency' | 'percent';`,
    `    value?: number;`,
    `  }>(),`,
    `  { title: 'Metric', format: 'number', value: 0 },`,
    `);`,
    `function formatValue(value: number, format: 'number' | 'currency' | 'percent'): string {`,
    `  if (format === 'currency') {`,
    `    return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(value);`,
    `  }`,
    `  if (format === 'percent') {`,
    `    return new Intl.NumberFormat(undefined, { style: 'percent', maximumFractionDigits: 1 }).format(value / 100);`,
    `  }`,
    `  return new Intl.NumberFormat().format(value);`,
    `}`,
    `</script>`,
    ``,
    `<template>`,
    `  <article class="kpi-card" :id="id">`,
    `    <h3>{{ title }}</h3>`,
    `    <p class="kpi-value">{{ formatValue(value ?? 0, format ?? 'number') }}</p>`,
    `  </article>`,
    `</template>`,
    ``,
  ]);
}

function generateLineChart(name: string): string {
  return joinLines([
    `<script setup lang="ts">`,
    `import { computed } from 'vue';`,
    `import type { DateRange, Row } from '../types';`,
    `const props = withDefaults(`,
    `  defineProps<{`,
    `    id?: string;`,
    `    title?: string;`,
    `    xField?: string;`,
    `    yField?: string;`,
    `    data?: Row[];`,
    `    range?: DateRange;`,
    `  }>(),`,
    `  { title: 'Chart', xField: 'date', yField: 'value', data: () => [] },`,
    `);`,
    `const filtered = computed(() => filterByRange(props.data ?? [], props.range));`,
    `const points = computed(() => {`,
    `  const rows = filtered.value;`,
    `  const yField = props.yField ?? 'value';`,
    `  const max = Math.max(...rows.map((row) => Number(row[yField] ?? 0)), 1);`,
    `  return rows`,
    `    .map((row, index) => {`,
    `      const x = (index / Math.max(rows.length - 1, 1)) * 300 + 10;`,
    `      const y = 110 - (Number(row[yField] ?? 0) / max) * 90;`,
    `      return \`\${x},\${y}\`;`,
    `    })`,
    `    .join(' ');`,
    `});`,
    `function filterByRange(data: Row[], range?: DateRange): Row[] {`,
    `  if (!range) return data;`,
    `  return data.filter((row) => {`,
    `    const value = String(row.date ?? row.createdAt ?? '');`,
    `    if (!value) return true;`,
    `    return value >= range.start && value <= range.end;`,
    `  });`,
    `}`,
    `</script>`,
    ``,
    `<template>`,
    `  <section class="chart-card" :id="id">`,
    `    <h3>{{ title }}</h3>`,
    `    <svg class="line-chart" viewBox="0 0 320 120" role="img" :aria-label="title">`,
    `      <polyline fill="none" stroke="currentColor" stroke-width="2" :points="points" />`,
    `    </svg>`,
    `    <p class="chart-meta">{{ filtered.length }} points · x={{ xField }} · y={{ yField }}</p>`,
    `  </section>`,
    `</template>`,
    ``,
  ]);
}

function generateBarChart(name: string): string {
  return joinLines([
    `<script setup lang="ts">`,
    `import { computed } from 'vue';`,
    `import type { DateRange, Row } from '../types';`,
    `const props = withDefaults(`,
    `  defineProps<{ id?: string; title?: string; data?: Row[]; range?: DateRange }>(),`,
    `  { title: 'Chart', data: () => [] },`,
    `);`,
    `const filtered = computed(() => filterByRange(props.data ?? [], props.range));`,
    `function barHeight(row: Row): number {`,
    `  const max = Math.max(...filtered.value.map((entry) => Number(entry.value ?? 0)), 1);`,
    `  return (Number(row.value ?? 0) / max) * 100;`,
    `}`,
    `function filterByRange(data: Row[], range?: DateRange): Row[] {`,
    `  if (!range) return data;`,
    `  return data.filter((row) => {`,
    `    const value = String(row.date ?? row.createdAt ?? '');`,
    `    if (!value) return true;`,
    `    return value >= range.start && value <= range.end;`,
    `  });`,
    `}`,
    `</script>`,
    ``,
    `<template>`,
    `  <section class="chart-card" :id="id">`,
    `    <h3>{{ title }}</h3>`,
    `    <div class="bar-chart">`,
    `      <div`,
    `        v-for="(row, index) in filtered"`,
    `        :key="String(row.id ?? index)"`,
    `        class="bar"`,
    `        :style="{ height: barHeight(row) + '%' }"`,
    `        :title="String(row.label ?? row.id ?? index)"`,
    `      />`,
    `    </div>`,
    `  </section>`,
    `</template>`,
    ``,
  ]);
}

function generatePieChart(name: string): string {
  return joinLines([
    `<script setup lang="ts">`,
    `import { computed } from 'vue';`,
    `import type { DateRange, Row } from '../types';`,
    `const props = withDefaults(`,
    `  defineProps<{`,
    `    id?: string;`,
    `    title?: string;`,
    `    labelField?: string;`,
    `    valueField?: string;`,
    `    donut?: boolean;`,
    `    data?: Row[];`,
    `    range?: DateRange;`,
    `  }>(),`,
    `  { title: 'Chart', labelField: 'label', valueField: 'value', donut: false, data: () => [] },`,
    `);`,
    `const filtered = computed(() => filterByRange(props.data ?? [], props.range));`,
    `const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];`,
    `const gradient = computed(() => {`,
    `  const total = filtered.value.reduce((sum, row) => sum + Number(row[props.valueField] ?? 0), 0) || 1;`,
    `  let cumulative = 0;`,
    `  const stops = filtered.value.map((row, index) => {`,
    `    const value = Number(row[props.valueField] ?? 0);`,
    `    const percent = (value / total) * 100;`,
    `    const start = cumulative;`,
    `    cumulative += percent;`,
    `    return \`\${colors[index % colors.length]} \${start}% \${cumulative}%\`;`,
    `  });`,
    `  return \`conic-gradient(\${stops.join(', ') || '#d1d5db 0 100%'})\`;`,
    `});`,
    `function color(index: number): string {`,
    `  return colors[index % colors.length] ?? colors[0];`,
    `}`,
    `function filterByRange(data: Row[], range?: DateRange): Row[] {`,
    `  if (!range) return data;`,
    `  return data.filter((row) => {`,
    `    const value = String(row.date ?? row.createdAt ?? '');`,
    `    if (!value) return true;`,
    `    return value >= range.start && value <= range.end;`,
    `  });`,
    `}`,
    `</script>`,
    ``,
    `<template>`,
    `  <section class="chart-card" :id="id">`,
    `    <h3>{{ title }}</h3>`,
    `    <div`,
    `      :class="donut ? 'pie-chart pie-chart--donut' : 'pie-chart'"`,
    `      :style="{ background: gradient }"`,
    `    ></div>`,
    `    <ul class="pie-chart__legend">`,
    `      <li v-for="(row, index) in filtered" :key="String(row.id ?? index)">`,
    `        <span :style="{ background: color(index) }"></span>`,
    `        {{ String(row[labelField] ?? row.id ?? index) }}`,
    `      </li>`,
    `    </ul>`,
    `  </section>`,
    `</template>`,
    ``,
  ]);
}

function generateTimer(name: string): string {
  return joinLines([
    `<script setup lang="ts">`,
    `import { onUnmounted, ref, watch } from 'vue';`,
    `const props = withDefaults(`,
    `  defineProps<{`,
    `    id?: string;`,
    `    label?: string;`,
    `    mode?: 'interval' | 'countdown';`,
    `    intervalMs?: number;`,
    `    durationMs?: number;`,
    `    autoStart?: boolean;`,
    `    modelValue?: number;`,
    `  }>(),`,
    `  { label: 'Timer', mode: 'interval', intervalMs: 5000, durationMs: 30000, autoStart: true, modelValue: 0 },`,
    `);`,
    `const emit = defineEmits<{ 'update:modelValue': [value: number] }>();`,
    `const elapsed = ref(props.modelValue ?? 0);`,
    `const remaining = ref(Math.max(1, Math.ceil((props.durationMs ?? 30000) / 1000)));`,
    `watch(`,
    `  () => props.modelValue,`,
    `  (value) => {`,
    `    elapsed.value = value ?? 0;`,
    `  },`,
    `);`,
    `let handle: ReturnType<typeof setInterval> | undefined;`,
    `if (props.autoStart) {`,
    `  const stepMs = props.mode === 'countdown' ? 1000 : props.intervalMs;`,
    `  handle = setInterval(() => {`,
    `    elapsed.value += 1;`,
    `    emit('update:modelValue', elapsed.value);`,
    `    if (props.mode === 'countdown') {`,
    `      remaining.value = Math.max(0, remaining.value - 1);`,
    `    }`,
    `  }, stepMs);`,
    `}`,
    `onUnmounted(() => {`,
    `  if (handle) clearInterval(handle);`,
    `});`,
    `</script>`,
    ``,
    `<template>`,
    `  <section class="timer" :id="id">`,
    `    <div class="timer__header">`,
    `      <span class="timer__label">{{ label }}</span>`,
    `      <span class="timer__mode">{{ mode }}</span>`,
    `    </div>`,
    `    <p class="timer__value">`,
    `      {{ mode === 'countdown' ? \`\${remaining}s remaining\` : \`\${elapsed} ticks\` }}`,
    `    </p>`,
    `  </section>`,
    `</template>`,
    ``,
  ]);
}

function generateSvgInline(_name: string): string {
  return joinLines([
    `<script setup lang="ts">`,
    `import { computed } from 'vue';`,
    `import type { Row } from '../types';`,
    `const props = withDefaults(`,
    `  defineProps<{`,
    `    id?: string;`,
    `    sourceMode?: 'inline' | 'url' | 'path';`,
    `    markup?: string;`,
    `    url?: string;`,
    `    assetPath?: string;`,
    `    width?: number;`,
    `    height?: number;`,
    `    ariaLabel?: string;`,
    `    fillField?: string;`,
    `    row?: Row;`,
    `  }>(),`,
    `  { sourceMode: 'inline', markup: '', width: 120, height: 120, ariaLabel: 'SVG graphic' },`,
    `);`,
    `const fillColor = computed(() => {`,
    `  if (!props.fillField || !props.row || props.row[props.fillField] === undefined) {`,
    `    return undefined;`,
    `  }`,
    `  return String(props.row[props.fillField]);`,
    `});`,
    `</script>`,
    ``,
    `<template>`,
    `  <figure`,
    `    v-if="sourceMode === 'url' && url"`,
    `    class="svg-inline"`,
    `    :style="{ width: \`\${width}px\`, height: \`\${height}px\` }"`,
    `    :aria-label="ariaLabel"`,
    `  >`,
    `    <img :src="url" :alt="ariaLabel" />`,
    `  </figure>`,
    `  <figure`,
    `    v-else-if="sourceMode === 'path' && assetPath"`,
    `    class="svg-inline svg-inline--asset"`,
    `    :style="{ width: \`\${width}px\`, height: \`\${height}px\` }"`,
    `    :aria-label="ariaLabel"`,
    `  >`,
    `    <p class="svg-inline__placeholder">Asset: {{ assetPath }}</p>`,
    `  </figure>`,
    `  <figure`,
    `    v-else`,
    `    class="svg-inline"`,
    `    :style="{ width: \`\${width}px\`, height: \`\${height}px\`, color: fillColor }"`,
    `    :aria-label="ariaLabel"`,
    `    v-html="markup"`,
    `  />`,
    `</template>`,
    ``,
  ]);
}

function generateSvgIcon(_name: string): string {
  return joinLines([
    `<script setup lang="ts">`,
    `import { computed } from 'vue';`,
    `import type { Row } from '../types';`,
    `const props = withDefaults(`,
    `  defineProps<{`,
    `    id?: string;`,
    `    markup?: string;`,
    `    size?: number;`,
    `    color?: string;`,
    `    title?: string;`,
    `    ariaLabel?: string;`,
    `    colorField?: string;`,
    `    row?: Row;`,
    `  }>(),`,
    `  { markup: '', size: 24, color: 'currentColor', title: 'Icon' },`,
    `);`,
    `const resolvedColor = computed(() => {`,
    `  if (props.colorField && props.row && props.row[props.colorField] !== undefined) {`,
    `    return String(props.row[props.colorField]);`,
    `  }`,
    `  return props.color;`,
    `});`,
    `</script>`,
    ``,
    `<template>`,
    `  <span`,
    `    class="svg-icon"`,
    `    :style="{ width: \`\${size}px\`, height: \`\${size}px\`, color: resolvedColor, display: 'inline-flex' }"`,
    `    :title="title"`,
    `    :aria-label="ariaLabel || title"`,
    `    v-html="markup"`,
    `  />`,
    `</template>`,
    ``,
  ]);
}

function generateWasmAsset(_name: string): string {
  return joinLines([
    `<script setup lang="ts">`,
    `withDefaults(`,
    `  defineProps<{ id?: string; modulePath?: string; gluePath?: string }>(),`,
    `  { modulePath: 'wasm/modules/example.wasm', gluePath: 'wasm/glue/example.js' },`,
    `);`,
    `</script>`,
    ``,
    `<template>`,
    `  <section class="wasm-asset" :id="id">`,
    `    <span class="wasm-asset__badge">WASM</span>`,
    `    <code>{{ modulePath }}</code>`,
    `    <span v-if="gluePath" class="wasm-asset__glue">+ {{ gluePath }}</span>`,
    `  </section>`,
    `</template>`,
    ``,
  ]);
}

function generateWasmWorkerHost(_name: string): string {
  return joinLines([
    `<script setup lang="ts">`,
    `withDefaults(`,
    `  defineProps<{ id?: string; moduleName?: string; showStatus?: boolean }>(),`,
    `  { moduleName: 'dash-wasm-worker', showStatus: true },`,
    `);`,
    `</script>`,
    ``,
    `<template>`,
    `  <section class="wasm-worker" :id="id">`,
    `    <header class="wasm-worker__header">`,
    `      <span>{{ moduleName }}</span>`,
    `      <span class="wasm-worker__status">Worker host</span>`,
    `    </header>`,
    `    <p v-if="showStatus" class="wasm-worker__hint">Bind a WASM asset ref to initialize.</p>`,
    `  </section>`,
    `</template>`,
    ``,
  ]);
}

function generateWasmModule(_name: string): string {
  return joinLines([
    `<script setup lang="ts">`,
    `withDefaults(`,
    `  defineProps<{ id?: string; entryExport?: string; label?: string }>(),`,
    `  { entryExport: 'run', label: 'WASM Module' },`,
    `);`,
    `</script>`,
    ``,
    `<template>`,
    `  <section class="wasm-module" :id="id">`,
    `    <h3>{{ label }}</h3>`,
    `    <p class="wasm-module__export"><code>{{ entryExport }}()</code></p>`,
    `  </section>`,
    `</template>`,
    ``,
  ]);
}

function generateRoleGate(name: string): string {
  return joinLines([
    `<script setup lang="ts">`,
    `import { computed } from 'vue';`,
    `import { useCurrentRole } from '../auth/useCurrentRole';`,
    ``,
    `const props = withDefaults(`,
    `  defineProps<{`,
    `    id?: string;`,
    `    label?: string;`,
    `    allowedRoles?: string[];`,
    `    statusText?: string;`,
    `    hiddenStatusText?: string;`,
    `  }>(),`,
    `  {`,
    `    label: 'Protected section',`,
    `    allowedRoles: () => [],`,
    `    statusText: 'Visible',`,
    `    hiddenStatusText: 'Hidden for current role',`,
    `  },`,
    `);`,
    ``,
    `const role = useCurrentRole();`,
    `const visible = computed(() => {`,
    `  const hasRoleContext = role.value !== undefined && role.value !== '';`,
    `  return !hasRoleContext || props.allowedRoles.length === 0 || props.allowedRoles.includes(role.value);`,
    `});`,
    `</script>`,
    ``,
    `<template>`,
    `  <section`,
    `    class="rd-role-gate"`,
    `    :class="visible ? 'rd-role-gate--visible' : 'rd-role-gate--hidden'"`,
    `    :id="id"`,
    `    data-testid="rd-role-gate"`,
    `  >`,
    `    <span v-if="label" class="rd-field__label">{{ label }}</span>`,
    `    <template v-if="visible">`,
    `      <p class="rd-role-gate__status" data-testid="rd-role-gate-visible">{{ statusText }}</p>`,
    `      <slot><p>Protected content</p></slot>`,
    `    </template>`,
    `    <p v-else class="rd-role-gate__status rd-role-gate__status--hidden" data-testid="rd-role-gate-hidden">`,
    `      {{ hiddenStatusText }}`,
    `    </p>`,
    `  </section>`,
    `</template>`,
    ``,
  ]);
}

function generatePersonInvite(name: string): string {
  return joinLines([
    `<script setup lang="ts">`,
    `import { ref } from 'vue';`,
    ``,
    `withDefaults(`,
    `  defineProps<{`,
    `    id?: string;`,
    `    title?: string;`,
    `    emailPlaceholder?: string;`,
    `    submitLabel?: string;`,
    `  }>(),`,
    `  { title: 'Invite team member', emailPlaceholder: 'name@company.com', submitLabel: 'Send invite' },`,
    `);`,
    ``,
    `const emit = defineEmits<{ submit: [email: string] }>();`,
    `const email = ref('');`,
    `</script>`,
    ``,
    `<template>`,
    `  <section class="onboarding-step" :id="id">`,
    `    <h3>{{ title }}</h3>`,
    `    <label class="field">`,
    `      <input class="input" type="email" :placeholder="emailPlaceholder" v-model="email" />`,
    `    </label>`,
    `    <button type="button" class="button" @click="emit('submit', email)">{{ submitLabel }}</button>`,
    `  </section>`,
    `</template>`,
    ``,
  ]);
}

function generateRoleAssign(name: string): string {
  return joinLines([
    `<script setup lang="ts">`,
    `import { ref, watch } from 'vue';`,
    ``,
    `const props = withDefaults(`,
    `  defineProps<{`,
    `    id?: string;`,
    `    title?: string;`,
    `    confirmLabel?: string;`,
    `    summaryLabel?: string;`,
    `    roles?: Array<{ id: string; name: string }>;`,
    `  }>(),`,
    `  {`,
    `    title: 'Assign role',`,
    `    confirmLabel: 'Confirm access',`,
    `    summaryLabel: 'Review access before confirming',`,
    `    roles: () => [],`,
    `  },`,
    `);`,
    ``,
    `const emit = defineEmits<{ confirm: [roleId: string] }>();`,
    `const selectedRoleId = ref(props.roles[0]?.id ?? '');`,
    ``,
    `watch(`,
    `  () => props.roles,`,
    `  (roles) => {`,
    `    selectedRoleId.value = roles[0]?.id ?? '';`,
    `  },`,
    `);`,
    `</script>`,
    ``,
    `<template>`,
    `  <section class="onboarding-step" :id="id">`,
    `    <h3>{{ title }}</h3>`,
    `    <p class="onboarding-step__summary">{{ summaryLabel }}</p>`,
    `    <label class="field">`,
    `      <select class="input" v-model="selectedRoleId">`,
    `        <option v-for="role in roles" :key="role.id" :value="role.id">{{ role.name }}</option>`,
    `      </select>`,
    `    </label>`,
    `    <button type="button" class="button" @click="emit('confirm', selectedRoleId)">{{ confirmLabel }}</button>`,
    `  </section>`,
    `</template>`,
    ``,
  ]);
}

function generateWasmMedia(_name: string): string {
  return joinLines([
    `<script setup lang="ts">`,
    `withDefaults(`,
    `  defineProps<{`,
    `    id?: string;`,
    `    operation?: string;`,
    `    outputFormat?: string;`,
    `    showProgress?: boolean;`,
    `    label?: string;`,
    `    progress?: number;`,
    `  }>(),`,
    `  { operation: 'transcode', outputFormat: 'mp4', showProgress: true, label: 'Media transcode', progress: 0 },`,
    `);`,
    `</script>`,
    ``,
    `<template>`,
    `  <section class="wasm-media" :id="id">`,
    `    <header class="wasm-media__header">`,
    `      <h3>{{ label }}</h3>`,
    `      <span>{{ operation }} → {{ outputFormat }}</span>`,
    `    </header>`,
    `    <div v-if="showProgress" class="wasm-media__progress" role="progressbar" :aria-valuenow="progress">`,
    `      <span :style="{ width: \`\${progress}%\` }"></span>`,
    `    </div>`,
    `  </section>`,
    `</template>`,
    ``,
  ]);
}
