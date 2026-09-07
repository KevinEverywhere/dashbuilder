# Articles

<!-- D-AS-188 SUGGESTED: update series metadata when docs pass is merged
**Current ticket:** [DAS-188](https://planetkevin.atlassian.net/browse/DAS-188)
**Branch:** `feature/DAS-188-docs-backend-parity-articles`
-->

RosettaDash article series. Kevin writes the introduction; articles
01–07 are draft-ready in their folders.

**Current ticket:** [DAS-181](https://planetkevin.atlassian.net/browse/DAS-181)  
**Branch:** `feature/DAS-181-write-articles-and-discovery-touchups`

Series planning notes stay in the workspace
[`docs/00-series.md`](../../docs/00-series.md) until Kevin moves
that file.

| Folder | Article |
| -------- | --------- |
| [00-introduction](./00-introduction/) | Kevin writes |
| [01-components-that-travel](./01-components-that-travel/) | Components that Travel |
| [02-the-builder](./02-the-builder/) | The Builder |
| [03-storybook](./03-storybook/) | Storybook |
| [04-destination-atlas](./04-destination-atlas/) | Destination Atlas |
| [05-maps-globes-media-wasm](./05-maps-globes-media-wasm/) | Maps, Globes, Media, and WASM |
| [06-settings-byok-roles-i18n-stack](./06-settings-byok-roles-i18n-stack/) | Settings, BYOK, Roles, i18n, Stack |
| [07-one-canvas-five-runtimes](./07-one-canvas-five-runtimes/) | One Canvas: Five Runtimes |

Each article folder has `README.md` (the draft) and `graphics/` (PNG
stills).

**SEO:** [keyword-clusters.md](./keyword-clusters.md) — primary
search cluster per article.

Re-capture with:

```bash
node scripts/capture-article-graphics.mjs [01–07]
```
