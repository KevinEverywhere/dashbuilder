import { ExportService } from './export.service';
import { buildPostgresqlBundleComposite } from './export-target-matrix.fixtures';

describe('Svelte + Nest API bundle alignment', () => {
  let service: ExportService;

  beforeEach(() => {
    service = new ExportService();
  });

  it('aligns postgres rowset, Nest sales route, and Svelte fetch wiring', () => {
    const composite = buildPostgresqlBundleComposite('svelte', 'nest');
    const result = service.buildBundleExport(composite);

    expect(result.ir.routes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          method: 'GET',
          path: '/api/sales',
        }),
      ]),
    );

    const dashboard = result.files.find((file) => file.path === 'src/Dashboard.svelte');
    const dataModule = result.files.find(
      (file) => file.path === 'src/lib/data/usePg1Data.svelte.ts',
    );
    const controller = result.files.find(
      (file) => file.path === 'server/src/sales/sales.controller.ts',
    );
    const main = result.files.find((file) => file.path === 'server/src/main.ts');

    expect(dashboard?.content).toContain('usePg1Data');
    expect(dashboard?.content).toContain('pg1Data.data');

    expect(dataModule?.content).toContain("fetch('/api/sales')");

    expect(controller?.content).toContain("@Controller('sales')");
    expect(controller?.content).toContain("queryRows('sales')");

    expect(main?.content).toContain("'api'");
  });
});
