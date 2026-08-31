import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { PreviewDataService } from './preview-data.service';

const contentFixture = {
  version: 1,
  sources: {
    orders: {
      kind: 'rowset',
      label: 'Orders',
      table: 'orders',
      connectionEnvKey: 'DATABASE_URL',
    },
  },
  datasets: {
    orders: {
      rows: [
        { id: '1', name: 'Globex LLC', status: 'Active', amount: 1000, date: '2026-08-07' },
      ],
    },
    news: { rows: [] },
    revenueChart: { points: [{ label: 'Mon', value: 10 }] },
    dashboardMetrics: { kpiValue: 5000, kpiDelta: 3.2 },
    filters: {
      selectOptions: [{ label: 'Revenue', value: 'revenue' }],
      dateRangeLabel: 'Last 7 days',
    },
  },
};

describe('PreviewDataService', () => {
  let service: PreviewDataService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PreviewDataService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('loads preview fixtures from the API', async () => {
    const loadPromise = service.load({
      projectName: 'Ops',
      compositeName: 'Main',
    });

    const request = httpMock.expectOne('/api/preview/data');
    expect(request.request.method).toBe('POST');
    request.flush({
      tableRows: [
        { id: '1', name: 'Ops Systems', status: 'Active', amount: 1000, date: '2026-08-01' },
      ],
      newsRows: [],
      chartPoints: [],
      selectOptions: [],
      kpiValue: 0,
      kpiDelta: 0,
      dateRangeLabel: 'Last 7 days',
      nodes: {},
    });

    await loadPromise;
    expect(service.source()).toBe('api');
    expect(service.bundle().tableRows[0]?.name).toBe('Ops Systems');
  });

  it('falls back to bundled preview content when the API fails', async () => {
    const loadPromise = service.load({ projectName: 'Broken' });
    httpMock.expectOne('/api/preview/data').flush(null, {
      status: 500,
      statusText: 'Server Error',
    });

    await loadPromise;
    expect(service.source()).toBe('default');
    expect(service.bundle().tableRows[0]?.name).toBe('Globex LLC');
  });

  it('reloads preview content from preview-content.json', async () => {
    const refreshPromise = service.refreshPreviewContentFromFile();
    httpMock.expectOne('/preview-content.json').flush(contentFixture);
    await refreshPromise;
    expect(service.source()).toBe('file');
    expect(service.previewRowPreview()).toBe('Globex LLC');
    expect(service.contentDocument()?.sources['orders']?.table).toBe('orders');
  });

  it('formats preview row names from bundled defaults', () => {
    expect(service.previewRowPreview()).toContain('Globex LLC');
  });
});
