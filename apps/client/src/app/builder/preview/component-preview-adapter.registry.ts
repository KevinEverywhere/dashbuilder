import { Injectable } from '@angular/core';

export type ComponentPreviewTemplateId =
  | 'status-badge'
  | 'metric-chip'
  | 'svg-inline'
  | 'svg-icon'
  | 'wasm-asset'
  | 'wasm-worker-host'
  | 'wasm-module'
  | 'wasm-media'
  | 'media-video-source'
  | 'media-equirect-viewport'
  | 'media-flat-video-viewport'
  | 'media-equirect-sphere-viewport'
  | 'media-live-capture'
  | '3d-bar-chart'
  | '3d-scatter'
  | '3d-scene'
  | '3d-gltf-model'
  | '3d-geo-globe';

@Injectable({ providedIn: 'root' })
export class ComponentPreviewAdapterRegistry {
  private readonly templates = new Map<string, ComponentPreviewTemplateId>();

  register(type: string, templateId: ComponentPreviewTemplateId): void {
    if (this.templates.has(type)) {
      throw new Error(`Preview adapter already registered for ${type}`);
    }
    this.templates.set(type, templateId);
  }

  getTemplateId(type: string): ComponentPreviewTemplateId | undefined {
    return this.templates.get(type);
  }

  has(type: string): boolean {
    return this.templates.has(type);
  }
}

export function registerDefaultComponentPreviewAdapters(
  registry: ComponentPreviewAdapterRegistry,
): void {
  registry.register('visual.plugin.status-badge', 'status-badge');
  registry.register('visual.plugin.metric-chip', 'metric-chip');
  registry.register('visual.svg.inline', 'svg-inline');
  registry.register('visual.svg.icon', 'svg-icon');
  registry.register('infra.wasm.asset', 'wasm-asset');
  registry.register('visual.wasm.worker-host', 'wasm-worker-host');
  registry.register('visual.wasm.module', 'wasm-module');
  registry.register('visual.wasm.media', 'wasm-media');
  registry.register('visual.media.video-source', 'media-video-source');
  registry.register('visual.media.equirect-viewport', 'media-equirect-viewport');
  registry.register('visual.media.flat-video-viewport', 'media-flat-video-viewport');
  registry.register('visual.media.equirect-sphere-viewport', 'media-equirect-sphere-viewport');
  registry.register('visual.media.live-capture', 'media-live-capture');
  registry.register('visual.display.3d-bar-chart', '3d-bar-chart');
  registry.register('visual.display.3d-scatter', '3d-scatter');
  registry.register('visual.display.3d-scene', '3d-scene');
  registry.register('visual.display.3d-gltf-model', '3d-gltf-model');
  registry.register('visual.display.3d-geo-globe', '3d-geo-globe');
}
