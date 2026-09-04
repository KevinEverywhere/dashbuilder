/**
 * Symlink (or copy) shipped Authoring 360 clips into proof apps and the
 * tour demo. Safe to run on postinstall — no network or ffmpeg required.
 */
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, symlinkSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const catalogPath = path.join(
  root,
  'libs/destination-atlas/src/data/authoring-360-sources.json',
);
const outDir = path.join(root, 'libs/destination-atlas/media/authoring-360');
const proofs = [
  'proof-react',
  'proof-angular',
  'proof-vue',
  'proof-svelte',
  'proof-web-components',
];
const mediaConsumers = [
  ...proofs.map((app) => path.join(root, 'apps', app, 'public', 'authoring-360')),
  path.join(root, 'demos', 'ce-360-tour-player', 'public', 'authoring-360'),
];

export function linkAuthoring360Media(options = {}) {
  const { quiet = false } = options;
  const log = quiet ? () => {} : console.log;
  const warn = quiet ? () => {} : console.warn;

  if (!existsSync(outDir)) {
    mkdirSync(outDir, { recursive: true });
  }

  const mp4s = readdirSync(outDir).filter((name) => name.endsWith('.mp4'));
  if (mp4s.length === 0) {
    warn(
      'Authoring 360: no clips in libs/destination-atlas/media/authoring-360/.',
    );
    warn('  Regenerate: npm run authoring:fetch-360 (needs ffmpeg + network).');
    return { linked: false, clipCount: 0 };
  }

  let destinationIds = mp4s.map((name) => name.replace(/\.mp4$/, ''));
  if (existsSync(catalogPath)) {
    const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
    destinationIds = catalog.map((row) => row.destinationId);
  }

  for (const publicDir of mediaConsumers) {
    rmSync(publicDir, { recursive: true, force: true });
    mkdirSync(path.dirname(publicDir), { recursive: true });
    try {
      symlinkSync(outDir, publicDir, 'dir');
    } catch {
      mkdirSync(publicDir, { recursive: true });
      for (const destinationId of destinationIds) {
        const src = path.join(outDir, `${destinationId}.mp4`);
        if (existsSync(src)) {
          copyFileSync(src, path.join(publicDir, `${destinationId}.mp4`));
        }
      }
    }
  }

  log(`Authoring 360: linked ${mp4s.length} clips to proof apps and demo:tour.`);
  return { linked: true, clipCount: mp4s.length };
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  linkAuthoring360Media();
}
