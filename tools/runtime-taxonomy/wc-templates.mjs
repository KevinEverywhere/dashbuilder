/**
 * Generate @rosettadash/web-components runtime atoms from taxonomy manifest kinds.
 * Light-DOM CEs sharing BEM + Props contracts with framework runtimes.
 */
import { KIND_PROPS } from './react-templates.mjs';

/** @param {import('./manifest.mjs').RuntimeAtomEntry} entry */
export function tagNameForEntry(entry, bemBlock) {
  return entry.testId ?? bemBlock;
}

/** @param {import('./manifest.mjs').RuntimeAtomEntry} entry */
export function classNameForEntry(entry) {
  const ctor = entry.exportName.replace(/([a-z])([A-Z])/g, '$1-$2');
  return `Rd${entry.exportName}Element`;
}

/** @param {import('./manifest.mjs').RuntimeAtomEntry} entry */
export function registerFnName(entry) {
  return `registerRd${entry.exportName}`;
}

/** @param {import('./manifest.mjs').RuntimeAtomEntry} entry */
export function tagConstName(entry) {
  return `RD_${entry.exportName.replace(/([a-z])([A-Z])/g, '$1_$2').toUpperCase()}_TAG`;
}

const INFRA_KINDS = new Set(['infra-env', 'infra-db', 'infra-server']);

/** @param {import('./manifest.mjs').RuntimeAtomEntry} entry */
export function shouldGenerateWc(entry) {
  if (entry.pattern !== 'native') {
    return false;
  }
  if (entry.wcImport) {
    return false;
  }
  if (INFRA_KINDS.has(entry.kind)) {
    return false;
  }
  if (entry.subpath.startsWith('infra/')) {
    return false;
  }
  return true;
}

function libImportPrefix(subpath) {
  const depth = subpath.split('/').length;
  return '../'.repeat(depth) + 'lib/';
}

/** @param {import('./manifest.mjs').RuntimeAtomEntry} entry */
export function renderNativeWcComponent(entry, bemBlock) {
  const tag = tagNameForEntry(entry, bemBlock);
  const className = classNameForEntry(entry);
  const registerFn = registerFnName(entry);
  const tagConst = tagConstName(entry);
  const propsInterface = (KIND_PROPS[entry.kind] ?? KIND_PROPS.fallback)(entry.exportName);
  const markupFn = KIND_MARKUP[entry.kind] ?? KIND_MARKUP.fallback;
  const wireFn = KIND_WIRE[entry.kind] ?? '';
  const observed = KIND_OBSERVED[entry.kind] ?? [];
  const lib = libImportPrefix(entry.subpath);

  return `import { defineRosettaElement } from '${lib}element-utils.js';
import { RosettaAtomElement } from '${lib}rosetta-atom-element.js';

export const ${tagConst} = '${tag}';

${propsInterface.replace(/ReactNode/g, 'unknown').replace(/CSSProperties/g, 'Record<string, string>')}

/** @rosettadash/web-components/${entry.subpath} — ${entry.type} */
export class ${className} extends RosettaAtomElement {
  static readonly tagName = ${tagConst};

  static get observedAttributes(): string[] {
    return ${JSON.stringify(observed)};
  }

  protected buildMarkup(): string {
${markupFn(bemBlock, entry)}
  }
${wireFn ? `
  protected override wireEvents(): void {
${wireFn}
  }
` : ''}}

export function ${registerFn}(): void {
  defineRosettaElement(${tagConst}, ${className});
}
`;
}

/** @param {import('./manifest.mjs').RuntimeAtomEntry} entry */
export function renderNativeWcSpec(entry, bemBlock) {
  const tag = tagNameForEntry(entry, bemBlock);
  const className = classNameForEntry(entry);
  const registerFn = registerFnName(entry);
  const tagConst = tagConstName(entry);
  const fileBase = entry.exportName.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();

  return `import { ${registerFn}, ${tagConst}, ${className} } from './rd-${fileBase}.js';

describe('${tag}', () => {
  beforeAll(() => {
    ${registerFn}();
  });

  it('registers the custom element', () => {
    expect(customElements.get(${tagConst})).toBe(${className});
  });

  it('renders taxonomy-aligned BEM root block', () => {
    const el = document.createElement(${tagConst});
    document.body.appendChild(el);
    const root = el.matches('[data-testid="${bemBlock}"]') ? el : el.querySelector('[data-testid="${bemBlock}"]');
    expect(root).toBeTruthy();
    el.remove();
  });
});
`;
}

/** @param {import('./manifest.mjs').RuntimeAtomEntry} entry */
export function renderWcIndex(entry) {
  const fileBase = entry.exportName.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  return `export type { ${entry.exportName}Props } from './rd-${fileBase}.js';
export { ${registerFnName(entry)}, ${tagConstName(entry)}, ${classNameForEntry(entry)} } from './rd-${fileBase}.js';
`;
}

const KIND_OBSERVED = {
  'text-input': ['label', 'placeholder', 'required', 'value', 'default-value'],
  'select-input': ['label', 'placeholder', 'options', 'value'],
  'number-input': ['label', 'placeholder', 'min', 'max', 'step', 'value'],
  'checkbox-input': ['label', 'checked', 'default-checked'],
  'textarea-input': ['label', 'placeholder', 'rows', 'value'],
  'date-range': ['label', 'start-date', 'end-date', 'preset-label'],
  'time-preset': ['label', 'presets', 'active-preset-id'],
  'data-table': ['title', 'rows', 'columns'],
  'detail-panel': ['title', 'empty-message'],
  'kpi-card': ['title', 'value', 'delta', 'format'],
  'loading-skeleton': ['lines'],
  timer: ['label', 'mode', 'interval-ms', 'tick-count'],
  'line-chart': ['title', 'points'],
  'bar-chart': ['title', 'bars'],
  'pie-chart': ['title'],
  'layout-grid': ['title', 'columns', 'gap'],
  'layout-flex': ['title', 'direction', 'gap', 'density'],
  'layout-tabs': ['title', 'tabs', 'active-tab-id'],
  'layout-modal': ['title', 'body', 'confirm-label', 'open'],
  'layout-collapsible': ['title', 'open', 'default-open'],
  'layout-scroll-region': ['title', 'max-height', 'overlay-scrollbar'],
  'role-gate': ['label', 'allowed-roles', 'status-text', 'current-role', 'hidden-status-text'],
  'person-invite': ['email-placeholder'],
  'role-assign': ['summary', 'role-options'],
  'news-select': ['label', 'placeholder', 'options', 'value'],
  'news-search-box': ['label', 'placeholder', 'value'],
  'news-results-table': ['title', 'rows'],
  'news-article-detail': ['title', 'empty-message'],
  'status-badge': ['status-text', 'tone'],
  'metric-chip': ['chip-label', 'chip-value'],
  'three-host': ['title', 'mode', 'texture-url', 'markers', 'selected-id'],
  'svg-inline': ['markup', 'width', 'height'],
  'svg-icon': ['markup', 'title', 'color', 'size'],
  'live-capture': ['label'],
  'wasm-asset': ['asset-path', 'glue-path'],
  'wasm-worker-host': ['worker-label', 'worker-status'],
  'wasm-module': ['module-label', 'export-name'],
};

/** @type {Record<string, (bem: string, entry: object) => string>} */
const KIND_MARKUP = {
  'text-input': (bem) => `    const label = this.readAttr('label');
    const placeholder = this.readAttr('placeholder');
    const value = this.readAttr('value') || this.readAttr('default-value');
    const required = this.hasAttribute('required') ? ' required' : '';
    return \`
      <section class="${bem}" data-testid="${bem}">
        \${label ? \`<span class="rd-field__label" id="\${this.id || '${bem}'}-label">\${this.esc(label)}</span>\` : ''}
        <input type="text" class="rd-input" data-ref="input" placeholder="\${this.esc(placeholder)}" value="\${this.esc(value)}"\${required}\${label ? \` aria-labelledby="\${this.id || '${bem}'}-label"\` : ''} />
        <div data-ref="slot"></div>
      </section>\`;`,

  'select-input': (bem) => `    const label = this.readAttr('label');
    const placeholder = this.readAttr('placeholder', 'Select…');
    const value = this.readAttr('value');
    const options = this.parseJsonAttr<Array<{ value: string; label: string }>>('options', []);
    const opts = options.map((o) => \`<option value="\${this.esc(o.value)}"\${o.value === value ? ' selected' : ''}>\${this.esc(o.label)}</option>\`).join('');
    return \`
      <section class="${bem}" data-testid="${bem}">
        \${label ? \`<span class="rd-field__label">\${this.esc(label)}</span>\` : ''}
        <select class="rd-select" data-ref="select" aria-label="\${this.esc(label || 'Select')}">
          <option value="">\${this.esc(placeholder)}</option>\${opts}
        </select>
        <div data-ref="slot"></div>
      </section>\`;`,

  'number-input': (bem) => `    const label = this.readAttr('label');
    const placeholder = this.readAttr('placeholder');
    const value = this.readAttr('value');
    const min = this.getAttribute('min') ?? '';
    const max = this.getAttribute('max') ?? '';
    const step = this.getAttribute('step') ?? '';
    return \`
      <section class="${bem}" data-testid="${bem}">
        \${label ? \`<span class="rd-field__label">\${this.esc(label)}</span>\` : ''}
        <input type="number" class="rd-input" data-ref="input" placeholder="\${this.esc(placeholder)}" value="\${this.esc(value)}"\${min ? \` min="\${min}"\` : ''}\${max ? \` max="\${max}"\` : ''}\${step ? \` step="\${step}"\` : ''} aria-label="\${this.esc(label || 'Number')}" />
        <div data-ref="slot"></div>
      </section>\`;`,

  'checkbox-input': (bem) => `    const label = this.readAttr('label');
    const checked = this.readBoolAttr('checked') || this.readBoolAttr('default-checked');
    return \`
      <label class="${bem} rd-field--checkbox" data-testid="${bem}">
        <input type="checkbox" class="rd-checkbox" data-ref="input"\${checked ? ' checked' : ''} aria-label="\${this.esc(label || 'Checkbox')}" />
        \${label ? \`<span class="rd-field__label">\${this.esc(label)}</span>\` : ''}
        <span data-ref="slot"></span>
      </label>\`;`,

  'textarea-input': (bem) => `    const label = this.readAttr('label');
    const placeholder = this.readAttr('placeholder');
    const value = this.readAttr('value');
    const rows = this.readNumAttr('rows', 4);
    return \`
      <section class="${bem}" data-testid="${bem}">
        \${label ? \`<span class="rd-field__label">\${this.esc(label)}</span>\` : ''}
        <textarea class="rd-textarea" data-ref="input" rows="\${rows}" placeholder="\${this.esc(placeholder)}" aria-label="\${this.esc(label || 'Textarea')}">\${this.esc(value)}</textarea>
        <div data-ref="slot"></div>
      </section>\`;`,

  'date-range': (bem) => `    const label = this.readAttr('label');
    const startDate = this.readAttr('start-date');
    const endDate = this.readAttr('end-date');
    const presetLabel = this.readAttr('preset-label');
    return \`
      <section class="${bem}" data-testid="${bem}">
        \${label ? \`<span class="rd-field__label">\${this.esc(label)}</span>\` : ''}
        <div class="rd-date-range__controls">
          <input type="date" class="rd-input" data-ref="start" value="\${this.esc(startDate)}" aria-label="Start date" />
          <span class="rd-date-range__sep">to</span>
          <input type="date" class="rd-input" data-ref="end" value="\${this.esc(endDate)}" aria-label="End date" />
        </div>
        \${presetLabel ? \`<span class="rd-date-range__preset">\${this.esc(presetLabel)}</span>\` : ''}
        <div data-ref="slot"></div>
      </section>\`;`,

  'time-preset': (bem) => `    const label = this.readAttr('label');
    const active = this.readAttr('active-preset-id');
    const presets = this.parseJsonAttr<Array<{ id: string; label: string }>>('presets', []);
    const buttons = presets.map((p) => \`<button type="button" class="rd-time-preset__button\${p.id === active ? ' rd-time-preset__button--active' : ''}" data-preset-id="\${this.esc(p.id)}">\${this.esc(p.label)}</button>\`).join('');
    return \`
      <section class="${bem}" data-testid="${bem}">
        \${label ? \`<span class="rd-field__label">\${this.esc(label)}</span>\` : ''}
        <div class="rd-time-preset__buttons" role="group" aria-label="\${this.esc(label || 'Time presets')}">\${buttons}</div>
        <div data-ref="slot"></div>
      </section>\`;`,

  'data-table': (bem) => `    const title = this.readAttr('title', 'Data table');
    const rows = this.parseJsonAttr<Array<Record<string, string | number | undefined>>>('rows', []);
    const body = rows.map((row) => \`<tr data-row-id="\${this.esc(String(row['id'] ?? ''))}"><td>\${this.esc(String(row['name'] ?? ''))}</td><td>\${this.esc(String(row['status'] ?? ''))}</td><td>\${this.esc(String(row['amount'] ?? ''))}</td><td>\${this.esc(String(row['date'] ?? ''))}</td></tr>\`).join('');
    return \`
      <section class="${bem} rd-table" data-testid="${bem}">
        <header class="rd-table__header"><span>\${this.esc(title)}</span></header>
        <div class="rd-table__scroll">
          <table class="rd-table__table">
            <thead><tr><th>Name</th><th>Status</th><th>Amount</th><th>Date</th></tr></thead>
            <tbody>\${body}</tbody>
          </table>
        </div>
        <div data-ref="slot"></div>
      </section>\`;`,

  'detail-panel': (bem) => `    const title = this.readAttr('title', 'Details');
    const empty = this.readAttr('empty-message', 'Select a row to view details');
    return \`
      <section class="${bem} rd-detail" data-testid="${bem}">
        <header class="rd-detail__header"><span>\${this.esc(title)}</span></header>
        <p class="rd-detail__empty">\${this.esc(empty)}</p>
        <div class="rd-detail__body" data-ref="slot"></div>
      </section>\`;`,

  'kpi-card': (bem) => `    const title = this.readAttr('title', 'Metric');
    const value = this.readAttr('value', '—');
    const delta = this.readAttr('delta');
    return \`
      <article class="${bem}" data-testid="${bem}">
        <span class="${bem}__title">\${this.esc(title)}</span>
        <span class="${bem}__value">\${this.esc(value)}</span>
        \${delta ? \`<span class="${bem}__delta">\${this.esc(delta)}</span>\` : ''}
        <div data-ref="slot"></div>
      </article>\`;`,

  'loading-skeleton': (bem) => `    const lines = this.readNumAttr('lines', 4);
    const rows = Array.from({ length: lines }, (_, i) => \`<span class="${bem}__line\${i === 2 ? ' ${bem}__line--short' : ''}"></span>\`).join('');
    return \`
      <section class="${bem}" data-testid="${bem}">\${rows}<div data-ref="slot"></div></section>\`;`,

  timer: (bem) => `    const label = this.readAttr('label');
    const tickCount = this.readAttr('tick-count', '0');
    return \`
      <section class="${bem}" data-testid="${bem}">
        \${label ? \`<span class="${bem}__label">\${this.esc(label)}</span>\` : ''}
        <span class="${bem}__value">\${this.esc(tickCount)} ticks</span>
        <div data-ref="slot"></div>
      </section>\`;`,

  'line-chart': (bem) => `    const title = this.readAttr('title', 'Line chart');
    const points = this.parseJsonAttr<Array<{ x?: string | number; y: number }>>('points', []);
    const series = points.length
      ? points
      : [{ y: 80 }, { y: 60 }, { y: 65 }, { y: 40 }, { y: 45 }, { y: 20 }, { y: 30 }];
    const ys = series.map((p) => p.y);
    const minY = Math.min(0, ...ys);
    const maxY = Math.max(...ys);
    const rangeY = maxY - minY || 1;
    const last = Math.max(series.length - 1, 1);
    const polyline = series
      .map((p, i) => \`\${(i / last) * 240},\${88 - ((p.y - minY) / rangeY) * 72}\`)
      .join(' ');
    return \`
      <section class="${bem}" data-testid="${bem}" role="img" aria-label="\${this.esc(title)}">
        <header class="${bem}__header"><span>\${this.esc(title)}</span></header>
        <div class="${bem}__body">
          <svg viewBox="0 0 240 96" class="${bem}__svg" aria-hidden="true">
            <polyline class="${bem}__line" points="\${polyline}" />
          </svg>
        </div>
        <div data-ref="slot"></div>
      </section>\`;`,

  'bar-chart': (bem) => `    const title = this.readAttr('title', 'Bar chart');
    const barsData = this.parseJsonAttr<Array<{ label?: string; value: number }>>('bars', []);
    const series = barsData.length
      ? barsData
      : [{ value: 40 }, { value: 65 }, { value: 55 }, { value: 80 }, { value: 48 }];
    const max = Math.max(...series.map((b) => b.value), 1);
    const bars = series
      .map((b) => \`<div class="${bem}__bar-wrap"><div class="${bem}__bar" style="height:\${Math.round((b.value / max) * 100)}%"></div></div>\`)
      .join('');
    return \`
      <section class="${bem}" data-testid="${bem}" role="img" aria-label="\${this.esc(title)}">
        <header class="${bem}__header"><span>\${this.esc(title)}</span></header>
        <div class="${bem}__bars" aria-hidden="true">\${bars}</div>
        <div data-ref="slot"></div>
      </section>\`;`,

  'pie-chart': (bem) => `    const title = this.readAttr('title', 'Pie chart');
    return \`
      <section class="${bem}" data-testid="${bem}">
        <header class="${bem}__header"><span>\${this.esc(title)}</span></header>
        <div class="${bem}__pie" aria-hidden="true"></div>
        <div data-ref="slot"></div>
      </section>\`;`,

  'layout-grid': (bem) => `    const title = this.readAttr('title');
    const columns = this.readNumAttr('columns', 3);
    const gap = this.readAttr('gap', '12');
    return \`
      <section class="${bem}" data-testid="${bem}">
        \${title ? \`<span class="${bem}__title">\${this.esc(title)}</span>\` : ''}
        <div class="${bem}__grid" data-ref="slot" style="grid-template-columns:repeat(\${columns},1fr);gap:\${gap}px"></div>
      </section>\`;`,

  'layout-flex': (bem) => `    const title = this.readAttr('title');
    const direction = this.readAttr('direction', 'row');
    const gap = this.readAttr('gap', '12');
    return \`
      <section class="${bem}" data-testid="${bem}">
        \${title ? \`<span class="${bem}__title">\${this.esc(title)}</span>\` : ''}
        <div class="${bem}__flex" data-ref="slot" style="display:flex;flex-direction:\${direction};gap:\${gap}px"></div>
      </section>\`;`,

  'layout-tabs': (bem) => `    const title = this.readAttr('title');
    const active = this.readAttr('active-tab-id');
    const tabs = this.parseJsonAttr<Array<{ id: string; label: string }>>('tabs', []);
    const tabButtons = tabs.map((tab) => \`<button type="button" role="tab" class="${bem}__tab\${tab.id === active ? ' ${bem}__tab--active' : ''}" data-tab-id="\${this.esc(tab.id)}" aria-selected="\${tab.id === active ? 'true' : 'false'}">\${this.esc(tab.label)}</button>\`).join('');
    return \`
      <section class="${bem} rd-tabs" data-testid="${bem}">
        \${title ? \`<span class="${bem}__title">\${this.esc(title)}</span>\` : ''}
        <div class="rd-tabs__tabs" role="tablist">\${tabButtons}</div>
        <div class="rd-tabs__panel" data-ref="slot"></div>
      </section>\`;`,

  'layout-modal': (bem) => `    const title = this.readAttr('title', 'Dialog');
    const body = this.readAttr('body');
    const confirm = this.readAttr('confirm-label', 'Confirm');
    const open = this.readBoolAttr('open', true);
    if (!open) {
      return \`<section class="${bem}" data-testid="${bem}" hidden></section>\`;
    }
    return \`
      <section class="${bem}" data-testid="${bem}" role="dialog" aria-modal="true" aria-labelledby="${bem}-title">
        <div class="${bem}__dialog">
          <span class="${bem}__title" id="${bem}-title">\${this.esc(title)}</span>
          \${body ? \`<p class="${bem}__body">\${this.esc(body)}</p>\` : ''}
          <button type="button" class="${bem}__confirm rd-button" data-ref="confirm">\${this.esc(confirm)}</button>
          <div data-ref="slot"></div>
        </div>
      </section>\`;`,

  'layout-collapsible': (bem) => `    const title = this.readAttr('title', 'Section');
    const open = this.readBoolAttr('open') || this.readBoolAttr('default-open');
    return \`
      <section class="${bem} rd-collapsible\${open ? ' rd-collapsible--open' : ''}" data-testid="${bem}">
        <button type="button" class="rd-collapsible__header" aria-expanded="\${open ? 'true' : 'false'}"><span>\${this.esc(title)}</span></button>
        <div class="rd-collapsible__panel" data-ref="slot"\${open ? '' : ' hidden'}></div>
      </section>\`;`,

  'layout-scroll-region': (bem) => `    const title = this.readAttr('title');
    const maxHeight = this.readAttr('max-height');
    const overlay = this.readBoolAttr('overlay-scrollbar', true);
    const overlayClass = overlay ? ' rd-scroll-region--overlay-scrollbar' : '';
    const heightStyle = maxHeight ? \` style="max-height:\${this.esc(maxHeight)}"\` : '';
    return \`
      <section class="${bem} rd-scroll-region\${overlayClass}" data-testid="${bem}" aria-label="\${this.esc(title || 'Scrollable content')}"\${heightStyle}>
        \${title ? \`<header class="rd-scroll-region__header">\${this.esc(title)}</header>\` : ''}
        <div class="rd-scroll-region__body" data-ref="slot"></div>
      </section>\`;`,

  'role-gate': (bem) => `    const label = this.readAttr('label');
    const status = this.readAttr('status-text', 'Visible');
    const hiddenStatus = this.readAttr('hidden-status-text', 'Hidden for current role');
    const roles = this.parseJsonAttr<string[]>('allowed-roles', []);
    const currentRole = this.readAttr('current-role');
    const hasRoleContext = currentRole.length > 0;
    const visible = !hasRoleContext || roles.length === 0 || roles.includes(currentRole);
    const modifier = visible ? 'rd-role-gate--visible' : 'rd-role-gate--hidden';
    const statusText = visible ? status : hiddenStatus;
    return \`
      <section class="${bem} rd-role-gate \${modifier}" data-testid="${bem}">
        \${label ? \`<span class="rd-field__label">\${this.esc(label)}</span>\` : ''}
        <p class="rd-role-gate__status\${visible ? '' : ' rd-role-gate__status--hidden'}" data-testid="\${visible ? 'rd-role-gate-visible' : 'rd-role-gate-hidden'}">\${this.esc(statusText)}</p>
        <div data-ref="slot"\${visible ? '' : ' hidden'}></div>
      </section>\`;`,

  'person-invite': (bem) => `    const placeholder = this.readAttr('email-placeholder', 'name@company.com');
    return \`
      <section class="${bem}" data-testid="${bem}">
        <span class="rd-field__label">Invite team member</span>
        <input type="email" class="rd-input" data-ref="email" placeholder="\${this.esc(placeholder)}" aria-label="Email address" />
        <button type="button" class="rd-button" data-ref="invite">Send invite</button>
        <div data-ref="slot"></div>
      </section>\`;`,

  'role-assign': (bem) => `    const summary = this.readAttr('summary');
    const options = this.parseJsonAttr<Array<{ value: string; label: string }>>('role-options', []);
    const opts = options.map((o) => \`<option value="\${this.esc(o.value)}">\${this.esc(o.label)}</option>\`).join('');
    return \`
      <section class="${bem}" data-testid="${bem}">
        <span class="rd-field__label">Assign role</span>
        \${summary ? \`<p class="rd-onboarding__summary">\${this.esc(summary)}</p>\` : ''}
        <select class="rd-select" data-ref="role" aria-label="Role">\${opts}</select>
        <button type="button" class="rd-button" data-ref="confirm">Confirm access</button>
        <div data-ref="slot"></div>
      </section>\`;`,

  'news-select': (bem) => `    const label = this.readAttr('label');
    const placeholder = this.readAttr('placeholder', 'Select…');
    const value = this.readAttr('value');
    const options = this.parseJsonAttr<Array<{ value: string; label: string }>>('options', []);
    const opts = options.map((o) => \`<option value="\${this.esc(o.value)}"\${o.value === value ? ' selected' : ''}>\${this.esc(o.label)}</option>\`).join('');
    return \`
      <section class="${bem}" data-testid="${bem}">
        \${label ? \`<span class="rd-field__label">\${this.esc(label)}</span>\` : ''}
        <select class="rd-select" data-ref="select" aria-label="\${this.esc(label || 'News filter')}">
          <option value="">\${this.esc(placeholder)}</option>\${opts}
        </select>
        <div data-ref="slot"></div>
      </section>\`;`,

  'news-search-box': (bem) => `    const label = this.readAttr('label');
    const placeholder = this.readAttr('placeholder', 'Search news…');
    const value = this.readAttr('value');
    return \`
      <section class="${bem}" data-testid="${bem}">
        \${label ? \`<span class="rd-field__label">\${this.esc(label)}</span>\` : ''}
        <div class="rd-search__row">
          <input type="search" class="rd-input" data-ref="query" placeholder="\${this.esc(placeholder)}" value="\${this.esc(value)}" aria-label="\${this.esc(label || 'Search news')}" />
          <button type="button" class="rd-button" data-ref="search">Search</button>
        </div>
        <div data-ref="slot"></div>
      </section>\`;`,

  'news-results-table': (bem) => `    const title = this.readAttr('title', 'News results');
    const rows = this.parseJsonAttr<Array<Record<string, string | undefined>>>('rows', []);
    const body = rows.map((row) => \`<tr data-row-id="\${this.esc(String(row['id'] ?? ''))}"><td>\${this.esc(row['headline'] ?? '')}</td><td>\${this.esc(row['source'] ?? '')}</td><td>\${this.esc(row['region'] ?? '')}</td><td>\${this.esc(row['published'] ?? '')}</td></tr>\`).join('');
    return \`
      <section class="${bem}" data-testid="${bem}">
        <header class="rd-table__header"><span>\${this.esc(title)}</span></header>
        <table class="rd-table"><thead><tr><th>Headline</th><th>Source</th><th>Region</th><th>Published</th></tr></thead><tbody>\${body}</tbody></table>
        <div data-ref="slot"></div>
      </section>\`;`,

  'news-article-detail': (bem) => `    const title = this.readAttr('title', 'Article');
    const empty = this.readAttr('empty-message', 'Select a headline in News Results');
    return \`
      <section class="${bem} rd-detail" data-testid="${bem}">
        <header class="rd-detail__header"><span>\${this.esc(title)}</span></header>
        <p class="rd-detail__empty">\${this.esc(empty)}</p>
        <div class="rd-detail__body" data-ref="slot"></div>
      </section>\`;`,

  'status-badge': (bem) => `    const text = this.readAttr('status-text', 'Active');
    const tone = this.readAttr('tone', 'success');
    return \`<span class="${bem} rd-status-badge--\${tone}" data-testid="${bem}">\${this.esc(text)}</span>\`;`,

  'metric-chip': (bem) => `    const chipLabel = this.readAttr('chip-label', 'Metric');
    const chipValue = this.readAttr('chip-value', '—');
    return \`
      <span class="${bem}" data-testid="${bem}">
        <span class="rd-metric-chip__label">\${this.esc(chipLabel)}</span>
        <span class="rd-metric-chip__value">\${this.esc(chipValue)}</span>
      </span>\`;`,

  'three-host': (bem, entry) => {
    if (entry.subpath === 'visual/display/3d-geo-globe') {
      return `    const title = this.readAttr('title');
    return \`
      <section class="${bem}" data-testid="${bem}" aria-label="\${this.esc(title || '3D destination globe')}">
        \${title ? \`<header class="${bem}__header">\${this.esc(title)}</header>\` : ''}
        <div class="${bem}__canvas-host" data-ref="canvas-host"></div>
        <div data-ref="slot"></div>
      </section>\`;`;
    }
    const title = `this.readAttr('title', '3D view')`;
    return `    const title = ${title};
    const mode = this.readAttr('mode', 'preview');
    return \`
      <section class="${bem}" data-testid="${bem}" data-three-mode="\${this.esc(mode)}" aria-label="\${this.esc(title)}">
        <header class="${bem}__header">\${this.esc(title)}</header>
        <div class="${bem}__placeholder" aria-hidden="true">3D preview</div>
        <div data-ref="slot"></div>
      </section>\`;`;
  },

  'svg-inline': (bem) => `    const markup = this.readAttr('markup', '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.2"/></svg>');
    const width = this.readAttr('width', '96');
    const height = this.readAttr('height', '96');
    return \`<div class="${bem}" data-testid="${bem}" style="width:\${width}px;height:\${height}px">\${markup}</div>\`;`,

  'svg-icon': (bem) => `    const markup = this.readAttr('markup', '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7-6.3-4.6L5.7 21l2.3-7-6-4.6h7.6z" fill="currentColor"/></svg>');
    const size = this.readAttr('size', '28');
    const title = this.readAttr('title');
    return \`<span class="${bem}" data-testid="${bem}" style="width:\${size}px;height:\${size}px"\${title ? \` title="\${this.esc(title)}"\` : ''}>\${markup}</span>\`;`,

  'live-capture': (bem) => `    const label = this.readAttr('label', 'Live capture');
    return \`
      <section class="${bem}" data-testid="${bem}">
        <span class="rd-media__label">\${this.esc(label)}</span>
        <button type="button" class="rd-button" data-ref="start">Start camera</button>
        <div data-ref="slot"></div>
      </section>\`;`,

  'wasm-asset': (bem) => `    const assetPath = this.readAttr('asset-path', 'wasm/modules/example.wasm');
    const gluePath = this.readAttr('glue-path');
    return \`
      <section class="${bem}" data-testid="${bem}">
        <span class="rd-wasm__badge">WASM</span>
        <code>\${this.esc(assetPath)}</code>
        \${gluePath ? \`<span class="rd-wasm__glue">+ \${this.esc(gluePath)}</span>\` : ''}
        <div data-ref="slot"></div>
      </section>\`;`,

  'wasm-worker-host': (bem) => `    const workerLabel = this.readAttr('worker-label', 'Worker');
    const workerStatus = this.readAttr('worker-status', 'Idle');
    return \`
      <section class="${bem}" data-testid="${bem}">
        <span class="rd-wasm__label">\${this.esc(workerLabel)}</span>
        <span class="rd-wasm__status">\${this.esc(workerStatus)}</span>
        <div data-ref="slot"></div>
      </section>\`;`,

  'wasm-module': (bem) => `    const moduleLabel = this.readAttr('module-label', 'WASM Module');
    const exportName = this.readAttr('export-name', 'run()');
    return \`
      <section class="${bem}" data-testid="${bem}">
        <span class="rd-wasm__label">\${this.esc(moduleLabel)}</span>
        <code>\${this.esc(exportName)}()</code>
        <div data-ref="slot"></div>
      </section>\`;`,

  fallback: (bem) => `    return \`<section class="${bem}" data-testid="${bem}"><div data-ref="slot"></div></section>\`;`,
};

const KIND_WIRE_INPUT = `    this.addEventListener('input', (event) => {
      const target = event.target;
      if (target instanceof HTMLInputElement && target.matches('[data-ref="input"]')) {
        this.dispatchDetail('value-change', { value: target.value });
      }
    });`;

const KIND_WIRE_SELECT = `    this.addEventListener('change', (event) => {
      const target = event.target;
      if (target instanceof HTMLSelectElement && target.matches('[data-ref="select"]')) {
        this.dispatchDetail('value-change', { value: target.value });
      }
    });`;

/** @type {Record<string, string>} */
const KIND_WIRE = {
  'text-input': KIND_WIRE_INPUT,
  'select-input': KIND_WIRE_SELECT,
  'number-input': KIND_WIRE_INPUT,
  'textarea-input': KIND_WIRE_INPUT,
  'checkbox-input': `    this.addEventListener('change', (event) => {
      const target = event.target;
      if (target instanceof HTMLInputElement && target.matches('[data-ref="input"]')) {
        this.dispatchDetail('checked-change', { checked: target.checked });
      }
    });`,
  'date-range': `    this.addEventListener('change', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement)) return;
      const start = this.querySelector<HTMLInputElement>('[data-ref="start"]')?.value ?? '';
      const end = this.querySelector<HTMLInputElement>('[data-ref="end"]')?.value ?? '';
      this.dispatchDetail('range-change', { startDate: start, endDate: end });
    });`,
  'time-preset': `    this.addEventListener('click', (event) => {
      const target = event.target;
      if (target instanceof HTMLElement && target.dataset['presetId']) {
        this.dispatchDetail('preset-change', { presetId: target.dataset['presetId'] });
      }
    });`,
  'layout-tabs': `    this.addEventListener('click', (event) => {
      const target = event.target;
      if (target instanceof HTMLElement && target.dataset['tabId']) {
        this.dispatchDetail('tab-change', { tabId: target.dataset['tabId'] });
      }
    });`,
  'layout-modal': `    this.addEventListener('click', (event) => {
      const target = event.target;
      if (target instanceof HTMLElement && target.matches('[data-ref="confirm"]')) {
        this.dispatchDetail('confirm', {});
      }
    });`,
  'person-invite': `    this.addEventListener('click', (event) => {
      const target = event.target;
      if (target instanceof HTMLElement && target.matches('[data-ref="invite"]')) {
        const email = this.querySelector<HTMLInputElement>('[data-ref="email"]')?.value ?? '';
        this.dispatchDetail('invite', { email });
      }
    });`,
  'role-assign': `    this.addEventListener('click', (event) => {
      const target = event.target;
      if (target instanceof HTMLElement && target.matches('[data-ref="confirm"]')) {
        const role = this.querySelector<HTMLSelectElement>('[data-ref="role"]')?.value ?? '';
        this.dispatchDetail('confirm', { role });
      }
    });`,
  'news-select': KIND_WIRE_SELECT,
  'news-search-box': `    const emit = () => {
      const query = this.querySelector<HTMLInputElement>('[data-ref="query"]')?.value ?? '';
      this.dispatchDetail('search', { query });
    };
    this.addEventListener('click', (event) => {
      if (event.target instanceof HTMLElement && event.target.matches('[data-ref="search"]')) emit();
    });
    this.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') emit();
    });`,
  'data-table': `    this.addEventListener('click', (event) => {
      const row = event.target instanceof HTMLElement ? event.target.closest('tr[data-row-id]') : null;
      if (row instanceof HTMLElement && row.dataset['rowId']) {
        this.dispatchDetail('row-select', { id: row.dataset['rowId'] });
      }
    });`,
  'news-results-table': `    this.addEventListener('click', (event) => {
      const row = event.target instanceof HTMLElement ? event.target.closest('tr[data-row-id]') : null;
      if (row instanceof HTMLElement && row.dataset['rowId']) {
        this.dispatchDetail('row-select', { id: row.dataset['rowId'] });
      }
    });`,
};

export { KIND_PROPS };
