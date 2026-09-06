/**
 * Shared Wikimedia Commons helpers for Authoring 360 scripts.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const USER_AGENT =
  'RosettaDashDAS183/1.0 (kevin.ready@gmail.com; destination-atlas authoring-360)';

/** Max width used by fetch-authoring-360.mjs downloads. */
export const THUMB_WIDTH = 2048;

/** Native equirect must be 2:1 within this ratio tolerance. */
export const RATIO_TOLERANCE = 0.005;

export const catalogPath = path.join(
  root,
  'libs/destination-atlas/src/data/authoring-360-sources.json',
);

export const destinationsPath = path.join(
  root,
  'libs/destination-atlas/src/data/destinations.ts',
);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const API_GAP_MS = 900;

export function loadDestinationNames() {
  const text = readFileSync(destinationsPath, 'utf8');
  const map = new Map();
  const re = /\{\s*id:\s*'([^']+)',\s*name:\s*'([^']+)'/g;
  for (const match of text.matchAll(re)) {
    map.set(match[1], match[2]);
  }
  return map;
}

export function loadCatalog() {
  return JSON.parse(readFileSync(catalogPath, 'utf8'));
}

export function saveCatalog(rows) {
  writeFileSync(catalogPath, `${JSON.stringify(rows, null, 2)}\n`);
}

export function isNative21(ratio, tolerance = RATIO_TOLERANCE) {
  return Math.abs(ratio - 2) <= tolerance;
}

export function effectiveThumbDimensions(width, height, thumbWidth = THUMB_WIDTH) {
  if (!width || !height) {
    return { width: 0, height: 0, ratio: 0 };
  }
  const w = Math.min(width, thumbWidth);
  const h = Math.round((height * w) / width);
  return { width: w, height: h, ratio: w / h };
}

export function stripHtml(value = '') {
  return value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

export async function commonsApi(params) {
  const url = new URL('https://commons.wikimedia.org/w/api.php');
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, String(value));
  }
  const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!response.ok) {
    throw new Error(`Commons API ${response.status} ${response.statusText}`);
  }
  return response.json();
}

export async function fetchFileInfo(title) {
  await sleep(API_GAP_MS);
  const data = await commonsApi({
    action: 'query',
    format: 'json',
    titles: `File:${title.replace(/^File:/, '')}`,
    prop: 'imageinfo',
    iiprop: 'size|extmetadata|url',
    iiurlwidth: THUMB_WIDTH,
  });
  const page = Object.values(data.query?.pages ?? {})[0];
  if (!page || page.missing !== undefined) {
    return null;
  }
  const info = page.imageinfo?.[0];
  if (!info) {
    return null;
  }
  const meta = info.extmetadata ?? {};
  const fullW = info.width ?? 0;
  const fullH = info.height ?? 0;
  const thumbW = info.thumbwidth ?? fullW;
  const thumbH = info.thumbheight ?? fullH;
  const artist = stripHtml(meta.Artist?.value ?? '');
  const description = stripHtml(meta.ImageDescription?.value ?? '');
  const license = meta.LicenseShortName?.value ?? '';
  return {
    title: page.title.replace(/^File:/, ''),
    fullWidth: fullW,
    fullHeight: fullH,
    thumbWidth: thumbW,
    thumbHeight: thumbH,
    ratio: thumbW / thumbH,
    license,
    artist,
    description,
  };
}

const PREFERRED_KEYWORDS = [
  ['360x180', 40],
  ['equirect', 35],
  ['skyline', 28],
  ['cityscape', 28],
  ['aerial', 22],
  ['view from', 18],
  ['panorama', 10],
  ['360 degrees', 30],
  ['cbd', 12],
  ['downtown', 12],
];

const PENALTY_KEYWORDS = [
  'interior',
  'bedroom',
  'kitchen',
  'cathedral',
  'church',
  'museum',
  '.pdf',
  '.djvu',
  '.ogv',
  '.webm',
];

export function scoreCandidate(file, cityTerms) {
  const text = `${file.title} ${file.description}`.toLowerCase();
  if (!cityTerms.some((term) => text.includes(term.toLowerCase()))) {
    return null;
  }
  if (PENALTY_KEYWORDS.some((term) => text.includes(term))) {
    return null;
  }
  if (file.fullWidth < 3500) {
    return null;
  }
  if (!isNative21(file.ratio)) {
    return null;
  }
  let score = 100 - Math.abs(file.ratio - 2) * 1000;
  for (const [keyword, points] of PREFERRED_KEYWORDS) {
    if (text.includes(keyword)) {
      score += points;
    }
  }
  score += Math.min(file.fullWidth / 1000, 25);
  if (/^cc/i.test(file.license)) {
    score += 10;
  }
  return score;
}

export function buildSearchQueries(cityName, destinationId) {
  const extra = {
    'mexico-city': ['Mexico City', 'Ciudad de Mexico', 'CDMX'],
    'los-angeles': ['Los Angeles', 'LA skyline'],
    'rio': ['Rio de Janeiro', 'Rio de Janeiro Brazil'],
    'bogota': ['Bogota', 'Bogotá'],
    'cape-town': ['Cape Town'],
    'buenos-aires': ['Buenos Aires'],
    'queenstown': ['Queenstown New Zealand'],
  }[destinationId];
  const names = extra ?? [cityName];
  const queries = [];
  for (const name of names) {
    queries.push(`${name} 360x180 equirectangular`);
    queries.push(`${name} 360 degrees skyline`);
    queries.push(`${name} equirectangular panorama`);
    queries.push(`incategory:"360° panoramas with equirectangular projection" ${name}`);
  }
  return queries;
}

export async function searchCommons(query, limit = 20) {
  await sleep(API_GAP_MS);
  const data = await commonsApi({
    action: 'query',
    format: 'json',
    generator: 'search',
    gsrsearch: query,
    gsrnamespace: 6,
    gsrlimit: limit,
    prop: 'imageinfo',
    iiprop: 'size|extmetadata|url',
    iiurlwidth: THUMB_WIDTH,
  });
  const pages = Object.values(data.query?.pages ?? {});
  const out = [];
  for (const page of pages) {
    const info = page.imageinfo?.[0];
    if (!info) {
      continue;
    }
    const meta = info.extmetadata ?? {};
    out.push({
      title: page.title.replace(/^File:/, ''),
      fullWidth: info.width ?? 0,
      fullHeight: info.height ?? 0,
      thumbWidth: info.thumbwidth ?? info.width ?? 0,
      thumbHeight: info.thumbheight ?? info.height ?? 0,
      ratio: (info.thumbwidth ?? info.width) / (info.thumbheight ?? info.height),
      license: meta.LicenseShortName?.value ?? '',
      artist: stripHtml(meta.Artist?.value ?? ''),
      description: stripHtml(meta.ImageDescription?.value ?? ''),
    });
  }
  return out;
}

export function cityTermsFor(destinationId, cityName) {
  const extras = {
    'mexico-city': ['mexico city', 'ciudad de mexico', 'cdmx'],
    'los-angeles': ['los angeles', 'downtown la'],
    'rio': ['rio de janeiro', 'ipanema', 'leblon', 'morro dois'],
    'bogota': ['bogot', 'monserrate'],
    'cape-town': ['cape town', 'simon'],
    'buenos-aires': ['buenos aires'],
    'queenstown': ['queenstown'],
    'sydney': ['sydney'],
  };
  const terms = [destinationId.replace(/-/g, ' '), cityName.toLowerCase()];
  return [...terms, ...(extras[destinationId] ?? [])];
}

export function catalogEntryFromCandidate(destinationId, file) {
  const label = file.description?.slice(0, 72) || file.title.replace(/\.[^.]+$/, '').slice(0, 72);
  const credit = file.artist.split(/[,/|]/)[0]?.trim() || 'Wikimedia Commons contributors';
  return {
    destinationId,
    commonsTitle: file.title,
    label,
    credit,
    license: file.license || 'See Commons file page',
  };
}

export function auditSourceEntry(source, fileInfo) {
  if (!fileInfo) {
    return { status: 'missing-file', ratio: null };
  }
  if (source.rotateDegrees || source.inputProjection) {
    return { status: 'non-native', ratio: fileInfo.ratio, reason: 'rotate/projection' };
  }
  if (!isNative21(fileInfo.ratio)) {
    return { status: 'non-native', ratio: fileInfo.ratio, reason: 'aspect' };
  }
  return { status: 'ok', ratio: fileInfo.ratio };
}
