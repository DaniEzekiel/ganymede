import { NextResponse } from "next/server";
import { readConfig, maskICloudUrl, dirExists } from "../../lib/config";

export const dynamic = "force-dynamic";

export async function GET() {
  const cfg = await readConfig();
  const envPhotosDir = process.env.PHOTOS_DIR;
  const envPhotosUsable = envPhotosDir ? await dirExists(envPhotosDir) : false;

  const google = cfg.google?.tokens?.refresh_token
    ? { connected: true as const, email: cfg.google.email ?? null }
    : { connected: false as const };

  const photos = envPhotosUsable
    ? { configured: true, source: "env" as const, hint: envPhotosDir! }
    : cfg.photosUrl
    ? { configured: true, source: "file" as const, hint: maskICloudUrl(cfg.photosUrl) }
    : { configured: false, source: "none" as const };

  return NextResponse.json({ google, photos });
}
