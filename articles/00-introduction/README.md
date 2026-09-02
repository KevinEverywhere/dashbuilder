# RosettaDash: Why I Built a Dashboard Factory in the Cursor Era

*How I used Cursor and several AI models to build cross-framework
dashboard components — React, Vue, Angular, Svelte, or custom
elements — without rewriting the same screen five times.*

## The problem I kept hitting

Over the past decade, I have written components over and over again in multiple frameworks. React one day. Angular the next. Svelte because a team member insists. AI autocomplete has made development easier; one stack at a time. It does not, however, give you the front-end equivalent to **Haxe**, the high-level
language that compiles to Java, C#, Python, or even JavaScript. There
is still no “write once, run in any framework” library.

Copy-pasting a key performance indicator (KPI) card from one codebase
to another is not the same as **components that travel**. Storybook for
a React repo does not support your Vue component. Custom elements cannot use your angular or react components.

I wanted one place to compose dashboard pieces — tables, charts, maps,
roles, API keys — and **export real source** for the stack that a project
uses.

## How I work: Cursor, the builder, and models

**Cursor** is my editor: chat, agents, repo-wide refactors, article
drafts like this one. **RosettaDash** runs on the same machine. From
the repo root:

```bash
npm install
npm start
```

That starts a local Angular app on port 4200 and a NestJS API on
3000. After you select your stack, the screen will bring you to the builder, where the action takes place.

My workflow looks like this:

1. **Compose** in the builder — palette, canvas, inspector, preview.
2. **Export or extend** in Cursor — wiring, proof apps, docs, tests.
3. **Verify** in Storybook or a proof app like **Destination Atlas** so you that you confirm the component works as expected.

The builder also has an **AI assist** drawer on the toolbar. That path is separate: local **Ollama**, or cloud providers with **bring-your-own-key (BYOK)** credentials stored in the browser — not on a RosettaDash server. You can review suggestions, then **Apply to canvas** or reject them. Same trust model as editing the inspector by hand.

BYOK is intentionally exposed to developers here as the cost of AI is something that easily impacts all of us. We use BYOK without thinking of it every time we go from one device or another. It is having access to your Netflix key, for instance, that enables your phone or your television to give you access to their content. If you are developing an app for someone that has an AI component in it, the idea of BYOK is very apparent. RosettaDash is a **starter kit**, and security and privacy should not be taken for granted or inferred.

I do not treat any model as authoritative. Last month Claude confidently
added a **Vue** import path to a screen I was exporting as **React**.
The diff looked plausible until the proof app failed to compile. I caught
it in `proof-react`, not in chat. That is normal. AI speeds up typing;
it does not remove the need to run the thing.

When you use RosettaDash, probably in an IDE, like VSCode or Cursor, you will have assistance available to you through AI, which as a developer, you will be able to do much more than what you have here to begin with. My workflow now is, if I build something new and it seems useful, see if there is a place for it in the library.

## What RosettaDash is

RosettaDash is a **component factory**, not a hosted dashboard SaaS.
You drag components onto a canvas, bind them (date range to table to
chart, and so on), preview with mock or actual data, and export.

The default download is **standalone source**: either an npm install or a zip file, that you configure with environment variables, and run. You do not
have to install `@rosettadash/*` to ship what you export. You can either ship only what you export, or ship components including the npm packages — `@rosettadash/core` plus `@rosettadash/react`, `@rosettadash/angular`, `@rosettadash/vue`, `@rosettadash/svelte`, or `@rosettadash/web-components`; depending on your project needs.

In the builder, you begin by picking a UI target: **React**, **Angular**, **Vue**, **Svelte**, or **W3C custom elements**. You can then add optional server and database partners (Next, Nuxt, Nest, Express; Mongo, Postgres, Supabase, MySQL) generate stubs and `.env` templates; connection strings stay in env vars, not hard-coded in the zip.

**Destination Atlas** is the proof that the components work together coherently as a group. It is a travel-explorer app — thirty cities, maps, a globe, YouTube media, browser-side video extract with **ffmpeg.wasm**, roles, locale, and API keys. Five **proof apps** run the same screens in five runtimes. Article 7 explains how that parity works — including the one proof that deliberately embeds other frameworks on some tabs (Svelte), and the other four that stay native end to end (React, Angular, Vue, and Web Components).

RosettaDash is aimed at teams that ship production software: full-stack
developers, frontend specialists who need exports that match repo
conventions, and agencies juggling more than one client stack.

## The Proof of Concept

RosettaDash is a proof of concept more than a replacemnt for how you currently work. It provides a higher view of component development that reveals the commonality across framework libraries. Ultimately, each framework is doing roughly the same as the next. Although I have found Vue and Svelte to generally be faster, the components generated with RosettaDash are quite fast-performing in all of the frameworks tested.

To begin and try it yourself:

```bash
git clone https://github.com/KevinEverywhere/rosettadash.git
cd rosettadash
npm install
npm start
```

Open <http://localhost:4200>, pick a framework, compose something small,
export it, and open the zip in Cursor. Or run a proof app:

```bash
npm run proof:react
```

Or, view the components in Storybook:

```bash
npm run storybook:angular
```

Or, merely view a demo:

```bash
npm run demo:weather
```

There is a lot to chew on here, and I hope that a small piece here and there may be helpful to a fellow developer or two.

## Next

The articles are short and focused on different pieces:

| # | Article | One line |
| --- | --------- | ---------- |
| 01 | [Components that Travel](../01-components-that-travel/) | What “travel” means — export to React, Vue, Angular, Svelte, or custom elements; four ways into the project |
| 02 | [The Builder](../02-the-builder/) | Palette, canvas, inspector, preview, and export — where you compose |
| 03 | [Storybook](../03-storybook/) | One component at a time; five catalogs on ports 6006–6010 |
| 04 | [Destination Atlas](../04-destination-atlas/) | The demo as a product — workbench, About, Overview, Destinations, thirty-city library |
| 05 | [Maps, Globes, Media, and WASM](../05-maps-globes-media-wasm/) | 2D map providers, the globe, YouTube watch vs upload-and-extract, ffmpeg.wasm in the browser |
| 06 | [Settings, BYOK, Roles, i18n, Stack](../06-settings-byok-roles-i18n-stack/) | API keys in the browser, app locale, role gates, Plan, and invisible infra |
| 07 | [One Canvas, Five Runtimes](../07-one-canvas-five-runtimes/) | Five proof apps, one shared library; where export lands and where Svelte mixes on purpose |

If you want the product thesis first,
[article 01](../01-components-that-travel/) is the next step. If you want hands on the canvas immediately after this page, start with
[article 02](../02-the-builder/).
