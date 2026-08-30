import { forwardRef, useEffect, useMemo, useState, type CSSProperties } from 'react';
import { FlexLayout } from '@rosettadash/react/layout/flex';
import { DetailHistoricList, DetailPanel, DetailStats } from '@rosettadash/react/visual/detail';
import { NewsRegionSelect } from '@rosettadash/react/visual/news/region-select';
import { NewsTypeSelect } from '@rosettadash/react/visual/news/type-select';
import { KpiCard } from '@rosettadash/react/visual/kpi';
import { StatusBadge } from '@rosettadash/react/visual/plugin/status-badge';
import { LoadingSkeleton } from '@rosettadash/react/visual/skeleton';
import { DataTable } from '@rosettadash/react/visual/table';
import { NEWS_REGIONS, NEWS_TYPES, fetchNewsBrief, type NewsStory } from './news.js';
import './NewsBrief.css';

export interface NewsBriefProps {
  defaultType?: string;
  defaultRegion?: string;
  className?: string;
  style?: CSSProperties;
}

/** Page-embed news brief composed from @rosettadash/react atoms. */
export const NewsBrief = forwardRef<HTMLElement, NewsBriefProps>(function NewsBrief(
  { defaultType = 'front_page', defaultRegion = 'global', className, style },
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
        setSelectedId(next[0]?.id ?? '');
        setStatus('ready');
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }
        setStories([]);
        setSelectedId('');
        setStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'News request failed');
      });

    return () => controller.abort();
  }, [type, region]);

  const selected = stories.find((story) => story.id === selectedId) ?? stories[0];
  const rows = useMemo(
    () =>
      stories.map((story) => ({
        id: story.id,
        name: story.headline,
        status: story.source,
        amount: story.points,
        date: story.published,
      })),
    [stories],
  );

  return (
    <FlexLayout
      ref={ref}
      title="News brief"
      direction="column"
      gap={10}
      className={['rd-news-brief', className].filter(Boolean).join(' ')}
      style={style}
    >
      <FlexLayout direction="row" gap={8} stretchItems>
        <NewsTypeSelect label="Desk" options={[...NEWS_TYPES]} value={type} onChange={setType} />
        <NewsRegionSelect
          label="Region"
          options={[...NEWS_REGIONS]}
          value={region}
          onChange={setRegion}
        />
      </FlexLayout>
      <FlexLayout direction="row" gap={8} stretchItems>
        <KpiCard
          title="Headlines"
          value={status === 'ready' ? stories.length : '—'}
          delta={selected ? `${selected.points} pts` : undefined}
        />
        <StatusBadge
          statusText={
            status === 'loading' ? 'Updating' : status === 'error' ? 'Unavailable' : 'Live feed'
          }
          tone={status === 'loading' ? 'neutral' : status === 'error' ? 'error' : 'success'}
        />
      </FlexLayout>
      {status === 'loading' ? (
        <LoadingSkeleton lines={4} />
      ) : (
        <DataTable
          title="Hacker News"
          rows={rows}
          selectedRowId={selected?.id}
          onRowSelect={setSelectedId}
          columns={[
            { key: 'name', header: 'Headline' },
            { key: 'status', header: 'By' },
            { key: 'amount', header: 'Pts', align: 'right' },
          ]}
        />
      )}
      <DetailPanel
        title="Story"
        emptyMessage={status === 'error' ? errorMessage || 'News unavailable' : 'Select a headline'}
      >
        {status === 'ready' && selected ? (
          <>
            <DetailStats
              compact
              items={[
                { label: 'Headline', value: selected.headline },
                { label: 'Author', value: selected.source },
                { label: 'Points', value: String(selected.points) },
                { label: 'Comments', value: String(selected.comments) },
              ]}
            />
            <DetailHistoricList
              compact
              title="Open"
              items={[{ label: selected.published, value: selected.url }]}
            />
          </>
        ) : null}
      </DetailPanel>
    </FlexLayout>
  );
});
