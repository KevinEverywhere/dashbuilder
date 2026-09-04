import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
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
  type AuthoringRecordRange,
  virtualCameraToCropRegion,
  wrapSignedDegrees,
} from '@rosettadash/core';
import { EquirectSphereViewport } from '@rosettadash/angular/visual/media/equirect-sphere-viewport';
import { FlatVideoViewport } from '@rosettadash/angular/visual/media/flat-video-viewport';
import { type VideoFileDetail } from '@rosettadash/angular/visual/media/video-source';
import { WasmMedia } from '@rosettadash/angular/visual/wasm/media';
import {
  DEFAULT_AUTHORING_EXAMPLE_ID,
  DESTINATION_ATLAS_AUTHORING_EXAMPLES,
  destinationMissingContentMessage,
  fetchAuthoring360File,
  getAuthoring360Source,
  getAuthoringExampleById,
  getAuthoringExampleForDestinationId,
  getDestinationById,
  MOCK_DESTINATIONS,
  AUTHORING_360_DISPLAY_CATALOG,
  authoring360CatalogJson,
  authoring360Attribution,
  attributionNoticeJson,
  FFMPEG_WASM_ATTRIBUTION,
} from '@destination-atlas';
import { localizedDestinationName } from '../lib/atlas-utils';
import { AtlasStateService } from '../services/atlas-state.service';
import { AuthoringPlaybackBarComponent } from '../components/authoring-playback-bar.component';
import { AuthoringCameraControlsComponent } from '../components/authoring-camera-controls.component';
import { DaBoundSelectInputComponent } from '../components/proof-form-fields.component';

type CropRegion = Record<string, string | number | boolean | null | undefined>;

function matchOutputPreset(width: number, height: number): string {
  const match = AUTHORING_OUTPUT_PRESETS.find(
    (entry) => entry.width === width && entry.height === height,
  );
  return match?.id ?? AUTHORING_OUTPUT_CUSTOM_ID;
}

function evenDimension(value: number): number {
  const rounded = Math.max(2, Math.round(value));
  return rounded % 2 === 0 ? rounded : rounded - 1;
}

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

@Component({
  selector: 'da-authoring-screen',
  standalone: true,
  imports: [
    EquirectSphereViewport,
    FlatVideoViewport,
    WasmMedia,
    AuthoringPlaybackBarComponent,
    AuthoringCameraControlsComponent,
    DaBoundSelectInputComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="da-panel da-panel--authoring">
      <h2>Authoring</h2>

      <da-bound-select-input
        [fieldLabel]="'360° destination'"
        [options]="destinationOptions()"
        [value]="atlas.selectedId()"
        (valueChange)="onDestinationChange($event)"
      />
      <p class="da-note da-authoring-dest-hint">
        Syncs with the header selection and autoloads the library clip when available.
        You can still click the source viewport to upload your own video.
      </p>
      @if (authoring360Notice()) {
        <rd-attribution-notice [attr.notice]="authoring360Notice()"></rd-attribution-notice>
      }

      <section class="da-authoring-catalog" aria-label="360° library catalog">
        <details open>
          <summary>
            360° library — {{ authoring360ShippedCount }} shipped clips (JSON)
          </summary>
          <p class="da-note da-authoring-catalog__hint">
            Autoload uses <code>clipPath</code> for the selected destination.
            Run <code>npm run authoring:fetch-360</code> to generate local MP4s.
          </p>
          <pre class="da-authoring-catalog__json">{{ authoring360CatalogJsonText }}</pre>
        </details>
      </section>

      <div class="da-authoring-workspace">
        <header class="da-authoring-workspace__headers">
          <h3 class="da-authoring-pane__title">Source</h3>
          <h3 class="da-authoring-pane__title">Output</h3>
        </header>

        <div class="da-authoring-workspace__videos">
          <div class="da-authoring-workspace__video-col da-authoring-workspace__video-col--source">
            @if (sourceUrl()) {
              <div class="da-authoring-source-toolbar">
                <label class="da-authoring-change-file">
                  <input
                    type="file"
                    class="da-authoring-choose-file__input"
                    accept="video/*"
                    (change)="onAuthoringFileSelected($event)"
                  />
                  Change video file
                </label>
              </div>
            }
            <div class="da-authoring-viewport-stage">
            @if (sourceUrl()) {
              @if (isEquirectSource()) {
                <rd-equirect-sphere-viewport
                  #sphereViewport
                  class="da-authoring-sphere-viewport"
                  [videoSrc]="sourceUrl()"
                  [flipInterior]="true"
                  [yaw]="yaw()"
                  [pitch]="pitch()"
                  [horizontalFov]="horizontalFov()"
                  [outputWidth]="outputWidth()"
                  [outputHeight]="outputHeight()"
                  [outputPreviewElement]="outputPreviewElement()"
                  [resetExportReferenceToken]="exportReferenceToken()"
                  [outputSizeCommitToken]="outputSizeCommitToken()"
                  (cameraChange)="onCameraChange($event)"
                  (outputSizeChange)="onOutputSizeChange($event)"
                />
              } @else if (sourceWidth() && sourceHeight()) {
                <rd-flat-video-viewport
                  #flatViewport
                  class="da-authoring-flat-viewport"
                  [videoSrc]="sourceUrl()"
                  [sourceWidth]="sourceWidth()!"
                  [sourceHeight]="sourceHeight()!"
                  [cropX]="cropX()"
                  [cropY]="cropY()"
                  [cropWidth]="cropWidth()"
                  [cropHeight]="cropHeight()"
                  [outputWidth]="outputWidth()"
                  [outputHeight]="outputHeight()"
                  [outputPreviewElement]="outputPreviewElement()"
                  (cropChange)="onCropChange($event)"
                />
              } @else {
                <div
                  class="da-authoring-sphere-viewport da-authoring-sphere-viewport--placeholder"
                  aria-busy="true"
                  aria-label="Reading source video"
                ></div>
              }
            } @else if (sourceLoadBusy()) {
              <div
                class="da-authoring-sphere-viewport da-authoring-sphere-viewport--placeholder"
                aria-busy="true"
                aria-label="Loading source video"
              ></div>
            } @else if (showMissingContent()) {
              <div class="da-authoring-sphere-viewport da-authoring-sphere-viewport--placeholder">
                <p class="da-authoring-missing-content">{{ missingContentMessage() }}</p>
              </div>
            } @else {
              <div class="da-authoring-sphere-viewport da-authoring-sphere-viewport--placeholder">
                <label class="da-authoring-choose-file">
                  <input
                    type="file"
                    class="da-authoring-choose-file__input"
                    accept="video/*"
                    (change)="onAuthoringFileSelected($event)"
                  />
                  Choose video file
                </label>
              </div>
            }
            </div>
          </div>

          <div class="da-authoring-workspace__video-col">
            @if (sourceUrl()) {
              <div #outputPreviewHost class="da-authoring-program-preview-host"></div>
            } @else if (showMissingContent()) {
              <div class="da-authoring-program-preview-host da-authoring-program-preview-host--placeholder">
                <p class="da-authoring-missing-content">{{ missingContentMessage() }}</p>
              </div>
            } @else {
              <div class="da-authoring-program-preview-host da-authoring-program-preview-host--placeholder">
                <p class="da-authoring-output-placeholder">Choose source file to create output</p>
              </div>
            }
          </div>
        </div>

        <div class="da-authoring-workspace__footers">
          <div class="da-authoring-pane da-authoring-pane--source" aria-label="Authoring source controls">
            @if (!sourceUrl() && !sourceLoadBusy() && showMissingContent()) {
              <p class="da-note da-authoring-controls-placeholder da-authoring-missing-content">
                {{ missingContentMessage() }}
              </p>
            } @else if (!sourceUrl() && !sourceLoadBusy()) {
              <p class="da-note da-authoring-controls-placeholder">
                Choose a source video to show playback and framing controls.
              </p>
            } @else if (!sourceReady()) {
              <p class="da-note da-authoring-controls-placeholder" aria-busy="true">Loading source video…</p>
            } @else {
              <p class="da-note da-authoring-source-mode">{{ sourceModeLabel() }}</p>
              <da-authoring-playback-bar
                [viewport]="viewportRef()"
                [disabled]="false"
                [hint]="playbackHint()"
                [recordRange]="recordRange()"
                (recordRangeChange)="onRecordRangeChange($event)"
                (previewRecordingChange)="previewRecording.set($event)"
                (resetView)="resetView()"
                (playbackStop)="resetExportRectangle()"
              />
              @if (isEquirectSource()) {
                <da-authoring-camera-controls
                  [yaw]="yaw()"
                  [pitch]="pitch()"
                  [horizontalFov]="horizontalFov()"
                  [disabled]="false"
                  (yawChange)="yaw.set(wrapSigned($event))"
                  (pitchChange)="pitch.set($event)"
                  (horizontalFovChange)="horizontalFov.set($event)"
                  (reset)="resetView()"
                  (littlePlanetPreset)="applyLittlePlanetPreset()"
                />
              } @else {
                <div class="da-authoring-crop-controls" aria-label="Crop region controls">
                  <h4 class="da-authoring-crop-controls__title">Crop region</h4>
                  <p class="da-note da-authoring-crop-controls__hint">
                    Drag corners for any output size (updates export dimensions live). Pick a preset to snap to
                    320×240, 640×360, or 720×480.
                  </p>
                  <div class="da-authoring-crop-controls__grid">
                    <section class="rd-input-number">
                      <span class="rd-field__label">Crop X</span>
                      <input type="number" class="rd-input" step="1" min="0" [value]="cropX()" (change)="updateFlatCrop({ cropX: +$any($event.target).value })" />
                    </section>
                    <section class="rd-input-number">
                      <span class="rd-field__label">Crop Y</span>
                      <input type="number" class="rd-input" step="1" min="0" [value]="cropY()" (change)="updateFlatCrop({ cropY: +$any($event.target).value })" />
                    </section>
                    <section class="rd-input-number">
                      <span class="rd-field__label">Crop width</span>
                      <input type="number" class="rd-input" step="2" min="2" [value]="cropWidth()" (change)="updateFlatCrop({ cropWidth: +$any($event.target).value })" />
                    </section>
                    <section class="rd-input-number">
                      <span class="rd-field__label">Crop height</span>
                      <input type="number" class="rd-input" step="2" min="2" [value]="cropHeight()" (change)="updateFlatCrop({ cropHeight: +$any($event.target).value })" />
                    </section>
                  </div>
                </div>
              }
            }
          </div>

          <div class="da-authoring-pane da-authoring-pane--output" aria-label="Authoring output controls">
            @if (!sourceReady()) {
              <p class="da-note da-authoring-controls-placeholder">
                Output and export settings appear after you load a source video.
              </p>
            } @else {
            <p class="da-note">Same view as source — live mirror scaled to export dimensions.</p>

            @if (sourceWidth() && sourceHeight()) {
              <p class="da-note" [class.da-note--warn]="equirectAspectWarning()">
                Source dimensions: {{ sourceWidth() }}×{{ sourceHeight() }} ({{ sourceAspect()?.toFixed(2) }}:1)
                @if (isEquirectSource()) {
                  — interior view flips texture for inside-out viewing
                }
                @if (equirectAspectWarning()) {
                  · aspect ratio differs from 2:1; extract may look wrong
                }
              </p>
            }

            <div class="da-media-extract-controls">
              <div class="da-media-extract-size-row">
                <div class="da-media-extract-size-row__preset">
                  <da-bound-select-input
                    [fieldLabel]="'Export rectangle size'"
                    [options]="outputPresetOptions()"
                    [value]="outputPresetId()"
                    (valueChange)="handleOutputPresetChange($event)"
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
                    [value]="outputWidth()"
                    [disabled]="!isCustomOutput()"
                    (change)="handleCustomDimensionChange(+$any($event.target).value, outputHeight())"
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
                    [value]="outputHeight()"
                    [disabled]="!isCustomOutput()"
                    (change)="handleCustomDimensionChange(outputWidth(), +$any($event.target).value)"
                  />
                </section>
                <button
                  type="button"
                  class="da-media-extract-size-row__reverse"
                  [class.is-active]="reverse()"
                  aria-label="Reverse playback"
                  [attr.aria-pressed]="reverse()"
                  (click)="reverse.set(!reverse())"
                >
                  <svg class="da-authoring-playback__icon da-authoring-playback__icon--reverse" viewBox="0 0 24 24" aria-hidden="true">
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
              @if (isEquirectSource()) {
                <div class="da-media-extract-controls__camera">
                  <section class="rd-input-number">
                    <span class="rd-field__label">Yaw (°)</span>
                    <input type="number" class="rd-input" step="0.5" min="-180" max="180" [value]="formatDegree(yaw())" (change)="yaw.set(wrapSigned(+$any($event.target).value))" />
                  </section>
                  <section class="rd-input-number">
                    <span class="rd-field__label">Pitch (°)</span>
                    <input type="number" class="rd-input" step="0.5" min="-85" max="85" [value]="formatDegree(pitch())" (change)="pitch.set(+$any($event.target).value)" />
                  </section>
                  <section class="rd-input-number">
                    <span class="rd-field__label">Horizontal FOV (°)</span>
                    <input type="number" class="rd-input" step="1" min="30" max="360" [value]="horizontalFov()" (change)="horizontalFov.set(+$any($event.target).value)" />
                  </section>
                </div>
              }
            </div>

            @if (extractFilter()) {
              <p class="da-note" [class.da-note--filter]="!extractFilter().startsWith('Extract ')">
                @if (extractFilter().startsWith('Extract ')) {
                  {{ extractFilter() }}
                } @else {
                  Filter:
                  <code class="da-value-ellipsis" tabindex="0">{{ extractFilter() }}</code>
                }
              </p>
            }

            @if (inputFile()) {
              @if (!recordRange()) {
                <p class="da-note">
                  Waiting for source duration… extract will enable once the clip is ready.
                </p>
              } @else {
                <p class="da-note">
                  Extract uses {{ recordRange()!.startSec.toFixed(1) }}s–{{ recordRange()!.endSec.toFixed(1) }}s.
                  Record on the playback bar to limit that range.
                </p>
              }
              <da-bound-select-input
                label="Extract format"
                [value]="extractFormat()"
                [options]="extractFormatOptions"
                (valueChange)="extractFormat.set($event === 'webm' ? 'webm' : 'mp4')"
              />
              <rd-attribution-notice [attr.notice]="ffmpegNotice"></rd-attribution-notice>
              <rd-wasm-media
                label="ffmpeg.wasm extract"
                operation="equirect-extract"
                [extractionMode]="isEquirectSource() ? 'rectilinear' : 'flat-crop'"
                [outputFormat]="extractFormat()"
                [showProgress]="true"
                [yaw]="yaw()"
                [pitch]="pitch()"
                [horizontalFov]="horizontalFov()"
                [outputWidth]="outputWidth()"
                [outputHeight]="outputHeight()"
                [reverse]="reverse()"
                [inputFile]="inputFile()"
                [cropRegion]="cropRegion()"
                [recordRange]="recordRange()"
                [previewRecording]="previewRecording()"
                (progress)="onExtractProgress($event)"
                (extractComplete)="onExtractComplete($event)"
                (extractError)="onExtractError($event)"
              />
            } @else {
              <p class="da-note">Attach a video file to enable ffmpeg.wasm extract.</p>
            }

            @if (extractBusy()) {
              <p class="da-note" aria-live="polite">
                Extracting…
                @if (extractProgress() > 0) {
                  {{ extractProgress() }}%
                } @else {
                  loading ffmpeg.wasm (~31 MB first run)
                }
              </p>
            }
            @if (extractError(); as error) {
              <p class="da-note da-note--warn" role="alert">Extract failed: {{ error }}</p>
            }
            @if (extractUrl(); as url) {
              <p class="da-note">
                @if (extractResultKind() === 'preview-recording') {
                  Extracted preview recording ({{ extractResultFormat() === 'webm' ? 'WebM' : 'MP4' }}):
                } @else {
                  Extracted MP4 (ffmpeg.wasm):
                }
              </p>
              <video class="da-authoring-pane__video" [src]="url" controls playsinline autoplay muted></video>
              <a class="da-media-extract-output__download" [href]="url" [download]="downloadName()">
                Download extracted video
              </a>
            }
            }
          </div>
        </div>
      </div>
    </section>
  `,
})
export class AuthoringScreenComponent {
  readonly atlas = inject(AtlasStateService);

  readonly authoring360CatalogJsonText = authoring360CatalogJson();
  readonly authoring360ShippedCount = AUTHORING_360_DISPLAY_CATALOG.filter(
    (entry) => entry.status === 'shipped',
  ).length;

  readonly authoring360Notice = computed(() => {
    const notice = authoring360Attribution(this.atlas.selectedId());
    return notice ? attributionNoticeJson(notice) : '';
  });

  readonly ffmpegNotice = attributionNoticeJson(FFMPEG_WASM_ATTRIBUTION);

  readonly destinationOptions = computed(() =>
    MOCK_DESTINATIONS.map((dest) => ({
      value: dest.id,
      label: `${localizedDestinationName(dest, this.atlas.locale())} · 360°`,
    })),
  );

  readonly exampleId = signal(DEFAULT_AUTHORING_EXAMPLE_ID);
  readonly inputFile = signal<File | null>(null);
  readonly sourceUrl = signal<string | null>(null);
  readonly sourceLoadBusy = signal(false);
  readonly sourceLoadError = signal<string | null>(null);
  readonly libraryAutoloadResolved = signal(false);
  readonly cropRegion = signal<CropRegion | null>(null);
  readonly extractUrl = signal<string | null>(null);
  readonly extractFilter = signal('');
  readonly extractProgress = signal(0);
  readonly extractError = signal<string | null>(null);
  readonly extractBusy = signal(false);

  readonly yaw = signal(25);
  readonly pitch = signal(-8);
  readonly horizontalFov = signal(75);
  readonly outputWidth = signal(720);
  readonly outputHeight = signal(480);
  readonly outputPresetId = signal('720x480');
  readonly reverse = signal(false);
  readonly sourceWidth = signal<number | undefined>(undefined);
  readonly sourceHeight = signal<number | undefined>(undefined);
  readonly cropX = signal(0);
  readonly cropY = signal(0);
  readonly cropWidth = signal(640);
  readonly cropHeight = signal(360);
  readonly recordRange = signal<AuthoringRecordRange | null>(null);
  readonly previewRecording = signal<Blob | null>(null);
  readonly extractFormat = signal<'mp4' | 'webm'>('mp4');
  readonly exportReferenceToken = signal(0);
  readonly outputSizeCommitToken = signal(1);
  readonly extractResultKind = signal<'preview-recording' | 'ffmpeg' | null>(null);
  readonly extractResultFormat = signal<'mp4' | 'webm' | null>(null);

  readonly extractFormatOptions = [
    { value: 'mp4', label: 'MP4 (transcode mirror recording)' },
    { value: 'webm', label: 'WebM (mirror recording copy)' },
  ];

  private userPickedFile = false;

  private objectUrl: string | null = null;
  private extractObjectUrl: string | null = null;

  readonly sphereViewport = viewChild<EquirectSphereViewport>('sphereViewport');
  readonly flatViewport = viewChild<FlatVideoViewport>('flatViewport');
  readonly outputPreviewHostEl = viewChild<ElementRef<HTMLElement>>('outputPreviewHost');

  readonly example = computed(
    () => getAuthoringExampleById(this.exampleId()) ?? DESTINATION_ATLAS_AUTHORING_EXAMPLES[0],
  );

  readonly activeDestination = computed(() => {
    const selectedId = this.atlas.selectedId();
    const fromSelection = selectedId ? getDestinationById(selectedId) : undefined;
    const example = this.example();
    return fromSelection ?? (example ? getDestinationById(example.destinationId) : undefined);
  });

  readonly missingContentMessage = computed(() => {
    const destination = this.activeDestination();
    return destination
      ? destinationMissingContentMessage(localizedDestinationName(destination, this.atlas.locale()))
      : '';
  });

  readonly showMissingContent = computed(
    () =>
      Boolean(this.activeDestination()) &&
      this.libraryAutoloadResolved() &&
      !this.inputFile() &&
      !this.sourceLoadBusy() &&
      !this.sourceUrl(),
  );

  readonly exampleOptions = computed(() =>
    DESTINATION_ATLAS_AUTHORING_EXAMPLES.map((entry) => ({
      value: entry.id,
      label: entry.label,
    })),
  );

  readonly sourceReady = computed(
    () => Boolean(this.sourceUrl() && this.sourceWidth() && this.sourceHeight() && !this.sourceLoadBusy()),
  );

  readonly isEquirectSource = computed(() => {
    const width = this.sourceWidth();
    const height = this.sourceHeight();
    return Boolean(this.sourceReady() && width && height && isEquirectSourceDimensions(width, height));
  });

  readonly sourceModeLabel = computed(() =>
    this.isEquirectSource()
      ? '360° equirectangular — camera framing controls'
      : 'Flat video — drag the crop rectangle on source',
  );

  readonly isCustomOutput = computed(() => this.outputPresetId() === AUTHORING_OUTPUT_CUSTOM_ID);

  readonly playbackHint = computed(() =>
    this.isEquirectSource()
      ? 'Drag on the sphere or use Camera framing sliders · FOV above 130° enters little-planet'
      : 'Drag the crop rectangle · corner handles set a custom output size · presets snap to standard dimensions',
  );

  readonly sourceAspect = computed(() => {
    const width = this.sourceWidth();
    const height = this.sourceHeight();
    return width && height && height > 0 ? width / height : null;
  });

  readonly equirectAspectWarning = computed(
    () =>
      this.isEquirectSource() &&
      this.sourceAspect() !== null &&
      Math.abs(this.sourceAspect()! - 2) > 0.05,
  );

  readonly exampleLabel = computed(() => {
    const example = this.example();
    const destination = example ? getDestinationById(example.destinationId) : undefined;
    if (!example || !destination) {
      return example?.label ?? 'Authoring example';
    }
    return `${example.label} · ${localizedDestinationName(destination, this.atlas.locale())}`;
  });

  readonly outputPresetOptions = computed(() => [
    ...AUTHORING_OUTPUT_PRESETS.map((entry) => ({ value: entry.id, label: entry.label })),
    { value: AUTHORING_OUTPUT_CUSTOM_ID, label: 'Custom' },
  ]);

  readonly downloadName = computed(() => {
    if (this.extractResultKind() === 'preview-recording' && this.extractResultFormat() === 'webm') {
      return authoringPreviewRecordingDownloadName(this.inputFile());
    }
    return authoringExtractDownloadName(this.inputFile());
  });

  constructor() {
    effect(() => {
      const selectedId = this.atlas.selectedId();
      if (!selectedId) {
        return;
      }
      const linkedExample = getAuthoringExampleForDestinationId(selectedId);
      if (linkedExample) {
        this.exampleId.set(linkedExample.id);
      }
    });

    effect(() => {
      this.atlas.selectedId();
      this.exampleId();
      this.userPickedFile = false;
    });

    effect(() => {
      const example = this.example();
      if (!example) {
        return;
      }

      if (!this.userPickedFile) {
        this.yaw.set(example.defaultYaw);
        this.pitch.set(example.defaultPitch);
        this.horizontalFov.set(example.defaultHorizontalFov);
        const preset = getAuthoringOutputPreset('720x480');
        this.outputPresetId.set('720x480');
        this.outputWidth.set(preset?.width ?? 720);
        this.outputHeight.set(preset?.height ?? 480);
        this.outputSizeCommitToken.update((token) => token + 1);
        this.sourceWidth.set(undefined);
        this.sourceHeight.set(undefined);
        this.recordRange.set(null);
        this.previewRecording.set(null);
        this.cropRegion.set(null);
        this.extractFilter.set('');
        this.extractResultKind.set(null);
        this.extractResultFormat.set(null);
        this.extractProgress.set(0);
        this.extractError.set(null);
        this.extractBusy.set(false);
        this.inputFile.set(null);
        this.sourceUrl.set(null);
        this.sourceLoadBusy.set(false);
        this.sourceLoadError.set(null);
        this.revokeExtractUrl();
      }
    });

    effect((onCleanup) => {
      const destId = this.atlas.selectedId();
      this.exampleId();
      if (!destId || this.userPickedFile) {
        return;
      }
      if (!getAuthoring360Source(destId)) {
        this.sourceLoadBusy.set(false);
        this.libraryAutoloadResolved.set(true);
        return;
      }
      let cancelled = false;
      this.sourceLoadBusy.set(true);
      this.libraryAutoloadResolved.set(false);
      this.sourceLoadError.set(null);
      void fetchAuthoring360File(destId)
        .then((file) => {
          if (cancelled || this.userPickedFile) {
            return;
          }
          this.sourceLoadBusy.set(false);
          if (file) {
            this.inputFile.set(file);
          }
        })
        .catch((error: unknown) => {
          if (cancelled) {
            return;
          }
          this.sourceLoadBusy.set(false);
          this.sourceLoadError.set(error instanceof Error ? error.message : String(error));
        })
        .finally(() => {
          if (!cancelled) {
            this.libraryAutoloadResolved.set(true);
          }
        });
      onCleanup(() => {
        cancelled = true;
      });
    });

    effect((onCleanup) => {
      const file = this.inputFile();
      if (!file) {
        return;
      }
      const url = URL.createObjectURL(file);
      this.objectUrl = url;
      this.sourceUrl.set(url);
      onCleanup(() => {
        URL.revokeObjectURL(url);
        if (this.objectUrl === url) {
          this.objectUrl = null;
        }
      });
    });

    effect(() => {
      const file = this.inputFile();
      const width = this.sourceWidth();
      const height = this.sourceHeight();
      if (!file || (width && height)) {
        return;
      }
      void probeVideoFile(file).then(({ width: probedWidth, height: probedHeight }) => {
        if (probedWidth > 0 && probedHeight > 0) {
          this.sourceWidth.set(probedWidth);
          this.sourceHeight.set(probedHeight);
        }
      });
    });

    effect(() => {
      if (!this.sourceReady() || this.recordRange()) {
        return;
      }
      const viewport = this.viewportRef();
      if (!viewport) {
        return;
      }
      const range = defaultAuthoringRecordRange(viewport.getDuration());
      if (range) {
        this.recordRange.set(range);
      }
    });

    effect(() => {
      const width = this.sourceWidth();
      const height = this.sourceHeight();
      if (!width || !height || this.isEquirectSource() || this.outputPresetId() === AUTHORING_OUTPUT_CUSTOM_ID) {
        return;
      }
      const centered = centerCropForOutput(width, height, this.outputWidth(), this.outputHeight());
      this.cropX.set(centered.cropX);
      this.cropY.set(centered.cropY);
      this.cropWidth.set(centered.cropWidth);
      this.cropHeight.set(centered.cropHeight);
    });

    effect(() => {
      const previewMirrorNote =
        this.extractFormat() === 'webm'
          ? 'Extract copies the output mirror recording as WebM (same clip as playback download).'
          : 'Extract transcodes the output mirror recording to MP4 via ffmpeg.wasm (playback download stays WebM).';
      if (this.isEquirectSource()) {
        const region = virtualCameraToCropRegion({
          camera: { yaw: this.yaw(), pitch: this.pitch(), roll: 0, fov: this.horizontalFov() },
          sourceWidth: this.sourceWidth(),
          sourceHeight: this.sourceHeight(),
          outputWidth: this.outputWidth(),
          outputHeight: this.outputHeight(),
          reverse: this.reverse(),
        });
        this.cropRegion.set(region);
        this.extractFilter.set(
          this.previewRecording() ? previewMirrorNote : typeof region.filter === 'string' ? region.filter : '',
        );
        return;
      }
      const width = this.sourceWidth();
      const height = this.sourceHeight();
      if (!width || !height) {
        this.cropRegion.set(null);
        this.extractFilter.set('');
        return;
      }
      const region = flatCropToCropRegion({
        cropX: this.cropX(),
        cropY: this.cropY(),
        cropWidth: this.cropWidth(),
        cropHeight: this.cropHeight(),
        sourceWidth: width,
        sourceHeight: height,
        outputWidth: this.outputWidth(),
        outputHeight: this.outputHeight(),
        reverse: this.reverse(),
      });
      this.cropRegion.set(region);
      this.extractFilter.set(this.previewRecording() ? previewMirrorNote : region.filter);
    });
  }

  viewportRef(): EquirectSphereViewport | FlatVideoViewport | null {
    return this.sphereViewport() ?? this.flatViewport() ?? null;
  }

  outputPreviewElement(): HTMLElement | null {
    return this.outputPreviewHostEl()?.nativeElement ?? null;
  }

  formatDegree(value: number): number {
    return Math.round(value * 10) / 10;
  }

  wrapSigned(value: number): number {
    return wrapSignedDegrees(value);
  }

  onOutputSizeChange(detail: { outputWidth: number; outputHeight: number }): void {
    this.outputWidth.set(evenDimension(detail.outputWidth));
    this.outputHeight.set(evenDimension(detail.outputHeight));
    this.outputPresetId.set(AUTHORING_OUTPUT_CUSTOM_ID);
  }

  onCameraChange(detail: { yaw: number; pitch: number; horizontalFov: number }): void {
    this.yaw.set(wrapSignedDegrees(detail.yaw));
    this.pitch.set(detail.pitch);
    this.horizontalFov.set(detail.horizontalFov);
  }

  onCropChange(detail: { cropX: number; cropY: number; cropWidth: number; cropHeight: number }): void {
    this.applyFlatCrop(detail);
  }

  updateFlatCrop(partial: Partial<{ cropX: number; cropY: number; cropWidth: number; cropHeight: number }>): void {
    this.applyFlatCrop({
      cropX: partial.cropX ?? this.cropX(),
      cropY: partial.cropY ?? this.cropY(),
      cropWidth: partial.cropWidth ?? this.cropWidth(),
      cropHeight: partial.cropHeight ?? this.cropHeight(),
    });
  }

  private applyFlatCrop(detail: { cropX: number; cropY: number; cropWidth: number; cropHeight: number }): void {
    this.cropX.set(detail.cropX);
    this.cropY.set(detail.cropY);
    this.cropWidth.set(detail.cropWidth);
    this.cropHeight.set(detail.cropHeight);
    this.outputWidth.set(evenDimension(detail.cropWidth));
    this.outputHeight.set(evenDimension(detail.cropHeight));
    this.outputPresetId.set(AUTHORING_OUTPUT_CUSTOM_ID);
  }

  handleOutputPresetChange(presetId: string): void {
    this.outputPresetId.set(presetId);
    if (presetId === AUTHORING_OUTPUT_CUSTOM_ID) {
      return;
    }
    const preset = getAuthoringOutputPreset(presetId);
    if (preset) {
      this.outputWidth.set(preset.width);
      this.outputHeight.set(preset.height);
      this.outputSizeCommitToken.update((token) => token + 1);
      if (this.isEquirectSource()) {
        this.exportReferenceToken.update((token) => token + 1);
      }
    }
  }

  handleCustomDimensionChange(width: number, height: number): void {
    if (!this.isCustomOutput()) {
      return;
    }
    this.outputWidth.set(width);
    this.outputHeight.set(height);
    this.outputPresetId.set(matchOutputPreset(width, height));
    this.outputSizeCommitToken.update((token) => token + 1);
  }

  handleVideoFile(detail: VideoFileDetail): void {
    this.userPickedFile = true;
    this.sourceLoadBusy.set(false);
    this.sourceLoadError.set(null);
    this.recordRange.set(null);
    this.previewRecording.set(null);
    this.inputFile.set(detail.file);
    const example = this.example();
    if (example) {
      this.yaw.set(example.defaultYaw);
      this.pitch.set(example.defaultPitch);
      this.horizontalFov.set(example.defaultHorizontalFov);
    }
    const width = Number(detail.metadata.sourceWidth);
    const height = Number(detail.metadata.sourceHeight);
    if (Number.isFinite(width) && width > 0 && Number.isFinite(height) && height > 0) {
      this.sourceWidth.set(width);
      this.sourceHeight.set(height);
    } else {
      this.sourceWidth.set(undefined);
      this.sourceHeight.set(undefined);
    }
    this.revokeExtractUrl();
    this.extractProgress.set(0);
    this.extractError.set(null);
    this.extractBusy.set(false);
  }

  onRecordRangeChange(range: AuthoringRecordRange | null): void {
    if (range) {
      this.recordRange.set(range);
      return;
    }
    const viewport = this.viewportRef();
    this.recordRange.set(
      viewport ? defaultAuthoringRecordRange(viewport.getDuration()) : null,
    );
  }

  onDestinationChange(destinationId: string): void {
    this.atlas.setSelectedId(destinationId);
  }

  onAuthoringFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) {
      return;
    }
    void probeVideoFile(file).then(({ width, height }) => {
      this.handleVideoFile({
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

  resetView(): void {
    const example = this.example();
    if (!example) {
      return;
    }
    if (this.isEquirectSource()) {
      this.yaw.set(example.defaultYaw);
      this.pitch.set(example.defaultPitch);
      this.horizontalFov.set(example.defaultHorizontalFov);
      return;
    }
    const width = this.sourceWidth();
    const height = this.sourceHeight();
    if (!width || !height) {
      return;
    }
    const centered = centerCropForOutput(width, height, this.outputWidth(), this.outputHeight());
    this.cropX.set(centered.cropX);
    this.cropY.set(centered.cropY);
    this.cropWidth.set(centered.cropWidth);
    this.cropHeight.set(centered.cropHeight);
  }

  resetExportRectangle(): void {
    if (this.isEquirectSource()) {
      this.exportReferenceToken.update((token) => token + 1);
      return;
    }
    const width = this.sourceWidth();
    const height = this.sourceHeight();
    if (!width || !height) {
      return;
    }
    const centered = centerCropForOutput(width, height, this.outputWidth(), this.outputHeight());
    this.cropX.set(centered.cropX);
    this.cropY.set(centered.cropY);
    this.cropWidth.set(centered.cropWidth);
    this.cropHeight.set(centered.cropHeight);
  }

  applyLittlePlanetPreset(): void {
    this.horizontalFov.set(360);
    this.pitch.set(-85);
  }

  onExtractProgress(detail: { progress: number }): void {
    this.extractBusy.set(true);
    this.extractProgress.set(detail.progress);
  }

  onExtractComplete(detail: {
    blob: Blob;
    metadata: Record<string, string | number | boolean | null | undefined>;
  }): void {
    this.extractBusy.set(false);
    this.extractProgress.set(100);
    this.extractError.set(null);
    this.revokeExtractUrl();
    const url = URL.createObjectURL(detail.blob);
    this.extractObjectUrl = url;
    this.extractUrl.set(url);
    const isPreviewRecording = detail.metadata.source === 'preview-recording';
    this.extractResultKind.set(isPreviewRecording ? 'preview-recording' : 'ffmpeg');
    this.extractResultFormat.set(detail.metadata.format === 'webm' ? 'webm' : 'mp4');
    if (isPreviewRecording) {
      this.extractFilter.set(
        detail.metadata.format === 'webm'
          ? 'Extract copies the output mirror recording as WebM (same clip as playback download).'
          : 'Extract transcodes the output mirror recording to MP4 via ffmpeg.wasm (playback download stays WebM).',
      );
      return;
    }
    const filter = detail.metadata.filter;
    this.extractFilter.set(typeof filter === 'string' ? filter : '');
  }

  onExtractError(detail: { message: string }): void {
    this.extractBusy.set(false);
    this.extractError.set(detail.message);
  }

  private revokeExtractUrl(): void {
    if (this.extractObjectUrl) {
      URL.revokeObjectURL(this.extractObjectUrl);
      this.extractObjectUrl = null;
    }
    this.extractUrl.set(null);
  }
}
