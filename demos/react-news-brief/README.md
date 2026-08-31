# React news brief

[DAS-169](https://planetkevin.atlassian.net/browse/DAS-169) composite demo. A page-embed React widget assembled from existing `@rosettadash/react` atoms. Headlines come from the public Hacker News Algolia API (no key).

## Run

```bash
npm run demo:news
```

Opens [http://localhost:4321](http://localhost:4321).

The widget paints its full rectangle immediately. Pass `width` and `height` so a host can reserve the slot:

```tsx
<NewsBrief width="34rem" height="36rem" />
```

