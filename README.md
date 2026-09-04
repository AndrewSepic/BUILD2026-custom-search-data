# Integrating Mapbox Search with Custom Data

Source code for the **BUILD with Mapbox 2026** talk, *"Integrating Mapbox Search with Custom Data."*

This repo starts from the [custom-data-with-search-js tutorial](https://docs.mapbox.com/help/tutorials/custom-data-with-search-js/) and extends it into three patterns for merging your own data into a Mapbox Search JS experience, organized around **where the data lives**:

| Pattern | Where the data lives | In this repo |
|---|---|---|
| **Local** | In your app, as a file you own and ship | US airports GeoJSON, indexed by IATA code |
| **Tileset** | On the map, not in your app — you only ever hold what's currently rendered | Aviation waypoints, queried from the map's own source via `querySourceFeatures` |
| **API** | Nowhere until you ask — every search is a live network call | Live aircraft via [adsb.lol](https://api.adsb.lol/docs), rendered as a 3D model with its recent flight path |

Each pattern plugs into the same `suggest()` → `retrieve()` lifecycle, using [Search JS Core](https://docs.mapbox.com/mapbox-search-js/api/core/) classes directly (`SearchBoxCore`/`SearchSession`) with a custom UI, rather than the prebuilt `<SearchBox />` React component — see `SearchBoxContainer.tsx`.

## Where to look

- `src/utils/search.ts` — data fetching, indexing, and suggestion formatting for all three patterns
- `src/utils/mapLayers.ts` — 3D model + flight-path rendering for the API pattern
- `src/SearchBoxContainer.tsx` — the merge/suggest/retrieve lifecycle tying all three sources together
- `src/App.tsx` — map setup, the local airport index build, and the tileset `moveend` listener

## Prerequisites

- Node v20.19.3 or higher
- npm
- A Mapbox access token ([get one here](https://account.mapbox.com/access-tokens/)) — copy `.env.example` to `.env` and fill it in

## How to run

```
npm install
npm run dev
```

The API pattern (live aircraft data) requires the Vite dev server's proxy config in `vite.config.ts` — adsb.lol doesn't send CORS headers, so requests are proxied server-side in dev. This only works under `npm run dev`; a production deploy would need an equivalent proxy (a serverless function, or host-level rewrite rules).

## Further reading

- [Add SearchBox to your React App](https://docs.mapbox.com/mapbox-search-js/api/react/search/)
- [Add custom search data to Search Bo (React)](https://docs.mapbox.com/mapbox-search-js/example/custom-search-react/)
