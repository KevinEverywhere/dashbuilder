import { CITIES, filterListings, formatUsd, LISTINGS, type Listing } from './listings';
import './ListingBrowser.css';

export interface ListingBrowserOptions {
  defaultCity?: string;
  listings?: Listing[];
}

function createEl(tag: string, attrs: Record<string, string> = {}, className?: string): HTMLElement {
  const node = document.createElement(tag);
  for (const [name, value] of Object.entries(attrs)) {
    node.setAttribute(name, value);
  }
  if (className) {
    node.className = className;
  }
  return node;
}

function cityOptions(): string {
  return JSON.stringify([{ value: '', label: 'All cities' }, ...CITIES]);
}

function tableRows(listings: Listing[]): string {
  return JSON.stringify(
    listings.map((listing) => ({
      id: listing.id,
      name: listing.title,
      status: listing.status,
      amount: formatUsd(listing.price),
      date: listing.listed,
    })),
  );
}

function markersFor(listings: Listing[]): Array<{ id: string; lat: number; lng: number; label: string }> {
  return listings.map((listing) => ({
    id: listing.id,
    lat: listing.lat,
    lng: listing.lng,
    label: listing.title,
  }));
}

function badgeTone(status: Listing['status']): 'success' | 'warning' {
  return status === 'For sale' ? 'success' : 'warning';
}

export function createListingBrowser(options: ListingBrowserOptions = {}): HTMLElement {
  const all = options.listings ?? LISTINGS;
  let city = options.defaultCity ?? 'San Francisco';
  if (city && !CITIES.some((entry) => entry.value === city)) {
    city = 'San Francisco';
  }
  let visible = filterListings(city, all);
  let selected: Listing | undefined = visible[0] ?? all[0];

  const root = createEl(
    'rd-flex-layout',
    { title: 'Listings', direction: 'column', gap: '10' },
    'rd-listing-browser',
  );
  const select = createEl('rd-select-input', {
    label: 'City',
    options: cityOptions(),
    value: city,
  });
  const map = createEl(
    'rd-geo-map',
    {
      provider: 'leaflet',
      center: selected ? JSON.stringify({ lat: selected.lat, lng: selected.lng }) : '',
      zoom: '12',
      'selected-id': selected?.id ?? '',
    },
    'rd-listing-browser__map',
  );
  const metrics = createEl('rd-flex-layout', { direction: 'row', gap: '8' });
  const kpi = createEl('rd-kpi-card', {
    title: selected ? selected.title : 'List price',
    value: selected ? formatUsd(selected.price) : '—',
  });
  if (selected) {
    kpi.setAttribute('delta', `${selected.beds} bed`);
  }
  const badge = createEl('rd-status-badge', {
    'status-text': selected?.status ?? '—',
    tone: selected ? badgeTone(selected.status) : 'neutral',
  });
  const table = createEl('rd-data-table', {
    title: city || 'All cities',
    rows: tableRows(visible),
    'selected-row-id': selected?.id ?? '',
  });
  const detail = createEl('rd-detail-panel', {
    title: 'Home',
    'empty-message': selected ? `${selected.city} · listed ${selected.listed}` : 'Select a listing',
  });
  const facts = document.createElement('dl');
  facts.className = 'rd-listing-browser__facts';

  metrics.append(kpi, badge);
  detail.append(facts);
  root.append(select, map, metrics, table, detail);

  const paintFacts = (listing: Listing | undefined) => {
    facts.replaceChildren();
    if (!listing) {
      return;
    }
    const rows: Array<[string, string]> = [
      ['Title', listing.title],
      ['City', listing.city],
      ['Price', formatUsd(listing.price)],
      ['Beds', String(listing.beds)],
      ['Status', listing.status],
      ['Listed', listing.listed],
    ];
    for (const [label, value] of rows) {
      const row = document.createElement('div');
      const dt = document.createElement('dt');
      const dd = document.createElement('dd');
      dt.textContent = label;
      dd.textContent = value;
      row.append(dt, dd);
      facts.append(row);
    }
  };

  const syncMap = (listings: Listing[], listing: Listing | undefined) => {
    const host = map as HTMLElement & { setProperty?: (name: string, value: unknown) => void };
    if (listing) {
      map.setAttribute('center', JSON.stringify({ lat: listing.lat, lng: listing.lng }));
      map.setAttribute('selected-id', listing.id);
    }
    host.setProperty?.('markers', markersFor(listings));
  };

  const applySelection = (listing: Listing | undefined) => {
    selected = listing;
    table.setAttribute('selected-row-id', listing?.id ?? '');
    kpi.setAttribute('title', listing ? listing.title : 'List price');
    kpi.setAttribute('value', listing ? formatUsd(listing.price) : '—');
    if (listing) {
      kpi.setAttribute('delta', `${listing.beds} bed`);
      badge.setAttribute('status-text', listing.status);
      badge.setAttribute('tone', badgeTone(listing.status));
      detail.setAttribute('empty-message', `${listing.city} · listed ${listing.listed}`);
    } else {
      kpi.removeAttribute('delta');
      badge.setAttribute('status-text', '—');
      badge.setAttribute('tone', 'neutral');
      detail.setAttribute('empty-message', 'Select a listing');
    }
    paintFacts(listing);
    syncMap(visible, listing);
  };

  const applyCity = (nextCity: string) => {
    city = nextCity;
    visible = filterListings(city, all);
    select.setAttribute('value', city);
    table.setAttribute('title', city || 'All cities');
    table.setAttribute('rows', tableRows(visible));
    const keep = visible.find((listing) => listing.id === selected?.id) ?? visible[0];
    applySelection(keep);
  };

  select.addEventListener('value-change', (event) => {
    applyCity((event as CustomEvent<{ value?: string }>).detail?.value ?? '');
  });

  table.addEventListener('row-select', (event) => {
    const id = (event as CustomEvent<{ id?: string }>).detail?.id;
    const next = visible.find((listing) => listing.id === id);
    if (next) {
      applySelection(next);
    }
  });

  map.addEventListener('marker-select', (event) => {
    const id = (event as CustomEvent<{ id?: string }>).detail?.id;
    const next = visible.find((listing) => listing.id === id);
    if (next) {
      applySelection(next);
    }
  });

  paintFacts(selected);
  queueMicrotask(() => syncMap(visible, selected));

  return root;
}
