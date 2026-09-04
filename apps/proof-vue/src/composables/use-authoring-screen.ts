import { computed, onUnmounted, ref, watch, type Ref } from 'vue';
import {
  AUTHORING_OUTPUT_CUSTOM_ID,
  AUTHORING_OUTPUT_PRESETS,
  centerCropForOutput,
  defaultAuthoringRecordRange,
  flatCropToCropRegion,
  authoringExtractDownloadName,
  authoringPreviewRecordingDownloadName,
  getAuthoringOutputPreset,
  isEquirectSourceDimensions,
  type AuthoringRecordRange,
  virtualCameraToCropRegion,
  wrapSignedDegrees,
} from '@rosettadash/core';
import type { VideoFileDetail } from '@rosettadash/vue/visual/media/video-source';
import {
  DEFAULT_AUTHORING_EXAMPLE_ID,
  DESTINATION_ATLAS_AUTHORING_EXAMPLES,
  fetchAuthoring360File,
  getAuthoring360Source,
  getAuthoringExampleById,
  destinationMissingContentMessage,
  getAuthoringExampleForDestinationId,
  getDestinationById,
} from '@destination-atlas';
import { localizedDestinationName } from '../lib/atlas-utils';
import { evenDimension, matchOutputPreset, probeVideoFile } from '../lib/authoring-helpers';
import type { AuthoringViewportHandle } from '../lib/authoring-viewport';

type CropRegion = Record<string, string | number | boolean | null | undefined>;

export interface UseAuthoringScreenOptions {
  locale: Ref<string> | string;
  selectedId: Ref<string> | string;
}

export function useAuthoringScreen(options: UseAuthoringScreenOptions) {
  const locale = computed(() =>
    typeof options.locale === 'string' ? options.locale : options.locale.value,
  );
  const selectedId = computed(() =>
    typeof options.selectedId === 'string' ? options.selectedId : options.selectedId.value,
  );

  const sphereViewportRef = ref<AuthoringViewportHandle | null>(null);
  const flatViewportRef = ref<AuthoringViewportHandle | null>(null);
  const outputPreviewHostRef = ref<HTMLElement | null>(null);

  const exampleId = ref(DEFAULT_AUTHORING_EXAMPLE_ID);
  const inputFile = ref<File | null>(null);
  const sourceUrl = ref<string | null>(null);
  const sourceLoadBusy = ref(false);
  const sourceLoadError = ref<string | null>(null);
  const libraryAutoloadResolved = ref(false);
  const cropRegion = ref<CropRegion | null>(null);
  const extractUrl = ref<string | null>(null);
  const extractFilter = ref('');
  const extractProgress = ref(0);
  const extractError = ref<string | null>(null);
  const extractBusy = ref(false);

  const yaw = ref(25);
  const pitch = ref(-8);
  const horizontalFov = ref(75);
  const outputWidth = ref(720);
  const outputHeight = ref(480);
  const outputPresetId = ref('720x480');
  const reverse = ref(false);
  const sourceWidth = ref<number | undefined>(undefined);
  const sourceHeight = ref<number | undefined>(undefined);
  const cropX = ref(0);
  const cropY = ref(0);
  const cropWidth = ref(640);
  const cropHeight = ref(360);
  const recordRange = ref<AuthoringRecordRange | null>(null);
  const previewRecording = ref<Blob | null>(null);
  const extractFormat = ref<'mp4' | 'webm'>('mp4');
  const exportReferenceToken = ref(0);
  const outputSizeCommitToken = ref(1);
  const extractResultKind = ref<'preview-recording' | 'ffmpeg' | null>(null);
  const extractResultFormat = ref<'mp4' | 'webm' | null>(null);

  const extractFormatOptions = [
    { value: 'mp4', label: 'MP4 (transcode mirror recording)' },
    { value: 'webm', label: 'WebM (mirror recording copy)' },
  ];

  let userPickedFile = false;
  let objectUrl: string | null = null;
  let extractObjectUrl: string | null = null;

  const example = computed(
    () => getAuthoringExampleById(exampleId.value) ?? DESTINATION_ATLAS_AUTHORING_EXAMPLES[0],
  );
  const activeDestination = computed(() => {
    const destId = selectedId.value;
    return (destId ? getDestinationById(destId) : undefined) ?? getDestinationById(example.value.destinationId);
  });
  const missingContentMessage = computed(() =>
    activeDestination.value
      ? destinationMissingContentMessage(localizedDestinationName(activeDestination.value, locale.value))
      : '',
  );
  const showMissingContent = computed(
    () =>
      Boolean(activeDestination.value) &&
      libraryAutoloadResolved.value &&
      !inputFile.value &&
      !sourceLoadBusy.value &&
      !sourceUrl.value,
  );

  const exampleOptions = computed(() =>
    DESTINATION_ATLAS_AUTHORING_EXAMPLES.map((entry) => ({
      value: entry.id,
      label: entry.label,
    })),
  );

  const sourceReady = computed(
    () => Boolean(sourceUrl.value && sourceWidth.value && sourceHeight.value && !sourceLoadBusy.value),
  );

  const isEquirectSource = computed(() => {
    const width = sourceWidth.value;
    const height = sourceHeight.value;
    return Boolean(sourceReady.value && width && height && isEquirectSourceDimensions(width, height));
  });

  const sourceModeLabel = computed(() =>
    isEquirectSource.value
      ? '360° equirectangular — camera framing controls'
      : 'Flat video — drag the crop rectangle on source',
  );

  const isCustomOutput = computed(() => outputPresetId.value === AUTHORING_OUTPUT_CUSTOM_ID);

  const playbackHint = computed(() =>
    isEquirectSource.value
      ? 'Drag on the sphere or use Camera framing sliders · FOV above 130° enters little-planet'
      : 'Drag the crop rectangle · corner handles set a custom output size · presets snap to standard dimensions',
  );

  const sourceAspect = computed(() => {
    const width = sourceWidth.value;
    const height = sourceHeight.value;
    return width && height && height > 0 ? width / height : null;
  });

  const equirectAspectWarning = computed(
    () =>
      isEquirectSource.value &&
      sourceAspect.value !== null &&
      Math.abs(sourceAspect.value - 2) > 0.05,
  );

  const exampleLabel = computed(() => {
    const current = example.value;
    const destination = current ? getDestinationById(current.destinationId) : undefined;
    if (!current || !destination) {
      return current?.label ?? 'Authoring example';
    }
    return `${current.label} · ${localizedDestinationName(destination, locale.value)}`;
  });

  const outputPresetOptions = computed(() => [
    ...AUTHORING_OUTPUT_PRESETS.map((entry) => ({ value: entry.id, label: entry.label })),
    { value: AUTHORING_OUTPUT_CUSTOM_ID, label: 'Custom' },
  ]);

  const downloadName = computed(() => {
    if (extractResultKind.value === 'preview-recording' && extractResultFormat.value === 'webm') {
      return authoringPreviewRecordingDownloadName(inputFile.value);
    }
    return authoringExtractDownloadName(inputFile.value);
  });

  const viewportRef = computed<AuthoringViewportHandle | null>(
    () => sphereViewportRef.value ?? flatViewportRef.value ?? null,
  );

  function syncDefaultRecordRange(viewport: AuthoringViewportHandle | null): void {
    if (!viewport || recordRange.value || !sourceReady.value) {
      return;
    }
    const range = defaultAuthoringRecordRange(viewport.getDuration());
    if (range) {
      recordRange.value = range;
    }
  }

  function setRecordRange(range: AuthoringRecordRange | null): void {
    recordRange.value = range;
    if (!range) {
      syncDefaultRecordRange(viewportRef.value);
    }
  }

  function setPreviewRecording(blob: Blob | null): void {
    previewRecording.value = blob;
  }

  function revokeExtractUrl(): void {
    if (extractObjectUrl) {
      URL.revokeObjectURL(extractObjectUrl);
      extractObjectUrl = null;
    }
    extractUrl.value = null;
  }

  function formatDegree(value: number): number {
    return Math.round(value * 10) / 10;
  }

  function wrapSigned(value: number): number {
    return wrapSignedDegrees(value);
  }

  function onOutputSizeChange(detail: { outputWidth: number; outputHeight: number }): void {
    outputWidth.value = evenDimension(detail.outputWidth);
    outputHeight.value = evenDimension(detail.outputHeight);
    outputPresetId.value = AUTHORING_OUTPUT_CUSTOM_ID;
  }

  function onCameraChange(detail: { yaw: number; pitch: number; horizontalFov: number }): void {
    const nextYaw = wrapSignedDegrees(detail.yaw);
    if (
      yaw.value === nextYaw &&
      pitch.value === detail.pitch &&
      horizontalFov.value === detail.horizontalFov
    ) {
      return;
    }
    yaw.value = nextYaw;
    pitch.value = detail.pitch;
    horizontalFov.value = detail.horizontalFov;
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
      cropX: partial.cropX ?? cropX.value,
      cropY: partial.cropY ?? cropY.value,
      cropWidth: partial.cropWidth ?? cropWidth.value,
      cropHeight: partial.cropHeight ?? cropHeight.value,
    });
  }

  function applyFlatCrop(detail: {
    cropX: number;
    cropY: number;
    cropWidth: number;
    cropHeight: number;
  }): void {
    cropX.value = detail.cropX;
    cropY.value = detail.cropY;
    cropWidth.value = detail.cropWidth;
    cropHeight.value = detail.cropHeight;
    outputWidth.value = evenDimension(detail.cropWidth);
    outputHeight.value = evenDimension(detail.cropHeight);
    outputPresetId.value = AUTHORING_OUTPUT_CUSTOM_ID;
  }

  function handleOutputPresetChange(presetId: string): void {
    outputPresetId.value = presetId;
    if (presetId === AUTHORING_OUTPUT_CUSTOM_ID) {
      return;
    }
    const preset = getAuthoringOutputPreset(presetId);
    if (preset) {
      outputWidth.value = preset.width;
      outputHeight.value = preset.height;
      outputSizeCommitToken.value += 1;
      if (isEquirectSource.value) {
        exportReferenceToken.value += 1;
      }
    }
  }

  function handleCustomDimensionChange(width: number, height: number): void {
    if (!isCustomOutput.value) {
      return;
    }
    outputWidth.value = width;
    outputHeight.value = height;
    outputPresetId.value = matchOutputPreset(width, height);
    outputSizeCommitToken.value += 1;
  }

  function handleVideoFile(detail: VideoFileDetail): void {
    userPickedFile = true;
    sourceLoadBusy.value = false;
    sourceLoadError.value = null;
    recordRange.value = null;
    previewRecording.value = null;
    inputFile.value = detail.file;
    const current = example.value;
    if (current) {
      yaw.value = current.defaultYaw;
      pitch.value = current.defaultPitch;
      horizontalFov.value = current.defaultHorizontalFov;
    }
    const width = Number(detail.metadata.sourceWidth);
    const height = Number(detail.metadata.sourceHeight);
    if (Number.isFinite(width) && width > 0 && Number.isFinite(height) && height > 0) {
      sourceWidth.value = width;
      sourceHeight.value = height;
    } else {
      sourceWidth.value = undefined;
      sourceHeight.value = undefined;
    }
    revokeExtractUrl();
    extractProgress.value = 0;
    extractError.value = null;
    extractBusy.value = false;
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
    const current = example.value;
    if (!current) {
      return;
    }
    if (isEquirectSource.value) {
      yaw.value = current.defaultYaw;
      pitch.value = current.defaultPitch;
      horizontalFov.value = current.defaultHorizontalFov;
      return;
    }
    const width = sourceWidth.value;
    const height = sourceHeight.value;
    if (!width || !height) {
      return;
    }
    const centered = centerCropForOutput(width, height, outputWidth.value, outputHeight.value);
    cropX.value = centered.cropX;
    cropY.value = centered.cropY;
    cropWidth.value = centered.cropWidth;
    cropHeight.value = centered.cropHeight;
  }

  function resetExportRectangle(): void {
    if (isEquirectSource.value) {
      exportReferenceToken.value += 1;
      return;
    }
    const width = sourceWidth.value;
    const height = sourceHeight.value;
    if (!width || !height) {
      return;
    }
    const centered = centerCropForOutput(width, height, outputWidth.value, outputHeight.value);
    cropX.value = centered.cropX;
    cropY.value = centered.cropY;
    cropWidth.value = centered.cropWidth;
    cropHeight.value = centered.cropHeight;
  }

  function applyLittlePlanetPreset(): void {
    horizontalFov.value = 360;
    pitch.value = -85;
  }

  function onExtractProgress(detail: { progress: number }): void {
    extractBusy.value = true;
    extractProgress.value = detail.progress;
  }

  function onExtractComplete(detail: {
    blob: Blob;
    metadata: Record<string, string | number | boolean | null | undefined>;
  }): void {
    extractBusy.value = false;
    extractProgress.value = 100;
    extractError.value = null;
    revokeExtractUrl();
    const url = URL.createObjectURL(detail.blob);
    extractObjectUrl = url;
    extractUrl.value = url;
    const isPreviewRecording = detail.metadata.source === 'preview-recording';
    extractResultKind.value = isPreviewRecording ? 'preview-recording' : 'ffmpeg';
    extractResultFormat.value = detail.metadata.format === 'webm' ? 'webm' : 'mp4';
    if (isPreviewRecording) {
      extractFilter.value =
        detail.metadata.format === 'webm'
          ? 'Extract copies the output mirror recording as WebM (same clip as playback download).'
          : 'Extract transcodes the output mirror recording to MP4 via ffmpeg.wasm (playback download stays WebM).';
      return;
    }
    const filter = detail.metadata.filter;
    extractFilter.value = typeof filter === 'string' ? filter : '';
  }

  function onExtractError(detail: { message: string }): void {
    extractBusy.value = false;
    extractError.value = detail.message;
  }

  watch(selectedId, (id) => {
    if (!id) {
      return;
    }
    const linkedExample = getAuthoringExampleForDestinationId(id);
    if (linkedExample) {
      exampleId.value = linkedExample.id;
    }
  }, { immediate: true });

  watch([selectedId, exampleId], () => {
    userPickedFile = false;
  });

  watch(example, (current) => {
    if (!current || userPickedFile) {
      return;
    }

    yaw.value = current.defaultYaw;
    pitch.value = current.defaultPitch;
    horizontalFov.value = current.defaultHorizontalFov;
    const preset = getAuthoringOutputPreset('720x480');
    outputPresetId.value = '720x480';
    outputWidth.value = preset?.width ?? 720;
    outputHeight.value = preset?.height ?? 480;
    outputSizeCommitToken.value += 1;
    sourceWidth.value = undefined;
    sourceHeight.value = undefined;
    recordRange.value = null;
    previewRecording.value = null;
    cropRegion.value = null;
    extractFilter.value = '';
    extractResultKind.value = null;
    extractResultFormat.value = null;
    extractProgress.value = 0;
    extractError.value = null;
    extractBusy.value = false;
    inputFile.value = null;
    sourceUrl.value = null;
    sourceLoadBusy.value = false;
    sourceLoadError.value = null;
    revokeExtractUrl();
  });

  watch([selectedId, exampleId], ([destId], _prev, onCleanup) => {
    if (!destId || userPickedFile) {
      return;
    }
    if (!getAuthoring360Source(destId)) {
      sourceLoadBusy.value = false;
      libraryAutoloadResolved.value = true;
      return;
    }
    let cancelled = false;
    sourceLoadBusy.value = true;
    libraryAutoloadResolved.value = false;
    sourceLoadError.value = null;
    void fetchAuthoring360File(destId)
      .then((file) => {
        if (cancelled || userPickedFile) {
          return;
        }
        sourceLoadBusy.value = false;
        if (file) {
          inputFile.value = file;
        }
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }
        sourceLoadBusy.value = false;
        sourceLoadError.value = error instanceof Error ? error.message : String(error);
      })
      .finally(() => {
        if (!cancelled) {
          libraryAutoloadResolved.value = true;
        }
      });
    onCleanup(() => {
      cancelled = true;
    });
  }, { immediate: true });

  watch([viewportRef, sourceReady, inputFile], () => {
    syncDefaultRecordRange(viewportRef.value);
    if (!recordRange.value && sourceReady.value) {
      window.setTimeout(() => syncDefaultRecordRange(viewportRef.value), 300);
      window.setTimeout(() => syncDefaultRecordRange(viewportRef.value), 1200);
    }
  });

  watch(inputFile, (file, _oldFile, onCleanup) => {
    if (!file) {
      return;
    }
    const url = URL.createObjectURL(file);
    objectUrl = url;
    sourceUrl.value = url;
    onCleanup(() => {
      URL.revokeObjectURL(url);
      if (objectUrl === url) {
        objectUrl = null;
      }
    });
  });

  watch([inputFile, sourceWidth, sourceHeight], ([file, width, height]) => {
    if (!file || (width && height)) {
      return;
    }
    void probeVideoFile(file).then(({ width: probedWidth, height: probedHeight }) => {
      if (probedWidth > 0 && probedHeight > 0) {
        sourceWidth.value = probedWidth;
        sourceHeight.value = probedHeight;
      }
    });
  });

  watch(
    [sourceWidth, sourceHeight, isEquirectSource, outputPresetId, outputWidth, outputHeight],
    ([width, height, equirect, presetId]) => {
      if (!width || !height || equirect || presetId === AUTHORING_OUTPUT_CUSTOM_ID) {
        return;
      }
      const centered = centerCropForOutput(width, height, outputWidth.value, outputHeight.value);
      cropX.value = centered.cropX;
      cropY.value = centered.cropY;
      cropWidth.value = centered.cropWidth;
      cropHeight.value = centered.cropHeight;
    },
  );

  watch(
    [
      extractFormat,
      isEquirectSource,
      yaw,
      pitch,
      horizontalFov,
      sourceWidth,
      sourceHeight,
      outputWidth,
      outputHeight,
      reverse,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      previewRecording,
    ],
    () => {
      const previewMirrorNote =
        extractFormat.value === 'webm'
          ? 'Extract copies the output mirror recording as WebM (same clip as playback download).'
          : 'Extract transcodes the output mirror recording to MP4 via ffmpeg.wasm (playback download stays WebM).';
      if (isEquirectSource.value) {
        const region = virtualCameraToCropRegion({
          camera: { yaw: yaw.value, pitch: pitch.value, roll: 0, fov: horizontalFov.value },
          sourceWidth: sourceWidth.value,
          sourceHeight: sourceHeight.value,
          outputWidth: outputWidth.value,
          outputHeight: outputHeight.value,
          reverse: reverse.value,
        });
        cropRegion.value = region as unknown as CropRegion;
        extractFilter.value = previewRecording.value
          ? previewMirrorNote
          : typeof region.filter === 'string'
            ? region.filter
            : '';
        return;
      }
      const width = sourceWidth.value;
      const height = sourceHeight.value;
      if (!width || !height) {
        cropRegion.value = null;
        extractFilter.value = '';
        return;
      }
      const region = flatCropToCropRegion({
        cropX: cropX.value,
        cropY: cropY.value,
        cropWidth: cropWidth.value,
        cropHeight: cropHeight.value,
        sourceWidth: width,
        sourceHeight: height,
        outputWidth: outputWidth.value,
        outputHeight: outputHeight.value,
        reverse: reverse.value,
      });
      cropRegion.value = region as unknown as CropRegion;
      extractFilter.value = previewRecording.value ? previewMirrorNote : region.filter;
    },
  );

  onUnmounted(() => {
    revokeExtractUrl();
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
      objectUrl = null;
    }
  });

  return {
    sphereViewportRef,
    flatViewportRef,
    outputPreviewHostRef,
    viewportRef,
    exampleId,
    inputFile,
    sourceUrl,
    sourceLoadBusy,
    sourceLoadError,
    cropRegion,
    extractUrl,
    extractFilter,
    extractProgress,
    extractError,
    extractBusy,
    yaw,
    pitch,
    horizontalFov,
    outputWidth,
    outputHeight,
    outputPresetId,
    reverse,
    sourceWidth,
    sourceHeight,
    cropX,
    cropY,
    cropWidth,
    cropHeight,
    recordRange,
    previewRecording,
    setRecordRange,
    setPreviewRecording,
    extractFormat,
    exportReferenceToken,
    outputSizeCommitToken,
    extractResultKind,
    extractResultFormat,
    extractFormatOptions,
    example,
    exampleOptions,
    sourceReady,
    isEquirectSource,
    sourceModeLabel,
    isCustomOutput,
    playbackHint,
    sourceAspect,
    equirectAspectWarning,
    exampleLabel,
    outputPresetOptions,
    downloadName,
    formatDegree,
    wrapSigned,
    onOutputSizeChange,
    onCameraChange,
    onCropChange,
    updateFlatCrop,
    handleOutputPresetChange,
    handleCustomDimensionChange,
    handleVideoFile,
    onAuthoringFileSelected,
    resetView,
    resetExportRectangle,
    applyLittlePlanetPreset,
    onExtractProgress,
    onExtractComplete,
    showMissingContent,
    missingContentMessage,
    onExtractError,
  };
}
