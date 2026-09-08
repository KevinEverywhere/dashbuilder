import { defineComponent, h, type PropType, type SlotsType, type VNode } from 'vue';

export interface NewsResultsRow {
  id: string;
  headline?: string;
  source?: string;
  region?: string;
  published?: string;
  url?: string;
}

export interface NewsResultsTableProps {
  title?: string;
  className?: string;
  rows?: NewsResultsRow[];
  selectedRowId?: string;
  /** Headlines open the publisher URL. Default false when row selection is enabled. */
  linkHeadlines?: boolean;
}

/** @rosettadash/vue/visual/news/results-table — visual.news.results-table */
export const NewsResultsTable = defineComponent({
  name: 'RdNewsResultsTable',
  props: {
    className: { type: String as PropType<string | undefined>, default: undefined },
    title: { type: String as PropType<string | undefined>, default: undefined },
    rows: { type: Array as PropType<NewsResultsRow[]>, default: () => [] },
    selectedRowId: { type: String as PropType<string | undefined>, default: undefined },
    linkHeadlines: { type: Boolean as PropType<boolean | undefined>, default: undefined },
  },
  emits: ['rowSelect'],
  slots: Object as SlotsType<{ default?: () => VNode[] }>,
  setup(props, { emit, slots, attrs }) {
    function openRow(row: NewsResultsRow): void {
      const linkHeadlines = props.linkHeadlines ?? true;
      if (!linkHeadlines) {
        emit('rowSelect', row.id);
        return;
      }
      if (row.url) {
        window.open(row.url, '_blank', 'noopener,noreferrer');
      }
    }

    return () => {
      const linkHeadlines = props.linkHeadlines ?? true;
      const rootClass = ['rd-news-results-table', props.className, typeof attrs.class === 'string' ? attrs.class : '']
        .filter(Boolean)
        .join(' ');
      return h('section', { class: rootClass, 'data-testid': 'rd-news-results-table' }, [
        h('header', { class: 'rd-table__header' }, [
          h('span', null, props.title ?? 'News results'),
          props.rows.length ? h('span', { class: 'rd-table__count' }, `${props.rows.length} articles`) : null,
        ]),
        h('div', { class: 'rd-table__scroll' }, [
          h('table', { class: 'rd-table__table' }, [
            h('thead', null, h('tr', null, ['Headline', 'Source', 'Region', 'Published'].map((col) => h('th', { key: col }, col)))),
            h(
              'tbody',
              null,
              props.rows.map((row) =>
                h(
                  'tr',
                  {
                    key: row.id,
                    class: [
                      'rd-table__row',
                      props.selectedRowId === row.id ? 'rd-table__row--selected' : '',
                      'rd-table__row--interactive',
                    ]
                      .filter(Boolean)
                      .join(' '),
                    onClick: () => openRow(row),
                  },
                  [
                    h('td', null, [
                      row.url && linkHeadlines
                        ? h(
                            'a',
                            {
                              href: row.url,
                              target: '_blank',
                              rel: 'noopener noreferrer',
                              class: 'rd-news-results-table__link',
                              onClick: (event: MouseEvent) => event.stopPropagation(),
                            },
                            row.headline ?? '—',
                          )
                        : row.headline ?? '—',
                    ]),
                    h('td', null, row.source ?? '—'),
                    h('td', null, row.region ?? '—'),
                    h('td', null, row.published ?? '—'),
                  ],
                ),
              ),
            ),
          ]),
        ]),
        slots.default?.(),
      ]);
    };
  },
});

export type NewsResultsTableComponent = typeof NewsResultsTable;
