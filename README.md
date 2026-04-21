# Ganymede — Raspberry Pi Dashboard

A Dakboard-style home dashboard built with Next.js 15 (App Router) and React 19. Designed to run fullscreen on a Raspberry Pi wired to a TV or monitor.

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
│   │   ├── Clock.tsx           # Time + long date + sunrise/sunset
│   │   ├── Weather.tsx         # Current + 6 hourly + 5-day bar forecast
│   │   ├── Calendar.tsx        # Mini month grid + 4-day agenda
│   │   ├── Photos.tsx          # Cross-fade slideshow, painted SVG fallback
│   │   ├── News.tsx            # Lede + headlines (mock)
│   │   ├── Tasks.tsx           # Checklist with progress (mock, interactive)
│   │   ├── Home.tsx            # Smart home tiles (mock, interactive)
│   │   ├── Commute.tsx         # Traffic routes (mock)
│   │   ├── Stocks.tsx          # Tickers + sparklines (mock)
│   │   └── Quote.tsx           # Daily quote (mock)
│   ├── lib/
│   │   └── mockData.ts         # Seed data for widgets without a real API yet
│   └── api/
│       ├── weather/route.ts    # Open-Meteo proxy (no key)
│       ├── calendar/route.ts   # Parses Google Calendar ICS feed
│       └── photos/
│           ├── route.ts        # Lists photos in PHOTOS_DIR
│           └── [name]/route.ts # Streams a single photo by filename
├── .env.example
├── next.config.ts
├── package.json
└── tsconfig.json
```

### Data sources

| Widget   | Source                              | Real / Mock |
| ---      | ---                                 | ---         |
| Clock    | Browser `Date` + weather sun times  | Real        |
| Weather  | [Open-Meteo](https://open-meteo.com/) | Real (keyless) |
| Calendar | Google Calendar "secret iCal URL"   | Real        |
| Photos   | `PHOTOS_DIR` on disk (fallback: painted SVG) | Real / mock |
| News     | `app/lib/mockData.ts`               | Mock — wire up RSS or News API |
| Tasks    | `app/lib/mockData.ts`               | Mock — wire up Todoist/Google Tasks |
| Home     | `app/lib/mockData.ts`               | Mock — wire up Home Assistant |
| Commute  | `app/lib/mockData.ts`               | Mock — wire up Google Maps / Waze |
| Stocks   | `app/lib/mockData.ts`               | Mock — wire up Finnhub / Alpha Vantage |
| Quote    | `app/lib/mockData.ts`               | Mock — rotate from a list |

All mock widgets keep their real shape and state — swap their data source and the layout/styling stay as-is.

### API routes

- `GET /api/weather` — current, 6 hourly, 5-day forecast, sunrise/sunset. Cached 10 min.
- `GET /api/calendar` — events within 14 days, sorted, max 10. Expands recurring events. Cached 5 min.
- `GET /api/photos` — JSON list of photo URLs under `/api/photos/[name]`.
- `GET /api/photos/[name]` — streams one image file. Path-traversal guarded.

## Local development (Mac/Linux)

Requires **Node 20+** (Next 15 drops Node 18 support; this repo is verified on Node 22).

```bash
npm install
cp .env.example .env.local        # fill in values, see below
npm run dev                       # http://localhost:3000
```

### Environment variables

All optional at dev time — widgets fall back to defaults or show "failed to load."

| Var | Purpose | Example |
| --- | --- | --- |
| `NEXT_PUBLIC_DASHBOARD_NAME` | Shown top-left (monospaced crumb) | `GANYMEDE · HOME` |
| `NEXT_PUBLIC_DASHBOARD_LOCATION` | Shown top-left (display italic) | `Brookline, Mass.` |
| `WEATHER_LAT` | Latitude | `40.7128` |
| `WEATHER_LON` | Longitude | `-74.0060` |
| `WEATHER_TZ` | IANA timezone | `America/New_York` |
| `GOOGLE_CALENDAR_ICS_URL` | Calendar ICS feed (see below) | `https://calendar.google.com/calendar/ical/.../basic.ics` |
| `PHOTOS_DIR` | Absolute path to photos | `/home/pi/ganymede-photos` |

#### Getting a Google Calendar ICS URL

1. Open [Google Calendar](https://calendar.google.com) → hover the calendar in the left sidebar → "⋮" → **Settings and sharing**.
2. Scroll to **Integrate calendar** → copy **Secret address in iCal format**.
3. Treat this URL as a secret — anyone with it can read your calendar.

## Raspberry Pi deployment

Verified on Pi 4 and Pi 5 running Raspberry Pi OS Bookworm (64-bit). Pi 3 works but expect slower Next.js builds — build on your laptop and `rsync` the `.next/` folder if needed.

### 1. Install Node 20 and Chromium

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git chromium-browser unclutter
node -v                          # expect v20.x
```

### 2. Clone, configure, build

```bash
cd ~
git clone <your-repo-url> ganymede
cd ganymede
npm ci
cp .env.example .env.local
nano .env.local                  # fill in real values
mkdir -p ~/ganymede-photos       # drop a few .jpg/.png in here
npm run build
```

Sanity check the production server:

```bash
npm run start                    # Ctrl-C after you've confirmed http://<pi-ip>:3000 loads
```

### 3. Run as a systemd service

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

### 4. Kiosk mode (auto-launch Chromium fullscreen on boot)

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

### 5. Prevent the screen from blanking

```bash
sudo raspi-config                # Display Options → Screen Blanking → Disable
```

For finer control (e.g. blank after midnight), use `xset` (X11) or `wlr-randr` (Wayland) in a cron job.

### 6. Rotate the display (optional)

Raspberry Pi OS → `Preferences → Screen Configuration` → right-click the screen → `Orientation`.

### 7. Updating

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
| Calendar shows "GOOGLE_CALENDAR_ICS_URL not set" | Set it in `.env.local` and restart the service. |
| Photo background never appears | `PHOTOS_DIR` must be an absolute path readable by the `pi` user; drop at least one `.jpg`/`.png`/`.webp` in it. |
| Chromium opens a blank tab | Boot takes longer than 10s — bump the `sleep 10` in `wayfire.ini` to `sleep 20`. |
| Service keeps restarting | `journalctl -u ganymede -n 100` to see the crash. Most common: missing `.env.local` or unbuilt app (`npm run build`). |
