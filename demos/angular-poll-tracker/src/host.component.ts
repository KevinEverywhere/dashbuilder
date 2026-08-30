import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PollTrackerComponent } from './poll-tracker.component';

@Component({
  selector: 'app-poll-host',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PollTrackerComponent],
  template: `
    <div class="rd-demo-page">
      <header class="rd-demo-page__intro">
        <p class="rd-demo-page__eyebrow">Host page</p>
        <h1>Politics column</h1>
        <p>
          The block on the right is <code>PollTrackerComponent</code> — an Angular drop-in composed
          from RosettaDash select, KPI, badge, charts, table, and detail atoms. The snapshot is
          bundled sample data.
        </p>
      </header>
      <rd-poll-tracker />
    </div>
  `,
})
export class PollHostComponent {}
