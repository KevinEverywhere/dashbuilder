import { forwardRef, type CSSProperties, type ReactNode } from 'react';

export interface NewsResultsRow {
  id: string;
  url?: string;
  [key: string]: string | number | undefined;
}

export interface NewsResultsColumn {
  key: string;
  header: string;
  align?: 'left' | 'right' | 'center';
  format?: (value: unknown, row: NewsResultsRow) => string;
}

export interface NewsResultsTableProps {
  title?: string;
  rows?: NewsResultsRow[];
  columns?: NewsResultsColumn[];
  selectedRowId?: string;
  onRowSelect?: (rowId: string) => void;
  /** Headlines open the publisher URL. Default false when `onRowSelect` is set. */
  linkHeadlines?: boolean;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

const DEFAULT_COLUMNS: NewsResultsColumn[] = [
  { key: 'headline', header: 'Headline' },
  { key: 'source', header: 'Source' },
  { key: 'region', header: 'Region' },
  { key: 'published', header: 'Published' },
];

function cellValue(row: NewsResultsRow, column: NewsResultsColumn): string {
  const raw = row[column.key];
  if (column.format) {
    return column.format(raw, row);
  }
  if (raw === undefined || raw === null) {
    return '—';
  }
  return String(raw);
}

function openArticleUrl(url: string | undefined): void {
  if (!url) {
    return;
  }
  window.open(url, '_blank', 'noopener,noreferrer');
}

function renderCell(
  row: NewsResultsRow,
  column: NewsResultsColumn,
  linkHeadlines: boolean,
): ReactNode {
  const value = cellValue(row, column);
  if (column.key === 'headline' && row.url && linkHeadlines) {
    return (
      <a
        href={row.url}
        target="_blank"
        rel="noopener noreferrer"
        className="rd-news-results-table__link"
        onClick={(event) => event.stopPropagation()}
      >
        {value}
      </a>
    );
  }
  return value;
}

/** @rosettadash/react/visual/news/results-table — visual.news.results-table */
export const NewsResultsTable = forwardRef<HTMLElement, NewsResultsTableProps>(function NewsResultsTable(
  props,
  ref,
) {
  const { className, style, children } = props;
  const rootClass = ['rd-news-results-table', 'rd-table', className].filter(Boolean).join(' ');
  const columns = props.columns?.length ? props.columns : DEFAULT_COLUMNS;
  const rows = props.rows ?? [];
  const linkHeadlines = props.linkHeadlines ?? !props.onRowSelect;

  return (
    <section ref={ref as React.RefObject<HTMLElement>} className={rootClass} style={style} data-testid="rd-news-results-table">
      <header className="rd-table__header">
        <span>{props.title ?? 'News results'}</span>
        {rows.length ? <span className="rd-table__count">{rows.length} articles</span> : null}
      </header>
      <div className="rd-table__scroll">
        <table className="rd-table__table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={column.align ? `rd-table__cell--${column.align}` : undefined}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const selected = props.selectedRowId === row.id;
              const interactive = Boolean(props.onRowSelect || (linkHeadlines && row.url));
              return (
                <tr
                  key={row.id}
                  className={[
                    'rd-table__row',
                    selected ? 'rd-table__row--selected' : '',
                    interactive ? 'rd-table__row--interactive' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  aria-selected={selected || undefined}
                  onClick={() => {
                    if (props.onRowSelect) {
                      props.onRowSelect(row.id);
                      return;
                    }
                    if (linkHeadlines && row.url) {
                      openArticleUrl(row.url);
                    }
                  }}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={column.align ? `rd-table__cell--${column.align}` : undefined}
                    >
                      {renderCell(row, column, linkHeadlines)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {children}
    </section>
  );
});
