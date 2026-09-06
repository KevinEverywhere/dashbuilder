/**
 * Audit all 30 Destination Atlas cities for native 2:1 Commons stills.
 * Optionally swap bad sources and regenerate MP4s.
 *
 * Usage:
 *   node scripts/audit-authoring-360.mjs                 # report
 *   node scripts/audit-authoring-360.mjs --fix           # update catalog JSON
 *   node scripts/audit-authoring-360.mjs --fix --fetch   # + encode + link clips
 */
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  RATIO_TOLERANCE,
  auditSourceEntry,
  buildSearchQueries,
  catalogEntryFromCandidate,
  cityTermsFor,
  fetchFileInfo,
  loadCatalog,
  loadDestinationNames,
  saveCatalog,
  scoreCandidate,
  searchCommons,
} from './authoring-360-commons.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = new Set(process.argv.slice(2));
const shouldFix = args.has('--fix');
const shouldFetch = args.has('--fetch');

function printReport(rows) {
  console.log('\nAuthoring 360 audit (native 2:1 at 2048px thumb width)\n');
  console.log(`Tolerance: ±${RATIO_TOLERANCE} around 2:1\n`);
  console.log('destination          status        ratio   source');
  console.log('-------------------  ------------  ------  ------------------------------');
  for (const row of rows) {
    const ratio = row.ratio == null ? '  —   ' : row.ratio.toFixed(3);
    const title = row.commonsTitle ? row.commonsTitle.slice(0, 32) : '—';
    console.log(
      `${row.destinationId.padEnd(21)}${row.status.padEnd(14)}${ratio.padStart(6)}  ${title}`,
    );
    if (row.note) {
      console.log(`${''.padEnd(21)}${row.note}`);
    }
  }
  const ok = rows.filter((row) => row.status === 'ok').length;
  const shipped = rows.filter((row) => row.status !== 'unshipped').length;
  console.log(`\n${ok}/${shipped} shipped clips are native 2:1. ${rows.length - shipped} unshipped.`);
}

async function findReplacement(destinationId, cityName, currentTitle) {
  const terms = cityTermsFor(destinationId, cityName);
  const seen = new Map();
  for (const query of buildSearchQueries(cityName, destinationId)) {
    for (const file of await searchCommons(query)) {
      if (file.title === currentTitle) {
        continue;
      }
      const score = scoreCandidate(file, terms);
      if (score == null) {
        continue;
      }
      const prev = seen.get(file.title);
      if (!prev || score > prev.score) {
        seen.set(file.title, { score, file });
      }
    }
  }
  const ranked = [...seen.values()].sort((a, b) => b.score - a.score);
  return ranked[0]?.file ?? null;
}

async function main() {
  const names = loadDestinationNames();
  const catalog = loadCatalog();
  const byId = new Map(catalog.map((row) => [row.destinationId, row]));
  const destinationIds = [...names.keys()].sort();
  const report = [];
  const nextCatalog = [];
  const changedIds = [];

  for (const destinationId of destinationIds) {
    const cityName = names.get(destinationId) ?? destinationId;
    const current = byId.get(destinationId);

    if (!current) {
      if (shouldFix) {
        const replacement = await findReplacement(destinationId, cityName);
        if (replacement) {
          const entry = catalogEntryFromCandidate(destinationId, replacement);
          nextCatalog.push(entry);
          changedIds.push(destinationId);
          report.push({
            destinationId,
            status: 'added',
            ratio: replacement.ratio,
            commonsTitle: entry.commonsTitle,
            note: `added ${replacement.title}`,
          });
          continue;
        }
      }
      report.push({
        destinationId,
        status: 'unshipped',
        ratio: null,
        commonsTitle: null,
        note: shouldFix ? 'no native 2:1 found on Commons' : 'missing from catalog',
      });
      continue;
    }

    const fileInfo = await fetchFileInfo(current.commonsTitle);
    const audit = auditSourceEntry(current, fileInfo);

    if (audit.status === 'ok') {
      nextCatalog.push(current);
      report.push({
        destinationId,
        status: 'ok',
        ratio: audit.ratio,
        commonsTitle: current.commonsTitle,
      });
      continue;
    }

    if (!shouldFix) {
      nextCatalog.push(current);
      report.push({
        destinationId,
        status: audit.status,
        ratio: audit.ratio,
        commonsTitle: current.commonsTitle,
        note: audit.reason === 'aspect' ? 'not native 2:1' : 'uses rotate/projection',
      });
      continue;
    }

    const replacement = await findReplacement(destinationId, cityName, current.commonsTitle);
    if (replacement) {
      const entry = catalogEntryFromCandidate(destinationId, replacement);
      nextCatalog.push(entry);
      changedIds.push(destinationId);
      report.push({
        destinationId,
        status: 'replaced',
        ratio: replacement.ratio,
        commonsTitle: entry.commonsTitle,
        note: `was ${current.commonsTitle.slice(0, 40)}…`,
      });
      continue;
    }

    report.push({
      destinationId,
      status: 'unshipped',
      ratio: audit.ratio,
      commonsTitle: null,
      note: `removed — no native 2:1 replacement (${audit.reason ?? 'bad source'})`,
    });
    changedIds.push(destinationId);
  }

  if (shouldFix) {
    nextCatalog.sort(
      (a, b) => destinationIds.indexOf(a.destinationId) - destinationIds.indexOf(b.destinationId),
    );
    saveCatalog(nextCatalog);
    console.log(`Updated ${catalogPath}`);
    console.log(`Catalog: ${catalog.length} → ${nextCatalog.length} shipped cities`);
    if (changedIds.length > 0) {
      console.log(`Changed: ${changedIds.join(', ')}`);
    }
  }

  printReport(report);

  if (shouldFetch && shouldFix) {
    const fetchArgs = ['scripts/fetch-authoring-360.mjs'];
    if (changedIds.length > 0) {
      fetchArgs.push('--only', changedIds.join(','));
    }
    console.log('\nRegenerating MP4s…');
    execFileSync('node', fetchArgs, { cwd: root, stdio: 'inherit' });
  } else if (shouldFetch) {
    console.log('\nPass --fix with --fetch to regenerate clips after catalog changes.');
  } else if (shouldFix && changedIds.length > 0) {
    console.log('\nNext: node scripts/audit-authoring-360.mjs --fix --fetch');
    console.log('  or: npm run authoring:fetch-360 -- --only ' + changedIds.join(','));
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
