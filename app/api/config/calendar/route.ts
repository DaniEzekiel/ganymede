import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import {
  writeCalendarUrl,
  clearCalendarUrl,
  isValidGoogleIcsUrl,
} from "../../../lib/config";

export const dynamic = "force-dynamic";

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
