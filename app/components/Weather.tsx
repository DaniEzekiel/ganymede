"use client";
import { useCallback, useEffect, useState } from "react";
import Icon, { type IconName } from "./Icon";

type Hour = { h: string; t: number; i: IconName };
type Day = { d: string; i: IconName; hi: number; lo: number; lowPct: number; highPct: number };
export type WeatherData = {
  current: { temp: number; feels: number; cond: string; icon: IconName; hi: number; lo: number };
  hours: Hour[];
  days: Day[];
  sun: { rise: string; set: string };
};

export default function Weather({
  location,
  onData,
  className = "",
}: {
  location: string;
  onData?: (d: WeatherData) => void;
  className?: string;
}) {
  const [data, setData] = useState<WeatherData | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/weather");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body: WeatherData = await res.json();
      setData(body);
      setErr(null);
      onData?.(body);
    } catch (e) {
      setErr((e as Error).message);
    }
  }, [onData]);

  useEffect(() => {
    load();
    const id = setInterval(load, 10 * 60 * 1000);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    const h = () => load();
    window.addEventListener("ganymede:refresh", h);
    return () => window.removeEventListener("ganymede:refresh", h);
  }, [load]);

  return (
    <div className={`card weather ${className}`}>
      <div className="card-head">
        <div className="card-title">Weather · {location}</div>
        <div className="card-sub">Updated just now</div>
      </div>
      {err && <div className="error">failed to load: {err}</div>}
      {data && (
        <>
          <div className="now">
            <div className="temp">
              {data.current.temp}<sup>°F</sup>
            </div>
            <div className="summary">
              <div className="cond">{data.current.cond}</div>
              <div className="hi-lo">
                H {data.current.hi}°   L {data.current.lo}°  ·  Feels {data.current.feels}°
              </div>
            </div>
          </div>
          <div className="hours">
            {data.hours.map((hr, i) => (
              <div className="hour" key={i}>
                <div className="h">{hr.h}</div>
                <Icon name={hr.i} size={22} />
                <div className="t">{hr.t}°</div>
              </div>
            ))}
          </div>
          <div className="forecast-days">
            {data.days.map((d, i) => (
              <div className="day-row" key={i}>
                <div className="d">{d.d}</div>
                <Icon name={d.i} size={18} />
                <div className="bar">
                  <span style={{ left: d.lowPct + "%", width: (d.highPct - d.lowPct) + "%" }} />
                </div>
                <div className="rng">{d.hi}° / {d.lo}°</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
