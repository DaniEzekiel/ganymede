import type { IconName } from "../components/Icon";

export const mockNews = {
  lede: {
    tag: "Top story · Reuters",
    head: "Coastal mayors draft shared climate resilience pact ahead of summer conference",
    dek: "Nineteen cities on the Atlantic seaboard agreed on a framework for joint infrastructure funding, citing shared stormwater and heat-island risk.",
  },
  items: [
    { src: "AP", h: "Federal Reserve holds rates, signals one cut later this year" },
    { src: "NPR", h: "Boston Public Library expands free seed-lending program to 14 branches" },
    { src: "Sci.", h: "Webb telescope finds methane signature on warm sub-Neptune" },
    { src: "Globe", h: "MBTA Green Line extension to break ground in Medford this fall" },
  ],
};

export type HomeTile = { id: string; name: string; icon: IconName; state: string; sub: string; on: boolean };
export const mockHome: HomeTile[] = [
  { id: "h1", name: "Front porch", icon: "bulb",  state: "24%",    sub: "Dim · warm",     on: true  },
  { id: "h2", name: "Living room", icon: "bulb",  state: "Off",    sub: "3 lights",       on: false },
  { id: "h3", name: "Thermostat",  icon: "therm", state: "68°",    sub: "Heat · holding", on: true  },
  { id: "h4", name: "Front door",  icon: "lock",  state: "Locked", sub: "Last · 7:12a",   on: false },
  { id: "h5", name: "Garage",      icon: "garage",state: "Closed", sub: "4h ago",         on: false },
  { id: "h6", name: "Kitchen spkr",icon: "music", state: "Paused", sub: "Khruangbin",     on: false },
];

export const mockCommute = [
  { name: "Home → Office",     sub: "via I-90 · 8.2 mi",   mins: 18, state: "ok"  as const },
  { name: "Leo's school run",  sub: "via Beacon · 2.4 mi", mins: 9,  state: "ok"  as const },
  { name: "To Logan airport",  sub: "via Storrow · 11 mi", mins: 32, state: "bad" as const },
];

export const mockStocks = [
  { sym: "VTI",  price: 312.48, chg: +1.22, pct: +0.39, spark: [4, 5, 4, 6, 7, 6, 7, 9, 8, 9] },
  { sym: "AAPL", price: 224.10, chg: +0.86, pct: +0.39, spark: [7, 6, 7, 7, 8, 8, 9, 8, 9, 10] },
  { sym: "MSFT", price: 438.22, chg: -2.14, pct: -0.49, spark: [8, 9, 9, 8, 7, 8, 7, 7, 6, 6] },
  { sym: "BND",  price:  72.04, chg: +0.08, pct: +0.11, spark: [5, 5, 5, 6, 5, 6, 6, 6, 7, 6] },
];

export const mockQuote = {
  q: "You are what you do, not what you say you'll do.",
  a: "C. G. Jung",
};

export const mockPhotoPalettes = [
  { title: "Camden Harbor, July",    meta: "Sample album · 2024",   hue: 32,  hue2: 12  },
  { title: "Kitchen windowsill",     meta: "Sample album · spring", hue: 140, hue2: 80  },
  { title: "Back porch, gold hour",  meta: "Sample album · 2025",   hue: 55,  hue2: 22  },
  { title: "First snow",             meta: "Sample album · 2023",   hue: 220, hue2: 260 },
];

/* ---------- Demo data shown until a real source is connected ---------- */
// These power the public/unconfigured view of Calendar, Tasks, and Photos.
// They never touch the server: a widget renders them only when its API route
// reports `configured: false`, so no personal data is involved.

export type DemoEvent = { start: string; end: string; summary: string; location: string };

// Built relative to "now" so the agenda and mini-month always look current.
export function demoCalendarEvents(): DemoEvent[] {
  const slot = (dayOffset: number, hour: number, minute = 0, durationMin = 60) => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() + dayOffset);
    start.setHours(hour, minute, 0, 0);
    const end = new Date(start.getTime() + durationMin * 60_000);
    return { start: start.toISOString(), end: end.toISOString() };
  };
  return [
    { ...slot(0, 9, 0, 30),   summary: "Team standup",      location: "Zoom" },
    { ...slot(0, 12, 30, 60), summary: "Lunch with Sam",    location: "Café Luna" },
    { ...slot(1, 10, 0, 90),  summary: "Design review",     location: "Room 4B" },
    { ...slot(2, 8, 30, 45),  summary: "Dentist",           location: "Downtown" },
    { ...slot(3, 18, 0, 120), summary: "Dinner party",      location: "Home" },
    { ...slot(5, 14, 0, 60),  summary: "1:1 with Alex",     location: "" },
  ];
}

export type DemoTask = { id: string; label: string; done: boolean; meta: string };
export const demoTasks: DemoTask[] = [
  { id: "demo-1", label: "Water the plants",      done: false, meta: "Today" },
  { id: "demo-2", label: "Reply to the landlord", done: false, meta: "" },
  { id: "demo-3", label: "Pick up groceries",     done: false, meta: "Tomorrow" },
  { id: "demo-4", label: "Renew library books",   done: true,  meta: "" },
  { id: "demo-5", label: "Book dentist visit",    done: true,  meta: "" },
];

export type DemoPhoto = { url: string; title: string; meta: string };

// Self-contained SVG gradients — no external image requests.
function gradientPhoto(hue: number, hue2: number): string {
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='900'>` +
    `<defs>` +
    `<linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>` +
    `<stop offset='0' stop-color='hsl(${hue},62%,58%)'/>` +
    `<stop offset='1' stop-color='hsl(${hue2},56%,40%)'/>` +
    `</linearGradient>` +
    `<radialGradient id='h' cx='0.72' cy='0.22' r='0.85'>` +
    `<stop offset='0' stop-color='hsla(${hue},85%,88%,0.5)'/>` +
    `<stop offset='1' stop-color='hsla(${hue},85%,88%,0)'/>` +
    `</radialGradient>` +
    `</defs>` +
    `<rect width='1200' height='900' fill='url(#g)'/>` +
    `<rect width='1200' height='900' fill='url(#h)'/>` +
    `</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export function demoPhotos(): DemoPhoto[] {
  return mockPhotoPalettes.map((p) => ({
    url: gradientPhoto(p.hue, p.hue2),
    title: p.title,
    meta: p.meta,
  }));
}
