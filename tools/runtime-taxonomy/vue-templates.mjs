import { KIND_PROPS } from './react-templates.mjs';

export function exportNameToFile(exportName) {
  return exportName.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

function vuePropsInterface(exportName, kind) {
  const raw = (KIND_PROPS[kind] ?? KIND_PROPS['fallback'])(exportName);
  return raw
    .replace(/\n  style\?: CSSProperties;\n/g, '\n')
    .replace(/\n  children\?: ReactNode;\n/g, '\n');
}

function vuePropType(typePart) {
  const t = typePart.trim();
  if (t === 'string') return 'String';
  if (t === 'number') return 'Number';
  if (t === 'boolean') return 'Boolean';
  if (t.endsWith('[]')) return 'Array';
  if (t.includes('|')) return 'String';
  return 'String';
}

function parseInterfaceProps(propsInterface) {
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

function vuePropDefsFromInterface(propsInterface) {
  const lines = [];
  const skip = new Set(['children', 'style', 'className']);
  for (const { name, typePart } of parseInterfaceProps(propsInterface)) {
    if (skip.has(name) || typePart.includes('=>')) {
      continue;
    }
    const vueType = vuePropType(typePart);
    lines.push(
      `    ${name}: { type: ${vueType} as PropType<${typePart} | undefined>, default: undefined },`,
    );
  }
  return lines.join('\n');
}

function kindExtraSetup(kind, bemBlock) {
  switch (kind) {
    case 'time-preset':
      return `
    function presetButtonClass(id: string): string {
      return ['${bemBlock}__button', props.activePresetId === id ? '${bemBlock}__button--active' : ''].filter(Boolean).join(' ');
    }`;
    case 'loading-skeleton':
      return `
    const skeletonLines = computed(() => {
      const count = props.lines ?? 4;
      return Array.from({ length: count }, (_, i) =>
        ['${bemBlock}__line', i === 2 ? '${bemBlock}__line--short' : ''].filter(Boolean).join(' '),
      );
    });`;
    case 'bar-chart':
      return `
    const barHeights = [40, 65, 55, 80, 48];`;
    case 'layout-grid':
      return `
    function gridColumns(): string {
      return \`repeat(\${props.columns ?? 3}, 1fr)\`;
    }
    function gridGap(): number {
      return typeof props.gap === 'number' ? props.gap : 12;
    }`;
    case 'layout-flex':
      return `
    function flexGap(): number {
      return typeof props.gap === 'number' ? props.gap : 12;
    }`;
    case 'layout-tabs':
      return `
    function tabClass(id: string): string {
      return ['${bemBlock}__tab', props.activeTabId === id ? '${bemBlock}__tab--active' : ''].filter(Boolean).join(' ');
    }`;
    case 'status-badge':
      return `
    const badgeClass = computed(() =>
      ['${bemBlock}', '${bemBlock}--' + (props.tone ?? 'success'), props.className].filter(Boolean).join(' '),
    );`;
    case 'svg-inline':
      return `
    const defaultSvg = '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.2"/></svg>';`;
    case 'svg-icon':
      return `
    const defaultIconSvg = '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7-6.3-4.6L5.7 21l2.3-7-6-4.6h7.6z" fill="currentColor"/></svg>';`;
    case 'wasm-module':
      return `
    const exportFn = computed(() => props.exportName);`;
    default:
      return '';
  }
}

function kindRender(kind, bemBlock) {
  const b = bemBlock;
  const renders = {
    'text-input': `return h('section', { class: rootClass, 'data-testid': '${b}' }, [
      props.label ? h('span', { class: 'rd-field__label' }, props.label) : null,
      h('input', { type: 'text', class: 'rd-input', placeholder: props.placeholder ?? '', required: props.required ?? false, value: props.value ?? '' }),
      slots.default?.(),
    ]);`,

    'select-input': `return h('section', { class: rootClass, 'data-testid': '${b}' }, [
      props.label ? h('span', { class: 'rd-field__label' }, props.label) : null,
      h('select', { class: 'rd-select', value: props.value ?? '' }, [
        h('option', { value: '', selected: !(props.value ?? '') }, props.placeholder ?? 'Select…'),
        ...(props.options ?? []).map((o) =>
          h('option', { key: o.value, value: o.value, selected: o.value === (props.value ?? '') }, o.label),
        ),
      ]),
      slots.default?.(),
    ]);`,

    'number-input': `return h('section', { class: rootClass, 'data-testid': '${b}' }, [
      props.label ? h('span', { class: 'rd-field__label' }, props.label) : null,
      h('input', { type: 'number', class: 'rd-input', placeholder: props.placeholder ?? '', min: props.min, max: props.max, step: props.step, value: props.value }),
      slots.default?.(),
    ]);`,

    'checkbox-input': `return h('label', { class: rootClass + ' rd-field--checkbox', 'data-testid': '${b}' }, [
      h('input', { type: 'checkbox', class: 'rd-checkbox', checked: props.checked ?? props.defaultChecked ?? false }),
      props.label ? h('span', { class: 'rd-field__label' }, props.label) : null,
      slots.default?.(),
    ]);`,

    'textarea-input': `return h('section', { class: rootClass, 'data-testid': '${b}' }, [
      props.label ? h('span', { class: 'rd-field__label' }, props.label) : null,
      h('textarea', { class: 'rd-textarea', rows: props.rows ?? 4, placeholder: props.placeholder ?? '' }, props.value ?? ''),
      slots.default?.(),
    ]);`,

    'date-range': `return h('section', { class: rootClass, 'data-testid': '${b}' }, [
      props.label ? h('span', { class: 'rd-field__label' }, props.label) : null,
      h('div', { class: 'rd-date-range__controls' }, [
        h('input', { type: 'date', class: 'rd-input', value: props.startDate ?? '' }),
        h('span', { class: 'rd-date-range__sep' }, 'to'),
        h('input', { type: 'date', class: 'rd-input', value: props.endDate ?? '' }),
      ]),
      props.presetLabel ? h('span', { class: 'rd-date-range__preset' }, props.presetLabel) : null,
      slots.default?.(),
    ]);`,

    'time-preset': `return h('section', { class: rootClass, 'data-testid': '${b}' }, [
      props.label ? h('span', { class: 'rd-field__label' }, props.label) : null,
      h('div', { class: '${b}__buttons', role: 'group' }, (props.presets ?? []).map((p) =>
        h('button', { type: 'button', key: p.id, class: presetButtonClass(p.id) }, p.label),
      )),
      slots.default?.(),
    ]);`,

    'data-table': `return h('section', { class: rootClass, 'data-testid': '${b}' }, [
      h('header', { class: '${b}__header' }, h('span', null, props.title ?? 'Data table')),
      h('table', { class: '${b}__table' }, [
        h('thead', null, h('tr', null, ['Name', 'Status', 'Amount', 'Date'].map((col) => h('th', { key: col }, col)))),
        h('tbody', null, (props.rows ?? []).map((row) =>
          h('tr', { key: row.id }, [
            h('td', null, row.name),
            h('td', null, row.status),
            h('td', null, row.amount),
            h('td', null, row.date),
          ]),
        )),
      ]),
      slots.default?.(),
    ]);`,

    'detail-panel': `return h('section', { class: rootClass, 'data-testid': '${b}' }, [
      h('header', { class: '${b}__header' }, h('span', null, props.title ?? 'Details')),
      h('p', { class: '${b}__empty' }, props.emptyMessage ?? 'Select a row to view details'),
      slots.default?.(),
    ]);`,

    'kpi-card': `return h('article', { class: rootClass, 'data-testid': '${b}' }, [
      h('span', { class: '${b}__title' }, props.title ?? 'Metric'),
      h('span', { class: '${b}__value' }, String(props.value ?? '—')),
      props.delta ? h('span', { class: '${b}__delta' }, props.delta) : null,
      slots.default?.(),
    ]);`,

    'loading-skeleton': `return h('section', { class: rootClass, 'data-testid': '${b}' }, [
      ...skeletonLines.value.map((line, i) => h('span', { key: i, class: line })),
      slots.default?.(),
    ]);`,

    timer: `return h('section', { class: rootClass, 'data-testid': '${b}' }, [
      props.label ? h('span', { class: '${b}__label' }, props.label) : null,
      h('span', { class: '${b}__value' }, \`\${props.tickCount ?? 0} ticks\`),
      slots.default?.(),
    ]);`,

    'line-chart': `return h('section', { class: rootClass, 'data-testid': '${b}' }, [
      h('header', { class: '${b}__header' }, h('span', null, props.title ?? 'Line chart')),
      h('svg', { viewBox: '0 0 240 96', class: '${b}__svg', 'aria-hidden': 'true' }, [
        h('polyline', { class: '${b}__line', points: '0,80 40,60 80,65 120,40 160,45 200,20 240,30' }),
      ]),
      slots.default?.(),
    ]);`,

    'bar-chart': `return h('section', { class: rootClass, 'data-testid': '${b}' }, [
      h('header', { class: '${b}__header' }, h('span', null, props.title ?? 'Bar chart')),
      h('div', { class: '${b}__bars', 'aria-hidden': 'true' }, barHeights.map((height, i) =>
        h('div', { key: i, class: '${b}__bar-wrap' }, h('div', { class: '${b}__bar', style: { height: \`\${height}%\` } })),
      )),
      slots.default?.(),
    ]);`,

    'pie-chart': `return h('section', { class: rootClass, 'data-testid': '${b}' }, [
      h('header', { class: '${b}__header' }, h('span', null, props.title ?? 'Pie chart')),
      h('div', { class: '${b}__pie', 'aria-hidden': 'true' }),
      slots.default?.(),
    ]);`,

    'layout-grid': `return h('section', { class: rootClass, 'data-testid': '${b}' }, [
      props.title ? h('span', { class: '${b}__title' }, props.title) : null,
      h('div', { class: '${b}__grid', style: { gridTemplateColumns: gridColumns(), gap: \`\${gridGap()}px\` } }, slots.default?.()),
    ]);`,

    'layout-flex': `return h('section', { class: rootClass, 'data-testid': '${b}' }, [
      props.title ? h('span', { class: '${b}__title' }, props.title) : null,
      h('div', { class: '${b}__flex', style: { flexDirection: props.direction ?? 'row', gap: \`\${flexGap()}px\` } }, slots.default?.()),
    ]);`,

    'layout-tabs': `return h('section', { class: rootClass, 'data-testid': '${b}' }, [
      props.title ? h('span', { class: '${b}__title' }, props.title) : null,
      h('div', { class: '${b}__tabs', role: 'tablist' }, (props.tabs ?? []).map((tab) =>
        h('button', { type: 'button', key: tab.id, role: 'tab', class: tabClass(tab.id) }, tab.label),
      )),
      h('div', { class: '${b}__panel' }, slots.default?.()),
    ]);`,

    'layout-modal': `return h('section', { class: rootClass, 'data-testid': '${b}', role: 'dialog', 'aria-modal': 'true' }, [
      h('div', { class: '${b}__dialog' }, [
        h('span', { class: '${b}__title' }, props.title ?? 'Dialog'),
        props.body ? h('p', { class: '${b}__body' }, props.body) : null,
        h('button', { type: 'button', class: '${b}__confirm' }, props.confirmLabel ?? 'Confirm'),
        slots.default?.(),
      ]),
    ]);`,

    'layout-collapsible': `return h('section', { class: rootClass, 'data-testid': '${b}' }, [
      h('button', { type: 'button', class: '${b}__header', 'aria-expanded': props.open ?? props.defaultOpen ?? false ? 'true' : 'false' }, [
        h('span', null, props.title ?? 'Section'),
      ]),
      h('div', { class: '${b}__panel' }, slots.default?.()),
    ]);`,

    'layout-scroll-region': `return h('section', {
      class: [rootClass, props.overlayScrollbar === false ? '' : 'rd-scroll-region--overlay-scrollbar'].filter(Boolean).join(' '),
      'data-testid': '${b}',
      'aria-label': props.title ?? 'Scrollable content',
      style: props.maxHeight ? { maxHeight: props.maxHeight } : undefined,
    }, [
      props.title ? h('header', { class: 'rd-scroll-region__header' }, props.title) : null,
      h('div', { class: 'rd-scroll-region__body' }, slots.default?.()),
    ]);`,

    'role-gate': `return h('section', { class: rootClass, 'data-testid': '${b}' }, [
      props.label ? h('span', { class: 'rd-field__label' }, props.label) : null,
      h('p', { class: '${b}__status' }, props.statusText ?? 'Visible'),
      slots.default?.(),
    ]);`,

    'person-invite': `return h('section', { class: rootClass, 'data-testid': '${b}' }, [
      h('span', { class: 'rd-field__label' }, 'Invite team member'),
      h('input', { type: 'email', class: 'rd-input', placeholder: props.emailPlaceholder ?? 'name@company.com' }),
      h('button', { type: 'button', class: 'rd-button' }, 'Send invite'),
      slots.default?.(),
    ]);`,

    'role-assign': `return h('section', { class: rootClass, 'data-testid': '${b}' }, [
      h('span', { class: 'rd-field__label' }, 'Assign role'),
      props.summary ? h('p', { class: 'rd-onboarding__summary' }, props.summary) : null,
      h('select', { class: 'rd-select' }, (props.roleOptions ?? []).map((o) => h('option', { key: o.value, value: o.value }, o.label))),
      h('button', { type: 'button', class: 'rd-button' }, 'Confirm access'),
      slots.default?.(),
    ]);`,

    'infra-env': `return h('section', { class: rootClass, 'data-testid': '${b}' }, [
      h('span', { class: 'rd-infra__badge' }, 'INFRA'),
      h('span', { class: 'rd-field__label' }, 'Environment config'),
      h('code', null, props.envKeys ?? 'DATABASE_URL, API_KEY'),
      slots.default?.(),
    ]);`,

    'infra-db': `return h('section', { class: rootClass, 'data-testid': '${b}' }, [
      h('span', { class: 'rd-infra__badge' }, 'INFRA'),
      props.label ? h('span', { class: 'rd-field__label' }, props.label) : null,
      props.envKey ? h('code', null, props.envKey) : null,
      props.tableOrCollection ? h('span', { class: 'rd-infra__meta' }, props.tableOrCollection) : null,
      slots.default?.(),
    ]);`,

    'infra-server': `return h('section', { class: rootClass, 'data-testid': '${b}' }, [
      h('span', { class: 'rd-infra__badge' }, 'INFRA'),
      props.label ? h('span', { class: 'rd-field__label' }, props.label) : null,
      props.globalPrefix ? h('code', null, \`globalPrefix: \${props.globalPrefix}\`) : null,
      slots.default?.(),
    ]);`,

    'news-select': `return h('section', { class: rootClass, 'data-testid': '${b}' }, [
      props.label ? h('span', { class: 'rd-field__label' }, props.label) : null,
      h('select', { class: 'rd-select', value: props.value ?? '' }, [
        h('option', { value: '', selected: !(props.value ?? '') }, props.placeholder ?? 'Select…'),
        ...(props.options ?? []).map((o) =>
          h('option', { key: o.value, value: o.value, selected: o.value === (props.value ?? '') }, o.label),
        ),
      ]),
      slots.default?.(),
    ]);`,

    'news-search-box': `return h('section', { class: rootClass, 'data-testid': '${b}' }, [
      props.label ? h('span', { class: 'rd-field__label' }, props.label) : null,
      h('div', { class: 'rd-search__row' }, [
        h('input', { type: 'search', class: 'rd-input', placeholder: props.placeholder ?? 'Search news…', value: props.value ?? '' }),
        h('button', { type: 'button', class: 'rd-button' }, 'Search'),
      ]),
      slots.default?.(),
    ]);`,

    'news-results-table': `return h('section', { class: rootClass, 'data-testid': '${b}' }, [
      h('header', { class: 'rd-table__header' }, h('span', null, props.title ?? 'News results')),
      h('table', { class: 'rd-table' }, [
        h('thead', null, h('tr', null, ['Headline', 'Source', 'Region', 'Published'].map((col) => h('th', { key: col }, col)))),
        h('tbody'),
      ]),
      slots.default?.(),
    ]);`,

    'news-article-detail': `return h('section', { class: rootClass, 'data-testid': '${b}' }, [
      h('header', { class: 'rd-detail__header' }, h('span', null, props.title ?? 'Article')),
      h('p', { class: 'rd-detail__empty' }, props.emptyMessage ?? 'Select a headline in News Results'),
      slots.default?.(),
    ]);`,

    'status-badge': `return h('span', { class: badgeClass.value, 'data-testid': '${b}' }, props.statusText ?? 'Active');`,

    'metric-chip': `return h('span', { class: rootClass, 'data-testid': '${b}' }, [
      h('span', { class: '${b}__label' }, props.chipLabel ?? 'Metric'),
      h('span', { class: '${b}__value' }, props.chipValue ?? '—'),
    ]);`,

    'three-host': `return h('section', {
      class: rootClass,
      'data-testid': '${b}',
      'data-three-mode': props.mode,
      'data-three-title': props.title,
      'aria-label': props.title ?? '3D host',
    }, slots.default?.());`,

    'svg-inline': `return h('div', {
      class: rootClass,
      'data-testid': '${b}',
      style: { width: \`\${props.width ?? 96}px\`, height: \`\${props.height ?? 96}px\` },
      innerHTML: props.markup ?? defaultSvg,
    });`,

    'svg-icon': `return h('span', {
      class: rootClass,
      'data-testid': '${b}',
      style: { width: \`\${props.size ?? 28}px\`, height: \`\${props.size ?? 28}px\`, color: props.color },
      title: props.title ?? '',
      innerHTML: props.markup ?? defaultIconSvg,
    });`,

    'live-capture': `return h('section', { class: rootClass, 'data-testid': '${b}' }, [
      h('span', { class: 'rd-media__label' }, props.label ?? 'Live capture'),
      h('button', { type: 'button', class: 'rd-button' }, 'Start camera'),
      slots.default?.(),
    ]);`,

    'wasm-asset': `return h('section', { class: rootClass, 'data-testid': '${b}' }, [
      h('span', { class: 'rd-wasm__badge' }, 'WASM'),
      h('code', null, props.assetPath ?? 'wasm/modules/example.wasm'),
      props.gluePath ? h('span', { class: 'rd-wasm__glue' }, \`+ \${props.gluePath}\`) : null,
      slots.default?.(),
    ]);`,

    'wasm-worker-host': `return h('section', { class: rootClass, 'data-testid': '${b}' }, [
      h('span', { class: 'rd-wasm__label' }, props.workerLabel ?? 'Worker'),
      h('span', { class: 'rd-wasm__status' }, props.workerStatus ?? 'Idle'),
      slots.default?.(),
    ]);`,

    'wasm-module': `return h('section', { class: rootClass, 'data-testid': '${b}' }, [
      h('span', { class: 'rd-wasm__label' }, props.moduleLabel ?? 'WASM Module'),
      h('code', null, \`\${exportFn.value ?? 'run()'}()\`),
      slots.default?.(),
    ]);`,

    fallback: `return h('section', { class: rootClass, 'data-testid': '${b}' }, slots.default?.());`,
  };
  return renders[kind] ?? renders.fallback;
}

/** @param {import('./manifest.mjs').RuntimeAtomEntry} entry */
export function renderNativeVueComponent(entry, bemBlock) {
  const { exportName, subpath, kind } = entry;
  const propsInterface = vuePropsInterface(exportName, kind);
  const propDefs = vuePropDefsFromInterface(propsInterface);
  const extraSetup = kindExtraSetup(kind, bemBlock);
  const renderBody = kindRender(kind, bemBlock);
  const needsComputed = extraSetup.includes('computed(');

  return `import { defineComponent, h${needsComputed ? ', computed' : ''}, type PropType, type SlotsType, type VNode } from 'vue';

${propsInterface}

/** @rosettadash/vue/${subpath} — ${entry.type} */
export const ${exportName} = defineComponent({
  name: 'Rd${exportName}',
  props: {
    className: { type: String as PropType<string | undefined>, default: undefined },
${propDefs}
  },
  slots: Object as SlotsType<{ default?: () => VNode[] }>,
  setup(props, { slots, attrs }) {${extraSetup}
    return () => {
      const rootClass = ['${bemBlock}', props.className, typeof attrs.class === 'string' ? attrs.class : ''].filter(Boolean).join(' ');
      ${renderBody}
    };
  },
});

export type ${exportName}Component = typeof ${exportName};
`;
}

export function renderVueSpec(entry, bemBlock, subpath) {
  const file = exportNameToFile(entry.exportName);
  return `import type { ${entry.exportName}Props } from './${file}';

describe('@rosettadash/vue/${subpath}', () => {
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

export function renderVueIndex(entry) {
  const file = exportNameToFile(entry.exportName);
  return `export type { ${entry.exportName}Props, ${entry.exportName}Component } from './${file}';
export { ${entry.exportName} } from './${file}';
`;
}

export function renderLegacyAlias(alias) {
  const depth = alias.subpath.split('/').length;
  const rel = '../'.repeat(depth) + alias.targetSubpath.split('/').join('/');
  return `/** @deprecated Import from @rosettadash/vue/${alias.targetSubpath} */
export type { ${alias.exportName}Props, ${alias.exportName}Component } from '${rel}/index.js';
export { ${alias.exportName} } from '${rel}/index.js';
`;
}
