import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mergeConfig, type AliasOptions, type UserConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { ffmpegCoreVitePlugin, wasmIsolationHeaders } from '../vite/ffmpeg-core-vite-plugin.mjs';
import { parityApiProxy } from '../vite/parity-api-proxy.ts';
import { builderApiProxy } from '../vite/builder-api-proxy.ts';

const workspaceRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..',
);

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Vite alias list — longest subpaths first; package roots use exact `$` match when they have children. */
export function rosettadashAliasEntries(): AliasOptions {
  const base = JSON.parse(
    fs.readFileSync(path.join(workspaceRoot, 'tsconfig.base.json'), 'utf8'),
  ) as {
    compilerOptions?: { paths?: Record<string, string[]> };
  };
  const paths = base.compilerOptions?.paths ?? {};

  const rosettaKeys = Object.keys(paths).filter((key) => key.startsWith('@rosettadash/'));
  const rootsWithSubpaths = new Set<string>();
  for (const key of rosettaKeys) {
    for (const other of rosettaKeys) {
      if (other !== key && other.startsWith(`${key}/`)) {
        rootsWithSubpaths.add(key);
      }
    }
  }

  const entries: Array<{ find: string | RegExp; replacement: string }> = [
    {
      find: '@rosettadash/web-components/tokens.css',
      replacement: path.join(workspaceRoot, 'packages/web-components/src/styles/tokens.css'),
    },
    {
      find: '@rosettadash/web-components/styles.css',
      replacement: path.join(workspaceRoot, 'packages/web-components/src/styles/styles.css'),
    },
  ];

  for (const [key, targets] of Object.entries(paths)) {
    if (!key.startsWith('@rosettadash/') || !targets?.[0]) {
      continue;
    }
    const find = rootsWithSubpaths.has(key)
      ? new RegExp(`^${escapeRegExp(key)}$`)
      : key;
    entries.push({
      find,
      replacement: path.join(workspaceRoot, targets[0]),
    });
  }

  entries.sort((a, b) => String(b.find).length - String(a.find).length);
  return entries;
}

export interface RosettadashViteFinalOptions {
  /** Host port for the idiomatic parity server — enables `/parity-api` dev proxy. */
  parityServerPort?: number;
}

/** Resolve @rosettadash CSS subpaths and workspace packages for Storybook Vite. */
export async function rosettadashViteFinal(
  config: UserConfig,
  options: RosettadashViteFinalOptions = {},
): Promise<UserConfig> {
  return mergeConfig(config, {
    plugins: [
      ffmpegCoreVitePlugin(),
      tsconfigPaths({
        root: workspaceRoot,
        projects: [path.join(workspaceRoot, 'tsconfig.base.json')],
      }),
    ],
    server: {
      headers: wasmIsolationHeaders(),
      proxy: {
        ...(options.parityServerPort ? parityApiProxy(options.parityServerPort) : {}),
        ...builderApiProxy(),
      },
    },
    preview: {
      headers: wasmIsolationHeaders(),
    },
    resolve: {
      alias: rosettadashAliasEntries(),
    },
  });
}
