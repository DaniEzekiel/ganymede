/* global React, ReactDOM */
const { useState, useEffect, useMemo } = React;

// ---------------------------------------------------------------------------
// Layout — per-breakpoint grid placements
// ---------------------------------------------------------------------------
const LAYOUTS = {
  desktop: {
    clock:    { col: '1 / span 14', row: '1 / span 3' },
    weather:  { col: '15 / span 10', row: '1 / span 6' },
    photos:   { col: '1 / span 14', row: '4 / span 5' },
    calendar: { col: '1 / span 9',  row: '9 / span 6' },
    news:     { col: '10 / span 9', row: '9 / span 6' },
    tasks:    { col: '15 / span 10', row: '7 / span 4' },
    home:     { col: '19 / span 6', row: '11 / span 4' },
    commute:  { col: '15 / span 4', row: '11 / span 4' },
    stocks:   { col: '1 / span 9',  row: '15 / span 3' },
    quote:    { col: '10 / span 15', row: '15 / span 3' },
  },
  tablet: {
    clock:    { col: '1 / span 12', row: 'auto' },
    weather:  { col: '1 / span 7',  row: 'auto' },
    photos:   { col: '8 / span 5',  row: 'auto' },
    calendar: { col: '1 / span 7',  row: 'auto' },
    tasks:    { col: '8 / span 5',  row: 'auto' },
    news:     { col: '1 / span 12', row: 'auto' },
    home:     { col: '1 / span 7',  row: 'auto' },
    commute:  { col: '8 / span 5',  row: 'auto' },
    stocks:   { col: '1 / span 7',  row: 'auto' },
    quote:    { col: '8 / span 5',  row: 'auto' },
  },
  mobile: {
    clock:    { col: '1 / -1' },
    weather:  { col: '1 / -1' },
    photos:   { col: '1 / -1' },
    calendar: { col: '1 / -1' },
    tasks:    { col: '1 / -1' },
    news:     { col: '1 / -1' },
    home:     { col: '1 / -1' },
    commute:  { col: '1 / -1' },
    stocks:   { col: '1 / -1' },
    quote:    { col: '1 / -1' },
  },
};

const WIDGET_META = [
  { id: 'clock',    label: 'Clock' },
  { id: 'weather',  label: 'Weather' },
  { id: 'photos',   label: 'Photos' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'news',     label: 'News' },
  { id: 'tasks',    label: 'Tasks' },
  { id: 'home',     label: 'Smart home' },
  { id: 'commute',  label: 'Commute' },
  { id: 'stocks',   label: 'Markets' },
  { id: 'quote',    label: 'Quote' },
];

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------
const Dashboard = ({ bp, tweaks }) => {
  const layout = LAYOUTS[bp];
  const compact = bp !== 'desktop';

  const renderWidget = (id) => {
    if (!tweaks.widgets[id]) return null;
    const style = layout[id] ? {
      gridColumn: layout[id].col,
      gridRow: layout[id].row || 'auto',
    } : {};

    const body = {
      clock:    <ClockWidget clock24={tweaks.clock24}/>,
      weather:  <WeatherWidget compact={compact}/>,
      photos:   <PhotosWidget wallpaper={tweaks.wallpaper}/>,
      calendar: <CalendarWidget compact={bp === 'mobile'}/>,
      news:     <NewsWidget/>,
      tasks:    <TasksWidget/>,
      home:     <HomeWidget/>,
      commute:  <CommuteWidget/>,
      stocks:   <StocksWidget/>,
      quote:    <QuoteWidget/>,
    }[id];

    // Photos and quote render their own card chrome
    if (id === 'photos') return <div key={id} style={{...style, display: 'flex', minHeight: bp === 'mobile' ? 220 : undefined}}>{body}</div>;
    if (id === 'quote')  return <div key={id} style={{...style, display: 'flex'}}>{body}</div>;

    return <div key={id} className="card" style={style}>{body}</div>;
  };

  return (
    <div className="canvas" data-density={tweaks.density}>
      <div className="topstrip">
        <div className="crumb">GANYMEDE · HOME</div>
        <span className="dot"/>
        <div className="place">{window.GANYMEDE_DATA.location}</div>
        <div className="pill">
          <span className="live-dot"/>Live · synced {new Date().toLocaleTimeString(undefined, {hour: 'numeric', minute: '2-digit'})}
        </div>
      </div>
      <div className="grid" data-screen-label={`${bp} canvas`}>
        {WIDGET_META.map(w => renderWidget(w.id))}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Tweaks panel
// ---------------------------------------------------------------------------
const TweaksPanel = ({ open, tweaks, setTweaks, onClose }) => {
  if (!open) return null;
  const update = (patch) => {
    const next = {...tweaks, ...patch};
    setTweaks(next);
    try {
      window.parent?.postMessage({type: '__edit_mode_set_keys', edits: patch}, '*');
    } catch (e) {}
  };
  const updateWidget = (id, on) => {
    const widgets = {...tweaks.widgets, [id]: on};
    update({ widgets });
  };

  return (
    <div className="tweaks">
      <header>
        <h3>Tweaks</h3>
        <button className="icon-btn" onClick={onClose}><Icon name="close"/></button>
      </header>
      <div className="body">
        <div className="tweak-row">
          <label>Theme</label>
          <div className="choices">
            {['light','dark','auto'].map(v => (
              <button key={v} className={'tweak-chip' + (tweaks.theme === v ? ' active' : '')} onClick={() => update({theme: v})}>{v}</button>
            ))}
          </div>
        </div>
        <div className="tweak-row">
          <label>Density</label>
          <div className="choices">
            {['cozy','comfortable','roomy'].map(v => (
              <button key={v} className={'tweak-chip' + (tweaks.density === v ? ' active' : '')} onClick={() => update({density: v})}>{v}</button>
            ))}
          </div>
        </div>
        <div className="tweak-row">
          <label>Type scale</label>
          <div className="choices">
            {['sm','md','lg','xl'].map(v => (
              <button key={v} className={'tweak-chip' + (tweaks.typeScale === v ? ' active' : '')} onClick={() => update({typeScale: v})}>{v.toUpperCase()}</button>
            ))}
          </div>
        </div>
        <div className="tweak-row">
          <label>Clock format</label>
          <div className="choices">
            <button className={'tweak-chip' + (!tweaks.clock24 ? ' active' : '')} onClick={() => update({clock24: false})}>12-hour</button>
            <button className={'tweak-chip' + (tweaks.clock24 ? ' active' : '')} onClick={() => update({clock24: true})}>24-hour</button>
          </div>
        </div>
        <div className="tweak-row">
          <label>Wallpaper source</label>
          <div className="choices">
            {['all','harbor','kitchen','porch','snow'].map(v => (
              <button key={v} className={'tweak-chip' + (tweaks.wallpaper === v ? ' active' : '')} onClick={() => update({wallpaper: v})}>{v}</button>
            ))}
          </div>
        </div>
        <div className="tweak-row">
          <label>Widgets</label>
          <div className="grid-checks">
            {WIDGET_META.map(w => (
              <button
                key={w.id}
                className={'tweak-check' + (tweaks.widgets[w.id] ? ' active' : '')}
                onClick={() => updateWidget(w.id, !tweaks.widgets[w.id])}
              >{tweaks.widgets[w.id] ? '● ' : '○ '}{w.label}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Guidance panel (below the device)
// ---------------------------------------------------------------------------
const Guidance = () => (
  <section className="guidance">
    <div className="guide-head">
      <div>
        <div style={{font: "500 10px/1 var(--font-mono)", letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 10}}>Ganymede · Design system</div>
        <h2>Layout, type, and performance at three breakpoints.</h2>
      </div>
      <p>This spec shows how ten widgets recompose across a 1920 wall display, an 820 tablet, and a 390 phone — and the rules that keep them readable on all three.</p>
    </div>

    <div className="guide-card full">
      <div className="label">Breakpoint strategy</div>
      <h3>Three layouts, one content model.</h3>
      <div className="bp-diagram">
        <div className="bp-box desktop">
          <div className="lbl"><strong>Desktop / wall</strong><span>1920 · 24 col</span></div>
          <div className="cells">
            <div className="cell accent" style={{gridColumn: 'span 2', gridRow: 'span 1'}}>Clock</div>
            <div className="cell" style={{gridColumn: 'span 2', gridRow: 'span 2'}}>Weather</div>
            <div className="cell" style={{gridColumn: 'span 2', gridRow: 'span 2'}}>Photos</div>
            <div className="cell" style={{gridColumn: 'span 2', gridRow: 'span 1'}}>Tasks</div>
            <div className="cell" style={{gridColumn: 'span 1'}}>Calendar</div>
            <div className="cell" style={{gridColumn: 'span 1'}}>News</div>
            <div className="cell" style={{gridColumn: 'span 1'}}>Commute</div>
            <div className="cell" style={{gridColumn: 'span 1'}}>Home</div>
            <div className="cell" style={{gridColumn: 'span 2'}}>Stocks</div>
            <div className="cell" style={{gridColumn: 'span 2'}}>Quote</div>
          </div>
        </div>
        <div className="bp-box tablet">
          <div className="lbl"><strong>Tablet</strong><span>820 · 12 col</span></div>
          <div className="cells">
            <div className="cell accent" style={{gridColumn: 'span 2'}}>Clock</div>
            <div className="cell">Weather</div>
            <div className="cell">Photos</div>
            <div className="cell">Calendar</div>
            <div className="cell">Tasks</div>
            <div className="cell accent" style={{gridColumn: 'span 2'}}>News</div>
            <div className="cell">Home</div>
            <div className="cell">Commute</div>
            <div className="cell">Stocks</div>
            <div className="cell">Quote</div>
          </div>
        </div>
        <div className="bp-box mobile">
          <div className="lbl"><strong>Mobile</strong><span>390 · 1 col</span></div>
          <div className="cells">
            <div className="cell accent">Clock</div>
            <div className="cell">Weather</div>
            <div className="cell">Photos</div>
            <div className="cell">Calendar</div>
            <div className="cell">Tasks</div>
            <div className="cell">News</div>
            <div className="cell">Home</div>
            <div className="cell">Commute</div>
            <div className="cell">Stocks</div>
            <div className="cell">Quote</div>
          </div>
        </div>
      </div>
      <p style={{marginTop: 8}}>
        <strong style={{color: 'var(--ink)'}}>Stacking rules.</strong> On desktop the clock + weather + photos form a glanceable "header zone" occupying the upper half; the lower half is reference (calendar/news) and control (tasks/home/commute). On tablet, the grid halves to 12 columns with 2-up pairings. On mobile, every widget collapses to full-width and reorders by priority: clock → weather → photos → calendar → tasks → news → everything else.
      </p>
    </div>

    <div className="guide-card">
      <div className="label">Color</div>
      <h3>Warm paper, deep bark, single terracotta.</h3>
      <div className="swatch-row">
        <div className="swatch" style={{background: 'var(--bg)', color: 'var(--ink)'}}>BG<small>0.965 · 75</small></div>
        <div className="swatch" style={{background: 'var(--bg-raised)', color: 'var(--ink)'}}>Raised<small>0.985 · 75</small></div>
        <div className="swatch" style={{background: 'var(--bg-sunken)', color: 'var(--ink)'}}>Sunken<small>0.935 · 72</small></div>
        <div className="swatch" style={{background: 'var(--ink-2)', color: 'var(--bg)'}}>Ink-2<small>0.42 · 58</small></div>
        <div className="swatch" style={{background: 'var(--ink)', color: 'var(--bg)'}}>Ink<small>0.22 · 60</small></div>
        <div className="swatch" style={{background: 'var(--accent)', color: 'var(--accent-ink)'}}>Accent<small>0.62 · 45</small></div>
      </div>
      <p>All tokens defined in oklch so lightness is perceptually uniform. Dark mode flips the scale without retuning chroma — the accent shifts only in lightness.</p>
    </div>

    <div className="guide-card">
      <div className="label">Type</div>
      <h3>Fraunces + Inter Tight + JetBrains Mono.</h3>
      <div className="type-spec">
        <div className="row"><span className="meta">H1<br/>44/48</span><span className="spec-h1">08:42</span></div>
        <div className="row"><span className="meta">H2<br/>24/28</span><span className="spec-h2">Morning briefing</span></div>
        <div className="row"><span className="meta">Body<br/>14/22</span><span className="spec-body">Calendar, weather, and photos collapse into a single column below 600px.</span></div>
        <div className="row"><span className="meta">Mono<br/>11/16</span><span className="spec-mono">SUNRISE 5:58 · H 64° L 49°</span></div>
      </div>
    </div>

    <div className="guide-card">
      <div className="label">Spacing</div>
      <h3>4pt base, density-tunable.</h3>
      <ul>
        <li><span><strong>Grid gutters.</strong> 14px desktop, 12px tablet, 10px mobile — keep at least one full unit between cards.</span></li>
        <li><span><strong>Padding.</strong> Cards use 20×density. Cozy multiplies by 0.82, roomy by 1.18.</span></li>
        <li><span><strong>Radii.</strong> 20px outer (cards), 14px inner (tiles), 8px inputs — consistent curvature hierarchy.</span></li>
        <li><span><strong>Touch targets.</strong> 44×44 minimum on mobile — chips and tiles already meet this at comfortable density.</span></li>
      </ul>
    </div>

    <div className="guide-card wide">
      <div className="label">Performance</div>
      <h3>Fast on a tablet, fast on a wall display.</h3>
      <ul>
        <li><span><strong>Critical CSS inline.</strong> Ship the clock + weather shell in the HTML; hydrate the rest after first paint.</span></li>
        <li><span><strong>Subset webfonts.</strong> Fraunces opsz only for display (144 and 24); drop Latin-Ext and unused weights. Preload woff2 with <code>rel="preload"</code>.</span></li>
        <li><span><strong>Lazy + adaptive photos.</strong> Use <code>loading="lazy"</code>, AVIF primary with WebP/JPEG fallback, and sized via <code>&lt;picture&gt;</code> with the actual device DPR in mind.</span></li>
        <li><span><strong>Poll smart, not often.</strong> Weather every 10 min, calendar push via ICS diff, photos prefetch one slide ahead. Coalesce with <code>requestIdleCallback</code>.</span></li>
        <li><span><strong>Defer JavaScript.</strong> Icons inline as SVG; widget bundles code-split by route. Target &lt;120kb gzipped on first load.</span></li>
        <li><span><strong>Burn-in protection.</strong> On always-on displays, shift the grid by ±8px every 30 min and auto-dim to 55% ink between 11p–6a.</span></li>
      </ul>
    </div>

    <div className="guide-card wide">
      <div className="label">Navigation</div>
      <h3>Chrome hides. Context stays.</h3>
      <ul>
        <li><span><strong>Screensaver-first.</strong> Chrome is hidden by default; a single tap (mobile/tablet) or mouse-move (desktop) surfaces the header and widget controls for 6s.</span></li>
        <li><span><strong>One thumb on mobile.</strong> Hit targets ≥44px; swipe up opens widget settings; swipe left/right on photos/calendar scrubs through them.</span></li>
        <li><span><strong>Keyboard-first on desktop.</strong> <code>⌘K</code> opens a palette, <code>1-9</code> focuses widgets, <code>T</code> opens Tweaks, <code>.</code> cycles theme.</span></li>
        <li><span><strong>Glanceable hierarchy.</strong> Clock/weather always above the fold at every breakpoint — the dashboard must answer "what time, what weather, what's next" in &lt;2s.</span></li>
        <li><span><strong>Accessibility.</strong> 4.5:1 contrast minimum; motion respects <code>prefers-reduced-motion</code>; every tile exposes an aria-label and is tabbable.</span></li>
      </ul>
    </div>
  </section>
);

// ---------------------------------------------------------------------------
// App shell
// ---------------------------------------------------------------------------
const App = () => {
  const [bp, setBp] = useState(() => localStorage.getItem('ganymede-bp') || 'desktop');
  const [tweaks, setTweaks] = useState(() => {
    const stored = localStorage.getItem('ganymede-tweaks');
    if (stored) { try { return {...TWEAK_DEFAULTS, ...JSON.parse(stored)}; } catch (e) {} }
    return TWEAK_DEFAULTS;
  });
  const [panelOpen, setPanelOpen] = useState(false);

  useEffect(() => { localStorage.setItem('ganymede-bp', bp); }, [bp]);
  useEffect(() => { localStorage.setItem('ganymede-tweaks', JSON.stringify(tweaks)); }, [tweaks]);

  // Resolve theme (auto = prefers-color-scheme)
  useEffect(() => {
    const root = document.documentElement;
    const apply = () => {
      if (tweaks.theme === 'auto') {
        root.dataset.theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      } else {
        root.dataset.theme = tweaks.theme;
      }
    };
    apply();
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [tweaks.theme]);

  // Type scale + density CSS vars
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--type-scale', SCALE_MAP[tweaks.typeScale] ?? 1);
    root.style.setProperty('--density',     DENSITY_MAP[tweaks.density]   ?? 1);
  }, [tweaks.typeScale, tweaks.density]);

  // Edit-mode host integration
  useEffect(() => {
    const handler = (e) => {
      const d = e.data;
      if (!d || typeof d !== 'object') return;
      if (d.type === '__activate_edit_mode')   setPanelOpen(true);
      if (d.type === '__deactivate_edit_mode') setPanelOpen(false);
    };
    window.addEventListener('message', handler);
    try { window.parent?.postMessage({type: '__edit_mode_available'}, '*'); } catch (e) {}
    return () => window.removeEventListener('message', handler);
  }, []);

  return (
    <div className="app-shell">
      <div className="meta-bar">
        <div className="brand"><span className="mark"/>Ganymede</div>
        <div className="seg" role="tablist" aria-label="Breakpoint">
          {[
            { id: 'desktop', label: '1920 · Wall', icon: 'desktop' },
            { id: 'tablet',  label: '820 · Tablet', icon: 'tablet' },
            { id: 'mobile',  label: '390 · Phone', icon: 'mobile' },
          ].map(b => (
            <button key={b.id} className={bp === b.id ? 'active' : ''} onClick={() => setBp(b.id)}>
              <Icon name={b.icon} size={14}/>{b.label}
            </button>
          ))}
        </div>
        <div className="spacer"/>
        <button className="icon-btn" onClick={() => setPanelOpen(v => !v)} title="Tweaks"><Icon name="settings" size={15}/></button>
      </div>

      <div className="stage">
        <div className="device" data-bp={bp} data-screen-label={`${bp} device`}>
          <div className="device-inner">
            <Dashboard bp={bp} tweaks={tweaks}/>
          </div>
        </div>
      </div>

      <Guidance/>

      <TweaksPanel open={panelOpen} tweaks={tweaks} setTweaks={setTweaks} onClose={() => setPanelOpen(false)}/>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
