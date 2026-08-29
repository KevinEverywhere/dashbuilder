import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DESTINATION_ATLAS_NAV_SCREENS, DESTINATION_ATLAS_SCREENS } from '@destination-atlas';
import { screenAllowedForRole } from './lib/roles';
import { SCREEN_SOURCES } from './lib/screen-sources';
import type { SettingFieldTarget } from './lib/settings-highlight';
import { AtlasStateService } from './services/atlas-state.service';
import { ThemeService } from './services/theme.service';
import { AtlasContextSummaryComponent } from './components/atlas-context-summary.component';
import {
  ComponentSourcePanelComponent,
  ScreenWorkbenchMobileToggleComponent,
  ScreenWorkbenchPreviewComponent,
} from './components/screen-workbench.component';
import { AboutScreenComponent } from './screens/about-screen.component';
import { OverviewScreenComponent } from './screens/overview-screen.component';
import { SettingsScreenComponent } from './screens/settings-screen.component';
import { MapsScreenComponent } from './screens/maps-screen.component';
import { DestinationsScreenComponent } from './screens/destinations-screen.component';
import { IntelScreenComponent } from './screens/intel-screen.component';
import { MediaScreenComponent } from './screens/media-screen.component';
import { AuthoringScreenComponent } from './screens/authoring-screen.component';
import { PlanScreenComponent } from './screens/plan-screen.component';
import { ViewsScreenComponent } from './screens/views-screen.component';
import { StackScreenComponent } from './screens/stack-screen.component';
import { GapScreenComponent } from './screens/gap-screen.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterLink,
    AtlasContextSummaryComponent,
    ScreenWorkbenchMobileToggleComponent,
    ScreenWorkbenchPreviewComponent,
    ComponentSourcePanelComponent,
    AboutScreenComponent,
    OverviewScreenComponent,
    SettingsScreenComponent,
    MapsScreenComponent,
    DestinationsScreenComponent,
    IntelScreenComponent,
    MediaScreenComponent,
    AuthoringScreenComponent,
    PlanScreenComponent,
    ViewsScreenComponent,
    StackScreenComponent,
    GapScreenComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="da-shell">
      <header class="da-header">
        <h1>Destination Atlas</h1>
        <p>Current and historic information about world locations — Angular proof (DAS-139)</p>
      </header>

      <div class="da-body-row">
        <div class="da-preview-column">
          <div class="da-context-strip">
            <da-atlas-context-summary
              [locale]="atlas.locale()"
              [userRole]="atlas.userRole()"
              [mapProvider]="atlas.mapProvider()"
              [selectedId]="atlas.selectedId()"
              [theme]="theme.theme()"
              (openSetting)="openSetting($event)"
            />
          </div>

          <nav class="da-nav da-tabbar" aria-label="Screens">
            @for (screen of visibleScreens(); track screen.id) {
              <a
                class="da-tabbar__tab"
                [routerLink]="atlas.screenRouterLink(screen.id).path"
                [queryParams]="atlas.screenRouterLink(screen.id).queryParams"
                [attr.aria-current]="atlas.screen() === screen.id ? 'page' : null"
              >
                {{ screen.label }}
              </a>
            }
          </nav>

          <div class="da-workbench-host">
            <da-screen-workbench-mobile-toggle
              [mobileView]="mobileView()"
              (viewChange)="mobileView.set($event)"
            />
            <da-screen-workbench-preview [mobileView]="mobileView()">
              @switch (atlas.screen()) {
                @case ('about') {
                  <da-about-screen />
                }
                @case ('overview') {
                  <da-overview-screen [locale]="atlas.locale()" [userRole]="atlas.userRole()" />
                }
                @case ('settings') {
                  <da-settings-screen />
                }
                @case ('maps') {
                  <da-maps-screen />
                }
                @case ('destinations') {
                  <da-destinations-screen />
                }
                @case ('media') {
                  <da-media-screen />
                }
                @case ('authoring') {
                  <da-authoring-screen />
                }
                @case ('intel') {
                  <da-intel-screen />
                }
                @case ('plan') {
                  <da-plan-screen />
                }
                @case ('views') {
                  <da-views-screen />
                }
                @case ('stack') {
                  <da-stack-screen />
                }
                @default {
                  <da-gap-screen [screenId]="atlas.screen()" [label]="activeScreenLabel()" />
                }
              }
            </da-screen-workbench-preview>
          </div>
        </div>

        <da-component-source-panel
          [source]="activeSource()"
          [hidden]="mobileView() === 'preview'"
        />
      </div>
    </div>
  `,
})
export class AppComponent {
  readonly atlas = inject(AtlasStateService);
  readonly theme = inject(ThemeService);

  readonly mobileView = signal<'preview' | 'source'>('preview');

  readonly visibleScreens = computed(() =>
    DESTINATION_ATLAS_NAV_SCREENS.filter((screen) =>
      screenAllowedForRole(screen.id, this.atlas.userRole()),
    ),
  );

  readonly activeScreenLabel = computed(() => {
    const active = DESTINATION_ATLAS_SCREENS.find((screen) => screen.id === this.atlas.screen());
    return active?.label ?? this.atlas.screen();
  });

  readonly activeSource = computed(() => SCREEN_SOURCES[this.atlas.screen()] ?? '');

  openSetting(field: SettingFieldTarget | 'theme' | 'ai'): void {
    this.atlas.setHighlightTarget(field === 'theme' ? 'theme' : field === 'ai' ? 'ai' : field);
    this.atlas.setScreen('settings');
  }
}
