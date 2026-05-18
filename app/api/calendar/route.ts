import { NextResponse } from "next/server";
import { googleFetch } from "../../lib/google";

export const dynamic = "force-dynamic";

type GEvent = {
  summary?: string;
  location?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
};
type GEventsList = { items?: GEvent[] };

export async function GET() {
  try {
    const now = new Date();
    const horizon = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    const params = new URLSearchParams({
      timeMin: now.toISOString(),
      timeMax: horizon.toISOString(),
      singleEvents: "true",
      orderBy: "startTime",
      maxResults: "10",
    });
    const res = await googleFetch(`/calendar/v3/calendars/primary/events?${params}`);
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`upstream ${res.status}: ${text.slice(0, 120)}`);
    }
    const data = (await res.json()) as GEventsList;
    const events = (data.items ?? [])
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
      .filter((e): e is NonNullable<typeof e> => e !== null);
    return NextResponse.json({ configured: true, events });
  } catch (err) {
    const msg = (err as Error).message;
    if (msg === "not_connected") return NextResponse.json({ configured: false });
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
