import { defineRosettaElement } from '../../../lib/element-utils.js';

export const DB_ATTRIBUTION_NOTICE_TAG = 'rd-attribution-notice';

interface AttributionLink {
  label: string;
  href: string;
}

interface AttributionNoticePayload {
  kind?: string;
  summary?: string;
  links?: AttributionLink[];
  license?: string;
}

export class RdAttributionNoticeElement extends HTMLElement {
  static readonly tagName = DB_ATTRIBUTION_NOTICE_TAG;

  static get observedAttributes(): string[] {
    return ['notice'];
  }

  connectedCallback(): void {
    this.classList.add('rd-attribution-notice-host');
    this.render();
  }

  attributeChangedCallback(): void {
    this.render();
  }

  private render(): void {
    const raw = this.getAttribute('notice');
    if (!raw) {
      this.replaceChildren();
      return;
    }

    let notice: AttributionNoticePayload;
    try {
      notice = JSON.parse(raw) as AttributionNoticePayload;
    } catch {
      this.replaceChildren();
      return;
    }

    if (!notice.summary && !notice.kind) {
      this.replaceChildren();
      return;
    }

    const aside = document.createElement('aside');
    aside.className = 'rd-attribution-notice';
    aside.setAttribute('aria-label', notice.kind ? `${notice.kind} attribution` : 'Attribution');

    if (notice.kind) {
      const kind = document.createElement('p');
      kind.className = 'rd-attribution-notice__kind';
      kind.textContent = notice.kind;
      aside.append(kind);
    }

    if (notice.summary) {
      const summary = document.createElement('p');
      summary.className = 'rd-attribution-notice__summary';
      summary.textContent = notice.summary;
      aside.append(summary);
    }

    if (notice.links?.length) {
      const links = document.createElement('p');
      links.className = 'rd-attribution-notice__links';
      notice.links.forEach((link, index) => {
        if (index > 0) {
          links.append(' · ');
        }
        const anchor = document.createElement('a');
        anchor.href = link.href;
        anchor.textContent = link.label;
        anchor.rel = 'noopener noreferrer license';
        anchor.target = '_blank';
        links.append(anchor);
      });
      aside.append(links);
    }

    if (notice.license) {
      const license = document.createElement('p');
      license.className = 'rd-attribution-notice__license';
      license.textContent = `License: ${notice.license}`;
      aside.append(license);
    }

    this.replaceChildren(aside);
  }
}

export function registerRdAttributionNotice(): void {
  defineRosettaElement(DB_ATTRIBUTION_NOTICE_TAG, RdAttributionNoticeElement);
}
