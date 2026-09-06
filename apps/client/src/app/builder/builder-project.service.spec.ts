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
import {
  BUILDER_SESSION_KEY,
  writePendingStackProfile,
} from '../welcome/stack-profile-session';

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

  it('applies a pending welcome stack profile over a restored project default', async () => {
    sessionStorage.setItem(
      BUILDER_SESSION_KEY,
      JSON.stringify({ projectId: 'project-1', compositeId: 'composite-1' }),
    );
    writePendingStackProfile({ ui: 'svelte', server: 'nest', database: 'none' });

    const init = service.initialize();
    http.expectOne('/api/projects/project-1').flush({
      ...project,
      stackProfile: { ui: 'web-components', server: 'none', database: 'none' },
      composites: [composite],
    });
    await new Promise((resolve) => setTimeout(resolve, 0));
    http.expectOne({ method: 'PATCH', url: '/api/projects/project-1' }).flush({
      ...project,
      stackProfile: { ui: 'svelte', server: 'nest', database: 'none' },
    });
    await new Promise((resolve) => setTimeout(resolve, 0));
    http
      .expectOne({ method: 'PUT', url: '/api/projects/project-1/composites/composite-1' })
      .flush({
        ...composite,
        exportTargets: { ui: 'svelte', server: 'nest' },
      });
    await init;

    expect(state.project()?.stackProfile).toEqual({
      ui: 'svelte',
      server: 'nest',
      database: 'none',
      styling: {
        foundation: [],
        authoring: [],
        inlineStyles: false,
      },
    });
    expect(state.composite()?.exportTargets?.ui).toBe('svelte');
  });

  it('renames a project without marking the composite dirty', async () => {
    state.setProjectContext({ ...project, composites: [composite] }, composite);

    const renamePromise = service.renameProject('Destination Atlas');
    http
      .expectOne({ method: 'PATCH', url: '/api/projects/project-1' })
      .flush({ ...project, name: 'Destination Atlas' });
    await renamePromise;

    expect(state.project()?.name).toBe('Destination Atlas');
    expect(state.dirty()).toBe(false);
  });

  it('persists a provided project name when saving', async () => {
    state.setProjectContext({ ...project, composites: [composite] }, composite);
    state.markDirty();

    const savePromise = service.save('Destination Atlas');
    http
      .expectOne({ method: 'PATCH', url: '/api/projects/project-1' })
      .flush({ ...project, name: 'Destination Atlas' });
    await new Promise((resolve) => setTimeout(resolve, 0));
    http
      .expectOne({ method: 'PUT', url: '/api/projects/project-1/composites/composite-1' })
      .flush(composite);
    await savePromise;

    expect(state.project()?.name).toBe('Destination Atlas');
    expect(state.saveStatus()).toBe('saved');
  });
});
