import { forwardRef, useEffect, useMemo, useState, type CSSProperties } from 'react';
import { FlexLayout } from '@rosettadash/react/layout/flex';
import { DetailPanel, DetailStats } from '@rosettadash/react/visual/detail';
import { NewsRegionSelect } from '@rosettadash/react/visual/news/region-select';
import { NewsTypeSelect } from '@rosettadash/react/visual/news/type-select';
import { KpiCard } from '@rosettadash/react/visual/kpi';
import { StatusBadge } from '@rosettadash/react/visual/plugin/status-badge';
import { DataTable } from '@rosettadash/react/visual/table';
import { NEWS_REGIONS, NEWS_TYPES, fetchNewsBrief, type NewsStory } from './news.js';
import './NewsBrief.css';

const DEFAULT_WIDTH = '34rem';
const DEFAULT_HEIGHT = '36rem';
const SLOT_COUNT = 8;

const TABLE_COLUMNS = [
  { key: 'name', header: 'Headline', width: '62%' },
  { key: 'status', header: 'By', width: '22%' },
  { key: 'amount', header: 'Pts', align: 'right' as const, width: '16%' },
];

const PLACEHOLDER_ROWS = Array.from({ length: SLOT_COUNT }, (_, index) => ({
  id: `slot-${index}`,
  name: '\u00a0',
  status: '\u00a0',
  amount: '\u00a0',
}));

function cssSize(value: string | number | undefined, fallback: string): string {
  if (value == null) {
    return fallback;
  }
  return typeof value === 'number' ? `${value}px` : value;
}

export interface NewsBriefProps {
  defaultType?: string;
  defaultRegion?: string;
  width?: string | number;
  height?: string | number;
  className?: string;
  style?: CSSProperties;
}

/** Page-embed news brief composed from @rosettadash/react atoms. */
export const NewsBrief = forwardRef<HTMLElement, NewsBriefProps>(function NewsBrief(
  {
    defaultType = 'front_page',
    defaultRegion = 'global',
    width = DEFAULT_WIDTH,
    height = DEFAULT_HEIGHT,
    className,
    style,
  },
  ref,
) {
  const [type, setType] = useState(defaultType);
  const [region, setRegion] = useState(defaultRegion);
  const [stories, setStories] = useState<NewsStory[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    setStatus('loading');
    setErrorMessage('');

    fetchNewsBrief(type, region, controller.signal)
      .then((next) => {
        setStories(next);
        setSelectedId((current) =>
          next.some((story) => story.id === current) ? current : (next[0]?.id ?? ''),
        );
        setStatus('ready');
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }
        setStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'News request failed');
      });

    return () => controller.abort();
  }, [type, region]);

  const selected = stories.find((story) => story.id === selectedId) ?? stories[0];
  const rows = useMemo(() => {
    const filled = stories.slice(0, SLOT_COUNT).map((story) => ({
      id: story.id,
      name: story.headline,
      status: story.source,
      amount: story.points,
      date: story.published,
    }));
    if (filled.length >= SLOT_COUNT) {
      return filled;
    }
    return [
      ...filled,
      ...PLACEHOLDER_ROWS.slice(filled.length).map((row, index) => ({
        ...row,
        id: `${row.id}-${index}`,
      })),
    ];
  }, [stories]);

  const boxStyle: CSSProperties = {
    width: cssSize(width, DEFAULT_WIDTH),
    height: cssSize(height, DEFAULT_HEIGHT),
    ...style,
  };

  return (
    <FlexLayout
      ref={ref}
      direction="column"
      gap={10}
      className={['rd-news-brief', !stories.length ? 'rd-news-brief--empty' : '', className]
        .filter(Boolean)
        .join(' ')}
      style={boxStyle}
    >
      <FlexLayout direction="row" gap={8} density="compact" className="rd-news-brief__header">
        <span className="rd-news-brief__title">News brief</span>
        <StatusBadge
          statusText={
            status === 'loading' ? 'Updating' : status === 'error' ? 'Unavailable' : 'Live'
          }
          tone={status === 'loading' ? 'neutral' : status === 'error' ? 'error' : 'success'}
        />
      </FlexLayout>
      <FlexLayout direction="row" gap={8} density="compact" className="rd-news-brief__toolbar">
        <NewsTypeSelect label="Desk" options={[...NEWS_TYPES]} value={type} onChange={setType} />
        <NewsRegionSelect
          label="Region"
          options={[...NEWS_REGIONS]}
          value={region}
          onChange={setRegion}
        />
        <KpiCard
          title="Headlines"
          value={stories.length ? stories.length : '—'}
          delta={selected ? `${selected.points} pts` : undefined}
        />
      </FlexLayout>
      <DataTable
        className="rd-news-brief__table"
        title="Hacker News"
        rows={rows}
        selectedRowId={selected?.id}
        onRowSelect={stories.length ? setSelectedId : undefined}
        columns={TABLE_COLUMNS}
      />
      <DetailPanel
        className="rd-news-brief__story"
        title="Story"
        emptyMessage={
          status === 'error' ? errorMessage || 'News unavailable' : 'Select a headline'
        }
      >
        <p className="rd-news-brief__headline">{selected?.headline ?? '\u00a0'}</p>
        <DetailStats
          compact
          items={[
            { label: 'Author', value: selected?.source ?? '—' },
            { label: 'Points', value: selected ? String(selected.points) : '—' },
            { label: 'Comments', value: selected ? String(selected.comments) : '—' },
            { label: 'Published', value: selected?.published ?? '—' },
          ]}
        />
        <p className="rd-news-brief__open">
          {selected ? (
            <a href={selected.url} target="_blank" rel="noreferrer">
              Open story
            </a>
          ) : (
            <span>Open story</span>
          )}
        </p>
      </DetailPanel>
    </FlexLayout>
  );
});
