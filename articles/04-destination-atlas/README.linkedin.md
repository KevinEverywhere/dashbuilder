Destination Atlas: Components Working Together

Destination Atlas provides information about thirty cities, five per inhabited continent, using every component in RosettaDash at least once. You browse places, look at trends, open a map, watch a video, and more. The app is a functional demo built around component workflows.

[Insert image: Destination Atlas intro]

Five proof apps share one Destination Atlas library and the same screen names. This article uses the Angular proof:

npm run proof:angular — open localhost:4312

The other runtimes follow the same screens on ports 4310–4314.

THE WORKBENCH

Every tab except About is a two-pane workbench. On the left is the Atlas preview. On the right is Component source — the template and class for that screen: imports, props, and nesting. On a narrow viewport, you toggle the panes rather than viewing them side by side.

About is the only page-level scroller. The shell locks the body. The other tabs are meant to fit the viewport.

[Insert image: workbench — preview left, component source right]

ABOUT, OVERVIEW, AND DESTINATIONS

About — why the demo exists, and a matrix of the five runtimes: package, proof command, and Storybook port. The current row is marked “You are here.”

[Insert image: About runtime matrix]

Overview — KPIs, a line chart, a bar chart, chips, badges, and a grid. The dashboard shape most teams recognize.

[Insert image: Overview — KPIs, line, bar]

Destinations — search, region filter, a date range, time presets, a table, and a detail panel. Filter to table to detail is the composite from the builder article, now backed by a thirty-city library. Selecting a row gives the rest of the app a selected place.

[Insert image: Destinations — filter to table to detail]

Those three screens are the focus of this article, on one runtime.

THE REMAINING TABS

The other tabs are named here and covered in later articles. These merely demonstrate functionality. You can use the code freely in your own projects and take over the look and feel.

Maps — 2D providers and a 3D globe, data-bound to the current destination
Media — a simple YouTube player for the current destination
Authoring — select 360 media and create a video from a rectangular portion of it
Plan (Admin) — plan a trip, team members, assign roles
Stack (Admin) — export-wizard infra nodes; on React and Angular proofs with Docker, live seeded orders from a generated API (article 6)
Settings — roles, BYOK, providers, header states
News — destination-scoped travel headlines from Google News RSS via the builder API (~24h cache)

[Insert image: News tab with a destination selected]

Next: maps, globes, media, and extracting media with JavaScript.
