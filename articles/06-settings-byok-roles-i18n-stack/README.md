# Settings including BYOK, Roles, i18n, Stack, and Details

Articles 4 and 5 were the explorer: cities, maps, a globe, watch
versus extract. This piece is organization. Who can open a screen.
Which language the app speaks. Where keys live. What stack was
chosen.

Settings is the name of the tab and the name of this article. Plan
and Stack sit next to it. This article uses the Svelte proof:

```bash
npm run proof:svelte
```

Open <http://localhost:4314>.

## Settings — locale, keys, details

The Settings tab is the session desk. Role, app locale, default map
provider, selected city. Theme if you want it dark. A feedback box
that admits it is a demo. Two ideas matter on this screen.

**App locale.** `domain.i18n.app-language-select` sets a BCP-47 base
(`en`, `es`, `fr`, `de`, `ja` in this proof) and emits
`locale-change`. You wire that to your own i18n — svelte-i18n,
vue-i18n, react-intl, ngx-translate, whatever you already use. Destination labels
can follow. RosettaDash chrome stays English. The **app** can be
multilingual. A news-API language filter, if you ever add one, is a
different component.

**Keys stay in the browser.** Two Admin collapsibles: **Integration
keys (BYOK)** and **AI providers (BYOK)**. Maps want Google or
MapTiler. There is a news key in the same vault. AI is OpenAI,
Anthropic, Gemini, Azure, Ollama — all on the same Settings page.
The vault is encrypted in this browser. Nothing goes to a RosettaDash
server. Map reads a stored key when one exists; otherwise it falls
back to what the proof ships in env. Viewer and Editor can see that
the vault exists. Only Admin can write it.

Same BYOK idea as the builder’s optional AI drawer, aimed at the
consumer app.

![Settings — locale and the Admin BYOK collapsibles on one page.](graphics/01-settings.png)

## Plan — roles

Plan is why Authoring was gated in the last article. Viewer, Editor,
Admin. The header (and Settings) let you switch so you can feel the
gates. The proof keeps roles simple.

Editor and Admin get the trip editor: invite a person, assign a
role, name the trip, pick a city, set dates, duration, travelers,
notes. A timer ticks in the corner because itineraries go stale.
Viewer sees the gate’s hidden status — “requires Editor or Admin.”
That is the component: `domain.role-gate`, plus `person-invite` and
`role-assign`. Keep it on this screen.

![Plan — trip editor for Editor and Admin; the gate’s hidden status for Viewer.](graphics/02-plan.png)

## Stack — invisible infrastructure

Stack is Admin only. A read-only grid of the infra nodes from the
builder article: env keys, Postgres, Mongo, MySQL, Supabase, Nest,
Express, Next, Nuxt. These nodes skip dashboard chrome. They show
what an export would emit.

`EnvConfig` reflects the vault. A map key you saved in Settings
shows as configured here. Missing stays missing.

Choosing a server or a database in the factory generates stubs and
`.env` templates. Connection strings stay in env vars. The zip is
still yours.

![Stack — Admin-only grid of invisible infra. Env row reflects the vault.](graphics/03-stack.png)

![Optional detail — a key marked configured after save, or a Viewer staring at a locked vault.](graphics/04-detail.png)

## Next

Access, keys, locale, and stack now have one home. The last article
is the punchline: one canvas, five runtimes, and the places you mix
them on purpose.
