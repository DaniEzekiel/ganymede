import { NextResponse } from "next/server";
import ICAL from "ical.js";

export const revalidate = 300;

export async function GET() {
  const icsUrl = process.env.GOOGLE_CALENDAR_ICS_URL;
  if (!icsUrl) {
    return NextResponse.json({ error: "GOOGLE_CALENDAR_ICS_URL not set" }, { status: 500 });
  }

  try {
    const res = await fetch(icsUrl, { next: { revalidate: 300 } });
    if (!res.ok) throw new Error(`upstream ${res.status}`);
    const text = await res.text();

    const jcal = ICAL.parse(text);
    const comp = new ICAL.Component(jcal);
    const vevents = comp.getAllSubcomponents("vevent");

    const now = ICAL.Time.now();
    const horizon = now.clone();
    horizon.addDuration(ICAL.Duration.fromSeconds(14 * 24 * 3600));

    const occurrences: { start: Date; end: Date; summary: string; location: string }[] = [];

    for (const v of vevents) {
      const event = new ICAL.Event(v);
      if (event.isRecurring()) {
        const iter = event.iterator();
        let next;
        while ((next = iter.next())) {
          if (next.compare(horizon) > 0) break;
          if (next.compare(now) < 0) continue;
          const detail = event.getOccurrenceDetails(next);
          occurrences.push({
            start: detail.startDate.toJSDate(),
            end: detail.endDate.toJSDate(),
            summary: event.summary || "(no title)",
            location: event.location || "",
          });
        }
      } else {
        const start = event.startDate.toJSDate();
        if (start < now.toJSDate() || start > horizon.toJSDate()) continue;
        occurrences.push({
          start,
          end: event.endDate.toJSDate(),
          summary: event.summary || "(no title)",
          location: event.location || "",
        });
      }
    }

    occurrences.sort((a, b) => a.start.getTime() - b.start.getTime());
    return NextResponse.json({ events: occurrences.slice(0, 10) });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }
}
