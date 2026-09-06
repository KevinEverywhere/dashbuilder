import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import {
  fetchParityOrders,
  parityOrdersEndpoint,
  parityServerLabel,
  parityStackSetupHint,
  PARITY_ORDERS_TABLE,
  type ParityOrdersResult,
} from '@destination-atlas';
import { MongodbInfra } from '@rosettadash/angular/infra/mongodb';
import { MysqlInfra } from '@rosettadash/angular/infra/mysql';
import { PostgresqlInfra } from '@rosettadash/angular/infra/postgresql';
import { SupabaseInfra } from '@rosettadash/angular/infra/supabase';
import { ExpressServerInfra } from '@rosettadash/angular/infra/server/express';
import { NestServerInfra } from '@rosettadash/angular/infra/server/nest';
import { NextServerInfra } from '@rosettadash/angular/infra/server/next';
import { NuxtServerInfra } from '@rosettadash/angular/infra/server/nuxt';
import { DataTable } from '@rosettadash/angular/visual/table';
import { AtlasStateService } from '../services/atlas-state.service';
import { ConsumerSecretsService } from '../services/consumer-secrets.service';
import { RoleGatePanelComponent } from '../components/role-gate-panel.component';

const STACK_ENV_KEYS = ['DATABASE_URL', 'GOOGLE_MAPS_KEY', 'FEATURE_FLAGS'];

@Component({
  selector: 'da-stack-screen',
  standalone: true,
  imports: [
    PostgresqlInfra,
    MongodbInfra,
    MysqlInfra,
    SupabaseInfra,
    NestServerInfra,
    ExpressServerInfra,
    NextServerInfra,
    NuxtServerInfra,
    DataTable,
    RoleGatePanelComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="da-panel">
      <h2>Stack</h2>
      <p>
        Infra configuration for export wizard nodes, plus a live full-stack slice:
        this tab fetches seeded <code>{{ ordersTable }}</code> rows from the generated
        {{ liveServer }} parity server (<code>{{ apiEndpoint }}</code>).
        Integration keys reflect BYOK status from Settings.
      </p>
      <da-role-gate-panel
        gateLabel="Infrastructure stack"
        [currentRole]="atlas.userRole()"
        [allowedRoles]="['admin']"
        statusText="Admin infrastructure panel"
        hiddenStatusText="Stack configuration is restricted to Admin. Switch role in the header to inspect infra nodes."
      >
        @if (ordersResult(); as result) {
          <p
            class="da-parity-banner"
            [class.da-parity-banner--live]="result.source === 'live'"
            [class.da-parity-banner--offline]="result.source === 'offline'"
            role="status"
          >
            @if (result.source === 'live') {
              Live API — {{ result.rows.length }} seeded row(s) from {{ result.apiUrl }}
            } @else {
              Parity API offline ({{ result.error ?? 'unreachable' }}). {{ setupHint }}
            }
          </p>
        }
        <div class="da-infra-grid">
          <section class="rd-env" data-testid="rd-env">
            <span class="rd-infra__badge">INFRA</span>
            <span class="rd-field__label">Environment config</span>
            <ul class="rd-env__keys">
              @for (entry of keyStatus(); track entry.envKey) {
                <li class="rd-env__key-row">
                  <code>{{ entry.envKey }}</code>
                  <span
                    class="rd-env__key-state"
                    [class.rd-env__key-state--configured]="entry.configured"
                    [class.rd-env__key-state--missing]="!entry.configured"
                  >
                    {{ entry.configured ? 'configured' : 'missing' }}
                  </span>
                </li>
              }
            </ul>
          </section>
          <rd-postgresql
            label="Parity DB (PostgreSQL)"
            envKey="DATABASE_URL"
            [tableOrCollection]="ordersTable"
          />
          <rd-mongodb label="Sessions" envKey="MONGODB_URI" tableOrCollection="sessions" />
          <rd-mysql label="Legacy CRM" envKey="MYSQL_URL" tableOrCollection="contacts" />
          <rd-supabase label="Supabase" envKey="SUPABASE_URL" tableOrCollection="profiles" />
          <rd-server-nest [label]="nestLiveLabel" globalPrefix="api" />
          <rd-server-express label="API (Express)" globalPrefix="api" />
          <rd-server-next label="Web (Next.js)" globalPrefix="" />
          <rd-server-nuxt label="Web (Nuxt)" globalPrefix="" />
        </div>
        <div class="da-parity-live-table">
          <rd-table
            [title]="'Seeded ' + ordersTable + ' (live API)'"
            [rows]="ordersResult()?.rows ?? []"
          />
        </div>
      </da-role-gate-panel>
    </section>
  `,
})
export class StackScreenComponent implements OnInit {
  readonly atlas = inject(AtlasStateService);
  readonly secrets = inject(ConsumerSecretsService);

  readonly ordersTable = PARITY_ORDERS_TABLE;
  readonly liveServer = parityServerLabel('angular');
  readonly apiEndpoint = parityOrdersEndpoint('angular');
  readonly setupHint = parityStackSetupHint();
  readonly nestLiveLabel = `API (${parityServerLabel('angular')}) — live`;

  readonly keyStatus = computed(() => this.secrets.stackKeyStatus(STACK_ENV_KEYS));
  readonly ordersResult = signal<ParityOrdersResult | null>(null);

  ngOnInit(): void {
    void fetchParityOrders('angular').then((result) => this.ordersResult.set(result));
  }
}
