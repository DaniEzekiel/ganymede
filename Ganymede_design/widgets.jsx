/* global React, ReactDOM */
const { useState, useEffect, useMemo, useRef } = React;
const D = window.GANYMEDE_DATA;

// ---------------------------------------------------------------------------
// Icon set (inline, mono-weight)
// ---------------------------------------------------------------------------
const Icon = ({ name, size = 16 }) => {
  const paths = {
    sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></>,
    'cloud-sun': <><path d="M12 3v1.5M4.5 7 5.5 8M19.5 7 18.5 8M3 12h1.5"/><circle cx="8" cy="10" r="3"/><path d="M6 18h10a3.5 3.5 0 0 0 0-7 4.5 4.5 0 0 0-8.5-1.5"/></>,
    cloud: <path d="M6 18h11a4 4 0 0 0 0-8 5 5 0 0 0-9.5-1.5A4 4 0 0 0 6 18z"/>,
    rain: <><path d="M6 16h11a4 4 0 0 0 0-8 5 5 0 0 0-9.5-1.5A4 4 0 0 0 6 16z"/><path d="M9 19l-1 2M13 19l-1 2M17 19l-1 2"/></>,
    bulb: <><path d="M9 18h6M10 21h4"/><path d="M8 13a5 5 0 1 1 8 0c-1 1-1.5 2-1.5 3h-5c0-1-.5-2-1.5-3z"/></>,
    therm: <><path d="M14 14.5V4a2 2 0 0 0-4 0v10.5a4 4 0 1 0 4 0z"/><circle cx="12" cy="17" r="1.5"/></>,
    lock: <><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 1 1 8 0v3"/></>,
    garage: <><path d="M3 21V9l9-5 9 5v12"/><path d="M6 21v-7h12v7M6 17h12"/></>,
    music: <><path d="M9 18V6l10-2v12"/><circle cx="6" cy="18" r="3"/><circle cx="16" cy="16" r="3"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></>,
    desktop: <><rect x="2" y="4" width="20" height="13" rx="2"/><path d="M8 21h8M12 17v4"/></>,
    tablet: <><rect x="5" y="3" width="14" height="18" rx="2"/><circle cx="12" cy="18" r="0.6"/></>,
    mobile: <><rect x="7" y="3" width="10" height="18" rx="2"/><path d="M11 18h2"/></>,
    check: <path d="M4 12l5 5L20 6" strokeWidth="2.4"/>,
    chevL: <path d="M15 6l-6 6 6 6"/>,
    chevR: <path d="M9 6l6 6-6 6"/>,
    close: <path d="M6 6l12 12M18 6L6 18"/>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Tweak state — persisted via EDITMODE markers
// ---------------------------------------------------------------------------
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "light",
  "density": "comfortable",
  "typeScale": "md",
  "clock24": false,
  "wallpaper": "harbor",
  "widgets": {
    "clock": true, "weather": true, "calendar": true, "photos": true,
    "news": true, "tasks": true, "home": true, "commute": true,
    "stocks": true, "quote": true
  }
}/*EDITMODE-END*/;

const DENSITY_MAP = { cozy: 0.82, comfortable: 1, roomy: 1.18 };
const SCALE_MAP   = { sm: 0.92, md: 1, lg: 1.1, xl: 1.22 };

// ---------------------------------------------------------------------------
// Clock
// ---------------------------------------------------------------------------
function useTicker() {
  const [, tick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => tick(n => n + 1), 15_000);
    return () => clearInterval(t);
  }, []);
}

const ClockWidget = ({ clock24 }) => {
  useTicker();
  // Use real now so it stays live, but fall back to the mock day-of-week/date display
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();
  const h12 = ((h + 11) % 12) + 1;
  const isPM = h >= 12;
  const mm = String(m).padStart(2, '0');
  const hh = clock24 ? String(h).padStart(2, '0') : String(h12);
  const longDate = now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  return (
    <div className="clock">
      <div>
        <div className="time">
          {hh}<span style={{opacity: 0.45}}>:</span>{mm}
          {!clock24 && <span className="am">{isPM ? 'PM' : 'AM'}</span>}
        </div>
      </div>
      <div className="datebar">
        <div className="long-date">{longDate}</div>
        <div className="sun">
          <div><strong>{D.sun.rise}</strong>Sunrise</div>
          <div><strong>{D.sun.set}</strong>Sunset</div>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Weather
// ---------------------------------------------------------------------------
const WeatherWidget = ({ compact }) => {
  const w = D.weather;
  return (
    <div className="weather">
      <div className="card-head">
        <div className="card-title">Weather · {D.location}</div>
        <div className="card-sub">Updated 2m ago</div>
      </div>
      <div className="now">
        <div className="temp">{w.current.temp}<sup>°F</sup></div>
        <div className="summary">
          <div className="cond">{w.current.cond}</div>
          <div className="hi-lo">H {w.current.hi}°   L {w.current.lo}°  ·  Feels {w.current.feels}°</div>
        </div>
      </div>
      {!compact && (
        <div className="hours">
          {w.hours.map((hr, i) => (
            <div className="hour" key={i}>
              <div className="h">{hr.h}</div>
              <Icon name={hr.i} size={22}/>
              <div className="t">{hr.t}°</div>
            </div>
          ))}
        </div>
      )}
      <div className="forecast-days">
        {w.days.slice(0, compact ? 3 : 5).map((d, i) => (
          <div className="day-row" key={i}>
            <div className="d">{d.d}</div>
            <Icon name={d.i} size={18}/>
            <div className="bar"><span style={{ left: d.lowPct + '%', width: (d.highPct - d.lowPct) + '%' }}/></div>
            <div className="rng">{d.hi}° / {d.lo}°</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Calendar
// ---------------------------------------------------------------------------
const CalendarWidget = ({ compact }) => {
  const c = D.calendar;
  return (
    <div className="cal">
      <div className="card-head">
        <div className="card-title">Calendar</div>
        <div className="card-sub">3 events today</div>
      </div>
      <div className="month">
        <h3>{c.month}</h3>
        <div style={{display: 'flex', gap: 2}}>
          <button className="icon-btn" style={{width: 26, height: 26}}><Icon name="chevL"/></button>
          <button className="icon-btn" style={{width: 26, height: 26}}><Icon name="chevR"/></button>
        </div>
      </div>
      {!compact && (
        <div className="mini">
          {['S','M','T','W','T','F','S'].map((d, i) => <div className="dow" key={'dow'+i}>{d}</div>)}
          {c.mini.map((d, i) => (
            <div
              key={i}
              className={'d' + (d.off ? ' off' : '') + (d.today ? ' today' : '') + (d.has ? ' has' : '')}
            >{d.n}</div>
          ))}
        </div>
      )}
      <div className="agenda">
        {c.agenda.map((day, i) => (
          <div className={'agenda-day' + (day.today ? ' today' : '')} key={i}>
            <div className="dcell">
              <div className="num">{day.date}</div>
              <div className="dow">{day.dow}</div>
            </div>
            <div className="evts">
              {day.events.map((e, j) => (
                <div className="evt" key={j}>
                  <div className={'bar c' + e.c}/>
                  <div className="time">{e.time}</div>
                  <div className="title">{e.title}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Photos — painted SVG panels so we don't depend on remote imagery
// ---------------------------------------------------------------------------
const PhotoCanvas = ({ p }) => (
  <svg viewBox="0 0 600 400" preserveAspectRatio="xMidYMid slice" style={{position:'absolute', inset: 0, width: '100%', height: '100%'}}>
    <defs>
      <linearGradient id={`pg${p.hue}`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%"  stopColor={`oklch(0.72 0.12 ${p.hue})`}/>
        <stop offset="55%" stopColor={`oklch(0.48 0.11 ${(p.hue + p.hue2)/2})`}/>
        <stop offset="100%" stopColor={`oklch(0.22 0.06 ${p.hue2})`}/>
      </linearGradient>
      <pattern id={`pp${p.hue}`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
        <line x1="0" y1="0" x2="0" y2="6" stroke="#fff" strokeOpacity="0.04" strokeWidth="3"/>
      </pattern>
    </defs>
    <rect x="0" y="0" width="600" height="400" fill={`url(#pg${p.hue})`}/>
    <rect x="0" y="0" width="600" height="400" fill={`url(#pp${p.hue})`}/>
    {/* Simple geometric "composition" so each frame has a distinct silhouette */}
    <circle cx="460" cy="130" r="70" fill="#fff" fillOpacity="0.10"/>
    <rect x="0" y="280" width="600" height="120" fill="#000" fillOpacity="0.18"/>
    <path d="M0 320 L180 250 L320 290 L500 220 L600 260 L600 400 L0 400 Z" fill="#000" fillOpacity="0.22"/>
  </svg>
);

const PhotosWidget = ({ wallpaper }) => {
  const [idx, setIdx] = useState(0);
  const [fading, setFading] = useState(false);
  const list = useMemo(() => {
    if (wallpaper === 'all') return D.photos;
    const picked = D.photos.find(p => p.title.toLowerCase().includes(wallpaper));
    return picked ? [picked, ...D.photos.filter(p => p !== picked)] : D.photos;
  }, [wallpaper]);
  useEffect(() => {
    const t = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setIdx(i => (i + 1) % list.length);
        setFading(false);
      }, 600);
    }, 6500);
    return () => clearInterval(t);
  }, [list.length]);

  const p = list[idx];
  return (
    <div className="card flush photos">
      <div className={'photo-frame' + (fading ? ' out' : '')} key={p.title}>
        <PhotoCanvas p={p}/>
      </div>
      <div className="photo-dots">
        {list.map((_, i) => <i key={i} className={i === idx ? 'on' : ''}/>)}
      </div>
      <div className="photo-caption">
        <div>
          <div className="title">{p.title}</div>
          <div className="meta">{p.meta}</div>
        </div>
        <div className="meta">{idx + 1} / {list.length}</div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// News
// ---------------------------------------------------------------------------
const NewsWidget = () => {
  const n = D.news;
  return (
    <div className="news">
      <div className="card-head">
        <div className="card-title">News</div>
        <div className="card-sub">Morning briefing</div>
      </div>
      <div className="lede">
        <div className="tag">{n.lede.tag}</div>
        <h4>{n.lede.head}</h4>
        <p>{n.lede.dek}</p>
      </div>
      <ul>
        {n.items.map((it, i) => (
          <li key={i}>
            <div className="src">{it.src}</div>
            <div className="h">{it.h}</div>
          </li>
        ))}
      </ul>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------
const TasksWidget = () => {
  const [tasks, setTasks] = useState(D.tasks);
  const done = tasks.filter(t => t.done).length;
  const toggle = id => setTasks(tasks.map(t => t.id === id ? {...t, done: !t.done} : t));
  return (
    <div className="tasks">
      <div className="card-head">
        <div className="card-title">Tasks</div>
        <div className="card-sub">{done} of {tasks.length} done</div>
      </div>
      <ul>
        {tasks.map(t => (
          <li key={t.id} className={t.done ? 'done' : ''} onClick={() => toggle(t.id)}>
            <div className="box"><Icon name="check" size={12}/></div>
            <div className="label">{t.label}</div>
            <div className="meta">{t.meta}</div>
          </li>
        ))}
      </ul>
      <div className="progress">
        <div className="count">{done}/{tasks.length}</div>
        <div className="bar"><span style={{width: `${(done/tasks.length)*100}%`}}/></div>
        <div className="count">{Math.round((done/tasks.length)*100)}%</div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Home
// ---------------------------------------------------------------------------
const HomeWidget = () => {
  const [tiles, setTiles] = useState(D.home);
  const toggle = id => setTiles(tiles.map(t => t.id === id ? {...t, on: !t.on} : t));
  return (
    <div className="home">
      <div className="card-head">
        <div className="card-title">Home</div>
        <div className="card-sub">{tiles.filter(t => t.on).length} active</div>
      </div>
      <div className="home-grid">
        {tiles.map(t => (
          <div key={t.id} className={'home-tile' + (t.on ? ' on' : '')} onClick={() => toggle(t.id)}>
            <div className="icon"><Icon name={t.icon} size={22}/></div>
            <div className="name">{t.name}</div>
            <div className="row"><span>{t.sub}</span><span className="state">{t.state}</span></div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Commute
// ---------------------------------------------------------------------------
const CommuteWidget = () => (
  <div className="commute">
    <div className="card-head">
      <div className="card-title">Commute</div>
      <div className="card-sub">Live traffic</div>
    </div>
    {D.commute.map((r, i) => (
      <div className="route" key={i}>
        <div className="line">
          <div className="name">{r.name}</div>
          <div className="sub">{r.sub}</div>
        </div>
        <div className={'mins ' + r.state}>
          {r.mins}<span className="unit">min</span>
        </div>
      </div>
    ))}
  </div>
);

// ---------------------------------------------------------------------------
// Stocks
// ---------------------------------------------------------------------------
const Spark = ({ data, up }) => {
  const w = 48, h = 18;
  const min = Math.min(...data), max = Math.max(...data);
  const rng = Math.max(1, max - min);
  const pts = data.map((v, i) => `${(i/(data.length-1))*w},${h - ((v-min)/rng)*h}`).join(' ');
  return (
    <svg className="spark" viewBox={`0 0 ${w} ${h}`}>
      <polyline fill="none" stroke={up ? 'oklch(0.55 0.10 150)' : 'oklch(0.55 0.14 28)'} strokeWidth="1.25" points={pts}/>
    </svg>
  );
};
const StocksWidget = () => (
  <div className="stocks">
    <div className="card-head">
      <div className="card-title">Markets</div>
      <div className="card-sub">Delayed 15m</div>
    </div>
    <table>
      <thead>
        <tr><th>Ticker</th><th></th><th>Price</th><th>Chg</th></tr>
      </thead>
      <tbody>
        {D.stocks.map(s => (
          <tr key={s.sym}>
            <td className="sym">{s.sym}</td>
            <td><Spark data={s.spark} up={s.chg >= 0}/></td>
            <td className="price">{s.price.toFixed(2)}</td>
            <td className={'chg ' + (s.chg >= 0 ? 'up' : 'dn')}>
              {s.chg >= 0 ? '+' : ''}{s.chg.toFixed(2)} <span style={{opacity: 0.75}}>({s.pct >= 0 ? '+' : ''}{s.pct.toFixed(2)}%)</span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// ---------------------------------------------------------------------------
// Quote
// ---------------------------------------------------------------------------
const QuoteWidget = () => (
  <div className="quote-card card">
    <div className="card-head">
      <div className="card-title">Daily quote</div>
    </div>
    <div className="q">"{D.quote.q}"</div>
    <div className="a">— {D.quote.a}</div>
  </div>
);

Object.assign(window, {
  Icon, ClockWidget, WeatherWidget, CalendarWidget, PhotosWidget,
  NewsWidget, TasksWidget, HomeWidget, CommuteWidget, StocksWidget, QuoteWidget,
  TWEAK_DEFAULTS, DENSITY_MAP, SCALE_MAP,
});
