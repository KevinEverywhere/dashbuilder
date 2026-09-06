<script module lang="ts">
  export const AUTHORING_SOURCE = `<AuthoringScreen {locale} {selectedId}>
  <SelectInput label="360° destination" />
  <EquirectSphereViewport videoSrc={sourceUrl} yaw={…} pitch={…} />
  <FlatVideoViewport videoSrc={sourceUrl} cropX={…} />
  <WasmMedia operation="equirect-extract" inputFile={inputFile} />
</AuthoringScreen>`;
</script>

<script lang="ts">
  import { EquirectSphereViewport } from '@rosettadash/svelte/visual/media/equirect-sphere-viewport';
  import { FlatVideoViewport } from '@rosettadash/svelte/visual/media/flat-video-viewport';
  import WasmMedia from '@rosettadash/svelte/visual/wasm/media';
  import SelectInput from '@rosettadash/svelte/visual/input/select';
  import AuthoringCameraControls from '../components/AuthoringCameraControls.svelte';
  import AuthoringPlaybackBar from '../components/AuthoringPlaybackBar.svelte';
  import BoundSelectInput from '../components/BoundSelectInput.svelte';
  import { createAuthoringScreen } from '../lib/authoring-screen.svelte';
  import {
    AUTHORING_360_DISPLAY_CATALOG,
    authoring360CatalogJson,
    MOCK_DESTINATIONS,
    authoring360Attribution,
    attributionNoticeJson,
    FFMPEG_WASM_ATTRIBUTION,
  } from '@destination-atlas';
  import { defaultAuthoringRecordRange, type AuthoringRecordRange } from '@rosettadash/core';
  import { localizedDestinationName } from '../lib/atlas-utils';
  import type { AuthoringViewportHandle } from '../lib/authoring-viewport';

  let {
    locale,
    selectedId,
    onSelectedIdChange,
  }: {
    locale: string;
    selectedId: string;
    onSelectedIdChange?: (id: string) => void;
  } = $props();

  const destinationOptions = $derived(
    MOCK_DESTINATIONS.map((dest) => ({
      value: dest.id,
      label: `${localizedDestinationName(dest, locale)} · 360°`,
    })),
  );

  const screen = createAuthoringScreen(() => locale, () => selectedId);
  const authoring360CatalogJsonText = authoring360CatalogJson();
  const authoring360ShippedCount = AUTHORING_360_DISPLAY_CATALOG.filter(
    (entry) => entry.status === 'shipped',
  ).length;
  const authoring360Notice = $derived.by(() => {
    const notice = authoring360Attribution(selectedId);
    return notice ? attributionNoticeJson(notice) : '';
  });
  const ffmpegNotice = attributionNoticeJson(FFMPEG_WASM_ATTRIBUTION);

  let sphereViewport: AuthoringViewportHandle | undefined = $state();
  let flatViewport: AuthoringViewportHandle | undefined = $state();
  let outputPreviewHost: HTMLDivElement | undefined = $state();

  const viewport = $derived<AuthoringViewportHandle | null>(
    sphereViewport ?? flatViewport ?? null,
  );

  $effect(() => {
    if (!screen.sourceReady || screen.recordRange || !viewport) {
      return;
    }
    const applyDefault = () => {
      if (screen.recordRange || !viewport) {
        return;
      }
      const range = defaultAuthoringRecordRange(viewport.getDuration());
      if (range) {
        screen.recordRange = range;
      }
    };
    applyDefault();
    const retryA = window.setTimeout(applyDefault, 300);
    const retryB = window.setTimeout(applyDefault, 1200);
    return () => {
      window.clearTimeout(retryA);
      window.clearTimeout(retryB);
    };
  });

  function onRecordRangeChange(range: AuthoringRecordRange | null) {
    if (range) {
      screen.recordRange = range;
      return;
    }
    screen.recordRange = viewport
      ? defaultAuthoringRecordRange(viewport.getDuration())
      : null;
  }
</script>

<section class="da-panel da-panel--authoring">
  <h2>Authoring</h2>

  <BoundSelectInput
    fieldLabel="360° destination"
    options={destinationOptions}
    value={selectedId}
    onValueChange={(id) => onSelectedIdChange?.(id)}
  />
  <p class="da-note da-authoring-dest-hint">
    Syncs with the header selection and autoloads the library clip when available.
    You can still click the source viewport to upload your own video.
  </p>
  {#if authoring360Notice}
    <rd-attribution-notice notice={authoring360Notice}></rd-attribution-notice>
  {/if}

  <section class="da-authoring-catalog" aria-label="360° library catalog">
    <details open>
      <summary>
        360° library — {authoring360ShippedCount} shipped clips (JSON)
      </summary>
      <p class="da-note da-authoring-catalog__hint">
        Autoload uses <code>clipPath</code> for the selected destination. Run
        <code>npm run authoring:fetch-360</code> to generate local MP4s.
      </p>
      <pre class="da-authoring-catalog__json">{authoring360CatalogJsonText}</pre>
    </details>
  </section>

  <div class="da-authoring-workspace">
    <header class="da-authoring-workspace__headers">
      <h3 class="da-authoring-pane__title">Source</h3>
      <h3 class="da-authoring-pane__title">Output</h3>
    </header>

    <div class="da-authoring-workspace__videos">
      <div class="da-authoring-workspace__video-col da-authoring-workspace__video-col--source">
        {#if screen.sourceUrl}
          <div class="da-authoring-source-toolbar">
            <label class="da-authoring-change-file">
              <input
                type="file"
                class="da-authoring-choose-file__input"
                accept="video/*"
                onchange={screen.onAuthoringFileSelected}
              />
              Change video file
            </label>
          </div>
        {/if}
        <div class="da-authoring-viewport-stage">
          {#if screen.sourceUrl}
            {#if screen.isEquirectSource}
              <EquirectSphereViewport
                bind:this={sphereViewport}
                className="da-authoring-sphere-viewport"
                videoSrc={screen.sourceUrl}
                flipInterior={true}
                yaw={screen.yaw}
                pitch={screen.pitch}
                horizontalFov={screen.horizontalFov}
                outputWidth={screen.outputWidth}
                outputHeight={screen.outputHeight}
                outputPreviewHost={outputPreviewHost ?? null}
                resetExportReferenceToken={screen.exportReferenceToken}
                outputSizeCommitToken={screen.outputSizeCommitToken}
                onCameraChange={screen.onCameraChange}
                onOutputSizeChange={screen.onOutputSizeChange}
              />
            {:else if screen.sourceWidth && screen.sourceHeight}
              <FlatVideoViewport
                bind:this={flatViewport}
                className="da-authoring-flat-viewport"
                videoSrc={screen.sourceUrl}
                sourceWidth={screen.sourceWidth}
                sourceHeight={screen.sourceHeight}
                cropX={screen.cropX}
                cropY={screen.cropY}
                cropWidth={screen.cropWidth}
                cropHeight={screen.cropHeight}
                outputWidth={screen.outputWidth}
                outputHeight={screen.outputHeight}
                lockAspectRatio={true}
                outputPreviewHost={outputPreviewHost ?? null}
                onCropChange={screen.onCropChange}
              />
            {:else}
              <div
                class="da-authoring-sphere-viewport da-authoring-sphere-viewport--placeholder"
                aria-busy="true"
                aria-label="Reading source video"
              ></div>
            {/if}
          {:else if screen.sourceLoadBusy}
            <div
              class="da-authoring-sphere-viewport da-authoring-sphere-viewport--placeholder"
              aria-busy="true"
              aria-label="Loading source video"
            ></div>
          {:else if screen.showMissingContent}
            <div class="da-authoring-sphere-viewport da-authoring-sphere-viewport--placeholder">
              <p class="da-authoring-missing-content">{screen.missingContentMessage}</p>
            </div>
          {:else}
            <div class="da-authoring-sphere-viewport da-authoring-sphere-viewport--placeholder">
              <label class="da-authoring-choose-file">
                <input
                  type="file"
                  class="da-authoring-choose-file__input"
                  accept="video/*"
                  onchange={screen.onAuthoringFileSelected}
                />
                Choose video file
              </label>
            </div>
          {/if}
        </div>
      </div>

      <div class="da-authoring-workspace__video-col">
        {#if screen.sourceUrl}
          <div bind:this={outputPreviewHost} class="da-authoring-program-preview-host"></div>
        {:else if screen.showMissingContent}
          <div class="da-authoring-program-preview-host da-authoring-program-preview-host--placeholder">
            <p class="da-authoring-missing-content">{screen.missingContentMessage}</p>
          </div>
        {:else}
          <div class="da-authoring-program-preview-host da-authoring-program-preview-host--placeholder">
            <p class="da-authoring-output-placeholder">Choose source file to create output</p>
          </div>
        {/if}
      </div>
    </div>

    <div class="da-authoring-workspace__footers">
      <div class="da-authoring-pane da-authoring-pane--source" aria-label="Authoring source controls">
        {#if !screen.sourceUrl && !screen.sourceLoadBusy && screen.showMissingContent}
          <p class="da-note da-authoring-controls-placeholder da-authoring-missing-content">
            {screen.missingContentMessage}
          </p>
        {:else if !screen.sourceUrl && !screen.sourceLoadBusy}
          <p class="da-note da-authoring-controls-placeholder">
            Choose a source video to show playback and framing controls.
          </p>
        {:else if !screen.sourceReady}
          <p class="da-note da-authoring-controls-placeholder" aria-busy="true">Loading source video…</p>
        {:else}
          <p class="da-note da-authoring-source-mode">{screen.sourceModeLabel}</p>
          <AuthoringPlaybackBar
            {viewport}
            disabled={false}
            hint={screen.playbackHint}
            recordRange={screen.recordRange}
            onRecordRangeChange={onRecordRangeChange}
            onPreviewRecordingChange={(blob) => {
              screen.previewRecording = blob;
            }}
            onResetView={screen.resetView}
            onPlaybackStop={screen.resetExportRectangle}
          />
          {#if screen.isEquirectSource}
            <AuthoringCameraControls
              yaw={screen.yaw}
              pitch={screen.pitch}
              horizontalFov={screen.horizontalFov}
              disabled={false}
              onYawChange={(value) => {
                screen.yaw = screen.wrapSigned(value);
              }}
              onPitchChange={(value) => {
                screen.pitch = value;
              }}
              onHorizontalFovChange={(value) => {
                screen.horizontalFov = value;
              }}
              onReset={screen.resetView}
              onLittlePlanetPreset={screen.applyLittlePlanetPreset}
            />
          {:else}
            <div class="da-authoring-crop-controls" aria-label="Crop region controls">
              <h4 class="da-authoring-crop-controls__title">Crop region</h4>
              <p class="da-note da-authoring-crop-controls__hint">
                Drag the square crop on source — corners stay locked to the
                export aspect (default 480×480). Presets include 1:1, 4:3,
                16:9, and 3:2.
              </p>
              <div class="da-authoring-crop-controls__grid">
                <section class="rd-input-number">
                  <span class="rd-field__label">Crop X</span>
                  <input
                    type="number"
                    class="rd-input"
                    step="1"
                    min="0"
                    value={screen.cropX}
                    onchange={(event) =>
                      screen.updateFlatCrop({
                        cropX: +(event.currentTarget as HTMLInputElement).value,
                      })}
                  />
                </section>
                <section class="rd-input-number">
                  <span class="rd-field__label">Crop Y</span>
                  <input
                    type="number"
                    class="rd-input"
                    step="1"
                    min="0"
                    value={screen.cropY}
                    onchange={(event) =>
                      screen.updateFlatCrop({
                        cropY: +(event.currentTarget as HTMLInputElement).value,
                      })}
                  />
                </section>
                <section class="rd-input-number">
                  <span class="rd-field__label">Crop width</span>
                  <input
                    type="number"
                    class="rd-input"
                    step="2"
                    min="2"
                    value={screen.cropWidth}
                    onchange={(event) =>
                      screen.updateFlatCrop({
                        cropWidth: +(event.currentTarget as HTMLInputElement).value,
                      })}
                  />
                </section>
                <section class="rd-input-number">
                  <span class="rd-field__label">Crop height</span>
                  <input
                    type="number"
                    class="rd-input"
                    step="2"
                    min="2"
                    value={screen.cropHeight}
                    onchange={(event) =>
                      screen.updateFlatCrop({
                        cropHeight: +(event.currentTarget as HTMLInputElement).value,
                      })}
                  />
                </section>
              </div>
            </div>
          {/if}
        {/if}
      </div>

      <div class="da-authoring-pane da-authoring-pane--output" aria-label="Authoring output controls">
        {#if !screen.sourceReady}
          <p class="da-note da-authoring-controls-placeholder">
            Output and export settings appear after you load a source video.
          </p>
        {:else}
          <p class="da-note">Same view as source — live mirror scaled to export dimensions.</p>

          {#if screen.sourceWidth && screen.sourceHeight}
            <p class="da-note" class:da-note--warn={screen.equirectAspectWarning}>
              Source dimensions: {screen.sourceWidth}×{screen.sourceHeight} ({screen.sourceAspect?.toFixed(
                2,
              )}:1)
              {#if screen.isEquirectSource}
                — interior view flips texture for inside-out viewing
              {/if}
              {#if screen.equirectAspectWarning}
                · aspect ratio differs from 2:1; extract may look wrong
              {/if}
            </p>
          {/if}

          <div class="da-media-extract-controls">
            <div class="da-media-extract-size-row">
              <div class="da-media-extract-size-row__preset">
                <BoundSelectInput
                  fieldLabel="Export rectangle size"
                  options={screen.outputPresetOptions}
                  value={screen.outputPresetId}
                  onValueChange={screen.handleOutputPresetChange}
                />
              </div>
              <section class="rd-input-number da-media-extract-size-row__dim">
                <span class="rd-field__label">W</span>
                <input
                  type="number"
                  class="rd-input"
                  step="2"
                  min="160"
                  max="3840"
                  value={screen.outputWidth}
                  disabled={!screen.isCustomOutput}
                  onchange={(event) =>
                    screen.handleCustomDimensionChange(
                      +(event.currentTarget as HTMLInputElement).value,
                      screen.outputHeight,
                    )}
                />
              </section>
              <span class="da-media-extract-size-row__sep" aria-hidden="true">×</span>
              <section class="rd-input-number da-media-extract-size-row__dim">
                <span class="rd-field__label">H</span>
                <input
                  type="number"
                  class="rd-input"
                  step="2"
                  min="120"
                  max="2160"
                  value={screen.outputHeight}
                  disabled={!screen.isCustomOutput}
                  onchange={(event) =>
                    screen.handleCustomDimensionChange(
                      screen.outputWidth,
                      +(event.currentTarget as HTMLInputElement).value,
                    )}
                />
              </section>
              <button
                type="button"
                class="da-media-extract-size-row__reverse"
                class:is-active={screen.reverse}
                aria-label="Reverse playback"
                aria-pressed={screen.reverse}
                onclick={() => {
                  screen.reverse = !screen.reverse;
                }}
              >
                <svg
                  class="da-authoring-playback__icon da-authoring-playback__icon--reverse"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    d="M7 7v10M7 17l-4-4 4-4M17 7v10M17 7l4 4-4 4"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </button>
            </div>
            {#if screen.isEquirectSource}
              <div class="da-media-extract-controls__camera">
                <section class="rd-input-number">
                  <span class="rd-field__label">Yaw (°)</span>
                  <input
                    type="number"
                    class="rd-input"
                    step="0.5"
                    min="-180"
                    max="180"
                    value={screen.formatDegree(screen.yaw)}
                    onchange={(event) => {
                      screen.yaw = screen.wrapSigned(+(event.currentTarget as HTMLInputElement).value);
                    }}
                  />
                </section>
                <section class="rd-input-number">
                  <span class="rd-field__label">Pitch (°)</span>
                  <input
                    type="number"
                    class="rd-input"
                    step="0.5"
                    min="-85"
                    max="85"
                    value={screen.formatDegree(screen.pitch)}
                    onchange={(event) => {
                      screen.pitch = +(event.currentTarget as HTMLInputElement).value;
                    }}
                  />
                </section>
                <section class="rd-input-number">
                  <span class="rd-field__label">Horizontal FOV (°)</span>
                  <input
                    type="number"
                    class="rd-input"
                    step="1"
                    min="30"
                    max="360"
                    value={screen.horizontalFov}
                    onchange={(event) => {
                      screen.horizontalFov = +(event.currentTarget as HTMLInputElement).value;
                    }}
                  />
                </section>
              </div>
            {/if}
          </div>

          {#if screen.extractFilter}
            <p class="da-note" class:da-note--filter={!screen.extractFilter.startsWith('Extract ')}>
              {#if screen.extractFilter.startsWith('Extract ')}
                {screen.extractFilter}
              {:else}
                Filter:
                <code class="da-value-ellipsis" tabindex="0">{screen.extractFilter}</code>
              {/if}
            </p>
          {/if}

          {#if screen.inputFile}
            {#if !screen.recordRange}
              <p class="da-note">
                Waiting for source duration… extract will enable once the clip is ready.
              </p>
            {:else}
              <p class="da-note">
                Extract uses {screen.recordRange.startSec.toFixed(1)}s–{screen.recordRange.endSec.toFixed(1)}s.
                Record on the playback bar to limit that range.
              </p>
            {/if}
            <SelectInput
              label="Extract format"
              value={screen.extractFormat}
              options={[...screen.extractFormatOptions]}
              onChange={(value) => {
                screen.extractFormat = value === 'webm' ? 'webm' : 'mp4';
              }}
            />
            <rd-attribution-notice notice={ffmpegNotice}></rd-attribution-notice>
            {#key `${screen.inputFile.name}-${screen.recordRange?.startSec ?? 'na'}-${screen.recordRange?.endSec ?? 'na'}`}
            <WasmMedia
              label="ffmpeg.wasm extract"
              operation="equirect-extract"
              extractionMode={screen.isEquirectSource ? 'rectilinear' : 'flat-crop'}
              outputFormat={screen.extractFormat}
              showProgress={true}
              yaw={screen.yaw}
              pitch={screen.pitch}
              horizontalFov={screen.horizontalFov}
              outputWidth={screen.outputWidth}
              outputHeight={screen.outputHeight}
              reverse={screen.reverse}
              inputFile={screen.inputFile}
              cropRegion={screen.cropRegion}
              recordRange={screen.recordRange}
              previewRecording={screen.previewRecording}
              onProgress={screen.onExtractProgress}
              onExtractComplete={screen.onExtractComplete}
              onExtractError={screen.onExtractError}
            />
            {/key}
          {:else}
            <p class="da-note">Attach a video file to enable ffmpeg.wasm extract.</p>
          {/if}

          {#if screen.extractBusy}
            <p class="da-note" aria-live="polite">
              Extracting…
              {#if screen.extractProgress > 0}
                {screen.extractProgress}%
              {:else}
                loading ffmpeg.wasm (~31 MB first run)
              {/if}
            </p>
          {/if}
          {#if screen.extractError}
            <p class="da-note da-note--warn" role="alert">Extract failed: {screen.extractError}</p>
          {/if}
          {#if screen.extractUrl}
            <p class="da-note">
              {#if screen.extractResultKind === 'preview-recording'}
                Extracted preview recording ({screen.extractResultFormat === 'webm' ? 'WebM' : 'MP4'}):
              {:else}
                Extracted MP4 (ffmpeg.wasm):
              {/if}
            </p>
            <video class="da-authoring-pane__video" src={screen.extractUrl} controls playsinline autoplay muted></video>
            <a class="da-media-extract-output__download" href={screen.extractUrl} download={screen.downloadName}>
              Download extracted video
            </a>
          {/if}
        {/if}
      </div>
    </div>
  </div>
</section>
