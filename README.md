# Ganymede — Raspberry Pi Dashboard

A home dashboard built with Next.js 15 (App Router) and React 19. Designed to run fullscreen on a Raspberry Pi wired to a TV or monitor.

**10 widgets** on a 24-column grid: clock with sunrise/sunset, weather (current + 6-hour + 5-day), calendar (mini month + agenda), photo slideshow, news briefing, tasks, smart home tiles, commute times, markets, and a daily quote. Warm paper aesthetic built on oklch color space with Fraunces + Inter Tight + JetBrains Mono.

## What's in the box

```
ganymede/
├── app/
│   ├── layout.tsx              # Root shell, loads Google fonts as CSS vars
│   ├── page.tsx                # Dashboard — canvas + topstrip + 24-col grid
│   ├── globals.css             # Full design system: tokens, cards, widgets
│   ├── components/
│   │   ├── Icon.tsx            # Inline SVG icon set
│   │   ├── Settings.tsx        # Gear-icon modal in the topstrip
│   │   ├── Clock.tsx           # Time + long date + sunrise/sunset
│   │   ├── Weather.tsx         # Current + 6 hourly + 5-day bar forecast
│   │   ├── Calendar.tsx        # Mini month grid + 4-day agenda
│   │   ├── Photos.tsx          # Cross-fade slideshow, tap to advance
│   │   ├── News.tsx            # Lede + headlines (mock)
│   │   ├── Tasks.tsx           # Checklist with progress (mock, interactive)
│   │   ├── Home.tsx            # Smart home tiles (mock, interactive)
│   │   ├── Commute.tsx         # Traffic routes (mock)
│   │   ├── Stocks.tsx          # Tickers + sparklines (mock)
│   │   └── Quote.tsx           # Daily quote (mock)
│   ├── lib/
│   │   ├── mockData.ts         # Seed data for widgets without a real API yet
│   │   ├── config.ts           # Reads/writes data/config.json + validators
│   │   └── icloudShared.ts     # Apple Photos shared-album client
│   └── api/
│       ├── weather/route.ts    # Open-Meteo proxy (no key)
│       ├── calendar/route.ts   # Google Calendar ICS feed
│       ├── photos/
│       │   ├── route.ts        # PHOTOS_DIR if set, else iCloud shared album
│       │   └── [name]/route.ts # Streams one local image (PHOTOS_DIR mode only)
│       └── config/
│           ├── route.ts            # GET combined connection status
│           ├── calendar/route.ts   # POST/DELETE the Google Calendar URL
│           └── photos/route.ts     # POST/DELETE the iCloud shared-album URL
├── data/                       # Runtime config (gitignored, mode 0600)
│   └── config.json             # Created on first save from the UI
├── .env.example
├── next.config.ts
├── package.json
└── tsconfig.json
```

### Data sources

| Widget   | Source                                                                                   |
| ---      | ---                                                                                      |
| Clock    | Browser `Date` + weather sun times                                                       |
| Weather  | [Open-Meteo](https://open-meteo.com/), keyless                                           |
| Calendar | Google Calendar secret iCal URL — set via the **Settings gear** or `GOOGLE_CALENDAR_ICS_URL` |
| Photos   | Apple Photos shared album — set via the **Settings gear**; or local `PHOTOS_DIR` env     |
| News     | `app/lib/mockData.ts` — wire up RSS or News API                                          |
| Tasks    | `app/lib/mockData.ts` — wire up Todoist/Google Tasks                                     |
| Home     | `app/lib/mockData.ts` — wire up Home Assistant                                           |
| Commute  | `app/lib/mockData.ts` — wire up Google Maps / Waze                                       |
| Stocks   | `app/lib/mockData.ts` — wire up Finnhub / Alpha Vantage                                  |
| Quote    | `app/lib/mockData.ts` — rotate from a list                                               |

All mock widgets keep their real shape and state — swap their data source and the layout/styling stay as-is.

### Connecting your data

Calendar and Photos can be set up two ways. The env var, if present, wins:

- **Settings gear** (recommended for most setups). The first time the dashboard renders, the Calendar and Photos tiles each show a paste-in setup card. Drop in the URL, click **Connect**, and it persists to `data/config.json` (gitignored, mode `0600`). The gear icon in the topstrip opens a modal with the current connection state, a **Refresh all** button, and **Disconnect** buttons.
- **Environment variables** (set once and forget). Put `GOOGLE_CALENDAR_ICS_URL` and/or `PHOTOS_DIR` in `.env.local`. When set, the matching widget treats the env value as authoritative; the Settings modal shows "Set via .env.local" and hides Disconnect.

For Apple Photos, the source must be a **shared album** with **Public Website** turned on (Apple Photos → shared album → people icon → toggle on → copy the link). The dashboard talks to Apple's unofficial `sharedstreams` endpoints to list photos and fetch signed image URLs.

### API routes

- `GET /api/weather` — current, 6 hourly, 5-day forecast, sunrise/sunset. Cached 10 min.
- `GET /api/calendar` — events within 14 days, sorted, max 10. Expands recurring events. Cached 5 min.
- `GET /api/photos` — JSON `{configured, photos:[{url,title,meta}]}`. Either local files under `/api/photos/[name]` or direct iCloud signed URLs.
- `GET /api/photos/[name]` — streams one image file (PHOTOS_DIR mode). Path-traversal guarded.
- `GET /api/config` — combined `{calendar, photos}` status: `configured`, `source` (`env` / `file` / `dir` / `none`), `hint`.
- `POST /api/config/calendar` / `DELETE` — save or clear the Google Calendar URL.
- `POST /api/config/photos` / `DELETE` — save or clear the iCloud shared-album URL.

## Local development (Mac/Linux)

Requires **Node 20+** (Next 15 drops Node 18 support; this repo is verified on Node 22).

```bash
npm install
cp .env.example .env.local        # fill in values, see below
npm run dev                       # http://localhost:3000
```

### Environment variables

All optional — Calendar and Photos can also be configured at runtime from the Settings gear.

| Var | Purpose | Example |
| --- | --- | --- |
| `NEXT_PUBLIC_DASHBOARD_NAME` | Shown top-left (monospaced crumb) | `GANYMEDE · HOME` |
| `NEXT_PUBLIC_DASHBOARD_LOCATION` | Shown top-left (display italic) | `Brookline, Mass.` |
| `WEATHER_LAT` | Latitude | `40.7128` |
| `WEATHER_LON` | Longitude | `-74.0060` |
| `WEATHER_TZ` | IANA timezone | `America/New_York` |
| `GOOGLE_CALENDAR_ICS_URL` | Calendar ICS feed. Overrides the UI setting when present. | `https://calendar.google.com/calendar/ical/.../basic.ics` |
| `PHOTOS_DIR` | Absolute path to a local photo dir. Overrides the iCloud UI setting **if the directory exists**. | `/home/pi/ganymede-photos` |

> **Heads-up on precedence.** If you want to manage Calendar or Photos from the Settings UI, leave the matching env var empty (Calendar) or unset/missing-on-disk (Photos). When the env value is present and usable, the Settings modal shows "Set via .env.local" and hides Disconnect.

#### Getting the URLs

- **Google Calendar:** open [Google Calendar](https://calendar.google.com) → hover the calendar → ⋮ → **Settings and sharing** → scroll to **Integrate calendar** → copy **Secret address in iCal format**. Treat the URL like a password.
- **Apple Photos:** in Photos, open a shared album → people icon → toggle **Public Website** on → copy the link Apple displays. Anyone with the link can view the album.

## Raspberry Pi deployment

Verified on Pi 4 and Pi 5 running Raspberry Pi OS Bookworm (64-bit). Pi 3 works but expect slower Next.js builds — build on your laptop and `rsync` the `.next/` folder if needed.

### 1. Install Node 20 and Chromium

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git chromium-browser unclutter
node -v                          # expect v20.x
```

### 2. Set the timezone

```bash
sudo raspi-config                # Localization Options → Timezone
```

Otherwise the clock and calendar render in UTC.

### 3. Clone, configure, build

```bash
cd ~
git clone <your-repo-url> ganymede
cd ganymede
npm ci
cp .env.example .env.local
nano .env.local                  # set NEXT_PUBLIC_*, WEATHER_*; leave the rest empty
chmod 600 .env.local             # the file may hold secrets later
npm run build
```

If you plan to use a **local photo folder** instead of an iCloud shared album, also create the directory and drop images in it:

```bash
mkdir -p ~/ganymede-photos       # only if you're using PHOTOS_DIR
```

If you'll use the **Settings UI** to connect Calendar and Photos, you can skip the local photo dir entirely — just leave `PHOTOS_DIR` unset (or pointed at a path that doesn't exist) and `GOOGLE_CALENDAR_ICS_URL` empty.

Sanity check the production server:

```bash
npm run start                    # Ctrl-C after you've confirmed http://<pi-ip>:3000 loads
```

### 4. Run as a systemd service

Create `/etc/systemd/system/ganymede.service`:

```ini
[Unit]
Description=Ganymede Dashboard
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/ganymede
EnvironmentFile=/home/pi/ganymede/.env.local
ExecStart=/usr/bin/npm run start
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Enable and start it:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now ganymede
sudo systemctl status ganymede   # should be "active (running)"
journalctl -u ganymede -f        # tail logs
```

### 5. Kiosk mode (auto-launch Chromium fullscreen on boot)

**Wayland (default on Bookworm)** — edit `~/.config/wayfire.ini`:

```ini
[autostart]
dashboard = bash -c 'sleep 10 && chromium-browser --kiosk --noerrdialogs --disable-infobars --incognito http://localhost:3000'
cursor    = unclutter -idle 1
```

**X11 (LXDE, older setups)** — add to `~/.config/lxsession/LXDE-pi/autostart`:

```
@chromium-browser --kiosk --noerrdialogs --disable-infobars --incognito http://localhost:3000
@unclutter -idle 1
```

### 6. Prevent the screen from blanking

```bash
sudo raspi-config                # Display Options → Screen Blanking → Disable
```

For finer control (e.g. blank after midnight), use `xset` (X11) or `wlr-randr` (Wayland) in a cron job.

### 7. Rotate the display (optional)

Raspberry Pi OS → `Preferences → Screen Configuration` → right-click the screen → `Orientation`.

### 8. Updating

```bash
cd ~/ganymede
git pull
npm ci
npm run build
sudo systemctl restart ganymede
```

## Customizing the look

All visual styling lives in **`app/globals.css`**. The top of the file defines the full design-token set in oklch — change these to re-skin the whole dashboard:

```css
:root {
  --bg: oklch(0.965 0.012 75);        /* warm paper */
  --bg-raised: oklch(0.985 0.008 75); /* card surface */
  --ink: oklch(0.22 0.015 60);        /* primary text */
  --accent: oklch(0.62 0.122 45);     /* terracotta */
  /* ... */
}
```

A dark theme is already defined under `[data-theme='dark']`. To switch, edit `app/layout.tsx` and change `data-theme="light"` to `"dark"` (or wire it to `prefers-color-scheme`).

Grid placement is driven by per-widget classes (`.w-clock`, `.w-weather`, …). Rearrange widgets by changing those rules in `globals.css` — each widget is a pure component that doesn't care where it's placed.

## Swapping mock data for real APIs

Each "mock" widget is a drop-in target for a real data source. The pattern:

1. Create a new route under `app/api/<widget>/route.ts` that returns JSON with the same shape as `mockData.ts`.
2. In the widget component, replace the `mockX` import with a `useEffect` → `fetch("/api/<widget>")`.
3. Leave the JSX alone — the styling works on the same data contract.

Good candidates:
- **News** → any RSS-to-JSON service or the NewsAPI.org free tier.
- **Tasks** → Todoist REST API (personal token) or Google Tasks.
- **Home** → Home Assistant long-lived access token on `/api/states`.
- **Commute** → Google Maps Distance Matrix or Waze embeds.
- **Stocks** → Finnhub free tier (60 calls/min) or Yahoo Finance via `yahoo-finance2`.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| `npm run dev` fails with `Unsupported engine` | Node is too old. Install Node 20+ via nvm or NodeSource. |
| Weather panel stuck on "failed to load" | Check `WEATHER_LAT`/`LON` are numeric; test `curl http://localhost:3000/api/weather`. |
| Clock or Calendar are off by hours | Set the Pi's timezone with `sudo raspi-config` → Localization Options → Timezone, then `sudo systemctl restart ganymede`. |
| Calendar tile shows "Connect Google Calendar" forever | The save didn't validate the URL. Open the Calendar setting from the gear and confirm the URL is `https://calendar.google.com/calendar/ical/.../basic.ics`. Or set `GOOGLE_CALENDAR_ICS_URL` in `.env.local` and restart. |
| Photos tile shows "Connect Apple Photos" but you set `PHOTOS_DIR` | The directory at `PHOTOS_DIR` doesn't exist or isn't readable. Either `mkdir -p` the path or unset the env var to use the iCloud flow. |
| Photos suddenly stop loading, error mentions `iCloud webstream` or `partition redirect` | Apple's shared-streams protocol is unofficial; they may have changed it. Disconnect/reconnect from the Settings gear; if it keeps failing, the protocol shim in `app/lib/icloudShared.ts` needs an update. |
| iCloud photos turn into broken images after the dashboard sits idle for an hour | Signed iCloud URLs have expired. Click **Refresh all** in Settings — or wait for the next scheduled poll (15 min). |
| Chromium opens a blank tab | Boot takes longer than 10s — bump the `sleep 10` in `wayfire.ini` to `sleep 20`. |
| Service keeps restarting | `journalctl -u ganymede -n 100` to see the crash. Most common: missing `.env.local` or unbuilt app (`npm run build`). |
| Settings gear → Disconnect button missing | The widget is reading from an env var, which always wins. Empty out `GOOGLE_CALENDAR_ICS_URL` (or remove/break `PHOTOS_DIR`) in `.env.local` and restart. |
