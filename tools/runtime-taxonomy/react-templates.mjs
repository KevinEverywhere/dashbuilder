/**
 * Generate native React runtime atom source from taxonomy manifest kinds.
 * @param {import('./manifest.mjs').RuntimeAtomEntry} entry
 */
export function renderNativeComponent(entry, bemBlock) {
  const { exportName, subpath, kind } = entry;
  const testId = bemBlock;
  const body = KIND_BODIES[kind] ?? KIND_BODIES['fallback'];
  const propsFn = KIND_PROPS[kind] ?? KIND_PROPS['fallback'];
  const propsInterface = propsFn(exportName);
  const setup = KIND_SETUP[kind] ?? '';

  return `import { forwardRef, type CSSProperties, type ReactNode } from 'react';

${propsInterface}

/** @rosettadash/react/${subpath} — ${entry.type} */
export const ${exportName} = forwardRef<HTMLElement, ${exportName}Props>(function ${exportName}(
  props,
  ref,
) {
  const { className, style, children } = props;
  const rootClass = ['${bemBlock}', className].filter(Boolean).join(' ');
${setup}
  return (
    ${body
      .replace(/\{\{exportName\}\}/g, exportName)
      .replace(/\{\{testId\}\}/g, testId)
      .replace(/\{\{bemBlock\}\}/g, bemBlock)
      .replace(/\brest\./g, 'props.')}
  );
});
`;
}

/** @param {import('./manifest.mjs').RuntimeAtomEntry} entry */
export function renderNativeSpec(entry, bemBlock) {
  const { exportName } = entry;
  const fileBase = exportName.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  return `import { render, screen } from '@testing-library/react';
import { ${exportName} } from './${exportName}.js';

describe('${exportName}', () => {
  it('renders with taxonomy-aligned BEM root block', () => {
    render(<${exportName} />);
    expect(screen.getByTestId('${bemBlock}')).toBeTruthy();
  });

  it('forwards ref', () => {
    const ref = { current: null as HTMLElement | null };
    render(<${exportName} ref={ref} />);
    expect(ref.current).toBeTruthy();
  });
});
`;
}

/** @param {import('./manifest.mjs').RuntimeAtomEntry} entry */
export function renderIndex(entry) {
  return `export type { ${entry.exportName}Props } from './${entry.exportName}.js';
export { ${entry.exportName} } from './${entry.exportName}.js';
`;
}

/** @param {{ subpath: string; exportName: string; targetSubpath: string }} alias */
export function renderLegacyAlias(alias) {
  const depth = alias.subpath.split('/').length;
  const rel = '../'.repeat(depth) + alias.targetSubpath.split('/').join('/');
  return `/** @deprecated Import from @rosettadash/react/${alias.targetSubpath} */
export type { ${alias.exportName}Props } from '${rel}/index.js';
export { ${alias.exportName} } from '${rel}/index.js';
`;
}

const KIND_PROPS = {
  'text-input': (name) => `export interface ${name}Props {
  label?: string;
  placeholder?: string;
  required?: boolean;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}`,

  'select-input': (name) => `export interface ${name}Option {
  value: string;
  label: string;
}

export interface ${name}Props {
  label?: string;
  placeholder?: string;
  options?: ${name}Option[];
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}`,

  'number-input': (name) => `export interface ${name}Props {
  label?: string;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  value?: number;
  onChange?: (value: number) => void;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}`,

  'checkbox-input': (name) => `export interface ${name}Props {
  label?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}`,

  'textarea-input': (name) => `export interface ${name}Props {
  label?: string;
  placeholder?: string;
  rows?: number;
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}`,

  'date-range': (name) => `export interface ${name}Props {
  label?: string;
  startDate?: string;
  endDate?: string;
  presetLabel?: string;
  onChange?: (range: { startDate: string; endDate: string }) => void;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}`,

  'time-preset': (name) => `export interface ${name}Preset {
  id: string;
  label: string;
}

export interface ${name}Props {
  label?: string;
  presets?: ${name}Preset[];
  activePresetId?: string;
  onPresetChange?: (presetId: string) => void;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}`,

  'data-table': (name) => `export interface ${name}Row {
  id: string;
  name?: string;
  status?: string;
  amount?: number;
  date?: string;
  [key: string]: string | number | undefined;
}

export interface ${name}Props {
  title?: string;
  rows?: ${name}Row[];
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}`,

  'detail-panel': (name) => `export interface ${name}Props {
  title?: string;
  emptyMessage?: string;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}`,

  'kpi-card': (name) => `export interface ${name}Props {
  title?: string;
  value?: string | number;
  delta?: string;
  format?: 'number' | 'currency' | 'percent';
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}`,

  'loading-skeleton': (name) => `export interface ${name}Props {
  lines?: number;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}`,

  'timer': (name) => `export interface ${name}Props {
  label?: string;
  mode?: 'interval' | 'countdown';
  intervalMs?: number;
  tickCount?: number;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}`,

  'line-chart': (name) => `export interface ${name}Point {
  x: string | number;
  y: number;
}

export interface ${name}Props {
  title?: string;
  points?: ${name}Point[];
  xAxisLabel?: string;
  yAxisLabel?: string;
  valueFormat?: (value: number) => string;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}`,

  'bar-chart': (name) => `export interface ${name}Bar {
  label: string;
  value: number;
}

export interface ${name}Props {
  title?: string;
  bars?: ${name}Bar[];
  yAxisLabel?: string;
  valueFormat?: (value: number) => string;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}`,

  'pie-chart': (name) => `export interface ${name}Props {
  title?: string;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}`,

  'layout-grid': (name) => `export interface ${name}Props {
  title?: string;
  columns?: number;
  gap?: number | string;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}`,

  'layout-flex': (name) => `export interface ${name}Props {
  title?: string;
  direction?: 'row' | 'column';
  gap?: number | string;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}`,

  'layout-tabs': (name) => `export interface ${name}Tab {
  id: string;
  label: string;
}

export interface ${name}Props {
  title?: string;
  tabs?: ${name}Tab[];
  activeTabId?: string;
  onTabChange?: (tabId: string) => void;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}`,

  'layout-modal': (name) => `export interface ${name}Props {
  title?: string;
  body?: string;
  confirmLabel?: string;
  open?: boolean;
  onConfirm?: () => void;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}`,

  'layout-collapsible': (name) => `export interface ${name}Props {
  title?: string;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}`,

  'layout-scroll-region': (name) => `export interface ${name}Props {
  title?: string;
  maxHeight?: string;
  overlayScrollbar?: boolean;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}`,

  'role-gate': (name) => `export interface ${name}Props {
  label?: string;
  allowedRoles?: string[];
  /** Active session role — when omitted, content is always shown (builder/demo mode). */
  currentRole?: string;
  statusText?: string;
  hiddenStatusText?: string;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}`,

  'person-invite': (name) => `export interface ${name}Props {
  emailPlaceholder?: string;
  onInvite?: (email: string) => void;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}`,

  'role-assign': (name) => `export interface ${name}Props {
  summary?: string;
  roleOptions?: { value: string; label: string }[];
  onConfirm?: (role: string) => void;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}`,

  'infra-env': (name) => `export interface ${name}Props {
  envKeys?: string;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}`,

  'infra-db': (name) => `export interface ${name}Props {
  label?: string;
  envKey?: string;
  tableOrCollection?: string;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}`,

  'infra-server': (name) => `export interface ${name}Props {
  label?: string;
  globalPrefix?: string;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}`,

  'news-select': (name) => `export interface ${name}Props {
  label?: string;
  placeholder?: string;
  options?: { value: string; label: string }[];
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}`,

  'news-search-box': (name) => `export interface ${name}Props {
  label?: string;
  placeholder?: string;
  value?: string;
  onSearch?: (query: string) => void;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}`,

  'news-results-table': (name) => `export interface ${name}Props {
  title?: string;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}`,

  'news-article-detail': (name) => `export interface ${name}Props {
  title?: string;
  emptyMessage?: string;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}`,

  'status-badge': (name) => `export interface ${name}Props {
  statusText?: string;
  tone?: 'success' | 'warning' | 'error' | 'neutral';
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}`,

  'metric-chip': (name) => `export interface ${name}Props {
  chipLabel?: string;
  chipValue?: string;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}`,

  'three-host': (name) => `export interface ${name}Props {
  title?: string;
  mode?: string;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}`,

  'svg-inline': (name) => `export interface ${name}Props {
  markup?: string;
  width?: number | string;
  height?: number | string;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}`,

  'svg-icon': (name) => `export interface ${name}Props {
  markup?: string;
  title?: string;
  color?: string;
  size?: number | string;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}`,

  'live-capture': (name) => `export interface ${name}Props {
  label?: string;
  onStart?: () => void;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}`,

  'wasm-asset': (name) => `export interface ${name}Props {
  assetPath?: string;
  gluePath?: string;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}`,

  'wasm-worker-host': (name) => `export interface ${name}Props {
  workerLabel?: string;
  workerStatus?: string;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}`,

  'wasm-module': (name) => `export interface ${name}Props {
  moduleLabel?: string;
  exportName?: string;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}`,

  fallback: (name) => `export interface ${name}Props {
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}`,
};

const KIND_BODIES = {
  'text-input': `<section ref={ref as React.RefObject<HTMLElement>} className={rootClass} style={style} data-testid="{{testId}}">
      {rest.label ? <span className="rd-field__label">{rest.label}</span> : null}
      <input
        type="text"
        className="rd-input"
        placeholder={rest.placeholder}
        required={rest.required}
        value={rest.value}
        defaultValue={rest.defaultValue}
        onChange={(e) => rest.onChange?.(e.target.value)}
      />
      {children}
    </section>`,

  'select-input': `<section ref={ref as React.RefObject<HTMLElement>} className={rootClass} style={style} data-testid="{{testId}}">
      {rest.label ? <span className="rd-field__label">{rest.label}</span> : null}
      <select
        className="rd-select"
        value={rest.value}
        onChange={(e) => rest.onChange?.(e.target.value)}
      >
        <option value="">{rest.placeholder ?? 'Select…'}</option>
        {(rest.options ?? []).map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {children}
    </section>`,

  'number-input': `<section ref={ref as React.RefObject<HTMLElement>} className={rootClass} style={style} data-testid="{{testId}}">
      {rest.label ? <span className="rd-field__label">{rest.label}</span> : null}
      <input
        type="number"
        className="rd-input"
        placeholder={rest.placeholder}
        min={rest.min}
        max={rest.max}
        step={rest.step}
        value={rest.value}
        onChange={(e) => rest.onChange?.(Number(e.target.value))}
      />
      {children}
    </section>`,

  'checkbox-input': `<label ref={ref as React.Ref<HTMLLabelElement>} className={[rootClass, 'rd-field--checkbox'].join(' ')} style={style} data-testid="{{testId}}">
      <input
        type="checkbox"
        className="rd-checkbox"
        checked={rest.checked}
        defaultChecked={rest.defaultChecked}
        onChange={(e) => rest.onChange?.(e.target.checked)}
      />
      {rest.label ? <span className="rd-field__label">{rest.label}</span> : null}
      {children}
    </label>`,

  'textarea-input': `<section ref={ref as React.RefObject<HTMLElement>} className={rootClass} style={style} data-testid="{{testId}}">
      {rest.label ? <span className="rd-field__label">{rest.label}</span> : null}
      <textarea
        className="rd-textarea"
        rows={rest.rows ?? 4}
        placeholder={rest.placeholder}
        value={rest.value}
        onChange={(e) => rest.onChange?.(e.target.value)}
      />
      {children}
    </section>`,

  'date-range': `<section ref={ref as React.RefObject<HTMLElement>} className={rootClass} style={style} data-testid="{{testId}}">
      {rest.label ? <span className="rd-field__label">{rest.label}</span> : null}
      <div className="rd-date-range__controls">
        <input type="date" className="rd-input" value={rest.startDate} onChange={(e) => rest.onChange?.({ startDate: e.target.value, endDate: rest.endDate ?? '' })} />
        <span className="rd-date-range__sep">to</span>
        <input type="date" className="rd-input" value={rest.endDate} onChange={(e) => rest.onChange?.({ startDate: rest.startDate ?? '', endDate: e.target.value })} />
      </div>
      {rest.presetLabel ? <span className="rd-date-range__preset">{rest.presetLabel}</span> : null}
      {children}
    </section>`,

  'time-preset': `<section ref={ref as React.RefObject<HTMLElement>} className={rootClass} style={style} data-testid="{{testId}}">
      {rest.label ? <span className="rd-field__label">{rest.label}</span> : null}
      <div className="rd-time-preset__buttons" role="group">
        {(rest.presets ?? []).map((p) => (
          <button
            key={p.id}
            type="button"
            className={['rd-time-preset__button', rest.activePresetId === p.id ? 'rd-time-preset__button--active' : ''].filter(Boolean).join(' ')}
            onClick={() => rest.onPresetChange?.(p.id)}
          >
            {p.label}
          </button>
        ))}
      </div>
      {children}
    </section>`,

  'data-table': `<section ref={ref as React.RefObject<HTMLElement>} className={rootClass} style={style} data-testid="{{testId}}">
      <header className="{{bemBlock}}__header"><span>{rest.title ?? 'Data table'}</span></header>
      <table className="{{bemBlock}}__table">
        <thead><tr><th>Name</th><th>Status</th><th>Amount</th><th>Date</th></tr></thead>
        <tbody>
          {(rest.rows ?? []).map((row) => (
            <tr key={row.id}><td>{row.name}</td><td>{row.status}</td><td>{row.amount}</td><td>{row.date}</td></tr>
          ))}
        </tbody>
      </table>
      {children}
    </section>`,

  'detail-panel': `<section ref={ref as React.RefObject<HTMLElement>} className={rootClass} style={style} data-testid="{{testId}}">
      <header className="{{bemBlock}}__header"><span>{rest.title ?? 'Details'}</span></header>
      <p className="{{bemBlock}}__empty">{rest.emptyMessage ?? 'Select a row to view details'}</p>
      {children}
    </section>`,

  'kpi-card': `<article ref={ref as React.RefObject<HTMLElement>} className={rootClass} style={style} data-testid="{{testId}}">
      <span className="{{bemBlock}}__title">{rest.title ?? 'Metric'}</span>
      <span className="{{bemBlock}}__value">{rest.value ?? '—'}</span>
      {rest.delta ? <span className="{{bemBlock}}__delta">{rest.delta}</span> : null}
      {children}
    </article>`,

  'loading-skeleton': `<section ref={ref as React.RefObject<HTMLElement>} className={rootClass} style={style} data-testid="{{testId}}">
      {Array.from({ length: rest.lines ?? 4 }).map((_, i) => (
        <span key={i} className={['{{bemBlock}}__line', i === 2 ? '{{bemBlock}}__line--short' : ''].filter(Boolean).join(' ')} />
      ))}
      {children}
    </section>`,

  'timer': `<section ref={ref as React.RefObject<HTMLElement>} className={rootClass} style={style} data-testid="{{testId}}">
      {rest.label ? <span className="{{bemBlock}}__label">{rest.label}</span> : null}
      <span className="{{bemBlock}}__value">{rest.tickCount ?? 0} ticks</span>
      {children}
    </section>`,

  'line-chart': `<section ref={ref as React.RefObject<HTMLElement>} className={rootClass} style={style} data-testid="{{testId}}" role="img" aria-label={rest.title ?? 'Line chart'}>
      <header className="{{bemBlock}}__header"><span>{rest.title ?? 'Line chart'}</span></header>
      <div className="{{bemBlock}}__body">
        <svg viewBox="0 0 240 96" className="{{bemBlock}}__svg" aria-hidden="true">
          <polyline className="{{bemBlock}}__line" points={polyline} />
        </svg>
      </div>
      {children}
    </section>`,

  'bar-chart': `<section ref={ref as React.RefObject<HTMLElement>} className={rootClass} style={style} data-testid="{{testId}}" role="img" aria-label={rest.title ?? 'Bar chart'}>
      <header className="{{bemBlock}}__header"><span>{rest.title ?? 'Bar chart'}</span></header>
      <div className="{{bemBlock}}__bars" aria-hidden="true">
        {series.map((bar) => (
          <div key={bar.label} className="{{bemBlock}}__bar-wrap"><div className="{{bemBlock}}__bar" style={{ height: \`\${Math.round((bar.value / maxValue) * 100)}%\` }} /></div>
        ))}
      </div>
      {children}
    </section>`,

  'pie-chart': `<section ref={ref as React.RefObject<HTMLElement>} className={rootClass} style={style} data-testid="{{testId}}">
      <header className="{{bemBlock}}__header"><span>{rest.title ?? 'Pie chart'}</span></header>
      <div className="{{bemBlock}}__pie" aria-hidden="true" />
      {children}
    </section>`,

  'layout-grid': `<section ref={ref as React.RefObject<HTMLElement>} className={rootClass} style={style} data-testid="{{testId}}">
      {rest.title ? <span className="{{bemBlock}}__title">{rest.title}</span> : null}
      <div className="{{bemBlock}}__grid" style={{ gridTemplateColumns: \`repeat(\${rest.columns ?? 3}, 1fr)\`, gap: rest.gap ?? 12 }}>{children}</div>
    </section>`,

  'layout-flex': `<section ref={ref as React.RefObject<HTMLElement>} className={rootClass} style={style} data-testid="{{testId}}">
      {rest.title ? <span className="{{bemBlock}}__title">{rest.title}</span> : null}
      <div className="{{bemBlock}}__flex" style={{ flexDirection: rest.direction ?? 'row', gap: rest.gap ?? 12 }}>{children}</div>
    </section>`,

  'layout-tabs': `<section ref={ref as React.RefObject<HTMLElement>} className={rootClass} style={style} data-testid="{{testId}}">
      {rest.title ? <span className="{{bemBlock}}__title">{rest.title}</span> : null}
      <div className="{{bemBlock}}__tabs" role="tablist">
        {(rest.tabs ?? []).map((tab) => (
          <button key={tab.id} type="button" role="tab" className={['{{bemBlock}}__tab', rest.activeTabId === tab.id ? '{{bemBlock}}__tab--active' : ''].filter(Boolean).join(' ')} onClick={() => rest.onTabChange?.(tab.id)}>{tab.label}</button>
        ))}
      </div>
      <div className="{{bemBlock}}__panel">{children}</div>
    </section>`,

  'layout-modal': `<section ref={ref as React.RefObject<HTMLElement>} className={rootClass} style={style} data-testid="{{testId}}" role="dialog" aria-modal="true">
      <div className="{{bemBlock}}__dialog">
        <span className="{{bemBlock}}__title">{rest.title ?? 'Dialog'}</span>
        {rest.body ? <p className="{{bemBlock}}__body">{rest.body}</p> : null}
        <button type="button" className="{{bemBlock}}__confirm" onClick={() => rest.onConfirm?.()}>{rest.confirmLabel ?? 'Confirm'}</button>
        {children}
      </div>
    </section>`,

  'layout-collapsible': `<section ref={ref as React.RefObject<HTMLElement>} className={rootClass} style={style} data-testid="{{testId}}">
      <button type="button" className="{{bemBlock}}__header" aria-expanded={rest.open ?? rest.defaultOpen ?? false}>
        <span>{rest.title ?? 'Section'}</span>
      </button>
      <div className="{{bemBlock}}__panel">{children}</div>
    </section>`,

  'layout-scroll-region': `<section
      ref={ref as React.RefObject<HTMLElement>}
      className={[rootClass, rest.overlayScrollbar === false ? '' : 'rd-scroll-region--overlay-scrollbar'].filter(Boolean).join(' ')}
      style={{ ...style, ...(rest.maxHeight ? { maxHeight: rest.maxHeight } : {}) }}
      data-testid="{{testId}}"
      aria-label={rest.title ?? 'Scrollable content'}
    >
      {rest.title ? <header className="rd-scroll-region__header">{rest.title}</header> : null}
      <div className="rd-scroll-region__body">{children}</div>
    </section>`,

  'role-gate': `<section ref={ref as React.RefObject<HTMLElement>} className={[rootClass, visible ? 'rd-role-gate--visible' : 'rd-role-gate--hidden'].filter(Boolean).join(' ')} style={style} data-testid="{{testId}}">
      {rest.label ? <span className="rd-field__label">{rest.label}</span> : null}
      {visible ? (
        <>
          <p className="rd-role-gate__status" data-testid="rd-role-gate-visible">{rest.statusText ?? 'Visible'}</p>
          {children}
        </>
      ) : (
        <p className="rd-role-gate__status rd-role-gate__status--hidden" data-testid="rd-role-gate-hidden">{rest.hiddenStatusText ?? 'Hidden for current role'}</p>
      )}
    </section>`,

  'person-invite': `<section ref={ref as React.RefObject<HTMLElement>} className={rootClass} style={style} data-testid="{{testId}}">
      <span className="rd-field__label">Invite team member</span>
      <input type="email" className="rd-input" placeholder={rest.emailPlaceholder ?? 'name@company.com'} />
      <button type="button" className="rd-button" onClick={() => rest.onInvite?.('')}>Send invite</button>
      {children}
    </section>`,

  'role-assign': `<section ref={ref as React.RefObject<HTMLElement>} className={rootClass} style={style} data-testid="{{testId}}">
      <span className="rd-field__label">Assign role</span>
      {rest.summary ? <p className="rd-onboarding__summary">{rest.summary}</p> : null}
      <select className="rd-select">{(rest.roleOptions ?? []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
      <button type="button" className="rd-button" onClick={() => rest.onConfirm?.('')}>Confirm access</button>
      {children}
    </section>`,

  'infra-env': `<section ref={ref as React.RefObject<HTMLElement>} className={rootClass} style={style} data-testid="{{testId}}">
      <span className="rd-infra__badge">INFRA</span>
      <span className="rd-field__label">Environment config</span>
      <code>{rest.envKeys ?? 'DATABASE_URL, API_KEY'}</code>
      {children}
    </section>`,

  'infra-db': `<section ref={ref as React.RefObject<HTMLElement>} className={rootClass} style={style} data-testid="{{testId}}">
      <span className="rd-infra__badge">INFRA</span>
      {rest.label ? <span className="rd-field__label">{rest.label}</span> : null}
      {rest.envKey ? <code>{rest.envKey}</code> : null}
      {rest.tableOrCollection ? <span className="rd-infra__meta">{rest.tableOrCollection}</span> : null}
      {children}
    </section>`,

  'infra-server': `<section ref={ref as React.RefObject<HTMLElement>} className={rootClass} style={style} data-testid="{{testId}}">
      <span className="rd-infra__badge">INFRA</span>
      {rest.label ? <span className="rd-field__label">{rest.label}</span> : null}
      {rest.globalPrefix ? <code>globalPrefix: {rest.globalPrefix}</code> : null}
      {children}
    </section>`,

  'news-select': `<section ref={ref as React.RefObject<HTMLElement>} className={rootClass} style={style} data-testid="{{testId}}">
      {rest.label ? <span className="rd-field__label">{rest.label}</span> : null}
      <select className="rd-select" value={rest.value} onChange={(e) => rest.onChange?.(e.target.value)}>
        <option value="">{rest.placeholder ?? 'Select…'}</option>
        {(rest.options ?? []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {children}
    </section>`,

  'news-search-box': `<section ref={ref as React.RefObject<HTMLElement>} className={rootClass} style={style} data-testid="{{testId}}">
      {rest.label ? <span className="rd-field__label">{rest.label}</span> : null}
      <div className="rd-search__row">
        <input type="search" className="rd-input" placeholder={rest.placeholder ?? 'Search news…'} value={rest.value} onChange={(e) => rest.onSearch?.(e.target.value)} />
        <button type="button" className="rd-button">Search</button>
      </div>
      {children}
    </section>`,

  'news-results-table': `<section ref={ref as React.RefObject<HTMLElement>} className={rootClass} style={style} data-testid="{{testId}}">
      <header className="rd-table__header"><span>{rest.title ?? 'News results'}</span></header>
      <table className="rd-table"><thead><tr><th>Headline</th><th>Source</th><th>Region</th><th>Published</th></tr></thead><tbody /></table>
      {children}
    </section>`,

  'news-article-detail': `<section ref={ref as React.RefObject<HTMLElement>} className={rootClass} style={style} data-testid="{{testId}}">
      <header className="rd-detail__header"><span>{rest.title ?? 'Article'}</span></header>
      <p className="rd-detail__empty">{rest.emptyMessage ?? 'Select a headline in News Results'}</p>
      {children}
    </section>`,

  'status-badge': `<span ref={ref as React.RefObject<HTMLElement>} className={[rootClass, \`rd-status-badge--\${rest.tone ?? 'success'}\`].join(' ')} style={style} data-testid="{{testId}}">{rest.statusText ?? 'Active'}</span>`,

  'metric-chip': `<span ref={ref as React.RefObject<HTMLElement>} className={rootClass} style={style} data-testid="{{testId}}">
      <span className="rd-metric-chip__label">{rest.chipLabel ?? 'Metric'}</span>
      <span className="rd-metric-chip__value">{rest.chipValue ?? '—'}</span>
    </span>`,

  'three-host': `<section ref={ref as React.RefObject<HTMLElement>} className={rootClass} style={style} data-testid="{{testId}}" data-three-mode={rest.mode} data-three-title={rest.title} aria-label={rest.title ?? '3D host'}>{children}</section>`,

  'svg-inline': `<div ref={ref as React.Ref<HTMLDivElement>} className={rootClass} style={{ width: props.width ?? 96, height: props.height ?? 96, ...style }} data-testid="{{testId}}" dangerouslySetInnerHTML={{ __html: props.markup ?? '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.2"/></svg>' }} />`,

  'svg-icon': `<span ref={ref as React.Ref<HTMLSpanElement>} className={rootClass} style={{ width: props.size ?? 28, height: props.size ?? 28, color: props.color, ...style }} data-testid="{{testId}}" title={props.title} dangerouslySetInnerHTML={{ __html: props.markup ?? '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7-6.3-4.6L5.7 21l2.3-7-6-4.6h7.6z" fill="currentColor"/></svg>' }} />`,

  'live-capture': `<section ref={ref as React.RefObject<HTMLElement>} className={rootClass} style={style} data-testid="{{testId}}">
      <span className="rd-media__label">{rest.label ?? 'Live capture'}</span>
      <button type="button" className="rd-button" onClick={() => rest.onStart?.()}>Start camera</button>
      {children}
    </section>`,

  'wasm-asset': `<section ref={ref as React.RefObject<HTMLElement>} className={rootClass} style={style} data-testid="{{testId}}">
      <span className="rd-wasm__badge">WASM</span>
      <code>{rest.assetPath ?? 'wasm/modules/example.wasm'}</code>
      {rest.gluePath ? <span className="rd-wasm__glue">+ {rest.gluePath}</span> : null}
      {children}
    </section>`,

  'wasm-worker-host': `<section ref={ref as React.RefObject<HTMLElement>} className={rootClass} style={style} data-testid="{{testId}}">
      <span className="rd-wasm__label">{rest.workerLabel ?? 'Worker'}</span>
      <span className="rd-wasm__status">{rest.workerStatus ?? 'Idle'}</span>
      {children}
    </section>`,

  'wasm-module': `<section ref={ref as React.RefObject<HTMLElement>} className={rootClass} style={style} data-testid="{{testId}}">
      <span className="rd-wasm__label">{rest.moduleLabel ?? 'WASM Module'}</span>
      <code>{rest.exportName ?? 'run()'}()</code>
      {children}
    </section>`,

  fallback: `<section ref={ref as React.RefObject<HTMLElement>} className={rootClass} style={style} data-testid="{{testId}}">{children}</section>`,
};

const KIND_SETUP = {
  'line-chart': `  const series = props.points?.length
    ? props.points
    : [
        { x: 'A', y: 80 },
        { x: 'B', y: 60 },
        { x: 'C', y: 65 },
        { x: 'D', y: 40 },
        { x: 'E', y: 45 },
        { x: 'F', y: 20 },
        { x: 'G', y: 30 },
      ];
  const maxY = Math.max(...series.map((point) => point.y), 1);
  const last = Math.max(series.length - 1, 1);
  const polyline = series
    .map((point, index) => \`\${(index / last) * 240},\${88 - (point.y / maxY) * 72}\`)
    .join(' ');
`,
  'bar-chart': `  const series = props.bars?.length
    ? props.bars
    : [
        { label: 'A', value: 40 },
        { label: 'B', value: 65 },
        { label: 'C', value: 55 },
        { label: 'D', value: 80 },
        { label: 'E', value: 48 },
      ];
  const maxValue = Math.max(...series.map((bar) => bar.value), 1);
`,
  'role-gate': `  const allowedRoles = props.allowedRoles ?? [];
  const hasRoleContext = props.currentRole !== undefined && props.currentRole !== '';
  const visible =
    !hasRoleContext ||
    allowedRoles.length === 0 ||
    allowedRoles.some((allowed) => allowed === (props.currentRole ?? '').trim());
`,
};

export { KIND_PROPS };
