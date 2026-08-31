# Builder config

Preview content lives in:

`packages/ui-primitives/preview-content.json`

Edit that file to change design-time and preview content. The document
has two top-level sections:

- **`sources`** — maps each dataset to a PostgreSQL table (or derived
  chart/metric) and the env key for the connection (`DATABASE_URL`).
- **`datasets`** — the rows, chart points, KPI values, and filter
  options shown in Design and Preview until a table is wired live.

Refresh the builder after saving. The file is served at
`/preview-content.json` and reloaded by the Nest preview API on each
request.
