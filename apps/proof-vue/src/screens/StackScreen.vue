<script lang="ts">
export const STACK_SOURCE = `<StackScreen userRole={userRole}>
  <RoleGate currentRole={userRole} allowedRoles={['admin']} label="Infrastructure stack">
    <EnvConfig envKeys="DATABASE_URL, GOOGLE_MAPS_KEY" keyStatus={…} />
    …
  </RoleGate>
</StackScreen>`;
</script>

<script setup lang="ts">
import { computed } from 'vue';
import { EnvConfig } from '@rosettadash/vue/infra/env';
import { MongodbInfra } from '@rosettadash/vue/infra/mongodb';
import { MysqlInfra } from '@rosettadash/vue/infra/mysql';
import { PostgresqlInfra } from '@rosettadash/vue/infra/postgresql';
import { SupabaseInfra } from '@rosettadash/vue/infra/supabase';
import { ExpressServerInfra } from '@rosettadash/vue/infra/server/express';
import { NestServerInfra } from '@rosettadash/vue/infra/server/nest';
import { NextServerInfra } from '@rosettadash/vue/infra/server/next';
import { NuxtServerInfra } from '@rosettadash/vue/infra/server/nuxt';
import RoleGatePanel from '../components/RoleGatePanel.vue';
import { useConsumerSecrets } from '../composables/use-consumer-secrets';
import type { AtlasUserRole } from '../lib/roles';

const STACK_ENV_KEYS = ['DATABASE_URL', 'GOOGLE_MAPS_KEY', 'FEATURE_FLAGS'];

defineProps<{ userRole: AtlasUserRole }>();

const secrets = useConsumerSecrets();
const keyStatus = computed(() => secrets.stackKeyStatus(STACK_ENV_KEYS));
</script>

<template>
  <section class="da-panel">
    <h2>Stack</h2>
    <p>
      Read-only infra configuration demo for export wizard nodes. Integration keys reflect BYOK status from
      Settings.
    </p>
    <RoleGatePanel
      gate-label="Infrastructure stack"
      :current-role="userRole"
      :allowed-roles="['admin']"
      status-text="Admin infrastructure panel"
      hidden-status-text="Stack configuration is restricted to Admin. Switch role in the header to inspect infra nodes."
    >
      <div class="da-infra-grid">
        <EnvConfig :env-keys="STACK_ENV_KEYS.join(', ')" />
        <p class="da-note">
          Key status:
          <span v-for="entry in keyStatus" :key="entry.envKey">
            {{ entry.envKey }} ({{ entry.configured ? 'configured' : 'not set' }})
          </span>
        </p>
        <PostgresqlInfra label="Analytics DB" env-key="DATABASE_URL" table-or-collection="destinations" />
        <MongodbInfra label="Sessions" env-key="MONGODB_URI" table-or-collection="sessions" />
        <MysqlInfra label="Legacy CRM" env-key="MYSQL_URL" table-or-collection="contacts" />
        <SupabaseInfra label="Supabase" env-key="SUPABASE_URL" table-or-collection="profiles" />
        <NestServerInfra label="API (Nest)" global-prefix="api" />
        <ExpressServerInfra label="API (Express)" global-prefix="api" />
        <NextServerInfra label="Web (Next.js)" global-prefix="" />
        <NuxtServerInfra label="Web (Nuxt)" global-prefix="" />
      </div>
    </RoleGatePanel>
  </section>
</template>
