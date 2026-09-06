import { ExportService } from './export.service';
import {
  DATABASE_ENTRY_FILES,
  DATABASE_LAYER_TARGETS,
  SERVER_ENTRY_FILES,
  SERVER_EXCLUDED_FILES,
  SERVER_TARGETS,
  UI_ENTRY_FILES,
  UI_EXCLUDED_FILES,
  UI_TARGETS,
  buildDatabaseLayerBundleComposite,
  buildPostgresqlBundleComposite,
  cartesian,
  filePaths,
} from './export-target-matrix.fixtures';

describe('Export target matrix', () => {
  let service: ExportService;

  beforeEach(() => {
    service = new ExportService();
  });

  describe('postgresql bundles (UI × server)', () => {
    it.each(cartesian(UI_TARGETS, SERVER_TARGETS))(
      'generates %s UI with %s server files',
      (ui, server) => {
        const composite = buildPostgresqlBundleComposite(ui, server);
        const result = service.buildBundleExport(composite);
        const paths = filePaths(result.files);

        expect(result.ir.targets).toEqual(
          expect.objectContaining({ ui, server, database: 'postgresql' }),
        );
        expect(paths).toContain(UI_ENTRY_FILES[ui]);
        expect(paths).toContain(SERVER_ENTRY_FILES[server]);

        for (const excluded of UI_EXCLUDED_FILES[ui]) {
          expect(paths).not.toContain(excluded);
        }

        for (const excluded of SERVER_EXCLUDED_FILES[server]) {
          expect(paths).not.toContain(excluded);
        }

        expect(result.files.length).toBeGreaterThan(8);
      },
    );
  });

  describe('database-layer bundles (UI × database)', () => {
    it.each(cartesian(UI_TARGETS, DATABASE_LAYER_TARGETS))(
      'generates %s UI with %s database layer files',
      (ui, database) => {
        const composite = buildDatabaseLayerBundleComposite(ui, database);
        const result = service.buildBundleExport(composite);
        const paths = filePaths(result.files);

        expect(result.ir.targets).toEqual(
          expect.objectContaining({ ui, server: 'nest', database }),
        );
        expect(paths).toContain(UI_ENTRY_FILES[ui]);
        expect(paths).toContain(DATABASE_ENTRY_FILES[database]);
        // DAS-185: these fixtures declare `server: 'nest'`, and a database
        // target used to short-circuit the server so no server was emitted at
        // all. A bundle now carries the UI, server, and database layers.
        expect(paths).toContain('server/src/main.ts');

        for (const excluded of UI_EXCLUDED_FILES[ui]) {
          expect(paths).not.toContain(excluded);
        }

        expect(result.files.length).toBeGreaterThan(5);
      },
    );
  });

  it('covers the full supported export target matrix', () => {
    const postgresqlCombinations = UI_TARGETS.length * SERVER_TARGETS.length;
    const databaseLayerCombinations = UI_TARGETS.length * DATABASE_LAYER_TARGETS.length;

    expect(postgresqlCombinations).toBe(20);
    expect(databaseLayerCombinations).toBe(15);
    expect(postgresqlCombinations + databaseLayerCombinations).toBe(35);
  });
});
