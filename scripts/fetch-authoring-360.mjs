/**
 * DAS-181 / DAS-183 — download Wikimedia Commons 2:1 stills and encode 8s
 * silent MP4s for Destination Atlas Authoring.
 *
 * Usage: node scripts/fetch-authoring-360.mjs
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { linkAuthoring360Media } from './link-authoring-360.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const catalogPath = path.join(
  root,
  'libs/destination-atlas/src/data/authoring-360-sources.json',
);
const outDir = path.join(root, 'libs/destination-atlas/media/authoring-360');
const stillDir = path.join(root, '.local/authoring-360-stills');

const USER_AGENT =
  'RosettaDashDAS181/1.0 (kevin.ready@gmail.com; destination-atlas authoring clips)';

const sources = JSON.parse(readFileSync(catalogPath, 'utf8'));
const onlyArg = process.argv.indexOf('--only');
const onlyIds =
  onlyArg >= 0 && process.argv[onlyArg + 1]
    ? new Set(process.argv[onlyArg + 1].split(',').map((id) => id.trim()).filter(Boolean))
    : null;

function commonsThumbUrl(title) {
  const file = title.startsWith('File:') ? title.slice(5) : title;
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=2048`;
}

async function download(url, dest) {
  const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText} for ${url}`);
  }
  const bytes = Buffer.from(await response.arrayBuffer());
  writeFileSync(dest, bytes);
}

function buildVideoFilter({ rotateDegrees = 0, inputProjection } = {}) {
  if (inputProjection === 'cylindrical') {
    return 'v360=input=cylindrical:output=equirect:w=2048:h=1024,setsar=1';
  }
  const rotate = Number(rotateDegrees) || 0;
  const transpose =
    rotate === 90 ? 'transpose=1,' : rotate === 270 ? 'transpose=2,' : rotate === 180 ? 'hflip,vflip,' : '';
  return `${transpose}scale=2048:1024:force_original_aspect_ratio=decrease,pad=2048:1024:(ow-iw)/2:(oh-ih)/2,setsar=1`;
}

function encodeMp4(stillPath, mp4Path, source) {
  execFileSync(
    'ffmpeg',
    [
      '-y',
      '-loop',
      '1',
      '-i',
      stillPath,
      '-t',
      '8',
      '-vf',
      buildVideoFilter(source),
      '-c:v',
      'libx264',
      '-pix_fmt',
      'yuv420p',
      '-r',
      '24',
      '-an',
      '-movflags',
      '+faststart',
      mp4Path,
    ],
    { stdio: 'inherit' },
  );
}

mkdirSync(outDir, { recursive: true });
mkdirSync(stillDir, { recursive: true });

for (const source of sources) {
  if (onlyIds && !onlyIds.has(source.destinationId)) {
    continue;
  }
  const stillPath = path.join(stillDir, `${source.destinationId}.jpg`);
  const mp4Path = path.join(outDir, `${source.destinationId}.mp4`);
  console.log(`\n${source.destinationId} — ${source.label}`);
  await download(commonsThumbUrl(source.commonsTitle), stillPath);
  encodeMp4(stillPath, mp4Path, source);
}

linkAuthoring360Media();
console.log(`\nWrote ${sources.length} clips to ${outDir}`);
console.log('Linked apps/*/public/authoring-360 and demos/ce-360-tour-player/public/authoring-360');
