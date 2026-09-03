import { defineRosettaElement, readNumber, readString } from '../../../lib/element-utils.js';
import { applyShadowMount, ensureShadowBase, loadShadowPairForTag } from '../../../lib/shadow-base.js';
import {
  buildYouTubeEmbedUrl,
  parseYouTubeVideoId,
} from './parse-youtube-id.js';

export const DB_YOUTUBE_EMBED_TAG = 'rd-youtube-embed';

/** Public props contract for visual/media/youtube-embed (all runtimes share this shape). */
export interface YoutubeEmbedProps {
  videoId?: string;
  url?: string;
  start?: number;
  autoplay?: boolean;
  mute?: boolean;
  controls?: boolean;
  title?: string;
  className?: string;
}

export class RdYoutubeEmbedElement extends HTMLElement {
  static readonly tagName = DB_YOUTUBE_EMBED_TAG;

  private resourcesReady: Promise<void> | null = null;

  static get observedAttributes(): string[] {
    return ['video-id', 'url', 'start', 'autoplay', 'mute', 'controls', 'embed-title'];
  }

  connectedCallback(): void {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
    }
    this.resourcesReady = this.mountShadow();
    void this.resourcesReady.then(() => this.paint());
  }

  attributeChangedCallback(): void {
    if (this.shadowRoot && this.resourcesReady) {
      void this.resourcesReady.then(() => this.paint());
    }
  }

  setProperty(name: string, value: unknown): void {
    (this as Record<string, unknown>)[name] = value;
    if (this.resourcesReady) {
      void this.resourcesReady.then(() => this.paint());
    }
  }

  whenReady(): Promise<void> {
    return this.resourcesReady ?? Promise.resolve();
  }

  get videoId(): string {
    return readString(this.getAttribute('video-id'), '');
  }

  set videoId(value: string) {
    if (value) {
      this.setAttribute('video-id', value);
    } else {
      this.removeAttribute('video-id');
    }
  }

  get url(): string {
    return readString(this.getAttribute('url'), '');
  }

  set url(value: string) {
    if (value) {
      this.setAttribute('url', value);
    } else {
      this.removeAttribute('url');
    }
  }

  get start(): number {
    return readNumber(this.getAttribute('start'), 0);
  }

  get autoplay(): boolean {
    return this.hasAttribute('autoplay');
  }

  get mute(): boolean {
    return this.hasAttribute('mute');
  }

  get controls(): boolean {
    return !this.hasAttribute('controls') || this.getAttribute('controls') !== 'false';
  }

  get embedTitle(): string {
    return readString(this.getAttribute('embed-title'), 'YouTube video');
  }

  set embedTitle(value: string) {
    if (value) {
      this.setAttribute('embed-title', value);
    } else {
      this.removeAttribute('embed-title');
    }
  }

  private async mountShadow(): Promise<void> {
    const root = this.shadowRoot;
    if (!root || root.querySelector('[data-ref="root"]')) {
      return;
    }
    const pair = await loadShadowPairForTag(
      DB_YOUTUBE_EMBED_TAG,
      './rd-youtube-embed.html',
      './rd-youtube-embed.css',
    );
    applyShadowMount(root, pair);
  }

  private resolveVideoId(): string | null {
    return parseYouTubeVideoId(this.videoId) ?? parseYouTubeVideoId(this.url);
  }

  private paint(): void {
    const root = this.shadowRoot;
    if (!root) {
      return;
    }

    const iframe = root.querySelector<HTMLIFrameElement>('[data-ref="iframe"]');
    const empty = root.querySelector<HTMLElement>('[data-ref="empty"]');
    const attribution = root.querySelector<HTMLElement>('[data-ref="attribution"]');
    const watchLink = root.querySelector<HTMLAnchorElement>('[data-ref="watch-link"]');
    if (!iframe || !empty) {
      return;
    }

    const id = this.resolveVideoId();
    if (!id) {
      iframe.removeAttribute('src');
      iframe.hidden = true;
      empty.hidden = false;
      attribution?.setAttribute('hidden', '');
      return;
    }

    iframe.hidden = false;
    empty.hidden = true;
    attribution?.removeAttribute('hidden');
    if (watchLink) {
      watchLink.href = `https://www.youtube.com/watch?v=${id}`;
      watchLink.textContent = 'Watch on YouTube';
    }
    iframe.title = this.embedTitle;
    (iframe as HTMLIFrameElement & { credentialless?: boolean }).credentialless = true;
    iframe.src = buildYouTubeEmbedUrl(id, {
      start: this.start,
      autoplay: this.autoplay,
      mute: this.mute,
      controls: this.controls,
    });
  }
}

export function registerRdYoutubeEmbed(): void {
  ensureShadowBase(DB_YOUTUBE_EMBED_TAG);
  defineRosettaElement(DB_YOUTUBE_EMBED_TAG, RdYoutubeEmbedElement);
}
