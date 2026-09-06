# Export Pipeline

The export pipeline transforms a validated composite graph into a downloadable project fragment: source files, styles, configuration templates, and documentation.

## Pipeline stages

```
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│  Load    │──►│ Validate │──►│ Build IR │──►│ Generate │──►│ Package  │
│  Graph   │   │  Graph   │   │          │   │          │   │          │
└──────────┘   └──────────┘   └──────────┘   └──────────┘   └──────────┘
```

### 1. Load graph

Fetch composite from NestJS persistence layer including nodes, bindings, export target config, and domain context.

### 2. Validate graph

| Check | Failure action |
|-------|----------------|
| Schema validation on all node properties | Block with inspector-style errors |
| Required ports bound | Block |
| No illegal data cycles | Block |
| Infra nodes have env var mappings | Block |
| Hard-coded secrets in properties | Block |
| Unsupported feature for target framework | Warn or block per policy |

### 3. Build IR (Intermediate Representation)

Framework-agnostic tree derived from graph:

```typescript
interface ExportIR {
  meta: {
    compositeId: string;
    compositeName: string;
    version: number;
    generatedAt: string;
  };
  targets: {
    ui: 'react' | 'angular' | 'vue' | 'svelte';
    server: 'next' | 'nuxt' | 'nest' | 'express';
    database?: 'mongodb' | 'postgresql' | 'supabase' | 'mysql';
  };
  envVars: EnvVarSpec[];
  components: IRComponent[];
  layouts: IRLayout[];
  dataSources: IRDataSource[];
  routes: IRRoute[];
  events: IREventBinding[];
  styles: IRStyleTokens;
}
```

IR is the **only input** to code generators.

### Standalone-first (product DNA)

**Default exports are standalone:** complete source in the zip, no `@rosettadash/*` runtime packages required. See **[Standalone-first export](./32-standalone-first-export.md)**.

| Mode | Behavior | When |
|------|----------|------|
| **Standalone** (default) | Inlines all component source into the export tree | Every developer export |
| **Package** (opt-in) | Imports `@rosettadash/web-components` etc. | Dogfooding / maintainers only; `exportMode: 'package'` |

New component groups must ship standalone generation and tests **before** optional runtime package integration.

### 4. Generate

Parallel invocation of registered exporters:

```
ExportIR
  ├── UIExporter[react|angular|vue|svelte]     → components/, styles/
  ├── ServerExporter[next|nuxt|nest|express] → api/, modules/
  └── DatabaseExporter[...]             → db/, migrations/, env
```

Each exporter implements:

```typescript
interface ExporterPlugin {
  id: string;
  targetKind: 'ui' | 'server' | 'database';
  supportedTargets: string[];
  generate(ir: ExportIR, options: ExportOptions): Promise<GeneratedFile[]>;
}

interface GeneratedFile {
  path: string;           // relative path in output tree
  content: string;
  encoding: 'utf-8';
  description?: string;
}
```

### 5. Package

- Assemble files into directory tree
- Include `README.export.md` with setup steps
- Include `.env.example` from env var specs
- Zip for download (or emit to user-provided path in CLI future)

## Export wizard (UI flow)

1. **Select scope** — single component, selection, or full composite
2. **Select targets** — UI framework, server partner, database
3. **Review env vars** — map to names, mark required, optional default placeholders
4. **Review file list** — tree preview before download
5. **Generate** — progress indicator, download link

## Target matrix (initial)

| UI ↓ / Server → | Next.js | Nuxt | NestJS | Express |
|-----------------|---------|------|--------|---------|
| React | ✓ primary | — | ✓ | ✓ |
| Angular | — | — | ✓ primary | ✓ |
| Vue | — | ✓ primary | ✓ | ✓ |

"Primary" = most idiomatic pairing; all valid combinations should eventually work.

## Database export patterns

| Database | Typical export artifacts |
|----------|-------------------------|
| **MongoDB** | Native driver connection helper (`mongodb`) |
| **PostgreSQL** | `pg` pool module |
| **Supabase** | `@supabase/supabase-js` client + RLS notes |
| **MySQL** | `mysql2` pool module |

Database exporter receives `IRDataSource` entries with:

- Connection env var keys
- Entity/collection names
- Query patterns (list, get-by-id, filter-by-range)
- Parameter bindings from visual components

## Style export

Styles export as:

- **CSS variables** for design tokens (spacing, colors, typography)
- **Framework-native styles** — CSS modules (React), component styles (Angular), scoped CSS (Vue)
- Optional **Tailwind config extension** (future)

Scripting elements (event handlers, data fetch calls, chart initialization) are co-located with components—not separate opaque bundles.

## Environment variables

All sensitive values use indirection:

```bash
# .env.example (generated)
DATABASE_URL=postgresql://user:password@localhost:5432/mydb
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

Generated code reads via typed config:

```typescript
// conceptual
const config = {
  databaseUrl: process.env.DATABASE_URL,
};
```

User fills values via env file or builder input fields during design (stored as env var *names*, not values, in project).

## Output structure example

```
exported-dashboard/
├── README.export.md
├── .env.example
├── src/
│   ├── components/
│   │   ├── SalesTable.tsx
│   │   ├── RevenueChart.tsx
│   │   └── DateRangeFilter.tsx
│   ├── lib/
│   │   └── db.ts
│   └── styles/
│       └── tokens.css
└── app/
    └── api/
        └── sales/route.ts        # Next.js example
```

Exact paths vary by target.

## Idempotency and regeneration

Re-exporting the same composite version with the same targets should produce equivalent output (modulo timestamps). File paths stable for user re-import workflows.

## Extensibility

Built-in exporter metadata lives in `@rosettadash/core` (`packages/core/src/lib/export/exporter-manifest.ts`). See **[Exporter Plugin SDK](./16-exporter-plugin-sdk.md)** for the full contract and step-by-step guide.

Register new plugins in the manifest and wire the generator in `apps/server/src/app/export/export.service.ts`:

```typescript
import { builtInExporterManifest } from '@rosettadash/core';
// each entry: { id, targetKind, packageName, entryExport, ... }
```

## Related documents

- [Architecture](./02-architecture.md)
- [Component Model](./03-component-model.md)
- [Technology Stack](./06-technology-stack.md)
- [Exporter Plugin SDK](./16-exporter-plugin-sdk.md)
