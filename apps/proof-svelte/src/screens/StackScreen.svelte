<script module lang="ts">
  export const STACK_SOURCE = `<StackScreen userRole={userRole}>
  <RoleGate currentRole={userRole} allowedRoles={['admin']} label="Infrastructure stack">
    <EnvConfig envKeys="DATABASE_URL, GOOGLE_MAPS_KEY" keyStatus={…} />
    …
  </RoleGate>
</StackScreen>`;
</script>

<script lang="ts">
  import EnvConfig from '@rosettadash/svelte/infra/env';
  import MongodbInfra from '@rosettadash/svelte/infra/mongodb';
  import MysqlInfra from '@rosettadash/svelte/infra/mysql';
  import PostgresqlInfra from '@rosettadash/svelte/infra/postgresql';
  import SupabaseInfra from '@rosettadash/svelte/infra/supabase';
  import ExpressServerInfra from '@rosettadash/svelte/infra/server/express';
  import NestServerInfra from '@rosettadash/svelte/infra/server/nest';
  import NextServerInfra from '@rosettadash/svelte/infra/server/next';
  import NuxtServerInfra from '@rosettadash/svelte/infra/server/nuxt';
  import RoleGatePanel from '../components/RoleGatePanel.svelte';
  import { useConsumerSecrets } from '../lib/consumer-secrets.svelte';
  import type { AtlasUserRole } from '../lib/roles';

  const STACK_ENV_KEYS = ['DATABASE_URL', 'GOOGLE_MAPS_KEY', 'FEATURE_FLAGS'];

  let { userRole }: { userRole: AtlasUserRole } = $props();

  const secrets = useConsumerSecrets();
  const keyStatus = $derived(secrets.stackKeyStatus(STACK_ENV_KEYS));
</script>

<section class="da-panel">
  <h2>Stack</h2>
  <p>
    Read-only infra configuration demo for export wizard nodes. Integration keys reflect BYOK status from
    Settings.
  </p>
  <RoleGatePanel
    gateLabel="Infrastructure stack"
    currentRole={userRole}
    allowedRoles={['admin']}
    statusText="Admin infrastructure panel"
    hiddenStatusText="Stack configuration is restricted to Admin. Switch role in the header to inspect infra nodes."
  >
    <div class="da-infra-grid">
      <EnvConfig envKeys={STACK_ENV_KEYS.join(', ')} />
      <p class="da-note">
        Key status:
        {#each keyStatus as entry (entry.envKey)}
          <span>{entry.envKey} ({entry.configured ? 'configured' : 'not set'})</span>
        {/each}
      </p>
      <PostgresqlInfra label="Analytics DB" envKey="DATABASE_URL" tableOrCollection="destinations" />
      <MongodbInfra label="Sessions" envKey="MONGODB_URI" tableOrCollection="sessions" />
      <MysqlInfra label="Legacy CRM" envKey="MYSQL_URL" tableOrCollection="contacts" />
      <SupabaseInfra label="Supabase" envKey="SUPABASE_URL" tableOrCollection="profiles" />
      <NestServerInfra label="API (Nest)" globalPrefix="api" />
      <ExpressServerInfra label="API (Express)" globalPrefix="api" />
      <NextServerInfra label="Web (Next.js)" globalPrefix="" />
      <NuxtServerInfra label="Web (Nuxt)" globalPrefix="" />
    </div>
  </RoleGatePanel>
</section>
