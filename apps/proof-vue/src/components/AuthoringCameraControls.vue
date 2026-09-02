<script lang="ts">
import { wrapSignedDegrees } from '@rosettadash/core';

const MIN_HFOV = 30;
const MAX_HFOV = 360;
export const LITTLE_PLANET_HFOV = MAX_HFOV;
export const LITTLE_PLANET_PITCH = -85;
const PLANET_ZONE_HFOV = 125;
const MIN_FOCAL_MM = 8;
const MAX_FOCAL_MM = 200;

function clamp(value: number, low: number, high: number): number {
  return Math.min(high, Math.max(low, value));
}

function zoomFromHfov(hfov: number): number {
  const logMin = Math.log(MIN_HFOV);
  const logMax = Math.log(MAX_HFOV);
  const logFov = Math.log(clamp(hfov, MIN_HFOV, MAX_HFOV));
  return clamp(((logFov - logMax) / (logMin - logMax)) * 100, 0, 100);
}

function hfovFromZoom(zoomPercent: number): number {
  const t = clamp(zoomPercent, 0, 100) / 100;
  const logMin = Math.log(MIN_HFOV);
  const logMax = Math.log(MAX_HFOV);
  return Math.exp(logMax + t * (logMin - logMax));
}

function focalLengthFromHfov(hfov: number): number {
  const zoom = zoomFromHfov(hfov) / 100;
  const logMin = Math.log(MIN_FOCAL_MM);
  const logMax = Math.log(MAX_FOCAL_MM);
  return Math.exp(logMin + (1 - zoom) * (logMax - logMin));
}

function hfovFromFocalLength(focal: number): number {
  const f = clamp(focal, MIN_FOCAL_MM, MAX_FOCAL_MM);
  const logMin = Math.log(MIN_FOCAL_MM);
  const logMax = Math.log(MAX_FOCAL_MM);
  const zoom = 1 - (Math.log(f) - logMin) / (logMax - logMin);
  return hfovFromZoom(zoom * 100);
}
</script>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  yaw: number;
  pitch: number;
  horizontalFov: number;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  'update:yaw': [number];
  'update:pitch': [number];
  'update:horizontalFov': [number];
  reset: [];
  littlePlanetPreset: [];
}>();

const minHfov = MIN_HFOV;
const maxHfov = MAX_HFOV;
const minFocal = MIN_FOCAL_MM;
const maxFocal = MAX_FOCAL_MM;

const zoom = computed(() => zoomFromHfov(props.horizontalFov));
const focalLength = computed(() => focalLengthFromHfov(props.horizontalFov));
const inPlanetZone = computed(() => props.horizontalFov > PLANET_ZONE_HFOV);

function stepZoom(delta: number): void {
  emit('update:horizontalFov', hfovFromZoom(clamp(zoom.value + delta, 0, 100)));
}

function onZoomChange(value: string): void {
  emit('update:horizontalFov', hfovFromZoom(+value));
}

function onFocalChange(value: string): void {
  emit('update:horizontalFov', hfovFromFocalLength(+value));
}
</script>

<template>
  <div class="da-authoring-camera" aria-label="Camera framing controls">
    <div class="da-authoring-camera__header">
      <h4 class="da-authoring-camera__title">Camera framing</h4>
      <div class="da-authoring-camera__actions">
        <button
          type="button"
          class="da-authoring-camera__preset"
          :disabled="disabled"
          @click="emit('littlePlanetPreset')"
        >
          Little planet
        </button>
        <button
          type="button"
          class="da-authoring-camera__step"
          :disabled="disabled || zoom >= 100"
          @click="stepZoom(8)"
        >
          Zoom in
        </button>
        <button
          type="button"
          class="da-authoring-camera__step"
          :disabled="disabled || zoom <= 0"
          @click="stepZoom(-8)"
        >
          Zoom out
        </button>
        <button type="button" class="da-authoring-camera__reset" :disabled="disabled" @click="emit('reset')">
          Reset
        </button>
      </div>
    </div>

    <label class="da-authoring-camera__row">
      <span class="da-authoring-camera__label">
        Zoom
        <span class="da-authoring-camera__hint">left = zoom out toward little-planet · right = zoom in</span>
      </span>
      <input
        type="range"
        min="0"
        max="100"
        step="0.5"
        :value="zoom"
        :disabled="disabled"
        @input="onZoomChange(($event.target as HTMLInputElement).value)"
      />
      <output class="da-authoring-camera__value">{{ zoom.toFixed(1) }}%</output>
    </label>

    <label class="da-authoring-camera__row">
      <span class="da-authoring-camera__label">
        Focal length
        <span class="da-authoring-camera__hint">35mm full-frame equivalent · longer = zoom in</span>
      </span>
      <input
        type="range"
        :min="minFocal"
        :max="maxFocal"
        step="0.5"
        :value="focalLength"
        :disabled="disabled"
        @input="onFocalChange(($event.target as HTMLInputElement).value)"
      />
      <output class="da-authoring-camera__value">{{ focalLength.toFixed(1) }}mm</output>
    </label>

    <label class="da-authoring-camera__row">
      <span class="da-authoring-camera__label">
        Horizontal FOV
        <span class="da-authoring-camera__hint">{{
          inPlanetZone ? 'little-planet zone (125°–360°)' : 'below 125° = normal rectilinear'
        }}</span>
      </span>
      <input
        type="range"
        :min="minHfov"
        :max="maxHfov"
        step="1"
        :value="horizontalFov"
        :disabled="disabled"
        @input="emit('update:horizontalFov', +($event.target as HTMLInputElement).value)"
      />
      <output class="da-authoring-camera__value">{{ horizontalFov.toFixed(0) }}°</output>
    </label>

    <label class="da-authoring-camera__row">
      <span class="da-authoring-camera__label">Yaw</span>
      <input
        type="range"
        min="-180"
        max="180"
        step="0.5"
        :value="yaw"
        :disabled="disabled"
        @input="emit('update:yaw', wrapSignedDegrees(+($event.target as HTMLInputElement).value))"
      />
      <output class="da-authoring-camera__value">{{ yaw.toFixed(1) }}°</output>
    </label>

    <label class="da-authoring-camera__row">
      <span class="da-authoring-camera__label">
        Pitch
        <span class="da-authoring-camera__hint">down = ground in center for little-planet</span>
      </span>
      <input
        type="range"
        min="-85"
        max="85"
        step="0.5"
        :value="pitch"
        :disabled="disabled"
        @input="emit('update:pitch', +($event.target as HTMLInputElement).value)"
      />
      <output class="da-authoring-camera__value">{{ pitch.toFixed(1) }}°</output>
    </label>

    <p class="da-note da-authoring-camera__note">
      <template v-if="inPlanetZone">
        Little-planet active. Keep your subject on the <strong>ring</strong> of the disk (horizon), not the center
        — the center is the ground below the camera. Use Yaw to rotate them around the ring; stretched heads
        usually mean the subject is too close to the disk center.
      </template>
      <template v-else>
        To match VLC little-planet: click <strong>Little planet</strong>, or drag Zoom all the way
        <strong>left</strong> (0%) and Pitch down to −85°.
      </template>
    </p>
  </div>
</template>
