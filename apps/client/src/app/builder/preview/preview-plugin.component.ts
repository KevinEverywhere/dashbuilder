import { Component, computed, inject, input } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { buildEquirectExtractFilter, parseVideoDisplaySize, type ComponentNode } from '@rosettadash/core';
import type { ComponentPreviewTemplateId } from './component-preview-adapter.registry';
import { PreviewThreeVisualComponent } from './preview-three-visual.component';
import { NgStyle } from '@angular/common';

@Component({
  selector: 'app-preview-plugin',
  imports: [PreviewThreeVisualComponent, NgStyle],
  templateUrl: './preview-plugin.component.html',
  styleUrl: './preview-plugin.component.scss',
})
export class PreviewPluginComponent {
  readonly node = input.required<ComponentNode>();
  readonly templateId = input.required<ComponentPreviewTemplateId>();

  private readonly sanitizer = inject(DomSanitizer);

  protected readonly svgInlineMarkup = computed(() => {
    const mode = this.readString('sourceMode', 'inline');
    if (mode === 'url') {
      const url = this.readString('url');
      if (url) {
        return this.sanitizer.bypassSecurityTrustHtml(
          `<img src="${escapeAttribute(url)}" alt="${escapeAttribute(this.readString('ariaLabel', 'SVG graphic'))}" />`,
        );
      }
      return this.sanitizer.bypassSecurityTrustHtml(
        '<p class="preview-svg__placeholder">Set an SVG URL</p>',
      );
    }
    if (mode === 'path') {
      const path = this.readString('assetPath');
      if (path) {
        return this.sanitizer.bypassSecurityTrustHtml(
          `<p class="preview-svg__placeholder">Asset: ${escapeHtml(path)}</p>`,
        );
      }
      return this.sanitizer.bypassSecurityTrustHtml(
        '<p class="preview-svg__placeholder">Set a content-library asset path</p>',
      );
    }
    return this.sanitizer.bypassSecurityTrustHtml(this.readString('markup'));
  });

  protected readonly svgIconMarkup = computed(() =>
    this.sanitizer.bypassSecurityTrustHtml(this.readString('markup')),
  );

  protected readonly videoDisplayLabel = computed(() => {
    if (this.readBoolean('fullscreen')) {
      return 'Fullscreen';
    }
    const size = parseVideoDisplaySize(this.node().properties['displaySize']);
    return size ? `${size.width}×${size.height}` : '640×360';
  });

  protected readonly equirectCropStyle = computed(() => {
    const sourceWidth = Math.max(1, this.readNumber('sourceWidth', 4096));
    const sourceHeight = Math.max(1, this.readNumber('sourceHeight', 2048));
    const cropX = this.readNumber('cropX', 1508);
    const cropY = this.readNumber('cropY', 664);
    const cropWidth = this.readNumber('cropWidth', 1080);
    const cropHeight = this.readNumber('cropHeight', 720);
    return this.cropRectStyle(sourceWidth, sourceHeight, cropX, cropY, cropWidth, cropHeight);
  });

  protected readonly flatCropStyle = computed(() => {
    const sourceWidth = Math.max(1, this.readNumber('sourceWidth', 4096));
    const sourceHeight = Math.max(1, this.readNumber('sourceHeight', 2048));
    const cropX = this.readNumber('cropX', 1508);
    const cropY = this.readNumber('cropY', 664);
    const cropWidth = this.readNumber('cropWidth', 1080);
    const cropHeight = this.readNumber('cropHeight', 720);
    return this.cropRectStyle(sourceWidth, sourceHeight, cropX, cropY, cropWidth, cropHeight);
  });

  private cropRectStyle(
    sourceWidth: number,
    sourceHeight: number,
    cropX: number,
    cropY: number,
    cropWidth: number,
    cropHeight: number,
  ): Record<string, string> {
    return {
      left: `${(cropX / sourceWidth) * 100}%`,
      top: `${(cropY / sourceHeight) * 100}%`,
      width: `${(cropWidth / sourceWidth) * 100}%`,
      height: `${(cropHeight / sourceHeight) * 100}%`,
    };
  }

  protected readonly equirectOutputLabel = computed(
    () =>
      `${this.readNumber('outputWidth', 720)}×${this.readNumber('outputHeight', 480)}`,
  );

  protected readonly wasmMediaFilter = computed(() => {
    const operation = this.readString('operation', 'transcode');
    if (operation !== 'equirect-extract') {
      return '';
    }
    const mode = this.readString('extractionMode', 'flat-crop') as 'flat-crop' | 'rectilinear';
    return buildEquirectExtractFilter(mode, {
      cropX: this.readNumber('cropX', 1508),
      cropY: this.readNumber('cropY', 664),
      cropWidth: this.readNumber('cropWidth', 1080),
      cropHeight: this.readNumber('cropHeight', 720),
      outputWidth: this.readNumber('outputWidth', 720),
      outputHeight: this.readNumber('outputHeight', 480),
      yaw: this.readNumber('yaw', 0),
      pitch: this.readNumber('pitch', 0),
      horizontalFov: this.readNumber('horizontalFov', 90),
    });
  });

  protected readString(key: string, fallback = ''): string {
    const value = this.node().properties[key];
    return typeof value === 'string' ? value : fallback;
  }

  protected readNumber(key: string, fallback = 0): number {
    const value = this.node().properties[key];
    return typeof value === 'number' ? value : fallback;
  }

  protected readBoolean(key: string, fallback = false): boolean {
    const value = this.node().properties[key];
    return typeof value === 'boolean' ? value : fallback;
  }
}

function escapeAttribute(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
