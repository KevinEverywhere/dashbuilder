import type { AuthoringRecordRange } from '@rosettadash/core';

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
  onProgress?: (detail: { progress: number }) => void;
  onExtractComplete?: (detail: {
    blob: Blob;
    metadata: Record<string, string | number | boolean | null | undefined>;
  }) => void;
  onExtractError?: (detail: { message: string }) => void;
  onMetadata?: (
    detail: Record<string, string | number | boolean | null | undefined>,
  ) => void;
}
