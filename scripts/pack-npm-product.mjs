/**
 * DAS-162 — thin unscoped `rosettadash` landing page for npm.
 * Copies README + LICENSE only. Does not pack the monorepo.
 */
import { mkdirSync, copyFileSync, writeFileSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outdir = path.join(root, 'dist/packages/rosettadash');
const rootPkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));

mkdirSync(outdir, { recursive: true });
copyFileSync(path.join(root, 'README.md'), path.join(outdir, 'README.md'));
copyFileSync(path.join(root, 'LICENSE'), path.join(outdir, 'LICENSE'));

writeFileSync(
  path.join(outdir, 'package.json'),
  `${JSON.stringify(
    {
      name: 'rosettadash',
      version: rootPkg.version,
      description:
        'RosettaDash product landing page. Not a component barrel — install @rosettadash/web-components (or /react /angular /vue /svelte).',
      author: rootPkg.author,
      license: rootPkg.license,
      private: false,
      files: ['README.md', 'LICENSE'],
      publishConfig: { access: 'public' },
      repository: rootPkg.repository,
      homepage: rootPkg.homepage,
      bugs: rootPkg.bugs,
    },
    null,
    2,
  )}\n`,
);

console.log(`Wrote thin npm landing page to ${outdir} (@${rootPkg.version})`);
