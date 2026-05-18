import { NextResponse } from "next/server";
import ICAL from "ical.js";
import { googleFetch } from "../../lib/google";
import { readConfig } from "../../lib/config";

export const dynamic = "force-dynamic";

type Event = { start: string; end: string; summary: string; location: string };

type GEvent = {
  summary?: string;
  location?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
};
type GEventsList = { items?: GEvent[] };

async function fetchGoogleEvents(now: Date, horizon: Date): Promise<Event[]> {
  const params = new URLSearchParams({
    timeMin: now.toISOString(),
    timeMax: horizon.toISOString(),
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "25",
  });
  const res = await googleFetch(`/calendar/v3/calendars/primary/events?${params}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`google ${res.status}: ${text.slice(0, 120)}`);
  }
  const data = (await res.json()) as GEventsList;
  return (data.items ?? [])
    .map((e) => {
      const startIso = e.start?.dateTime ?? e.start?.date;
      const endIso = e.end?.dateTime ?? e.end?.date;
      if (!startIso || !endIso) return null;
      return {
        start: new Date(startIso).toISOString(),
        end: new Date(endIso).toISOString(),
        summary: e.summary || "(no title)",
        location: e.location || "",
      };
    })
    .filter((e): e is Event => e !== null);
}

async function fetchAppleEvents(url: string, now: Date, horizon: Date): Promise<Event[]> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`apple ${res.status}`);
  const text = await res.text();
  const jcal = ICAL.parse(text);
  const comp = new ICAL.Component(jcal);
  const vevents = comp.getAllSubcomponents("vevent");
  const nowIcal = ICAL.Time.fromJSDate(now, false);
  const horizonIcal = ICAL.Time.fromJSDate(horizon, false);
  const out: Event[] = [];
  for (const v of vevents) {
    const event = new ICAL.Event(v);
    if (event.isRecurring()) {
      const iter = event.iterator();
      let next;
      while ((next = iter.next())) {
        if (next.compare(horizonIcal) > 0) break;
        if (next.compare(nowIcal) < 0) continue;
        const detail = event.getOccurrenceDetails(next);
        out.push({
          start: detail.startDate.toJSDate().toISOString(),
          end: detail.endDate.toJSDate().toISOString(),
          summary: event.summary || "(no title)",
          location: event.location || "",
        });
      }
    } else {
      const start = event.startDate.toJSDate();
      if (start < now || start > horizon) continue;
      out.push({
        start: start.toISOString(),
        end: event.endDate.toJSDate().toISOString(),
        summary: event.summary || "(no title)",
        location: event.location || "",
      });
    }
  }
  return out;
}

export async function GET() {
  const cfg = await readConfig();
  const googleConnected = Boolean(cfg.google?.tokens?.refresh_token);
  const appleUrl = process.env.APPLE_CALENDAR_ICS_URL || cfg.appleCalendarUrl;

  if (!googleConnected && !appleUrl) {
    return NextResponse.json({ configured: false });
  }

  const now = new Date();
  const horizon = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const warnings: string[] = [];
  const all: Event[] = [];

  if (googleConnected) {
    try {
      all.push(...(await fetchGoogleEvents(now, horizon)));
    } catch (e) {
      warnings.push((e as Error).message);
    }
  }
  if (appleUrl) {
    try {
      all.push(...(await fetchAppleEvents(appleUrl, now, horizon)));
    } catch (e) {
      warnings.push((e as Error).message);
    }
  }

  all.sort((a, b) => a.start.localeCompare(b.start));
  const events = all.slice(0, 10);

  return NextResponse.json({
    configured: true,
    events,
    ...(warnings.length ? { warning: warnings.join(" · ") } : {}),
  });
}
