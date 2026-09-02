import {
  DB_WASM_MEDIA_TAG,
  registerRdWasmMedia,
} from '@rosettadash/web-components/visual/wasm/media';
import type { AuthoringRecordRange } from '@rosettadash/core';
import type { PropType } from 'vue';
import { defineCustomElementHost } from '../../../lib/custom-element-host';

export interface WasmMediaProps {
  label?: string;
  operation?: string;
  extractionMode?: 'flat-crop' | 'rectilinear';
  outputFormat?: string;
  showProgress?: boolean;
  cropX?: number;
  cropY?: number;
  cropWidth?: number;
  cropHeight?: number;
  outputWidth?: number;
  outputHeight?: number;
  yaw?: number;
  pitch?: number;
  horizontalFov?: number;
  reverse?: boolean;
  inputFile?: File | Blob | null;
  cropRegion?: Record<string, string | number | boolean | null | undefined> | null;
  recordRange?: AuthoringRecordRange | null;
  previewRecording?: Blob | null;
  className?: string;
}

/** Vue host for `<rd-wasm-media>`. */
export const WasmMedia = defineCustomElementHost(
  {
    name: 'RdWasmMedia',
    tagName: DB_WASM_MEDIA_TAG,
    register: registerRdWasmMedia,
    properties: ['inputFile', 'cropRegion', 'recordRange', 'previewRecording'],
    attrs: {
      extractionMode: 'extraction-mode',
      outputFormat: 'output-format',
      showProgress: 'show-progress',
      cropX: 'crop-x',
      cropY: 'crop-y',
      cropWidth: 'crop-width',
      cropHeight: 'crop-height',
      outputWidth: 'output-width',
      outputHeight: 'output-height',
      yaw: 'yaw',
      pitch: 'pitch',
      horizontalFov: 'horizontal-fov',
      reverse: 'reverse',
    },
    events: {
      progress: 'progress',
      'extract-complete': 'extractComplete',
      'extract-error': 'extractError',
      metadata: 'metadata',
    },
  },
  {
    label: { type: String, default: undefined },
    operation: { type: String, default: undefined },
    extractionMode: { type: String, default: undefined },
    outputFormat: { type: String, default: undefined },
    showProgress: { type: Boolean, default: undefined },
    cropX: { type: Number, default: undefined },
    cropY: { type: Number, default: undefined },
    cropWidth: { type: Number, default: undefined },
    cropHeight: { type: Number, default: undefined },
    outputWidth: { type: Number, default: undefined },
    outputHeight: { type: Number, default: undefined },
    yaw: { type: Number, default: undefined },
    pitch: { type: Number, default: undefined },
    horizontalFov: { type: Number, default: undefined },
    reverse: { type: Boolean, default: undefined },
    inputFile: { type: [Object, File] as PropType<File | Blob | null | undefined>, default: undefined },
    cropRegion: {
      type: Object as PropType<
        Record<string, string | number | boolean | null | undefined> | null | undefined
      >,
      default: undefined,
    },
    recordRange: {
      type: Object as PropType<AuthoringRecordRange | null | undefined>,
      default: undefined,
    },
    previewRecording: {
      type: Object as PropType<Blob | null | undefined>,
      default: undefined,
    },
  },
);

export type WasmMediaComponent = typeof WasmMedia;
