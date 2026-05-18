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
  { title: "Camden Harbor, July",    meta: "Family album · 2024",   hue: 32,  hue2: 12  },
  { title: "Kitchen windowsill",     meta: "Household · this week", hue: 140, hue2: 80  },
  { title: "Back porch, gold hour",  meta: "Family album · 2025",   hue: 55,  hue2: 22  },
  { title: "First snow",             meta: "Family album · 2023",   hue: 220, hue2: 260 },
];
