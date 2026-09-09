RosettaDash: Why I Built a Dashboard Factory in the Agentic Era

How I used Cursor and several AI models to build cross-framework dashboard components — React, Vue, Angular, Svelte, and custom elements — without rewriting the same screen five times.

[Insert image: intro — cursor and faster code]

THE PROBLEM I KEPT HITTING

Over the past decade, I have written components over and over again in multiple frameworks. React one day. Angular the next. Svelte because a team member insists. AI autocomplete has made development easier — one stack at a time. It does not, however, give you the front-end equivalent to Haxe, the high-level language that compiles to Java, C#, Python, or even JavaScript. There is still no “write once, run in any framework” library.

INTRODUCING ROSETTADASH

RosettaDash is a component factory, not a hosted dashboard SaaS. You drag components onto a canvas, bind them (date range to table to chart, and so on), preview with mock or actual data, and export. In addition to standard dashboard components, new features include bring-your-own-key (BYOK), WASM, video editing using JavaScript, and many other easter eggs.

As the cost of AI impacts all of us, BYOK is an early consideration for developers today. We use BYOK without thinking of it when we switch devices. Through your Netflix or Amazon key access, your phone or your television can view the same content. The use case for BYOK is obvious if you are developing an app that has an AI component in it. Developers should not go broke due to their app's popularity.

DESTINATION ATLAS: BUILT FROM ROSETTADASH

Destination Atlas is the proof that the components work together coherently as a group. It is a travel-explorer app — thirty cities, maps, a globe, YouTube media, roles, API keys, and much more. Five proof apps run the same screens in five runtimes. Among its easter eggs, a video-editing app using ffmpeg running in WASM and a client-side JavaScript editor.

[Insert image: Destination Atlas authoring]

RosettaDash, itself, is a proof of concept more than a replacement for how you currently work. It provides a higher view of component development that reveals the commonality across framework libraries. Ultimately, each framework is doing roughly the same as the next. The components generated with RosettaDash are quite fast-performing in all of the frameworks tested.

TRY IT YOURSELF

Clone the repo from github.com/KevinEverywhere/rosettadash, run npm install, then npm start. Open localhost:4200, pick a framework, compose something small, export it, and open the zip in Cursor.

To run Destination Atlas as a proof app in one framework: npm run proof:react (swap react for angular, vue, svelte, or web-components).

To browse isolated components in Storybook: npm run storybook:angular (ports 6006–6010 depending on runtime).

For a small standalone widget demo: npm run demo:weather

To prove exported server and database code against Docker (Docker must be running): npm run parity:stack:proof:react

WHAT COMES NEXT IN THE SERIES

01 — Components that Travel: export to five runtimes; four ways into the project
02 — The Builder: palette, canvas, inspector, preview, export
03 — Storybook: one component at a time; five catalogs
04 — Destination Atlas: the demo as a product
05 — Maps, Globes, Media, and WASM
06 — Settings, BYOK, Roles, i18n, Stack, News
07 — One Canvas, Five Runtimes
