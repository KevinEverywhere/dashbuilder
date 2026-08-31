import {
  buildEquirectExtractFilter,
  DEFAULT_EQUIRECT_FLAT_CROP,
  DEFAULT_EQUIRECT_SOURCE,
  wrapSignedDegrees,
} from '@rosettadash/core';
import { defineRosettaElement, type DashRow, readNumber, readString } from '../../../lib/element-utils.js';
import { applyShadowMount, ensureShadowBase, getShadowBase, loadShadowPairForTag } from '../../../lib/shadow-base.js';
import { loadTextResource } from '../../../lib/shadow-resources.js';

export const DB_EQUIRECT_VIEWPORT_TAG = 'rd-equirect-viewport';

export type EquirectPreviewMode = 'flat-crop' | 'rectilinear';

export class RdEquirectViewportElement extends HTMLElement {
  static readonly tagName = DB_EQUIRECT_VIEWPORT_TAG;

  private resourcesReady: Promise<void> | null = null;

  static get observedAttributes(): string[] {
    return [
      'label',
      'preview-mode',
      'source-width',
      'source-height',
      'crop-x',
      'crop-y',
      'crop-width',
      'crop-height',
      'output-width',
      'output-height',
      'yaw',
      'pitch',
      'horizontal-fov',
    ];
  }

  connectedCallback(): void {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
    }
    this.resourcesReady = this.mountShadow();
    void this.resourcesReady.then(() => {
      this.paint();
      this.emitCropRegion();
    });
  }

  attributeChangedCallback(): void {
    if (this.shadowRoot && this.resourcesReady) {
      void this.resourcesReady.then(() => {
        this.paint();
        this.emitCropRegion();
      });
    }
  }

  whenReady(): Promise<void> {
    return this.resourcesReady ?? Promise.resolve();
  }

  setProperty(name: string, value: unknown): void {
    const attrMap: Record<string, string> = {
      previewMode: 'preview-mode',
      sourceWidth: 'source-width',
      sourceHeight: 'source-height',
      cropX: 'crop-x',
      cropY: 'crop-y',
      cropWidth: 'crop-width',
      cropHeight: 'crop-height',
      outputWidth: 'output-width',
      outputHeight: 'output-height',
      horizontalFov: 'horizontal-fov',
    };

    const attr = attrMap[name] ?? name;
    if (value === null || value === undefined) {
      this.removeAttribute(attr);
    } else {
      this.setAttribute(attr, String(value));
    }
  }

  get previewMode(): EquirectPreviewMode {
    const mode = readString(this.getAttribute('preview-mode'), 'flat-crop');
    return mode === 'rectilinear' ? 'rectilinear' : 'flat-crop';
  }

  get label(): string {
    return readString(this.getAttribute('label'), 'Equirect viewport');
  }

  get cropRegion(): DashRow {
    return {
      cropX: this.cropX,
      cropY: this.cropY,
      cropWidth: this.cropWidth,
      cropHeight: this.cropHeight,
      outputWidth: this.outputWidth,
      outputHeight: this.outputHeight,
      yaw: this.yaw,
      pitch: this.pitch,
      horizontalFov: this.horizontalFov,
      previewMode: this.previewMode,
      filter: buildEquirectExtractFilter(this.previewMode, {
        cropX: this.cropX,
        cropY: this.cropY,
        cropWidth: this.cropWidth,
        cropHeight: this.cropHeight,
        outputWidth: this.outputWidth,
        outputHeight: this.outputHeight,
        yaw: this.yaw,
        pitch: this.pitch,
        horizontalFov: this.horizontalFov,
      }),
    };
  }

  private get sourceWidth(): number {
    return readNumber(this.getAttribute('source-width'), DEFAULT_EQUIRECT_SOURCE.width);
  }

  private get sourceHeight(): number {
    return readNumber(this.getAttribute('source-height'), DEFAULT_EQUIRECT_SOURCE.height);
  }

  private get cropX(): number {
    return readNumber(this.getAttribute('crop-x'), DEFAULT_EQUIRECT_FLAT_CROP.cropX);
  }

  private get cropY(): number {
    return readNumber(this.getAttribute('crop-y'), DEFAULT_EQUIRECT_FLAT_CROP.cropY);
  }

  private get cropWidth(): number {
    return readNumber(this.getAttribute('crop-width'), DEFAULT_EQUIRECT_FLAT_CROP.cropWidth);
  }

  private get cropHeight(): number {
    return readNumber(this.getAttribute('crop-height'), DEFAULT_EQUIRECT_FLAT_CROP.cropHeight);
  }

  private get outputWidth(): number {
    return readNumber(this.getAttribute('output-width'), DEFAULT_EQUIRECT_FLAT_CROP.outputWidth);
  }

  private get outputHeight(): number {
    return readNumber(this.getAttribute('output-height'), DEFAULT_EQUIRECT_FLAT_CROP.outputHeight);
  }

  private get yaw(): number {
    return wrapSignedDegrees(readNumber(this.getAttribute('yaw'), 0));
  }

  private get pitch(): number {
    return readNumber(this.getAttribute('pitch'), 0);
  }

  private get horizontalFov(): number {
    return readNumber(this.getAttribute('horizontal-fov'), 90);
  }

  private async mountShadow(): Promise<void> {
    const root = this.shadowRoot;
    if (!root || root.querySelector('[data-ref="root"]')) {
      return;
    }
    const pair = await loadShadowPairForTag(
      DB_EQUIRECT_VIEWPORT_TAG,
      './rd-equirect-viewport.html',
      './rd-equirect-viewport.css',
    );
    const panelCss = await loadTextResource('../../../lib/panel.css', getShadowBase(DB_EQUIRECT_VIEWPORT_TAG));
    applyShadowMount(root, { html: pair.html, css: `${panelCss}\n${pair.css}` });
  }

  private paint(): void {
    const root = this.shadowRoot;
    if (!root) {
      return;
    }

    const cropLeftPct = (this.cropX / this.sourceWidth) * 100;
    const cropTopPct = (this.cropY / this.sourceHeight) * 100;
    const cropWidthPct = (this.cropWidth / this.sourceWidth) * 100;
    const cropHeightPct = (this.cropHeight / this.sourceHeight) * 100;

    const flatPreview = `
      <div class="equirect-frame" style="aspect-ratio: ${this.sourceWidth} / ${this.sourceHeight}">
        <div class="equirect-frame__crop" style="left:${cropLeftPct}%;top:${cropTopPct}%;width:${cropWidthPct}%;height:${cropHeightPct}%"></div>
      </div>
    `;

    const rectilinearPreview = `
      <div class="rectilinear-preview">
        <div class="rectilinear-preview__cone" style="transform: rotateY(${this.yaw}deg) rotateX(${-this.pitch}deg)"></div>
        <dl class="rectilinear-preview__meta">
          <div><dt>Yaw</dt><dd>${this.yaw}°</dd></div>
          <div><dt>Pitch</dt><dd>${this.pitch}°</dd></div>
          <div><dt>FOV</dt><dd>${this.horizontalFov}°</dd></div>
        </dl>
      </div>
    `;

    const labelEl = root.querySelector('[data-ref="label"]');
    const modeEl = root.querySelector('[data-ref="mode"]');
    if (labelEl) {
      labelEl.textContent = this.label;
    }
    if (modeEl) {
      modeEl.textContent = this.previewMode === 'flat-crop' ? 'Flat crop' : 'Rectilinear';
    }
    const preview = root.querySelector('[data-ref="preview"]');
    if (preview) {
      preview.innerHTML = this.previewMode === 'flat-crop' ? flatPreview : rectilinearPreview;
    }
    const filterEl = root.querySelector('[data-ref="filter"]');
    if (filterEl) {
      filterEl.textContent = String(this.cropRegion['filter']);
    }
    const outputEl = root.querySelector('[data-ref="output"]');
    if (outputEl) {
      outputEl.textContent = `Output ${this.outputWidth}×${this.outputHeight}`;
    }
  }

  private emitCropRegion(): void {
    this.dispatchEvent(
      new CustomEvent('crop-region', {
        detail: this.cropRegion,
        bubbles: true,
        composed: true,
      }),
    );
  }
}

export function registerRdEquirectViewport(): void {
  ensureShadowBase(DB_EQUIRECT_VIEWPORT_TAG);
  defineRosettaElement(RdEquirectViewportElement.tagName, RdEquirectViewportElement);
}
