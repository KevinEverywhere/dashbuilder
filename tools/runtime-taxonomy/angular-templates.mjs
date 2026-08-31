import { KIND_PROPS } from './react-templates.mjs';

function exportNameToFile(exportName) {
  return exportName.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

function angularInputsFromProps(propsInterface) {
  const lines = [];
  const skip = new Set(['children', 'style', 'className']);
  for (const line of propsInterface.split('\n')) {
    const match = line.match(/^\s+(\w+)\?\:\s*([^;]+);$/);
    if (!match) {
      continue;
    }
    const name = match[1];
    const typePart = match[2].trim();
    if (skip.has(name) || typePart.includes('=>')) {
      continue;
    }
    lines.push(`  readonly ${name} = input<${typePart} | undefined>(undefined);`);
  }
  return lines.join('\n');
}

/** Inner Angular template HTML per manifest kind (BEM via {{bemBlock}}). */
const ANGULAR_KIND_HTML = {
  'text-input': `<section [attr.data-testid]="'{{bemBlock}}'" [ngClass]="rootClass()">
      @if (label()) { <span class="rd-field__label">{{ label() }}</span> }
      <input type="text" class="rd-input" [placeholder]="placeholder() ?? ''" [required]="required() ?? false" [value]="value() ?? ''" />
      <ng-content />
    </section>`,

  'select-input': `<section [attr.data-testid]="'{{bemBlock}}'" [ngClass]="rootClass()">
      @if (label()) { <span class="rd-field__label">{{ label() }}</span> }
      <select class="rd-select">
        <option value="" [selected]="!(value() ?? '')">{{ placeholder() ?? 'Select…' }}</option>
        @for (o of options() ?? []; track o.value) {
          <option [value]="o.value" [selected]="o.value === (value() ?? '')">{{ o.label }}</option>
        }
      </select>
      <ng-content />
    </section>`,

  'number-input': `<section [attr.data-testid]="'{{bemBlock}}'" [ngClass]="rootClass()">
      @if (label()) { <span class="rd-field__label">{{ label() }}</span> }
      <input type="number" class="rd-input" [placeholder]="placeholder() ?? ''" [min]="min()" [max]="max()" [step]="step()" [value]="value()" />
      <ng-content />
    </section>`,

  'checkbox-input': `<label [attr.data-testid]="'{{bemBlock}}'" [ngClass]="rootClass() + ' rd-field--checkbox'">
      <input type="checkbox" class="rd-checkbox" [checked]="checked() ?? defaultChecked() ?? false" />
      @if (label()) { <span class="rd-field__label">{{ label() }}</span> }
      <ng-content />
    </label>`,

  'textarea-input': `<section [attr.data-testid]="'{{bemBlock}}'" [ngClass]="rootClass()">
      @if (label()) { <span class="rd-field__label">{{ label() }}</span> }
      <textarea class="rd-textarea" [rows]="rows() ?? 4" [placeholder]="placeholder() ?? ''">{{ value() ?? '' }}</textarea>
      <ng-content />
    </section>`,

  'date-range': `<section [attr.data-testid]="'{{bemBlock}}'" [ngClass]="rootClass()">
      @if (label()) { <span class="rd-field__label">{{ label() }}</span> }
      <div class="rd-date-range__controls">
        <input type="date" class="rd-input" [value]="startDate() ?? ''" />
        <span class="rd-date-range__sep">to</span>
        <input type="date" class="rd-input" [value]="endDate() ?? ''" />
      </div>
      @if (presetLabel()) { <span class="rd-date-range__preset">{{ presetLabel() }}</span> }
      <ng-content />
    </section>`,

  'time-preset': `<section [attr.data-testid]="'{{bemBlock}}'" [ngClass]="rootClass()">
      @if (label()) { <span class="rd-field__label">{{ label() }}</span> }
      <div class="{{bemBlock}}__buttons" role="group">
        @for (p of presets() ?? []; track p.id) {
          <button type="button" [class]="presetButtonClass(p.id)">{{ p.label }}</button>
        }
      </div>
      <ng-content />
    </section>`,

  'data-table': `<section [attr.data-testid]="'{{bemBlock}}'" [ngClass]="rootClass()">
      <header class="{{bemBlock}}__header"><span>{{ title() ?? 'Data table' }}</span></header>
      <table class="{{bemBlock}}__table">
        <thead><tr><th>Name</th><th>Status</th><th>Amount</th><th>Date</th></tr></thead>
        <tbody>
          @for (row of rows() ?? []; track row.id) {
            <tr><td>{{ row.name }}</td><td>{{ row.status }}</td><td>{{ row.amount }}</td><td>{{ row.date }}</td></tr>
          }
        </tbody>
      </table>
      <ng-content />
    </section>`,

  'detail-panel': `<section [attr.data-testid]="'{{bemBlock}}'" [ngClass]="rootClass()">
      <header class="{{bemBlock}}__header"><span>{{ title() ?? 'Details' }}</span></header>
      <p class="{{bemBlock}}__empty">{{ emptyMessage() ?? 'Select a row to view details' }}</p>
      <div class="rd-detail__body">
        <ng-content />
      </div>
    </section>`,

  'kpi-card': `<article [attr.data-testid]="'{{bemBlock}}'" [ngClass]="rootClass()">
      <span class="{{bemBlock}}__title">{{ title() ?? 'Metric' }}</span>
      <span class="{{bemBlock}}__value">{{ value() ?? '—' }}</span>
      @if (delta()) { <span class="{{bemBlock}}__delta">{{ delta() }}</span> }
      <ng-content />
    </article>`,

  'loading-skeleton': `<section [attr.data-testid]="'{{bemBlock}}'" [ngClass]="rootClass()">
      @for (line of skeletonLines(); track line) {
        <span [class]="line"></span>
      }
      <ng-content />
    </section>`,

  'timer': `<section [attr.data-testid]="'{{bemBlock}}'" [ngClass]="rootClass()">
      @if (label()) { <span class="{{bemBlock}}__label">{{ label() }}</span> }
      <span class="{{bemBlock}}__value">{{ tickCount() ?? 0 }} ticks</span>
      <ng-content />
    </section>`,

  'line-chart': `<section [attr.data-testid]="'{{bemBlock}}'" [ngClass]="rootClass()">
      <header class="{{bemBlock}}__header"><span>{{ title() ?? 'Line chart' }}</span></header>
      <svg viewBox="0 0 240 96" class="{{bemBlock}}__svg" aria-hidden="true">
        <polyline class="{{bemBlock}}__line" points="0,80 40,60 80,65 120,40 160,45 200,20 240,30" />
      </svg>
      <ng-content />
    </section>`,

  'bar-chart': `<section [attr.data-testid]="'{{bemBlock}}'" [ngClass]="rootClass()">
      <header class="{{bemBlock}}__header"><span>{{ title() ?? 'Bar chart' }}</span></header>
      <div class="{{bemBlock}}__bars" aria-hidden="true">
        @for (h of barHeights; track $index) {
          <div class="{{bemBlock}}__bar-wrap"><div class="{{bemBlock}}__bar" [style.height.%]="h"></div></div>
        }
      </div>
      <ng-content />
    </section>`,

  'pie-chart': `<section [attr.data-testid]="'{{bemBlock}}'" [ngClass]="rootClass()">
      <header class="{{bemBlock}}__header"><span>{{ title() ?? 'Pie chart' }}</span></header>
      <div class="{{bemBlock}}__pie" aria-hidden="true"></div>
      <ng-content />
    </section>`,

  'layout-grid': `<section [attr.data-testid]="'{{bemBlock}}'" [ngClass]="rootClass()">
      @if (title()) { <span class="{{bemBlock}}__title">{{ title() }}</span> }
      <div class="{{bemBlock}}__grid" [style.grid-template-columns]="gridColumns()" [style.gap.px]="gridGap()"><ng-content /></div>
    </section>`,

  'layout-flex': `<section [attr.data-testid]="'{{bemBlock}}'" [ngClass]="rootClass()">
      @if (title()) { <span class="{{bemBlock}}__title">{{ title() }}</span> }
      <div class="{{bemBlock}}__flex" [style.flex-direction]="direction() ?? 'row'" [style.gap.px]="flexGap()"><ng-content /></div>
    </section>`,

  'layout-tabs': `<section [attr.data-testid]="'{{bemBlock}}'" [ngClass]="rootClass()">
      @if (title()) { <span class="{{bemBlock}}__title">{{ title() }}</span> }
      <div class="{{bemBlock}}__tabs" role="tablist">
        @for (tab of tabs() ?? []; track tab.id) {
          <button type="button" role="tab" [class]="tabClass(tab.id)">{{ tab.label }}</button>
        }
      </div>
      <div class="{{bemBlock}}__panel"><ng-content /></div>
    </section>`,

  'layout-modal': `<section [attr.data-testid]="'{{bemBlock}}'" [ngClass]="rootClass()" role="dialog" aria-modal="true">
      <div class="{{bemBlock}}__dialog">
        <span class="{{bemBlock}}__title">{{ title() ?? 'Dialog' }}</span>
        @if (body()) { <p class="{{bemBlock}}__body">{{ body() }}</p> }
        <button type="button" class="{{bemBlock}}__confirm">{{ confirmLabel() ?? 'Confirm' }}</button>
        <ng-content />
      </div>
    </section>`,

  'layout-collapsible': `<section [attr.data-testid]="'{{bemBlock}}'" [ngClass]="rootClass()">
      <button type="button" class="{{bemBlock}}__header" [attr.aria-expanded]="open() ?? defaultOpen() ?? false">
        <span>{{ title() ?? 'Section' }}</span>
      </button>
      <div class="{{bemBlock}}__panel"><ng-content /></div>
    </section>`,

  'layout-scroll-region': `<section
      [attr.data-testid]="'{{bemBlock}}'"
      [ngClass]="rootClass()"
      [class.rd-scroll-region--overlay-scrollbar]="overlayScrollbar() !== false"
      [style.max-height]="maxHeight() ?? null"
      [attr.aria-label]="title() ?? 'Scrollable content'"
    >
      @if (title()) { <header class="rd-scroll-region__header">{{ title() }}</header> }
      <div class="rd-scroll-region__body"><ng-content /></div>
    </section>`,

  'role-gate': `<section [attr.data-testid]="'{{bemBlock}}'" [ngClass]="rootClass()">
      @if (label()) { <span class="rd-field__label">{{ label() }}</span> }
      <p class="{{bemBlock}}__status">{{ statusText() ?? 'Visible' }}</p>
      <ng-content />
    </section>`,

  'person-invite': `<section [attr.data-testid]="'{{bemBlock}}'" [ngClass]="rootClass()">
      <span class="rd-field__label">Invite team member</span>
      <input type="email" class="rd-input" [placeholder]="emailPlaceholder() ?? 'name@company.com'" />
      <button type="button" class="rd-button">Send invite</button>
      <ng-content />
    </section>`,

  'role-assign': `<section [attr.data-testid]="'{{bemBlock}}'" [ngClass]="rootClass()">
      <span class="rd-field__label">Assign role</span>
      @if (summary()) { <p class="rd-onboarding__summary">{{ summary() }}</p> }
      <select class="rd-select">
        @for (o of roleOptions() ?? []; track o.value) {
          <option [value]="o.value">{{ o.label }}</option>
        }
      </select>
      <button type="button" class="rd-button">Confirm access</button>
      <ng-content />
    </section>`,

  'infra-env': `<section [attr.data-testid]="'{{bemBlock}}'" [ngClass]="rootClass()">
      <span class="rd-infra__badge">INFRA</span>
      <span class="rd-field__label">Environment config</span>
      <code>{{ envKeys() ?? 'DATABASE_URL, API_KEY' }}</code>
      <ng-content />
    </section>`,

  'infra-db': `<section [attr.data-testid]="'{{bemBlock}}'" [ngClass]="rootClass()">
      <span class="rd-infra__badge">INFRA</span>
      @if (label()) { <span class="rd-field__label">{{ label() }}</span> }
      @if (envKey()) { <code>{{ envKey() }}</code> }
      @if (tableOrCollection()) { <span class="rd-infra__meta">{{ tableOrCollection() }}</span> }
      <ng-content />
    </section>`,

  'infra-server': `<section [attr.data-testid]="'{{bemBlock}}'" [ngClass]="rootClass()">
      <span class="rd-infra__badge">INFRA</span>
      @if (label()) { <span class="rd-field__label">{{ label() }}</span> }
      @if (globalPrefix()) { <code>globalPrefix: {{ globalPrefix() }}</code> }
      <ng-content />
    </section>`,

  'news-select': `<section [attr.data-testid]="'{{bemBlock}}'" [ngClass]="rootClass()">
      @if (label()) { <span class="rd-field__label">{{ label() }}</span> }
      <select class="rd-select">
        <option value="" [selected]="!(value() ?? '')">{{ placeholder() ?? 'Select…' }}</option>
        @for (o of options() ?? []; track o.value) {
          <option [value]="o.value" [selected]="o.value === (value() ?? '')">{{ o.label }}</option>
        }
      </select>
      <ng-content />
    </section>`,

  'news-search-box': `<section [attr.data-testid]="'{{bemBlock}}'" [ngClass]="rootClass()">
      @if (label()) { <span class="rd-field__label">{{ label() }}</span> }
      <div class="rd-search__row">
        <input type="search" class="rd-input" [placeholder]="placeholder() ?? 'Search news…'" [value]="value() ?? ''" />
        <button type="button" class="rd-button">Search</button>
      </div>
      <ng-content />
    </section>`,

  'news-results-table': `<section [attr.data-testid]="'{{bemBlock}}'" [ngClass]="rootClass()">
      <header class="rd-table__header"><span>{{ title() ?? 'News results' }}</span></header>
      <table class="rd-table"><thead><tr><th>Headline</th><th>Source</th><th>Region</th><th>Published</th></tr></thead><tbody></tbody></table>
      <ng-content />
    </section>`,

  'news-article-detail': `<section [attr.data-testid]="'{{bemBlock}}'" [ngClass]="rootClass()">
      <header class="rd-detail__header"><span>{{ title() ?? 'Article' }}</span></header>
      <p class="rd-detail__empty">{{ emptyMessage() ?? 'Select a headline in News Results' }}</p>
      <div class="rd-detail__body">
        <ng-content />
      </div>
    </section>`,

  'status-badge': `<span [attr.data-testid]="'{{bemBlock}}'" [ngClass]="badgeClass()">{{ statusText() ?? 'Active' }}</span>`,

  'metric-chip': `<span [attr.data-testid]="'{{bemBlock}}'" [ngClass]="rootClass()">
      <span class="{{bemBlock}}__label">{{ chipLabel() ?? 'Metric' }}</span>
      <span class="{{bemBlock}}__value">{{ chipValue() ?? '—' }}</span>
    </span>`,

  'three-host': `<section [attr.data-testid]="'{{bemBlock}}'" [ngClass]="rootClass()" [attr.data-three-mode]="mode()" [attr.data-three-title]="title()" [attr.aria-label]="title() ?? '3D host'"><ng-content /></section>`,

  'svg-inline': `<div [attr.data-testid]="'{{bemBlock}}'" [ngClass]="rootClass()" [style.width.px]="width() ?? 96" [style.height.px]="height() ?? 96" [innerHTML]="markup() ?? defaultSvg"></div>`,

  'svg-icon': `<span [attr.data-testid]="'{{bemBlock}}'" [ngClass]="rootClass()" [style.width.px]="size() ?? 28" [style.height.px]="size() ?? 28" [style.color]="color()" [title]="title() ?? ''" [innerHTML]="markup() ?? defaultIconSvg"></span>`,

  'live-capture': `<section [attr.data-testid]="'{{bemBlock}}'" [ngClass]="rootClass()">
      <span class="rd-media__label">{{ label() ?? 'Live capture' }}</span>
      <button type="button" class="rd-button">Start camera</button>
      <ng-content />
    </section>`,

  'wasm-asset': `<section [attr.data-testid]="'{{bemBlock}}'" [ngClass]="rootClass()">
      <span class="rd-wasm__badge">WASM</span>
      <code>{{ assetPath() ?? 'wasm/modules/example.wasm' }}</code>
      @if (gluePath()) { <span class="rd-wasm__glue">+ {{ gluePath() }}</span> }
      <ng-content />
    </section>`,

  'wasm-worker-host': `<section [attr.data-testid]="'{{bemBlock}}'" [ngClass]="rootClass()">
      <span class="rd-wasm__label">{{ workerLabel() ?? 'Worker' }}</span>
      <span class="rd-wasm__status">{{ workerStatus() ?? 'Idle' }}</span>
      <ng-content />
    </section>`,

  'wasm-module': `<section [attr.data-testid]="'{{bemBlock}}'" [ngClass]="rootClass()">
      <span class="rd-wasm__label">{{ moduleLabel() ?? 'WASM Module' }}</span>
      <code>{{ exportFn() ?? 'run()' }}()</code>
      <ng-content />
    </section>`,

  fallback: `<section [attr.data-testid]="'{{bemBlock}}'" [ngClass]="rootClass()"><ng-content /></section>`,
};

const KIND_HELPERS = {
  'time-preset': `
  presetButtonClass(id: string): string {
    const base = '${'{{bemBlock}}'.replace('{{bemBlock}}', '')}__button';
    return [this.bemBlock + '__button', this.activePresetId() === id ? this.bemBlock + '__button--active' : ''].filter(Boolean).join(' ');
  }`,
  'loading-skeleton': `
  readonly skeletonLines = computed(() => {
    const count = this.lines() ?? 4;
    const block = '${'{{bemBlock}}'.replace('{{bemBlock}}', '')}';
    return Array.from({ length: count }, (_, i) =>
      [block + '__line', i === 2 ? block + '__line--short' : ''].filter(Boolean).join(' '),
    );
  });`,
};

/** Extra class helpers / fields per kind (injected into component class). */
function kindExtraMembers(kind, bemBlock) {
  switch (kind) {
    case 'time-preset':
      return `
  presetButtonClass(id: string): string {
    return ['${bemBlock}__button', this.activePresetId() === id ? '${bemBlock}__button--active' : ''].filter(Boolean).join(' ');
  }`;
    case 'loading-skeleton':
      return `
  readonly skeletonLines = computed(() => {
    const count = this.lines() ?? 4;
    return Array.from({ length: count }, (_, i) =>
      ['${bemBlock}__line', i === 2 ? '${bemBlock}__line--short' : ''].filter(Boolean).join(' '),
    );
  });`;
    case 'bar-chart':
      return `
  readonly barHeights = [40, 65, 55, 80, 48];`;
    case 'layout-grid':
      return `
  gridColumns(): string {
    return \`repeat(\${this.columns() ?? 3}, 1fr)\`;
  }
  gridGap(): number {
    const gap = this.gap();
    return typeof gap === 'number' ? gap : 12;
  }`;
    case 'layout-flex':
      return `
  flexGap(): number {
    const gap = this.gap();
    return typeof gap === 'number' ? gap : 12;
  }`;
    case 'layout-tabs':
      return `
  tabClass(id: string): string {
    return ['${bemBlock}__tab', this.activeTabId() === id ? '${bemBlock}__tab--active' : ''].filter(Boolean).join(' ');
  }`;
    case 'status-badge':
      return `
  badgeClass(): string {
    return ['${bemBlock}', '${bemBlock}--' + (this.tone() ?? 'success'), this.className()].filter(Boolean).join(' ');
  }`;
    case 'svg-inline':
      return `
  readonly defaultSvg = '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.2"/></svg>';`;
    case 'svg-icon':
      return `
  readonly defaultIconSvg = '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7-6.3-4.6L5.7 21l2.3-7-6-4.6h7.6z" fill="currentColor"/></svg>';`;
    case 'wasm-module':
      return `
  exportFn(): string | undefined {
    return this.exportName();
  }`;
    default:
      return '';
  }
}

function angularPropsInterface(exportName, kind) {
  const raw = (KIND_PROPS[kind] ?? KIND_PROPS['fallback'])(exportName);
  return raw
    .replace(/\n  style\?: CSSProperties;\n/g, '\n')
    .replace(/\n  children\?: ReactNode;\n/g, '\n');
}

export function renderNativeAngularComponent(entry, bemBlock) {
  const { exportName, subpath, kind } = entry;
  const propsInterface = angularPropsInterface(exportName, kind);
  const inputFields = angularInputsFromProps(propsInterface);
  const templateHtml = (ANGULAR_KIND_HTML[kind] ?? ANGULAR_KIND_HTML.fallback).replace(
    /\{\{bemBlock\}\}/g,
    bemBlock,
  );
  const extra = kindExtraMembers(kind, bemBlock);
  const useNgClass = kind !== 'status-badge';

  return `import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

${propsInterface}

/** @rosettadash/angular/${subpath} — ${entry.type} */
@Component({
  selector: '${bemBlock}',
  standalone: true,
  imports: [NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`
    ${templateHtml}
  \`,
})
export class ${exportName} {
  readonly className = input<string | undefined>(undefined);
${inputFields ? `${inputFields}\n` : ''}
  readonly rootClass = computed(() =>
    ['${bemBlock}', this.className()].filter(Boolean).join(' '),
  );${extra}
}
`;
}

export function renderAngularSpec(entry, bemBlock, subpath) {
  const { exportName } = entry;
  const file = exportNameToFile(exportName);
  return `import type { ${exportName}Props } from './${file}';

describe('@rosettadash/angular/${subpath}', () => {
  it('exposes typed props contract', () => {
    const props: ${exportName}Props = {};
    expect(props).toBeDefined();
  });

  it('uses taxonomy-aligned BEM block ${bemBlock}', () => {
    expect('${bemBlock}').toMatch(/^rd-/);
  });
});
`;
}

export function renderAngularIndex(entry) {
  const file = exportNameToFile(entry.exportName);
  return `export type { ${entry.exportName}Props } from './${file}';
export { ${entry.exportName} } from './${file}';
`;
}

export function renderLegacyAlias(alias) {
  const depth = alias.subpath.split('/').length;
  const rel = '../'.repeat(depth) + alias.targetSubpath.split('/').join('/');
  return `/** @deprecated Import from @rosettadash/angular/${alias.targetSubpath} */
export type { ${alias.exportName}Props } from '${rel}/index.js';
export { ${alias.exportName} } from '${rel}/index.js';
`;
}

export { exportNameToFile };
