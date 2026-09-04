import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MongodbInfra } from '@rosettadash/angular/infra/mongodb';
import { MysqlInfra } from '@rosettadash/angular/infra/mysql';
import { PostgresqlInfra } from '@rosettadash/angular/infra/postgresql';
import { SupabaseInfra } from '@rosettadash/angular/infra/supabase';
import { ExpressServerInfra } from '@rosettadash/angular/infra/server/express';
import { NestServerInfra } from '@rosettadash/angular/infra/server/nest';
import { NextServerInfra } from '@rosettadash/angular/infra/server/next';
import { NuxtServerInfra } from '@rosettadash/angular/infra/server/nuxt';
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
    RoleGatePanelComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="da-panel">
      <h2>Stack</h2>
      <p>
        Read-only infra configuration demo for export wizard nodes. Integration keys reflect BYOK status
        from Settings.
      </p>
      <da-role-gate-panel
        gateLabel="Infrastructure stack"
        [currentRole]="atlas.userRole()"
        [allowedRoles]="['admin']"
        statusText="Admin infrastructure panel"
        hiddenStatusText="Stack configuration is restricted to Admin. Switch role in the header to inspect infra nodes."
      >
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
          <rd-postgresql label="Analytics DB" envKey="DATABASE_URL" tableOrCollection="destinations" />
          <rd-mongodb label="Sessions" envKey="MONGODB_URI" tableOrCollection="sessions" />
          <rd-mysql label="Legacy CRM" envKey="MYSQL_URL" tableOrCollection="contacts" />
          <rd-supabase label="Supabase" envKey="SUPABASE_URL" tableOrCollection="profiles" />
          <rd-server-nest label="API (Nest)" globalPrefix="api" />
          <rd-server-express label="API (Express)" globalPrefix="api" />
          <rd-server-next label="Web (Next.js)" globalPrefix="" />
          <rd-server-nuxt label="Web (Nuxt)" globalPrefix="" />
        </div>
      </da-role-gate-panel>
    </section>
  `,
})
export class StackScreenComponent {
  readonly atlas = inject(AtlasStateService);
  readonly secrets = inject(ConsumerSecretsService);

  readonly keyStatus = computed(() => this.secrets.stackKeyStatus(STACK_ENV_KEYS));
}
