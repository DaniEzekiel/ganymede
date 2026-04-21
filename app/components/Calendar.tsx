"use client";
import { useEffect, useMemo, useState } from "react";
import Icon from "./Icon";

type Event = { start: string; end: string; summary: string; location: string };
type AgendaDay = {
  date: number;
  dow: string;
  today: boolean;
  events: { time: string; c: number; title: string }[];
};

function buildMiniMonth(ref: Date, eventDates: Set<string>) {
  const year = ref.getFullYear();
  const month = ref.getMonth();
  const first = new Date(year, month, 1);
  const startOffset = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();
  const cells: { n: number; off?: boolean; today?: boolean; has?: boolean }[] = [];
  for (let i = startOffset - 1; i >= 0; i--) cells.push({ n: prevMonthDays - i, off: true });
  for (let i = 1; i <= daysInMonth; i++) {
    const iso = new Date(year, month, i).toDateString();
    cells.push({
      n: i,
      today: i === ref.getDate(),
      has: eventDates.has(iso),
    });
  }
  while (cells.length % 7) cells.push({ n: cells.length - startOffset - daysInMonth + 1, off: true });
  return cells;
}

function buildAgenda(events: Event[], ref: Date): AgendaDay[] {
  const byDay = new Map<string, AgendaDay>();
  const palette = [1, 2, 3, 4];
  events.forEach((e, idx) => {
    const d = new Date(e.start);
    const key = d.toDateString();
    if (!byDay.has(key)) {
      byDay.set(key, {
        date: d.getDate(),
        dow: d.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase(),
        today: key === ref.toDateString(),
        events: [],
      });
    }
    const time = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }).toLowerCase().replace(" ", "");
    byDay.get(key)!.events.push({ time, c: palette[idx % palette.length], title: e.summary });
  });
  return Array.from(byDay.values()).slice(0, 4);
}

export default function Calendar({ className = "" }: { className?: string }) {
  const [events, setEvents] = useState<Event[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const now = useMemo(() => new Date(), []);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/calendar");
        const body = await res.json();
        if (!res.ok) {
          setEvents([]);
          setErr(body.error ?? `HTTP ${res.status}`);
          return;
        }
        setEvents(body.events ?? []);
        setErr(null);
      } catch (e) {
        setErr((e as Error).message);
      }
    };
    load();
    const id = setInterval(load, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const eventDates = useMemo(
    () => new Set(events.map((e) => new Date(e.start).toDateString())),
    [events],
  );
  const mini = useMemo(() => buildMiniMonth(now, eventDates), [now, eventDates]);
  const agenda = useMemo(() => buildAgenda(events, now), [events, now]);
  const monthLabel = now.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const today = events.filter((e) => new Date(e.start).toDateString() === now.toDateString()).length;

  return (
    <div className={`card cal ${className}`}>
      <div className="card-head">
        <div className="card-title">Calendar</div>
        <div className="card-sub">{today} event{today === 1 ? "" : "s"} today</div>
      </div>
      <div className="month">
        <h3>{monthLabel}</h3>
        <div style={{ display: "flex", gap: 2 }}>
          <button className="icon-btn" style={{ width: 26, height: 26, border: 0, background: "transparent", cursor: "pointer", color: "var(--ink-2)" }}><Icon name="chevL" /></button>
          <button className="icon-btn" style={{ width: 26, height: 26, border: 0, background: "transparent", cursor: "pointer", color: "var(--ink-2)" }}><Icon name="chevR" /></button>
        </div>
      </div>
      <div className="mini">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div className="dow" key={"dow" + i}>{d}</div>
        ))}
        {mini.map((d, i) => (
          <div
            key={i}
            className={"d" + (d.off ? " off" : "") + (d.today ? " today" : "") + (d.has ? " has" : "")}
          >
            {d.n}
          </div>
        ))}
      </div>
      {err && <div className="error" style={{ marginTop: 10 }}>calendar: {err}</div>}
      <div className="agenda">
        {agenda.map((day, i) => (
          <div className={"agenda-day" + (day.today ? " today" : "")} key={i}>
            <div className="dcell">
              <div className="num">{day.date}</div>
              <div className="dow">{day.dow}</div>
            </div>
            <div className="evts">
              {day.events.map((e, j) => (
                <div className="evt" key={j}>
                  <div className={"bar c" + e.c} />
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
}
