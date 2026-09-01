import type { ComponentNode } from '../model/types';
import type { PropertySchema } from '../model/types';
import { DEFAULT_EQUIRECT_SOURCE } from '../media/equirect-filter';

/** On-page display presets for video source (16:9). Not equirect source resolution. */
export const VIDEO_DISPLAY_SIZE_OPTIONS = [
  { label: 'Small (320×180)', value: '320x180', width: 320, height: 180 },
  { label: 'Medium (640×360)', value: '640x360', width: 640, height: 360 },
  { label: 'Large (960×540)', value: '960x540', width: 960, height: 540 },
  { label: 'Extra large (1280×720)', value: '1280x720', width: 1280, height: 720 },
  { label: 'Custom', value: 'custom', width: 0, height: 0 },
] as const;

export type VideoDisplaySizeValue = (typeof VIDEO_DISPLAY_SIZE_OPTIONS)[number]['value'];

export const CUSTOM_VIDEO_DISPLAY_SIZE = 'custom' as const;

export const DEFAULT_VIDEO_DISPLAY_SIZE: VideoDisplaySizeValue = '640x360';

/** Inspector fields for on-page display size (shared by media viewport components). */
export const MEDIA_DISPLAY_SIZE_PROPERTIES: PropertySchema[] = [
  {
    key: 'displaySize',
    label: 'Display size',
    type: 'select',
    default: DEFAULT_VIDEO_DISPLAY_SIZE,
    options: VIDEO_DISPLAY_SIZE_OPTIONS.map((option) => ({
      label: option.label,
      value: option.value,
    })),
  },
  { key: 'fullscreen', label: 'Fullscreen', type: 'boolean', default: false },
];

export const MEDIA_VIEWPORT_TYPES = new Set([
  'visual.media.video-source',
  'visual.media.equirect-viewport',
  'visual.media.flat-video-viewport',
  'visual.media.equirect-sphere-viewport',
]);

export interface PresentationDimensions {
  width: number;
  height: number;
  /** Preview-only: fills the preview surface; does not resize the design canvas. */
  fullscreen?: boolean;
}

const FORM_INPUT_TYPES = new Set([
  'visual.input.text',
  'visual.input.select',
  'visual.input.number',
  'visual.input.textarea',
  'visual.input.date-range',
]);

const LABEL_LINE_HEIGHT = 18;
const FIELD_GAP = 4;
const INPUT_HEIGHT = 36;
const FORM_FIELD_PADDING = 0;
const CHECKBOX_HEIGHT = 28;
const TEXTAREA_ROW_HEIGHT = 22;
/** Extra preview height beyond single-line before text becomes multiline. */
const TEXT_MULTILINE_THRESHOLD_PX = 24;

const DEFAULT_FORM_FIELD_WIDTH = 336;
const DEFAULT_FORM_FIELD_HEIGHT =
  LABEL_LINE_HEIGHT + FIELD_GAP + INPUT_HEIGHT + FORM_FIELD_PADDING * 2;

export const FORM_SINGLE_LINE_INPUT_HEIGHT = INPUT_HEIGHT + FORM_FIELD_PADDING * 2;

/** Parse newline- or comma-separated select options (`Label` or `Label|value`). */
export function parseStaticSelectOptions(raw: unknown): { label: string; value: string }[] {
  if (typeof raw !== 'string' || raw.trim().length === 0) {
    return [];
  }
  return raw
    .split(/\r?\n|,/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      const pipe = line.indexOf('|');
      if (pipe > 0) {
        const label = line.slice(0, pipe).trim();
        const value = line.slice(pipe + 1).trim();
        return { label: label || value, value: value || label };
      }
      return { label: line, value: line };
    });
}

export function mapRowsetToSelectOptions(
  rows: ReadonlyArray<Record<string, unknown>>,
  labelField = 'name',
  valueField = 'id',
): { label: string; value: string }[] {
  const fields = resolveSelectFieldKeys(rows, labelField, valueField);
  return rows.map((row, index) => {
    const label = String(row[fields.labelField] ?? index + 1);
    const value = String(row[fields.valueField] ?? label);
    return { label, value };
  });
}

const SELECT_LABEL_FIELD_CANDIDATES = ['name', 'label', 'title', 'text', 'displayName'] as const;
const SELECT_VALUE_FIELD_CANDIDATES = ['id', 'value', 'key', 'code'] as const;

/**
 * Prefer configured fields when present on the rowset; otherwise pick typical
 * label/value columns, then the first available string-ish columns.
 */
export function resolveSelectFieldKeys(
  rows: ReadonlyArray<Record<string, unknown>>,
  labelField?: string,
  valueField?: string,
): { labelField: string; valueField: string } {
  const sample = rows[0] ?? {};
  const keys = Object.keys(sample);

  const resolvedLabel =
    pickPresentField(sample, labelField) ??
    SELECT_LABEL_FIELD_CANDIDATES.find((key) => key in sample) ??
    firstStringishKey(sample, keys) ??
    keys[0] ??
    'label';

  const resolvedValue =
    pickPresentField(sample, valueField) ??
    SELECT_VALUE_FIELD_CANDIDATES.find((key) => key in sample && key !== resolvedLabel) ??
    firstStringishKey(
      sample,
      keys.filter((key) => key !== resolvedLabel),
    ) ??
    resolvedLabel;

  return { labelField: resolvedLabel, valueField: resolvedValue };
}

function pickPresentField(
  sample: Record<string, unknown>,
  field: string | undefined,
): string | undefined {
  const trimmed = field?.trim();
  if (!trimmed || !(trimmed in sample)) {
    return undefined;
  }
  return trimmed;
}

function firstStringishKey(
  sample: Record<string, unknown>,
  keys: readonly string[],
): string | undefined {
  return keys.find((key) => {
    const value = sample[key];
    return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';
  });
}

/** Bound rowset wins, then static Options text, then fallback list. */
export function resolveSelectOptionList(input: {
  boundRows?: ReadonlyArray<Record<string, unknown>> | null;
  staticOptions?: unknown;
  labelField?: string;
  valueField?: string;
  fallback?: { label: string; value: string }[];
}): { label: string; value: string }[] {
  if (input.boundRows && input.boundRows.length > 0) {
    return mapRowsetToSelectOptions(input.boundRows, input.labelField, input.valueField);
  }
  const fromStatic = parseStaticSelectOptions(input.staticOptions);
  if (fromStatic.length > 0) {
    return fromStatic;
  }
  if (input.fallback && input.fallback.length > 0) {
    return [...input.fallback];
  }
  return [
    { label: 'Option A', value: 'Option A' },
    { label: 'Option B', value: 'Option B' },
    { label: 'Option C', value: 'Option C' },
  ];
}

/**
 * Whether a text input should render as multiline based on allocated preview height
 * (presentation height or inverted canvas shell height).
 */
export function textInputUsesMultiline(
  node: Pick<ComponentNode, 'type' | 'properties'> &
    Partial<Pick<ComponentNode, 'layout' | 'ports'>>,
): boolean {
  if (node.type !== 'visual.input.text') {
    return false;
  }
  const previewHeight = resolveTextPreviewHeight(node);
  return previewHeight > FORM_SINGLE_LINE_INPUT_HEIGHT + TEXT_MULTILINE_THRESHOLD_PX;
}

function canvasShellChromeForTextInput(ports?: ComponentNode['ports']): number {
  const inputCount = ports?.inputs?.length ?? 0;
  const outputCount = ports?.outputs?.length ?? 0;
  if (inputCount === 0 && outputCount === 0) {
    return 36;
  }
  const rows = Math.max(inputCount, outputCount, 1);
  return 36 + 12 + 1 + rows * 28;
}

function resolveTextPreviewHeight(
  node: Pick<ComponentNode, 'properties'> & Partial<Pick<ComponentNode, 'layout' | 'ports'>>,
): number {
  const layoutHeight = node.layout?.height;
  if (typeof layoutHeight === 'number' && layoutHeight > 0) {
    const chrome = canvasShellChromeForTextInput(node.ports);
    return Math.max(FORM_SINGLE_LINE_INPUT_HEIGHT, layoutHeight - chrome);
  }
  const showsLabel = formFieldShowsLabel(node.properties);
  return showsLabel ? DEFAULT_FORM_FIELD_HEIGHT : FORM_SINGLE_LINE_INPUT_HEIGHT;
}

/** Properties that change rendered size and should sync canvas layout. */
const LAYOUT_SYNC_PROPERTY_KEYS: Record<string, readonly string[]> = {
  'visual.media.video-source': ['displaySize'],
  'visual.media.equirect-viewport': ['displaySize'],
  'visual.media.flat-video-viewport': ['displaySize'],
  'visual.media.equirect-sphere-viewport': ['displaySize'],
  'visual.input.text': ['label'],
  'visual.input.select': ['label'],
  'visual.input.number': ['label'],
  'visual.input.textarea': ['label', 'rows'],
  'visual.input.checkbox': ['label'],
};

export function parseVideoDisplaySize(value: unknown): PresentationDimensions | null {
  if (typeof value !== 'string' || value === CUSTOM_VIDEO_DISPLAY_SIZE) {
    return null;
  }
  const match = VIDEO_DISPLAY_SIZE_OPTIONS.find((option) => option.value === value);
  if (!match || match.value === CUSTOM_VIDEO_DISPLAY_SIZE) {
    return null;
  }
  return { width: match.width, height: match.height };
}

export function readCustomDisplayDimensions(
  properties: Record<string, unknown>,
  fallback: PresentationDimensions = { width: 640, height: 360 },
): PresentationDimensions {
  const width =
    typeof properties['customWidth'] === 'number' ? properties['customWidth'] : fallback.width;
  const height =
    typeof properties['customHeight'] === 'number' ? properties['customHeight'] : fallback.height;
  return { width, height };
}

export function layoutMatchesDisplayPreset(
  layout: { width: number; height: number },
  displaySize: unknown,
): boolean {
  const preset = parseVideoDisplaySize(displaySize);
  return preset !== null && preset.width === layout.width && preset.height === layout.height;
}

export function syncMediaDisplayPropertiesFromLayout(
  type: string,
  layout: { width: number; height: number },
  properties: Record<string, unknown>,
  previousLayout?: { width: number; height: number },
  ports?: ComponentNode['ports'],
): Record<string, unknown> {
  let next = properties;
  if (MEDIA_VIEWPORT_TYPES.has(type)) {
    next = syncMediaViewportPropertiesFromLayout(type, layout, next, previousLayout);
  }
  if (type === 'visual.input.text') {
    next = syncTextRowsFromLayout(layout, next, ports);
  }
  return next;
}

function syncMediaViewportPropertiesFromLayout(
  type: string,
  layout: { width: number; height: number },
  properties: Record<string, unknown>,
  previousLayout?: { width: number; height: number },
): Record<string, unknown> {
  if (!MEDIA_VIEWPORT_TYPES.has(type)) {
    return properties;
  }

  const sizeChanged =
    previousLayout !== undefined &&
    (previousLayout.width !== layout.width || previousLayout.height !== layout.height);

  if (!sizeChanged && layoutMatchesDisplayPreset(layout, properties['displaySize'])) {
    return properties;
  }

  if (!sizeChanged && properties['displaySize'] !== CUSTOM_VIDEO_DISPLAY_SIZE) {
    return properties;
  }

  if (layoutMatchesDisplayPreset(layout, properties['displaySize'])) {
    return {
      ...properties,
      customWidth: layout.width,
      customHeight: layout.height,
    };
  }

  return {
    ...properties,
    displaySize: CUSTOM_VIDEO_DISPLAY_SIZE,
    customWidth: layout.width,
    customHeight: layout.height,
  };
}

/** Keep read-only `rows` in sync with stretched text-input height. */
export function syncTextRowsFromLayout(
  layout: { width: number; height: number },
  properties: Record<string, unknown>,
  ports?: ComponentNode['ports'],
): Record<string, unknown> {
  const nodeLike = {
    type: 'visual.input.text' as const,
    properties,
    layout: { x: 0, y: 0, width: layout.width, height: layout.height },
    ports,
  };
  if (!textInputUsesMultiline(nodeLike)) {
    if (!('rows' in properties)) {
      return properties;
    }
    const { rows: _rows, ...rest } = properties;
    return rest;
  }

  const previewHeight = resolveTextPreviewHeight(nodeLike);
  const contentHeight = Math.max(
    TEXTAREA_ROW_HEIGHT * 2,
    previewHeight - FORM_FIELD_PADDING * 2,
  );
  const rows = Math.max(2, Math.round(contentHeight / TEXTAREA_ROW_HEIGHT));
  if (properties['rows'] === rows) {
    return properties;
  }
  return { ...properties, rows };
}

export function readFormFieldLabel(properties: Record<string, unknown>, key = 'label'): string {
  const propertyLabel = properties[key];
  if (typeof propertyLabel !== 'string') {
    return '';
  }
  return propertyLabel.trim();
}

export function formFieldShowsLabel(
  properties: Record<string, unknown>,
  key = 'label',
): boolean {
  return readFormFieldLabel(properties, key).length > 0;
}

function resolveMediaDisplayDimensions(
  properties: Record<string, unknown>,
): PresentationDimensions {
  if (properties['displaySize'] === CUSTOM_VIDEO_DISPLAY_SIZE) {
    const custom = readCustomDisplayDimensions(properties);
    return {
      ...custom,
      fullscreen: properties['fullscreen'] === true,
    };
  }

  const base = parseVideoDisplaySize(properties['displaySize']) ?? {
    width: 640,
    height: 360,
  };
  return {
    ...base,
    fullscreen: properties['fullscreen'] === true,
  };
}

export function resolvePresentationDimensions(
  node: Pick<ComponentNode, 'type' | 'label' | 'properties'> &
    Partial<Pick<ComponentNode, 'layout' | 'ports'>>,
): PresentationDimensions | null {
  switch (node.type) {
    case 'visual.media.video-source':
    case 'visual.media.equirect-viewport':
    case 'visual.media.flat-video-viewport':
    case 'visual.media.equirect-sphere-viewport':
      return resolveMediaDisplayDimensions(node.properties);
    case 'visual.input.text': {
      const showsLabel = formFieldShowsLabel(node.properties);
      const base = showsLabel
        ? DEFAULT_FORM_FIELD_HEIGHT
        : INPUT_HEIGHT + FORM_FIELD_PADDING * 2;
      if (textInputUsesMultiline(node)) {
        const layoutH = node.layout?.height;
        if (typeof layoutH === 'number' && layoutH > 0) {
          const chrome = canvasShellChromeForTextInput(node.ports);
          return {
            width: DEFAULT_FORM_FIELD_WIDTH,
            height: Math.max(base + TEXTAREA_ROW_HEIGHT, layoutH - chrome),
          };
        }
      }
      return { width: DEFAULT_FORM_FIELD_WIDTH, height: base };
    }
    case 'visual.input.select':
    case 'visual.input.number':
    case 'visual.input.date-range': {
      const showsLabel = formFieldShowsLabel(node.properties);
      const height = showsLabel
        ? DEFAULT_FORM_FIELD_HEIGHT
        : INPUT_HEIGHT + FORM_FIELD_PADDING * 2;
      return { width: DEFAULT_FORM_FIELD_WIDTH, height };
    }
    case 'visual.input.textarea': {
      const showsLabel = formFieldShowsLabel(node.properties);
      const rows =
        typeof node.properties['rows'] === 'number' && node.properties['rows'] > 0
          ? node.properties['rows']
          : 4;
      const textareaHeight = rows * TEXTAREA_ROW_HEIGHT;
      const labelHeight = showsLabel ? LABEL_LINE_HEIGHT + FIELD_GAP : 0;
      return {
        width: DEFAULT_FORM_FIELD_WIDTH,
        height: labelHeight + textareaHeight + FORM_FIELD_PADDING * 2,
      };
    }
    case 'visual.input.checkbox': {
      return { width: 240, height: CHECKBOX_HEIGHT + FORM_FIELD_PADDING };
    }
    default:
      return null;
  }
}

export function shouldSyncLayoutOnPropertyChange(type: string, key: string): boolean {
  return LAYOUT_SYNC_PROPERTY_KEYS[type]?.includes(key) ?? false;
}

const MEDIA_DISPLAY_DEFAULTS = {
  displaySize: DEFAULT_VIDEO_DISPLAY_SIZE,
  fullscreen: false,
  customWidth: 640,
  customHeight: 360,
} as const;

export function defaultPropertiesForMediaVideoSource(): Record<string, unknown> {
  return {
    label: '',
    accept: 'video/*',
    url: '',
    ...MEDIA_DISPLAY_DEFAULTS,
    sourceWidth: DEFAULT_EQUIRECT_SOURCE.width,
    sourceHeight: DEFAULT_EQUIRECT_SOURCE.height,
  };
}

export function defaultPropertiesForMediaEquirectViewport(): Record<string, unknown> {
  return {
    ...MEDIA_DISPLAY_DEFAULTS,
    sourceWidth: DEFAULT_EQUIRECT_SOURCE.width,
    sourceHeight: DEFAULT_EQUIRECT_SOURCE.height,
  };
}

export function defaultPropertiesForMediaFlatVideoViewport(): Record<string, unknown> {
  return {
    ...MEDIA_DISPLAY_DEFAULTS,
    sourceWidth: DEFAULT_EQUIRECT_SOURCE.width,
    sourceHeight: DEFAULT_EQUIRECT_SOURCE.height,
  };
}

export function defaultPropertiesForMediaEquirectSphereViewport(): Record<string, unknown> {
  return { ...MEDIA_DISPLAY_DEFAULTS };
}

export function isFormInputType(type: string): boolean {
  return FORM_INPUT_TYPES.has(type);
}

/** Merge hidden runtime defaults (e.g. equirect source metadata) into node properties. */
export function enrichComponentProperties(
  type: string,
  properties: Record<string, unknown>,
): Record<string, unknown> {
  if (type === 'visual.media.video-source') {
    return {
      ...defaultPropertiesForMediaVideoSource(),
      ...properties,
    };
  }
  if (type === 'visual.media.equirect-viewport') {
    return {
      ...defaultPropertiesForMediaEquirectViewport(),
      ...properties,
    };
  }
  if (type === 'visual.media.flat-video-viewport') {
    return {
      ...defaultPropertiesForMediaFlatVideoViewport(),
      ...properties,
    };
  }
  if (type === 'visual.media.equirect-sphere-viewport') {
    return {
      ...defaultPropertiesForMediaEquirectSphereViewport(),
      ...properties,
    };
  }
  return properties;
}
