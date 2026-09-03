# Web component 360 tour player

[DAS-169](https://planetkevin.atlassian.net/browse/DAS-169)
composite demo. A page-embed vanilla widget assembled from
existing `rd-*` atoms plus the **same Three.js interior sphere** as
Destination Atlas Authoring (`rd-equirect-sphere-viewport`).

Uses the **360° destination** pulldown — all thirty cities, labels
like `Tokyo · 360°`. Twenty-six destinations play the local Authoring
library clips (`/authoring-360/{id}.mp4`, padded 2:1 equirect from
Commons stills). Barcelona, Nairobi, Rio, and Melbourne show an upload
hint.

**Requires local clips** (same as proof apps):

```bash
npm run authoring:fetch-360
npm run demo:tour
```

Opens [http://localhost:4330](http://localhost:4330).

Drag inside the square viewport to look around; scroll or pinch to
adjust field of view.
