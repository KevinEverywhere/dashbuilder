#!/usr/bin/env node
/**
 * Generate @rosettadash/svelte runtime atoms from tools/runtime-taxonomy/manifest.mjs
 * Usage: node scripts/generate-svelte-runtime.mjs --write [--force]
 */
import fs from 'fs';
import path from 'path';
import {
  PALETTE_RUNTIME_ENTRIES,
  LEGACY_ALIASES,
  NPM_RECIPE_ENTRIES,
  allRuntimeEntries,
  getEntryBemBlock,
} from '../tools/runtime-taxonomy/manifest.mjs';
import {
  renderNativeSvelteComponent,
  renderSvelteTypes,
  renderSvelteSpec,
  renderSvelteIndex,
  renderLegacyAliasTypes,
  renderLegacyAliasIndex,
  exportNameToFile,
} from '../tools/runtime-taxonomy/svelte-templates.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const SVELTE_SRC = path.join(ROOT, 'packages/svelte/src');
const WRITE = process.argv.includes('--write');
const FORCE = process.argv.includes('--force');

function subpathDir(subpath) {
  return path.join(SVELTE_SRC, ...subpath.split('/'));
}

function writeFile(relPath, content) {
  const full = path.join(ROOT, relPath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  if (WRITE) {
    fs.writeFileSync(full, content, 'utf8');
    console.log('wrote', relPath);
  } else {
    console.log('would write', relPath);
  }
}

function generateNative(entry) {
  const dir = subpathDir(entry.subpath);
  const componentFile = path.join(dir, `${entry.exportName}.svelte`);
  if (fs.existsSync(componentFile) && !FORCE) {
    console.log('skip existing', entry.subpath);
    return;
  }
  const bemBlock = getEntryBemBlock(entry);
  writeFile(
    path.relative(ROOT, componentFile),
    renderNativeSvelteComponent(entry, bemBlock),
  );
  writeFile(
    path.relative(ROOT, path.join(dir, 'types.ts')),
    renderSvelteTypes(entry, entry.kind),
  );
  writeFile(path.relative(ROOT, path.join(dir, 'index.ts')), renderSvelteIndex(entry));
  writeFile(
    path.relative(ROOT, path.join(dir, `${exportNameToFile(entry.exportName)}.spec.ts`)),
    renderSvelteSpec(entry, bemBlock, entry.subpath),
  );
}

function generateLegacyAliases() {
  for (const alias of LEGACY_ALIASES) {
    const dir = subpathDir(alias.subpath);
    writeFile(
      path.relative(ROOT, path.join(dir, 'types.ts')),
      renderLegacyAliasTypes(alias),
    );
    writeFile(
      path.relative(ROOT, path.join(dir, 'index.ts')),
      renderLegacyAliasIndex(alias),
    );
  }
}

function resolveExportEntry(subpath) {
  const alias = LEGACY_ALIASES.find((a) => a.subpath === subpath);
  if (alias) {
    return {
      exportName: alias.exportName,
      componentSubpath: alias.targetSubpath,
    };
  }
  const entry = allRuntimeEntries().find((e) => e.subpath === subpath);
  if (entry) {
    return {
      exportName: entry.exportName,
      componentSubpath: subpath,
    };
  }
  return null;
}

function collectEntryPoints(subpaths) {
  return [...subpaths]
    .sort()
    .map((subpath) => `packages/svelte/src/${subpath}/types.ts`);
}

function patchProjectJson(entryPoints) {
  const rel = 'packages/svelte/project.json';
  const project = JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
  project.targets.build.options.additionalEntryPoints = entryPoints;
  if (WRITE) {
    fs.writeFileSync(path.join(ROOT, rel), `${JSON.stringify(project, null, 2)}\n`, 'utf8');
    console.log('patched', rel);
  }
}

function patchPackageJson(subpaths) {
  const rel = 'packages/svelte/package.json';
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
  const exports = { '.': pkg.exports['.'] };
  for (const subpath of subpaths.sort()) {
    const resolved = resolveExportEntry(subpath);
    if (!resolved) {
      continue;
    }
    const { exportName, componentSubpath } = resolved;
    const componentFile = `./src/${componentSubpath}/${exportName}.svelte`;
    exports[`./${subpath}`] = {
      types: `./src/${subpath}/types.d.ts`,
      svelte: componentFile,
      import: componentFile,
      default: componentFile,
    };
  }
  pkg.exports = exports;
  if (WRITE) {
    fs.writeFileSync(path.join(ROOT, rel), `${JSON.stringify(pkg, null, 2)}\n`, 'utf8');
    console.log('patched', rel);
  }
}

const EXTRA_TYPE_EXPORTS = {
  'visual/link-list': ['LinkListItem'],
  'visual/media/video-source': ['VideoFileDetail'],
  'visual/media/equirect-viewport': ['EquirectPreviewMode'],
  'domain/i18n/app-language-select': ['AppLocaleOption'],
};

function patchIndexTs(subpaths) {
  const lines = [];
  const legacySubpaths = new Set(LEGACY_ALIASES.map((a) => a.subpath));
  for (const subpath of subpaths.sort()) {
    if (legacySubpaths.has(subpath)) {
      continue;
    }
    const resolved = resolveExportEntry(subpath);
    if (!resolved) {
      continue;
    }
    const extras = EXTRA_TYPE_EXPORTS[subpath] ?? [];
    const exportNames = [...extras, `${resolved.exportName}Props`];
    lines.push(
      `export type { ${exportNames.join(', ')} } from './${subpath}/types';`,
    );
  }
  writeFile('packages/svelte/src/index.ts', `${lines.join('\n')}\n`);
}

function patchTsconfigPaths(subpaths) {
  const rel = 'tsconfig.base.json';
  const tsconfig = JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
  const paths = { ...tsconfig.compilerOptions.paths };
  for (const key of Object.keys(paths)) {
    if (key.startsWith('@rosettadash/svelte/')) {
      delete paths[key];
    }
  }
  paths['@rosettadash/svelte'] = ['./packages/svelte/src/index.ts'];
  for (const subpath of subpaths.sort()) {
    paths[`@rosettadash/svelte/${subpath}`] = [
      `./packages/svelte/src/${subpath}/types.ts`,
    ];
  }
  tsconfig.compilerOptions.paths = paths;
  if (WRITE) {
    fs.writeFileSync(path.join(ROOT, rel), `${JSON.stringify(tsconfig, null, 2)}\n`, 'utf8');
    console.log('patched', rel);
  }
}

function main() {
  console.log(WRITE ? 'Generating svelte runtime…' : 'Dry run (pass --write to apply)');

  for (const entry of PALETTE_RUNTIME_ENTRIES) {
    if (entry.pattern === 'native') {
      generateNative(entry);
    }
  }

  generateLegacyAliases();

  const subpaths = [
    ...new Set([
      ...allRuntimeEntries().map((e) => e.subpath),
      ...LEGACY_ALIASES.map((a) => a.subpath),
    ]),
  ];

  patchProjectJson(collectEntryPoints(subpaths));
  patchPackageJson(subpaths);
  patchIndexTs(subpaths);
  patchTsconfigPaths(subpaths);

  console.log(`\nTotal subpaths: ${subpaths.length}`);
}

main();
