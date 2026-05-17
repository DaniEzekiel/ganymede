# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # http://localhost:3000 (Turbopack disabled, plain next dev)
npm run build    # production build — required before `start`
npm run start    # serves on 0.0.0.0:3000 (kiosk-friendly)
npm run lint     # next lint
```

No test runner is configured. Node 20+ is required (Next 15).

Local env is loaded from `.env.local`; copy `.env.example` and fill in `WEATHER_LAT/LON/TZ`, `GOOGLE_CALENDAR_ICS_URL`, and `PHOTOS_DIR`. All are optional at dev time — widgets fall back to a "failed to load" state or mock data.

## Architecture

Single-page dashboard built on Next.js 15 App Router + React 19. The entire UI is one route (`app/page.tsx`), which is a `"use client"` component that mounts ten widgets onto a 24-column CSS grid.

### The three layers

1. **`app/page.tsx`** — the only page. Renders the topstrip and the grid; each widget receives a `className` like `w-clock` / `w-weather` that pins it to a grid area defined in CSS. Widgets are interchangeable — the page does not know what they render.
2. **`app/components/<Widget>.tsx`** — one client component per widget. Each owns its own polling loop (`useEffect` + `setInterval`) and either fetches from a local `/api/<widget>` route or imports static data from `app/lib/mockData.ts`. Components are styled by class names that map to rules in `globals.css`; they do not contain inline layout logic.
3. **`app/api/<widget>/route.ts`** — server routes that proxy/transform external sources (Open-Meteo, Google Calendar ICS, local filesystem) into the JSON shape the matching widget expects. Use `export const revalidate = N` (seconds) for Next's built-in caching; `fetch(..., { next: { revalidate: N } })` for upstream caching.

### Real vs. mock widgets

Three widgets are wired to real sources: **Weather** (Open-Meteo, keyless), **Calendar** (Google Calendar ICS via `ical.js`, expands recurring events within a 14-day horizon, capped at 10), and **Photos** (filesystem under `PHOTOS_DIR`). The other six (News, Tasks, Home, Commute, Stocks, Quote) import from `app/lib/mockData.ts`.

**To replace a mock with a real source:** add `app/api/<widget>/route.ts` returning JSON in the same shape as the corresponding `mockX` export, then in the widget component swap the `mockX` import for `useEffect` → `fetch("/api/<widget>")`. The JSX and styling stay untouched — the data contract is the integration boundary.

### Styling system

All visual design lives in **`app/globals.css`**. The top of the file defines an oklch-based token set (`--bg`, `--ink`, `--accent`, spacing scale `--s-1`…`--s-10`, radius scale, type scale). A dark theme is defined under `[data-theme='dark']`; the theme is set on the `<html>` element in `app/layout.tsx`. Three Google fonts (Fraunces / Inter Tight / JetBrains Mono) are loaded in `layout.tsx` and exposed as CSS variables.

Grid placement for each widget is a rule in `globals.css` keyed on the `w-<widget>` class. Re-arranging the dashboard means editing those rules, not the page.

### Conventions to preserve

- Widgets are self-polling; the page does not orchestrate refreshes. Weather is the one exception — it lifts its data up via `onData` so `Clock` can read `sun.rise/set`.
- API routes return `{ error }` with a non-2xx status on failure; widgets check `res.ok` and render an inline `.error` block rather than throwing.
- The `/api/photos/[name]` route guards against path traversal (rejects `/` and `..` in the decoded name) before streaming — keep that check if you touch it.
- `next.config.ts` sets `images: { unoptimized: true }` because the Pi serves photos directly from disk via the streaming route; do not introduce `next/image` for those.
- `@/*` resolves to the repo root (see `tsconfig.json` paths).

### Deployment context

The production target is a Raspberry Pi running Chromium in kiosk mode against `npm run start`. That's why `start` binds `0.0.0.0` and `body` has `overflow: hidden` — the dashboard is a fixed-viewport surface, not a scrollable page. See `README.md` for the systemd unit and Wayfire/LXDE autostart snippets.
