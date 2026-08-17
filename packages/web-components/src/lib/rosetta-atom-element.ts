import { readNumber, readString } from './element-utils.js';
import { escapeHtml } from './parse-link-items.js';

/** Light-DOM atom base — renders taxonomy BEM markup; opt-in styles from styles.css. */
export abstract class RosettaAtomElement extends HTMLElement {
  private eventsWired = false;

  connectedCallback(): void {
    this.paint();
    if (!this.eventsWired) {
      this.wireEvents();
      this.eventsWired = true;
    }
  }

  attributeChangedCallback(_name: string): void {
    if (this.isConnected) {
      this.paint();
    }
  }

  /** Complex props (arrays/objects) synced from framework hosts via setProperty. */
  setProperty(name: string, value: unknown): void {
    (this as Record<string, unknown>)[name] = value;
    if (value === undefined || value === null) {
      this.removeAttribute(name);
    } else if (typeof value === 'object') {
      this.setAttribute(name, JSON.stringify(value));
    } else {
      this.setAttribute(name, String(value));
    }
    if (this.isConnected) {
      this.paint();
    }
  }

  whenReady(): Promise<void> {
    return Promise.resolve();
  }

  protected paint(): void {
    const preserved = this.preserveLightDomChildren();
    this.innerHTML = this.buildMarkup();
    this.restoreLightDomChildren(preserved);
    this.afterPaint();
  }

  protected preserveLightDomChildren(): Node[] {
    return [...this.childNodes];
  }

  protected restoreLightDomChildren(nodes: Node[]): void {
    const slot = this.querySelector('[data-ref="slot"]');
    if (!slot) {
      return;
    }
    for (const node of nodes) {
      slot.appendChild(node);
    }
  }

  protected abstract buildMarkup(): string;

  protected wireEvents(): void {
    /* override in interactive atoms */
  }

  protected afterPaint(): void {
    /* override */
  }

  protected readAttr(name: string, fallback = ''): string {
    return readString(this.getAttribute(name), fallback);
  }

  protected readBoolAttr(name: string, fallback = false): boolean {
    if (!this.hasAttribute(name)) {
      return fallback;
    }
    const raw = this.getAttribute(name);
    if (raw === '' || raw === 'true') {
      return true;
    }
    if (raw === 'false') {
      return false;
    }
    return fallback;
  }

  protected readNumAttr(name: string, fallback: number): number {
    return readNumber(this.getAttribute(name), fallback);
  }

  protected parseJsonAttr<T>(name: string, fallback: T): T {
    const raw = this.getAttribute(name);
    if (!raw) {
      return fallback;
    }
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }

  protected esc(value: string): string {
    return escapeHtml(value);
  }

  protected dispatchDetail<T>(type: string, detail: T): void {
    this.dispatchEvent(new CustomEvent(type, { detail, bubbles: true, composed: true }));
  }
}

export { escapeHtml };
