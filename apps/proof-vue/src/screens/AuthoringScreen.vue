<script lang="ts">
export const AUTHORING_SOURCE = `<AuthoringScreen :locale="locale" :selected-id="selectedId">
  <SelectInput label="360° destination" />
  <EquirectSphereViewport />
  <FlatVideoViewport />
  <WasmMedia />
  <SelectInput />
  <AuthoringPlaybackBar />
  <AuthoringCameraControls />
</AuthoringScreen>`;
</script>

<script setup lang="ts">
import { toRefs, computed } from 'vue';
import {
  AUTHORING_360_DISPLAY_CATALOG,
  authoring360CatalogJson,
  MOCK_DESTINATIONS,
  authoring360Attribution,
  attributionNoticeJson,
  FFMPEG_WASM_ATTRIBUTION,
} from '@destination-atlas';
import { EquirectSphereViewport } from '@rosettadash/vue/visual/media/equirect-sphere-viewport';
import { FlatVideoViewport } from '@rosettadash/vue/visual/media/flat-video-viewport';
import { WasmMedia } from '@rosettadash/vue/visual/wasm/media';
import { SelectInput } from '@rosettadash/vue/visual/input/select';
import AuthoringPlaybackBar from '../components/AuthoringPlaybackBar.vue';
import AuthoringCameraControls from '../components/AuthoringCameraControls.vue';
import BoundSelectInput from '../components/BoundSelectInput.vue';
import { localizedDestinationName } from '../lib/atlas-utils';
import { useAuthoringScreen } from '../composables/use-authoring-screen';

const props = defineProps<{ locale: string; selectedId: string }>();
const emit = defineEmits<{ 'update:selectedId': [string] }>();

const { locale, selectedId } = toRefs(props);

const destinationOptions = computed(() =>
  MOCK_DESTINATIONS.map((dest) => ({
    value: dest.id,
    label: `${localizedDestinationName(dest, locale.value)} · 360°`,
  })),
);

const authoring360CatalogJsonText = authoring360CatalogJson();
const authoring360ShippedCount = computed(
  () => AUTHORING_360_DISPLAY_CATALOG.filter((entry) => entry.status === 'shipped').length,
);

const authoring360NoticeJson = computed(() => {
  const notice = authoring360Attribution(selectedId.value);
  return notice ? attributionNoticeJson(notice) : '';
});

const ffmpegNoticeJson = attributionNoticeJson(FFMPEG_WASM_ATTRIBUTION);

const {
  sphereViewportRef,
  flatViewportRef,
  outputPreviewHostRef,
  viewportRef,
  sourceUrl,
  sourceLoadBusy,
  sourceReady,
  isEquirectSource,
  sourceModeLabel,
  playbackHint,
  yaw,
  pitch,
  horizontalFov,
  outputWidth,
  outputHeight,
  outputPresetId,
  outputPresetOptions,
  outputSizeCommitToken,
  exportReferenceToken,
  reverse,
  sourceWidth,
  sourceHeight,
  sourceAspect,
  equirectAspectWarning,
  cropX,
  cropY,
  cropWidth,
  cropHeight,
  recordRange,
  previewRecording,
  setRecordRange,
  setPreviewRecording,
  extractFormat,
  extractFormatOptions,
  extractFilter,
  inputFile,
  cropRegion,
  extractBusy,
  extractProgress,
  extractError,
  extractUrl,
  extractResultKind,
  extractResultFormat,
  downloadName,
  isCustomOutput,
  formatDegree,
  wrapSigned,
  onAuthoringFileSelected,
  onCameraChange,
  onOutputSizeChange,
  onCropChange,
  updateFlatCrop,
  handleOutputPresetChange,
  handleCustomDimensionChange,
  resetView,
  resetExportRectangle,
  applyLittlePlanetPreset,
  onExtractProgress,
  onExtractComplete,
  onExtractError,
  showMissingContent,
  missingContentMessage,
} = useAuthoringScreen({ locale, selectedId });
</script>

<template>
  <section class="da-panel da-panel--authoring">
    <h2>Authoring</h2>

    <BoundSelectInput
      field-label="360° destination"
      :options="destinationOptions"
      :value="selectedId"
      @update:value="emit('update:selectedId', $event)"
    />
    <p class="da-note da-authoring-dest-hint">
      Syncs with the header selection and autoloads the library clip when available.
      You can still click the source viewport to upload your own video.
    </p>
    <rd-attribution-notice v-if="authoring360NoticeJson" :notice="authoring360NoticeJson" />

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
          <div v-if="sourceUrl" class="da-authoring-source-toolbar">
            <label class="da-authoring-change-file">
              <input
                type="file"
                class="da-authoring-choose-file__input"
                accept="video/*"
                @change="onAuthoringFileSelected"
              />
              Change video file
            </label>
          </div>
          <div class="da-authoring-viewport-stage">
            <template v-if="sourceUrl">
              <EquirectSphereViewport
                v-if="isEquirectSource"
                ref="sphereViewportRef"
                class="da-authoring-sphere-viewport"
                :video-src="sourceUrl"
                :flip-interior="true"
                :yaw="yaw"
                :pitch="pitch"
                :horizontal-fov="horizontalFov"
                :output-width="outputWidth"
                :output-height="outputHeight"
                :output-preview-host="outputPreviewHostRef"
                :reset-export-reference-token="exportReferenceToken"
                :output-size-commit-token="outputSizeCommitToken"
                :on-camera-change="onCameraChange"
                :on-output-size-change="onOutputSizeChange"
              />
              <FlatVideoViewport
                v-else-if="sourceWidth && sourceHeight"
                ref="flatViewportRef"
                class="da-authoring-flat-viewport"
                :video-src="sourceUrl"
                :source-width="sourceWidth"
                :source-height="sourceHeight"
                :crop-x="cropX"
                :crop-y="cropY"
                :crop-width="cropWidth"
                :crop-height="cropHeight"
                :output-width="outputWidth"
                :output-height="outputHeight"
                :lock-aspect-ratio="true"
                :output-preview-host="outputPreviewHostRef"
                :on-crop-change="onCropChange"
              />
              <div
                v-else
                class="da-authoring-sphere-viewport da-authoring-sphere-viewport--placeholder"
                aria-busy="true"
                aria-label="Reading source video"
              ></div>
            </template>
            <div
              v-else-if="sourceLoadBusy"
              class="da-authoring-sphere-viewport da-authoring-sphere-viewport--placeholder"
              aria-busy="true"
              aria-label="Loading source video"
            ></div>
            <div
              v-else-if="showMissingContent"
              class="da-authoring-sphere-viewport da-authoring-sphere-viewport--placeholder"
            >
              <p class="da-authoring-missing-content">{{ missingContentMessage }}</p>
            </div>
            <div v-else class="da-authoring-sphere-viewport da-authoring-sphere-viewport--placeholder">
              <label class="da-authoring-choose-file">
                <input
                  type="file"
                  class="da-authoring-choose-file__input"
                  accept="video/*"
                  @change="onAuthoringFileSelected"
                />
                Choose video file
              </label>
            </div>
          </div>
        </div>

        <div class="da-authoring-workspace__video-col">
          <div
            v-if="sourceUrl"
            ref="outputPreviewHostRef"
            class="da-authoring-program-preview-host"
          ></div>
          <div
            v-else-if="showMissingContent"
            class="da-authoring-program-preview-host da-authoring-program-preview-host--placeholder"
          >
            <p class="da-authoring-missing-content">{{ missingContentMessage }}</p>
          </div>
          <div
            v-else
            class="da-authoring-program-preview-host da-authoring-program-preview-host--placeholder"
          >
            <p class="da-authoring-output-placeholder">Choose source file to create output</p>
          </div>
        </div>
      </div>

      <div class="da-authoring-workspace__footers">
        <div class="da-authoring-pane da-authoring-pane--source" aria-label="Authoring source controls">
          <p
            v-if="!sourceUrl && !sourceLoadBusy && showMissingContent"
            class="da-note da-authoring-controls-placeholder da-authoring-missing-content"
          >
            {{ missingContentMessage }}
          </p>
          <p v-else-if="!sourceUrl && !sourceLoadBusy" class="da-note da-authoring-controls-placeholder">
            Choose a source video to show playback and framing controls.
          </p>
          <p v-else-if="!sourceReady" class="da-note da-authoring-controls-placeholder" aria-busy="true">
            Loading source video…
          </p>
          <template v-else>
            <p class="da-note da-authoring-source-mode">{{ sourceModeLabel }}</p>
            <AuthoringPlaybackBar
              :viewport="viewportRef"
              :disabled="false"
              :hint="playbackHint"
              :record-range="recordRange"
              @update:record-range="setRecordRange"
              @update:preview-recording="setPreviewRecording"
              @reset-view="resetView"
              @playback-stop="resetExportRectangle"
            />
            <AuthoringCameraControls
              v-if="isEquirectSource"
              :yaw="yaw"
              :pitch="pitch"
              :horizontal-fov="horizontalFov"
              :disabled="false"
              @update:yaw="yaw = wrapSigned($event)"
              @update:pitch="pitch = $event"
              @update:horizontal-fov="horizontalFov = $event"
              @reset="resetView"
              @little-planet-preset="applyLittlePlanetPreset"
            />
            <div v-else class="da-authoring-crop-controls" aria-label="Crop region controls">
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
                    :value="cropX"
                    @change="updateFlatCrop({ cropX: +($event.target as HTMLInputElement).value })"
                  />
                </section>
                <section class="rd-input-number">
                  <span class="rd-field__label">Crop Y</span>
                  <input
                    type="number"
                    class="rd-input"
                    step="1"
                    min="0"
                    :value="cropY"
                    @change="updateFlatCrop({ cropY: +($event.target as HTMLInputElement).value })"
                  />
                </section>
                <section class="rd-input-number">
                  <span class="rd-field__label">Crop width</span>
                  <input
                    type="number"
                    class="rd-input"
                    step="2"
                    min="2"
                    :value="cropWidth"
                    @change="updateFlatCrop({ cropWidth: +($event.target as HTMLInputElement).value })"
                  />
                </section>
                <section class="rd-input-number">
                  <span class="rd-field__label">Crop height</span>
                  <input
                    type="number"
                    class="rd-input"
                    step="2"
                    min="2"
                    :value="cropHeight"
                    @change="updateFlatCrop({ cropHeight: +($event.target as HTMLInputElement).value })"
                  />
                </section>
              </div>
            </div>
          </template>
        </div>

        <div class="da-authoring-pane da-authoring-pane--output" aria-label="Authoring output controls">
          <p v-if="!sourceReady" class="da-note da-authoring-controls-placeholder">
            Output and export settings appear after you load a source video.
          </p>
          <template v-else>
            <p class="da-note">Same view as source — live mirror scaled to export dimensions.</p>

            <p v-if="sourceWidth && sourceHeight" class="da-note" :class="{ 'da-note--warn': equirectAspectWarning }">
              Source dimensions: {{ sourceWidth }}×{{ sourceHeight }} ({{ sourceAspect?.toFixed(2) }}:1)
              <template v-if="isEquirectSource"> — interior view flips texture for inside-out viewing</template>
              <template v-if="equirectAspectWarning"> · aspect ratio differs from 2:1; extract may look wrong</template>
            </p>

            <div class="da-media-extract-controls">
              <div class="da-media-extract-size-row">
                <div class="da-media-extract-size-row__preset">
                  <SelectInput
                    label="Export rectangle size"
                    :options="outputPresetOptions"
                    :value="outputPresetId"
                    :on-change="handleOutputPresetChange"
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
                    :value="outputWidth"
                    :disabled="!isCustomOutput"
                    @change="
                      handleCustomDimensionChange(
                        +($event.target as HTMLInputElement).value,
                        outputHeight,
                      )
                    "
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
                    :value="outputHeight"
                    :disabled="!isCustomOutput"
                    @change="
                      handleCustomDimensionChange(
                        outputWidth,
                        +($event.target as HTMLInputElement).value,
                      )
                    "
                  />
                </section>
                <button
                  type="button"
                  class="da-media-extract-size-row__reverse"
                  :class="{ 'is-active': reverse }"
                  aria-label="Reverse playback"
                  :aria-pressed="reverse"
                  @click="reverse = !reverse"
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
              <div v-if="isEquirectSource" class="da-media-extract-controls__camera">
                <section class="rd-input-number">
                  <span class="rd-field__label">Yaw (°)</span>
                  <input
                    type="number"
                    class="rd-input"
                    step="0.5"
                    min="-180"
                    max="180"
                    :value="formatDegree(yaw)"
                    @change="yaw = wrapSigned(+($event.target as HTMLInputElement).value)"
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
                    :value="formatDegree(pitch)"
                    @change="pitch = +($event.target as HTMLInputElement).value"
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
                    :value="horizontalFov"
                    @change="horizontalFov = +($event.target as HTMLInputElement).value"
                  />
                </section>
              </div>
            </div>

            <p
              v-if="extractFilter"
              class="da-note"
              :class="{ 'da-note--filter': !extractFilter.startsWith('Extract ') }"
            >
              <template v-if="extractFilter.startsWith('Extract ')">{{ extractFilter }}</template>
              <template v-else>
                Filter:
                <code class="da-value-ellipsis" tabindex="0">{{ extractFilter }}</code>
              </template>
            </p>

            <template v-if="inputFile">
              <p v-if="!recordRange" class="da-note">
                Waiting for source duration… extract will enable once the clip is ready.
              </p>
              <p v-else class="da-note">
                Extract uses {{ recordRange.startSec.toFixed(1) }}s–{{ recordRange.endSec.toFixed(1) }}s.
                Record on the playback bar to limit that range.
              </p>
              <SelectInput
                label="Extract format"
                :value="extractFormat"
                :options="extractFormatOptions"
                :on-change="(value) => (extractFormat = value === 'webm' ? 'webm' : 'mp4')"
              />
              <rd-attribution-notice :notice="ffmpegNoticeJson" />
              <WasmMedia
                :key="`${inputFile.name}-${recordRange?.startSec ?? 'na'}-${recordRange?.endSec ?? 'na'}`"
                label="ffmpeg.wasm extract"
                operation="equirect-extract"
                :extraction-mode="isEquirectSource ? 'rectilinear' : 'flat-crop'"
                :output-format="extractFormat"
                :show-progress="true"
                :yaw="yaw"
                :pitch="pitch"
                :horizontal-fov="horizontalFov"
                :output-width="outputWidth"
                :output-height="outputHeight"
                :reverse="reverse"
                :input-file="inputFile"
                :crop-region="cropRegion"
                :record-range="recordRange"
                :preview-recording="previewRecording"
                @progress="onExtractProgress"
                @extract-complete="onExtractComplete"
                @extract-error="onExtractError"
              />
            </template>
            <p v-else class="da-note">Attach a video file to enable ffmpeg.wasm extract.</p>

            <p v-if="extractBusy" class="da-note" aria-live="polite">
              Extracting…
              <template v-if="extractProgress > 0">{{ extractProgress }}%</template>
              <template v-else>loading ffmpeg.wasm (~31 MB first run)</template>
            </p>
            <p v-if="extractError" class="da-note da-note--warn" role="alert">
              Extract failed: {{ extractError }}
            </p>
            <template v-if="extractUrl">
              <p class="da-note">
                <template v-if="extractResultKind === 'preview-recording'">
                  Extracted preview recording ({{ extractResultFormat === 'webm' ? 'WebM' : 'MP4' }}):
                </template>
                <template v-else>Extracted MP4 (ffmpeg.wasm):</template>
              </p>
              <video class="da-authoring-pane__video" :src="extractUrl" controls playsinline autoplay muted></video>
              <a class="da-media-extract-output__download" :href="extractUrl" :download="downloadName">
                Download extracted video
              </a>
            </template>
          </template>
        </div>
      </div>
    </div>
  </section>
</template>
