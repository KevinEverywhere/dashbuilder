import type { ComponentPlugin } from './component-plugin';
import { DEFAULT_EQUIRECT_FLAT_CROP, DEFAULT_EQUIRECT_SOURCE } from '../media/equirect-filter';
import { MEDIA_DISPLAY_SIZE_PROPERTIES } from '../presentation/presentation-layout';

/** Media authoring plugins for equirectangular pipelines (DAS-82). */
export const MEDIA_COMPONENT_PLUGINS: ComponentPlugin[] = [
  {
    id: 'media.video-source',
    definition: {
      type: 'visual.media.video-source',
      category: 'visual',
      label: 'Video Source',
      description: 'Upload or link an equirectangular (or flat) video file for downstream processing',
      isVisual: true,
      inputs: [{ id: 'capture-blob', name: 'captureBlob', dataType: 'any' }],
      outputs: [
        { id: 'video-file', name: 'videoFile', dataType: 'any' },
        { id: 'metadata', name: 'metadata', dataType: 'row' },
      ],
      properties: [
        { key: 'label', label: 'Label', type: 'string', default: 'Video source' },
        { key: 'accept', label: 'Accept MIME/types', type: 'string', default: 'video/*' },
        { key: 'url', label: 'Remote URL', type: 'string', default: '' },
        ...MEDIA_DISPLAY_SIZE_PROPERTIES,
      ],
    },
    metadata: {
      paletteGroupId: 'media-authoring',
      previewKind: 'plugin',
    },
  },
  {
    id: 'media.equirect-viewport',
    definition: {
      type: 'visual.media.equirect-viewport',
      category: 'visual',
      label: 'Equirect Viewport',
      description: 'Select a crop region on a 2:1 equirect frame and define output dimensions',
      isVisual: true,
      inputs: [{ id: 'metadata', name: 'metadata', dataType: 'row' }],
      outputs: [{ id: 'crop-region', name: 'cropRegion', dataType: 'row' }],
      properties: [
        { key: 'label', label: 'Label', type: 'string', default: 'Equirect viewport' },
        ...MEDIA_DISPLAY_SIZE_PROPERTIES,
        { key: 'cropX', label: 'Crop X', type: 'number', default: DEFAULT_EQUIRECT_FLAT_CROP.cropX },
        { key: 'cropY', label: 'Crop Y', type: 'number', default: DEFAULT_EQUIRECT_FLAT_CROP.cropY },
        {
          key: 'cropWidth',
          label: 'Crop width',
          type: 'number',
          default: DEFAULT_EQUIRECT_FLAT_CROP.cropWidth,
        },
        {
          key: 'cropHeight',
          label: 'Crop height',
          type: 'number',
          default: DEFAULT_EQUIRECT_FLAT_CROP.cropHeight,
        },
        {
          key: 'outputWidth',
          label: 'Output width',
          type: 'number',
          default: DEFAULT_EQUIRECT_FLAT_CROP.outputWidth,
        },
        {
          key: 'outputHeight',
          label: 'Output height',
          type: 'number',
          default: DEFAULT_EQUIRECT_FLAT_CROP.outputHeight,
        },
      ],
    },
    metadata: {
      paletteGroupId: 'media-authoring',
      previewKind: 'plugin',
    },
  },
  {
    id: 'media.equirect-sphere-viewport',
    definition: {
      type: 'visual.media.equirect-sphere-viewport',
      category: 'visual',
      label: 'Equirect Sphere Viewport',
      description:
        'Three.js interior sphere preview for 360° equirect sources — orbit, POV framing, program output mirror',
      isVisual: true,
      inputs: [{ id: 'metadata', name: 'metadata', dataType: 'row' }],
      outputs: [{ id: 'camera-state', name: 'cameraState', dataType: 'row' }],
      properties: [
        { key: 'label', label: 'Label', type: 'string', default: 'Equirect sphere viewport' },
        ...MEDIA_DISPLAY_SIZE_PROPERTIES,
        { key: 'flipInterior', label: 'Flip interior', type: 'boolean', default: true },
        { key: 'yaw', label: 'Yaw', type: 'number', default: 0 },
        { key: 'pitch', label: 'Pitch', type: 'number', default: -8 },
        { key: 'horizontalFov', label: 'Horizontal FOV', type: 'number', default: 75 },
        { key: 'outputWidth', label: 'Output width', type: 'number', default: 1280 },
        { key: 'outputHeight', label: 'Output height', type: 'number', default: 720 },
        { key: 'minHorizontalFov', label: 'Min horizontal FOV', type: 'number', default: 30 },
        { key: 'maxHorizontalFov', label: 'Max horizontal FOV', type: 'number', default: 360 },
      ],
    },
    metadata: {
      paletteGroupId: 'media-authoring',
      previewKind: 'plugin',
    },
  },
  {
    id: 'media.flat-video-viewport',
    definition: {
      type: 'visual.media.flat-video-viewport',
      category: 'visual',
      label: 'Flat Video Viewport',
      description: 'Interactive crop rectangle on flat 2D video with live output mirror',
      isVisual: true,
      inputs: [{ id: 'metadata', name: 'metadata', dataType: 'row' }],
      outputs: [{ id: 'crop-region', name: 'cropRegion', dataType: 'row' }],
      properties: [
        { key: 'label', label: 'Label', type: 'string', default: 'Flat video viewport' },
        ...MEDIA_DISPLAY_SIZE_PROPERTIES,
        { key: 'cropX', label: 'Crop X', type: 'number', default: DEFAULT_EQUIRECT_FLAT_CROP.cropX },
        { key: 'cropY', label: 'Crop Y', type: 'number', default: DEFAULT_EQUIRECT_FLAT_CROP.cropY },
        {
          key: 'cropWidth',
          label: 'Crop width',
          type: 'number',
          default: DEFAULT_EQUIRECT_FLAT_CROP.cropWidth,
        },
        {
          key: 'cropHeight',
          label: 'Crop height',
          type: 'number',
          default: DEFAULT_EQUIRECT_FLAT_CROP.cropHeight,
        },
        {
          key: 'outputWidth',
          label: 'Output width',
          type: 'number',
          default: DEFAULT_EQUIRECT_FLAT_CROP.outputWidth,
        },
        {
          key: 'outputHeight',
          label: 'Output height',
          type: 'number',
          default: DEFAULT_EQUIRECT_FLAT_CROP.outputHeight,
        },
        { key: 'lockAspectRatio', label: 'Lock aspect ratio', type: 'boolean', default: true },
      ],
    },
    metadata: {
      paletteGroupId: 'media-authoring',
      previewKind: 'plugin',
    },
  },
  {
    id: 'media.live-capture',
    definition: {
      type: 'visual.media.live-capture',
      category: 'visual',
      label: 'Live Capture',
      description: 'Capture live camera/mic during authoring and optionally in exported apps',
      isVisual: true,
      inputs: [],
      outputs: [
        { id: 'capture-blob', name: 'captureBlob', dataType: 'any' },
        { id: 'preview-url', name: 'previewUrl', dataType: 'string' },
      ],
      properties: [
        { key: 'label', label: 'Label', type: 'string', default: 'Live capture' },
        { key: 'includeInExport', label: 'Include in export', type: 'boolean', default: false },
        {
          key: 'facingMode',
          label: 'Camera',
          type: 'select',
          default: 'environment',
          options: [
            { label: 'Rear / environment', value: 'environment' },
            { label: 'Front / user', value: 'user' },
          ],
        },
        { key: 'audio', label: 'Capture audio', type: 'boolean', default: true },
      ],
    },
    metadata: {
      paletteGroupId: 'media-authoring',
      previewKind: 'plugin',
    },
  },
];
