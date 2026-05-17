import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import {
  readConfig,
  writeCalendarUrl,
  clearCalendarUrl,
  isValidGoogleIcsUrl,
  maskUrl,
} from "../../lib/config";

export const dynamic = "force-dynamic";

export async function GET() {
  const envUrl = process.env.GOOGLE_CALENDAR_ICS_URL;
  if (envUrl) {
    return NextResponse.json({ configured: true, source: "env", hint: maskUrl(envUrl) });
  }
  const cfg = await readConfig();
  if (cfg.calendarUrl) {
    return NextResponse.json({ configured: true, source: "file", hint: maskUrl(cfg.calendarUrl) });
  }
  return NextResponse.json({ configured: false, source: "none" });
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  const raw = (body as { url?: unknown })?.url;
  const url = typeof raw === "string" ? raw.trim() : "";
  if (!isValidGoogleIcsUrl(url)) {
    return NextResponse.json(
      { error: "Must be an https://calendar.google.com/...ics URL" },
      { status: 400 },
    );
  }
  await writeCalendarUrl(url);
  revalidatePath("/api/calendar");
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  await clearCalendarUrl();
  revalidatePath("/api/calendar");
  return NextResponse.json({ ok: true });
}
