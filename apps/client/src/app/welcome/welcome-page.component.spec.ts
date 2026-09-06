import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import {
  ACTIVE_STACK_KEY,
  BUILDER_SESSION_KEY,
  PENDING_STACK_KEY,
} from './stack-profile-session';
import { WelcomePageComponent } from './welcome-page.component';

function expandSection(fixture: ComponentFixture<WelcomePageComponent>, section: string): void {
  const toggle = fixture.nativeElement.querySelector(`[data-testid="stack-section-toggle-${section}"]`);
  if (toggle && toggle.getAttribute('aria-expanded') !== 'true') {
    toggle.click();
    fixture.detectChanges();
  }
}

function selectReact(fixture: ComponentFixture<WelcomePageComponent>): void {
  expandSection(fixture, 'ui');
  fixture.nativeElement.querySelector('[data-testid="stack-ui-react"]').click();
  fixture.detectChanges();
}

function fillDashboardName(fixture: ComponentFixture<WelcomePageComponent>, name: string): void {
  const input = fixture.nativeElement.querySelector(
    '[data-testid="welcome-dashboard-name"]',
  ) as HTMLInputElement;
  input.value = name;
  input.dispatchEvent(new Event('input'));
  fixture.detectChanges();
}

describe('WelcomePageComponent', () => {
  let fixture: ComponentFixture<WelcomePageComponent>;
  let router: Router;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    sessionStorage.clear();

    await TestBed.configureTestingModule({
      imports: [WelcomePageComponent],
      providers: [
        provideRouter([
          { path: '', component: WelcomePageComponent },
          { path: 'builder', component: WelcomePageComponent },
        ]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(WelcomePageComponent);
    router = TestBed.inject(Router);
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
    sessionStorage.clear();
    httpMock.verify();
  });

  it('starts with collapsed stack sections and no pre-selected labels', () => {
    expect(fixture.nativeElement.querySelector('[data-testid="welcome-heading"]')?.textContent).toContain(
      'Build Components and Dashboards for your stack',
    );
    expect(fixture.nativeElement.querySelector('[data-testid="welcome-framework-prompt"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[data-testid="welcome-docs-panel"]')).toBeFalsy();
    expect(fixture.nativeElement.querySelector('[data-testid="stack-section-panel-ui"]')).toBeFalsy();
    expect(fixture.nativeElement.querySelector('[data-testid="stack-section-toggle-server"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[data-testid="stack-section-toggle-styling"]')).toBeTruthy();
    expect(
      fixture.nativeElement.querySelectorAll('.app-collapsible__summary--placeholder').length,
    ).toBeGreaterThan(0);
    expect((fixture.nativeElement.querySelector('[data-testid="welcome-continue"]') as HTMLButtonElement).disabled).toBe(true);
  });

  it('enables continue after selecting a UI framework and dashboard name', () => {
    selectReact(fixture);
    expect((fixture.nativeElement.querySelector('[data-testid="welcome-continue"]') as HTMLButtonElement).disabled).toBe(true);
    fillDashboardName(fixture, 'Ops Dashboard');
    expect((fixture.nativeElement.querySelector('[data-testid="welcome-continue"]') as HTMLButtonElement).disabled).toBe(false);
    expect(fixture.nativeElement.querySelector('[data-testid="stack-section-toggle-server"]')).toBeTruthy();
  });

  it('shows server and database sections for Web Components', () => {
    expandSection(fixture, 'ui');
    fixture.nativeElement.querySelector('[data-testid="stack-ui-web-components"]').click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="stack-section-toggle-server"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[data-testid="stack-section-toggle-database"]')).toBeTruthy();
    expandSection(fixture, 'server');
    expect(fixture.nativeElement.querySelector('[data-testid="stack-server-nuxt"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[data-testid="stack-server-next"]')).toBeTruthy();
  });

  it('shows framework-filtered styling options when styling section is expanded', () => {
    selectReact(fixture);
    expandSection(fixture, 'styling');

    expect(fixture.nativeElement.querySelector('[data-testid="stack-styling-foundation-none"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[data-testid="stack-styling-authoring-none"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[data-testid="stack-styling-authoring-css-modules"]')).toBeTruthy();
    expect(
      fixture.nativeElement.querySelector('[data-testid="stack-styling-authoring-styled-components"]'),
    ).toBeTruthy();

    fixture.nativeElement.querySelector('[data-testid="stack-ui-web-components"]').click();
    fixture.detectChanges();
    expandSection(fixture, 'styling');

    expect(
      fixture.nativeElement.querySelector('[data-testid="stack-styling-authoring-styled-components"]'),
    ).toBeFalsy();
    expect(fixture.nativeElement.querySelector('[data-testid="stack-styling-authoring-css-modules"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[data-testid="stack-styling-authoring-plain-css"]')).toBeTruthy();
  });

  it('filters component libraries by UI framework', () => {
    selectReact(fixture);
    expandSection(fixture, 'styling');
    expect(fixture.nativeElement.querySelector('[data-testid="stack-styling-library-none"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[data-testid="stack-styling-library-mui"]')).toBeTruthy();

    fixture.nativeElement.querySelector('[data-testid="stack-ui-angular"]').click();
    fixture.detectChanges();
    expandSection(fixture, 'styling');

    expect(fixture.nativeElement.querySelector('[data-testid="stack-styling-library-mui"]')).toBeFalsy();
    expect(
      fixture.nativeElement.querySelector('[data-testid="stack-styling-library-angular-material"]'),
    ).toBeTruthy();
  });

  it('starts with empty styling when a UI framework is selected', () => {
    selectReact(fixture);
    expandSection(fixture, 'styling');

    expect(
      fixture.nativeElement.querySelector('[data-testid="stack-styling-foundation-none"]')?.classList.contains(
        'welcome__chip--selected',
      ),
    ).toBe(true);
    expect(
      fixture.nativeElement.querySelector('[data-testid="stack-styling-authoring-none"]')?.classList.contains(
        'welcome__chip--selected',
      ),
    ).toBe(true);
    expect(
      fixture.nativeElement.querySelector('[data-testid="stack-styling-foundation-tailwind"]')?.classList.contains(
        'welcome__chip--selected',
      ),
    ).toBe(false);
  });

  it('allows clearing foundation and authoring selections', () => {
    selectReact(fixture);
    expandSection(fixture, 'styling');

    fixture.nativeElement.querySelector('[data-testid="stack-styling-foundation-tailwind"]').click();
    fixture.nativeElement.querySelector('[data-testid="stack-styling-authoring-css-modules"]').click();
    fixture.detectChanges();

    fixture.nativeElement.querySelector('[data-testid="stack-styling-foundation-none"]').click();
    fixture.nativeElement.querySelector('[data-testid="stack-styling-authoring-none"]').click();
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('[data-testid="stack-styling-foundation-none"]')?.classList.contains(
        'welcome__chip--selected',
      ),
    ).toBe(true);
    expect(
      fixture.nativeElement.querySelector('[data-testid="stack-styling-authoring-none"]')?.classList.contains(
        'welcome__chip--selected',
      ),
    ).toBe(true);
  });

  it('offers None for server and database when sections are expanded', () => {
    selectReact(fixture);
    expandSection(fixture, 'server');
    expandSection(fixture, 'database');

    expect(fixture.nativeElement.querySelector('[data-testid="stack-server-none"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[data-testid="stack-database-none"]')).toBeTruthy();
  });

  it('filters server options by UI framework', () => {
    selectReact(fixture);
    expandSection(fixture, 'server');

    expect(fixture.nativeElement.querySelector('[data-testid="stack-server-next"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[data-testid="stack-server-nest"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[data-testid="stack-server-express"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[data-testid="stack-server-nuxt"]')).toBeFalsy();

    expandSection(fixture, 'ui');
    fixture.nativeElement.querySelector('[data-testid="stack-ui-vue"]').click();
    fixture.detectChanges();
    expandSection(fixture, 'server');

    expect(fixture.nativeElement.querySelector('[data-testid="stack-server-nuxt"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[data-testid="stack-server-next"]')).toBeFalsy();
  });

  it('resets incompatible server when switching UI framework', () => {
    expandSection(fixture, 'ui');
    fixture.nativeElement.querySelector('[data-testid="stack-ui-vue"]').click();
    fixture.detectChanges();
    expandSection(fixture, 'server');
    fixture.nativeElement.querySelector('[data-testid="stack-server-nuxt"]').click();
    fixture.detectChanges();

    expandSection(fixture, 'ui');
    fixture.nativeElement.querySelector('[data-testid="stack-ui-react"]').click();
    fixture.detectChanges();

    const serverSummary = fixture.nativeElement.querySelector(
      '[data-testid="stack-section-toggle-server"] .app-collapsible__summary',
    );
    expect(serverSummary?.textContent).toContain('Next.js');
  });

  it('persists None server and database in pending stack profile', async () => {
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    selectReact(fixture);
    fillDashboardName(fixture, 'UI-only dashboard');
    expandSection(fixture, 'server');
    expandSection(fixture, 'database');
    fixture.nativeElement.querySelector('[data-testid="stack-server-none"]').click();
    fixture.nativeElement.querySelector('[data-testid="stack-database-none"]').click();
    fixture.detectChanges();
    fixture.nativeElement.querySelector('[data-testid="welcome-continue"]').click();

    expect(JSON.parse(sessionStorage.getItem(PENDING_STACK_KEY) ?? '{}')).toEqual({
      ui: 'react',
      server: 'none',
      database: 'none',
      styling: {
        foundation: [],
        authoring: [],
        inlineStyles: false,
      },
    });
    expect(navigateSpy).toHaveBeenCalledWith(['/builder']);
  });

  it('stores pending stack profile and navigates to builder', async () => {
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    expandSection(fixture, 'ui');
    fixture.nativeElement.querySelector('[data-testid="stack-ui-svelte"]').click();
    fixture.detectChanges();
    fillDashboardName(fixture, 'Destination Atlas');
    fixture.nativeElement.querySelector('[data-testid="welcome-continue"]').click();

    const pending = JSON.parse(sessionStorage.getItem(PENDING_STACK_KEY) ?? '{}');
    expect(pending).toEqual({
      ui: 'svelte',
      server: 'nest',
      database: 'postgresql',
      styling: {
        foundation: [],
        authoring: [],
        inlineStyles: false,
      },
    });
    expect(navigateSpy).toHaveBeenCalledWith(['/builder']);
  });

  it('stays on welcome when a builder session exists', () => {
    sessionStorage.setItem(
      BUILDER_SESSION_KEY,
      JSON.stringify({ projectId: 'p1', compositeId: 'c1' }),
    );
    sessionStorage.setItem(
      ACTIVE_STACK_KEY,
      JSON.stringify({
        ui: 'react',
        server: 'next',
        database: 'postgresql',
        styling: {
          foundation: ['tailwind'],
          authoring: ['css-modules'],
          inlineStyles: true,
        },
      }),
    );

    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture = TestBed.createComponent(WelcomePageComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="welcome-page"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[data-testid="welcome-resume-note"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[data-testid="welcome-framework-prompt"]')).toBeTruthy();
    expandSection(fixture, 'ui');
    expect(
      fixture.nativeElement.querySelector('[data-testid="stack-ui-web-components"]')?.classList.contains(
        'welcome__option--selected',
      ),
    ).toBe(false);
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('resumes builder without rewriting pending stack', async () => {
    sessionStorage.setItem(
      BUILDER_SESSION_KEY,
      JSON.stringify({ projectId: 'p1', compositeId: 'c1' }),
    );
    sessionStorage.setItem(
      ACTIVE_STACK_KEY,
      JSON.stringify({
        ui: 'react',
        server: 'next',
        database: 'postgresql',
        styling: {
          foundation: ['tailwind'],
          authoring: ['css-modules'],
          inlineStyles: true,
        },
      }),
    );

    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture = TestBed.createComponent(WelcomePageComponent);
    fixture.detectChanges();
    fixture.nativeElement.querySelector('[data-testid="welcome-continue"]').click();

    expect(sessionStorage.getItem(PENDING_STACK_KEY)).toBeNull();
    expect(navigateSpy).toHaveBeenCalledWith(['/builder']);
  });

  it('starts a fresh project with the selected stack', async () => {
    sessionStorage.setItem(
      BUILDER_SESSION_KEY,
      JSON.stringify({ projectId: 'p1', compositeId: 'c1' }),
    );
    sessionStorage.setItem(
      ACTIVE_STACK_KEY,
      JSON.stringify({
        ui: 'react',
        server: 'next',
        database: 'postgresql',
        styling: {
          foundation: ['tailwind'],
          authoring: ['css-modules'],
          inlineStyles: true,
        },
      }),
    );

    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture = TestBed.createComponent(WelcomePageComponent);
    fixture.detectChanges();
    expandSection(fixture, 'ui');
    fixture.nativeElement.querySelector('[data-testid="stack-ui-vue"]').click();
    fixture.detectChanges();
    fixture.nativeElement.querySelector('[data-testid="welcome-stack-change-new-project"]').click();
    fixture.detectChanges();
    fillDashboardName(fixture, 'Vue dashboard');
    fixture.nativeElement.querySelector('[data-testid="welcome-start-fresh"]').click();

    expect(sessionStorage.getItem(BUILDER_SESSION_KEY)).toBeNull();
    expect(JSON.parse(sessionStorage.getItem(PENDING_STACK_KEY) ?? '{}')).toEqual({
      ui: 'vue',
      server: 'nuxt',
      database: 'postgresql',
      styling: {
        foundation: [],
        authoring: [],
        inlineStyles: false,
      },
    });
    expect(navigateSpy).toHaveBeenCalledWith(['/builder']);
  });

  it('resets stack selectors to Select when Change stack first is chosen', () => {
    sessionStorage.setItem(
      BUILDER_SESSION_KEY,
      JSON.stringify({ projectId: 'p1', compositeId: 'c1' }),
    );
    sessionStorage.setItem(
      ACTIVE_STACK_KEY,
      JSON.stringify({
        ui: 'react',
        server: 'next',
        database: 'postgresql',
        styling: {
          foundation: ['tailwind'],
          authoring: ['css-modules'],
          inlineStyles: true,
        },
      }),
    );

    fixture = TestBed.createComponent(WelcomePageComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="welcome-framework-prompt"]')).toBeTruthy();

    fixture.nativeElement.querySelector('[data-testid="welcome-start-fresh"]').click();
    fixture.detectChanges();
    fixture.nativeElement.querySelector('[data-testid="welcome-start-fresh-change-first"]').click();
    fixture.detectChanges();

    const summaries = [
      ...fixture.nativeElement.querySelectorAll(
        '[data-testid^="stack-section-toggle-"] .app-collapsible__summary',
      ),
    ].map((node: Element) => node.textContent?.trim());
    expect(summaries.every((text) => text === 'Select')).toBe(true);
    expect(fixture.nativeElement.querySelector('[data-testid="welcome-framework-prompt"]')).toBeTruthy();
    expect((fixture.nativeElement.querySelector('[data-testid="welcome-continue"]') as HTMLButtonElement).disabled).toBe(
      false,
    );
    expect(fixture.nativeElement.querySelector('[data-testid="stack-section-panel-ui"]')).toBeTruthy();
  });

  describe('stack change target dialog', () => {
    function seedReturningUser(): void {
      sessionStorage.setItem(
        BUILDER_SESSION_KEY,
        JSON.stringify({ projectId: 'p1', compositeId: 'c1' }),
      );
      sessionStorage.setItem(
        ACTIVE_STACK_KEY,
        JSON.stringify({
          ui: 'react',
          server: 'next',
          database: 'postgresql',
          styling: {
            foundation: ['tailwind'],
            authoring: ['css-modules'],
            inlineStyles: true,
          },
        }),
      );
    }

    it('asks once for "existing project" then applies and persists subsequent changes silently', () => {
      seedReturningUser();
      fixture = TestBed.createComponent(WelcomePageComponent);
      fixture.detectChanges();

      expandSection(fixture, 'ui');
      fixture.nativeElement.querySelector('[data-testid="stack-ui-vue"]').click();
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('[data-testid="welcome-stack-change-dialog"]')).toBeTruthy();
      fixture.nativeElement.querySelector('[data-testid="welcome-stack-change-current"]').click();
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('[data-testid="welcome-stack-change-dialog"]')).toBeFalsy();
      httpMock.expectOne('/api/projects/p1').flush({});

      expandSection(fixture, 'database');
      fixture.nativeElement.querySelector('[data-testid="stack-database-none"]').click();
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('[data-testid="welcome-stack-change-dialog"]')).toBeFalsy();
      httpMock.expectOne('/api/projects/p1').flush({});

      expandSection(fixture, 'server');
      fixture.nativeElement.querySelector('[data-testid="stack-server-none"]').click();
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('[data-testid="welcome-stack-change-dialog"]')).toBeFalsy();
      httpMock.expectOne('/api/projects/p1').flush({});
    });

    it('asks once for "start fresh" then applies subsequent changes silently without persisting', () => {
      seedReturningUser();
      fixture = TestBed.createComponent(WelcomePageComponent);
      fixture.detectChanges();

      expandSection(fixture, 'ui');
      fixture.nativeElement.querySelector('[data-testid="stack-ui-vue"]').click();
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('[data-testid="welcome-stack-change-dialog"]')).toBeTruthy();
      fixture.nativeElement.querySelector('[data-testid="welcome-stack-change-new-project"]').click();
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('[data-testid="welcome-stack-change-dialog"]')).toBeFalsy();
      httpMock.expectNone('/api/projects/p1');

      expandSection(fixture, 'database');
      fixture.nativeElement.querySelector('[data-testid="stack-database-none"]').click();
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('[data-testid="welcome-stack-change-dialog"]')).toBeFalsy();
      httpMock.expectNone('/api/projects/p1');
    });

    it('shows the dialog again on a fresh page visit', () => {
      seedReturningUser();
      fixture = TestBed.createComponent(WelcomePageComponent);
      fixture.detectChanges();

      expandSection(fixture, 'ui');
      fixture.nativeElement.querySelector('[data-testid="stack-ui-vue"]').click();
      fixture.detectChanges();
      fixture.nativeElement.querySelector('[data-testid="welcome-stack-change-current"]').click();
      fixture.detectChanges();
      httpMock.expectOne('/api/projects/p1').flush({});

      // Simulate a new page visit: a fresh component instance re-reads the
      // (unchanged) active stack profile from session storage.
      fixture = TestBed.createComponent(WelcomePageComponent);
      fixture.detectChanges();

      expandSection(fixture, 'ui');
      fixture.nativeElement.querySelector('[data-testid="stack-ui-svelte"]').click();
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('[data-testid="welcome-stack-change-dialog"]')).toBeTruthy();
    });
  });
});
