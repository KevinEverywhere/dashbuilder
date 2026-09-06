import {
  AUTHORING_DEFAULT_OUTPUT_PRESET_ID,
  AUTHORING_OUTPUT_CUSTOM_ID,
  AUTHORING_OUTPUT_PRESETS,
  centerCropForOutput,
  flatCropToCropRegion,
  authoringExtractDownloadName,
  authoringPreviewRecordingDownloadName,
  getAuthoringOutputPreset,
  isEquirectSourceDimensions,
  type AuthoringRecordRange,
  virtualCameraToCropRegion,
  wrapSignedDegrees,
} from '@rosettadash/core';
import {
  DEFAULT_AUTHORING_EXAMPLE_ID,
  DESTINATION_ATLAS_AUTHORING_EXAMPLES,
  destinationMissingContentMessage,
  fetchAuthoring360File,
  getAuthoring360Source,
  getAuthoringExampleById,
  getAuthoringExampleForDestinationId,
  getDestinationById,
} from '@destination-atlas';
import { untrack } from 'svelte';
import type { VideoFileDetail } from '@rosettadash/svelte/visual/media/video-source';
import { localizedDestinationName } from './atlas-utils';
import { evenDimension, matchOutputPreset, probeVideoFile } from './authoring-helpers';

type CropRegion = Record<string, string | number | boolean | null | undefined>;

export function createAuthoringScreen(locale: string, selectedId: string): ReturnType<typeof createAuthoringScreenReactive>;
export function createAuthoringScreen(
  getLocale: () => string,
  getSelectedId: () => string,
): ReturnType<typeof createAuthoringScreenReactive>;
export function createAuthoringScreen(
  localeOrGetLocale: string | (() => string),
  selectedIdOrGetSelectedId: string | (() => string),
) {
  const getLocale =
    typeof localeOrGetLocale === 'function' ? localeOrGetLocale : () => localeOrGetLocale;
  const getSelectedId =
    typeof selectedIdOrGetSelectedId === 'function'
      ? selectedIdOrGetSelectedId
      : () => selectedIdOrGetSelectedId;
  return createAuthoringScreenReactive(getLocale, getSelectedId);
}

function createAuthoringScreenReactive(getLocale: () => string, getSelectedId: () => string) {
  let exampleId = $state(DEFAULT_AUTHORING_EXAMPLE_ID);
  let inputFile = $state<File | null>(null);
  let sourceUrl = $state<string | null>(null);
  let sourceLoadBusy = $state(false);
  let sourceLoadError = $state<string | null>(null);
  let libraryAutoloadResolved = $state(false);
  let cropRegion = $state<CropRegion | null>(null);
  let extractUrl = $state<string | null>(null);
  let extractFilter = $state('');
  let extractProgress = $state(0);
  let extractError = $state<string | null>(null);
  let extractBusy = $state(false);

  let yaw = $state(25);
  let pitch = $state(-8);
  let horizontalFov = $state(75);
  const defaultOutput =
    getAuthoringOutputPreset(AUTHORING_DEFAULT_OUTPUT_PRESET_ID) ?? AUTHORING_OUTPUT_PRESETS[0];
  let outputWidth = $state(defaultOutput.width);
  let outputHeight = $state(defaultOutput.height);
  let outputPresetId = $state(AUTHORING_DEFAULT_OUTPUT_PRESET_ID);
  let reverse = $state(false);
  let sourceWidth = $state<number | undefined>(undefined);
  let sourceHeight = $state<number | undefined>(undefined);
  let cropX = $state(0);
  let cropY = $state(0);
  let cropWidth = $state(defaultOutput.width);
  let cropHeight = $state(defaultOutput.height);
  let recordRange = $state<AuthoringRecordRange | null>(null);
  let previewRecording = $state<Blob | null>(null);
  let extractFormat = $state<'mp4' | 'webm'>('mp4');
  let exportReferenceToken = $state(0);
  let outputSizeCommitToken = $state(1);
  let extractResultKind = $state<'preview-recording' | 'ffmpeg' | null>(null);
  let extractResultFormat = $state<'mp4' | 'webm' | null>(null);

  const extractFormatOptions = [
    { value: 'mp4', label: 'MP4 (transcode mirror recording)' },
    { value: 'webm', label: 'WebM (mirror recording copy)' },
  ] as const;

  /** Non-reactive flag — mirrors React `userPickedFileRef` (avoid $effect feedback loops). */
  const userPickedFileRef = { current: false };
  let objectUrl: string | null = null;
  let extractObjectUrl: string | null = null;

  const example = $derived(
    getAuthoringExampleById(exampleId) ?? DESTINATION_ATLAS_AUTHORING_EXAMPLES[0],
  );

  const activeDestination = $derived.by(() => {
    const destId = getSelectedId();
    const fromSelection = destId ? getDestinationById(destId) : undefined;
    const current = example;
    return fromSelection ?? (current ? getDestinationById(current.destinationId) : undefined);
  });

  const missingContentMessage = $derived(
    activeDestination
      ? destinationMissingContentMessage(localizedDestinationName(activeDestination, getLocale()))
      : '',
  );

  const showMissingContent = $derived(
    Boolean(activeDestination) &&
      libraryAutoloadResolved &&
      !inputFile &&
      !sourceLoadBusy &&
      !sourceUrl,
  );

  const exampleOptions = $derived(
    DESTINATION_ATLAS_AUTHORING_EXAMPLES.map((entry) => ({
      value: entry.id,
      label: entry.label,
    })),
  );

  const sourceReady = $derived(
    Boolean(sourceUrl && sourceWidth && sourceHeight && !sourceLoadBusy),
  );

  const isEquirectSource = $derived.by(() => {
    const width = sourceWidth;
    const height = sourceHeight;
    return Boolean(sourceReady && width && height && isEquirectSourceDimensions(width, height));
  });

  const sourceModeLabel = $derived(
    isEquirectSource
      ? '360° equirectangular — camera framing controls'
      : 'Flat video — drag the crop rectangle on source',
  );

  const isCustomOutput = $derived(outputPresetId === AUTHORING_OUTPUT_CUSTOM_ID);

  const playbackHint = $derived(
    isEquirectSource
      ? 'Drag on the sphere or use Camera framing sliders · FOV above 130° enters little-planet'
      : 'Drag the crop rectangle · corner handles set a custom output size · presets snap to standard dimensions',
  );

  const sourceAspect = $derived.by(() => {
    const width = sourceWidth;
    const height = sourceHeight;
    return width && height && height > 0 ? width / height : null;
  });

  const equirectAspectWarning = $derived(
    isEquirectSource &&
      sourceAspect !== null &&
      Math.abs(sourceAspect - 2) > 0.05,
  );

  const exampleLabel = $derived.by(() => {
    const current = example;
    const destination = current ? getDestinationById(current.destinationId) : undefined;
    if (!current || !destination) {
      return current?.label ?? 'Authoring example';
    }
    return `${current.label} · ${localizedDestinationName(destination, getLocale())}`;
  });

  const outputPresetOptions = $derived([
    ...AUTHORING_OUTPUT_PRESETS.map((entry) => ({ value: entry.id, label: entry.label })),
    { value: AUTHORING_OUTPUT_CUSTOM_ID, label: 'Custom' },
  ]);

  const downloadName = $derived.by(() => {
    if (extractResultKind === 'preview-recording' && extractResultFormat === 'webm') {
      return authoringPreviewRecordingDownloadName(inputFile);
    }
    return authoringExtractDownloadName(inputFile);
  });

  function revokeExtractUrl(): void {
    if (extractObjectUrl) {
      URL.revokeObjectURL(extractObjectUrl);
      extractObjectUrl = null;
    }
    extractUrl = null;
  }

  function formatDegree(value: number): number {
    return Math.round(value * 10) / 10;
  }

  function wrapSigned(value: number): number {
    return wrapSignedDegrees(value);
  }

  function onOutputSizeChange(detail: { outputWidth: number; outputHeight: number }): void {
    outputWidth = evenDimension(detail.outputWidth);
    outputHeight = evenDimension(detail.outputHeight);
    outputPresetId = AUTHORING_OUTPUT_CUSTOM_ID;
  }

  function onCameraChange(detail: { yaw: number; pitch: number; horizontalFov: number }): void {
    yaw = wrapSignedDegrees(detail.yaw);
    pitch = detail.pitch;
    horizontalFov = detail.horizontalFov;
  }

  function applyFlatCrop(detail: {
    cropX: number;
    cropY: number;
    cropWidth: number;
    cropHeight: number;
  }): void {
    cropX = detail.cropX;
    cropY = detail.cropY;
    cropWidth = detail.cropWidth;
    cropHeight = detail.cropHeight;
    outputWidth = evenDimension(detail.cropWidth);
    outputHeight = evenDimension(detail.cropHeight);
    outputPresetId = AUTHORING_OUTPUT_CUSTOM_ID;
  }

  function onCropChange(detail: {
    cropX: number;
    cropY: number;
    cropWidth: number;
    cropHeight: number;
  }): void {
    applyFlatCrop(detail);
  }

  function updateFlatCrop(
    partial: Partial<{ cropX: number; cropY: number; cropWidth: number; cropHeight: number }>,
  ): void {
    applyFlatCrop({
      cropX: partial.cropX ?? cropX,
      cropY: partial.cropY ?? cropY,
      cropWidth: partial.cropWidth ?? cropWidth,
      cropHeight: partial.cropHeight ?? cropHeight,
    });
  }

  function handleOutputPresetChange(presetId: string): void {
    outputPresetId = presetId;
    if (presetId === AUTHORING_OUTPUT_CUSTOM_ID) {
      return;
    }
    const preset = getAuthoringOutputPreset(presetId);
    if (preset) {
      outputWidth = preset.width;
      outputHeight = preset.height;
      outputSizeCommitToken += 1;
      if (isEquirectSource) {
        exportReferenceToken += 1;
      }
    }
  }

  function handleCustomDimensionChange(width: number, height: number): void {
    if (!isCustomOutput) {
      return;
    }
    outputWidth = width;
    outputHeight = height;
    outputPresetId = matchOutputPreset(width, height);
    outputSizeCommitToken += 1;
  }

  function handleVideoFile(detail: VideoFileDetail): void {
    userPickedFileRef.current = true;
    sourceLoadBusy = false;
    sourceLoadError = null;
    recordRange = null;
    previewRecording = null;
    inputFile = detail.file;
    const current = example;
    if (current) {
      yaw = current.defaultYaw;
      pitch = current.defaultPitch;
      horizontalFov = current.defaultHorizontalFov;
    }
    const width = Number(detail.metadata.sourceWidth);
    const height = Number(detail.metadata.sourceHeight);
    if (Number.isFinite(width) && width > 0 && Number.isFinite(height) && height > 0) {
      sourceWidth = width;
      sourceHeight = height;
    } else {
      sourceWidth = undefined;
      sourceHeight = undefined;
    }
    revokeExtractUrl();
    extractProgress = 0;
    extractError = null;
    extractBusy = false;
  }

  function onAuthoringFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) {
      return;
    }
    void probeVideoFile(file).then(({ width, height }) => {
      handleVideoFile({
        file,
        metadata: {
          name: file.name,
          sourceWidth: width > 0 ? width : undefined,
          sourceHeight: height > 0 ? height : undefined,
          size: file.size,
        },
      });
    });
  }

  function resetView(): void {
    const current = example;
    if (!current) {
      return;
    }
    if (isEquirectSource) {
      yaw = current.defaultYaw;
      pitch = current.defaultPitch;
      horizontalFov = current.defaultHorizontalFov;
      return;
    }
    const width = sourceWidth;
    const height = sourceHeight;
    if (!width || !height) {
      return;
    }
    const centered = centerCropForOutput(width, height, outputWidth, outputHeight);
    cropX = centered.cropX;
    cropY = centered.cropY;
    cropWidth = centered.cropWidth;
    cropHeight = centered.cropHeight;
  }

  function resetExportRectangle(): void {
    if (isEquirectSource) {
      exportReferenceToken += 1;
      return;
    }
    const width = sourceWidth;
    const height = sourceHeight;
    if (!width || !height) {
      return;
    }
    const centered = centerCropForOutput(width, height, outputWidth, outputHeight);
    cropX = centered.cropX;
    cropY = centered.cropY;
    cropWidth = centered.cropWidth;
    cropHeight = centered.cropHeight;
  }

  function applyLittlePlanetPreset(): void {
    horizontalFov = 360;
    pitch = -85;
  }

  function onExtractProgress(detail: { progress: number }): void {
    extractBusy = true;
    extractProgress = detail.progress;
  }

  function onExtractComplete(detail: {
    blob: Blob;
    metadata: Record<string, string | number | boolean | null | undefined>;
  }): void {
    extractBusy = false;
    extractProgress = 100;
    extractError = null;
    revokeExtractUrl();
    const url = URL.createObjectURL(detail.blob);
    extractObjectUrl = url;
    extractUrl = url;
    const isPreviewRecording = detail.metadata.source === 'preview-recording';
    extractResultKind = isPreviewRecording ? 'preview-recording' : 'ffmpeg';
    extractResultFormat = detail.metadata.format === 'webm' ? 'webm' : 'mp4';
    if (isPreviewRecording) {
      extractFilter =
        detail.metadata.format === 'webm'
          ? 'Extract copies the output mirror recording as WebM (same clip as playback download).'
          : 'Extract transcodes the output mirror recording to MP4 via ffmpeg.wasm (playback download stays WebM).';
      return;
    }
    const filter = detail.metadata.filter;
    extractFilter = typeof filter === 'string' ? filter : '';
  }

  function onExtractError(detail: { message: string }): void {
    extractBusy = false;
    extractError = detail.message;
  }

  $effect(() => {
    const selectedId = getSelectedId();
    if (!selectedId) {
      return;
    }
    const linkedExample = getAuthoringExampleForDestinationId(selectedId);
    if (linkedExample && linkedExample.id !== exampleId) {
      exampleId = linkedExample.id;
    }
  });

  $effect(() => {
    void getSelectedId();
    void exampleId;
    userPickedFileRef.current = false;
  });

  $effect(() => {
    void exampleId;
    const current = example;
    if (!current || userPickedFileRef.current) {
      return;
    }

    untrack(() => {
      yaw = current.defaultYaw;
      pitch = current.defaultPitch;
      horizontalFov = current.defaultHorizontalFov;
      const preset = getAuthoringOutputPreset(AUTHORING_DEFAULT_OUTPUT_PRESET_ID);
      outputPresetId = AUTHORING_DEFAULT_OUTPUT_PRESET_ID;
      outputWidth = preset?.width ?? defaultOutput.width;
      outputHeight = preset?.height ?? defaultOutput.height;
      outputSizeCommitToken += 1;
      sourceWidth = undefined;
      sourceHeight = undefined;
      recordRange = null;
      previewRecording = null;
      cropRegion = null;
      extractFilter = '';
      extractResultKind = null;
      extractResultFormat = null;
      extractProgress = 0;
      extractError = null;
      extractBusy = false;
      inputFile = null;
      sourceUrl = null;
      sourceLoadBusy = false;
      sourceLoadError = null;
      revokeExtractUrl();
    });
  });

  $effect(() => {
    const destId = getSelectedId();
    void exampleId;
    if (!destId || userPickedFileRef.current) {
      return;
    }
    if (!getAuthoring360Source(destId)) {
      sourceLoadBusy = false;
      libraryAutoloadResolved = true;
      return;
    }
    let cancelled = false;
    sourceLoadBusy = true;
    libraryAutoloadResolved = false;
    sourceLoadError = null;
    void fetchAuthoring360File(destId)
      .then((file) => {
        if (cancelled || userPickedFileRef.current) {
          return;
        }
        sourceLoadBusy = false;
        if (file) {
          inputFile = file;
        }
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }
        sourceLoadBusy = false;
        sourceLoadError = error instanceof Error ? error.message : String(error);
      })
      .finally(() => {
        if (!cancelled) {
          libraryAutoloadResolved = true;
        }
      });
    return () => {
      cancelled = true;
    };
  });

  $effect(() => {
    const file = inputFile;
    if (!file) {
      return;
    }
    const url = URL.createObjectURL(file);
    objectUrl = url;
    sourceUrl = url;
    return () => {
      URL.revokeObjectURL(url);
      if (objectUrl === url) {
        objectUrl = null;
      }
    };
  });

  $effect(() => {
    const file = inputFile;
    const width = sourceWidth;
    const height = sourceHeight;
    if (!file || (width && height)) {
      return;
    }
    void probeVideoFile(file).then(({ width: probedWidth, height: probedHeight }) => {
      if (probedWidth > 0 && probedHeight > 0) {
        sourceWidth = probedWidth;
        sourceHeight = probedHeight;
      }
    });
  });

  $effect(() => {
    const width = sourceWidth;
    const height = sourceHeight;
    if (!width || !height || isEquirectSource || outputPresetId === AUTHORING_OUTPUT_CUSTOM_ID) {
      return;
    }
    const centered = centerCropForOutput(width, height, outputWidth, outputHeight);
    cropX = centered.cropX;
    cropY = centered.cropY;
    cropWidth = centered.cropWidth;
    cropHeight = centered.cropHeight;
  });

  $effect(() => {
    void extractFormat;
    void isEquirectSource;
    void yaw;
    void pitch;
    void horizontalFov;
    void sourceWidth;
    void sourceHeight;
    void outputWidth;
    void outputHeight;
    void reverse;
    void cropX;
    void cropY;
    void cropWidth;
    void cropHeight;
    void previewRecording;

    untrack(() => {
      const previewMirrorNote =
        extractFormat === 'webm'
          ? 'Extract copies the output mirror recording as WebM (same clip as playback download).'
          : 'Extract transcodes the output mirror recording to MP4 via ffmpeg.wasm (playback download stays WebM).';
      if (isEquirectSource) {
        const region = virtualCameraToCropRegion({
          camera: { yaw, pitch, roll: 0, fov: horizontalFov },
          sourceWidth,
          sourceHeight,
          outputWidth,
          outputHeight,
          reverse,
        });
        cropRegion = region;
        extractFilter = previewRecording
          ? previewMirrorNote
          : typeof region.filter === 'string'
            ? region.filter
            : '';
        return;
      }
      const width = sourceWidth;
      const height = sourceHeight;
      if (!width || !height) {
        cropRegion = null;
        extractFilter = '';
        return;
      }
      const region = flatCropToCropRegion({
        cropX,
        cropY,
        cropWidth,
        cropHeight,
        sourceWidth: width,
        sourceHeight: height,
        outputWidth,
        outputHeight,
        reverse,
      });
      cropRegion = region;
      extractFilter = previewRecording ? previewMirrorNote : region.filter;
    });
  });

  return {
    get exampleId() {
      return exampleId;
    },
    set exampleId(value: string) {
      exampleId = value;
    },
    get inputFile() {
      return inputFile;
    },
    get sourceUrl() {
      return sourceUrl;
    },
    get sourceLoadBusy() {
      return sourceLoadBusy;
    },
    get sourceLoadError() {
      return sourceLoadError;
    },
    get libraryAutoloadResolved() {
      return libraryAutoloadResolved;
    },
    get showMissingContent() {
      return showMissingContent;
    },
    get missingContentMessage() {
      return missingContentMessage;
    },
    get cropRegion() {
      return cropRegion;
    },
    get extractUrl() {
      return extractUrl;
    },
    get extractFilter() {
      return extractFilter;
    },
    get extractProgress() {
      return extractProgress;
    },
    get extractError() {
      return extractError;
    },
    get extractBusy() {
      return extractBusy;
    },
    get yaw() {
      return yaw;
    },
    set yaw(value: number) {
      yaw = value;
    },
    get pitch() {
      return pitch;
    },
    set pitch(value: number) {
      pitch = value;
    },
    get horizontalFov() {
      return horizontalFov;
    },
    set horizontalFov(value: number) {
      horizontalFov = value;
    },
    get outputWidth() {
      return outputWidth;
    },
    set outputWidth(value: number) {
      outputWidth = value;
    },
    get outputHeight() {
      return outputHeight;
    },
    set outputHeight(value: number) {
      outputHeight = value;
    },
    get outputPresetId() {
      return outputPresetId;
    },
    set outputPresetId(value: string) {
      outputPresetId = value;
    },
    get reverse() {
      return reverse;
    },
    set reverse(value: boolean) {
      reverse = value;
    },
    get sourceWidth() {
      return sourceWidth;
    },
    get sourceHeight() {
      return sourceHeight;
    },
    get cropX() {
      return cropX;
    },
    get cropY() {
      return cropY;
    },
    get cropWidth() {
      return cropWidth;
    },
    get cropHeight() {
      return cropHeight;
    },
    get recordRange() {
      return recordRange;
    },
    set recordRange(value: AuthoringRecordRange | null) {
      recordRange = value;
    },
    get previewRecording() {
      return previewRecording;
    },
    set previewRecording(value: Blob | null) {
      previewRecording = value;
    },
    get extractFormat() {
      return extractFormat;
    },
    set extractFormat(value: 'mp4' | 'webm') {
      extractFormat = value;
    },
    get exportReferenceToken() {
      return exportReferenceToken;
    },
    get outputSizeCommitToken() {
      return outputSizeCommitToken;
    },
    get extractResultKind() {
      return extractResultKind;
    },
    get extractResultFormat() {
      return extractResultFormat;
    },
    extractFormatOptions,
    get example() {
      return example;
    },
    get exampleOptions() {
      return exampleOptions;
    },
    get sourceReady() {
      return sourceReady;
    },
    get isEquirectSource() {
      return isEquirectSource;
    },
    get sourceModeLabel() {
      return sourceModeLabel;
    },
    get isCustomOutput() {
      return isCustomOutput;
    },
    get playbackHint() {
      return playbackHint;
    },
    get sourceAspect() {
      return sourceAspect;
    },
    get equirectAspectWarning() {
      return equirectAspectWarning;
    },
    get exampleLabel() {
      return exampleLabel;
    },
    get outputPresetOptions() {
      return outputPresetOptions;
    },
    get downloadName() {
      return downloadName;
    },
    formatDegree,
    wrapSigned,
    onOutputSizeChange,
    onCameraChange,
    onCropChange,
    updateFlatCrop,
    handleOutputPresetChange,
    handleCustomDimensionChange,
    onAuthoringFileSelected,
    resetView,
    resetExportRectangle,
    applyLittlePlanetPreset,
    onExtractProgress,
    onExtractComplete,
    onExtractError,
  };
}
