#!/usr/bin/env node
/**
 * Generate @rosettadash/web-components runtime atoms from tools/runtime-taxonomy/manifest.mjs
 * Usage: node scripts/generate-web-components-runtime.mjs --write [--force]
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
  renderNativeWcComponent,
  renderNativeWcSpec,
  renderWcIndex,
  shouldGenerateWc,
  registerFnName,
} from '../tools/runtime-taxonomy/wc-templates.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const WC_SRC = path.join(ROOT, 'packages/web-components/src');
const WRITE = process.argv.includes('--write');
const FORCE = process.argv.includes('--force');

function subpathDir(subpath) {
  return path.join(WC_SRC, ...subpath.split('/'));
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

function fileBase(exportName) {
  return exportName.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

function generateNative(entry) {
  if (!shouldGenerateWc(entry)) {
    return;
  }
  const dir = subpathDir(entry.subpath);
  const rdFile = path.join(dir, `rd-${fileBase(entry.exportName)}.ts`);
  if (fs.existsSync(rdFile) && !FORCE) {
    console.log('skip existing', entry.subpath);
    return;
  }
  const bemBlock = getEntryBemBlock(entry);
  writeFile(path.relative(ROOT, rdFile), renderNativeWcComponent(entry, bemBlock));
  writeFile(path.relative(ROOT, path.join(dir, 'index.ts')), renderWcIndex(entry));
  writeFile(
    path.relative(ROOT, path.join(dir, `rd-${fileBase(entry.exportName)}.spec.ts`)),
    renderNativeWcSpec(entry, bemBlock),
  );
}

function existingManualSubpaths() {
  return new Set([
    ...NPM_RECIPE_ENTRIES.map((e) => e.subpath),
    ...PALETTE_RUNTIME_ENTRIES.filter((e) => e.wcImport || e.pattern === 'manual').map(
      (e) => e.subpath,
    ),
    ...LEGACY_ALIASES.map((a) => a.subpath),
    'catalog',
  ]);
}

function collectRegisterGroups() {
  const groups = {
    domain: [],
    layout: [],
    logic: [],
    visual: [],
    wasm: [],
  };

  for (const entry of PALETTE_RUNTIME_ENTRIES) {
    if (!shouldGenerateWc(entry)) {
      continue;
    }
    const top = entry.subpath.split('/')[0];
    if (top === 'domain') {
      groups.domain.push(entry);
    } else if (top === 'layout') {
      groups.layout.push(entry);
    } else if (top === 'logic') {
      groups.logic.push(entry);
    } else if (top === 'visual') {
      groups.visual.push(entry);
    } else if (top === 'wasm' || entry.subpath.startsWith('visual/wasm')) {
      groups.wasm.push(entry);
    }
  }

  return groups;
}

function renderGroupIndex(groupName, entries, exportPath) {
  const lines = [];
  for (const entry of entries) {
    if (groupName === 'visual') {
      const visualRel = `./${entry.subpath.replace('visual/', '')}/index.js`;
      lines.push(`export * from '${visualRel}';`);
    } else {
      lines.push(`export * from './${entry.subpath.replace(`${groupName}/`, '')}/index.js';`);
    }
  }

  const registerLines = entries.map(
    (e) => `  ${registerFnName(e)}();`,
  );

  return `${lines.join('\n')}

import {
${entries.map((e) => `  ${registerFnName(e)},`).join('\n')}
} from './index.js';

export function registerRosettaDash${exportPath}Elements(): void {
${registerLines.join('\n')}
}
`;
}

function patchBarrelIndexes() {
  const groups = collectRegisterGroups();

  // domain/index.ts — merge with i18n
  const domainEntries = groups.domain;
  const domainExports = domainEntries
    .map((e) => `export * from './${e.subpath.replace('domain/', '')}/index.js';`)
    .join('\n');
  const domainImports = domainEntries.map((e) => `  ${registerFnName(e)},`).join('\n');
  const domainRegs = domainEntries.map((e) => `  ${registerFnName(e)}();`).join('\n');

  writeFile(
    'packages/web-components/src/domain/index.ts',
    `export * from './i18n/index.js';
${domainEntries.map((e) => `export * from './${e.subpath.replace('domain/', '')}/index.js';`).join('\n')}

import { registerRosettaDashDomainElements as registerI18n } from './i18n/index.js';
${domainEntries.map((e) => `import { ${registerFnName(e)} } from './${e.subpath.replace('domain/', '')}/index.js';`).join('\n')}

export function registerRosettaDashDomainElements(): void {
  registerI18n();
${domainRegs}
}
`,
  );

  // layout/index.ts
  const layoutManual = ['accordion', 'accordion-link-list'];
  const layoutGenerated = groups.layout;
  writeFile(
    'packages/web-components/src/layout/index.ts',
    `${layoutManual.map((p) => `export * from './${p}/index.js';`).join('\n')}
${layoutGenerated.map((e) => `export * from './${e.subpath.replace('layout/', '')}/index.js';`).join('\n')}

import { registerLayoutAccordion } from './accordion/index.js';
import { registerLayoutAccordionLinkList } from './accordion-link-list/index.js';
${layoutGenerated.map((e) => `import { ${registerFnName(e)} } from './${e.subpath.replace('layout/', '')}/index.js';`).join('\n')}

export function registerRosettaDashLayoutElements(): void {
  registerLayoutAccordion();
  registerLayoutAccordionLinkList();
${layoutGenerated.map((e) => `  ${registerFnName(e)}();`).join('\n')}
}
`,
  );

  // logic/index.ts
  writeFile(
    'packages/web-components/src/logic/index.ts',
    groups.logic.length
      ? `${groups.logic.map((e) => `export * from './${e.subpath.replace('logic/', '')}/index.js';`).join('\n')}

${groups.logic.map((e) => `import { ${registerFnName(e)} } from './${e.subpath.replace('logic/', '')}/index.js';`).join('\n')}

export function registerRosettaDashLogicElements(): void {
${groups.logic.map((e) => `  ${registerFnName(e)}();`).join('\n')}
}
`
      : `export function registerRosettaDashLogicElements(): void {
  /* no logic atoms */
}
`,
  );

  // visual/index.ts — partial, display/media/link-list handled separately
  const visualEntries = groups.visual.filter(
    (e) =>
      !e.subpath.startsWith('visual/display/geo-map') &&
      !e.subpath.startsWith('visual/media/') &&
      e.subpath !== 'visual/link-list',
  );

  writeFile(
    'packages/web-components/src/visual/index.ts',
    `export * from './link-list/index.js';
export * from './display/index.js';
export * from './media/index.js';
${visualEntries.map((e) => `export * from './${e.subpath.replace('visual/', '')}/index.js';`).join('\n')}

import { registerVisualLinkList } from './link-list/index.js';
import { registerRosettaDashDisplayElements } from './display/index.js';
import { registerRosettaDashMediaElements } from './media/index.js';
${visualEntries.map((e) => `import { ${registerFnName(e)} } from './${e.subpath.replace('visual/', '')}/index.js';`).join('\n')}

export function registerRosettaDashVisualElements(): void {
  registerVisualLinkList();
  registerRosettaDashDisplayElements();
  registerRosettaDashMediaElements();
${visualEntries.map((e) => `  ${registerFnName(e)}();`).join('\n')}
}
`,
  );

  // display/index.ts — add generated display entries
  const displayEntries = groups.visual.filter((e) => e.subpath.startsWith('visual/display/'));
  writeFile(
    'packages/web-components/src/visual/display/index.ts',
    `export {
  RdGeoMapElement,
  DB_GEO_MAP_TAG,
  registerRdGeoMap,
  type GeoMapProps,
  type GeoMapMarker,
  type GeoMapProvider,
} from './geo-map/index.js';
${displayEntries.filter((e) => e.subpath !== 'visual/display/geo-map').map((e) => `export * from './${e.subpath.replace('visual/display/', '')}/index.js';`).join('\n')}

import { registerRdGeoMap } from './geo-map/index.js';
${displayEntries.filter((e) => e.subpath !== 'visual/display/geo-map').map((e) => `import { ${registerFnName(e)} } from './${e.subpath.replace('visual/display/', '')}/index.js';`).join('\n')}

export function registerRosettaDashDisplayElements(): void {
  registerRdGeoMap();
${displayEntries.filter((e) => e.subpath !== 'visual/display/geo-map').map((e) => `  ${registerFnName(e)}();`).join('\n')}
}
`,
  );
}

function collectSubpaths() {
  const manual = existingManualSubpaths();
  const generated = PALETTE_RUNTIME_ENTRIES.filter(shouldGenerateWc).map((e) => e.subpath);
  const all = new Set([
    ...manual,
    ...generated,
    ...LEGACY_ALIASES.map((a) => a.subpath),
    'catalog',
    'catalog/component-spec',
    'catalog/palette-catalog',
    'media',
    'wasm',
    'browser/media',
    'tokens.css',
    'styles.css',
  ]);
  return [...all].filter((s) => !s.endsWith('.css')).sort();
}

function collectEntryPoints(subpaths) {
  return subpaths
    .filter((s) => !['browser/media'].includes(s))
    .map((subpath) => {
      if (subpath === 'catalog' || subpath.startsWith('catalog/')) {
        if (subpath === 'catalog/component-spec') {
          return 'packages/web-components/src/catalog/component-spec/index.ts';
        }
        return 'packages/web-components/src/catalog/index.ts';
      }
      if (subpath === 'media') {
        return 'packages/web-components/src/visual/media/index.ts';
      }
      if (subpath === 'wasm') {
        return 'packages/web-components/src/wasm/index.ts';
      }
      return `packages/web-components/src/${subpath}/index.ts`;
    })
    .filter((p, i, arr) => arr.indexOf(p) === i)
    .sort();
}

function patchProjectJson(entryPoints) {
  const rel = 'packages/web-components/project.json';
  const project = JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
  project.targets.build.options.additionalEntryPoints = entryPoints;
  if (WRITE) {
    fs.writeFileSync(path.join(ROOT, rel), `${JSON.stringify(project, null, 2)}\n`, 'utf8');
    console.log('patched', rel);
  }
}

function patchPackageJson(subpaths) {
  const rel = 'packages/web-components/package.json';
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
  pkg.dependencies['@rosettadash/core'] = '0.1.2';
  const exports = { '.': pkg.exports['.'] };
  for (const subpath of subpaths.sort()) {
    if (subpath === 'browser/media') {
      exports['./browser/media'] = pkg.exports['./browser/media'] ?? {
        import: './browser/media.js',
        default: './browser/media.js',
      };
      continue;
    }
    if (subpath === 'tokens.css' || subpath === 'styles.css') {
      exports[`./${subpath}`] = `./styles/${subpath}`;
      continue;
    }
    if (subpath === 'media') {
      exports['./media'] = {
        types: './src/visual/media/index.d.ts',
        import: './src/visual/media/index.js',
        default: './src/visual/media/index.js',
      };
      continue;
    }
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

function patchMainIndex() {
  writeFile(
    'packages/web-components/src/index.ts',
    `export * from './domain/index.js';
export * from './layout/index.js';
export * from './logic/index.js';
export * from './visual/index.js';
export * from './wasm/index.js';
export * from './catalog/index.js';

import { registerRosettaDashDomainElements } from './domain/index.js';
import { registerRosettaDashLayoutElements } from './layout/index.js';
import { registerRosettaDashLogicElements } from './logic/index.js';
import { registerRosettaDashVisualElements } from './visual/index.js';
import { registerRosettaDashWasmElements } from './wasm/index.js';
import { registerRosettaDashCatalogElements } from './catalog/index.js';

import './register-shadow-bases.browser.js';

/** Register all RosettaDash runtime custom elements. */
export function registerRosettaDashElements(): void {
  registerRosettaDashLayoutElements();
  registerRosettaDashDomainElements();
  registerRosettaDashLogicElements();
  registerRosettaDashVisualElements();
  registerRosettaDashWasmElements();
  registerRosettaDashCatalogElements();
}
`,
  );
}

function main() {
  console.log(WRITE ? 'Generating web-components runtime…' : 'Dry run (pass --write to apply)');

  for (const entry of PALETTE_RUNTIME_ENTRIES) {
    generateNative(entry);
  }

  patchBarrelIndexes();
  patchMainIndex();

  const subpaths = collectSubpaths();
  const entryPoints = collectEntryPoints(subpaths);
  patchProjectJson(entryPoints);
  patchPackageJson(subpaths);

  console.log(`\nGenerated native entries: ${PALETTE_RUNTIME_ENTRIES.filter(shouldGenerateWc).length}`);
  console.log(`Total subpaths: ${subpaths.length}`);
}

main();
