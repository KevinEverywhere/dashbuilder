News and Settings including BYOK, Roles, i18n, Stack, and Details

[Insert image: News for all, even editors]

The ideas for setting up a news feed or choosing which settings matter in your app are obviously your own. Change source and destination on any example and it becomes yours. For Destination Atlas, we wanted headlines relevant to the selected destination, and enough BYOK exposure to inspire how it could apply to your needs.

NEWS

Headlines follow the selected destination from Destinations, Map, Globe, or Media — the same city id as the header.

Viewer sees the results table only. Click a headline to open the publisher article in a new browser tab.

Editor and Admin also get search and region filters, plus an Article detail panel with summary and a Read source link. Admin refreshes the RSS cache under Settings.

Try it locally: npm run proof:react:live (builder API on port 3000, React proof on port 4311 — swap runtime as needed).

Open the News tab. Pick a destination on Destinations or Settings to change the selection. With the builder up you get live RSS; when it is offline the app shows cached travel headlines instead of failing.

[Insert image: Admin view of news]

SETTINGS

As an app developer, we regularly revisit the same behind-the-scenes challenges: connecting keys and authentication, enabling views based on roles, locale for each language target, and other minutiae.

This view uses the Svelte proof: npm run proof:svelte — open localhost:4314

Role — Viewer, Admin, and Editor see different views and access to content.

App locale — the app-language-select component sets a base language using standard locale codes (en, es, fr, de, ja in this proof) and emits locale-change. Wire that to your own i18n: svelte-i18n, vue-i18n, react-intl, ngx-translate, whatever you already use.

Keys stay in the browser. Two Admin collapsibles: Integration keys and AI providers — both bring-your-own-key (BYOK) vaults. Maps can use Google or MapTiler. AI is OpenAI, Anthropic, Gemini, Azure, Ollama — all on the same Settings page. The vault is encrypted in this browser. Nothing goes to a RosettaDash server. Viewer and Editor can see that the vault exists. Only Admin can write it.

News feeds (admin) — a third Admin collapsible. Only Admin can refresh the builder’s Google News RSS cache (~24 hours). Viewer and Editor browse headlines on the News tab without admin tools. The panel shows article count, last fetch time, and configured feed queries.

Try Settings as Admin (add ?role=admin to the URL). Expand News feeds (admin) and refresh. React, Vue, Svelte, and Web Components proofs ship this panel. Angular has the News tab but not the Settings admin block yet.

[Insert image: Settings — locale, BYOK vaults, news-feed refresh panel]

PLAN — ROLES

Only Editor and Admin have access to the Plan tab. Invite a person, assign a role, name the trip, pick a city, set dates, duration, travelers, and notes. Viewers are rerouted to About.

[Insert image: Plan — trip editor for Editor and Admin]

STACK — INVISIBLE INFRASTRUCTURE

Stack is Admin only. A read-only grid of infra nodes from the builder: env keys, Postgres, Mongo, MySQL, Supabase, Nest, Express, Next, Nuxt. Choosing a server or database in the builder generates stubs and env templates. Connection strings stay in env vars, not in exported source.

On React and Angular proofs, the Stack tab loads seeded orders rows from a generated API backed by PostgreSQL in Docker — the same path export gives you (UI to server to database).

Try it locally — one command: npm run parity:stack:proof:react (or parity:stack:proof:angular). Open Stack as Admin. A green banner and a Seeded orders table mean the export is serving rows.

This article uses the Svelte proof for Settings and Plan. Svelte Stack shows the infra grid only — use React or Angular for the live orders demo.

[Insert image: Stack — Admin-only infra grid]
[Insert image: optional — configured key or locked vault for Viewer]

Next: one canvas, five runtimes, and purposeful mixing of frameworks.
