import { NextResponse } from "next/server";
import { readConfig, maskICloudUrl, maskICloudCalendarUrl, dirExists } from "../../lib/config";

export const dynamic = "force-dynamic";

export async function GET() {
  const cfg = await readConfig();
  const envPhotosDir = process.env.PHOTOS_DIR;
  const envPhotosUsable = envPhotosDir ? await dirExists(envPhotosDir) : false;
  const envAppleCalendar = process.env.APPLE_CALENDAR_ICS_URL;

  const google = cfg.google?.tokens?.refresh_token
    ? { connected: true as const, email: cfg.google.email ?? null }
    : { connected: false as const };

  const appleCalendar = envAppleCalendar
    ? { configured: true as const, source: "env" as const, hint: maskICloudCalendarUrl(envAppleCalendar) }
    : cfg.appleCalendarUrl
    ? { configured: true as const, source: "file" as const, hint: maskICloudCalendarUrl(cfg.appleCalendarUrl) }
    : { configured: false as const, source: "none" as const };

  const photos = envPhotosUsable
    ? { configured: true as const, source: "env" as const, hint: envPhotosDir! }
    : cfg.photosUrl
    ? { configured: true as const, source: "file" as const, hint: maskICloudUrl(cfg.photosUrl) }
    : { configured: false as const, source: "none" as const };

  return NextResponse.json({ google, appleCalendar, photos });
}
