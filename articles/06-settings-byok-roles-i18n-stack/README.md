# Settings including BYOK, Roles, i18n, Stack, and Details

As an app developer, we regularly revisit the same behind-the-scenes challenges. Things such as connecting keys and authenticatiom, enabling views based on roles, ensuring that each language target gets what they asked for, and other minutia.

For this view, we will use the svelte app.

```bash
npm run proof:svelte
```

Open <http://localhost:4314>.

## Settings — locale, keys, details

**App locale.** `domain.i18n.app-language-select` sets a base app
language using standard locale codes (`en`, `es`, `fr`, `de`, `ja` in
this proof) and emits `locale-change`. You wire that to your own i18n — svelte-i18n,
vue-i18n, react-intl, ngx-translate, whatever you already use.

**Keys stay in the browser.** Two Admin collapsibles: **Integration keys** and **AI providers** — both bring-your-own-key (BYOK) vaults. Maps can use Google or MapTiler. AI is OpenAI, Anthropic, Gemini, Azure, Ollama — all on the same Settings page. The vault is encrypted in this browser. Nothing goes to a RosettaDash server. Map reads a stored key when one exists; otherwise it falls back to what the proof ships in env. Viewer and Editor can see that the vault exists. Only Admin can write it.

![Settings — locale and the Admin BYOK collapsibles on one page.](graphics/01-settings.png)

## Plan — roles

Only Editor and Admin have access to the Plan tab. This is the roles gate in action. Here, if you have permissions, you can invite a person, assign a role, name the trip, pick a city, set dates, duration, travelers, and keep notes.  Users without permissions (i.e., viewers) are rerouted to the About landing page.

![Plan — trip editor for Editor and Admin; the gate’s hidden status for Viewer.](graphics/02-plan.png)

## Stack — invisible infrastructure

Stack is Admin only. A read-only grid of the infra nodes from the builder article: env keys, Postgres, Mongo, MySQL, Supabase, Nest, Express, Next, Nuxt. Choosing a server or a database in the builder generates stubs and `.env` templates. Connection strings stay in env vars, not in the exported source.

On the **React** and **Angular** proofs, the Stack tab can go one step
further: it loads seeded `orders` rows from a generated API backed by
PostgreSQL in Docker — the same path export gives you (UI → server →
database). The infra grid above still applies; the live table shows that
path working, not just the export-wizard labels.

**Try it locally** — two terminals. The builder API blocks its shell:

```bash
npm run parity:db:up
npm run start:server          # terminal A — leave running
npm run parity:generate       # terminal B
npm run parity:servers:up
```

Open Stack as **Admin** on the proof that matches your server choice:

```bash
npm run proof:react           # talks to Next.js on :53103
# or: nx serve proof-angular  # talks to NestJS on :53101
```

A green banner and a **Seeded orders** table mean the export is serving
rows. If Docker is not up, the tab explains what to run instead of
erroring out.

This article uses the **Svelte** proof (`npm run proof:svelte`, port 4314)
for Settings and Plan. Svelte Stack shows the infra grid only — use React
or Angular when you want the live orders demo. From the cloned repo root,
`parity:db:up` seeds four databases in Docker; `parity:generate` and
`parity:servers:up` boot generated Nest, Express, Next, and Nuxt apps that
serve the same `orders` rows the builder previews (ports 53101–53104).

<!-- DAS- 188 SUGGESTED: Stack live API (promote when ready)
On the **React** and **Angular** proofs, the Stack tab can go one step
further: it loads seeded `orders` rows from a generated API backed by
PostgreSQL in Docker — the same path export gives you (UI → server →
database). The infra grid above still applies; the live table shows that
path working, not just the export-wizard labels.

**Try it locally** — two terminals. The builder API blocks its shell:

```bash
npm run parity:db:up
npm run start:server          # terminal A — leave running
npm run parity:generate       # terminal B
npm run parity:servers:up
```

Open Stack as **Admin** on the proof that matches your server choice:

```bash
npm run proof:react           # talks to Next.js on :53103
# or: nx serve proof-angular  # talks to NestJS on :53101
```

A green banner and a **Seeded orders** table mean the export is serving
rows. If Docker is not up, the tab explains what to run instead of
erroring out.

This article uses the **Svelte** proof (`npm run proof:svelte`, port 4314)
for Settings and Plan. Svelte Stack shows the infra grid only — use React
or Angular when you want the live orders demo. From the cloned repo root,
`parity:db:up` seeds four databases in Docker; `parity:generate` and
`parity:servers:up` boot generated Nest, Express, Next, and Nuxt apps that
serve the same `orders` rows the builder previews (ports 53101–53104).
-->

![Stack — Admin-only grid of invisible infra. Env row reflects the vault.](graphics/03-stack.png)

![Optional detail — a key marked configured after save, or a Viewer staring at a locked vault.](graphics/04-detail.png)

## Next

The final article ties it all together and digs into how one canvas was used to generate five runtimes, with one of them
mixing frameworks on purpose.
