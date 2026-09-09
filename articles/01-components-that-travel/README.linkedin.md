RosettaDash: Components that Travel

RosettaDash is a portmanteau of Rosetta — the Egyptian stone with Demotic, Greek, and hieroglyphic characters that enabled modern translation of extinct languages — and the modern web dashboard. The motivation is to enable component creation that works in whichever framework you choose.

[Insert image: Rosetta stone graphic]

These days, when AI helps us author code, we are still forced to think in the context of one framework at a time. There is no front-end equivalent to Haxe. In that spirit, this project provides developers a single source of truth for cross-framework component requirements.

RosettaDash runs locally as a component factory. You compose on a canvas and export real source files. The default zip is standalone: drop it into a project, set environment variables, and run. More often, you install only the npm modules you need — the full authoring environment with the builder, or a framework-specific library together with the shared cross-framework core.

[Insert image: the builder welcome, or a component exported as a zip]

WHAT “TRAVEL” MEANS

A RosettaDash component can have a type, properties, ports, and events, and it can target whichever framework(s) you need. The same definition can be exported as React, Angular, Vue, Svelte, or a W3C custom element. Server and database partners are available if you need them (Next, Nuxt, Nest, Express; Mongo, Postgres, Supabase, MySQL). You can also export the UI component alone and integrate it with an existing codebase.

All four server frameworks and four databases are not just export targets. Clone the repo and you can prove exports against real engines in Docker. Article 6 walks through the live Stack demo.

[Insert image: one contract, five runtimes — React, Angular, Vue, Svelte, custom element]

FOUR WAYS IN

The builder — the main authoring surface. Run npm start, open localhost:4200, pick a stack, compose, preview, and export. Covered in article 2.

Storybook — one catalog per framework, ports 6006 through 6010. See how a single piece works and how parameters change it. Article 3.

Destination Atlas — one app built to show every component working together. Five proof apps share one dataset. Articles 4 through 6.

npm — install @rosettadash/react, @rosettadash/angular, @rosettadash/vue, @rosettadash/svelte, or @rosettadash/web-components. Import a typed component into an app you already have. Core is pulled in automatically as a dependency.

[Insert image: the four doors — builder, Storybook, Destination Atlas, npm]

Eleven page-embed widget demos ship with the repo — a React weather card, a Vue flight board, an Angular stock ticker, a Svelte transit list, a custom-element 360° tour, and others. They use the same components as the builder, without the Destination Atlas shell. npm run demo:weather on port 4320 is enough to preview one on a host page. See article 7 or package.json for the full set.

[Insert image: one demo widget on a host page]

RosettaDash is aimed at teams that ship production software — full-stack developers, frontend specialists who need exports that match their repo conventions, and agencies working across more than one client stack.

Next: the builder — palette, canvas, inspector, templates, preview, and export.
