/** Mock rowsets and options for palette catalog demos (Storybook). */

import {
  PREVIEW_CHART_POINTS,
  PREVIEW_NEWS_ROWS,
  PREVIEW_SELECT_OPTIONS,
  PREVIEW_TABLE_ROWS,
  type PreviewNewsRow,
  type PreviewRow,
} from '@rosettadash/ui-primitives';

export const selectOptions = PREVIEW_SELECT_OPTIONS.filter(
  (option) => option.value !== 'project-kpi',
);

export const roleOptions = [
  { label: 'Viewer', value: 'viewer' },
  { label: 'Editor', value: 'editor' },
  { label: 'Admin', value: 'admin' },
];

export const timePresetOptions = [
  { id: 'last-7-days', label: 'Last 7 days' },
  { id: 'last-30-days', label: 'Last 30 days' },
  { id: 'qtd', label: 'Quarter to date' },
  { id: 'ytd', label: 'Year to date' },
];

export type DemoTableRow = PreviewRow;
export type DemoNewsRow = PreviewNewsRow;

export const tableRows: DemoTableRow[] = PREVIEW_TABLE_ROWS;
export const newsRows: DemoNewsRow[] = PREVIEW_NEWS_ROWS;

export const chartPoints = PREVIEW_CHART_POINTS;

export const pieSlices = [
  { label: 'Direct', value: 42, color: '#38bdf8' },
  { label: 'Organic', value: 28, color: '#818cf8' },
  { label: 'Referral', value: 18, color: '#34d399' },
  { label: 'Paid', value: 12, color: '#fbbf24' },
];

export const lineChartPoints = '0,80 40,62 80,48 120,56 160,34 200,42 240,24';

export const DEFAULT_INLINE_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 12l2 2 4-4"/></svg>';

export const DEFAULT_ICON_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.77 5.82 22 7 14.14l-5-4.87 6.91-1.01z"/></svg>';
