import { useEffect, useState } from 'react';
import {
  fetchParityOrders,
  parityOrdersEndpoint,
  parityServerLabel,
  parityStackSetupHint,
  PARITY_ORDERS_TABLE,
  type ParityOrdersResult,
} from '@destination-atlas';
import { RoleGate } from '@rosettadash/react/domain/role-gate';
import { EnvConfig } from '@rosettadash/react/infra/env';
import { MongodbInfra } from '@rosettadash/react/infra/mongodb';
import { MysqlInfra } from '@rosettadash/react/infra/mysql';
import { PostgresqlInfra } from '@rosettadash/react/infra/postgresql';
import { SupabaseInfra } from '@rosettadash/react/infra/supabase';
import { ExpressServerInfra } from '@rosettadash/react/infra/server/express';
import { NestServerInfra } from '@rosettadash/react/infra/server/nest';
import { NextServerInfra } from '@rosettadash/react/infra/server/next';
import { NuxtServerInfra } from '@rosettadash/react/infra/server/nuxt';
import { DataTable } from '@rosettadash/react/visual/table';
import { useConsumerSecrets } from '../state/consumer-secrets-context';
import type { AtlasUserRole } from '../lib/roles';

const STACK_ENV_KEYS = ['DATABASE_URL', 'GOOGLE_MAPS_KEY', 'FEATURE_FLAGS'];

export const STACK_SOURCE = `<StackScreen userRole={userRole}>
  <RoleGate currentRole={userRole} allowedRoles={['admin']} label="Infrastructure stack">
    <EnvConfig envKeys="DATABASE_URL, GOOGLE_MAPS_KEY" keyStatus={…} />
    …
  </RoleGate>
</StackScreen>`;

type Props = {
  userRole: AtlasUserRole;
};

export function StackScreen({ userRole }: Props) {
  const secrets = useConsumerSecrets();
  const keyStatus = secrets.stackKeyStatus(STACK_ENV_KEYS);
  const [ordersResult, setOrdersResult] = useState<ParityOrdersResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchParityOrders('react').then((result) => {
      if (!cancelled) {
        setOrdersResult(result);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const liveServer = parityServerLabel('react');
  const apiEndpoint = parityOrdersEndpoint('react');

  return (
    <section className="da-panel">
      <h2>Stack</h2>
      <p>
        Infra configuration for export wizard nodes, plus a live full-stack slice:
        this tab fetches seeded <code>{PARITY_ORDERS_TABLE}</code> rows from the
        generated {liveServer} parity server ({apiEndpoint}). Integration keys
        reflect BYOK status from Settings.
      </p>
      <RoleGate
        label="Infrastructure stack"
        currentRole={userRole}
        allowedRoles={['admin']}
        statusText="Admin infrastructure panel"
        hiddenStatusText="Stack configuration is restricted to Admin. Switch role in the header to inspect infra nodes."
      >
        {ordersResult && (
          <p
            className={`da-parity-banner da-parity-banner--${ordersResult.source}`}
            role="status"
          >
            {ordersResult.source === 'live'
              ? `Live API — ${ordersResult.rows.length} seeded row(s) from ${ordersResult.apiUrl}`
              : `Parity API offline (${ordersResult.error ?? 'unreachable'}). ${parityStackSetupHint()}`}
          </p>
        )}
        <div className="da-infra-grid">
          <EnvConfig envKeys={STACK_ENV_KEYS.join(', ')} keyStatus={keyStatus} />
          <PostgresqlInfra
            label="Parity DB (PostgreSQL)"
            envKey="DATABASE_URL"
            tableOrCollection={PARITY_ORDERS_TABLE}
          />
          <MongodbInfra label="Sessions" envKey="MONGODB_URI" tableOrCollection="sessions" />
          <MysqlInfra label="Legacy CRM" envKey="MYSQL_URL" tableOrCollection="contacts" />
          <SupabaseInfra label="Supabase" envKey="SUPABASE_URL" tableOrCollection="profiles" />
          <NestServerInfra label="API (Nest)" globalPrefix="api" />
          <ExpressServerInfra label="API (Express)" globalPrefix="api" />
          <NextServerInfra label={`API (${liveServer}) — live`} globalPrefix="api" />
          <NuxtServerInfra label="Web (Nuxt)" globalPrefix="" />
        </div>
        <div className="da-parity-live-table">
          <DataTable
            title={`Seeded ${PARITY_ORDERS_TABLE} (live API)`}
            rows={ordersResult?.rows ?? []}
          />
        </div>
      </RoleGate>
    </section>
  );
}
