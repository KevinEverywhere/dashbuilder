import { useEffect } from 'react';
import { YoutubeEmbed } from '@rosettadash/react/visual/media/youtube-embed';
import { VideoMetadataPanel } from '@rosettadash/react/visual/media/video-metadata';
import { SelectInput } from '@rosettadash/react/visual/input/select';
import {
  EQUIRECT_VIDEO_DESTINATIONS,
  FLAT_VIDEO_DESTINATIONS,
  attributionNoticeJson,
  destinationHasFlatVideo,
  getDestinationById,
  isEquirectDestination,
  youtubeVideoAttribution,
} from '@destination-atlas';
import type { AtlasContext } from '../state/useDestinationAtlasState';
import { localizedDestinationName } from '../lib/atlas-utils';

export const MEDIA_SOURCE = `<MediaScreen selectedId={selectedId}>
  <SelectInput label="Flat video (YouTube)" … />
  <SelectInput label="360° video (Authoring)" … />
  <YoutubeEmbed videoId={selected.youtubeId} controls />
  <VideoMetadataPanel items={videoMetadata} />
</MediaScreen>`;

type Props = Pick<AtlasContext, 'locale' | 'selectedId' | 'setSelectedId'> & {
  openAuthoringForDestination: (destinationId: string) => void;
};

export function MediaScreen({
  locale,
  selectedId,
  setSelectedId,
  openAuthoringForDestination,
}: Props) {
  const selected = getDestinationById(selectedId);
  const flatSelected = destinationHasFlatVideo(selected) ? selected : undefined;
  const equirectSelected = isEquirectDestination(selected) ? selected : undefined;

  useEffect(() => {
    if (equirectSelected) {
      openAuthoringForDestination(equirectSelected.id);
    }
  }, [equirectSelected, openAuthoringForDestination]);

  const metadataItems = flatSelected
    ? [
        { label: 'Destination', value: localizedDestinationName(flatSelected, locale) },
        { label: 'Source', value: 'YouTube embed' },
        { label: 'Projection', value: 'Flat / standard' },
        { label: 'Video id', value: flatSelected.youtubeId ?? '—' },
        { label: 'Region', value: flatSelected.region },
      ]
    : [];

  const youtubeAttributionNotice =
    flatSelected?.youtubeId != null
      ? attributionNoticeJson(youtubeVideoAttribution(flatSelected.youtubeId))
      : '';

  const handleFlatChange = (destinationId: string) => {
    setSelectedId(destinationId);
  };

  const handleEquirectChange = (destinationId: string) => {
    openAuthoringForDestination(destinationId);
  };

  return (
    <section className="da-panel">
      <h2>Media</h2>
      <p>
        Watch flat destination videos here (YouTube). Authoring autoloads 360° library clips for
        twenty-six cities; upload flat or 360° sources anytime for extract.
      </p>
      <div className="rd-media-layout">
        <div className="rd-media-primary">
          <SelectInput
            label="Destination video (YouTube)"
            options={FLAT_VIDEO_DESTINATIONS.map((dest) => ({
              value: dest.id,
              label: localizedDestinationName(dest, locale),
            }))}
            value={flatSelected?.id ?? ''}
            onChange={handleFlatChange}
          />
          {flatSelected?.youtubeId ? (
            <YoutubeEmbed
              className="rd-youtube-embed-host"
              videoId={flatSelected.youtubeId}
              title={`${localizedDestinationName(flatSelected, locale)} — destination video`}
              controls
            />
          ) : (
            <p className="da-note">Select a destination video to play the YouTube embed.</p>
          )}
          {EQUIRECT_VIDEO_DESTINATIONS.length > 0 ? (
            <>
              <SelectInput
                label="360° video (Authoring)"
                options={EQUIRECT_VIDEO_DESTINATIONS.map((dest) => ({
                  value: dest.id,
                  label: `${localizedDestinationName(dest, locale)} · 360°`,
                }))}
                value={equirectSelected?.id ?? ''}
                onChange={handleEquirectChange}
              />
              <p className="da-note">
                Choosing a 360° destination switches to Authoring and autoloads the library clip when available.
              </p>
            </>
          ) : null}
        </div>
        <div className="rd-media-tools">
          <VideoMetadataPanel items={metadataItems} />
          {youtubeAttributionNotice ? (
            <rd-attribution-notice notice={youtubeAttributionNotice} />
          ) : null}
        </div>
      </div>
    </section>
  );
}
