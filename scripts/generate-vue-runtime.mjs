#!/usr/bin/env node
/**
 * Generate @rosettadash/vue runtime atoms from tools/runtime-taxonomy/manifest.mjs
 * Usage: node scripts/generate-vue-runtime.mjs --write [--force]
 */
import fs from 'fs';
import path from 'path';
import {
  PALETTE_RUNTIME_ENTRIES,
  LEGACY_ALIASES,
  allRuntimeEntries,
  getEntryBemBlock,
} from '../tools/runtime-taxonomy/manifest.mjs';
import {
  renderNativeVueComponent,
  renderVueSpec,
  renderVueIndex,
  renderLegacyAlias,
  exportNameToFile,
} from '../tools/runtime-taxonomy/vue-templates.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const VUE_SRC = path.join(ROOT, 'packages/vue/src');
const WRITE = process.argv.includes('--write');
const FORCE = process.argv.includes('--force');

function subpathDir(subpath) {
  return path.join(VUE_SRC, ...subpath.split('/'));
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
  const file = exportNameToFile(entry.exportName);
  const componentFile = path.join(dir, `${file}.ts`);
  if (fs.existsSync(componentFile) && !FORCE) {
    console.log('skip existing', entry.subpath);
    return;
  }
  const bemBlock = getEntryBemBlock(entry);
  writeFile(path.relative(ROOT, componentFile), renderNativeVueComponent(entry, bemBlock));
  writeFile(path.relative(ROOT, path.join(dir, 'index.ts')), renderVueIndex(entry));
  writeFile(
    path.relative(ROOT, path.join(dir, `${file}.spec.ts`)),
    renderVueSpec(entry, bemBlock, entry.subpath),
  );
}

function generateLegacyAliases() {
  for (const alias of LEGACY_ALIASES) {
    writeFile(
      path.relative(ROOT, path.join(subpathDir(alias.subpath), 'index.ts')),
      renderLegacyAlias(alias),
    );
  }
}

function collectEntryPoints() {
  const subpaths = new Set(allRuntimeEntries().map((e) => e.subpath));
  for (const alias of LEGACY_ALIASES) {
    subpaths.add(alias.subpath);
  }
  return [...subpaths].sort().map((subpath) => `packages/vue/src/${subpath}/index.ts`);
}

function patchProjectJson(entryPoints) {
  const rel = 'packages/vue/project.json';
  const project = JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
  project.targets.build.options.additionalEntryPoints = entryPoints;
  if (WRITE) {
    fs.writeFileSync(path.join(ROOT, rel), `${JSON.stringify(project, null, 2)}\n`, 'utf8');
    console.log('patched', rel);
  }
}

function patchPackageJson(subpaths) {
  const rel = 'packages/vue/package.json';
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
  const exports = { '.': pkg.exports['.'] };
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
  const lines = subpaths.sort().map((subpath) => `export * from './${subpath}/index.js';`);
  writeFile('packages/vue/src/index.ts', `${lines.join('\n')}\n`);
}

function patchTsconfigPaths(subpaths) {
  const rel = 'tsconfig.base.json';
  const tsconfig = JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
  const paths = { ...tsconfig.compilerOptions.paths };
  for (const key of Object.keys(paths)) {
    if (key.startsWith('@rosettadash/vue/')) {
      delete paths[key];
    }
  }
  paths['@rosettadash/vue'] = ['./packages/vue/src/index.ts'];
  for (const subpath of subpaths.sort()) {
    paths[`@rosettadash/vue/${subpath}`] = [`./packages/vue/src/${subpath}/index.ts`];
  }
  tsconfig.compilerOptions.paths = paths;
  if (WRITE) {
    fs.writeFileSync(path.join(ROOT, rel), `${JSON.stringify(tsconfig, null, 2)}\n`, 'utf8');
    console.log('patched', rel);
  }
}

function main() {
  console.log(WRITE ? 'Generating vue runtime…' : 'Dry run (pass --write to apply)');

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

  patchProjectJson(collectEntryPoints());
  patchPackageJson(subpaths);
  patchIndexTs(subpaths);
  patchTsconfigPaths(subpaths);

  console.log(`\nTotal subpaths: ${subpaths.length}`);
}

main();
