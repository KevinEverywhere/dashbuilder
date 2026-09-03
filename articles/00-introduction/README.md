# RosettaDash: Why I Built a Dashboard Factory in the Agentic Era

*How I used Cursor and several AI models to build cross-framework
dashboard components — React, Vue, Angular, Svelte, or custom
elements — without rewriting the same screen five times.*

## The problem I kept hitting

Over the past decade, I have written components over and over again in multiple frameworks. React one day. Angular the next. Svelte because a team member insists. AI autocomplete has made development easier; one stack at a time. It does not, however, give you the front-end equivalent to **Haxe**, the high-level
language that compiles to Java, C#, Python, or even JavaScript. There
is still no “write once, run in any framework” library.

Copying and pasting a key performance indicator (KPI) card from one codebase
to another is not trivial, nor the same as **components that travel**. Storybook for
a React repo will not support your Vue component. Custom elements cannot on their own use angular or react components.

## What RosettaDash is

RosettaDash is a **component factory**, not a hosted dashboard SaaS. You drag components onto a canvas, bind them (date range to table to chart, and so on), preview with mock or actual data, and export. In addition to standard dashboard components, I included **bring-your-own-key (BYOK)**; **ffmpeg** running in **WASM**; video editing using JavaScript, **three.js**, **CanvasRenderingContext2D**; and many other easter eggs. More than a kitchen sink, Destination Atlas, built with RosettaDash, is a functioning app with some eccentric elements.

BYOK is intentionally exposed to developers here as the cost of AI is something that easily impacts all of us. We use BYOK without thinking of it when we switch devices. Through your Netflix or Amazon key access, your phone or your television can view the same content. The use case for BYOK is obvious if you are developing an app that has an AI component in it.

## Destination Atlas: Built from RosettaDash

**Destination Atlas** is the proof that the components work together coherently as a group. It is a travel-explorer app — thirty cities, maps, a globe, YouTube media, browser-side video extract with **ffmpeg.wasm**, roles, locale, and API keys. Five **proof apps** run the same screens in five runtimes. Article 7 explains how that parity works — including the one proof that deliberately embeds other frameworks on some tabs (Svelte), and the other four that stay native end to end (React, Angular, Vue, and Web Components).

RosettaDash, itself, is a proof of concept more than a replacemnt for how you currently work. It provides a higher view of component development that reveals the commonality across framework libraries. Ultimately, each framework is doing roughly the same as the next. The components generated with RosettaDash are quite fast-performing in all of the frameworks tested.

To begin and try it yourself:

```bash
git clone https://github.com/KevinEverywhere/rosettadash.git
cd rosettadash
npm install
npm start
```

Open <http://localhost:4200>, pick a framework, compose something small,
export it, and open the zip in Cursor.

Or run a proof app, Destination Atlas in one of the frameworks:

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
| 07 | [One Canvas, Five Runtimes](../07-one-canvas-five-runtimes/) | Five proof apps, native and mixed |
