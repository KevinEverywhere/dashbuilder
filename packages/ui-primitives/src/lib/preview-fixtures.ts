import type {
  PreviewChartPoint,
  PreviewNewsRow,
  PreviewRow,
  PreviewSelectOption,
} from './preview-types';
import { BUILTIN_PREVIEW_CONTENT_SLICE } from './preview-content';

export type { PreviewRow, PreviewSelectOption, PreviewChartPoint, PreviewNewsRow };

export const PREVIEW_TABLE_ROWS: PreviewRow[] = BUILTIN_PREVIEW_CONTENT_SLICE.tableRows;
export const PREVIEW_NEWS_ROWS: PreviewNewsRow[] = BUILTIN_PREVIEW_CONTENT_SLICE.newsRows;
export const PREVIEW_SELECT_OPTIONS: PreviewSelectOption[] =
  BUILTIN_PREVIEW_CONTENT_SLICE.selectOptions;
export const PREVIEW_KPI_VALUE = BUILTIN_PREVIEW_CONTENT_SLICE.kpiValue;
export const PREVIEW_KPI_DELTA = BUILTIN_PREVIEW_CONTENT_SLICE.kpiDelta;
export const PREVIEW_CHART_POINTS: PreviewChartPoint[] = BUILTIN_PREVIEW_CONTENT_SLICE.chartPoints;
export const PREVIEW_DATE_RANGE_LABEL = BUILTIN_PREVIEW_CONTENT_SLICE.dateRangeLabel;
