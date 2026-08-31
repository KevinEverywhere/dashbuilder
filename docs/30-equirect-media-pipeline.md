# Equirectangular media pipeline (DAS-82)

Export a **subsection** from a 2:1 equirectangular video using composed RosettaDash components and ffmpeg.wasm (React export, Phase 1).

## Example target

| Stage | Dimensions |
|-------|------------|
| Source | 4096×2048 equirect MP4 |
| Crop region | 1080×720 (centered by default: x=1508, y=664) |
| Output | 720×480 MP4 |

## Component composite

```
Live Capture (optional, authoring)
    └─► Video Source
            └─► Equirect Viewport (crop region)
                    └─► WASM Media (equirect-extract)
                            └─► Table / download
```

Bind:

- `video-source.videoFile` → `wasm.media.inputFile`
- `equirect-viewport.cropRegion` → `wasm.media.cropRegion`
- `infra.wasm.asset` → worker host (when using custom asset paths)

## ffmpeg filter (flat crop)

```
crop=1080:720:1508:664,scale=720:480
```

Built by `buildEquirectFlatCropFilter()` in `@rosettadash/core` and emitted as `src/media/equirect-filter.ts` in React exports.

## React export setup

```bash
npm install @ffmpeg/ffmpeg @ffmpeg/util
```

Set WASM Media operation to **Equirect extract** and extraction mode to **Flat crop on 2:1 frame**.

## Rectilinear mode

For yaw/pitch/FOV-based views instead of flat crop, set extraction mode to **Rectilinear reprojection** on WASM Media.

Yaw wrap uses `wrapSignedDegrees` / `wrapPeriod` in `@rosettadash/core` so orbit and sliders cross 0° / ±180° without a viewport-sized jump. Do not pan 360 stills with CSS `background-position: N%` (0% and 100% are the same alignment).
