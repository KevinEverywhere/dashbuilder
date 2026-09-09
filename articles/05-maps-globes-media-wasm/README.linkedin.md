Maps, Globes, Media, and WASM

[Insert image: where the magic begins]

Article 4 stayed on familiar ground: About, Overview, Destinations. This article goes deeper into geo and media — where screens come alive. Two parts: maps and globes, then working with media.

This article uses the Vue proof: npm run proof:vue — open localhost:4313

PART A — MAPS AND GLOBES

The Maps tab is one screen with two panels. You stay on the tab to switch from 2D to the globe.

2D — the geo-map component takes a provider: MapLibre, Leaflet, or Google Maps. Same contract otherwise: center, zoom, markers, selected-id, marker-select. Leaflet is a reasonable default — light, raster-first, no key required if you accept OpenStreetMap’s limits. MapLibre wants vector tiles and often a MapTiler (or similar) key. Google is paid after a free tier, strong at geocoding, and comes with branding and terms of service.

When you offer maps to users, costs can add up quickly. Depending on the project, the Leaflet default may be all you need. Article 6 introduces BYOK for maps and AI assistance.

3D — the 3D geo globe is a Three.js host: a texture and a marker rowset. Same thirty-city library. A pin click selects the place on the near side of the sphere. Flip back to 2D and keep the selection.

Choose a different city on the map, globe, destinations, media, or settings — the header updates as the selected destination.

[Insert image: Maps 2D — one provider, markers on the destination list]
[Insert image: Globe — front-facing pin selected]

PART B — MEDIA AND WASM

Media — a simple YouTube video with metadata panel. Changing the destination in the dropdown updates the video and header. A YouTube player for each framework.

Authoring — probably the most exciting component in the group. Select a 360 image or video, run inside a Three.js sphere you can zoom and rotate. Choose a destination from the dropdown, or click the component to pick a file locally. Position the rectangle, stretch it by the corners — the screen on the right shows what the exported video will look like.

You usually reverse the video content, as text appears backwards when you are inside a sphere. Save the exported content as WebM or MP4.

The magic: ffmpeg running in a WebAssembly container, plus client-side JavaScript image editing. Export whatever aspect ratio you choose — by values or by pinch and multi-touch controls.

[Insert image: Media — flat YouTube embed]
[Insert image: Authoring flat — crop rectangle and output mirror]
[Insert image: Authoring 360 — interior sphere]

The 360 tour demo (npm run demo:tour, port 4330) is the watch-side cousin: same library clips on the interior sphere viewport, without the Authoring extract pipeline.

Next: keys, roles, locale, news, and the invisible stack — the pieces teams often overlook.
