import { NextResponse } from "next/server";
import { readdir } from "node:fs/promises";

export const revalidate = 60;

export async function GET() {
  const dir = process.env.PHOTOS_DIR;
  if (!dir) return NextResponse.json({ photos: [] });

  try {
    const entries = await readdir(dir);
    const photos = entries
      .filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
      .map((f) => `/api/photos/${encodeURIComponent(f)}`);
    return NextResponse.json({ photos });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message, photos: [] }, { status: 500 });
  }
}

