import { NextResponse } from "next/server";
import { readConfig, maskUrl, maskICloudUrl, dirExists } from "../../lib/config";

export const dynamic = "force-dynamic";

export async function GET() {
  const cfg = await readConfig();
  const envCalendar = process.env.GOOGLE_CALENDAR_ICS_URL;
  const envPhotosDir = process.env.PHOTOS_DIR;
  const envPhotosUsable = envPhotosDir ? await dirExists(envPhotosDir) : false;

  const calendar = envCalendar
    ? { configured: true, source: "env" as const, hint: maskUrl(envCalendar) }
    : cfg.calendarUrl
    ? { configured: true, source: "file" as const, hint: maskUrl(cfg.calendarUrl) }
    : { configured: false, source: "none" as const };

  const photos = envPhotosUsable
    ? { configured: true, source: "env" as const, hint: envPhotosDir! }
    : cfg.photosUrl
    ? { configured: true, source: "file" as const, hint: maskICloudUrl(cfg.photosUrl) }
    : { configured: false, source: "none" as const };

  return NextResponse.json({ calendar, photos });
}
