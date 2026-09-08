import { useEffect, useState } from 'react';
import {
  fetchNewsAdminStatus,
  refreshNewsCache,
  type NewsAdminStatus,
} from '@destination-atlas';
import { RoleGate } from '@rosettadash/react/domain/role-gate';
import type { AtlasUserRole } from '../lib/roles';
import { roleLabel } from '../lib/roles';

type Props = {
  userRole: AtlasUserRole;
};

export function NewsFeedAdminSection({ userRole }: Props) {
  const [status, setStatus] = useState<NewsAdminStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    void fetchNewsAdminStatus().then((next) => {
      if (!cancelled) {
        setStatus(next);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleRefresh(): Promise<void> {
    setBusy(true);
    setMessage('');
    const next = await refreshNewsCache();
    setStatus(next);
    setBusy(false);
    setMessage(next ? 'News cache refreshed from RSS feeds.' : 'Could not refresh news cache.');
  }

  return (
    <RoleGate
      label="News feeds (admin)"
      currentRole={userRole}
      allowedRoles={['admin']}
      statusText="Admin can refresh the cached Google News RSS ingest"
      hiddenStatusText={`News feed administration is restricted to Admin (${roleLabel(userRole)} is read-only).`}
    >
      <p className="da-note">
        Builder API ingests free Google News RSS feeds and caches results for about 24 hours.
        Refresh after changing feed queries or when headlines look stale.
      </p>
      {status ? (
        <ul className="da-news-admin-stats">
          <li>
            Cached articles: <strong>{status.articleCount}</strong>
          </li>
          <li>
            Last fetch:{' '}
            <strong>{status.fetchedAt ? new Date(status.fetchedAt).toLocaleString() : 'never'}</strong>
          </li>
          <li>
            TTL: <strong>{Math.round(status.cacheTtlMs / 3_600_000)}h</strong>
          </li>
          <li>
            Feeds: <strong>{status.feeds.length}</strong>
          </li>
        </ul>
      ) : (
        <p className="da-note">Could not read news admin status — is the builder API running?</p>
      )}
      <div className="da-byok-actions">
        <button type="button" className="rd-button" disabled={busy} onClick={() => void handleRefresh()}>
          {busy ? 'Refreshing…' : 'Refresh news cache'}
        </button>
      </div>
      {message ? <p className="da-byok-save-msg">{message}</p> : null}
    </RoleGate>
  );
}
