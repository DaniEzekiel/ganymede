import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import {
  writeAppleCalendarUrl,
  clearAppleCalendarUrl,
  isValidICloudCalendarUrl,
  normalizeICloudCalendarUrl,
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
  if (!isValidICloudCalendarUrl(url)) {
    return NextResponse.json(
      { error: "Must be a published iCloud calendar URL (webcal:// or https://p…-caldav.icloud.com/published/…)" },
      { status: 400 },
    );
  }
  await writeAppleCalendarUrl(normalizeICloudCalendarUrl(url));
  revalidatePath("/api/calendar");
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  await clearAppleCalendarUrl();
  revalidatePath("/api/calendar");
  return NextResponse.json({ ok: true });
}
