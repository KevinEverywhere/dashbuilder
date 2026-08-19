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

const LABEL_LINE_HEIGHT = 20;
const FIELD_GAP = 6;
const INPUT_HEIGHT = 38;
const FORM_FIELD_PADDING = 8;
const CHECKBOX_HEIGHT = 32;
const TEXTAREA_ROW_HEIGHT = 22;

const DEFAULT_FORM_FIELD_WIDTH = 280;
const DEFAULT_FORM_FIELD_HEIGHT =
  LABEL_LINE_HEIGHT + FIELD_GAP + INPUT_HEIGHT + FORM_FIELD_PADDING * 2;

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
  node: Pick<ComponentNode, 'type' | 'label' | 'properties'>,
): PresentationDimensions | null {
  switch (node.type) {
    case 'visual.media.video-source':
    case 'visual.media.equirect-viewport':
    case 'visual.media.flat-video-viewport':
    case 'visual.media.equirect-sphere-viewport':
      return resolveMediaDisplayDimensions(node.properties);
    case 'visual.input.text':
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
