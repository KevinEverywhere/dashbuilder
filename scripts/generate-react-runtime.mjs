#!/usr/bin/env node
/**
 * Generate @rosettadash/react runtime atoms from tools/runtime-taxonomy/manifest.mjs
 * Usage: node scripts/generate-react-runtime.mjs [--write]
 */
import fs from 'fs';
import path from 'path';
import {
  PALETTE_RUNTIME_ENTRIES,
  NPM_RECIPE_ENTRIES,
  LEGACY_ALIASES,
  allRuntimeEntries,
  getEntryBemBlock,
} from '../tools/runtime-taxonomy/manifest.mjs';
import {
  renderNativeComponent,
  renderNativeSpec,
  renderIndex,
  renderLegacyAlias,
} from '../tools/runtime-taxonomy/react-templates.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const REACT_SRC = path.join(ROOT, 'packages/react/src');
const WRITE = process.argv.includes('--write');
const FORCE = process.argv.includes('--force');

function subpathDir(subpath) {
  return path.join(REACT_SRC, ...subpath.split('/'));
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeFile(relPath, content) {
  const full = path.join(ROOT, relPath);
  ensureDir(path.dirname(full));
  if (WRITE) {
    fs.writeFileSync(full, content, 'utf8');
    console.log('wrote', relPath);
  } else {
    console.log('would write', relPath);
  }
}

function generateNative(entry, force = false) {
  const dir = subpathDir(entry.subpath);
  const componentFile = path.join(dir, `${entry.exportName}.tsx`);
  if (fs.existsSync(componentFile) && !force) {
    console.log('skip existing', entry.subpath);
    return;
  }
  const bemBlock = getEntryBemBlock(entry);
  const relFromRoot = path.relative(ROOT, componentFile);
  writeFile(relFromRoot, renderNativeComponent(entry, bemBlock));
  writeFile(path.relative(ROOT, path.join(dir, 'index.ts')), renderIndex(entry));
  const specName = entry.exportName.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  writeFile(path.relative(ROOT, path.join(dir, `${specName}.spec.tsx`)), renderNativeSpec(entry, bemBlock));
}

function generateLegacyAliases() {
  for (const alias of LEGACY_ALIASES) {
    const dir = subpathDir(alias.subpath);
    writeFile(
      path.relative(ROOT, path.join(dir, 'index.ts')),
      renderLegacyAlias(alias),
    );
  }
}

function collectEntryPoints() {
  const entries = allRuntimeEntries();
  const subpaths = new Set(entries.map((e) => e.subpath));
  for (const alias of LEGACY_ALIASES) {
    subpaths.add(alias.subpath);
  }
  return [...subpaths].sort().map(
    (subpath) => `packages/react/src/${subpath}/index.ts`,
  );
}

function patchProjectJson(entryPoints) {
  const rel = 'packages/react/project.json';
  const project = JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
  project.targets.build.options.additionalEntryPoints = entryPoints;
  if (WRITE) {
    fs.writeFileSync(path.join(ROOT, rel), `${JSON.stringify(project, null, 2)}\n`, 'utf8');
    console.log('patched', rel);
  }
}

function patchPackageJson(subpaths) {
  const rel = 'packages/react/package.json';
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
  const exports = {
    '.': pkg.exports['.'],
  };
  for (const subpath of subpaths.sort()) {
    exports[`./${subpath}`] = {
      types: `./src/${subpath}/index.d.ts`,
      import: `./src/${subpath}/index.js`,
      default: `./src/${subpath}/index.js`,
    };
  }
  pkg.exports = exports;
  if (WRITE) {
    fs.writeFileSync(path.join(ROOT, rel), `${JSON.stringify(pkg, null, 2)}\n`, 'utf8');
    console.log('patched', rel);
  }
}

function patchIndexTs(subpaths) {
  const lines = subpaths
    .sort()
    .map((subpath) => `export * from './${subpath}/index.js';`);
  const content = `${lines.join('\n')}\n`;
  writeFile('packages/react/src/index.ts', content);
}

function patchTsconfigPaths(subpaths) {
  const rel = 'tsconfig.base.json';
  const tsconfig = JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
  const paths = { ...tsconfig.compilerOptions.paths };
  for (const key of Object.keys(paths)) {
    if (key.startsWith('@rosettadash/react/')) {
      delete paths[key];
    }
  }
  paths['@rosettadash/react'] = ['./packages/react/src/index.ts'];
  for (const subpath of subpaths.sort()) {
    paths[`@rosettadash/react/${subpath}`] = [
      `./packages/react/src/${subpath}/index.ts`,
    ];
  }
  tsconfig.compilerOptions.paths = paths;
  if (WRITE) {
    fs.writeFileSync(path.join(ROOT, rel), `${JSON.stringify(tsconfig, null, 2)}\n`, 'utf8');
    console.log('patched', rel);
  }
}

function main() {
  console.log(WRITE ? 'Generating react runtime…' : 'Dry run (pass --write to apply)');

  for (const entry of PALETTE_RUNTIME_ENTRIES) {
    if (entry.pattern === 'native') {
      generateNative(entry, FORCE);
    }
  }

  generateLegacyAliases();

  const subpaths = [
    ...new Set([
      ...allRuntimeEntries().map((e) => e.subpath),
      ...LEGACY_ALIASES.map((a) => a.subpath),
    ]),
  ];

  const entryPoints = collectEntryPoints();
  patchProjectJson(entryPoints);
  patchPackageJson(subpaths);
  patchIndexTs(subpaths);
  patchTsconfigPaths(subpaths);

  console.log(`\nTotal subpaths: ${subpaths.length}`);
}

main();
