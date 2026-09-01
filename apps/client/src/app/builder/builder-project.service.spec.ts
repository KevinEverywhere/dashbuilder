import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import type { Composite, Project } from '@rosettadash/core';
import { BuilderAssistanceService } from './builder-assistance.service';
import { BuilderProjectService } from './builder-project.service';
import { BuilderStateService } from './builder-state.service';

describe('BuilderProjectService', () => {
  let service: BuilderProjectService;
  let state: BuilderStateService;
  let http: HttpTestingController;

  const project: Project = {
    id: 'project-1',
    name: 'Untitled Dashboard',
    composites: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
  const composite: Composite = {
    id: 'composite-1',
    version: 1,
    name: 'Main',
    nodes: [],
    bindings: [],
  };

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        BuilderProjectService,
        BuilderStateService,
        BuilderAssistanceService,
      ],
    });
    service = TestBed.inject(BuilderProjectService);
    state = TestBed.inject(BuilderStateService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('bootstraps a local workspace when project load fails', async () => {
    const init = service.initialize();

    http.expectOne({ method: 'POST', url: '/api/projects' }).flush('down', {
      status: 0,
      statusText: 'Unknown Error',
    });

    await init;

    expect(state.errorMessage()).toBeNull();
    expect(state.project()?.name).toBe('Untitled Dashboard');
    expect(state.composite()?.nodes).toEqual([]);
    expect(state.loading()).toBe(false);
  });

  it('surfaces save failures in state without blocking the builder', async () => {
    state.setProjectContext({ ...project, composites: [composite] }, composite);
    state.markDirty();

    const savePromise = service.save().catch(() => undefined);
    http
      .expectOne({ method: 'PUT', url: '/api/projects/project-1/composites/composite-1' })
      .flush({ message: 'Validation failed' }, { status: 400, statusText: 'Bad Request' });
    await savePromise;

    expect(state.saveStatus()).toBe('error');
    expect(state.errorMessage()).toBe('Validation failed');
  });

  it('describes unreachable servers on save', async () => {
    state.setProjectContext({ ...project, composites: [composite] }, composite);
    state.markDirty();

    const savePromise = service.save().catch(() => undefined);
    http
      .expectOne({ method: 'PUT', url: '/api/projects/project-1/composites/composite-1' })
      .error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });
    await savePromise;

    expect(state.errorMessage()).toBe('Could not reach the server. Is it running?');
    expect(state.errorMessage()).not.toBe(
      'Something went wrong while talking to the server.',
    );
  });
});
