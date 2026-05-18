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
│   │   ├── Calendar.tsx        # Mini month grid + 4-day agenda (Google Calendar)
│   │   ├── Photos.tsx          # Cross-fade slideshow, tap to advance
│   │   ├── News.tsx            # Lede + headlines (mock)
│   │   ├── Tasks.tsx           # Google Tasks (read/write)
│   │   ├── Home.tsx            # Smart home tiles (mock, interactive)
│   │   ├── Commute.tsx         # Traffic routes (mock)
│   │   ├── Stocks.tsx          # Tickers + sparklines (mock)
│   │   └── Quote.tsx           # Daily quote (mock)
│   ├── lib/
│   │   ├── mockData.ts         # Seed data for widgets without a real API yet
│   │   ├── config.ts           # Reads/writes data/config.json
│   │   ├── google.ts           # OAuth client + auto-refreshing googleFetch
│   │   └── icloudShared.ts     # Apple Photos shared-album client
│   └── api/
│       ├── weather/route.ts    # Open-Meteo proxy (no key)
│       ├── calendar/route.ts   # Google Calendar API (primary calendar, 14-day window)
│       ├── tasks/
│       │   ├── route.ts        # GET list / POST create on @default task list
│       │   └── [id]/route.ts   # PATCH toggle/edit / DELETE
│       ├── auth/google/
│       │   ├── start/route.ts      # Begin OAuth consent
│       │   ├── callback/route.ts   # Exchange code, persist tokens
│       │   └── disconnect/route.ts # Revoke + clear tokens
│       ├── photos/
│       │   ├── route.ts        # PHOTOS_DIR if set, else iCloud shared album
│       │   └── [name]/route.ts # Streams one local image (PHOTOS_DIR mode only)
│       └── config/
│           ├── route.ts            # GET combined Google + photos status
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
| Calendar | Google Calendar API + Apple Calendar public ICS (merged) — set up either or both         |
| Tasks    | Google Tasks API (`@default` list, read + write) — Sign in with Google                   |
| Photos   | Apple Photos shared album — set via the **Settings gear**; or local `PHOTOS_DIR` env     |
| News     | `app/lib/mockData.ts` — wire up RSS or News API                                          |
| Home     | `app/lib/mockData.ts` — wire up Home Assistant                                           |
| Commute  | `app/lib/mockData.ts` — wire up Google Maps / Waze                                       |
| Stocks   | `app/lib/mockData.ts` — wire up Finnhub / Alpha Vantage                                  |
| Quote    | `app/lib/mockData.ts` — rotate from a list                                               |

All mock widgets keep their real shape and state — swap their data source and the layout/styling stay as-is.

### Connecting your data

**Google (Calendar + Tasks).** One OAuth flow covers both widgets. The first time the dashboard renders, Calendar and Tasks each show a **Sign in with Google** button — click either one, walk through Google's consent screen, and you land back on the dashboard connected. Tokens persist to `data/config.json` (gitignored, mode `0600`). The gear icon in the topstrip shows the connected account and a **Disconnect** button. See [Google Cloud setup](#google-cloud-setup) below for the one-time OAuth client creation.

**Apple Calendar (optional, merges with Google).** In macOS Calendar, right-click a calendar → **Share Calendar** → toggle **Public Calendar** → copy the `webcal://…` link. Paste it into the Calendar widget's setup card (or in Settings → Apple Calendar). Events from both sources are merged, sorted by start time, and capped at the next 10. Heads-up: "public" means anyone with the link can read the calendar — don't share it widely.

**Apple Photos.** Two ways, env var wins if both are set:

- **Settings gear** — the Photos tile shows a paste-in card. Drop in an iCloud shared-album URL and click **Connect**. The source must be a shared album with **Public Website** turned on (Photos → shared album → people icon → toggle on → copy the link). The dashboard talks to Apple's unofficial `sharedstreams` endpoints to list photos and fetch signed image URLs.
- **`PHOTOS_DIR` env var** — point at a local directory of `.jpg`/`.png`/`.webp` files. If the directory exists, this overrides the iCloud setting; Settings shows "Set via .env.local" and hides Disconnect.

### API routes

- `GET /api/weather` — current, 6 hourly, 5-day forecast, sunrise/sunset. Cached 10 min.
- `GET /api/calendar` — events for the next 14 days from Google (primary) + Apple (published ICS), merged and sorted, max 10. Returns `{configured: false}` if neither source is set up.
- `POST /api/config/apple-calendar` / `DELETE` — save or clear the Apple Calendar public URL.
- `GET /api/tasks` — list Google Tasks from `@default`. `POST /api/tasks` creates one (`{title}`).
- `PATCH /api/tasks/[id]` — toggle done (`{done: boolean}`) or rename (`{title}`). `DELETE /api/tasks/[id]` — remove.
- `GET /api/auth/google/start` — begin OAuth consent. `GET /api/auth/google/callback` — exchange code + persist tokens. `POST /api/auth/google/disconnect` — revoke + clear.
- `GET /api/photos` — JSON `{configured, photos:[{url,title,meta}]}`. Local files via `/api/photos/[name]` or iCloud signed URLs.
- `GET /api/photos/[name]` — streams one image file (PHOTOS_DIR mode). Path-traversal guarded.
- `GET /api/config` — combined `{google, photos}` connection status.
- `POST /api/config/photos` / `DELETE` — save or clear the iCloud shared-album URL.

### Google Cloud setup

One-time, ~5 minutes:

1. https://console.cloud.google.com → **Create Project** (name it whatever).
2. **APIs & Services → Library** — enable **Google Calendar API** and **Google Tasks API**.
3. **APIs & Services → OAuth consent screen**:
   - User type: **External**
   - Add scopes `.../auth/calendar.readonly` and `.../auth/tasks`
   - Add yourself as a **test user**
4. **APIs & Services → Credentials → Create credentials → OAuth client ID**:
   - Application type: **Web application**
   - Authorized redirect URIs: `http://localhost:3000/api/auth/google/callback` (add `http://<pi-ip>:3000/api/auth/google/callback` when you deploy)
   - Copy the **Client ID** and **Client secret** into `.env.local`:
     ```
     GOOGLE_CLIENT_ID=...
     GOOGLE_CLIENT_SECRET=...
     GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
     ```

> **Heads-up on Testing mode.** Until you publish the OAuth app, refresh tokens expire after **7 days** — meaning you'd have to re-sign-in weekly on a long-running kiosk. To avoid that, **Publish** the app from the consent screen (no verification needed for these scopes; users just see a "this app isn't verified" advisory once and click through).

## Local development (Mac/Linux)

Requires **Node 20+** (Next 15 drops Node 18 support; this repo is verified on Node 22).

```bash
npm install
cp .env.example .env.local        # fill in values, see below
npm run dev                       # http://localhost:3000
```

### Environment variables

`GOOGLE_*` are required for Calendar and Tasks. `PHOTOS_DIR` is optional — Photos can also be configured at runtime from the Settings gear.

| Var | Purpose | Example |
| --- | --- | --- |
| `NEXT_PUBLIC_DASHBOARD_NAME` | Shown top-left (monospaced crumb) | `GANYMEDE · HOME` |
| `NEXT_PUBLIC_DASHBOARD_LOCATION` | Shown top-left (display italic) | `Brookline, Mass.` |
| `WEATHER_LAT` | Latitude | `40.7128` |
| `WEATHER_LON` | Longitude | `-74.0060` |
| `WEATHER_TZ` | IANA timezone | `America/New_York` |
| `GOOGLE_CLIENT_ID` | OAuth client ID from Google Cloud Console | `1234…apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | OAuth client secret | `GOCSPX-…` |
| `GOOGLE_REDIRECT_URI` | Callback URL registered on the OAuth client | `http://localhost:3000/api/auth/google/callback` |
| `APPLE_CALENDAR_ICS_URL` | Published iCloud Calendar URL. Overrides the UI value when set. | `webcal://p98-caldav.icloud.com/published/2/…` |
| `PHOTOS_DIR` | Absolute path to a local photo dir. Overrides the iCloud UI setting **if the directory exists**. | `/home/pi/ganymede-photos` |

> **Apple Photos source:** in Photos, open a shared album → people icon → toggle **Public Website** on → copy the link Apple displays. Anyone with the link can view the album.

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
nano .env.local                  # set NEXT_PUBLIC_*, WEATHER_*, GOOGLE_* (see README §Google Cloud setup)
chmod 600 .env.local             # contains your OAuth client secret
npm run build
```

If you plan to use a **local photo folder** instead of an iCloud shared album, also create the directory and drop images in it:

```bash
mkdir -p ~/ganymede-photos       # only if you're using PHOTOS_DIR
```

If you'll use the **Settings UI** to connect Photos, you can skip the local photo dir entirely — just leave `PHOTOS_DIR` unset (or pointed at a path that doesn't exist). Don't forget to register `http://<pi-ip>:3000/api/auth/google/callback` as an authorized redirect URI on your Google OAuth client and set `GOOGLE_REDIRECT_URI` to match.

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
- **Home** → Home Assistant long-lived access token on `/api/states`.
- **Commute** → Google Maps Distance Matrix or Waze embeds.
- **Stocks** → Finnhub free tier (60 calls/min) or Yahoo Finance via `yahoo-finance2`.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| `npm run dev` fails with `Unsupported engine` | Node is too old. Install Node 20+ via nvm or NodeSource. |
| Weather panel stuck on "failed to load" | Check `WEATHER_LAT`/`LON` are numeric; test `curl http://localhost:3000/api/weather`. |
| Clock or Calendar are off by hours | Set the Pi's timezone with `sudo raspi-config` → Localization Options → Timezone, then `sudo systemctl restart ganymede`. |
| Calendar/Tasks tile shows "Sign in with Google" after you signed in | The redirect URI registered on your OAuth client doesn't match `GOOGLE_REDIRECT_URI` in `.env.local` (must match exactly, including port). |
| OAuth callback redirects to `/?google=error&reason=no_refresh_token` | You signed in without `prompt=consent`, or Google returned an old grant. Disconnect from the Settings gear, then sign in again. |
| OAuth callback redirects to `/?google=error&reason=bad_state` | Your browser blocked the `g_oauth_state` cookie between start and callback. Don't use a different browser/profile mid-flow. |
| Tasks/Calendar suddenly empty after about a week | The OAuth app is in **Testing** mode — refresh tokens expire in 7 days. Publish the app from the consent screen (no verification needed for these scopes). |
| Photos tile shows "Connect Apple Photos" but you set `PHOTOS_DIR` | The directory at `PHOTOS_DIR` doesn't exist or isn't readable. Either `mkdir -p` the path or unset the env var to use the iCloud flow. |
| Photos suddenly stop loading, error mentions `iCloud webstream` or `partition redirect` | Apple's shared-streams protocol is unofficial; they may have changed it. Disconnect/reconnect from the Settings gear; if it keeps failing, the protocol shim in `app/lib/icloudShared.ts` needs an update. |
| iCloud photos turn into broken images after the dashboard sits idle for an hour | Signed iCloud URLs have expired. Click **Refresh all** in Settings — or wait for the next scheduled poll (15 min). |
| Chromium opens a blank tab | Boot takes longer than 10s — bump the `sleep 10` in `wayfire.ini` to `sleep 20`. |
| Service keeps restarting | `journalctl -u ganymede -n 100` to see the crash. Most common: missing `.env.local` or unbuilt app (`npm run build`). |
| Settings gear → Photos Disconnect button missing | Photos is reading from `PHOTOS_DIR`, which always wins when the directory exists. Remove/rename `PHOTOS_DIR` in `.env.local` and restart. |
