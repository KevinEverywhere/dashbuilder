/** Helpers for `@rosettadash/web-components` Storybook stories. */

export function itemsAttr(items: readonly { label: string; href: string }[]): string {
  return JSON.stringify(items);
}

export interface EventLogOptions {
  /** CSS selector for the element that emits events (default: first custom element in mount). */
  selector?: string;
  /** Custom event names to log (detail JSON appended to log panel). */
  events: string[];
  /** Optional hint shown above the log when no events yet. */
  hint?: string;
}

/**
 * Mount HTML and append a live event log panel.
 * Use in Storybook `render` when returning a DOM node.
 */
export function mountWithEventLog(html: string, options: EventLogOptions): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'rd-story-mount';
  wrap.innerHTML = html;

  const log = document.createElement('pre');
  log.className = 'rd-story-event-log';
  log.setAttribute('aria-live', 'polite');
  log.textContent = options.hint ?? 'Interact with the component — events appear here.';

  const target =
    (options.selector ? wrap.querySelector(options.selector) : wrap.querySelector('[class^="rd-"], rd-accordion, rd-link-list, rd-accordion-link-list, rd-video-source, rd-equirect-viewport, rd-equirect-sphere-viewport, rd-flat-video-viewport, rd-wasm-media')) ??
    wrap.firstElementChild;

  for (const name of options.events) {
    target?.addEventListener(name, (event) => {
      const detail = (event as CustomEvent).detail;
      const payload = detail === undefined ? '(no detail)' : JSON.stringify(detail, null, 2);
      log.textContent = `${name}\n${payload}`;
    });
  }

  wrap.appendChild(log);
  return wrap;
}

/** Shared inline styles for media viewport stories. */
export const equirectViewportStyle =
  'display:block;width:100%;max-width:36rem;margin:0 auto;';

export function equirectInteractiveWorkbench(initial: {
  yaw?: number;
  pitch?: number;
  horizontalFov?: number;
  previewMode?: 'flat-crop' | 'rectilinear';
}): HTMLElement {
  const yaw = initial.yaw ?? 0;
  const pitch = initial.pitch ?? 0;
  const fov = initial.horizontalFov ?? 75;
  const mode = initial.previewMode ?? 'rectilinear';

  const wrap = document.createElement('div');
  wrap.className = 'rd-story-workbench';
  wrap.innerHTML = `
    <rd-equirect-viewport
      data-role="viewport"
      label="Interactive program lens"
      preview-mode="${mode}"
      style="${equirectViewportStyle}"
      source-width="3840"
      source-height="1920"
      output-width="1280"
      output-height="720"
      yaw="${yaw}"
      pitch="${pitch}"
      horizontal-fov="${fov}"
    ></rd-equirect-viewport>
    <fieldset class="rd-story-controls">
      <legend>Adjust rectilinear framing</legend>
      <label>Yaw <input type="range" data-role="yaw" min="-180" max="180" step="1" value="${yaw}" /> <output data-out-yaw>${yaw}°</output></label>
      <label>Pitch <input type="range" data-role="pitch" min="-90" max="90" step="1" value="${pitch}" /> <output data-out-pitch>${pitch}°</output></label>
      <label>FOV <input type="range" data-role="fov" min="30" max="120" step="1" value="${fov}" /> <output data-out-fov>${fov}°</output></label>
    </fieldset>
  `;

  const viewport = wrap.querySelector('[data-role="viewport"]') as HTMLElement | null;
  const bind = (role: string, attr: string, outSel: string) => {
    const input = wrap.querySelector(`[data-role="${role}"]`) as HTMLInputElement | null;
    const out = wrap.querySelector(outSel);
    input?.addEventListener('input', () => {
      const value = input.value;
      viewport?.setAttribute(attr, value);
      if (out) {
        out.textContent = `${value}°`;
      }
    });
  };

  bind('yaw', 'yaw', '[data-out-yaw]');
  bind('pitch', 'pitch', '[data-out-pitch]');
  bind('fov', 'horizontal-fov', '[data-out-fov]');

  const log = document.createElement('pre');
  log.className = 'rd-story-event-log';
  log.textContent = 'Move sliders — crop-region events stream here.';
  viewport?.addEventListener('crop-region', (event) => {
    const detail = (event as CustomEvent).detail;
    log.textContent = `crop-region\n${JSON.stringify(detail, null, 2)}`;
  });
  wrap.appendChild(log);

  return wrap;
}
