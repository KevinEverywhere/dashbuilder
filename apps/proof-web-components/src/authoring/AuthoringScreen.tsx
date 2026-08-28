import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AUTHORING_OUTPUT_CUSTOM_ID,
  AUTHORING_OUTPUT_PRESETS,
  centerCropForOutput,
  flatCropToCropRegion,
  getAuthoringOutputPreset,
  isEquirectSourceDimensions,
  authoringExtractDownloadName,
  type AuthoringRecordRange,
  virtualCameraToCropRegion,
} from '@rosettadash/core';
import {
  EquirectSphereViewport,
} from '@rosettadash/react/visual/media/equirect-sphere-viewport';
import {
  FlatVideoViewport,
} from '@rosettadash/react/visual/media/flat-video-viewport';
import { WasmMedia } from '@rosettadash/react/visual/wasm/media';
import { NumberInput } from '@rosettadash/react/visual/input/number';
import { SelectInput } from '@rosettadash/react/visual/input/select';
import {
  DEFAULT_AUTHORING_EXAMPLE_ID,
  DESTINATION_ATLAS_AUTHORING_EXAMPLES,
  getAuthoringExampleById,
  getAuthoringExampleForDestinationId,
  getDestinationById,
} from '@destination-atlas';
import { AuthoringPlaybackBar } from './AuthoringPlaybackBar';
import { PlaybackReverseIcon } from './authoring-playback-icons';
import { AuthoringCameraControls, LITTLE_PLANET_HFOV, LITTLE_PLANET_PITCH } from './AuthoringCameraControls';
import { localizedDestinationName } from '../lib/atlas-utils';
import type { AuthoringViewportHandle } from '../lib/authoring-viewport';

export const AUTHORING_SOURCE = `<AuthoringScreen>
  <VideoSource onVideoFile={…} />
  <EquirectSphereViewport videoSrc={sourceUrl} yaw={…} pitch={…} />
  <WasmMedia operation="equirect-extract" inputFile={inputFile} />
</AuthoringScreen>`;

type CropRegion = ReturnType<typeof virtualCameraToCropRegion> | ReturnType<typeof flatCropToCropRegion>;

function probeVideoFile(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      resolve({ width: video.videoWidth, height: video.videoHeight });
      URL.revokeObjectURL(url);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ width: 0, height: 0 });
    };
    video.src = url;
  });
}

function matchOutputPreset(width: number, height: number): string {
  const match = AUTHORING_OUTPUT_PRESETS.find((entry) => entry.width === width && entry.height === height);
  return match?.id ?? AUTHORING_OUTPUT_CUSTOM_ID;
}

function evenDimension(value: number): number {
  const rounded = Math.max(2, Math.round(value));
  return rounded % 2 === 0 ? rounded : rounded - 1;
}

export function AuthoringScreen({
  locale = 'en',
  selectedId,
}: {
  locale?: string;
  selectedId?: string;
}) {
  const [exampleId, setExampleId] = useState(DEFAULT_AUTHORING_EXAMPLE_ID);
  const [inputFile, setInputFile] = useState<File | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [sourceLoadBusy, setSourceLoadBusy] = useState(false);
  const [sourceLoadError, setSourceLoadError] = useState<string | null>(null);
  const [cropRegion, setCropRegion] = useState<CropRegion | null>(null);
  const [extractUrl, setExtractUrl] = useState<string | null>(null);
  const [extractFilter, setExtractFilter] = useState('');
  const [extractProgress, setExtractProgress] = useState(0);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [extractBusy, setExtractBusy] = useState(false);

  const example = getAuthoringExampleById(exampleId) ?? DESTINATION_ATLAS_AUTHORING_EXAMPLES[0];
  const destination = example ? getDestinationById(example.destinationId) : undefined;

  const [yaw, setYaw] = useState(example?.defaultYaw ?? 25);
  const [pitch, setPitch] = useState(example?.defaultPitch ?? -8);
  const [horizontalFov, setHorizontalFov] = useState(example?.defaultHorizontalFov ?? 75);
  const [outputWidth, setOutputWidth] = useState(720);
  const [outputHeight, setOutputHeight] = useState(480);
  const [outputPresetId, setOutputPresetId] = useState('720x480');
  const [reverse, setReverse] = useState(false);
  const [sourceWidth, setSourceWidth] = useState<number | undefined>();
  const [sourceHeight, setSourceHeight] = useState<number | undefined>();
  const [cropX, setCropX] = useState(0);
  const [cropY, setCropY] = useState(0);
  const [cropWidth, setCropWidth] = useState(640);
  const [cropHeight, setCropHeight] = useState(360);
  const [recordRange, setRecordRange] = useState<AuthoringRecordRange | null>(null);

  const outputPreviewHostRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<AuthoringViewportHandle>(null);
  const userPickedFileRef = useRef(false);

  const sourceReady = Boolean(sourceUrl && sourceWidth && sourceHeight && !sourceLoadBusy);

  const isEquirectSource = useMemo(
    () => sourceReady && sourceWidth && sourceHeight && isEquirectSourceDimensions(sourceWidth, sourceHeight),
    [sourceReady, sourceWidth, sourceHeight],
  );
  const sourceModeLabel = isEquirectSource
    ? '360° equirectangular — camera framing controls'
    : 'Flat video — drag the crop rectangle on source';
  const isCustomOutput = outputPresetId === AUTHORING_OUTPUT_CUSTOM_ID;
  const sourceAspect =
    sourceWidth && sourceHeight && sourceHeight > 0 ? sourceWidth / sourceHeight : null;
  const equirectAspectWarning =
    isEquirectSource && sourceAspect !== null && Math.abs(sourceAspect - 2) > 0.05;

  useEffect(() => {
    if (!selectedId) {
      return;
    }
    const linkedExample = getAuthoringExampleForDestinationId(selectedId);
    if (linkedExample) {
      setExampleId(linkedExample.id);
    }
  }, [selectedId]);

  useEffect(() => {
    userPickedFileRef.current = false;
  }, [selectedId, exampleId]);

  useEffect(() => {
    if (!inputFile || (sourceWidth && sourceHeight)) {
      return;
    }
    void probeVideoFile(inputFile).then(({ width, height }) => {
      if (width > 0 && height > 0) {
        setSourceWidth(width);
        setSourceHeight(height);
      }
    });
  }, [inputFile, sourceWidth, sourceHeight]);

  useEffect(() => {
    if (!example) {
      return;
    }
    if (userPickedFileRef.current) {
      return;
    }
    setYaw(example.defaultYaw);
    setPitch(example.defaultPitch);
    setHorizontalFov(example.defaultHorizontalFov);
    const preset = getAuthoringOutputPreset('720x480');
    setOutputPresetId('720x480');
    setOutputWidth(preset?.width ?? 720);
    setOutputHeight(preset?.height ?? 480);
    setSourceWidth(undefined);
    setSourceHeight(undefined);
    setRecordRange(null);
    setCropRegion(null);
    setExtractFilter('');
    setExtractProgress(0);
    setExtractError(null);
    setExtractBusy(false);
    setInputFile(null);
    setSourceUrl(null);
    setSourceLoadBusy(false);
    setSourceLoadError(null);
    setExtractUrl((previous) => {
      if (previous) {
        URL.revokeObjectURL(previous);
      }
      return null;
    });
  }, [exampleId, example]);

  useEffect(() => {
    if (!inputFile) {
      return;
    }
    const url = URL.createObjectURL(inputFile);
    setSourceUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [inputFile]);

  useEffect(
    () => () => {
      if (extractUrl) {
        URL.revokeObjectURL(extractUrl);
      }
    },
    [extractUrl],
  );

  useEffect(() => {
    if (!sourceWidth || !sourceHeight || isEquirectSource || outputPresetId === AUTHORING_OUTPUT_CUSTOM_ID) {
      return;
    }
    const centered = centerCropForOutput(sourceWidth, sourceHeight, outputWidth, outputHeight);
    setCropX(centered.cropX);
    setCropY(centered.cropY);
    setCropWidth(centered.cropWidth);
    setCropHeight(centered.cropHeight);
  }, [sourceWidth, sourceHeight, outputWidth, outputHeight, outputPresetId, isEquirectSource]);

  useEffect(() => {
    if (isEquirectSource) {
      setCropRegion(
        virtualCameraToCropRegion({
          camera: { yaw, pitch, roll: 0, fov: horizontalFov },
          sourceWidth,
          sourceHeight,
          outputWidth,
          outputHeight,
          reverse,
        }),
      );
      const filter = virtualCameraToCropRegion({
        camera: { yaw, pitch, roll: 0, fov: horizontalFov },
        sourceWidth,
        sourceHeight,
        outputWidth,
        outputHeight,
        reverse,
      }).filter;
      setExtractFilter(typeof filter === 'string' ? filter : '');
      return;
    }
    if (!sourceWidth || !sourceHeight) {
      setCropRegion(null);
      setExtractFilter('');
      return;
    }
    const region = flatCropToCropRegion({
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      sourceWidth,
      sourceHeight,
      outputWidth,
      outputHeight,
      reverse,
    });
    setCropRegion(region);
    setExtractFilter(region.filter);
  }, [
    isEquirectSource,
    yaw,
    pitch,
    horizontalFov,
    cropX,
    cropY,
    cropWidth,
    cropHeight,
    outputWidth,
    outputHeight,
    sourceWidth,
    sourceHeight,
    reverse,
  ]);

  const exampleLabel = useMemo(() => {
    if (!example || !destination) {
      return example?.label ?? 'Authoring example';
    }
    return `${example.label} · ${localizedDestinationName(destination, locale)}`;
  }, [destination, example, locale]);

  const handleOutputPresetChange = (presetId: string) => {
    setOutputPresetId(presetId);
    if (presetId === AUTHORING_OUTPUT_CUSTOM_ID) {
      return;
    }
    const preset = getAuthoringOutputPreset(presetId);
    if (preset) {
      setOutputWidth(preset.width);
      setOutputHeight(preset.height);
    }
  };

  const handleCustomDimensionChange = (width: number, height: number) => {
    setOutputWidth(width);
    setOutputHeight(height);
    setOutputPresetId(matchOutputPreset(width, height));
  };

  const handleVideoFile = (detail: {
    file: File;
    metadata: Record<string, string | number | boolean | null | undefined>;
  }) => {
    userPickedFileRef.current = true;
    setSourceLoadBusy(false);
    setSourceLoadError(null);
    setRecordRange(null);
    setInputFile(detail.file);
    if (example) {
      setYaw(example.defaultYaw);
      setPitch(example.defaultPitch);
      setHorizontalFov(example.defaultHorizontalFov);
    }
    const width = Number(detail.metadata.sourceWidth);
    const height = Number(detail.metadata.sourceHeight);
    if (Number.isFinite(width) && width > 0 && Number.isFinite(height) && height > 0) {
      setSourceWidth(width);
      setSourceHeight(height);
    } else {
      setSourceWidth(undefined);
      setSourceHeight(undefined);
    }
    setExtractUrl((previous) => {
      if (previous) {
        URL.revokeObjectURL(previous);
      }
      return null;
    });
    setExtractProgress(0);
    setExtractError(null);
    setExtractBusy(false);
  };

  const handleFlatCropChange = (detail: {
    cropX: number;
    cropY: number;
    cropWidth: number;
    cropHeight: number;
  }) => {
    setCropX(detail.cropX);
    setCropY(detail.cropY);
    setCropWidth(detail.cropWidth);
    setCropHeight(detail.cropHeight);
    setOutputWidth(evenDimension(detail.cropWidth));
    setOutputHeight(evenDimension(detail.cropHeight));
    setOutputPresetId(AUTHORING_OUTPUT_CUSTOM_ID);
  };

  const updateFlatCrop = (partial: Partial<{ cropX: number; cropY: number; cropWidth: number; cropHeight: number }>) => {
    handleFlatCropChange({
      cropX: partial.cropX ?? cropX,
      cropY: partial.cropY ?? cropY,
      cropWidth: partial.cropWidth ?? cropWidth,
      cropHeight: partial.cropHeight ?? cropHeight,
    });
  };

  const onAuthoringFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
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
  };

  return (
    <section className="da-panel da-panel--authoring">
      <h2>Authoring</h2>

      <div className="da-authoring-workspace">
        <header className="da-authoring-workspace__headers">
          <h3 className="da-authoring-pane__title">Source</h3>
          <h3 className="da-authoring-pane__title">Output</h3>
        </header>

        <div className="da-authoring-workspace__videos">
          <div className="da-authoring-workspace__video-col da-authoring-workspace__video-col--source">
            {sourceUrl ? (
              <div className="da-authoring-source-toolbar">
                <label className="da-authoring-change-file">
                  <input
                    type="file"
                    className="da-authoring-choose-file__input"
                    accept="video/*"
                    onChange={onAuthoringFileChange}
                  />
                  Change video file
                </label>
              </div>
            ) : null}
            {sourceUrl && isEquirectSource ? (
              <EquirectSphereViewport
                ref={viewportRef}
                className="da-authoring-sphere-viewport"
                videoSrc={sourceUrl}
                flipInterior
                yaw={yaw}
                pitch={pitch}
                horizontalFov={horizontalFov}
                outputWidth={outputWidth}
                outputHeight={outputHeight}
                outputPreviewHostRef={outputPreviewHostRef}
                onCameraChange={({ yaw: nextYaw, pitch: nextPitch, horizontalFov: nextFov }) => {
                  setYaw(nextYaw);
                  setPitch(nextPitch);
                  setHorizontalFov(nextFov);
                }}
              />
            ) : sourceUrl && sourceWidth && sourceHeight ? (
              <FlatVideoViewport
                ref={viewportRef}
                className="da-authoring-flat-viewport"
                videoSrc={sourceUrl}
                sourceWidth={sourceWidth}
                sourceHeight={sourceHeight}
                cropX={cropX}
                cropY={cropY}
                cropWidth={cropWidth}
                cropHeight={cropHeight}
                outputWidth={outputWidth}
                outputHeight={outputHeight}
                outputPreviewHostRef={outputPreviewHostRef}
                onCropChange={handleFlatCropChange}
              />
            ) : sourceUrl && !sourceReady ? (
              <div
                className="da-authoring-sphere-viewport da-authoring-sphere-viewport--placeholder"
                aria-busy="true"
                aria-label="Reading source video"
              />
            ) : sourceLoadBusy ? (
              <div
                className="da-authoring-sphere-viewport da-authoring-sphere-viewport--placeholder"
                aria-busy="true"
                aria-label="Loading source video"
              />
            ) : (
              <div className="da-authoring-sphere-viewport da-authoring-sphere-viewport--placeholder">
                <label className="da-authoring-choose-file">
                  <input
                    type="file"
                    className="da-authoring-choose-file__input"
                    accept="video/*"
                    onChange={onAuthoringFileChange}
                  />
                  Choose video file
                </label>
              </div>
            )}
          </div>

          <div className="da-authoring-workspace__video-col">
            {sourceUrl ? (
              <div ref={outputPreviewHostRef} className="da-authoring-program-preview-host" />
            ) : (
              <div className="da-authoring-program-preview-host da-authoring-program-preview-host--placeholder">
                <p className="da-authoring-output-placeholder">Choose source file to create output</p>
              </div>
            )}
          </div>
        </div>

        <div className="da-authoring-workspace__footers">
          <div className="da-authoring-pane da-authoring-pane--source" aria-label="Authoring source controls">
            {!sourceUrl && !sourceLoadBusy ? (
              <p className="da-note da-authoring-controls-placeholder">
                Choose a source video to show playback and framing controls.
              </p>
            ) : !sourceReady ? (
              <p className="da-note da-authoring-controls-placeholder" aria-busy="true">
                Loading source video…
              </p>
            ) : (
              <>
                <p className="da-note da-authoring-source-mode">{sourceModeLabel}</p>
                <AuthoringPlaybackBar
                  viewportRef={viewportRef}
                  disabled={false}
                  recordRange={recordRange}
                  onRecordRangeChange={setRecordRange}
                  hint={
                    isEquirectSource
                      ? 'Drag on the sphere or use Camera framing sliders · FOV above 130° enters little-planet'
                      : 'Drag the crop rectangle · corner handles set a custom output size · presets snap to standard dimensions'
                  }
                  onResetView={() => {
                    if (!example) {
                      return;
                    }
                    if (isEquirectSource) {
                      setYaw(example.defaultYaw);
                      setPitch(example.defaultPitch);
                      setHorizontalFov(example.defaultHorizontalFov);
                      return;
                    }
                    if (sourceWidth && sourceHeight) {
                      const centered = centerCropForOutput(sourceWidth, sourceHeight, outputWidth, outputHeight);
                      setCropX(centered.cropX);
                      setCropY(centered.cropY);
                      setCropWidth(centered.cropWidth);
                      setCropHeight(centered.cropHeight);
                    }
                  }}
                />
                {isEquirectSource ? (
                  <AuthoringCameraControls
                    yaw={yaw}
                    pitch={pitch}
                    horizontalFov={horizontalFov}
                    disabled={false}
                    onYawChange={setYaw}
                    onPitchChange={setPitch}
                    onHorizontalFovChange={setHorizontalFov}
                    onReset={() => {
                      if (!example) {
                        return;
                      }
                      setYaw(example.defaultYaw);
                      setPitch(example.defaultPitch);
                      setHorizontalFov(example.defaultHorizontalFov);
                    }}
                    onLittlePlanetPreset={() => {
                      setHorizontalFov(LITTLE_PLANET_HFOV);
                      setPitch(LITTLE_PLANET_PITCH);
                    }}
                  />
                ) : (
                  <div className="da-authoring-crop-controls" aria-label="Crop region controls">
                    <h4 className="da-authoring-crop-controls__title">Crop region</h4>
                    <p className="da-note da-authoring-crop-controls__hint">
                      Drag corners for any output size (updates export dimensions live). Pick a preset to snap to
                      320×240, 640×360, or 720×480.
                    </p>
                    <div className="da-authoring-crop-controls__grid">
                      <NumberInput label="Crop X" value={cropX} step={1} min={0} max={sourceWidth ?? 99999} onChange={(value) => updateFlatCrop({ cropX: value })} />
                      <NumberInput label="Crop Y" value={cropY} step={1} min={0} max={sourceHeight ?? 99999} onChange={(value) => updateFlatCrop({ cropY: value })} />
                      <NumberInput label="Crop width" value={cropWidth} step={2} min={2} max={sourceWidth ?? 99999} onChange={(value) => updateFlatCrop({ cropWidth: value })} />
                      <NumberInput
                        label="Crop height"
                        value={cropHeight}
                        step={2}
                        min={2}
                        max={sourceHeight ?? 99999}
                        onChange={(value) => updateFlatCrop({ cropHeight: value })}
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="da-authoring-pane da-authoring-pane--output" aria-label="Authoring output controls">
            {!sourceReady ? (
              <p className="da-note da-authoring-controls-placeholder">
                Output and export settings appear after you load a source video.
              </p>
            ) : (
              <>
            <p className="da-note">Same view as source — live mirror scaled to export dimensions.</p>

            {sourceWidth && sourceHeight ? (
              <p className={`da-note${equirectAspectWarning ? ' da-note--warn' : ''}`}>
                Source dimensions: {sourceWidth}×{sourceHeight} ({sourceAspect?.toFixed(2)}:1)
                {isEquirectSource ? ' — interior view flips texture for inside-out viewing' : ''}
                {equirectAspectWarning ? ' · aspect ratio differs from 2:1; extract may look wrong' : ''}
              </p>
            ) : null}

            <div className="da-media-extract-controls">
              <div className="da-media-extract-size-row">
                <SelectInput
                  label="Export rectangle size"
                  className="da-media-extract-size-row__preset"
                  value={outputPresetId}
                  options={[
                    ...AUTHORING_OUTPUT_PRESETS.map((entry) => ({ value: entry.id, label: entry.label })),
                    { value: AUTHORING_OUTPUT_CUSTOM_ID, label: 'Custom' },
                  ]}
                  onChange={handleOutputPresetChange}
                />
                <NumberInput
                  label="W"
                  className="da-media-extract-size-row__dim"
                  value={outputWidth}
                  step={2}
                  min={160}
                  max={3840}
                  disabled={!isCustomOutput}
                  onChange={(value) => isCustomOutput && handleCustomDimensionChange(value, outputHeight)}
                />
                <span className="da-media-extract-size-row__sep" aria-hidden="true">
                  ×
                </span>
                <NumberInput
                  label="H"
                  className="da-media-extract-size-row__dim"
                  value={outputHeight}
                  step={2}
                  min={120}
                  max={2160}
                  disabled={!isCustomOutput}
                  onChange={(value) => isCustomOutput && handleCustomDimensionChange(outputWidth, value)}
                />
                <button
                  type="button"
                  className={`da-media-extract-size-row__reverse${reverse ? ' is-active' : ''}`}
                  aria-label="Reverse playback"
                  aria-pressed={reverse}
                  onClick={() => setReverse((previous) => !previous)}
                >
                  <PlaybackReverseIcon />
                </button>
              </div>
              {isEquirectSource ? (
                <div className="da-media-extract-controls__camera">
                  <NumberInput
                    label="Yaw (°)"
                    value={yaw}
                    step={0.5}
                    min={-180}
                    max={180}
                    onChange={setYaw}
                  />
                  <NumberInput
                    label="Pitch (°)"
                    value={pitch}
                    step={0.5}
                    min={-85}
                    max={85}
                    onChange={setPitch}
                  />
                  <NumberInput
                    label="Horizontal FOV (°)"
                    value={horizontalFov}
                    step={1}
                    min={30}
                    max={360}
                    onChange={setHorizontalFov}
                  />
                </div>
              ) : null}
            </div>

            {extractFilter ? (
              <p className="da-note da-note--filter">
                Filter:{' '}
                <code className="da-value-ellipsis" tabIndex={0}>
                  {extractFilter}
                </code>
              </p>
            ) : null}

            {inputFile ? (
              <>
                {!recordRange ? (
                  <p className="da-note">Record a segment on the playback bar, then extract that subsection.</p>
                ) : null}
                <WasmMedia
                  label="ffmpeg.wasm extract"
                  operation="equirect-extract"
                  extractionMode={isEquirectSource ? 'rectilinear' : 'flat-crop'}
                  outputFormat="mp4"
                  showProgress
                  yaw={yaw}
                  pitch={pitch}
                  horizontalFov={horizontalFov}
                  outputWidth={outputWidth}
                  outputHeight={outputHeight}
                  reverse={reverse}
                  inputFile={inputFile}
                  cropRegion={
                    cropRegion as unknown as Record<string, string | number | boolean> | null
                  }
                  recordRange={recordRange}
                onProgress={({ progress }) => {
                  setExtractBusy(true);
                  setExtractProgress(progress);
                }}
                onExtractComplete={({ blob, metadata }) => {
                  setExtractBusy(false);
                  setExtractProgress(100);
                  setExtractError(null);
                  setExtractUrl((previous) => {
                    if (previous) {
                      URL.revokeObjectURL(previous);
                    }
                    return URL.createObjectURL(blob);
                  });
                  const filter = metadata.filter;
                  setExtractFilter(typeof filter === 'string' ? filter : '');
                }}
                onExtractError={({ message }) => {
                  setExtractBusy(false);
                  setExtractError(message);
                }}
              />
              </>
            ) : (
              <p className="da-note">Attach a video file to enable ffmpeg.wasm extract.</p>
            )}

            {extractBusy ? (
              <p className="da-note" aria-live="polite">
                Extracting… {extractProgress > 0 ? `${extractProgress}%` : 'loading ffmpeg.wasm (~31 MB first run)'}
              </p>
            ) : null}
            {extractError ? (
              <p className="da-note da-note--warn" role="alert">
                Extract failed: {extractError}
              </p>
            ) : null}
            {extractUrl ? (
              <>
                <p className="da-note">Extracted MP4 (ffmpeg.wasm):</p>
                <video className="da-authoring-pane__video" src={extractUrl} controls playsInline autoPlay muted />
                <a
                  className="da-media-extract-output__download"
                  href={extractUrl}
                  download={authoringExtractDownloadName(inputFile)}
                >
                  Download extracted video
                </a>
              </>
            ) : null}
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
