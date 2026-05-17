import { NextResponse } from "next/server";
import { readdir } from "node:fs/promises";
import { readConfig, dirExists } from "../../lib/config";
import { extractToken, fetchSharedAlbum } from "../../lib/icloudShared";

export const revalidate = 600;

export async function GET() {
  const dir = process.env.PHOTOS_DIR;
  if (dir && (await dirExists(dir))) {
    try {
      const entries = await readdir(dir);
      const photos = entries
        .filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
        .map((f) => ({
          url: `/api/photos/${encodeURIComponent(f)}`,
          title: f.replace(/\.[^.]+$/, ""),
          meta: "From your album",
        }));
      return NextResponse.json({ configured: true, source: "dir", photos });
    } catch (err) {
      return NextResponse.json(
        { configured: true, source: "dir", photos: [], error: (err as Error).message },
        { status: 500 },
      );
    }
  }

  const cfg = await readConfig();
  if (cfg.photosUrl) {
    const token = extractToken(cfg.photosUrl);
    if (!token) {
      return NextResponse.json(
        { configured: true, source: "icloud", photos: [], error: "invalid iCloud URL" },
        { status: 500 },
      );
    }
    try {
      const photos = await fetchSharedAlbum(token);
      return NextResponse.json({ configured: true, source: "icloud", photos });
    } catch (err) {
      return NextResponse.json(
        { configured: true, source: "icloud", photos: [], error: (err as Error).message },
        { status: 502 },
      );
    }
  }

  return NextResponse.json({ configured: false });
}
