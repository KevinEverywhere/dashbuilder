import { ChangeDetectionStrategy, Component } from '@angular/core';
import { StockTrackerComponent } from './stock-tracker.component';

@Component({
  selector: 'app-stock-host',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [StockTrackerComponent],
  template: `
    <div class="rd-demo-page">
      <header class="rd-demo-page__intro">
        <p class="rd-demo-page__eyebrow">Host page</p>
        <h1>Markets column</h1>
        <p>
          The block on the right is <code>StockTrackerComponent</code> — an Angular drop-in composed
          from RosettaDash select, KPI, badge, chart, table, and detail atoms.
        </p>
      </header>
      <rd-stock-tracker />
    </div>
  `,
})
export class StockHostComponent {}
