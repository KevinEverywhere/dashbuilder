import { KIND_PROPS } from './react-templates.mjs';

export function exportNameToFile(exportName) {
  return exportName.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

export function parseInterfaceProps(propsInterface) {
  const props = [];
  const bodyMatch = propsInterface.match(/export interface \w+Props \{([\s\S]*)\}/);
  if (!bodyMatch) {
    return props;
  }
  const body = bodyMatch[1];
  let i = 0;
  while (i < body.length) {
    const nameMatch = body.slice(i).match(/^\s*(\w+)\?\:\s*/);
    if (!nameMatch) {
      i += 1;
      continue;
    }
    const name = nameMatch[1];
    i += nameMatch[0].length;
    let depth = 0;
    const typeStart = i;
    while (i < body.length) {
      const ch = body[i];
      if (ch === '{' || ch === '(' || ch === '<') {
        depth += 1;
      } else if (ch === '}' || ch === ')' || ch === '>') {
        depth -= 1;
      } else if (ch === ';' && depth === 0) {
        break;
      }
      i += 1;
    }
    props.push({ name, typePart: body.slice(typeStart, i).trim() });
    i += 1;
  }
  return props;
}

function sveltePropsInterface(exportName, kind) {
  const raw = (KIND_PROPS[kind] ?? KIND_PROPS['fallback'])(exportName);
  return raw
    .replace(/\n  style\?: CSSProperties;\n/g, '\n')
    .replace(/\n  children\?: ReactNode;\n/g, '\n');
}

function sveltePropsDestructure(propsInterface) {
  const skip = new Set(['children', 'style', 'className']);
  const lines = ['\t\tclassName,'];
  for (const { name, typePart } of parseInterfaceProps(propsInterface)) {
    if (skip.has(name) || typePart.includes('=>')) {
      continue;
    }
    lines.push(`\t\t${name},`);
  }
  return lines.join('\n');
}

function kindHasChildrenSlot(kind) {
  return kind !== 'status-badge' && kind !== 'metric-chip';
}

function kindExtraScript(kind, bemBlock) {
  switch (kind) {
    case 'time-preset':
      return `
\tfunction presetButtonClass(id: string): string {
\t\treturn ['${bemBlock}__button', activePresetId === id ? '${bemBlock}__button--active' : ''].filter(Boolean).join(' ');
\t}`;
    case 'loading-skeleton':
      return `
\tconst skeletonLines = $derived.by(() => {
\t\tconst count = lines ?? 4;
\t\treturn Array.from({ length: count }, (_, i) =>
\t\t\t['${bemBlock}__line', i === 2 ? '${bemBlock}__line--short' : ''].filter(Boolean).join(' '),
\t\t);
\t});`;
    case 'bar-chart':
      return `
\tconst barHeights = [40, 65, 55, 80, 48];`;
    case 'layout-grid':
      return `
\tconst gridColumns = $derived(\`repeat(\${columns ?? 3}, 1fr)\`);
\tconst gridGap = $derived(typeof gap === 'number' ? gap : 12);`;
    case 'layout-flex':
      return `
\tconst flexGap = $derived(typeof gap === 'number' ? gap : 12);`;
    case 'layout-tabs':
      return `
\tfunction tabClass(id: string): string {
\t\treturn ['${bemBlock}__tab', activeTabId === id ? '${bemBlock}__tab--active' : ''].filter(Boolean).join(' ');
\t}`;
    case 'status-badge':
      return `
\tconst badgeClass = $derived(['${bemBlock}', '${bemBlock}--' + (tone ?? 'success'), className].filter(Boolean).join(' '));`;
    case 'svg-inline':
      return `
\tconst defaultSvg = '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.2"/></svg>';`;
    case 'svg-icon':
      return `
\tconst defaultIconSvg = '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7-6.3-4.6L5.7 21l2.3-7-6-4.6h7.6z" fill="currentColor"/></svg>';`;
    case 'wasm-module':
      return `
\tconst exportFnLabel = $derived(exportName ?? 'run()');`;
    default:
      return '';
  }
}

function kindRootClassScript(kind, bemBlock) {
  if (kind === 'status-badge') {
    return '';
  }
  return `\n\tconst rootClass = $derived(['${bemBlock}', className].filter(Boolean).join(' '));`;
}

function kindRender(kind, bemBlock) {
  const b = bemBlock;
  const slot = `{@render children?.()}`;
  const renders = {
    'text-input': `<section class={rootClass} data-testid="${b}">
\t{#if label}<span class="rd-field__label">{label}</span>{/if}
\t<input type="text" class="rd-input" placeholder={placeholder ?? ''} required={required ?? false} value={value ?? ''} />
\t${slot}
</section>`,

    'select-input': `<section class={rootClass} data-testid="${b}">
\t{#if label}<span class="rd-field__label">{label}</span>{/if}
\t<select class="rd-select" value={value ?? ''}>
\t\t<option value="">{placeholder ?? 'Select…'}</option>
\t\t{#each options ?? [] as o (o.value)}<option value={o.value}>{o.label}</option>{/each}
\t</select>
\t${slot}
</section>`,

    'number-input': `<section class={rootClass} data-testid="${b}">
\t{#if label}<span class="rd-field__label">{label}</span>{/if}
\t<input type="number" class="rd-input" placeholder={placeholder ?? ''} min={min} max={max} step={step} value={value} />
\t${slot}
</section>`,

    'checkbox-input': `<label class="{rootClass} rd-field--checkbox" data-testid="${b}">
\t<input type="checkbox" class="rd-checkbox" checked={checked ?? defaultChecked ?? false} />
\t{#if label}<span class="rd-field__label">{label}</span>{/if}
\t${slot}
</label>`,

    'textarea-input': `<section class={rootClass} data-testid="${b}">
\t{#if label}<span class="rd-field__label">{label}</span>{/if}
\t<textarea class="rd-textarea" rows={rows ?? 4} placeholder={placeholder ?? ''}>{value ?? ''}</textarea>
\t${slot}
</section>`,

    'date-range': `<section class={rootClass} data-testid="${b}">
\t{#if label}<span class="rd-field__label">{label}</span>{/if}
\t<div class="rd-date-range__controls">
\t\t<input type="date" class="rd-input" value={startDate ?? ''} />
\t\t<span class="rd-date-range__sep">to</span>
\t\t<input type="date" class="rd-input" value={endDate ?? ''} />
\t</div>
\t{#if presetLabel}<span class="rd-date-range__preset">{presetLabel}</span>{/if}
\t${slot}
</section>`,

    'time-preset': `<section class={rootClass} data-testid="${b}">
\t{#if label}<span class="rd-field__label">{label}</span>{/if}
\t<div class="${b}__buttons" role="group">
\t\t{#each presets ?? [] as p (p.id)}<button type="button" class={presetButtonClass(p.id)}>{p.label}</button>{/each}
\t</div>
\t${slot}
</section>`,

    'data-table': `<section class={rootClass} data-testid="${b}">
\t<header class="${b}__header"><span>{title ?? 'Data table'}</span></header>
\t<table class="${b}__table">
\t\t<thead><tr><th>Name</th><th>Status</th><th>Amount</th><th>Date</th></tr></thead>
\t\t<tbody>
\t\t\t{#each rows ?? [] as row (row.id)}
\t\t\t<tr><td>{row.name}</td><td>{row.status}</td><td>{row.amount}</td><td>{row.date}</td></tr>
\t\t\t{/each}
\t\t</tbody>
\t</table>
\t${slot}
</section>`,

    'detail-panel': `<section class={rootClass} data-testid="${b}">
\t<header class="${b}__header"><span>{title ?? 'Details'}</span></header>
\t<p class="${b}__empty">{emptyMessage ?? 'Select a row to view details'}</p>
\t${slot}
</section>`,

    'kpi-card': `<article class={rootClass} data-testid="${b}">
\t<span class="${b}__title">{title ?? 'Metric'}</span>
\t<span class="${b}__value">{value ?? '—'}</span>
\t{#if delta}<span class="${b}__delta">{delta}</span>{/if}
\t${slot}
</article>`,

    'loading-skeleton': `<section class={rootClass} data-testid="${b}">
\t{#each skeletonLines as line, i (i)}<span class={line}></span>{/each}
\t${slot}
</section>`,

    timer: `<section class={rootClass} data-testid="${b}">
\t{#if label}<span class="${b}__label">{label}</span>{/if}
\t<span class="${b}__value">{tickCount ?? 0} ticks</span>
\t${slot}
</section>`,

    'line-chart': `<section class={rootClass} data-testid="${b}">
\t<header class="${b}__header"><span>{title ?? 'Line chart'}</span></header>
\t<svg viewBox="0 0 240 96" class="${b}__svg" aria-hidden="true">
\t\t<polyline class="${b}__line" points="0,80 40,60 80,65 120,40 160,45 200,20 240,30" />
\t</svg>
\t${slot}
</section>`,

    'bar-chart': `<section class={rootClass} data-testid="${b}">
\t<header class="${b}__header"><span>{title ?? 'Bar chart'}</span></header>
\t<div class="${b}__bars" aria-hidden="true">
\t\t{#each barHeights as h, i (i)}<div class="${b}__bar-wrap"><div class="${b}__bar" style:height="{h}%"></div></div>{/each}
\t</div>
\t${slot}
</section>`,

    'pie-chart': `<section class={rootClass} data-testid="${b}">
\t<header class="${b}__header"><span>{title ?? 'Pie chart'}</span></header>
\t<div class="${b}__pie" aria-hidden="true"></div>
\t${slot}
</section>`,

    'layout-grid': `<section class={rootClass} data-testid="${b}">
\t{#if title}<span class="${b}__title">{title}</span>{/if}
\t<div class="${b}__grid" style:grid-template-columns={gridColumns} style:gap="{gridGap}px">{@render children?.()}</div>
</section>`,

    'layout-flex': `<section class={rootClass} data-testid="${b}">
\t{#if title}<span class="${b}__title">{title}</span>{/if}
\t<div class="${b}__flex" style:flex-direction={direction ?? 'row'} style:gap="{flexGap}px">{@render children?.()}</div>
</section>`,

    'layout-tabs': `<section class={rootClass} data-testid="${b}">
\t{#if title}<span class="${b}__title">{title}</span>{/if}
\t<div class="${b}__tabs" role="tablist">
\t\t{#each tabs ?? [] as tab (tab.id)}<button type="button" role="tab" class={tabClass(tab.id)}>{tab.label}</button>{/each}
\t</div>
\t<div class="${b}__panel">${slot}</div>
</section>`,

    'layout-modal': `<section class={rootClass} data-testid="${b}" role="dialog" aria-modal="true">
\t<div class="${b}__dialog">
\t\t<span class="${b}__title">{title ?? 'Dialog'}</span>
\t\t{#if body}<p class="${b}__body">{body}</p>{/if}
\t\t<button type="button" class="${b}__confirm">{confirmLabel ?? 'Confirm'}</button>
\t\t${slot}
\t</div>
</section>`,

    'layout-collapsible': `<section class={rootClass} data-testid="${b}">
\t<button type="button" class="${b}__header" aria-expanded={(open ?? defaultOpen ?? false) ? 'true' : 'false'}>
\t\t<span>{title ?? 'Section'}</span>
\t</button>
\t	<div class="${b}__panel">${slot}</div>
</section>`,

    'layout-scroll-region': `<section
	class={[rootClass, overlayScrollbar === false ? '' : 'rd-scroll-region--overlay-scrollbar'].filter(Boolean).join(' ')}
	data-testid="${b}"
	aria-label={title ?? 'Scrollable content'}
	style={maxHeight ? \`max-height: \${maxHeight}\` : undefined}
>
	{#if title}<header class="rd-scroll-region__header">{title}</header>{/if}
	<div class="rd-scroll-region__body">${slot}</div>
</section>`,

    'role-gate': `<section class={rootClass} data-testid="${b}">
\t{#if label}<span class="rd-field__label">{label}</span>{/if}
\t<p class="${b}__status">{statusText ?? 'Visible'}</p>
\t${slot}
</section>`,

    'person-invite': `<section class={rootClass} data-testid="${b}">
\t<span class="rd-field__label">Invite team member</span>
\t<input type="email" class="rd-input" placeholder={emailPlaceholder ?? 'name@company.com'} />
\t<button type="button" class="rd-button">Send invite</button>
\t${slot}
</section>`,

    'role-assign': `<section class={rootClass} data-testid="${b}">
\t<span class="rd-field__label">Assign role</span>
\t{#if summary}<p class="rd-onboarding__summary">{summary}</p>{/if}
\t<select class="rd-select">
\t\t{#each roleOptions ?? [] as o (o.value)}<option value={o.value}>{o.label}</option>{/each}
\t</select>
\t<button type="button" class="rd-button">Confirm access</button>
\t${slot}
</section>`,

    'infra-env': `<section class={rootClass} data-testid="${b}">
\t<span class="rd-infra__badge">INFRA</span>
\t<span class="rd-field__label">Environment config</span>
\t<code>{envKeys ?? 'DATABASE_URL, API_KEY'}</code>
\t${slot}
</section>`,

    'infra-db': `<section class={rootClass} data-testid="${b}">
\t<span class="rd-infra__badge">INFRA</span>
\t{#if label}<span class="rd-field__label">{label}</span>{/if}
\t{#if envKey}<code>{envKey}</code>{/if}
\t{#if tableOrCollection}<span class="rd-infra__meta">{tableOrCollection}</span>{/if}
\t${slot}
</section>`,

    'infra-server': `<section class={rootClass} data-testid="${b}">
\t<span class="rd-infra__badge">INFRA</span>
\t{#if label}<span class="rd-field__label">{label}</span>{/if}
\t{#if globalPrefix}<code>globalPrefix: {globalPrefix}</code>{/if}
\t${slot}
</section>`,

    'news-select': `<section class={rootClass} data-testid="${b}">
\t{#if label}<span class="rd-field__label">{label}</span>{/if}
\t<select class="rd-select" value={value ?? ''}>
\t\t<option value="">{placeholder ?? 'Select…'}</option>
\t\t{#each options ?? [] as o (o.value)}<option value={o.value}>{o.label}</option>{/each}
\t</select>
\t${slot}
</section>`,

    'news-search-box': `<section class={rootClass} data-testid="${b}">
\t{#if label}<span class="rd-field__label">{label}</span>{/if}
\t<div class="rd-search__row">
\t\t<input type="search" class="rd-input" placeholder={placeholder ?? 'Search news…'} value={value ?? ''} />
\t\t<button type="button" class="rd-button">Search</button>
\t</div>
\t${slot}
</section>`,

    'news-results-table': `<section class={rootClass} data-testid="${b}">
\t<header class="rd-table__header"><span>{title ?? 'News results'}</span></header>
\t<table class="rd-table"><thead><tr><th>Headline</th><th>Source</th><th>Region</th><th>Published</th></tr></thead><tbody></tbody></table>
\t${slot}
</section>`,

    'news-article-detail': `<section class={rootClass} data-testid="${b}">
\t<header class="rd-detail__header"><span>{title ?? 'Article'}</span></header>
\t<p class="rd-detail__empty">{emptyMessage ?? 'Select a headline in News Results'}</p>
\t${slot}
</section>`,

    'status-badge': `<span class={badgeClass} data-testid="${b}">{statusText ?? 'Active'}</span>`,

    'metric-chip': `<span class={rootClass} data-testid="${b}">
\t<span class="${b}__label">{chipLabel ?? 'Metric'}</span>
\t<span class="${b}__value">{chipValue ?? '—'}</span>
</span>`,

    'three-host': `<section
\tclass={rootClass}
\tdata-testid="${b}"
\tdata-three-mode={mode}
\tdata-three-title={title}
\taria-label={title ?? '3D host'}
>${slot}</section>`,

    'svg-inline': `<div
\tclass={rootClass}
\tdata-testid="${b}"
\tstyle:width="{width ?? 96}px"
\tstyle:height="{height ?? 96}px"
>
\t{@html markup ?? defaultSvg}
</div>`,

    'svg-icon': `<span
\tclass={rootClass}
\tdata-testid="${b}"
\tstyle:width="{size ?? 28}px"
\tstyle:height="{size ?? 28}px"
\tstyle:color={color}
\ttitle={title ?? ''}
>
\t{@html markup ?? defaultIconSvg}
</span>`,

    'live-capture': `<section class={rootClass} data-testid="${b}">
\t<span class="rd-media__label">{label ?? 'Live capture'}</span>
\t<button type="button" class="rd-button">Start camera</button>
\t${slot}
</section>`,

    'wasm-asset': `<section class={rootClass} data-testid="${b}">
\t<span class="rd-wasm__badge">WASM</span>
\t<code>{assetPath ?? 'wasm/modules/example.wasm'}</code>
\t{#if gluePath}<span class="rd-wasm__glue">+ {gluePath}</span>{/if}
\t${slot}
</section>`,

    'wasm-worker-host': `<section class={rootClass} data-testid="${b}">
\t<span class="rd-wasm__label">{workerLabel ?? 'Worker'}</span>
\t<span class="rd-wasm__status">{workerStatus ?? 'Idle'}</span>
\t${slot}
</section>`,

    'wasm-module': `<section class={rootClass} data-testid="${b}">
\t<span class="rd-wasm__label">{moduleLabel ?? 'WASM Module'}</span>
\t<code>{exportFnLabel}()</code>
\t${slot}
</section>`,

    fallback: `<section class={rootClass} data-testid="${b}">${slot}</section>`,
  };
  return renders[kind] ?? renders.fallback;
}

/** @param {import('./manifest.mjs').RuntimeAtomEntry} entry */
export function renderSvelteTypes(entry, kind) {
  return `${sveltePropsInterface(entry.exportName, kind)}\n`;
}

/** @param {import('./manifest.mjs').RuntimeAtomEntry} entry */
export function renderNativeSvelteComponent(entry, bemBlock) {
  const { exportName, kind } = entry;
  const propsInterface = sveltePropsInterface(exportName, kind);
  const destructure = sveltePropsDestructure(propsInterface);
  const extraScript = kindExtraScript(kind, bemBlock);
  const rootClassScript = kindRootClassScript(kind, bemBlock);
  const markup = kindRender(kind, bemBlock);
  const childrenLine = kindHasChildrenSlot(kind) ? '\n\t\tchildren,' : '';
  const snippetImport = kindHasChildrenSlot(kind) ? "\timport type { Snippet } from 'svelte';\n" : '';

  return `<script lang="ts">
${snippetImport}\timport type { ${exportName}Props } from './types';

\ttype Props = ${exportName}Props${kindHasChildrenSlot(kind) ? ' & { children?: Snippet }' : ''};

\tlet {
${destructure}${childrenLine}
\t}: Props = $props();${extraScript}${rootClassScript}
</script>

${markup}
`;
}

export function renderSvelteSpec(entry, bemBlock, subpath) {
  const file = exportNameToFile(entry.exportName);
  return `import type { ${entry.exportName}Props } from './types';

describe('@rosettadash/svelte/${subpath}', () => {
  it('exposes typed props contract', () => {
    const props: ${entry.exportName}Props = {};
    expect(props).toBeDefined();
  });

  it('uses taxonomy-aligned BEM block ${bemBlock}', () => {
    expect('${bemBlock}').toMatch(/^rd-/);
  });
});
`;
}

export function renderSvelteIndex(entry) {
  return `export type { ${entry.exportName}Props } from './types';
/** Component entry is \`${entry.exportName}.svelte\` (see package exports). */
`;
}

export function renderLegacyAliasTypes(alias) {
  const depth = alias.subpath.split('/').length;
  const rel = '../'.repeat(depth) + alias.targetSubpath.split('/').join('/');
  return `/** @deprecated Import from @rosettadash/svelte/${alias.targetSubpath} */
export type { ${alias.exportName}Props } from '${rel}/types';
`;
}

export function renderLegacyAliasIndex(alias) {
  return `export type { ${alias.exportName}Props } from './types';
/** @deprecated Import from @rosettadash/svelte/${alias.targetSubpath} */
`;
}
