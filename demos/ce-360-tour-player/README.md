# Web component 360 tour player

[DAS-169](https://planetkevin.atlassian.net/browse/DAS-169)
composite demo. A page-embed vanilla widget assembled from
existing `rd-*` atoms plus the **same Three.js interior sphere** as
Destination Atlas Authoring (`rd-equirect-sphere-viewport`).

Uses the **360° destination** pulldown — all thirty cities, labels
like `Tokyo · 360°`. Every destination plays the local Authoring library
clips (`/authoring-360/{id}.mp4`, padded 2:1 equirect from Commons
stills).

**After clone:** `npm install` links the thirty shipped MP4s from
`libs/destination-atlas/media/authoring-360/` (included in the repo).
Then:

```bash
npm run demo:tour
```

Rebuild clips from Commons (optional): `npm run authoring:fetch-360`
(ffmpeg + network).

Opens [http://localhost:4330](http://localhost:4330).

Drag inside the square viewport to look around; scroll or pinch to
adjust field of view.
