import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SportsScoreboardComponent } from './sports-scoreboard.component';

@Component({
  selector: 'app-sports-host',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SportsScoreboardComponent],
  template: `
    <div class="rd-demo-page">
      <header class="rd-demo-page__intro">
        <p class="rd-demo-page__eyebrow">Host page</p>
        <h1>Sports column</h1>
        <p>
          The block on the right is <code>SportsScoreboardComponent</code> — an Angular drop-in
          composed from RosettaDash select, KPI, badge, chart, table, and detail atoms.
        </p>
      </header>
      <rd-sports-scoreboard />
    </div>
  `,
})
export class SportsHostComponent {}
