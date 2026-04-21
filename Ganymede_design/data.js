// Ganymede — mock data (client-only; no network calls)
window.GANYMEDE_DATA = {
  location: 'Brookline, Mass.',
  tz: 'EDT',
  now: new Date(2026, 3, 21, 8, 42), // Tues, Apr 21 2026 — aligned to the project date
  sun: { rise: '5:58', set: '19:34' },

  weather: {
    current: { temp: 58, feels: 56, cond: 'Partly cloudy', hi: 64, lo: 49, icon: 'cloud-sun' },
    hours: [
      { h: '9a',  t: 58, i: 'cloud-sun' },
      { h: '10a', t: 61, i: 'sun' },
      { h: '11a', t: 63, i: 'sun' },
      { h: '12p', t: 64, i: 'sun' },
      { h: '1p',  t: 64, i: 'cloud-sun' },
      { h: '2p',  t: 62, i: 'cloud' },
    ],
    days: [
      { d: 'WED', i: 'cloud', hi: 66, lo: 48, lowPct: 20, highPct: 75 },
      { d: 'THU', i: 'rain',  hi: 54, lo: 44, lowPct: 12, highPct: 52 },
      { d: 'FRI', i: 'rain',  hi: 51, lo: 42, lowPct: 10, highPct: 48 },
      { d: 'SAT', i: 'sun',   hi: 62, lo: 45, lowPct: 15, highPct: 66 },
      { d: 'SUN', i: 'sun',   hi: 70, lo: 50, lowPct: 22, highPct: 85 },
    ],
  },

  calendar: {
    month: 'April 2026',
    todayDay: 21,
    mini: [
      // 6 weeks x 7 days, starting Sun Mar 29
      { n: 29, off: true }, { n: 30, off: true }, { n: 31, off: true },
      { n: 1  }, { n: 2  }, { n: 3, has: true }, { n: 4 },
      { n: 5  }, { n: 6, has: true }, { n: 7 }, { n: 8 }, { n: 9 }, { n: 10, has: true }, { n: 11 },
      { n: 12 }, { n: 13 }, { n: 14, has: true }, { n: 15 }, { n: 16 }, { n: 17 }, { n: 18, has: true },
      { n: 19 }, { n: 20 }, { n: 21, today: true, has: true }, { n: 22, has: true }, { n: 23 }, { n: 24, has: true }, { n: 25 },
      { n: 26 }, { n: 27 }, { n: 28 }, { n: 29 }, { n: 30 },
      { n: 1, off: true }, { n: 2, off: true },
    ],
    agenda: [
      {
        date: 21, dow: 'TUE', today: true,
        events: [
          { time: '9:00', end: '9:30', c: 1, title: 'Morning standup — Design' },
          { time: '11:30', end: '12:00', c: 2, title: 'Coffee with Renata' },
          { time: '2:00', end: '3:30', c: 3, title: 'Q2 roadmap review' },
          { time: '6:15', end: '7:00', c: 4, title: 'Leo — piano lesson' },
        ],
      },
      {
        date: 22, dow: 'WED',
        events: [
          { time: 'All day', end: '', c: 2, title: "Anya's birthday" },
          { time: '10:00', end: '11:00', c: 1, title: 'Design critique' },
          { time: '4:30', end: '5:15', c: 3, title: 'Pediatrician — checkup' },
        ],
      },
      {
        date: 24, dow: 'FRI',
        events: [
          { time: '7:30', end: '9:30', c: 4, title: 'Dinner @ Oleana' },
        ],
      },
    ],
  },

  photos: [
    { title: 'Camden Harbor, July', meta: 'Family album · 2024', hue: 32, hue2: 12 },
    { title: 'Kitchen windowsill', meta: 'Household · this week', hue: 140, hue2: 80 },
    { title: 'Back porch, gold hour', meta: 'Family album · 2025', hue: 55, hue2: 22 },
    { title: 'First snow', meta: 'Family album · 2023', hue: 220, hue2: 260 },
  ],

  news: {
    lede: {
      tag: 'Top story · Reuters',
      head: 'Coastal mayors draft shared climate resilience pact ahead of summer conference',
      dek: 'Nineteen cities on the Atlantic seaboard agreed on a framework for joint infrastructure funding, citing shared stormwater and heat-island risk.',
    },
    items: [
      { src: 'AP', h: 'Federal Reserve holds rates, signals one cut later this year' },
      { src: 'NPR', h: 'Boston Public Library expands free seed-lending program to 14 branches' },
      { src: 'Sci.', h: 'Webb telescope finds methane signature on warm sub-Neptune' },
      { src: 'Globe', h: 'MBTA Green Line extension to break ground in Medford this fall' },
    ],
  },

  tasks: [
    { id: 't1', label: 'Buy groceries for dinner', meta: 'Today', done: false },
    { id: 't2', label: 'Submit expense report', meta: 'Today · Work', done: true },
    { id: 't3', label: "Reply to Maya's invite", meta: 'Tomorrow', done: false },
    { id: 't4', label: 'Water the ficus', meta: 'Weekly', done: true },
    { id: 't5', label: 'Book movers — June 3', meta: 'Sat', done: false },
    { id: 't6', label: 'Prep slides for Q2 review', meta: 'Tue · Work', done: false },
  ],

  home: [
    { id: 'h1', name: 'Front porch', icon: 'bulb',  state: '24%', sub: 'Dim · warm',     on: true  },
    { id: 'h2', name: 'Living room', icon: 'bulb',  state: 'Off',  sub: '3 lights',       on: false },
    { id: 'h3', name: 'Thermostat',  icon: 'therm', state: '68°',  sub: 'Heat · holding', on: true  },
    { id: 'h4', name: 'Front door',  icon: 'lock',  state: 'Locked', sub: 'Last · 7:12a', on: false },
    { id: 'h5', name: 'Garage',      icon: 'garage',state: 'Closed', sub: '4h ago',       on: false },
    { id: 'h6', name: 'Kitchen spkr',icon: 'music', state: 'Paused', sub: 'Khruangbin',   on: false },
  ],

  commute: [
    { name: 'Home → Office',     sub: 'via I-90 · 8.2 mi',  mins: 18, state: 'ok'  },
    { name: "Leo's school run",  sub: 'via Beacon · 2.4 mi', mins: 9,  state: 'ok'  },
    { name: 'To Logan airport',  sub: 'via Storrow · 11 mi', mins: 32, state: 'bad' },
  ],

  stocks: [
    { sym: 'VTI',   price: 312.48, chg: +1.22, pct: +0.39, spark: [4,5,4,6,7,6,7,9,8,9] },
    { sym: 'AAPL',  price: 224.10, chg: +0.86, pct: +0.39, spark: [7,6,7,7,8,8,9,8,9,10] },
    { sym: 'MSFT',  price: 438.22, chg: -2.14, pct: -0.49, spark: [8,9,9,8,7,8,7,7,6,6] },
    { sym: 'BND',   price:  72.04, chg: +0.08, pct: +0.11, spark: [5,5,5,6,5,6,6,6,7,6] },
  ],

  quote: {
    q: "You are what you do, not what you say you'll do.",
    a: 'C. G. Jung',
  },
};
